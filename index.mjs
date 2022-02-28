import { getSourceToken, isLegacy, getTokenOrigin, getLeanLimit, getMousePosition, getPointAlongLine, applyPolarTransform } from './scripts/token-lean-library.mjs'
import './compatibility/index.mjs'

Hooks.once('init', ()=> {
    game.settings.register('token-lean', 'sourceToken', {
        config: false,
        type: String,
        scope: 'client',
        default: 'false'
    })
    
    game.settings.register('token-lean', 'origin', {
        config: false,
        type: Object,
        scope: 'client',
        default: {
            unset: true
        }
    })
    
    game.settings.register('token-lean', 'limit', {
        name: game.i18n.localize('token-lean.Limit.Name'),
        hint: game.i18n.localize('token-lean.Limit.Hint'),
        config: true,
        type: Number,
        scope: 'world',
        default: 0.25,
        onChange: value => {
            game.settings.set('token-lean', 'limit', Math.max(value, -0.5))
        }
    })
    
    game.settings.register('token-lean', 'visual-travel', {
        name: game.i18n.localize('token-lean.VisualTravel.Name'),
        hint: game.i18n.localize('token-lean.VisualTravel.Hint'),
        config: true,
        type: Number,
        scope: 'world',
        default: 0.25,
        range: {
            min: 0,
            max: 0.5,
            step: 0.05
        }
    })
    
    game.settings.register('token-lean', 'mouseSmoothing', {
        name: game.i18n.localize('token-lean.Smoothing.Name'),
        hint: game.i18n.localize('token-lean.Smoothing.Hint'),
        config: true,
        type: Number,
        scope: 'client',
        default: 1,
        range: {
            min: 0,
            max: 3,
            step: 0.25
        }
    })
    
    game.settings.register('token-lean', 'combat-lean', {
        name: game.i18n.localize('token-lean.Combat.Name'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: false,
    })
    
    game.settings.register('token-lean', 'legacy', {
        name: game.i18n.localize('token-lean.LegacyMode.Name'),
        hint: game.i18n.localize('token-lean.LegacyMode.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: false,
        onChange: () => {location.reload()}
    })
    
    game.keybindings.register('token-lean', 'lean', {
        name: game.i18n.localize('token-lean.Keybind.Name'),
        hint: game.i18n.localize('token-lean.Keybind.Hint'),
        editable: [{key: 'KeyQ'}],
        onDown: () => {
            const t = canvas.tokens.controlled[0]
            if (t?.vision?.active === true && (game.users.current.isGM || (!game.paused && (!t.document.inCombat || game.settings.get('token-lean', 'combat-lean'))))) {
                game.settings.set('token-lean', 'sourceToken', t.id)
                if (!isLegacy()) {
                    game.settings.set('token-lean', 'origin', {x: t.center.x, y: t.center.y})
                }                
                debounce(startLean(), 1000)
                document.addEventListener('mousemove', throttledLean)
            }
        },
        onUp: () => {
            if (game.settings.get('token-lean', 'sourceToken') === 'false') return
            document.removeEventListener('mousemove', throttledLean)
            endLean()
        },
        repeat: false
    })
})

Hooks.once('ready', () => {
    //set the offset of a token when leans
    libWrapper.register('token-lean', 'Token.prototype.refresh', function (wrapped, ...args) {
        if (this.document.getFlag('token-lean', 'offsetX') !== undefined || this.document.getFlag('token-lean', 'offsetY') !== undefined) {
            this.hud.pivot.x = this.document.getFlag('token-lean', 'offsetX')
            this.hud.pivot.y = this.document.getFlag('token-lean', 'offsetY')
        }
        return wrapped(...args)
    }, 'WRAPPER')
    
    //disable storing the lean events in the history
    libWrapper.register('token-lean', 'PlaceablesLayer.prototype.storeHistory', function (wrapped, ...args) {
        if (nukeHistory) {
            return undefined
        } else {
            return wrapped(...args)
        }
    }, 'MIXED') 
})

let nukeHistory
Hooks.on('preUpdateToken', (...args) => {
    if (!args[2].lean) {
        nukeHistory = false
    } else {
        nukeHistory = true
    }
})

function startLean() {
    if (!isLegacy()) {
        lean().then(throttled=false)
    } else {
        startLegacyLean()
    }
}

function endLean() {
    if (!isLegacy()) {
        reset().then(throttled=false)
        game.settings.set('token-lean', 'sourceToken', 'false')
    } else {
        endLegacyLean()
    }
}

let throttled
function throttledLean () {
    if (!throttled) {
        throttled = true
        startLean()
        if (isLegacy()){
            setTimeout(()=> {throttled = false}, 1000/game.settings.get('core', 'maxFPS'))
        }
        // setTimeout(()=> {throttled = false}, 1000)
    }
}

let updateThrottled = false
function throttledUpdate(token, updateData, options) {
    if (!updateThrottled) {
        console.log('updating')
        updateThrottled = true
        token.document.update(updateData, options)
        setTimeout(()=> {updateThrottled = false}, 500)
    }
}

async function lean() {
    const t = getSourceToken()
    const origin = getTokenOrigin()
    const leanPoint = getLeanPoint(origin, getMousePosition())
    const offset = getOffset(origin, leanPoint, t)
    
    const updateData = {
        x: leanPoint.x - Math.max(canvas.grid.size/2, t.width/2),
        y: leanPoint.y - Math.max(canvas.grid.size/2, t.height/2),
        flags: {
            'token-lean': {
                'offsetX': offset.x,
                'offsetY': offset.y
            }
        }
    }
    t.document.update(updateData, {animate: false, bypass: false, lean: true})
}

async function reset() {
    const origin = getTokenOrigin()
    const t = getSourceToken()
    const updateData = {
        x: origin.x - Math.max(canvas.grid.size/2, t.width/2),
        y: origin.y - Math.max(canvas.grid.size/2, t.width/2),
        flags: {
            'token-lean': {
                'offsetX': 0,
                'offsetY': 0
            }
        }
    }
    t.document.update(updateData, {animate: false, bypass: false, lean: true})
}

function getLeanPoint(origin, destination) {
    const limit = getLeanLimit()
    const deltaX = destination.x-origin.x
    const deltaY = destination.y-origin.y
    
    const smoothedDestination = applyPolarTransform({x: deltaX, y: deltaY}, smoothedDistance)
    const collisionRayLimit = Math.min(limit, Math.hypot(smoothedDestination.x, smoothedDestination.y))
    const collisionRay = Ray.towardsPoint(origin, {x: smoothedDestination.x+origin.x, y: smoothedDestination.y+origin.y}, collisionRayLimit)
    const collision = RadialSweepPolygon.getRayCollisions(collisionRay, {type:'move', mode: 'closest'})
    
    if (collision) {
        return getPointAlongLine(origin, {x: collision.x, y: collision.y}, 99/100)
    }
    
    return collisionRay.B
}

function getOffset(origin, destination) {
    const point = {x: destination.x-origin.x, y: destination.y-origin.y}
    const iconTravel = game.settings.get('token-lean', 'visual-travel')
    const polarResult = applyPolarTransform(point, (r)=>{
        if (isLegacy()) {
            return r*iconTravel
        }
        return r*(1-iconTravel)
    })
    return polarResult
}

function smoothedDistance(distance) {
    const grid = canvas.grid.size
    const limit = getLeanLimit()
    const drag = game.settings.get('token-lean', 'mouseSmoothing')*grid+limit
    //return if max value
    if (distance >= drag) return limit
    const coefficient = limit/Math.pow(drag, 2)
    return (-coefficient*Math.pow(Math.abs(distance)-drag, 2)+limit)
}

function startLegacyLean() {
    const t = getSourceToken()
    const point = getLeanPoint(t.center, getMousePosition())
    legacyUpdateVisionPosition(t, point)
}

function endLegacyLean() {
    const t = getSourceToken()
    legacyUpdateVisionPosition(t, t.center, true )
}

async function legacyUpdateVisionPosition(token, newPosition, reset=false) {
    const sourceId = token.sourceId
    const isVisionSource = token._isVisionSource()
    let offset
    
    if ( isVisionSource && !reset ) {
        
        let visionData = token.vision.data
        visionData.x = newPosition.x
        visionData.y = newPosition.y
        token.vision.initialize(visionData)
        
        let lightData = token.light.data
        lightData.x = newPosition.x
        lightData.y = newPosition.y
        token.light.initialize(lightData)
        
        offset = getOffset(token.center, newPosition)
        
        token.hud.pivot.x = -offset.x
        token.hud.pivot.y = -offset.y
        
    } else {
        let visionData = token.vision.data
        visionData.x = token.center.x
        visionData.y = token.center.y
        token.vision.initialize(visionData)
        
        let lightData = token.light.data
        lightData.x = token.center.x
        lightData.y = token.center.y
        token.light.initialize(lightData)
        offset = {x:0,y:0}
    }
    const updateData = {
        flags: {
            'token-lean': {
                'offsetX': -offset.x,
                'offsetY': -offset.y
            }
        }
    }
    canvas.perception.schedule({
        sight: {refresh: true},
        lighting: {refresh: true}
    })
    throttledUpdate(token, updateData, {animate: false, bypass: false, lean: true})
}