/**
 * ELO Rating Service
 * Calculates rating changes for FFA and team-based matches
 */

/**
 * Calculate expected score for a player
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's current rating
 * @returns {number} Expected score (0 to 1)
 */
function calculateExpectedScore(playerRating, opponentRating) {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Standard ELO rating calculation (1v1)
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's current rating
 * @param {boolean} won - True if player won
 * @param {number} K - K-factor (default 32)
 * @returns {Object} { newRating, change }
 */
function calculateELO(playerRating, opponentRating, won, K = 32) {
    const expectedScore = calculateExpectedScore(playerRating, opponentRating);
    const actualScore = won ? 1 : 0;
    const change = Math.round(K * (actualScore - expectedScore));
    const newRating = playerRating + change; // No floor - can go negative

    return {
        newRating,
        change
    };
}

/**
 * Calculate rating changes for Free-For-All (FFA) matches
 * Compares each player against all others based on placement
 *
 * @param {Array} players - Array of { userId, username, rating, placement, stats }
 * @param {number} K - K-factor (default 24 for FFA)
 * @returns {Array} Array of { userId, ratingBefore, ratingAfter, ratingChange }
 */
function calculateFFARatings(players, K = 24) {
    const results = [];

    // For each player
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        let totalChange = 0;
        let comparisons = 0;

        // Compare against all other players
        for (let j = 0; j < players.length; j++) {
            if (i === j) continue;

            const opponent = players[j];

            // Did this player beat the opponent? (lower placement = better)
            const won = player.placement < opponent.placement;

            // Calculate ELO change for this comparison
            const expectedScore = calculateExpectedScore(player.rating, opponent.rating);
            const actualScore = won ? 1 : 0;
            const change = K * (actualScore - expectedScore);

            totalChange += change;
            comparisons++;
        }

        // Average change across all comparisons
        const averageChange = Math.round(totalChange / comparisons);
        const newRating = player.rating + averageChange; // No floor - can go negative

        results.push({
            userId: player.userId,
            username: player.username,
            placement: player.placement,
            ratingBefore: player.rating,
            ratingAfter: newRating,
            ratingChange: averageChange,
            stats: player.stats
        });
    }

    return results;
}

/**
 * Calculate team average rating
 * @param {Array} teamPlayers - Array of players with rating property
 * @returns {number} Average rating
 */
function calculateTeamRating(teamPlayers) {
    const total = teamPlayers.reduce((sum, player) => sum + player.rating, 0);
    return Math.round(total / teamPlayers.length);
}

/**
 * Calculate rating changes for team-based matches (1v1, 2v2, 3v3, 4v4)
 *
 * @param {Array} team1Players - Array of { userId, username, rating, stats }
 * @param {Array} team2Players - Array of { userId, username, rating, stats }
 * @param {boolean} team1Won - True if team 1 won
 * @param {number} K - K-factor (default 32)
 * @returns {Object} { team1Results, team2Results }
 */
function calculateTeamRatings(team1Players, team2Players, team1Won, K = 32) {
    // Calculate average team ratings
    const team1Rating = calculateTeamRating(team1Players);
    const team2Rating = calculateTeamRating(team2Players);

    // Calculate expected scores
    const team1Expected = calculateExpectedScore(team1Rating, team2Rating);
    const team2Expected = calculateExpectedScore(team2Rating, team1Rating);

    // Actual scores
    const team1Actual = team1Won ? 1 : 0;
    const team2Actual = team1Won ? 0 : 1;

    // Calculate base rating change
    const team1BaseChange = K * (team1Actual - team1Expected);
    const team2BaseChange = K * (team2Actual - team2Expected);

    // Apply to all team members
    const team1Results = team1Players.map(player => {
        const change = Math.round(team1BaseChange);
        const newRating = player.rating + change; // No floor - can go negative

        return {
            userId: player.userId,
            username: player.username,
            teamId: 1,
            placement: team1Won ? 1 : 2,
            ratingBefore: player.rating,
            ratingAfter: newRating,
            ratingChange: change,
            stats: player.stats
        };
    });

    const team2Results = team2Players.map(player => {
        const change = Math.round(team2BaseChange);
        const newRating = player.rating + change; // No floor - can go negative

        return {
            userId: player.userId,
            username: player.username,
            teamId: 2,
            placement: team1Won ? 2 : 1,
            ratingBefore: player.rating,
            ratingAfter: newRating,
            ratingChange: change,
            stats: player.stats
        };
    });

    return {
        team1Results,
        team2Results
    };
}

/**
 * Calculate rating changes for multi-team matches (3+ teams)
 * Each team is compared against all other teams based on placement
 *
 * @param {Array} teams - Array of { teamId, placement, players: [{ userId, username, rating, stats }] }
 * @param {number} K - K-factor (default 28)
 * @returns {Array} Array of player results
 */
function calculateMultiTeamRatings(teams, K = 28) {
    const allResults = [];

    // For each team
    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const teamRating = calculateTeamRating(team.players);
        let totalChange = 0;
        let comparisons = 0;

        // Compare against all other teams
        for (let j = 0; j < teams.length; j++) {
            if (i === j) continue;

            const opponentTeam = teams[j];
            const opponentRating = calculateTeamRating(opponentTeam.players);

            // Did this team beat the opponent team?
            const won = team.placement < opponentTeam.placement;

            // Calculate ELO change for this comparison
            const expectedScore = calculateExpectedScore(teamRating, opponentRating);
            const actualScore = won ? 1 : 0;
            const change = K * (actualScore - expectedScore);

            totalChange += change;
            comparisons++;
        }

        // Average change across all comparisons
        const averageChange = Math.round(totalChange / comparisons);

        // Apply to all team members
        team.players.forEach(player => {
            const newRating = player.rating + averageChange; // No floor - can go negative

            allResults.push({
                userId: player.userId,
                username: player.username,
                teamId: team.teamId,
                placement: team.placement,
                ratingBefore: player.rating,
                ratingAfter: newRating,
                ratingChange: averageChange,
                stats: player.stats
            });
        });
    }

    return allResults;
}

/**
 * Helper function to process match results and calculate ratings
 * Automatically detects match type and applies correct rating calculation
 *
 * @param {string} matchType - 'ffa', '1v1', '2v2', '3v3', '4v4'
 * @param {Array} participants - Array of participants with user data
 * @returns {Array} Array of rating results
 */
function processMatchRatings(matchType, participants) {
    switch (matchType) {
        case 'ffa':
            // FFA: Each player for themselves
            return calculateFFARatings(participants);

        case '1v1':
        case '2v2':
        case '3v3':
        case '4v4': {
            // Team-based: Split by teamId
            const teams = {};
            participants.forEach(p => {
                if (!teams[p.teamId]) {
                    teams[p.teamId] = [];
                }
                teams[p.teamId].push(p);
            });

            const teamArray = Object.keys(teams).map(teamId => ({
                teamId: parseInt(teamId),
                placement: teams[teamId][0].placement, // All team members have same placement
                players: teams[teamId]
            }));

            // Sort by placement
            teamArray.sort((a, b) => a.placement - b.placement);

            // If 2 teams (standard team match)
            if (teamArray.length === 2) {
                const team1Won = teamArray[0].placement < teamArray[1].placement;
                const result = calculateTeamRatings(
                    teamArray[0].players,
                    teamArray[1].players,
                    team1Won
                );
                return [...result.team1Results, ...result.team2Results];
            }

            // If 3+ teams (multi-team FFA)
            return calculateMultiTeamRatings(teamArray);
        }

        default:
            throw new Error(`Unknown match type: ${matchType}`);
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    calculateELO,
    calculateFFARatings,
    calculateTeamRatings,
    calculateMultiTeamRatings,
    processMatchRatings,
    calculateExpectedScore,
    calculateTeamRating
};
