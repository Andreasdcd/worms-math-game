# Game Client Architecture - Stream 1

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Load Order:                                       │  │
│  │ 1. Phaser 3.70.0 (CDN)                           │  │
│  │ 2. Socket.IO 4.7.0 (CDN)                         │  │
│  │ 3. shared/constants.js                           │  │
│  │ 4. entities/Player.js                            │  │
│  │ 5. entities/Terrain.js                           │  │
│  │ 6. scenes/GameScene.js                           │  │
│  │ 7. main.js                                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                     main.js                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ • Creates Phaser Game instance                    │  │
│  │ • Configures Matter.js physics                    │  │
│  │ • Initializes GameScene                           │  │
│  │ • Connects Socket.IO (optional)                   │  │
│  │ • Exports: window.game, window.socket            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   GameScene.js                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ init()      - Initialize variables                │  │
│  │ create()    - Setup world, players, HUD          │  │
│  │ update()    - Game loop (60 FPS)                 │  │
│  │ shutdown()  - Cleanup on scene end               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Core Systems:                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │   Turn     │ │   Camera   │ │   Aiming   │          │
│  │  System    │ │   System   │ │   System   │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │    HUD     │ │   Input    │ │   Timer    │          │
│  │   System   │ │  Handler   │ │   System   │          │
│  └────────────┘ └────────────┘ └────────────┘          │
└─────────────────────────────────────────────────────────┘
            ↓                           ↓
┌──────────────────────┐    ┌──────────────────────┐
│    Player.js         │    │    Terrain.js        │
│  ┌────────────────┐  │    │  ┌────────────────┐  │
│  │ Matter.js Body │  │    │  │ Static Bodies  │  │
│  │ (Circle)       │  │    │  │ (Rectangles)   │  │
│  └────────────────┘  │    │  └────────────────┘  │
│  ┌────────────────┐  │    │  ┌────────────────┐  │
│  │ Properties:    │  │    │  │ 5 Platforms:   │  │
│  │ • HP           │  │    │  │ • Ground       │  │
│  │ • Team         │  │    │  │ • Left         │  │
│  │ • Name         │  │    │  │ • Center       │  │
│  │ • Position     │  │    │  │ • Right        │  │
│  └────────────────┘  │    │  │ • Top Left     │  │
│  ┌────────────────┐  │    │  └────────────────┘  │
│  │ Rendering:     │  │    │  ┌────────────────┐  │
│  │ • Circle       │  │    │  │ Rendering:     │  │
│  │ • HP Bar       │  │    │  │ • Brown Rects  │  │
│  │ • Name Text    │  │    │  │ • Borders      │  │
│  └────────────────┘  │    │  └────────────────┘  │
└──────────────────────┘    └──────────────────────┘
```

## Data Flow

### Turn System Flow
```
Turn Start
    ↓
Camera Pan to Player (500ms)
    ↓
Enable Player Controls
    ↓
Start 30s Timer
    ↓
Player Movement Phase (Arrow Keys)
    ↓
Aiming Phase (Mouse Tracking)
    ↓
Power Charging (Spacebar Hold)
    ↓
Fire Weapon (Spacebar Release)
    ↓
[Placeholder: Log + Wait 1s]
    ↓
Turn End
    ↓
Next Player → Loop
```

### Update Loop (60 FPS)
```
GameScene.update()
    ↓
┌───────────────────────────────────────┐
│ 1. Update All Players                 │
│    • Active player gets input         │
│    • All players render               │
│    • Physics updates positions        │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ 2. Handle Power Charging              │
│    • Check spacebar state             │
│    • Increment power (0-100%)         │
│    • Fire on release                  │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ 3. Render Aim Arrow                   │
│    • Calculate angle to mouse         │
│    • Draw white arrow                 │
│    • Draw arrowhead                   │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ 4. Render Power Bar                   │
│    • Show if charging                 │
│    • Color based on power level       │
│    • Update text display              │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ 5. Update Camera                      │
│    • Lerp to active player (smooth)   │
│    • Stay within bounds               │
└───────────────────────────────────────┘
```

## Component Relationships

### GameScene Dependencies
```
GameScene
    │
    ├─ Depends on → Player (entity)
    │   └─ Creates 4 instances
    │
    ├─ Depends on → Terrain (entity)
    │   └─ Creates 1 instance
    │
    ├─ Uses → GAME_CONSTANTS (global)
    │   ├─ GAME_CONFIG.*
    │   ├─ TEAM_COLORS
    │   └─ SOCKET_EVENTS
    │
    └─ Manages:
        ├─ Turn timer (Phaser.Time.TimerEvent)
        ├─ Camera (Phaser.Cameras.Main)
        ├─ Input (Cursors + Keyboard)
        ├─ Graphics (Arrow + Power Bar)
        └─ HUD (Text objects)
```

### Player Dependencies
```
Player
    │
    ├─ Depends on → Phaser.Scene (constructor)
    │
    ├─ Uses → Matter.js (physics body)
    │   └─ Circle body with friction/bounce
    │
    ├─ Uses → GAME_CONSTANTS
    │   ├─ TEAM_COLORS (visual)
    │   ├─ INITIAL_HP (100)
    │   ├─ GROUND_FRICTION (0.1)
    │   └─ WORM_BOUNCE (0.2)
    │
    └─ Creates:
        ├─ Graphics (circle rendering)
        ├─ Graphics (HP bar)
        └─ Text (name label)
```

### Terrain Dependencies
```
Terrain
    │
    ├─ Depends on → Phaser.Scene
    │
    ├─ Uses → Matter.js (static bodies)
    │   └─ Rectangle bodies (5x)
    │
    ├─ Uses → GAME_CONSTANTS
    │   ├─ WORLD_WIDTH (800)
    │   └─ WORLD_HEIGHT (600)
    │
    └─ Creates:
        └─ Graphics (platform rendering)
```

## State Management

### Game State
```javascript
GameScene {
    players: Player[4],           // All player instances
    terrain: Terrain,             // Single terrain instance
    currentPlayerIndex: 0..3,     // Active player index
    turnTimeRemaining: 0..30,     // Seconds left in turn
    turnTimer: TimerEvent,        // Phaser timer
    isAiming: boolean,            // Currently aiming
    aimPower: 0..100,             // Power percentage
    aimAngle: radians,            // Aim direction
    powerCharging: boolean        // Spacebar held
}
```

### Player State
```javascript
Player {
    // Identification
    username: string,           // "Player1"
    assignedName: string,       // "Raket-Robert"
    teamId: 1..4,              // Team number
    teamColor: hex string,     // "#FF0000"

    // Stats
    hp: 0..100,                // Current health
    maxHp: 100,                // Maximum health
    isDead: boolean,           // Elimination status

    // Physics
    body: Matter.Body,         // Physics body
    radius: 15,                // Circle radius
    moveSpeed: 3,              // Movement velocity

    // Visuals
    graphics: Phaser.Graphics, // Circle rendering
    hpBarGraphics: Graphics,   // HP bar rendering
    nameText: Phaser.Text,     // Name label

    // State
    isActive: boolean,         // Current turn
    aimAngle: radians          // Aim direction
}
```

## Input Handling

### Keyboard Mapping
```
GameScene.create() → this.cursors
    ├─ LEFT  → player.body.setVelocityX(-3)
    ├─ RIGHT → player.body.setVelocityX(3)
    └─ SPACE → Power charging system

Event Flow:
    Input.Keyboard
        ↓
    GameScene.cursors (CursorKeys)
        ↓
    GameScene.update()
        ↓
    Player.update(cursors, isActive)
        ↓
    Matter.Body.setVelocityX()
        ↓
    Physics simulation
        ↓
    Body.position updated
        ↓
    Player.render()
```

### Mouse Handling
```
Input.on('pointermove')
    ↓
GameScene.handleMouseMove(pointer)
    ↓
Calculate angle: atan2(dy, dx)
    ↓
Store in GameScene.aimAngle
    ↓
Player.setAimAngle(angle)
    ↓
GameScene.renderAimArrow()
    ↓
Graphics.lineTo() draws arrow
```

## Rendering Pipeline

### Frame Rendering Order
```
Phaser Update Loop (60 FPS)
    ↓
1. Matter.js Physics Step
    ├─ Update all body positions
    ├─ Check collisions
    └─ Apply forces
    ↓
2. GameScene.update()
    ├─ Update players → Player.update()
    ├─ Handle input
    └─ Update game logic
    ↓
3. Rendering (automatic)
    ├─ Clear canvas
    ├─ Render Terrain (Graphics)
    ├─ Render Players (Graphics + Text)
    ├─ Render Aim Arrow (Graphics)
    ├─ Render Power Bar (Graphics)
    └─ Render HUD (Text objects)
    ↓
4. Camera Transform
    ├─ Apply scroll (following player)
    └─ Apply bounds
    ↓
5. Present Frame
```

### Graphics Layers (Z-Order)
```
Bottom (drawn first):
    ├─ Background (sky blue)
    ├─ Terrain (platforms)
    ├─ Players (circles)
    ├─ HP Bars (above players)
    ├─ Names (above HP bars)
    ├─ Aim Arrow (overlay)
    └─ Power Bar (overlay)
Top (drawn last):
    └─ HUD Text (always on top)
```

## Memory Management

### Object Lifecycle

**Player Creation**:
```javascript
new Player(scene, x, y, config)
    → Matter.add.circle()         // Physics body
    → scene.add.graphics()        // Circle graphics
    → scene.add.graphics()        // HP bar graphics
    → scene.add.text()            // Name text
```

**Player Destruction**:
```javascript
player.destroy()
    → graphics.destroy()          // Release circle
    → hpBarGraphics.destroy()     // Release HP bar
    → nameText.destroy()          // Release text
    → matter.world.remove(body)   // Remove from physics
```

**Scene Cleanup**:
```javascript
GameScene.shutdown()
    → turnTimer.remove()          // Stop timer
    → players.forEach(destroy)    // Clean all players
    → terrain.destroy()           // Clean terrain
```

## Performance Considerations

### Optimization Strategies
1. **Immediate Mode Graphics**: Faster for simple shapes than sprites
2. **Object Pooling**: Not needed yet (only 4 players)
3. **Physics Sleeping**: Disabled for consistent simulation
4. **Draw Calls**: Minimized by using Graphics objects
5. **Text Updates**: Only on HUD changes, not every frame

### Target Metrics
- **FPS**: 60 (stable)
- **Update Time**: <16ms per frame
- **Memory**: <50MB for game state
- **Physics**: <5ms per step

---

## Integration Points for Future Streams

### Stream 2 Hooks (Already Implemented)
```javascript
// Ready for projectile system
GameScene.fireWeapon() {
    // TODO: Create projectile here
    // TODO: Add to physics world
    // TODO: Track until impact
}

// Ready for damage application
Player.takeDamage(amount) {
    // Already implemented
    // Just needs to be called from explosions
}

// Ready for camera tracking
// Camera.pan() already working
// Can track projectiles in flight
```

### Stream 3 Hooks (Prepared)
```javascript
// Socket.IO already connected
socket.on('game_state', (state) => {
    // TODO: Sync player positions
    // TODO: Sync HP values
    // TODO: Sync turn state
});

// Ready to send player actions
socket.emit('player_move', {
    playerId: player.id,
    position: player.getPosition()
});
```

---

This architecture is designed to be:
- ✅ **Modular**: Easy to extend with new features
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Performant**: Optimized rendering and physics
- ✅ **Testable**: Easy to debug and verify
- ✅ **Scalable**: Ready for multiplayer and advanced features

**Stream 1 Architecture**: ✅ SOLID FOUNDATION
