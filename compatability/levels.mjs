

Hooks.on('ready', ()=> {
  if (!game.modules.get('levels')?.active) {
    return
  }
  
  libWrapper.register('token-lean', 'CONFIG.Levels.handlers.SightHandler.checkCollision', function (token1, token2, type = "sight") {
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
  
  libWrapper.register('token-lean', 'CONFIG.Levels.handlers.SightHandler.advancedLosTestInLos', function (sourceToken, token) {
    const tol = 4;
    if (CONFIG.Levels.settings.get("preciseTokenVisibility") === false)
    return this.checkCollision(sourceToken, token, "sight");
    const targetLOSH = token.losHeight;
    const targetElevation =
    token.document.elevation + (targetLOSH - token.document.elevation) * 0.1;
    const sourceCenter = {
      x: sourceToken.vision.x,
      y: sourceToken.vision.y,
      z: sourceToken.losHeight,
    };
    const tokenCorners = [
      { x: token.center.x, y: token.center.y, z: targetLOSH },
      { x: token.x + tol, y: token.y + tol, z: targetLOSH },
      { x: token.x + token.w - tol, y: token.y + tol, z: targetLOSH },
      { x: token.x + tol, y: token.y + token.h - tol, z: targetLOSH },
      { x: token.x + token.w - tol, y: token.y + token.h - tol, z: targetLOSH },
    ];
    if (CONFIG.Levels.settings.get("exactTokenVisibility")) {
      const exactPoints = [
        {
          x: token.center.x,
          y: token.center.y,
          z: targetElevation + (targetLOSH - targetElevation) / 2,
        },
        { x: token.center.x, y: token.center.y, z: targetElevation },
        { x: token.x + tol, y: token.y + tol, z: targetElevation },
        { x: token.x + token.w - tol, y: token.y + tol, z: targetElevation },
        { x: token.x + tol, y: token.y + token.h - tol, z: targetElevation },
        {
          x: token.x + token.w - tol,
          y: token.y + token.h - tol,
          z: targetElevation,
        },
      ];
      tokenCorners.push(...exactPoints);
    }
    for (let point of tokenCorners) {
      let collision = this.testCollision(
        sourceCenter,
        point,
        "sight",
        sourceToken
        );
        if (!collision) return collision;
      }
      return true;
    }, 'OVERRIDE')
    
  })