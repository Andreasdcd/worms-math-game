# Quick Start Guide - Stream 1

## Start the Game (One Command)
```bash
cd C:\Users\decro\worms-math-game\client && npm start
```

Browser opens automatically at: http://localhost:8080

## What You'll See

### Game Screen
- **Sky blue background** with 5 brown platforms
- **4 colored circles** (players) on different platforms
- **HP bars** above each player
- **Worm names** displayed (random Danish names)

### HUD
- **Top-Left**: "Raket-Robert's Turn" (example)
- **Top-Center**: "Time: 30s"
- **Top-Right**: Player list with HP bars

## Controls

| Key | Action |
|-----|--------|
| ← LEFT ARROW | Move active player left |
| → RIGHT ARROW | Move active player right |
| 🖱️ MOUSE | Aim direction (white arrow) |
| SPACEBAR (hold) | Charge power (0-100%) |
| SPACEBAR (release) | Fire (placeholder - logs to console) |

## What Works Right Now

✅ **Movement**: Active player moves with arrow keys
✅ **Physics**: Players fall and land on platforms
✅ **Turns**: 30-second timer, auto-rotation
✅ **Camera**: Smoothly follows active player
✅ **Aiming**: White arrow tracks mouse
✅ **Power**: Hold spacebar to charge (0-100%)
✅ **HUD**: Real-time updates of timer and HP
✅ **Players**: 4 test players (2 teams)

## What's Placeholder (Coming in Stream 2)

⏳ **Projectile firing**: Currently just logs to console
⏳ **Damage system**: HP can decrease but no damage source yet
⏳ **Explosions**: Not implemented
⏳ **Terrain destruction**: Not implemented

## Testing Checklist

Quick 1-minute test:

1. ✅ Game loads (4 players visible)
2. ✅ Press LEFT/RIGHT arrows (player moves)
3. ✅ Move mouse (white arrow follows)
4. ✅ Hold SPACEBAR (power bar charges)
5. ✅ Release SPACEBAR (console logs "Firing...")
6. ✅ Wait 30 seconds (turn ends, next player)
7. ✅ Camera pans to new player

## File Locations

**Game Code**:
- `src/main.js` - Entry point
- `src/scenes/GameScene.js` - Main game logic
- `src/entities/Player.js` - Player entity
- `src/entities/Terrain.js` - Platform system

**Documentation**:
- `STREAM1_COMPLETE.md` - Full implementation details
- `CONTROLS.md` - Player controls guide
- `ARCHITECTURE.md` - System architecture
- `QUICK_START.md` - This file

## Troubleshooting

**Game doesn't start?**
```bash
# Install dependencies first
npm install

# Then start
npm start
```

**Players fall through platforms?**
- Check console for errors
- Verify Terrain.js loaded (check Network tab)

**Controls don't work?**
- Click on the game canvas to give it focus
- Check that cursors are initialized (console log)

**Browser console errors?**
- Check all scripts loaded in correct order
- Verify constants.js is accessible
- Check for CORS errors (should use http-server)

## Developer Console

Press **F12** to see:
- "GameScene created!"
- "Created 4 test players: [names]"
- Turn changes
- Fire events with power/angle

## Debug Mode

To see physics bodies, edit `src/main.js` line 19:
```javascript
debug: true  // Shows collision shapes
```

## Next Steps

After testing Stream 1:
- **Stream 2**: Implement projectiles and combat
- **Stream 3**: Add multiplayer networking
- **Stream 4**: Integrate math questions

## Performance

Target: **60 FPS** (check with F12 > Performance)

If experiencing lag:
- Close other browser tabs
- Check CPU usage
- Verify GPU acceleration enabled

## Support Files

All documentation in `client/` folder:
- **STREAM1_COMPLETE.md**: 400+ lines of details
- **CONTROLS.md**: Player controls reference
- **ARCHITECTURE.md**: Technical architecture
- **QUICK_START.md**: This guide

---

**Ready to play!** 🎮

Run `npm start` and enjoy testing the foundation!
