const MODULE_NAME = 'token-lean'

let wait = false
let rate = 30
// const g = new PIXI.Graphics()
// window.color = (0x00ff00)

Hooks.on('init', ()=> {
    game.settings.register(MODULE_NAME, 'leaning', {
        config: false,
        type: String,
        scope: 'client'
    })
    
    game.settings.register(MODULE_NAME, 'limit', {
        name: game.i18n.localize('q-to-lean.Limit.Name'),
        hint: game.i18n.localize('q-to-lean.Limit.Hint'),
        config: true,
        type: Number,
        scope: 'world',
        default: 0.25,
        onChange: value => {
            game.settings.set(MODULE_NAME, 'limit', Math.max(value, -0.5))
        }
    })
    
    game.keybindings.register(MODULE_NAME, 'lean', {
        name: 'Lean',
        hint: 'Press to move your vision towards the mouse cursor.',
        editable: [{key: 'KeyQ'}],
        onDown: () => {
            if (canvas.tokens.controlled.length > 0) {
                game.settings.set(MODULE_NAME, 'leaning', canvas.tokens.controlled[0].id)
                enableLean(true)
            }
        },
        onUp: () => {
            enableLean(false)
        },
        repeat: false
    })
})

Hooks.on('ready', ()=>{
    rate = game.settings.get('core', 'maxFPS')
})

function enableLean(enable) {
    if (enable) {
        leanTowardsMouse()
        document.addEventListener('mousemove', updateOnMouseMove)
    } else {
        let token = canvas.tokens.get(game.settings.get(MODULE_NAME, 'leaning'))
        updateVisionPosition(token, token.center, true)
        document.removeEventListener('mousemove', updateOnMouseMove)
        
    }
}

function updateOnMouseMove() {
    if (!wait) {
        wait = true
        setTimeout(()=> {wait = false}, 1000/rate)
        leanTowardsMouse()
    }
}

function leanTowardsMouse() {
    const token = canvas.tokens.get(game.settings.get(MODULE_NAME, 'leaning'))
    const mousePosition = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage)
    const limit = canvas.grid.size*(0.5+game.settings.get(MODULE_NAME, 'limit'))
    const origin = token.center
    const collisionRayLimit = Math.min(limit, Math.hypot(mousePosition.x - token.center.x, mousePosition.y - token.center.y))
    const collisionRay = Ray.towardsPoint(origin, mousePosition, collisionRayLimit)
    //block leaning through impassable terrain walls
    const collision = RadialSweepPolygon.getRayCollisions(collisionRay, {type:'move', mode: 'closest'})
    
    if (!collision) {
        //set the position to the end of the ray
        updateVisionPosition(token, collisionRay.B)
        return
    } 
    else {
        // debug to show collisions on canvas
        // g.beginFill(window.color)
        // g.drawCircle(collision.x, collision.y, 1)
        // g.endFill()
        // canvas.app.stage.addChild(g)

        // CURRENTLY BROKEN
        // //adjust vision to be on the near side of the collision
        // const distance = Math.hypot(collision.x-origin.x, collision.y-origin.y)
        // const ratio = (distance-1)/distance
        // const position = {
        //     x: origin.x + (collision.x - origin.x)*ratio,
        //     y: origin.y + (collision.y - origin.y)*ratio
        // }
        // updateVisionPosition(token, position)
    }
    
}

function updateVisionPosition(token, newPosition=null, reset=false) {
    const sourceId = token.sourceId
    const isVisionSource = token._isVisionSource()
    
    if ( isVisionSource && !reset ) {
        
        let visionData = token.vision.data
        visionData.x = newPosition.x
        visionData.y = newPosition.y
        token.vision.initialize(visionData)
        
        let lightData = token.light.data
        lightData.x = newPosition.x
        lightData.y = newPosition.y
        token.light.initialize(lightData)
    } else {
        let visionData = token.vision.data
        visionData.x = token.center.x
        visionData.y = token.center.y
        token.vision.initialize(visionData)
        
        let lightData = token.light.data
        lightData.x = token.center.x
        lightData.y = token.center.y
        token.light.initialize(lightData)
    }
    canvas.perception.schedule({
        sight: {refresh: true},
        lighting: {refresh: true}
    })
}