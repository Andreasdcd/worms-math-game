/**
 * Worms Math Game - Server Entry Point
 * Express + Socket.IO server with Supabase integration
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import socket handlers
const { setupMatchmakingHandlers, handlePlayerDisconnect: matchmakingDisconnect } = require('./socket/matchmakingHandler');
const { setupRoomHandlers } = require('./socket/roomHandler');
const { setupQuizHandlers, cleanupQuizSession } = require('./socket/quizHandler');
const { setupGameHandlers, cleanupGameState } = require('./socket/gameHandler');
const { removePlayerFromRoom, cleanupInactiveRooms, getOnlinePlayersCount } = require('./services/roomManager');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));

app.use(express.json());

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize Supabase (placeholder - add credentials when ready)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
    console.log('Supabase initialized');
} else {
    console.log('Supabase credentials not found - running without database');
}

// Import routes
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const quizRoutes = require('./routes/quiz');
const matchesRoutes = require('./routes/matches');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabase: supabase ? 'connected' : 'not configured',
        onlinePlayers: getOnlinePlayersCount()
    });
});

// API info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Worms Math Game Server',
        version: '2.0.0',
        status: 'running',
        onlinePlayers: getOnlinePlayersCount(),
        endpoints: {
            health: 'GET /health',
            websocket: 'Socket.IO on same port',
            auth: 'POST /api/auth/signup, POST /api/auth/login, GET /api/auth/users',
            leaderboard: 'GET /api/leaderboard, GET /api/leaderboard/profile/:userId',
            quiz: 'GET /api/quiz/random, POST /api/quiz/attempt, GET /api/quiz/stats/:userId',
            matches: 'POST /api/matches, GET /api/matches/:userId'
        },
        socketEvents: {
            matchmaking: 'matchmaking:join, matchmaking:leave',
            room: 'room:create, room:join, room:leave, room:ready',
            quiz: 'quiz:completed, quiz:get_results',
            game: 'game:action, game:explosion, game:end_turn'
        }
    });
});

// Wire up API routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/matches', matchesRoutes);

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Welcome message
    socket.emit('welcome', {
        message: 'Welcome to Worms Math Game!',
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        onlinePlayers: getOnlinePlayersCount()
    });

    // Setup all socket handlers
    setupMatchmakingHandlers(io, socket);
    setupRoomHandlers(io, socket);
    setupQuizHandlers(io, socket);
    setupGameHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);

        // Clean up matchmaking
        matchmakingDisconnect(socket);

        // Remove from room
        const result = removePlayerFromRoom(socket.id);
        if (result && result.room) {
            // Notify other players
            io.to(result.room.code).emit('room:player_disconnected', {
                playerName: result.player.assignedName,
                playerCount: result.room.players.length
            });
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`[Socket] Error from ${socket.id}:`, error);
    });
});

// Periodic cleanup of inactive rooms (every 5 minutes)
setInterval(() => {
    const cleaned = cleanupInactiveRooms();
    if (cleaned > 0) {
        console.log(`[Cleanup] Removed ${cleaned} inactive rooms`);
    }
}, 5 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log('');
    console.log('==========================================');
    console.log('    WORMS MATH GAME - MULTIPLAYER SERVER');
    console.log('==========================================');
    console.log(`Server:      http://localhost:${PORT}`);
    console.log(`WebSocket:   ws://localhost:${PORT}`);
    console.log(`Health:      http://localhost:${PORT}/health`);
    console.log('==========================================');
    console.log('Features:');
    console.log('  ✓ Matchmaking & Room System');
    console.log('  ✓ Quiz Phase & Turn Order');
    console.log('  ✓ Server-Authoritative Game');
    console.log('  ✓ Real-time Synchronization');
    console.log('  ✓ 200 Danish Worm Names');
    console.log('==========================================');
    console.log('');
});

// Export for testing
module.exports = { app, io, supabase };
