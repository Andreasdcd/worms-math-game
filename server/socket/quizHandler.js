/**
 * Quiz Socket Handler
 * Manages real-time quiz completion and turn order determination
 */

// Store quiz completion data per room
const roomQuizData = new Map();

/**
 * Initialize a new quiz session for a room
 * @param {string} roomCode - Room code
 * @param {Array} players - Array of player names
 */
function initializeQuizSession(roomCode, players) {
  roomQuizData.set(roomCode, {
    players: players.map(name => ({
      name,
      completed: false,
      score: 0,
      completionTime: null
    })),
    startTime: Date.now(),
    allCompleted: false
  });

  console.log(`Quiz session initialized for room ${roomCode} with ${players.length} players`);
}

/**
 * Handle player completing the quiz
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Player's socket
 * @param {Object} data - Completion data
 */
function handleQuizCompleted(io, socket, data) {
  const { roomCode, playerName, score, completionTime } = data;

  if (!roomQuizData.has(roomCode)) {
    console.error(`Quiz session not found for room: ${roomCode}`);
    return;
  }

  const quizSession = roomQuizData.get(roomCode);

  // Find and update player
  const player = quizSession.players.find(p => p.name === playerName);
  if (!player) {
    console.error(`Player ${playerName} not found in quiz session`);
    return;
  }

  // Update player data
  player.completed = true;
  player.score = score;
  player.completionTime = completionTime;

  console.log(`${playerName} completed quiz - Score: ${score}, Time: ${completionTime}s`);

  // Notify all players in the room
  io.to(roomCode).emit('quiz:player_completed', {
    playerName,
    score,
    completionTime,
    timestamp: Date.now()
  });

  // Check if all players have completed
  const allCompleted = quizSession.players.every(p => p.completed);

  if (allCompleted && !quizSession.allCompleted) {
    quizSession.allCompleted = true;
    handleAllPlayersCompleted(io, roomCode, quizSession);
  }
}

/**
 * Handle when all players have completed the quiz
 * @param {Object} io - Socket.IO server instance
 * @param {string} roomCode - Room code
 * @param {Object} quizSession - Quiz session data
 */
function handleAllPlayersCompleted(io, roomCode, quizSession) {
  console.log(`All players completed quiz in room ${roomCode}`);

  // Determine turn order based on completion time (fastest first)
  const turnOrder = [...quizSession.players]
    .sort((a, b) => {
      // First sort by score (higher is better)
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by completion time (faster is better)
      return a.completionTime - b.completionTime;
    })
    .map(p => p.name);

  console.log(`Turn order for room ${roomCode}:`, turnOrder);

  // Notify all players
  io.to(roomCode).emit('quiz:all_completed', {
    turnOrder,
    results: quizSession.players.map(p => ({
      playerName: p.name,
      score: p.score,
      completionTime: p.completionTime
    })),
    timestamp: Date.now()
  });

  // Store turn order for game start
  quizSession.turnOrder = turnOrder;

  // Start game after brief delay
  const { startGame } = require('./roomHandler');
  setTimeout(() => {
    startGame(io, roomCode, turnOrder);
  }, 3000);
}

/**
 * Get quiz results for a room
 * @param {string} roomCode - Room code
 * @returns {Object|null} - Quiz results or null
 */
function getQuizResults(roomCode) {
  const quizSession = roomQuizData.get(roomCode);
  if (!quizSession) {
    return null;
  }

  return {
    players: quizSession.players,
    turnOrder: quizSession.turnOrder || [],
    allCompleted: quizSession.allCompleted,
    startTime: quizSession.startTime
  };
}

/**
 * Clean up quiz session when room is closed
 * @param {string} roomCode - Room code
 */
function cleanupQuizSession(roomCode) {
  if (roomQuizData.has(roomCode)) {
    roomQuizData.delete(roomCode);
    console.log(`Quiz session cleaned up for room ${roomCode}`);
  }
}

/**
 * Setup quiz socket event handlers
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
function setupQuizHandlers(io, socket) {
  // Player completed quiz
  socket.on('quiz:completed', (data) => {
    handleQuizCompleted(io, socket, data);
  });

  // Request quiz results (for reconnection)
  socket.on('quiz:get_results', (data) => {
    const { roomCode } = data;
    const results = getQuizResults(roomCode);

    if (results) {
      socket.emit('quiz:results', results);
    }
  });

  console.log(`Quiz handlers setup for socket ${socket.id}`);
}

module.exports = {
  setupQuizHandlers,
  initializeQuizSession,
  getQuizResults,
  cleanupQuizSession
};
