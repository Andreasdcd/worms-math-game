# QUICKSTART: Combat System Testing

## Immediate Testing (30 seconds)

### 1. Open the Game
Open `C:\Users\decro\worms-math-game\client\index.html` in your browser

### 2. Controls
- **LEFT/RIGHT Arrow Keys** - Move active player
- **Mouse** - Aim (white arrow shows direction)
- **HOLD SPACEBAR** - Charge power (bar fills up)
- **RELEASE SPACEBAR** - Fire bazooka

### 3. What to Expect
1. 4 colored worms spawn on platforms
2. Red vs Blue teams (2v2)
3. 30-second turn timer counts down
4. Aim with mouse → white arrow appears
5. Hold SPACE → power bar fills (green→yellow→red)
6. Release → RED PROJECTILE launches with white trail
7. Camera follows projectile smoothly
8. **BOOM!** Orange/red explosion with particles
9. Players in radius flash RED and take damage
10. HP bars update immediately
11. Turn switches to next player

### 4. Win the Game
Eliminate all players on one team → Victory screen appears!

---

## Visual Guide

```
┌─────────────────────────────────────────┐
│  Raket-Robert's Turn     Time: 25s      │
│                                          │
│         🎯 ← Aim Arrow                   │
│        ●  ← Active Player (white border)│
│                                          │
│    ●                  ●                  │
│   Enemy             Enemy                │
│                                          │
│  Power: 75%  [███████████░░░]           │
└─────────────────────────────────────────┘

Press SPACE → Hold → Release → 🚀 FIRE!
```

---

## Expected Combat Flow

```
TURN 1: Raket-Robert (Red Team)
├─ Move right to edge of platform
├─ Aim at Bomber-Bjarne (Blue Team)
├─ Charge 80% power
└─ Fire!
    ├─ Projectile arcs through air
    ├─ Camera tracks projectile
    ├─ Hits near Bomber-Bjarne
    └─ EXPLOSION! 💥
        ├─ Bomber-Bjarne takes 28 damage (93%)
        ├─ Granat-Grete takes 10 damage (33%)
        └─ Both flash red and get knocked back

TURN 2: Bomber-Bjarne (Blue Team)
├─ HP: 72/100 (damaged from previous explosion)
├─ Aim at Raket-Robert
└─ ... combat continues
```

---

## Console Output

Open browser console (F12) to see combat details:

```
Created 4 test players: ['Raket-Robert', 'Bomber-Bjarne', 'Granat-Grete', 'Missile-Morten']
Raket-Robert firing with power: 80%, angle: -35.5°
Projectile collision detected!
Bomber-Bjarne took 28 damage (93%)
Granat-Grete took 10 damage (33%)
Turn ended for Raket-Robert
```

---

## Victory Screen

When only one team remains alive:

```
╔═══════════════════════════════════════╗
║           🏆 VICTORY! 🏆              ║
║         Raket-Robert Wins!            ║
║             Team 1 (Red)              ║
║                                       ║
║        Match Statistics               ║
║  Player          Damage Dealt  HP     ║
║  Raket-Robert         65       45     ║
║  Bomber-Bjarne        30       0      ║
║  Granat-Grete         20       0      ║
║  Missile-Morten       40       0      ║
║                                       ║
║      [ 🔄 Play Again ]                ║
╚═══════════════════════════════════════╝
     🎊 🎉 🎊 🎉 (confetti falls)
```

---

## Damage Examples

### Direct Hit (0-20 pixels away)
- Base Damage: 30
- Distance: 10 pixels
- Falloff: 1 - (10/80) = 87.5%
- **Actual Damage: 26 HP**

### Splash Damage (40 pixels away)
- Base Damage: 30
- Distance: 40 pixels
- Falloff: 1 - (40/80) = 50%
- **Actual Damage: 15 HP**

### Edge of Blast (70 pixels away)
- Base Damage: 30
- Distance: 70 pixels
- Falloff: 1 - (70/80) = 12.5%
- **Actual Damage: 3 HP**

### Outside Radius (90 pixels away)
- **No Damage** (outside 80px radius)

---

## Fall Damage

If explosion knocks player off platform:

```
Player falls from explosion
    ↓
Velocity increases as they fall
    ↓
Velocity reaches 15 (over threshold of 10)
    ↓
Player hits ground
    ↓
Fall Damage Calculated:
  percent = (15 - 10) / 20 = 0.25
  damage = 0.25 × 20 = 5 HP
    ↓
Player takes 5 fall damage
```

---

## Troubleshooting

### "Nothing happens when I press SPACE"
- Make sure you're **holding** SPACEBAR (not just tapping)
- Power bar should appear at bottom of screen

### "Projectile doesn't move"
- Check that power is charged (> 0%)
- Check console for errors

### "No explosion appears"
- Projectile must hit something (terrain or player)
- Watch console for "Projectile collision detected!"

### "Players don't take damage"
- Players must be within 80 pixels of explosion center
- Check HP bars - they update immediately

### "Game doesn't end"
- All players on all-but-one team must be dead (HP = 0)
- Dead players appear grayed out

---

## Files You Can Inspect

### Core Combat Files
- `client/src/entities/Projectile.js` - Projectile physics
- `client/src/entities/Explosion.js` - Explosion and damage
- `client/src/scenes/VictoryScene.js` - Win screen

### Updated Files
- `client/src/scenes/GameScene.js` - Collision detection
- `client/src/entities/Player.js` - Fall damage

### Documentation
- `COMBAT_TESTING.md` - Full testing guide
- `STREAM_2_SUMMARY.md` - Implementation details

---

## Next Steps After Testing

1. **Read** `COMBAT_TESTING.md` for detailed test scenarios
2. **Review** `STREAM_2_SUMMARY.md` for implementation details
3. **Experiment** with different angles and powers
4. **Try** to win a match (eliminate one team)
5. **Check** victory screen stats

---

## 5-Minute Combat Demo

### Minute 1: Setup
- Open index.html
- Observe 4 spawned players
- Note team colors (Red vs Blue)

### Minute 2: First Shot
- Use LEFT/RIGHT to position
- Aim at enemy player
- Hold SPACE to charge 50%
- Release and watch projectile fly

### Minute 3: Direct Hit Practice
- Aim directly at enemy
- Charge 70-80% power
- Try to hit dead-on for max damage
- Note explosion radius and damage falloff

### Minute 4: Strategic Combat
- Try bouncing shots off terrain
- Experiment with high-arc shots
- Test knockback by hitting edge of platform
- Watch fall damage when players are knocked off

### Minute 5: Win the Game
- Focus fire on one team
- Eliminate all players on that team
- Watch victory screen appear
- Check match statistics
- Click "Play Again"

---

## Success Metrics

After 5 minutes of testing, you should have:

✓ Fired at least 3 projectiles
✓ Seen at least 3 explosions
✓ Damaged at least 2 players
✓ Knocked at least 1 player off a platform
✓ Triggered fall damage at least once
✓ Killed at least 1 player (HP = 0)
✓ Seen the victory screen
✓ Understood the combat system

---

## Combat is READY! 🚀

The physics and combat system is fully functional and ready for:
- Stream 3: Math questions integration
- Stream 4: Multiplayer networking
- Stream 7: Rating system
- Stream 8: Additional weapons

**Have fun blowing up worms with math! 💥🎯**
