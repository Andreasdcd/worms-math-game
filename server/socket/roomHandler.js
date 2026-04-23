/**
 * Room Socket Handler
 * Manages room lifecycle, players joining/leaving, ready states
 */

const {
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  setPlayerReady,
  areAllPlayersReady,
  startQuizPhase,
  startGamePhase,
  getRoom,
  getPlayerRoom,
  getAvailableRooms
} = require('../services/roomManager');

const { initializeQuizSession } = require('./quizHandler');
const { initializeGameState, advanceTurn } = require('./gameHandler');

/**
 * Handle player creating a private room
 */
function handleCreatePrivateRoom(io, socket, data) {
  const { playerName, userId, matchType = 'FFA', rating = 1000 } = data;

  try {
    const room = createRoom({
      matchType,
      isPrivate: true,
      creatorSocketId: socket.id,
      creatorName: playerName
    });

    // Add creator to room
    const { player } = addPlayerToRoom(room.code, {
      socketId: socket.id,
      name: playerName,
      userId,
      rating
    });

    // Join socket.io room
    socket.join(room.code);

    socket.emit('room:created', {
      roomCode: room.code,
      matchType,
      player: {
        name: player.name,
        assignedName: player.assignedName,
        team: player.team
      },
      message: `Room created! Share code: ${room.code}`
    });

    console.log(`✓ Private room created: ${room.code} by ${playerName}`);
  } catch (error) {
    console.error('Create room error:', error);
    socket.emit('room:error', {
      message: 'Failed to create room',
      error: error.message
    });
  }
}

/**
 * Handle player joining a room by code
 */
function handleJoinRoom(io, socket, data) {
  const { roomCode, playerName, userId, rating = 1000 } = data;

  try {
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('room:error', {
        message: 'Room not found'
      });
      return;
    }

    const { player } = addPlayerToRoom(roomCode, {
      socketId: socket.id,
      name: playerName,
      userId,
      rating
    });

    // Join socket.io room
    socket.join(roomCode);

    // Notify player
    socket.emit('room:joined', {
      roomCode,
      matchType: room.matchType,
      player: {
        name: player.name,
        assignedName: player.assignedName,
        team: player.team
      },
      players: room.players.map(p => ({
        name: p.name,
        assignedName: p.assignedName,
        team: p.team,
        ready: p.ready
      }))
    });

    // Notify other players
    socket.to(roomCode).emit('room:player_joined', {
      player: {
        name: player.name,
        assignedName: player.assignedName,
        team: player.team,
        ready: player.ready
      },
      playerCount: room.players.length,
      maxPlayers: room.matchConfig.maxPlayers
    });

    console.log(`✓ ${playerName} joined room ${roomCode} (${room.players.length}/${room.matchConfig.maxPlayers})`);
  } catch (error) {
    console.error('Join room error:', error);
    socket.emit('room:error', {
      message: error.message
    });
  }
}

/**
 * Handle player leaving a room
 */
function handleLeaveRoom(io, socket, data) {
  const result = removePlayerFromRoom(socket.id);

  if (!result) {
    return;
  }

  const { room, player } = result;

  // Leave socket.io room
  socket.leave(room ? room.code : '');

  socket.emit('room:left', {
    message: 'Left room'
  });

  if (room) {
    // Notify other players
    io.to(room.code).emit('room:player_left', {
      playerName: player.assignedName,
      playerCount: room.players.length,
      maxPlayers: room.matchConfig.maxPlayers
    });
  }
}

/**
 * Handle player ready toggle
 */
function handlePlayerReady(io, socket, data) {
  const { ready } = data;

  try {
    const room = setPlayerReady(socket.id, ready);

    // Notify all players in room
    io.to(room.code).emit('room:player_ready', {
      socketId: socket.id,
      ready,
      allReady: areAllPlayersReady(room.code)
    });

    // If all ready and minimum players met, start countdown
    if (areAllPlayersReady(room.code)) {
      startQuizCountdown(io, room.code);
    }
  } catch (error) {
    console.error('Player ready error:', error);
    socket.emit('room:error', {
      message: error.message
    });
  }
}

/**
 * Start quiz countdown when all players ready
 */
function startQuizCountdown(io, roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  console.log(`✓ Starting quiz countdown for room ${roomCode}`);

  // Send countdown event
  io.to(roomCode).emit('room:quiz_countdown', {
    countdown: 5,
    message: 'All players ready! Starting quiz in 5 seconds...'
  });

  // Start quiz after countdown
  setTimeout(() => {
    startQuiz(io, roomCode);
  }, 5000);
}

/**
 * Start quiz phase
 */
function startQuiz(io, roomCode) {
  try {
    const room = startQuizPhase(roomCode);

    // Initialize quiz session
    const playerNames = room.players.map(p => p.assignedName);
    initializeQuizSession(roomCode, playerNames);

    // Notify all players
    io.to(roomCode).emit('quiz:start', {
      players: playerNames,
      questionCount: 5,
      timeLimit: 60,
      timestamp: Date.now()
    });

    console.log(`✓ Quiz started for room ${roomCode}`);
  } catch (error) {
    console.error('Start quiz error:', error);
    io.to(roomCode).emit('room:error', {
      message: 'Failed to start quiz'
    });
  }
}

/**
 * Start game phase (called after quiz completes)
 */
function startGame(io, roomCode, turnOrder) {
  try {
    const room = startGamePhase(roomCode, turnOrder);

    // Initialize game state
    const gameState = initializeGameState(roomCode, room);

    // Notify all players
    io.to(roomCode).emit('game:start', {
      turnOrder,
      players: gameState.players.map(p => ({
        socketId: p.socketId,
        name: p.name,
        assignedName: p.assignedName,
        team: p.team,
        hp: p.hp
      })),
      currentPlayer: gameState.players[0],
      turnDuration: 30,
      timestamp: Date.now()
    });

    // Start first turn
    setTimeout(() => {
      advanceTurn(io, roomCode, gameState);
    }, 3000);

    console.log(`✓ Game started for room ${roomCode}`);
  } catch (error) {
    console.error('Start game error:', error);
    io.to(roomCode).emit('room:error', {
      message: 'Failed to start game'
    });
  }
}

/**
 * Get room state
 */
function handleGetRoomState(socket, data) {
  const { roomCode } = data;

  const room = getRoom(roomCode);
  if (!room) {
    socket.emit('room:error', {
      message: 'Room not found'
    });
    return;
  }

  socket.emit('room:state', {
    roomCode: room.code,
    matchType: room.matchType,
    state: room.state,
    players: room.players.map(p => ({
      name: p.name,
      assignedName: p.assignedName,
      team: p.team,
      ready: p.ready,
      connected: p.connected
    })),
    playerCount: room.players.length,
    maxPlayers: room.matchConfig.maxPlayers
  });
}

/**
 * Get available rooms
 */
function handleGetAvailableRooms(socket) {
  const rooms = getAvailableRooms();

  socket.emit('room:available_rooms', {
    rooms
  });
}

/**
 * Setup room socket event handlers
 */
function setupRoomHandlers(io, socket) {
  // Create private room
  socket.on('room:create', (data) => {
    handleCreatePrivateRoom(io, socket, data);
  });

  // Join room by code
  socket.on('room:join', (data) => {
    handleJoinRoom(io, socket, data);
  });

  // Leave room
  socket.on('room:leave', (data) => {
    handleLeaveRoom(io, socket, data);
  });

  // Player ready
  socket.on('room:ready', (data) => {
    handlePlayerReady(io, socket, data);
  });

  // Get room state
  socket.on('room:get_state', (data) => {
    handleGetRoomState(socket, data);
  });

  // Get available rooms
  socket.on('room:get_available', () => {
    handleGetAvailableRooms(socket);
  });

  console.log(`Room handlers setup for socket ${socket.id}`);
}

module.exports = {
  setupRoomHandlers,
  startGame
};
