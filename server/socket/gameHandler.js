/**
 * Game Socket Handler
 * Server-authoritative game simulation and synchronization
 */

const {
  getRoom,
  getPlayerRoom
} = require('../services/roomManager');

// Game state per room
const gameStates = new Map();

const TURN_DURATION = 30; // seconds
const DAMAGE_MULTIPLIER = 1.0;

/**
 * Initialize game state for a room
 */
function initializeGameState(roomCode, room) {
  const gameState = {
    roomCode,
    players: room.players.map(p => ({
      socketId: p.socketId,
      name: p.name,
      assignedName: p.assignedName,
      team: p.team,
      hp: 100,
      x: 0,
      y: 0,
      isAlive: true,
      kills: 0,
      damageDealt: 0,
      shotsFired: 0,
      shotsHit: 0
    })),
    turnOrder: room.quiz.turnOrder,
    currentTurnIndex: 0,
    turnStartTime: Date.now(),
    projectiles: [],
    explosions: [],
    gameStartTime: Date.now(),
    gameEndTime: null,
    winner: null
  };

  // Assign random spawn positions (will be overridden by client terrain)
  gameState.players.forEach((player, index) => {
    player.x = 200 + (index * 150);
    player.y = 300;
  });

  gameStates.set(roomCode, gameState);

  console.log(`✓ Game state initialized for room ${roomCode}`);

  return gameState;
}

/**
 * Get current player whose turn it is
 */
function getCurrentPlayer(gameState) {
  const playerName = gameState.turnOrder[gameState.currentTurnIndex];
  return gameState.players.find(p => p.assignedName === playerName);
}

/**
 * Handle player action (fire weapon)
 */
function handlePlayerAction(io, socket, data) {
  const { roomCode, angle, power } = data;

  const gameState = gameStates.get(roomCode);
  if (!gameState) {
    socket.emit('game:error', { message: 'Game not found' });
    return;
  }

  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer) {
    socket.emit('game:error', { message: 'No current player' });
    return;
  }

  if (currentPlayer.socketId !== socket.id) {
    socket.emit('game:error', { message: 'Not your turn' });
    return;
  }

  if (!currentPlayer.isAlive) {
    socket.emit('game:error', { message: 'You are dead' });
    return;
  }

  // Calculate projectile trajectory
  const velocity = {
    x: Math.cos(angle) * power * 5,
    y: -Math.sin(angle) * power * 5 // Negative because y is down in screen coordinates
  };

  const projectile = {
    id: Date.now(),
    startPos: { x: currentPlayer.x, y: currentPlayer.y },
    velocity,
    angle,
    power,
    playerId: currentPlayer.socketId,
    createdAt: Date.now()
  };

  gameState.projectiles.push(projectile);
  currentPlayer.shotsFired++;

  console.log(`✓ Player ${currentPlayer.assignedName} fired weapon at angle ${angle}, power ${power}`);

  // Broadcast projectile to all players
  io.to(roomCode).emit('game:projectile_fired', {
    playerId: currentPlayer.socketId,
    playerName: currentPlayer.assignedName,
    projectile: {
      startPos: projectile.startPos,
      velocity: projectile.velocity,
      angle,
      power
    },
    timestamp: Date.now()
  });
}

/**
 * Handle explosion (sent by client after projectile lands)
 */
function handleExplosion(io, socket, data) {
  const { roomCode, position, radius = 50, playerId } = data;

  const gameState = gameStates.get(roomCode);
  if (!gameState) {
    return;
  }

  const explosion = {
    id: Date.now(),
    position,
    radius,
    playerId,
    timestamp: Date.now()
  };

  gameState.explosions.push(explosion);

  // Calculate damage to players within radius
  const damagedPlayers = [];

  gameState.players.forEach(player => {
    if (!player.isAlive) return;

    const distance = Math.sqrt(
      Math.pow(player.x - position.x, 2) +
      Math.pow(player.y - position.y, 2)
    );

    if (distance <= radius) {
      // Damage decreases with distance
      const damagePercent = 1 - (distance / radius);
      const damage = Math.floor(50 * damagePercent * DAMAGE_MULTIPLIER);

      if (damage > 0) {
        player.hp = Math.max(0, player.hp - damage);

        const attacker = gameState.players.find(p => p.socketId === playerId);
        if (attacker && attacker.socketId !== player.socketId) {
          attacker.damageDealt += damage;
          attacker.shotsHit++;
        }

        damagedPlayers.push({
          playerId: player.socketId,
          playerName: player.assignedName,
          damage,
          newHP: player.hp
        });

        console.log(`✓ ${player.assignedName} took ${damage} damage (HP: ${player.hp})`);

        // Check if player died
        if (player.hp <= 0) {
          player.isAlive = false;
          if (attacker && attacker.socketId !== player.socketId) {
            attacker.kills++;
          }

          io.to(roomCode).emit('game:player_died', {
            playerId: player.socketId,
            playerName: player.assignedName,
            killerId: playerId,
            timestamp: Date.now()
          });

          console.log(`✓ ${player.assignedName} died!`);
        }
      }
    }
  });

  // Broadcast damage results
  if (damagedPlayers.length > 0) {
    io.to(roomCode).emit('game:damage_dealt', {
      explosion: {
        position,
        radius
      },
      damagedPlayers,
      timestamp: Date.now()
    });
  }

  // Check win condition
  checkWinCondition(io, roomCode, gameState);
}

/**
 * Update player positions (sent periodically by clients)
 */
function handlePlayerPosition(io, socket, data) {
  const { roomCode, x, y } = data;

  const gameState = gameStates.get(roomCode);
  if (!gameState) return;

  const player = gameState.players.find(p => p.socketId === socket.id);
  if (!player) return;

  player.x = x;
  player.y = y;

  // No need to broadcast position updates constantly
  // Client will handle local worm positions
}

/**
 * End current turn
 */
function handleEndTurn(io, socket, data) {
  const { roomCode } = data;

  const gameState = gameStates.get(roomCode);
  if (!gameState) {
    return;
  }

  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer || currentPlayer.socketId !== socket.id) {
    socket.emit('game:error', { message: 'Not your turn' });
    return;
  }

  advanceTurn(io, roomCode, gameState);
}

/**
 * Advance to next turn
 */
function advanceTurn(io, roomCode, gameState) {
  // Move to next alive player
  let nextIndex = gameState.currentTurnIndex;
  let attempts = 0;

  do {
    nextIndex = (nextIndex + 1) % gameState.turnOrder.length;
    attempts++;

    if (attempts > gameState.turnOrder.length) {
      // No alive players found - shouldn't happen
      console.error('No alive players found for next turn');
      return;
    }

    const nextPlayerName = gameState.turnOrder[nextIndex];
    const nextPlayer = gameState.players.find(p => p.assignedName === nextPlayerName);

    if (nextPlayer && nextPlayer.isAlive) {
      gameState.currentTurnIndex = nextIndex;
      gameState.turnStartTime = Date.now();

      console.log(`✓ Turn advanced to ${nextPlayer.assignedName}`);

      io.to(roomCode).emit('game:turn_start', {
        playerId: nextPlayer.socketId,
        playerName: nextPlayer.assignedName,
        turnNumber: gameState.currentTurnIndex + 1,
        timer: TURN_DURATION,
        timestamp: Date.now()
      });

      // Start turn timer
      setTimeout(() => {
        checkTurnTimeout(io, roomCode, gameState, nextPlayer.socketId);
      }, TURN_DURATION * 1000);

      break;
    }
  } while (true);
}

/**
 * Check if turn has timed out
 */
function checkTurnTimeout(io, roomCode, gameState, expectedPlayerId) {
  if (!gameState) return;

  const currentPlayer = getCurrentPlayer(gameState);
  if (!currentPlayer || currentPlayer.socketId !== expectedPlayerId) {
    // Turn already changed
    return;
  }

  const elapsed = Date.now() - gameState.turnStartTime;
  if (elapsed >= TURN_DURATION * 1000) {
    console.log(`✓ Turn timeout for ${currentPlayer.assignedName}`);

    io.to(roomCode).emit('game:turn_timeout', {
      playerId: currentPlayer.socketId,
      playerName: currentPlayer.assignedName,
      timestamp: Date.now()
    });

    advanceTurn(io, roomCode, gameState);
  }
}

/**
 * Check win condition
 */
function checkWinCondition(io, roomCode, gameState) {
  const room = getRoom(roomCode);
  if (!room) return;

  const alivePlayers = gameState.players.filter(p => p.isAlive);

  if (alivePlayers.length <= 1) {
    // Game over
    const winner = alivePlayers[0] || null;
    gameState.gameEndTime = Date.now();
    gameState.winner = winner;

    const gameDuration = Math.floor((gameState.gameEndTime - gameState.gameStartTime) / 1000);

    console.log(`✓ Game ended in room ${roomCode}. Winner: ${winner ? winner.assignedName : 'None'}`);

    io.to(roomCode).emit('game:match_end', {
      winner: winner ? {
        playerId: winner.socketId,
        playerName: winner.assignedName,
        team: winner.team
      } : null,
      stats: gameState.players.map(p => ({
        playerId: p.socketId,
        playerName: p.assignedName,
        team: p.team,
        kills: p.kills,
        damageDealt: p.damageDealt,
        shotsFired: p.shotsFired,
        shotsHit: p.shotsHit,
        accuracy: p.shotsFired > 0 ? Math.round((p.shotsHit / p.shotsFired) * 100) : 0,
        survived: p.isAlive
      })),
      duration: gameDuration,
      timestamp: Date.now()
    });

    // Clean up game state after delay
    setTimeout(() => {
      gameStates.delete(roomCode);
      console.log(`✓ Game state cleaned up for room ${roomCode}`);
    }, 60000); // 1 minute
  }
}

/**
 * Handle player reconnection
 */
function handlePlayerReconnect(io, socket, data) {
  const { roomCode, userId } = data;

  const gameState = gameStates.get(roomCode);
  if (!gameState) {
    socket.emit('game:error', { message: 'Game not found' });
    return;
  }

  const player = gameState.players.find(p => p.userId === userId);
  if (!player) {
    socket.emit('game:error', { message: 'Player not in game' });
    return;
  }

  // Update socket ID
  player.socketId = socket.id;

  // Send current game state
  socket.emit('game:state_sync', {
    gameState: {
      players: gameState.players,
      currentTurnIndex: gameState.currentTurnIndex,
      currentPlayer: getCurrentPlayer(gameState),
      turnStartTime: gameState.turnStartTime,
      turnDuration: TURN_DURATION
    },
    timestamp: Date.now()
  });

  console.log(`✓ Player reconnected to game in room ${roomCode}`);
}

/**
 * Get game state for a room
 */
function getGameState(roomCode) {
  return gameStates.get(roomCode);
}

/**
 * Clean up game state
 */
function cleanupGameState(roomCode) {
  if (gameStates.has(roomCode)) {
    gameStates.delete(roomCode);
    console.log(`✓ Game state cleaned up for room ${roomCode}`);
  }
}

/**
 * Setup game socket event handlers
 */
function setupGameHandlers(io, socket) {
  // Player action (fire weapon)
  socket.on('game:action', (data) => {
    handlePlayerAction(io, socket, data);
  });

  // Explosion result
  socket.on('game:explosion', (data) => {
    handleExplosion(io, socket, data);
  });

  // Player position update
  socket.on('game:position', (data) => {
    handlePlayerPosition(io, socket, data);
  });

  // End turn
  socket.on('game:end_turn', (data) => {
    handleEndTurn(io, socket, data);
  });

  // Reconnect to game
  socket.on('game:reconnect', (data) => {
    handlePlayerReconnect(io, socket, data);
  });

  console.log(`Game handlers setup for socket ${socket.id}`);
}

module.exports = {
  setupGameHandlers,
  initializeGameState,
  getGameState,
  cleanupGameState,
  advanceTurn
};
