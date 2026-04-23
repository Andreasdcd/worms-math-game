/**
 * Game Socket Handler
 * Server-authoritative state for MVP combat
 */

const { getRoom, getPlayerRoom } = require('../services/roomManager');

// Game state per room: Map<roomCode, GameState>
const gameStates = new Map();

const TURN_DURATION = 30; // seconds

// ───────────────── State helpers ─────────────────

function initializeGameState(roomCode, room, firstTurnUserId) {
  const players = (room.players || []).map((p, i) => ({
    userId:    p.userId  || p.socketId,
    socketId:  p.socketId,
    name:      p.name    || p.playerName,
    assignedName: p.assignedName || p.name || `Spiller${i + 1}`,
    teamId:    p.team    || (i + 1),
    hp:        100,
    alive:     true,
    kills:     0,
    damageDealt: 0
  }));

  // Build turn order (userId strings)
  let turnOrder = players.map(p => p.userId);

  // If firstTurnUserId is given and valid, rotate to put them first
  const firstIdx = turnOrder.indexOf(firstTurnUserId);
  if (firstIdx > 0) {
    turnOrder = [...turnOrder.slice(firstIdx), ...turnOrder.slice(0, firstIdx)];
  }

  const state = {
    roomCode,
    players,
    turnOrder,
    currentTurnIndex: 0,
    turnStartTime: Date.now(),
    gameStartTime: Date.now(),
    gameEndTime: null,
    winner: null
  };

  gameStates.set(roomCode, state);
  console.log(`[gameHandler] State initialised for room ${roomCode}, first turn: ${turnOrder[0]}`);
  return state;
}

function getCurrentPlayer(state) {
  const uid = state.turnOrder[state.currentTurnIndex];
  return state.players.find(p => p.userId === uid) || null;
}

// ───────────────── Turn advancement ─────────────────

function advanceTurn(io, roomCode, state) {
  const total = state.turnOrder.length;
  let attempts = 0;
  let nextIdx = state.currentTurnIndex;

  do {
    nextIdx = (nextIdx + 1) % total;
    attempts++;
    if (attempts > total) {
      console.error('[gameHandler] No alive players for next turn');
      return;
    }
    const uid = state.turnOrder[nextIdx];
    const p = state.players.find(pl => pl.userId === uid);
    if (p && p.alive) {
      state.currentTurnIndex = nextIdx;
      state.turnStartTime = Date.now();

      console.log(`[gameHandler] Turn → ${p.assignedName}`);

      io.to(roomCode).emit('turn:start', {
        userId: p.userId,
        socketId: p.socketId,
        name: p.assignedName,
        turnIndex: nextIdx,
        timer: TURN_DURATION
      });

      // Auto-advance on timeout
      setTimeout(() => {
        const current = gameStates.get(roomCode);
        if (!current) return;
        const cp = getCurrentPlayer(current);
        if (cp && cp.userId === p.userId) {
          console.log(`[gameHandler] Turn timeout for ${cp.assignedName}`);
          io.to(roomCode).emit('game:turn_timeout', { userId: cp.userId });
          advanceTurn(io, roomCode, current);
        }
      }, TURN_DURATION * 1000 + 2000);

      break;
    }
  } while (true);
}

// ───────────────── Win condition ─────────────────

function checkWinCondition(io, roomCode, state) {
  const alive = state.players.filter(p => p.alive);
  if (alive.length > 1) return false;

  const winner = alive[0] || null;
  state.gameEndTime = Date.now();
  state.winner = winner;

  const duration = Math.floor((state.gameEndTime - state.gameStartTime) / 1000);

  console.log(`[gameHandler] Game over in ${roomCode}. Winner: ${winner ? winner.assignedName : 'none'}`);

  io.to(roomCode).emit('game:end', {
    winnerUserId: winner ? winner.userId : null,
    winnerName: winner ? winner.assignedName : null,
    stats: state.players.map(p => ({
      userId:      p.userId,
      name:        p.assignedName,
      teamId:      p.teamId,
      hp:          p.hp,
      kills:       p.kills,
      damageDealt: p.damageDealt,
      survived:    p.alive
    })),
    duration
  });

  setTimeout(() => {
    gameStates.delete(roomCode);
    console.log(`[gameHandler] Cleaned up state for ${roomCode}`);
  }, 120000);

  return true;
}

// ───────────────── Event handlers ─────────────────

function handleGameStart(io, socket, data) {
  const { roomCode, firstTurnUserId } = data;
  const room = getRoom(roomCode);
  if (!room) {
    socket.emit('game:error', { message: 'Room not found' });
    return;
  }

  // Idempotent — skip if already initialised
  if (gameStates.has(roomCode)) return;

  const state = initializeGameState(roomCode, room, firstTurnUserId);
  const cp = getCurrentPlayer(state);

  io.to(roomCode).emit('game:initialized', {
    players: state.players.map(p => ({
      userId:      p.userId,
      socketId:    p.socketId,
      name:        p.assignedName,
      teamId:      p.teamId,
      hp:          p.hp,
      alive:       p.alive
    })),
    currentTurnUserId: cp ? cp.userId : null,
    timer: TURN_DURATION
  });
}

function handlePlayerShoot(io, socket, data) {
  const { roomCode, angle, power, x, y } = data;
  const state = gameStates.get(roomCode);
  if (!state) return;

  const cp = getCurrentPlayer(state);
  if (!cp || cp.socketId !== socket.id) {
    socket.emit('game:error', { message: 'Not your turn' });
    return;
  }

  // Broadcast so other clients can show the projectile
  io.to(roomCode).emit('player:shoot', {
    userId: cp.userId,
    x, y, angle, power
  });
}

function handlePlayerDamaged(io, socket, data) {
  const { roomCode, targetUserId, damage } = data;
  const state = gameStates.get(roomCode);
  if (!state) return;

  // Only the current turn's client is authoritative for damage
  const cp = getCurrentPlayer(state);
  if (!cp || cp.socketId !== socket.id) return;

  const target = state.players.find(p => p.userId === targetUserId);
  if (!target || !target.alive) return;

  target.hp = Math.max(0, target.hp - damage);
  cp.damageDealt += damage;

  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    if (cp.userId !== target.userId) cp.kills++;

    io.to(roomCode).emit('player:eliminated', {
      userId: target.userId,
      name: target.assignedName,
      eliminatedBy: cp.userId
    });

    if (checkWinCondition(io, roomCode, state)) return;
  }

  io.to(roomCode).emit('player:damaged', {
    targetUserId: target.userId,
    hp: target.hp
  });
}

function handleTurnEnd(io, socket, data) {
  const { roomCode } = data;
  const state = gameStates.get(roomCode);
  if (!state) return;

  const cp = getCurrentPlayer(state);
  if (!cp || cp.socketId !== socket.id) {
    socket.emit('game:error', { message: 'Not your turn' });
    return;
  }

  advanceTurn(io, roomCode, state);
}

// ───────────────── Existing handlers kept for compatibility ─────────────────

function handlePlayerAction(io, socket, data) {
  const { roomCode, angle, power } = data;
  const state = gameStates.get(roomCode);
  if (!state) { socket.emit('game:error', { message: 'Game not found' }); return; }
  const cp = getCurrentPlayer(state);
  if (!cp || cp.socketId !== socket.id) { socket.emit('game:error', { message: 'Not your turn' }); return; }

  const velocity = {
    x: Math.cos(angle) * power * 0.03,
    y: Math.sin(angle) * power * 0.03
  };

  io.to(roomCode).emit('game:projectile_fired', {
    playerId: cp.socketId,
    playerName: cp.assignedName,
    projectile: { startPos: { x: cp.x || 0, y: cp.y || 0 }, velocity, angle, power }
  });
}

function handleExplosion(io, socket, data) {
  // Legacy — kept for backward compat; MVP uses player:damaged directly
  const { roomCode, position, radius = 80 } = data;
  const state = gameStates.get(roomCode);
  if (!state) return;

  io.to(roomCode).emit('game:explosion', { position, radius });
  checkWinCondition(io, roomCode, state);
}

function handlePlayerPosition(io, socket, data) {
  const { roomCode, x, y } = data;
  const state = gameStates.get(roomCode);
  if (!state) return;
  const p = state.players.find(pl => pl.socketId === socket.id);
  if (p) { p.x = x; p.y = y; }
}

function handleEndTurn(io, socket, data) {
  handleTurnEnd(io, socket, data);
}

function handlePlayerReconnect(io, socket, data) {
  const { roomCode, userId } = data;
  const state = gameStates.get(roomCode);
  if (!state) { socket.emit('game:error', { message: 'Game not found' }); return; }
  const player = state.players.find(p => p.userId === userId);
  if (!player) { socket.emit('game:error', { message: 'Player not in game' }); return; }
  player.socketId = socket.id;
  const cp = getCurrentPlayer(state);
  socket.emit('game:state_sync', {
    gameState: {
      players: state.players,
      currentTurnIndex: state.currentTurnIndex,
      currentTurnUserId: cp ? cp.userId : null,
      turnStartTime: state.turnStartTime,
      turnDuration: TURN_DURATION
    }
  });
}

// ───────────────── Setup ─────────────────

function setupGameHandlers(io, socket) {
  // MVP events
  socket.on('game:start',       (data) => handleGameStart(io, socket, data));
  socket.on('player:shoot',     (data) => handlePlayerShoot(io, socket, data));
  socket.on('player:damaged',   (data) => handlePlayerDamaged(io, socket, data));
  socket.on('turn:end',         (data) => handleTurnEnd(io, socket, data));

  // Legacy events kept for compatibility
  socket.on('game:action',      (data) => handlePlayerAction(io, socket, data));
  socket.on('game:explosion',   (data) => handleExplosion(io, socket, data));
  socket.on('game:position',    (data) => handlePlayerPosition(io, socket, data));
  socket.on('game:end_turn',    (data) => handleEndTurn(io, socket, data));
  socket.on('game:reconnect',   (data) => handlePlayerReconnect(io, socket, data));

  console.log(`[gameHandler] Handlers registered for socket ${socket.id}`);
}

function getGameState(roomCode) { return gameStates.get(roomCode); }
function cleanupGameState(roomCode) {
  if (gameStates.has(roomCode)) {
    gameStates.delete(roomCode);
    console.log(`[gameHandler] State cleaned: ${roomCode}`);
  }
}

module.exports = {
  setupGameHandlers,
  initializeGameState,
  getGameState,
  cleanupGameState,
  advanceTurn
};
