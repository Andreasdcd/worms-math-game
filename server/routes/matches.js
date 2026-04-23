/**
 * Match Routes
 * Create match results and get match history
 */

const express = require('express');
const router = express.Router();
const {
    createMatch,
    addMatchParticipant,
    addMatchTeam,
    getMatchHistory,
    getMatchDetails,
    getUserById,
    updateUserStats,
    updateUserRating
} = require('../services/supabaseService');
const { processMatchRatings } = require('../services/ratingService');

/**
 * POST /api/matches
 * Create a new match result with participants and rating changes
 *
 * Body: {
 *   matchType: 'ffa' | '1v1' | '2v2' | '3v3' | '4v4',
 *   duration: number (seconds),
 *   totalTurns: number,
 *   participants: [
 *     {
 *       userId: string,
 *       teamId: number | null (null for FFA),
 *       placement: number,
 *       stats: { kills: number, damage: number, turns: number }
 *     }
 *   ],
 *   teams?: [
 *     {
 *       teamId: number,
 *       teamName: string,
 *       teamColor: string,
 *       won: boolean,
 *       stats: { kills: number, damage: number }
 *     }
 *   ]
 * }
 *
 * Returns: { success: boolean, match: {...}, participants: [...] }
 */
router.post('/', async (req, res) => {
    try {
        const {
            matchType,
            duration = null,
            totalTurns = null,
            participants,
            teams = null
        } = req.body;

        // Validation
        const validMatchTypes = ['ffa', '1v1', '2v2', '3v3', '4v4'];
        if (!validMatchTypes.includes(matchType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid matchType. Must be one of: ${validMatchTypes.join(', ')}`
            });
        }

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Participants array is required and must not be empty'
            });
        }

        // Fetch current ratings for all participants
        const participantsWithRatings = await Promise.all(
            participants.map(async (p) => {
                const user = await getUserById(p.userId);
                if (!user) {
                    throw new Error(`User not found: ${p.userId}`);
                }
                return {
                    userId: p.userId,
                    username: user.username,
                    rating: user.rating,
                    teamId: p.teamId || null,
                    placement: p.placement,
                    stats: p.stats || { kills: 0, damage: 0, turns: 0 }
                };
            })
        );

        // Calculate rating changes using the rating service
        const ratingResults = processMatchRatings(matchType, participantsWithRatings);

        // Create match record
        const match = await createMatch(matchType, duration, totalTurns);

        // Add participants to database
        const participantRecords = await Promise.all(
            ratingResults.map(async (result) => {
                return await addMatchParticipant(
                    match.id,
                    result.userId,
                    result.teamId,
                    result.placement,
                    result.stats,
                    {
                        before: result.ratingBefore,
                        after: result.ratingAfter,
                        change: result.ratingChange
                    }
                );
            })
        );

        // Add teams if applicable
        let teamRecords = null;
        if (teams && matchType !== 'ffa') {
            teamRecords = await Promise.all(
                teams.map(async (team) => {
                    return await addMatchTeam(
                        match.id,
                        team.teamId,
                        team.teamName,
                        team.teamColor,
                        team.won,
                        team.stats || { kills: 0, damage: 0 }
                    );
                })
            );
        }

        // Update user ratings and stats
        await Promise.all(
            ratingResults.map(async (result) => {
                // Update rating
                await updateUserRating(result.userId, result.ratingAfter);

                // Update stats
                const user = await getUserById(result.userId);
                const won = result.placement === 1;

                await updateUserStats(result.userId, {
                    matches_played: user.matches_played + 1,
                    matches_won: user.matches_won + (won ? 1 : 0),
                    total_kills: user.total_kills + (result.stats.kills || 0),
                    total_damage: user.total_damage + (result.stats.damage || 0)
                });
            })
        );

        res.status(201).json({
            success: true,
            match: {
                id: match.id,
                matchType: match.match_type,
                duration: match.duration_seconds,
                totalTurns: match.total_turns,
                createdAt: match.created_at,
                endedAt: match.ended_at
            },
            participants: ratingResults.map(r => ({
                userId: r.userId,
                username: r.username,
                teamId: r.teamId,
                placement: r.placement,
                stats: r.stats,
                rating: {
                    before: r.ratingBefore,
                    after: r.ratingAfter,
                    change: r.ratingChange
                }
            })),
            teams: teamRecords,
            message: 'Match saved successfully'
        });

    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create match',
            error: error.message
        });
    }
});

/**
 * GET /api/matches/:userId
 * Get match history for a specific user
 *
 * Query params:
 *   - limit: number of matches (default: 10, max: 50)
 *
 * Returns: { success: boolean, matches: [...] }
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const matchHistory = await getMatchHistory(userId, limit);

        // Format response
        const matches = matchHistory.map(record => ({
            matchId: record.match_id,
            matchType: record.match_results.match_type,
            placement: record.placement,
            teamId: record.team_id,
            stats: {
                kills: record.kills,
                damage: record.damage_dealt,
                turns: record.turns_taken
            },
            rating: {
                before: record.rating_before,
                after: record.rating_after,
                change: record.rating_change
            },
            playedAt: record.match_results.created_at,
            duration: record.match_results.duration_seconds
        }));

        res.json({
            success: true,
            matches,
            count: matches.length
        });

    } catch (error) {
        console.error('Get match history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch match history',
            error: error.message
        });
    }
});

/**
 * GET /api/matches/details/:matchId
 * Get detailed information about a specific match
 *
 * Returns: { success: boolean, match: {...} }
 */
router.get('/details/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;

        const matchData = await getMatchDetails(matchId);

        // Format response
        const response = {
            match: {
                id: matchData.match.id,
                matchType: matchData.match.match_type,
                duration: matchData.match.duration_seconds,
                totalTurns: matchData.match.total_turns,
                createdAt: matchData.match.created_at,
                endedAt: matchData.match.ended_at
            },
            participants: matchData.participants.map(p => ({
                userId: p.user_id,
                username: p.users.username,
                teamId: p.team_id,
                placement: p.placement,
                stats: {
                    kills: p.kills,
                    damage: p.damage_dealt,
                    turns: p.turns_taken
                },
                rating: {
                    before: p.rating_before,
                    after: p.rating_after,
                    change: p.rating_change
                }
            })),
            teams: matchData.teams
        };

        res.json({
            success: true,
            ...response
        });

    } catch (error) {
        console.error('Get match details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch match details',
            error: error.message
        });
    }
});

module.exports = router;
