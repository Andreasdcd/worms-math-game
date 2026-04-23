# Worms Math Game - Controls Guide

## Keyboard Controls

### Movement
- **LEFT ARROW** - Move active player left
- **RIGHT ARROW** - Move active player right

### Aiming & Firing
- **MOUSE** - Move mouse to aim (arrow shows direction)
- **SPACEBAR** (hold) - Charge power bar (0-100%)
- **SPACEBAR** (release) - Fire weapon (placeholder in Stream 1)

## HUD Elements

### Top-Left
```
Raket-Robert's Turn
```
Shows the current active player's name in their team color

### Top-Center
```
Time: 30s
```
Turn timer counting down (turns red at 10 seconds)

### Top-Right
```
Players:
> Raket-Robert:   [========== ] 100
  Bomber-Bjarne:  [========== ] 100
  Granat-Grete:   [========== ] 100
  Missile-Morten: [========== ] 100
```
- `>` indicates active player
- HP bar shows health status
- Number shows exact HP value

### Bottom-Center (When Aiming)
```
Power: 45%
[=========         ]
```
Shows charging power and visual bar

## Game Flow

1. **Turn Start**: Camera pans to active player
2. **Movement Phase**: Use arrow keys to position
3. **Aim**: Move mouse to set angle
4. **Charge**: Hold spacebar to build power
5. **Fire**: Release spacebar (ends turn after 1 sec)
6. **Turn End**: Next player becomes active
7. **Auto-Skip**: Dead players are skipped automatically

## Turn Timer

- 30 seconds per turn
- White text when time > 10 seconds
- Red text when time ≤ 10 seconds
- Turn ends automatically at 0 seconds

## Team Colors

- **Team 1**: Red (#FF0000)
- **Team 2**: Blue (#0000FF)
- **Team 3**: Green (#00FF00) - Not used in 4-player test
- **Team 4**: Yellow (#FFFF00) - Not used in 4-player test

## Camera Controls

Camera automatically:
- Follows active player with smooth lerp
- Pans smoothly when turn changes (500ms animation)
- Stays within world bounds (800x600)

## Tips

1. **Movement**: Players have momentum - they'll slide slightly when stopping
2. **Gravity**: Players fall realistically and bounce slightly on landing
3. **Platforms**: 5 platforms at different heights to explore
4. **Aim Practice**: The arrow updates in real-time as you move the mouse
5. **Power Timing**: Watch the color change (Green > Yellow > Red) for max power

## Test Scenario

Try this quick test:
1. Move player left with LEFT ARROW
2. Move player right with RIGHT ARROW
3. Point mouse at another player
4. Hold SPACEBAR and watch power charge
5. Release at 100% power
6. See console log: "Firing with power: 100%, angle: X"
7. Wait for turn to end (1 second)
8. Next player becomes active

## Debug Info

Open browser console (F12) to see:
- Scene initialization
- Player names
- Turn changes
- Fire events with power/angle data

---

Enjoy testing the game! 🎮
