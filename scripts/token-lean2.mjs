import {getSourceToken, getTokenOrigin, getLeanLimit, getMousePosition, getPointAlongLine, applyPolarTransform, smoothedDistance } from './token-lean-library.mjs'

export function lean() {
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

export function reset() {
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
        return r*(1-iconTravel)
    })
    return polarResult
}

