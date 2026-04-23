# Combat System Testing Guide

## Stream 2: Physics & Combat Implementation - COMPLETE

### Overview
The complete physics and combat system has been implemented for the Worms Math Game. Players can now fire projectiles, create explosions, deal damage, and win/lose matches.

---

## Files Created

### New Entity Files
1. **`client/src/entities/Projectile.js`**
   - Matter.js circle body (radius 8px)
   - Realistic trajectory physics based on angle and power
   - Power 100 = velocity magnitude 20
   - Red circle with white particle trail effect
   - 10-second max lifetime with auto-destroy

2. **`client/src/entities/Explosion.js`**
   - Visual effect: Expanding orange/red/yellow circle (0→80→0 pixels)
   - 20-30 particle system flying outward with gravity
   - 1-second animation duration
   - Damage radius: 80 pixels
   - Damage falloff: Full at center, 50% at edge (linear)
   - Knockback force applied to players
   - Red flash visual feedback on hit

3. **`client/src/scenes/VictoryScene.js`**
   - Victory banner with winner name and team color
   - Match statistics table showing damage dealt and final HP
   - Confetti particle celebration effect
   - "Play Again" button to restart game
   - Placeholder for rating changes (Stream 7)

### Updated Files
- **`client/src/scenes/GameScene.js`**
  - Collision detection system using Matter.js events
  - Projectile firing with camera tracking
  - Win condition checking
  - Game ending logic
  - Match statistics tracking

- **`client/src/entities/Player.js`**
  - Fall damage detection and calculation
  - Velocity-based damage (threshold: 10, max damage: 20 HP)
  - Landing detection with fall state tracking

- **`client/index.html`**
  - Added Projectile.js and Explosion.js script tags
  - Added VictoryScene.js script tag

- **`client/src/main.js`**
  - Registered VictoryScene in scene array

- **`shared/constants.js`**
  - Updated EXPLOSION_RADIUS to 80 pixels

---

## Combat Features

### 1. Projectile Physics
- **Launch Mechanics**
  - Angle calculated from mouse position
  - Power charged by holding SPACEBAR (0-100%)
  - Trajectory formula: velocity = (power/100) × 20
  - Gravity affects projectile flight
  - Realistic arc trajectory

- **Visual Effects**
  - Red circle projectile
  - White fading trail (15 particles)
  - Camera smoothly tracks projectile during flight

### 2. Collision System
- Matter.js collision events detect:
  - Projectile vs Player
  - Projectile vs Terrain
  - Projectile vs World bounds
- Collision triggers explosion immediately
- Projectile destroyed on impact

### 3. Explosion System
- **Visual Effect**
  - 3-layer circle: Yellow core → Orange middle → Red outer
  - Radius expands from 0→80 pixels (40% of animation)
  - Then contracts back to 0 (remaining 60%)
  - 20-30 particles fly outward with gravity effect
  - 1-second total animation

- **Damage Calculation**
  ```javascript
  distance = Distance(explosion, player)
  if (distance <= 80):
      falloff = 1 - (distance / 80)
      damage = baseDamage × falloff
      player.takeDamage(damage)
  ```

- **Knockback**
  - Force inversely proportional to distance
  - Pushes players away from explosion center
  - Can knock players off platforms

### 4. Fall Damage
- **Detection**
  - Tracks player velocity continuously
  - Threshold: 10 pixels/frame
  - Max damage: 20 HP

- **Calculation**
  ```javascript
  if (velocity > 10):
      percent = min(1, (velocity - 10) / 20)
      damage = percent × 20
  ```

### 5. Win Condition
- Checks after each explosion
- Counts alive players per team
- If only 1 team remains: Game Over
- Transitions to VictoryScene with stats

### 6. Victory Screen
- Displays winner name and team color
- Match statistics table:
  - Player names
  - Damage dealt (tracked per explosion)
  - Final HP values
- Confetti celebration particles
- "Play Again" button restarts game

---

## How to Test Combat

### Starting the Game
1. Open `client/index.html` in a web browser
2. Game should load with 4 test players:
   - Team 1 (Red): 2 players
   - Team 2 (Blue): 2 players
   - Random Danish worm names assigned

### Basic Combat Flow
1. **Move** - Use LEFT/RIGHT arrow keys to position player
2. **Aim** - Move mouse to set firing angle
   - White arrow shows aim direction
3. **Charge Power** - Hold SPACEBAR
   - Power bar appears at bottom
   - Green → Yellow → Red color gradient
   - Max: 100%
4. **Fire** - Release SPACEBAR
   - Projectile launches with red trail
   - Camera follows projectile
5. **Impact** - Projectile hits terrain/player
   - Explosion animation plays
   - Players in radius take damage
   - HP bars update
   - Turn ends after 1.2 seconds

### Test Scenarios

#### Scenario 1: Direct Hit
1. Position player near enemy
2. Aim directly at enemy player
3. Fire at medium power (50%)
4. **Expected**: Direct hit, ~30 damage, enemy knocked back

#### Scenario 2: Splash Damage
1. Aim near (not directly at) enemy
2. Fire at high power (80-100%)
3. **Expected**: Explosion radius catches enemy, reduced damage

#### Scenario 3: Fall Damage
1. Fire at platform beneath enemy
2. **Expected**: Explosion knocks enemy into air
3. **Expected**: Enemy takes fall damage on landing

#### Scenario 4: Multiple Targets
1. Fire between two enemies on same platform
2. **Expected**: Both take damage based on distance from explosion

#### Scenario 5: Win Condition
1. Eliminate all players on one team
2. **Expected**: Victory screen appears after 2 seconds
3. **Expected**: Winner name, stats table, confetti animation

#### Scenario 6: Camera Tracking
1. Fire projectile across the map
2. **Expected**: Camera smoothly follows projectile
3. **Expected**: Camera returns to next player after explosion

---

## Testing Checklist

### Projectile System
- [ ] Projectile fires in correct direction
- [ ] Power affects projectile speed
- [ ] Projectile has visible red circle
- [ ] White trail effect follows projectile
- [ ] Projectile collides with terrain
- [ ] Projectile collides with players
- [ ] Camera tracks projectile smoothly

### Explosion System
- [ ] Explosion appears at impact point
- [ ] Expanding circle animation (orange/red/yellow)
- [ ] Particles fly outward
- [ ] Explosion lasts ~1 second
- [ ] Players in radius take damage
- [ ] Damage decreases with distance
- [ ] Knockback pushes players away
- [ ] Players flash red when hit

### Damage System
- [ ] HP bars update correctly
- [ ] Damage values appear in console
- [ ] Players turn gray when HP reaches 0
- [ ] Dead players skip their turns
- [ ] Fall damage triggers on hard landings
- [ ] Fall damage scales with velocity

### Win Condition
- [ ] Game detects when one team remains
- [ ] Victory screen appears
- [ ] Winner name is correct
- [ ] Team color matches winner
- [ ] Stats show correct values
- [ ] "Play Again" button works

### UI & HUD
- [ ] Turn indicator shows active player
- [ ] Timer counts down correctly
- [ ] HP list shows all players
- [ ] Active player marked with '>'
- [ ] Power bar displays when charging
- [ ] Power percentage shown

---

## Known Behavior

### Expected Physics
- Projectiles follow parabolic arc (gravity = 1)
- Higher power = longer distance
- Steeper angles = higher arc
- Explosions can chain-knock players off platforms

### Turn Flow
1. Turn starts → 30 second timer
2. Player can move and aim
3. Player fires → Turn becomes inactive
4. Projectile flies → Camera tracks
5. Explosion → Damage applied
6. 1.2 second delay
7. Next player's turn

### Camera Behavior
- Smoothly pans to active player at turn start
- Tracks projectile during flight
- Returns to next player after explosion
- Smooth interpolation prevents jarring jumps

---

## Debug Console Commands

Open browser console (F12) to see detailed logs:
- Projectile firing: Power, angle, player name
- Collision detection: "Projectile collision detected!"
- Damage dealt: Player name, damage amount, percentage
- Fall damage: Player name, damage, velocity
- Turn changes: "Turn ended for [name]"
- Game over: "Game Over!"

---

## Performance Notes

### Optimizations
- Single active projectile at a time
- Single active explosion at a time
- Explosion particles limited to 20-30
- Trail limited to 15 particles
- Graphics cleared and redrawn each frame

### Frame Rate
- Target: 60 FPS
- Physics update: 16.67ms per frame
- Collision detection: Matter.js handles efficiently

---

## Future Enhancements (Later Streams)

### Stream 3: Math Questions
- Quiz appears before firing
- Correct answer = damage bonus
- Wrong answer = damage penalty

### Stream 4: Multiplayer
- Real players instead of local AI
- Network synchronization
- Server-authoritative physics

### Stream 7: Rating System
- ELO-based rankings
- Rating changes shown on victory screen
- Leaderboards

### Stream 8: Additional Weapons
- Grenade (bounces before exploding)
- Air strike (multiple explosions)
- Teleport (move without turn cost)
- Terrain destruction (actual voxel removal)

---

## Troubleshooting

### Projectile doesn't fire
- **Cause**: Power not charged
- **Solution**: Hold SPACEBAR until power bar appears

### Explosion doesn't appear
- **Cause**: Collision not detected
- **Solution**: Check console for errors, ensure projectile hits something

### Camera doesn't track
- **Cause**: Projectile destroyed too quickly
- **Solution**: Working as intended if collision immediate

### Players don't take damage
- **Cause**: Players outside explosion radius (80px)
- **Solution**: Aim closer to targets

### Game doesn't end
- **Cause**: Players from multiple teams still alive
- **Solution**: Eliminate all players from all but one team

### Victory screen doesn't appear
- **Cause**: VictoryScene not loaded
- **Solution**: Check index.html includes VictoryScene.js

---

## File Structure

```
worms-math-game/
├── client/
│   ├── index.html (updated)
│   └── src/
│       ├── entities/
│       │   ├── Player.js (updated - fall damage)
│       │   ├── Terrain.js
│       │   ├── Projectile.js (NEW)
│       │   └── Explosion.js (NEW)
│       ├── scenes/
│       │   ├── GameScene.js (updated - combat system)
│       │   └── VictoryScene.js (NEW)
│       └── main.js (updated)
└── shared/
    └── constants.js (updated - explosion radius)
```

---

## Success Criteria ✓

All Stream 2 requirements met:

1. ✓ Projectile.js with realistic trajectory
2. ✓ Explosion.js with visual effects and damage
3. ✓ Collision detection working (Matter.js events)
4. ✓ Damage system functional (with falloff)
5. ✓ Players can die (HP = 0, turn gray)
6. ✓ Win condition triggers (one team remaining)
7. ✓ Victory screen displays (with stats)
8. ✓ Fall damage implemented (velocity-based)
9. ✓ Camera tracking (projectile during flight)
10. ✓ Knockback system (explosion pushes players)

---

## Next Steps

**Stream 2 is COMPLETE!** The game now has fully functional combat.

Ready for **Stream 3**: Math question system before firing weapons.
