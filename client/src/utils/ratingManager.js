/**
 * Rating Manager
 * Handles post-match rating calculations and updates
 */

import { SERVER_URL } from '../config.js';

class RatingManager {
    constructor() {
        this.apiUrl = `${SERVER_URL}/api`;
    }

    /**
     * Submit match results and calculate ratings
     * @param {object} matchData - Match data including participants and results
     * @returns {Promise<object>} Rating changes for each participant
     */
    async submitMatchResults(matchData) {
        try {
            const response = await fetch(`${this.apiUrl}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to submit match results');
            }

            return {
                success: true,
                matchId: data.match.id,
                ratingChanges: data.participants,
                teams: data.teams
            };

        } catch (error) {
            console.error('Submit match results error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build match data from game results
     * @param {string} matchType - 'ffa', '1v1', '2v2', etc.
     * @param {Array} players - Array of player objects with stats
     * @param {number} duration - Match duration in seconds
     * @param {number} totalTurns - Total turns taken
     * @returns {object} Formatted match data for API
     */
    buildMatchData(matchType, players, duration, totalTurns) {
        // Sort players by placement (1 = winner)
        const sortedPlayers = [...players].sort((a, b) => a.placement - b.placement);

        const participants = sortedPlayers.map(player => ({
            userId: player.userId,
            teamId: player.teamId || null,
            placement: player.placement,
            stats: {
                kills: player.kills || 0,
                damage: player.damageDealt || 0,
                turns: player.turns || 0
            }
        }));

        const matchData = {
            matchType: matchType.toLowerCase(),
            duration: duration,
            totalTurns: totalTurns,
            participants: participants
        };

        // Add teams data for team matches
        if (matchType !== 'ffa' && matchType !== 'FFA') {
            matchData.teams = this.buildTeamsData(sortedPlayers);
        }

        return matchData;
    }

    /**
     * Build teams data from players
     * @param {Array} players - Sorted players array
     * @returns {Array} Teams data
     */
    buildTeamsData(players) {
        const teamsMap = {};

        players.forEach(player => {
            const teamId = player.teamId;
            if (!teamsMap[teamId]) {
                teamsMap[teamId] = {
                    teamId: teamId,
                    teamName: `Team ${teamId}`,
                    teamColor: player.teamColor || '#FFFFFF',
                    won: player.placement === 1,
                    stats: {
                        kills: 0,
                        damage: 0
                    }
                };
            }

            teamsMap[teamId].stats.kills += player.kills || 0;
            teamsMap[teamId].stats.damage += player.damageDealt || 0;
        });

        return Object.values(teamsMap);
    }

    /**
     * Calculate leaderboard position changes
     * @param {Array} ratingChanges - Rating changes from server
     * @param {Array} leaderboard - Current leaderboard data
     * @returns {object} Map of userId to old/new rank
     */
    calculateRankChanges(ratingChanges, leaderboard) {
        const rankChanges = {};

        ratingChanges.forEach(change => {
            // Find old rank
            const oldRankIndex = leaderboard.findIndex(p => p.id === change.userId);
            const oldRank = oldRankIndex !== -1 ? oldRankIndex + 1 : null;

            // Calculate new rank (approximation based on new rating)
            let newRank = oldRank;
            if (leaderboard.length > 0) {
                newRank = leaderboard.filter(p => p.rating > change.ratingAfter).length + 1;
            }

            rankChanges[change.userId] = {
                oldRank: oldRank,
                newRank: newRank,
                rankChange: oldRank && newRank ? oldRank - newRank : 0
            };
        });

        return rankChanges;
    }

    /**
     * Get fresh leaderboard data
     * @returns {Promise<Array>} Leaderboard data
     */
    async getLeaderboard() {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard?limit=100`);
            const data = await response.json();

            if (data.success) {
                return data.leaderboard;
            }

            return [];
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return [];
        }
    }

    /**
     * Get user profile data
     * @param {string} userId - User ID
     * @returns {Promise<object>} User profile
     */
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard/profile/${userId}`);
            const data = await response.json();

            if (data.success) {
                return data.profile;
            }

            return null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
}

// Export singleton instance
export const ratingManager = new RatingManager();
