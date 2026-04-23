# Rating System Integration Guide (Stream 7)

## Overview
This guide explains how to integrate the rating system into the GameScene to calculate and display post-match ratings.

## Files Modified

### 1. `client/src/utils/ratingManager.js` (NEW)
- Created utility for submitting match results
- Handles API calls to POST /api/matches
- Calculates leaderboard rank changes

### 2. `client/src/scenes/VictoryScene.js` (UPDATED)
- Added rating change display with animations
- Shows current user's rating number
- Shows other players' placement changes only
- Special messages for first match and big upsets

### 3. `client/src/scenes/LobbyScene.js` (UPDATED)
- Enhanced leaderboard display (Top 20)
- Rating display in top-left corner with animations
- Shows: Rank, Username, Matches, W-L, K/D
- Highlights current user's row
- If not in top 20, shows "... #47 (Du)" at bottom

### 4. `shared/constants.js` (UPDATED)
- Changed INITIAL_RATING from 1000 to 0
- Removed MIN_RATING floor (allows negative ratings)

### 5. `server/services/ratingService.js` (UPDATED)
- Removed Math.max(0, ...) floor on all rating calculations
- Ratings can now go negative as per requirements

## GameScene Integration Steps

The GameScene needs to be updated to submit match results after the game ends. Follow these steps:

### Step 1: Import the Rating Manager

At the top of `client/src/scenes/GameScene.js`, add:

```javascript
// Add at the top with other imports (if using modules)
import { ratingManager } from '../utils/ratingManager.js';

// OR if using script tags, ratingManager will be available globally
```

### Step 2: Track Match Metadata

In the `init()` method, add match tracking:

```javascript
init() {
    // ... existing code ...

    // Match statistics
    this.matchStats = {};

    // ADD THESE NEW PROPERTIES:
    this.matchStartTime = null;
    this.totalTurns = 0;
    this.matchType = 'ffa'; // Or get from init data
    this.currentUserId = null; // Pass from lobby
}
```

### Step 3: Start Match Timer

In the `create()` method:

```javascript
create() {
    // ... existing code ...

    // ADD: Start match timer
    this.matchStartTime = Date.now();

    // Get current user ID from localStorage
    const storedUser = localStorage.getItem('wormsUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserId = user.id;
    }
}
```

### Step 4: Track Turns

In your turn handling code (wherever you increment turns):

```javascript
// When a turn ends:
this.totalTurns++;
```

### Step 5: Update endGame() Method

Replace the existing `endGame()` method with this enhanced version:

```javascript
/**
 * End game and show victory screen with rating calculations
 * @param {object} teamAlive - Map of team IDs to alive players
 */
async endGame(teamAlive) {
    console.log('Game Over!');
    this.gameEnded = true;

    // Stop turn timer
    if (this.turnTimer) {
        this.turnTimer.remove();
    }

    // Determine winner
    const winningTeamId = Object.keys(teamAlive)[0];
    const winningPlayers = teamAlive[winningTeamId] || [];
    const winner = winningPlayers.length > 0 ?
        winningPlayers[0].assignedName :
        'No one';

    const teamColor = winningPlayers.length > 0 ?
        winningPlayers[0].teamColor :
        '#FFFFFF';

    // Update final stats and assign placements
    let placement = 1;
    const playersByTeam = {};

    // Group players by team
    this.players.forEach(player => {
        const teamId = player.teamId || player.assignedName; // FFA uses name as team
        if (!playersByTeam[teamId]) {
            playersByTeam[teamId] = [];
        }
        playersByTeam[teamId].push(player);
    });

    // Assign placements (1st place = winner, others ranked by HP remaining)
    const teamsWithHP = Object.entries(playersByTeam).map(([teamId, players]) => {
        const totalHP = players.reduce((sum, p) => sum + Math.max(0, p.hp), 0);
        const isWinner = teamId === winningTeamId.toString();
        return { teamId, players, totalHP, isWinner };
    });

    // Sort teams by winner first, then by HP
    teamsWithHP.sort((a, b) => {
        if (a.isWinner) return -1;
        if (b.isWinner) return 1;
        return b.totalHP - a.totalHP;
    });

    // Assign placements
    const playersWithPlacements = [];
    teamsWithHP.forEach((team, index) => {
        const teamPlacement = index + 1;
        team.players.forEach(player => {
            if (this.matchStats[player.assignedName]) {
                this.matchStats[player.assignedName].finalHp = player.hp;
            }

            playersWithPlacements.push({
                userId: player.userId || player.assignedName, // Use name as fallback for test
                username: player.assignedName,
                teamId: player.teamId || null,
                teamColor: player.teamColor,
                placement: teamPlacement,
                kills: this.matchStats[player.assignedName]?.kills || 0,
                damageDealt: this.matchStats[player.assignedName]?.damageDealt || 0,
                turns: this.matchStats[player.assignedName]?.turns || 0,
                finalHp: player.hp
            });
        });
    });

    // Calculate match duration
    const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);

    // Convert matchStats object to array for VictoryScene
    const statsArray = Object.values(this.matchStats);

    // Submit match results and get rating changes
    let ratingChanges = null;
    let leaderboardChanges = null;

    try {
        // Build match data
        const matchData = ratingManager.buildMatchData(
            this.matchType,
            playersWithPlacements,
            duration,
            this.totalTurns
        );

        console.log('Submitting match results:', matchData);

        // Submit to server
        const result = await ratingManager.submitMatchResults(matchData);

        if (result.success) {
            console.log('Rating changes:', result.ratingChanges);
            ratingChanges = result.ratingChanges;

            // Get leaderboard for rank calculations
            const leaderboard = await ratingManager.getLeaderboard();
            leaderboardChanges = ratingManager.calculateRankChanges(
                ratingChanges,
                leaderboard
            );

            // Update localStorage with new rating for current user
            const storedUser = localStorage.getItem('wormsUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const userRatingChange = ratingChanges.find(r => r.userId === user.id);
                if (userRatingChange) {
                    user.rating = userRatingChange.rating.after;
                    localStorage.setItem('wormsUser', JSON.stringify(user));
                }
            }
        } else {
            console.error('Failed to submit match results:', result.error);
        }
    } catch (error) {
        console.error('Error submitting match results:', error);
    }

    // Wait a moment, then show victory screen
    this.time.delayedCall(2000, () => {
        this.scene.start('VictoryScene', {
            winner: winner,
            teamId: winningTeamId,
            teamColor: teamColor,
            matchStats: statsArray,
            ratingChanges: ratingChanges,
            currentUserId: this.currentUserId,
            leaderboardChanges: leaderboardChanges
        });
    });
}
```

### Step 6: Ensure Player Objects Have Required Data

Make sure your player creation includes userId and teamId:

```javascript
// When creating test players or real players:
const player = {
    userId: userData.id,          // User ID from database
    assignedName: userData.username,
    teamId: teamNumber,           // 1, 2, 3, 4 or null for FFA
    teamColor: TEAM_COLORS[teamNumber],
    hp: 100,
    // ... other properties
};
```

## Testing the Integration

### Test Case 1: First Match
1. Create new user (rating = 0)
2. Play a match and win
3. Verify VictoryScene shows:
   - "Første kamp!" message
   - Rating change (e.g., 0 → 15)
   - Placement displayed

### Test Case 2: Rating Gain
1. Play match as lower-rated player
2. Win against higher-rated opponent
3. Verify positive rating change (+15 to +30)
4. Verify "Kæmpe sejr!" if change >= 40

### Test Case 3: Rating Loss
1. Play match as higher-rated player
2. Lose to lower-rated opponent
3. Verify negative rating change shown in red
4. Verify rating can go negative

### Test Case 4: Leaderboard Updates
1. Complete match
2. Return to lobby
3. Verify leaderboard shows updated rankings
4. Verify user's rating in top-left corner updated
5. Verify placement highlighted in yellow

### Test Case 5: Multiple Players
1. 4-player FFA match
2. Verify each player sees:
   - Own rating number
   - Others' placements only
   - Rank changes (#5 → #3 etc.)

## API Endpoints Used

- `POST /api/matches` - Submit match results, returns rating changes
- `GET /api/leaderboard?limit=20` - Get top 20 players
- `GET /api/leaderboard/profile/:userId` - Get user profile

## Data Flow

```
GameScene.endGame()
    ↓
Build match data (players, stats, placements)
    ↓
ratingManager.submitMatchResults()
    ↓
POST /api/matches → Server calculates ELO ratings
    ↓
Response: { participants: [{ ratingBefore, ratingAfter, ratingChange }] }
    ↓
Calculate leaderboard rank changes
    ↓
Pass to VictoryScene with:
  - ratingChanges (for display)
  - currentUserId (to identify user's rating)
  - leaderboardChanges (for rank arrows)
    ↓
VictoryScene displays:
  - User: "Din rating: 47 → 62 (+15)"
  - Others: "#2 ▲1 (+12 rating)"
    ↓
Return to LobbyScene
    ↓
Leaderboard refreshes automatically
Rating display updates with animation
```

## Privacy Rules

**IMPORTANT:** Only show rating numbers for the current user.

- Current user sees: "Din rating: 47 → 62 (+15)"
- Other players see: "#2 ▲1" (placement only, no rating number)
- Leaderboard shows: Rank, Username, Matches, W-L, K/D (NO rating numbers)

## Edge Cases Handled

1. **First match (rating = 0):** Shows "Første kamp!" message
2. **Big upset (|change| >= 40):** Shows "Kæmpe sejr!" or "Kæmpe tab!"
3. **Negative rating:** Displays correctly (e.g., "-15")
4. **User not in top 20:** Shows "... #47 (Du)" at bottom of leaderboard
5. **Network error:** Gracefully falls back, game still shows victory screen

## Files Ready

✅ VictoryScene.js - Rating display with animations
✅ LobbyScene.js - Enhanced leaderboard (Top 20, W-L, K/D)
✅ ratingManager.js - API integration utility
✅ ratingService.js - Server-side ELO calculations (Stream 5)
✅ constants.js - Rating starts at 0, no floor
⚠️ GameScene.js - NEEDS INTEGRATION (follow steps above)

## Next Steps

1. Apply the GameScene.endGame() update shown in Step 5
2. Test with 2-4 players
3. Verify rating calculations are correct
4. Verify privacy rules (only own rating visible)
5. Test edge cases (first match, negative rating)

That's it! The rating system is complete once GameScene is integrated.
