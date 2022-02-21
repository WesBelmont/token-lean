

Hooks.on('ready', ()=> {
    if (!game.modules.get('levels')?.active) {
        return
    }
    //maybe a dummy token class would be useful. I don't even really know what a class is though.
    libWrapper.register('token-lean', 'Levels.prototype.checkCollision', (wrapped, token1, token2, type) => {
        if (token1.vision?.active) {
            let dummyToken = {
                center: {
                    x: token1.vision.x,
                    y: token1.vision.y
                },
                data: token1.data,
                vision: token1.vision
            }
            return wrapped(dummyToken, token2, type)
        }
        return wrapped(token1, token2, type)
        
    }, 'WRAPPER')
    
    //--FUTURE LOW PRIORITY-- do I need to check templates? 
    // libWrapper.register('token-lean', 'Levels.prototype.computeTemplates', (wrapped, token) => {
    //     let dummyToken
    //     return wrapped(dummyToken)
    // }, 'WRAPPED')
    
    //I guess some people really do read my code.
    libWrapper.register('token-lean', 'Levels.prototype.advancedLosTestInLos', (wrapped, sourceToken, token) => {
        if (sourceToken.vision?.active) {
            let dummyToken = {
                center: {
                    x: sourceToken.vision.x,
                    y: sourceToken.vision.y
                },
                data: sourceToken.data,
                vision: sourceToken.vision
            }
            return wrapped(dummyToken, token)
            
        }
        return wrapped(sourceToken, token)
    }, 'WRAPPER')
    
    
    libWrapper.register('token-lean', 'Levels.prototype.raycastDebug', function () {
        if (!canvas.tokens.controlled[0]?.vision?.active){
            return
        }
        if (_levels.RAYS && canvas.tokens.controlled[0]) {
            let oldcontainer = canvas.controls.debug.children.find((c) => (c.name = "levelsRAYS"));
            if (oldcontainer) oldcontainer.clear();
            let g = oldcontainer || new PIXI.Graphics();
            g.name = "levelsRAYS";
            let ctk = canvas.tokens.controlled[0];
            canvas.tokens.placeables.forEach((t) => {
                if (this.preciseTokenVisibility === false) {
                    let isCollision = _levels.checkCollision(ctk, t, "sight");
                    let color = isCollision ? 0xff0000 : 0x00ff08;
                    let coords = [ctk.center.x, ctk.center.y, t.center.x, t.center.y];
                    if (ctk != t)
                    g.beginFill(color)
                    .lineStyle(1, color)
                    .drawPolygon(coords)
                    .endFill();
                } else {
                    let targetLOSH = this.getTokenLOSheight(t);
                    let tol = 4;
                    let sourceCenter = {
                        x: ctk.vision.x,
                        y: ctk.vision.y,
                        z: this.getTokenLOSheight(ctk),
                    };
                    let tokenCorners = [
                        { x: t.center.x, y: t.center.y, z: targetLOSH },
                        { x: t.x + tol, y: t.y + tol, z: targetLOSH },
                        { x: t.x + t.w - tol, y: t.y + tol, z: targetLOSH },
                        { x: t.x + tol, y: t.y + t.h - tol, z: targetLOSH },
                        { x: t.x + t.w - tol, y: t.y + t.h - tol, z: targetLOSH },
                    ];
                    for (let point of tokenCorners) {
                        let isCollision = this.testCollision(sourceCenter, point, "sight",t);
                        let color = isCollision ? 0xff0000 : 0x00ff08;
                        let coords = [ctk.vision.x, ctk.vision.y, point.x, point.y];
                        if (ctk != t)
                        g.beginFill(color)
                        .lineStyle(1, color)
                        .drawPolygon(coords)
                        .endFill();
                    }
                }
            });
            if (!oldcontainer) canvas.controls.debug.addChild(g);
        }
    }, 'OVERRIDE')
    
    if (!game.modules.get('perfect-vision')?.active)
    return
    ///Send vision data to 
    libWrapper.register('token-lean', 'Levels.prototype.overrideVisibilityTest', (wrapped, token) => {
        if (token.vision?.active) {
            let dummyToken = {
                centre: {
                    x: token.vision.x,
                    y: token.vision.y
                }
            }
            return wrapped(dummyToken)
        }
        return wrapped(token)
    }, 'WRAPPER')
    
    // libWrapper.register('token-lean', 'ForegroundLayer.prototype._drawOcclusionShapes', function (wrapped, tokens) {
    //     for (const t in tokens) {
    //         if (token.vision?.active) {
    //             tokens[t.index] = {
    //                 center: {
    //                     x: t.vision.x,
    //                     y: t.vision.y
    //                 }, 
    //                 w: t.w,
    //                 h: t.h
    //             }
    //         }
    //     } 
    //     return wrapped(tokens)
    // }, "WRAPPER");
    
    //tokenInRange PV override -- FUTURE --
    
})