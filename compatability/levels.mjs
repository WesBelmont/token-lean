

Hooks.on('ready', ()=> {
    if (!game.modules.get('levels')?.active) {
        return
    }

    libWrapper.register('token-lean', 'Levels.prototype.checkCollision', function (token1, token2, type = "sight") {
      const token1LosH = token1.losHeight;
      const token2LosH = token2.losHeight;
      let p0
      if (token1?.vision?.active) {
        p0 = {
          x: token1.vision.x,
          y: token1.vision.y,
          z: token1LosH,
        };
      } else {
        p0 = {
          x: token1.center.x,
          y: token1.center.y,
          z: token1LosH,
        };
      }
      const p1 = {
        x: token2.center.x,
        y: token2.center.y,
        z: token2LosH,
      };
      return this.testCollision(p0, p1, type, token1);
    }, 'OVERRIDE')
    
    libWrapper.register('token-lean', 'Levels.prototype.advancedLosTestInLos', function (sourceToken, token) {
      const tol = 4;
      if (this.preciseTokenVisibility === false)
        return this.checkCollision(sourceToken, token, "sight");
      const targetLOSH = token.losHeight;
      let sourceCenter
      if (sourceToken?.vision?.active) {
        sourceCenter = {
          x: sourceToken.vision.x,
          y: sourceToken.vision.y,
          z: sourceToken.losHeight,
        };
      } else {
        sourceCenter = {
          x: sourceToken.center.x,
          y: sourceToken.center.y,
          z: sourceToken.losHeight,
        };
      }
      const tokenCorners = [
        { x: token.center.x, y: token.center.y, z: targetLOSH },
        { x: token.x + tol, y: token.y + tol, z: targetLOSH },
        { x: token.x + token.w - tol, y: token.y + tol, z: targetLOSH },
        { x: token.x + tol, y: token.y + token.h - tol, z: targetLOSH },
        { x: token.x + token.w - tol, y: token.y + token.h - tol, z: targetLOSH },
      ];
      for (let point of tokenCorners) {
        let collision = this.testCollision(sourceCenter, point, "sight",sourceToken);
        if (!collision) return collision;
      }
      return true;
    }, 'OVERRIDE')
    
    
    libWrapper.register('token-lean', 'Levels.prototype.raycastDebug', function () {
        if (_levels.RAYS && canvas.tokens.controlled[0]) {
          let oldcontainer = canvas.controls.debug.children.find(
            (c) => (c.name = "levelsRAYS")
          );
          if (oldcontainer) oldcontainer.clear();
          let g = oldcontainer || new PIXI.Graphics();
          g.name = "levelsRAYS";
          let ctk = canvas.tokens.controlled[0];
          canvas.tokens.placeables.forEach((t) => {
            if (this.preciseTokenVisibility === false) {
              let isCollision = _levels.checkCollision(ctk, t, "sight");
              let color = isCollision ? 0xff0000 : 0x00ff08;
              let coords
              if (ctk?.vision?.active) {
                coords = [ctk.vision.x, ctk.vision.y, t.center.x, t.center.y];
              } else {
                coords = [ctk.center.x, ctk.center.y, t.center.x, t.center.y];
              }
              if (ctk != t)
                g.beginFill(color)
                  .lineStyle(1, color)
                  .drawPolygon(coords)
                  .endFill();
            } else {
              let targetLOSH = t.losHeight;
              let tol = 4;
              let sourceCenter = {}
              if (ctk?.vision?.active) {
                sourceCenter = {
                  x: ctk.vision.x,
                  y: ctk.vision.y,
                  z: ctk.losHeight,
                };
              } else {
              sourceCenter = {
                x: ctk.center.x,
                y: ctk.center.y,
                z: ctk.losHeight,
              };
            }
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
                let coords = [sourceCenter.x, sourceCenter.y, point.x, point.y];
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
    
})