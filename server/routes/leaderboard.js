/**
 * Leaderboard Routes
 * Get top players and user profiles
 */

const express = require('express');
const router = express.Router();
const {
    getLeaderboard,
    getUserById
} = require('../services/supabaseService');

/**
 * GET /api/leaderboard
 * Get top players sorted by rating
 *
 * Query params:
 *   - limit: number of players (default 20, max 100)
 *
 * Returns: { success: boolean, leaderboard: [...] }
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const players = await getLeaderboard(limit);

        // Calculate additional stats
        const leaderboard = players.map((player, index) => {
            const winRate = player.matches_played > 0
                ? Math.round((player.matches_won / player.matches_played) * 100)
                : 0;

            const avgKills = player.matches_played > 0
                ? (player.total_kills / player.matches_played).toFixed(1)
                : '0.0';

            const avgDamage = player.matches_played > 0
                ? Math.round(player.total_damage / player.matches_played)
                : 0;

            return {
                rank: index + 1,
                id: player.id,
                username: player.username,
                rating: player.rating,
                matchesPlayed: player.matches_played,
                matchesWon: player.matches_won,
                winRate: winRate,
                totalKills: player.total_kills,
                totalDamage: player.total_damage,
                avgKills: parseFloat(avgKills),
                avgDamage: avgDamage,
                createdAt: player.created_at
            };
        });

        res.json({
            success: true,
            leaderboard,
            count: leaderboard.length
        });

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard',
            error: error.message
        });
    }
});

/**
 * GET /api/leaderboard/profile/:userId
 * Get detailed profile for a specific user
 *
 * Returns: { success: boolean, profile: {...} }
 */
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate stats
        const winRate = user.matches_played > 0
            ? Math.round((user.matches_won / user.matches_played) * 100)
            : 0;

        const lossRate = 100 - winRate;

        const avgKills = user.matches_played > 0
            ? (user.total_kills / user.matches_played).toFixed(1)
            : '0.0';

        const avgDamage = user.matches_played > 0
            ? Math.round(user.total_damage / user.matches_played)
            : 0;

        const profile = {
            id: user.id,
            username: user.username,
            role: user.role,
            rating: user.rating,
            stats: {
                matchesPlayed: user.matches_played,
                matchesWon: user.matches_won,
                matchesLost: user.matches_played - user.matches_won,
                winRate: winRate,
                lossRate: lossRate,
                totalKills: user.total_kills,
                totalDamage: user.total_damage,
                avgKills: parseFloat(avgKills),
                avgDamage: avgDamage
            },
            timestamps: {
                createdAt: user.created_at,
                lastPlayedAt: user.last_played_at
            }
        };

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

module.exports = router;
