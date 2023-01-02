const MODULE_NAME = 'token-lean'

let wait = false
let rate = 30

Hooks.on('init', ()=> {
    game.settings.register(MODULE_NAME, 'leaningToken', {
        config: false,
        type: String,
        scope: 'client'
    })
    
    
    game.settings.register(MODULE_NAME, 'limit', {
        name: game.i18n.localize('token-lean.Limit.Name'),
        hint: game.i18n.localize('token-lean.Limit.Hint'),
        config: true,
        type: Number,
        scope: 'world',
        default: 0.25,
        onChange: value => {
            game.settings.set(MODULE_NAME, 'limit', Math.max(value, -0.5))
        }
    })
    
    game.settings.register(MODULE_NAME, 'leanWhilePaused', {
        name: game.i18n.localize('token-lean.leanWhilePaused.Name'),
        hint: game.i18n.localize('token-lean.leanWhilePaused.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: false
    })
    
    game.settings.register(MODULE_NAME, 'canLeanInCombat', {
        name: game.i18n.localize('token-lean.canLeanInCombat.Name'),
        hint: game.i18n.localize('token-lean.canLeanInCombat.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: true
    })
    
    game.settings.register(MODULE_NAME, 'combatLeanToggle', {
        name: game.i18n.localize('token-lean.combatLeanToggle.Name'),
        hint: game.i18n.localize('token-lean.combatLeanToggle.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: true
    })
    
    game.settings.register(MODULE_NAME, 'notifyOnLean', {
        name: game.i18n.localize('token-lean.notifyOnLean.Name'),
        hint: game.i18n.localize('token-lean.notifyOnLean.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: true
    })
    
    game.settings.register(MODULE_NAME, 'notifyInCombatOnly', {
        name: game.i18n.localize('token-lean.notifyInCombatOnly.Name'),
        hint: game.i18n.localize('token-lean.notifyInCombatOnly.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: false
    })
    
    game.settings.register(MODULE_NAME, 'playSound', {
        name: game.i18n.localize('token-lean.playSound.Name'),
        hint: game.i18n.localize('token-lean.playSound.Hint'),
        config: true,
        type: Boolean,
        scope: 'world',
        default: true
    })
    
    game.settings.register(MODULE_NAME, 'notifySound', {
        name: game.i18n.localize('token-lean.notifySound.Name'),
        hint: game.i18n.localize('token-lean.notifySound.Hint'),
        config: true,
        filePicker: 'audio',
        scope: "world",
        default: "modules/token-lean/audio/leanSound.ogg"
    })
    
    game.keybindings.register(MODULE_NAME, 'lean', {
        name: 'Lean',
        hint: 'Press to move your vision towards the mouse cursor.',
        editable: [{key: 'KeyQ'}],
        onDown: () => {
            if (selectedTokenHasVision() && canLeanInCombat() && canLeanWhilePaused()) {
                game.settings.set(MODULE_NAME, 'leaningToken', canvas.tokens.controlled[0].id)
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

Hooks.on("getSceneControlButtons", (controls) => {
    //only render for gm
    if (game.user.isGM) {
        if (game.settings.get(MODULE_NAME, 'combatLeanToggle')) {
            const toggle = {
                name: 'enableCombatLean',
                title: game.i18n.localize('token-lean.canLeanInCombat.Name'),
                icon: 'fas fa-face-hand-peeking',
                toggle: true,
                active: game.settings.get(MODULE_NAME, 'canLeanInCombat'),
                onClick: (toggle) => {
                    let newState = !game.settings.get(MODULE_NAME, 'canLeanInCombat')
                    game.settings.set(MODULE_NAME, 'canLeanInCombat', newState)
                }
            }
            controls.find((c) => c.name == 'token').tools.push(toggle)
        }
    }
})

function selectedTokenHasVision() {
    return canvas.tokens.controlled[0]?.vision?.active === true
}

function canLeanWhilePaused() {
    if (game.paused && !game.settings.get(MODULE_NAME, 'leanWhilePaused')) return false
    return true
}

function canLeanInCombat() {
    if (game.combat?.started && !game.settings.get(MODULE_NAME, 'canLeanInCombat')) return false
    return true
}

function notify() {
    if (!game.combat?.started && game.settings.get(MODULE_NAME, 'notifyInCombatOnly')) return false
    ChatMessage.create({
        whisper: ChatMessage.getWhisperRecipients('GM'),
        content: `I'm leaning`,
        speaker: ChatMessage.getSpeaker(),
        sound: game.settings.get(MODULE_NAME, 'playSound') ? game.settings.get(MODULE_NAME, 'notifySound') : null
    })
    return true
}

function enableLean(enable) {
    if (enable) {
        if (game.settings.get(MODULE_NAME, 'notifyOnLean')) {
            notify()
        }
        leanTowardsMouse()
        document.addEventListener('mousemove', updateOnMouseMove)
    } else {
        let token = canvas.tokens.get(game.settings.get(MODULE_NAME, 'leaningToken'))
        updateVisionPosition(token, token.getMovementAdjustedPoint(token.center), true)
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
    const token = canvas.tokens.get(game.settings.get(MODULE_NAME, 'leaningToken'))
    const mousePosition = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage)
    const limit = canvas.grid.size*(0.5+game.settings.get(MODULE_NAME, 'limit'))
    const origin = token.getMovementAdjustedPoint(token.center)
    const collisionRayLimit = Math.min(limit, Math.hypot(mousePosition.x - token.center.x, mousePosition.y - token.center.y))
    const collisionRay = Ray.towardsPoint(origin, mousePosition, collisionRayLimit)
    //block leaningToken through impassable terrain walls
    const collision = ClockwiseSweepPolygon.testCollision(collisionRay.A, collisionRay.B, {type:'move', mode: 'closest'})
    
    if (!collision) {
        updateVisionPosition(token, collisionRay.B)
        return
    }
    else {
        // debug to show collisions on canvas
        // g.beginFill(window.color)
        // g.drawCircle(collision.x, collision.y, 1)
        // g.endFill()
        // canvas.app.stage.addChild(g)
    }
    
}

function updateVisionPosition(token, newPosition=null, reset=false) {
    const isVisionSource = token._isVisionSource()
    const origin = token.getMovementAdjustedPoint(token.center)
    
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
        visionData.x = origin.x
        visionData.y = origin.y
        token.vision.initialize(visionData)
        
        let lightData = token.light.data
        lightData.x = origin.x
        lightData.y = origin.y
        token.light.initialize(lightData)
    }
    canvas.perception.update({
        refreshVision: true,
        refreshLighting: true
    }, true);
}