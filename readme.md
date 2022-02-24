![](demo/demo.gif)

# Token Lean
Want to look around corners without clicking and dragging your token a bunch? Want to stack up on a door and peek around? Just lean!  
While holding down the lean button (default q), your token's vision and light source are moved towards your mouse.

## Now with live updates!
Other players can now see where you are leaning.

## Configurable Options
- Maximum lean distance. The sky's the limit! (no really, I didn't put a limit on this)
- Disable during combat
- Token image travel. Make it subtle or obvious.

## How it works:
Your token is moved towards the mouse, and an offset is applied to the hud, which includes the icon, border, nameplate, and bars. This gives the appearance of your token moving only a little, but in fact is moving to the point where your vision is.

### Legacy Mode
- The old version is available by enabling legacy mode. This switches over to the old method of only moving the vision, and providing compatability with libWrapper.
- I will try to keep the legacy mode working, as it may be useful in the future if the current system is no good.

## Known Issues:
- bug caused by collision detection on corners. I believe this is a core foundry bug. Requires investigation.
