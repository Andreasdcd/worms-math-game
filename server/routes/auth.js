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
    getAllUsers,
    verifyPassword,
    updatePassword
} = require('../services/supabaseService');

/**
 * POST /api/auth/signup
 * Create a new user account with password
 *
 * Body: { username: string, password: string, role?: 'student' | 'teacher' }
 * Returns: { success: boolean, user: {...}, message: string }
 */
router.post('/signup', async (req, res) => {
    try {
        const { username, password, role = 'student' } = req.body;

        // Validation
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Brugernavn er påkrævet'
            });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Brugernavn skal være mellem 3 og 20 tegn'
            });
        }

        if (!/^[a-zA-Z0-9_æøåÆØÅ]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Brugernavn må kun indeholde bogstaver, tal og understregninger'
            });
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Adgangskode er påkrævet'
            });
        }

        if (password.length < 4 || password.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Adgangskode skal være mellem 4 og 50 tegn'
            });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rolle skal være "student" eller "teacher"'
            });
        }

        // Create user
        const user = await createUser(username, role, password);

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                rating: user.rating,
                createdAt: user.created_at
            },
            message: 'Bruger oprettet'
        });

    } catch (error) {
        console.error('Signup error:', error);

        // Handle duplicate username
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Brugernavnet er allerede i brug'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Kunne ikke oprette bruger',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/login
 * Login with username and password
 *
 * Body: { username: string, password: string }
 * Returns: { success: boolean, user: {...}, message: string }
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Brugernavn er påkrævet'
            });
        }

        // Find user
        const user = await getUserByUsername(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Bruger ikke fundet'
            });
        }

        // Verify password if user has one
        if (user.password_hash) {
            if (!password || !verifyPassword(user, password)) {
                return res.status(401).json({
                    success: false,
                    message: 'Forkert kodeord'
                });
            }
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
            message: 'Login gennemført'
        });

    } catch (error) {
        console.error('Login error:', error);

        // Handle "not found" gracefully
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                success: false,
                message: 'Bruger ikke fundet'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Login mislykkedes',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password
 *
 * Body: { userId: string, oldPassword: string, newPassword: string }
 * Returns: { success: boolean, message: string }
 */
router.post('/change-password', async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'userId, oldPassword og newPassword er påkrævet'
            });
        }

        if (newPassword.length < 4 || newPassword.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Ny adgangskode skal være mellem 4 og 50 tegn'
            });
        }

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Bruger ikke fundet'
            });
        }

        // Verify old password
        if (!verifyPassword(user, oldPassword)) {
            return res.status(401).json({
                success: false,
                message: 'Forkert kodeord'
            });
        }

        await updatePassword(userId, newPassword);

        res.json({
            success: true,
            message: 'Adgangskode ændret'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Kunne ikke ændre adgangskode',
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
