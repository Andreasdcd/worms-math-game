# GameScene Multiplayer Integration Guide

This guide shows how to update GameScene.js to work with the multiplayer system.

## Required Changes

### 1. Update init() Method

**Current:**
```javascript
init() {
    this.players = [];
    this.currentPlayerIndex = 0;
    // ... other initialization
}
```

**Change to:**
```javascript
init(data) {
    // Multiplayer data from previous scene
    this.socket = data.socket;
    this.playerName = data.playerName;
    this.userId = data.userId;
    this.roomCode = data.roomCode;
    this.turnOrder = data.turnOrder || [];
    this.serverPlayers = data.players || [];

    // Local game state
    this.players = [];
    this.currentPlayerIndex = 0;
    this.isMyTurn = false;
    // ... other initialization
}
```

### 2. Replace createTestPlayers()

**Current:**
```javascript
createTestPlayers() {
    // Creates 4 local test players
    for (let i = 0; i < 4; i++) {
        // ...
    }
}
```

**Change to:**
```javascript
createMultiplayerPlayers() {
    // Create players from server data
    this.serverPlayers.forEach((serverPlayer, index) => {
        const spawnX = 200 + (index * 300);
        const spawnY = this.terrain.getHeightAt(spawnX) - 20;

        const player = new Player(
            this,
            spawnX,
            spawnY,
            serverPlayer.assignedName,
            serverPlayer.team || null,
            index
        );

        // Store server data reference
        player.socketId = serverPlayer.socketId;
        player.userId = serverPlayer.userId;
        player.hp = serverPlayer.hp;

        this.players.push(player);
    });
}
```

### 3. Add Socket Event Listeners

**Add to create() method:**
```javascript
create() {
    // ... existing code ...

    // Setup multiplayer listeners
    this.setupMultiplayerListeners();
}

setupMultiplayerListeners() {
    // Turn start
    this.socket.on('game:turn_start', (data) => {
        console.log('Turn start:', data.playerName);

        // Find player by assigned name
        const playerIndex = this.players.findIndex(
            p => p.name === data.playerName
        );

        if (playerIndex !== -1) {
            this.currentPlayerIndex = playerIndex;
            this.isMyTurn = (data.playerName === this.playerName);
            this.turnTimeRemaining = data.timer;
            this.startTurnTimer();
            this.focusOnActivePlayer();
        }
    });

    // Projectile fired
    this.socket.on('game:projectile_fired', (data) => {
        console.log('Projectile fired by:', data.playerName);

        // Create visual projectile
        this.createProjectileFromServer(
            data.projectile.startPos,
            data.projectile.velocity
        );
    });

    // Damage dealt
    this.socket.on('game:damage_dealt', (data) => {
        console.log('Damage dealt:', data.damagedPlayers);

        // Apply damage to players
        data.damagedPlayers.forEach(damaged => {
            const player = this.players.find(
                p => p.socketId === damaged.playerId
            );
            if (player) {
                player.takeDamage(damaged.damage);
                player.hp = damaged.newHP;
            }
        });
    });

    // Player died
    this.socket.on('game:player_died', (data) => {
        console.log('Player died:', data.playerName);

        const player = this.players.find(
            p => p.socketId === data.playerId
        );
        if (player) {
            player.die();
        }
    });

    // Match end
    this.socket.on('game:match_end', (data) => {
        console.log('Match ended. Winner:', data.winner);

        this.gameEnded = true;

        // Transition to victory scene
        this.time.delayedCall(2000, () => {
            this.scene.start('VictoryScene', {
                socket: this.socket,
                playerName: this.playerName,
                userId: this.userId,
                winner: data.winner,
                stats: data.stats,
                duration: data.duration
            });
        });
    });

    // Turn timeout
    this.socket.on('game:turn_timeout', (data) => {
        console.log('Turn timeout for:', data.playerName);

        if (this.isMyTurn) {
            this.showMessage('DIN TUR ER FÆRDIG!', '#FF0000');
        }
    });
}
```

### 4. Update fireWeapon() Method

**Current:**
```javascript
fireWeapon() {
    if (!this.isTurnActive || !this.aimAngle) return;

    const player = this.getCurrentPlayer();
    const power = this.aimPower / 100;

    // Create local projectile
    this.activeProjectile = new Projectile(
        this,
        player.sprite.x,
        player.sprite.y - 20,
        this.aimAngle,
        power
    );

    // ...
}
```

**Change to:**
```javascript
fireWeapon() {
    if (!this.isMyTurn || !this.aimAngle) return;

    const player = this.getCurrentPlayer();
    const power = this.aimPower / 100;

    // Send action to server
    this.socket.emit('game:action', {
        roomCode: this.roomCode,
        angle: this.aimAngle,
        power: power
    });

    // Visual feedback
    this.showMessage('AFFYRING...', '#00FF00');

    // Disable input
    this.isTurnActive = false;
}

// New method for creating projectile from server event
createProjectileFromServer(startPos, velocity) {
    // Create visual projectile (no physics collision)
    this.activeProjectile = new Projectile(
        this,
        startPos.x,
        startPos.y,
        0, // Angle not needed
        0, // Power not needed
        true // Visual only flag
    );

    // Apply server velocity
    this.activeProjectile.setVelocity(velocity.x, velocity.y);
}
```

### 5. Update Explosion Handling

**Current:**
```javascript
createExplosion(x, y, damage) {
    this.activeExplosion = new Explosion(this, x, y, damage);
}
```

**Change to:**
```javascript
createExplosion(x, y, damage) {
    // Create visual explosion
    this.activeExplosion = new Explosion(this, x, y, damage);

    // If this was my projectile, notify server
    if (this.activeProjectile && this.activeProjectile.ownerId === this.socket.id) {
        this.socket.emit('game:explosion', {
            roomCode: this.roomCode,
            position: { x, y },
            radius: 50,
            playerId: this.socket.id
        });
    }
}
```

### 6. Update endTurn() Method

**Current:**
```javascript
endTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.startTurnTimer();
    this.focusOnActivePlayer();
}
```

**Change to:**
```javascript
endTurn() {
    // Server controls turn advancement
    // Just send end turn signal if it's my turn
    if (this.isMyTurn) {
        this.socket.emit('game:end_turn', {
            roomCode: this.roomCode
        });

        this.isMyTurn = false;
        this.isTurnActive = false;
    }
}
```

### 7. Disable Local Win Condition

**Current:**
```javascript
checkWinCondition() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    if (alivePlayers.length === 1) {
        // Local win detection
        this.gameEnded = true;
        // ...
    }
}
```

**Change to:**
```javascript
checkWinCondition() {
    // Server handles win detection
    // Just update local state for visuals
    const alivePlayers = this.players.filter(p => p.isAlive);

    // Update UI to show remaining players
    this.updatePlayerStatusUI(alivePlayers);
}
```

### 8. Add Input Validation

**Add to update() method:**
```javascript
update(time, delta) {
    // Only allow input on your turn
    if (!this.isMyTurn) {
        this.aimArrow.clear();
        this.powerBarGraphics.clear();
        return;
    }

    // ... existing update code ...
}
```

### 9. Clean Up on Shutdown

**Add:**
```javascript
shutdown() {
    // Remove socket listeners
    this.socket.off('game:turn_start');
    this.socket.off('game:projectile_fired');
    this.socket.off('game:damage_dealt');
    this.socket.off('game:player_died');
    this.socket.off('game:match_end');
    this.socket.off('game:turn_timeout');
}
```

---

## Summary of Changes

| Current Behavior | New Multiplayer Behavior |
|------------------|--------------------------|
| Creates 4 test players locally | Receives players from server |
| Advances turns locally | Server controls turn order |
| Calculates damage locally | Server calculates damage |
| Detects win locally | Server detects winner |
| Full physics simulation | Visual only (server simulates) |
| Immediate turn switch | Waits for server event |

---

## Testing After Integration

1. Start with 2 browser tabs
2. Complete matchmaking → waiting room → quiz
3. In GameScene:
   - Only active player can aim/fire
   - Projectile visible on both screens
   - Explosion synced across clients
   - HP bars update on both screens
   - Winner announced on both screens

---

## Common Issues

**Issue:** Can't aim on my turn
**Fix:** Check `this.isMyTurn` is set correctly in `game:turn_start` listener

**Issue:** Projectile doesn't appear
**Fix:** Ensure `game:projectile_fired` event creates visual projectile

**Issue:** Damage not applied
**Fix:** Check player lookup by socketId in `game:damage_dealt` handler

**Issue:** Game doesn't end
**Fix:** Verify `game:match_end` transitions to VictoryScene

---

## Next Steps

1. Copy the changes above into GameScene.js
2. Test with 2 players locally
3. Test with 4+ players
4. Add reconnection handling
5. Add spectator mode for dead players
6. Polish visual feedback

**Estimated Time:** 2-3 hours for full integration
