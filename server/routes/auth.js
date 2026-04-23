/**
 * Authentication Routes
 * MVP: Username-only auth (no passwords)
 * Future: Add proper authentication with sessions/JWT
 */

const express = require('express');
const router = express.Router();
const {
    createUser,
    getUserById,
    getUserByUsername,
    getAllUsers
} = require('../services/supabaseService');

/**
 * POST /api/auth/signup
 * Create a new user account (username only for MVP)
 *
 * Body: { username: string, role?: 'student' | 'teacher' }
 * Returns: { success: boolean, user: {...}, message: string }
 */
router.post('/signup', async (req, res) => {
    try {
        const { username, role = 'student' } = req.body;

        // Validation
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 20 characters'
            });
        }

        if (!/^[a-zA-Z0-9_æøåÆØÅ]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, and underscores'
            });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "student" or "teacher"'
            });
        }

        // Create user
        const user = await createUser(username, role);

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                createdAt: user.created_at
            },
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Signup error:', error);

        // Handle duplicate username
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/login
 * Login with username (no password for MVP)
 *
 * Body: { username: string }
 * Returns: { success: boolean, user: {...}, message: string }
 */
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;

        // Validation
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Find user
        const user = await getUserByUsername(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                matchesPlayed: user.matches_played,
                matchesWon: user.matches_won
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);

        // Handle "not found" gracefully
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * GET /api/auth/user/:userId
 * Get user by ID
 *
 * Returns: { success: boolean, user: {...} }
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                matchesPlayed: user.matches_played,
                matchesWon: user.matches_won,
                totalKills: user.total_kills,
                totalDamage: user.total_damage,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);

        if (error.code === 'PGRST116') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

/**
 * GET /api/auth/users
 * Get all users (for admin/teacher dashboard)
 *
 * Query params: ?role=student (optional filter)
 * Returns: { success: boolean, users: [...] }
 */
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;

        let users = await getAllUsers();

        // Filter by role if specified
        if (role) {
            users = users.filter(u => u.role === role);
        }

        // Remove sensitive data (future: add proper auth)
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            rating: u.rating,
            matchesPlayed: u.matches_played,
            matchesWon: u.matches_won,
            totalKills: u.total_kills,
            totalDamage: u.total_damage,
            createdAt: u.created_at
        }));

        res.json({
            success: true,
            users: sanitizedUsers,
            count: sanitizedUsers.length
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

module.exports = router;
