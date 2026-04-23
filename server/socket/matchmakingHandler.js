/**
 * Matchmaking Socket Handler
 * Manages player queues and automatic match creation
 */

const {
  createRoom,
  addPlayerToRoom,
  getRoom,
  MATCH_TYPES
} = require('../services/roomManager');

// Matchmaking queues by match type
const matchmakingQueues = new Map();

// Initialize queues for each match type
Object.keys(MATCH_TYPES).forEach(type => {
  matchmakingQueues.set(type, []);
});

/**
 * Add player to matchmaking queue
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Player's socket
 * @param {Object} data - { playerName, userId, matchType }
 */
function handleJoinMatchmaking(io, socket, data) {
  const { playerName, userId, matchType = 'FFA' } = data;

  if (!MATCH_TYPES[matchType]) {
    socket.emit('matchmaking:error', {
      message: `Invalid match type: ${matchType}`
    });
    return;
  }

  const queue = matchmakingQueues.get(matchType);

  // Check if player already in queue
  if (queue.find(p => p.socketId === socket.id)) {
    socket.emit('matchmaking:error', {
      message: 'You are already in the matchmaking queue'
    });
    return;
  }

  // Add to queue
  const queueEntry = {
    socketId: socket.id,
    playerName,
    userId,
    joinedAt: Date.now(),
    rating: data.rating || 1000 // For balanced matchmaking
  };

  queue.push(queueEntry);

  console.log(`✓ ${playerName} joined ${matchType} matchmaking queue (${queue.length} waiting)`);

  socket.emit('matchmaking:joined', {
    matchType,
    queuePosition: queue.length,
    message: 'Searching for match...'
  });

  // Try to create a match
  tryCreateMatch(io, matchType);
}

/**
 * Remove player from matchmaking queue
 * @param {Object} socket - Player's socket
 * @param {Object} data - { matchType }
 */
function handleLeaveMatchmaking(socket, data) {
  const { matchType } = data;

  if (!matchType) {
    // Remove from all queues
    Object.keys(MATCH_TYPES).forEach(type => {
      removeFromQueue(type, socket.id);
    });
  } else {
    removeFromQueue(matchType, socket.id);
  }

  socket.emit('matchmaking:left', {
    message: 'Left matchmaking queue'
  });
}

/**
 * Remove player from a specific queue
 */
function removeFromQueue(matchType, socketId) {
  const queue = matchmakingQueues.get(matchType);
  if (!queue) return;

  const index = queue.findIndex(p => p.socketId === socketId);
  if (index !== -1) {
    const removed = queue.splice(index, 1)[0];
    console.log(`✓ ${removed.playerName} left ${matchType} matchmaking queue`);
  }
}

/**
 * Try to create a match from queue
 * @param {Object} io - Socket.IO server instance
 * @param {string} matchType - Match type
 */
function tryCreateMatch(io, matchType) {
  const queue = matchmakingQueues.get(matchType);
  const matchConfig = MATCH_TYPES[matchType];

  if (queue.length < matchConfig.minPlayers) {
    return; // Not enough players
  }

  // Take required number of players from queue
  const playerCount = matchConfig.maxPlayers;
  let selectedPlayers;

  if (queue.length >= playerCount) {
    // Enough for a full match - select based on rating for balanced games
    selectedPlayers = selectBalancedPlayers(queue, playerCount);
  } else {
    // Not enough for full match - wait for more players
    return;
  }

  // Remove selected players from queue
  selectedPlayers.forEach(player => {
    const index = queue.findIndex(p => p.socketId === player.socketId);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  });

  // Create room
  const room = createRoom({
    matchType,
    isPrivate: false
  });

  // Add players to room
  selectedPlayers.forEach(player => {
    try {
      const { room: updatedRoom, player: addedPlayer } = addPlayerToRoom(room.code, {
        socketId: player.socketId,
        name: player.playerName,
        userId: player.userId,
        rating: player.rating
      });

      // Make player join socket.io room
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.join(room.code);
      }
    } catch (error) {
      console.error(`Failed to add player ${player.playerName} to room:`, error);
    }
  });

  console.log(`✓ Match created: ${room.code} (${matchType}) with ${room.players.length} players`);

  // Notify all players in the room
  io.to(room.code).emit('matchmaking:found', {
    roomCode: room.code,
    matchType,
    players: room.players.map(p => ({
      name: p.name,
      assignedName: p.assignedName,
      team: p.team,
      rating: p.rating
    })),
    message: 'Match found! Entering waiting room...'
  });
}

/**
 * Select balanced players from queue based on rating
 * For team games, try to balance teams
 */
function selectBalancedPlayers(queue, count) {
  // Sort queue by rating
  const sorted = [...queue].sort((a, b) => b.rating - a.rating);

  // For team games, alternate high/low rated players between teams
  // For FFA, just take top N players by join time to be fair
  const selected = sorted.slice(0, count);

  return selected;
}

/**
 * Handle player disconnect from matchmaking
 */
function handlePlayerDisconnect(socket) {
  // Remove from all queues
  Object.keys(MATCH_TYPES).forEach(type => {
    removeFromQueue(type, socket.id);
  });
}

/**
 * Get queue stats (for debugging/monitoring)
 */
function getQueueStats() {
  const stats = {};
  for (const [type, queue] of matchmakingQueues.entries()) {
    stats[type] = {
      playersWaiting: queue.length,
      minPlayers: MATCH_TYPES[type].minPlayers,
      maxPlayers: MATCH_TYPES[type].maxPlayers
    };
  }
  return stats;
}

/**
 * Setup matchmaking socket event handlers
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
function setupMatchmakingHandlers(io, socket) {
  // Join matchmaking queue
  socket.on('matchmaking:join', (data) => {
    handleJoinMatchmaking(io, socket, data);
  });

  // Leave matchmaking queue
  socket.on('matchmaking:leave', (data) => {
    handleLeaveMatchmaking(socket, data);
  });

  // Get queue stats
  socket.on('matchmaking:stats', () => {
    socket.emit('matchmaking:stats', getQueueStats());
  });

  console.log(`Matchmaking handlers setup for socket ${socket.id}`);
}

module.exports = {
  setupMatchmakingHandlers,
  handlePlayerDisconnect,
  getQueueStats
};
