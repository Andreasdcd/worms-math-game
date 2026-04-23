# Rating System Testing Quick Start

## Prerequisites

1. Server running: `cd server && npm start`
2. Client running: `cd client && npm start`
3. Database connected (Supabase)
4. GameScene integrated (see `RATING_INTEGRATION_GUIDE.md`)

## Quick Test Scenarios

### Test 1: First Match (5 min)

**Goal:** Verify rating starts at 0 and updates correctly

```bash
# Steps:
1. Open http://localhost:8080
2. Create new user "TestUser1"
3. Verify top-left shows: "Din rating: 0"
4. Play a practice match (GameScene)
5. Win the match
6. VictoryScene should show:
   ✓ "Første kamp!" message
   ✓ "Din rating: 0 → 15 (+15)" (approximate)
   ✓ Green +15 floats upward
7. Click "Play Again"
8. Back in lobby, verify:
   ✓ "Din rating: 15" in top-left
   ✓ User appears in leaderboard
```

**Expected Results:**
- Initial rating: 0
- First match bonus: +10 to +20 (depending on opponent)
- "Første kamp!" message displays
- Leaderboard updates

---

### Test 2: Multiple Players (10 min)

**Goal:** Verify privacy rules and leaderboard

```bash
# Steps:
1. Open 3 browser windows
2. Create users:
   - Window 1: "Alice"
   - Window 2: "Bob"
   - Window 3: "Charlie"
3. All start at rating 0
4. Play FFA match (4th player can be test player)
5. Results: Alice 1st, Bob 2nd, Charlie 3rd

# In VictoryScene:
- Alice sees: "Din rating: 0 → 18 (+18)"
- Bob sees: "Din rating: 0 → 5 (+5)"
- Charlie sees: "Din rating: 0 → -8 (-8)"

# Privacy Check:
- Alice window: Shows "Din rating: 0 → 18"
  - Other players: "#2", "#3" (NO rating numbers!)
- Bob window: Shows "Din rating: 0 → 5"
  - Other players: "#1", "#3" (NO rating numbers!)
- Charlie window: Shows "Din rating: 0 → -8"
  - Other players: "#1", "#2" (NO rating numbers!)

# Back in lobby:
- Check leaderboard shows:
  ✓ #1 Alice - 1 match - 1-0 - K/D
  ✓ #2 Bob - 1 match - 0-1 - K/D
  ✓ #3 Charlie - 1 match - 0-1 - K/D
- NO rating numbers in leaderboard!
- Each user's row highlighted in yellow
```

**Expected Results:**
- Winner gains most rating
- 2nd place gains some rating
- 3rd place can lose rating
- Privacy: Only own rating visible
- Leaderboard: No rating numbers shown

---

### Test 3: Negative Rating (5 min)

**Goal:** Verify ratings can go negative

```bash
# Steps:
1. Create user "Loser"
2. Lose 3-4 matches in a row
3. Watch rating: 0 → -5 → -15 → -25

# In VictoryScene:
- After 1st loss: "Din rating: 0 → -5 (-5)"
- After 2nd loss: "Din rating: -5 → -15 (-10)"
- Red numbers float upward

# In lobby:
- Top-left shows: "Din rating: -25"
- Negative number displays correctly
- User still appears in leaderboard
```

**Expected Results:**
- Ratings can go negative
- No floor at 0
- Negative numbers display correctly
- System handles negative ratings

---

### Test 4: Big Upset (5 min)

**Goal:** Verify "Kæmpe sejr!" message

```bash
# Steps:
1. Create user "Underdog" (rating 0)
2. Create user "Champion" (rating 100+)
   - To get Champion to 100: Win 6-7 matches
3. Play 1v1: Underdog vs Champion
4. Underdog wins!

# In VictoryScene:
- Underdog sees:
  ✓ "Din rating: 0 → 45 (+45)"
  ✓ "Kæmpe sejr!" message (because +45 >= 40)
- Champion sees:
  ✓ "Din rating: 100 → 55 (-45)"
  ✓ "Kæmpe tab!" message
```

**Expected Results:**
- Large rating swings for upsets
- Special messages for |change| >= 40
- ELO system working correctly

---

### Test 5: Leaderboard Top 20 (10 min)

**Goal:** Verify leaderboard displays correctly

```bash
# Steps:
1. Create 25 test users
2. Have them play matches (randomized results)
3. Check lobby leaderboard shows:
   ✓ Top 20 players only
   ✓ Columns: Rank, Username, Matches, W-L, K/D
   ✓ NO rating numbers
   ✓ Sorted by rating (high to low)

# If current user is #1-#20:
- Row highlighted in yellow
- All stats visible

# If current user is #21-#25:
- Top 20 shown normally
- Bottom shows: "... #23 (Du)"
- User's row highlighted
```

**Expected Results:**
- Leaderboard shows top 20
- Current user highlighted
- If outside top 20, shown at bottom
- No rating numbers anywhere

---

### Test 6: Rating Animations (3 min)

**Goal:** Verify animations work smoothly

```bash
# Steps:
1. Win a match
2. In VictoryScene, watch:
   ✓ Green "+15" appears
   ✓ Floats upward 40px
   ✓ Fades to alpha 0
   ✓ Takes ~1.5 seconds
   ✓ Slight scale pulse (1.0 → 1.3 → 1.0)

3. Return to lobby
4. Watch top-left rating:
   ✓ "+15" floats from rating text
   ✓ Rating updates immediately
   ✓ Smooth animation

5. Lose a match
6. Watch red "-12" animation
   ✓ Same behavior, red color
```

**Expected Results:**
- Smooth floating animations
- Color-coded (green = gain, red = loss)
- Scale pulse effect
- No jitter or stuttering

---

## Browser DevTools Checks

### Console Logs to Watch For

```javascript
// Good logs:
✓ "Game Over!"
✓ "Submitting match results: {...}"
✓ "Rating changes: [...]"

// Error logs to investigate:
✗ "Failed to submit match results"
✗ "Error submitting match results"
✗ "Leaderboard error"
```

### Network Tab

```bash
# Check these API calls:
POST http://localhost:3000/api/matches
  Status: 201 Created
  Response: { success: true, participants: [...] }

GET http://localhost:3000/api/leaderboard?limit=20
  Status: 200 OK
  Response: { success: true, leaderboard: [...] }

GET http://localhost:3000/api/leaderboard/profile/:userId
  Status: 200 OK
  Response: { success: true, profile: {...} }
```

### localStorage

```javascript
// Check localStorage in DevTools:
localStorage.getItem('wormsUser')

// Should contain:
{
  "id": "user-uuid",
  "username": "Alice",
  "rating": 15,  // Updates after each match
  "matches_played": 1,
  "matches_won": 1
}
```

---

## Common Issues

### Issue: Rating doesn't update
**Solution:**
1. Check console for errors
2. Verify GameScene calls `ratingManager.submitMatchResults()`
3. Check network tab for POST /api/matches
4. Verify server is running

### Issue: "Henter ratings..." never goes away
**Solution:**
1. GameScene not passing `ratingChanges` to VictoryScene
2. API call failed (check console)
3. Match data malformed

### Issue: Leaderboard empty
**Solution:**
1. No users have played matches yet
2. Database connection issue
3. Check GET /api/leaderboard response

### Issue: All players see rating numbers
**Solution:**
1. `currentUserId` not passed to VictoryScene
2. Check `data.currentUserId` in VictoryScene.init()
3. Verify `isCurrentUser` condition

### Issue: Negative rating shows as 0
**Solution:**
1. Check ratingService.js still has `Math.max(0, ...)`
2. Should be removed (Stream 7 changes)
3. Verify constants.js has `MIN_RATING: null`

---

## Performance Testing

### Load Test (Optional)
```bash
# Test with many users:
1. Create 50+ users
2. Simulate concurrent matches
3. Verify leaderboard updates correctly
4. Check API response times (<200ms)
```

### Stress Test (Optional)
```bash
# Test rapid matches:
1. Play 10 matches in a row quickly
2. Verify ratings update correctly
3. Check for race conditions
4. Ensure localStorage syncs
```

---

## Success Checklist

After testing, verify:

- [ ] Rating starts at 0 for new users
- [ ] Rating can go negative
- [ ] "Første kamp!" shows for first match
- [ ] "Kæmpe sejr!" shows for big wins (+40)
- [ ] Only current user sees own rating number
- [ ] Other players see placement only (#1, #2, #3)
- [ ] Leaderboard shows top 20
- [ ] Leaderboard columns: Rank, Username, Matches, W-L, K/D
- [ ] NO rating numbers in leaderboard
- [ ] Current user's row highlighted yellow
- [ ] User outside top 20 shows at bottom
- [ ] Rating animations smooth (green/red, floating)
- [ ] Lobby rating updates after match
- [ ] Auto-refresh leaderboard (30s)
- [ ] Privacy rules enforced everywhere

---

## Debugging Tips

### Enable Verbose Logging

Add to GameScene.endGame():
```javascript
console.log('Match data:', matchData);
console.log('Rating changes:', ratingChanges);
console.log('Leaderboard changes:', leaderboardChanges);
```

Add to VictoryScene.displayRatingChanges():
```javascript
console.log('Displaying ratings for:', this.ratingChanges);
console.log('Current user ID:', this.currentUserId);
```

### Test API Directly

```bash
# Test match submission:
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "matchType": "ffa",
    "duration": 120,
    "totalTurns": 10,
    "participants": [
      {
        "userId": "user-uuid-1",
        "teamId": null,
        "placement": 1,
        "stats": {"kills": 3, "damage": 450, "turns": 4}
      },
      {
        "userId": "user-uuid-2",
        "teamId": null,
        "placement": 2,
        "stats": {"kills": 2, "damage": 300, "turns": 4}
      }
    ]
  }'

# Expected: 201 Created with rating changes
```

---

## Report Template

After testing, fill out:

```markdown
## Rating System Test Report

**Date:** [Date]
**Tester:** [Your Name]
**Build:** Stream 7 Rating System

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| First Match (rating 0) | ✅/❌ | |
| Multiple Players | ✅/❌ | |
| Negative Rating | ✅/❌ | |
| Big Upset | ✅/❌ | |
| Leaderboard Top 20 | ✅/❌ | |
| Rating Animations | ✅/❌ | |
| Privacy Rules | ✅/❌ | |

### Issues Found

1. [Issue description]
   - Severity: High/Medium/Low
   - Reproduction steps: ...
   - Expected: ...
   - Actual: ...

### Recommendations

- [Improvement suggestions]
- [Feature requests]
- [Performance notes]

### Sign-off

- [ ] All critical tests pass
- [ ] Privacy rules verified
- [ ] Ready for production

**Tester Signature:** _______________
```

---

That's it! You're ready to test the rating system. Start with Test 1 (First Match) and work your way through the scenarios. Good luck! 🎮📊
