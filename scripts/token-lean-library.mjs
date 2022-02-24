export function getMousePosition() {
    return canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.app.stage)
}

export function getSourceToken() {
    return canvas.tokens.get(game.settings.get('token-lean', 'sourceToken'))
}

export function getLeanLimit() {
    return canvas.grid.size*(game.settings.get('token-lean', 'limit')+0.5)
}

export function getTokenOrigin() {
    return game.settings.get('token-lean', 'origin')
}

export function getPointAlongLine(origin, collision, percentage=0.99) {
    return {
        x : origin.x * (1.0 - percentage) + collision.x * percentage,
        y : origin.y * (1.0 - percentage) + collision.y * percentage
    };
}

export function isLegacy() {
    return game.settings.get('token-lean', 'legacy')
}

function cart2polar(point) {
    return {
        radius: Math.hypot(point.x, point.y),
        theta: Math.atan2(point.y, point.x)
    }
}

function polar2cart(polar) {
    return {
        x: (polar.radius * Math.cos(polar.theta)),
        y: (polar.radius * Math.sin(polar.theta))
    }
}

export function applyPolarTransform(point, transformFunction) {
    const polar = cart2polar({x: point.x, y: point.y})
    polar.radius = transformFunction(polar.radius)
    const cart = polar2cart(polar)
    return cart
}