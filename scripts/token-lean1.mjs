import { getMousePosition, getSourceToken, getLeanLimit, getPointAlongLine, applyPolarTransform, smoothedDistance} from './token-lean-library.mjs'

// export function startLean() {
//     const token = getSourceToken()
//     const origin = token.center
//     const destination = getMousePosition()
//     const limit = getLeanLimit()
//     const delta = {
//         x: destination.x-origin.x,
//         y: destination.y-origin.y
//     }

//     const smoothedDestination = applyPolarTransform(delta, smoothedDistance)
//     const collisionRayLimit = Math.min(limit, Math.hypot(smoothedDestination.x-origin.x, smoothedDestination.y-origin.y))
//     // const collisionRayLimit = Math.min(limit, Math.hypot(mousePosition.x - token.center.x, mousePosition.y - token.center.y))
//     const collisionRay = Ray.towardsPoint(origin, smoothedDestination, collisionRayLimit)
//     // const collisionRay = Ray.towardsPoint(origin, mousePosition, collisionRayLimit)
//     const collision = RadialSweepPolygon.getRayCollisions(collisionRay, {type:'move', mode: 'closest'})
    
//     if (collision) {
//         const endpoint =  getPointAlongLine(origin, {x: collision.x, y: collision.y}, 99/100)
//         updateVisionPosition(token, endpoint)
//         return
//     }
//     updateVisionPosition(token, collisionRay.B)
// }

export function startLegacyLean() {
    const t = getSourceToken()
    const point = getLeanPoint(t.center, getMousePosition())
    updateVisionPosition(t, point)
}

export function endLegacyLean() {
    const t = getSourceToken()
    updateVisionPosition(t, t.center, true )
}

function legacyUpdateVisionPosition(token, newPosition, reset=false) {
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