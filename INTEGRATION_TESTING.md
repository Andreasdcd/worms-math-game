# Integration Testing Guide

Comprehensive testing scenarios for the Worms Math Game end-to-end flow.

## Table of Contents
- [Testing Environment Setup](#testing-environment-setup)
- [Test Scenarios](#test-scenarios)
- [Test Execution Log](#test-execution-log)

---

## Testing Environment Setup

### Prerequisites

- 2-4 browser windows/tabs (or separate devices)
- Multiple test accounts created
- Server running (local or deployed)
- Database seeded with quiz questions

### Test Accounts

Create these test accounts before testing:

| Username | Password | Purpose |
|----------|----------|---------|
| testplayer1 | test123 | Primary tester |
| testplayer2 | test123 | Second player |
| testplayer3 | test123 | Third player (FFA) |
| testplayer4 | test123 | Fourth player (FFA) |
| teacher1 | test123 | Teacher dashboard access |

---

## Test Scenarios

### Scenario 1: End-to-End Flow (2 Players)

**Objective:** Verify complete game flow from login to victory

**Setup:**
- Open 2 browser tabs (Tab A & Tab B)
- Both tabs on login screen

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Tab A: Login as testplayer1 | Redirects to lobby, shows leaderboard | [ ] |
| 2 | Tab B: Login as testplayer2 | Redirects to lobby | [ ] |
| 3 | Tab A: Click "Find Match" → "1v1" | Shows "Searching..." | [ ] |
| 4 | Tab B: Click "Find Match" → "1v1" | Both tabs match together | [ ] |
| 5 | Verify waiting room shows both players | Both names visible, ready buttons shown | [ ] |
| 6 | Tab A: Click "KLAR" (Ready) | Green checkmark appears | [ ] |
| 7 | Tab B: Click "KLAR" (Ready) | Countdown starts (5 seconds) | [ ] |
| 8 | Wait for countdown | Quiz scene loads on both tabs | [ ] |
| 9 | Both players answer 5 questions | Questions sync, timer visible | [ ] |
| 10 | Quiz completes | Transition to game scene | [ ] |
| 11 | Verify turn order | Player with more correct answers goes first | [ ] |
| 12 | Active player: Aim and fire (SPACE) | Projectile launches | [ ] |
| 13 | Other tab: See projectile | Projectile synced across clients | [ ] |
| 14 | Projectile explodes | Explosion visible on both tabs | [ ] |
| 15 | Verify damage applied | HP bars update on both tabs | [ ] |
| 16 | Turn advances automatically | Next player's turn starts | [ ] |
| 17 | Continue until one player dies | Game ends, winner announced | [ ] |
| 18 | Verify victory screen | Shows winner, stats, ratings | [ ] |
| 19 | Check rating changes | Winner gains rating, loser loses rating | [ ] |
| 20 | Click "Return to Lobby" | Both return to lobby | [ ] |
| 21 | Verify leaderboard updated | Ratings reflect match results | [ ] |

**Pass Criteria:** All 21 steps pass without errors

---

### Scenario 2: Free-For-All (4 Players)

**Objective:** Verify 4-player FFA match

**Setup:**
- Open 4 browser tabs
- All logged in as different players

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | All 4 players: Find Match → "FFA" | All match together | [ ] |
| 2 | All players: Ready up | Countdown starts | [ ] |
| 3 | Complete quiz | All 4 players answer questions | [ ] |
| 4 | Game starts | 4 worms spawn on terrain | [ ] |
| 5 | Turn order displayed | Based on quiz scores | [ ] |
| 6 | Each player takes turn | Turns cycle through all players | [ ] |
| 7 | Player gets killed | That player skipped in turn order | [ ] |
| 8 | 3 players remain | Game continues | [ ] |
| 9 | 2 players remain | Game continues | [ ] |
| 10 | 1 player remains | Game ends, winner declared | [ ] |
| 11 | Victory screen shows placements | 1st, 2nd, 3rd, 4th places shown | [ ] |
| 12 | Rating changes displayed | All 4 players see rating changes | [ ] |
| 13 | Return to lobby | Leaderboard updates for all | [ ] |

**Pass Criteria:** All 13 steps pass, all 4 players synced

---

### Scenario 3: Quiz System Verification

**Objective:** Verify quiz functionality and turn order logic

**Setup:**
- 2 players matched together

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Quiz starts | Timer shows 60 seconds | [ ] |
| 2 | Player 1: Answer question correctly | Answer highlights green | [ ] |
| 3 | Player 1: Answer question incorrectly | Answer highlights red, correct shown | [ ] |
| 4 | Player 2: Answer slower | Completion sidebar updates | [ ] |
| 5 | Timer reaches 0 | Quiz auto-submits remaining questions | [ ] |
| 6 | Player 1: 5 correct, Player 2: 3 correct | Player 1 goes first in game | [ ] |
| 7 | Verify turn order announcement | "Player1's Turn" shown first | [ ] |

**Pass Criteria:** Turn order correctly reflects quiz performance

---

### Scenario 4: Teacher Dashboard

**Objective:** Verify teacher dashboard functionality

**Setup:**
- Multiple matches completed (from previous tests)
- Login as teacher1

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Login as teacher1 | Teacher dashboard loads | [ ] |
| 2 | Verify student list | Shows all registered students | [ ] |
| 3 | Click on a student | Shows detailed stats | [ ] |
| 4 | Check match history | Shows recent matches | [ ] |
| 5 | Check quiz accuracy | Shows % correct for math topics | [ ] |
| 6 | Check combat stats | Shows damage dealt, accuracy, etc. | [ ] |
| 7 | Export data (if available) | CSV/JSON export works | [ ] |
| 8 | Filter by date range | Shows matches in date range | [ ] |
| 9 | Filter by student | Shows only that student's matches | [ ] |

**Pass Criteria:** All stats accurate, filters work

---

### Scenario 5: Rating System

**Objective:** Verify ELO rating calculations

**Setup:**
- Create 2 new test accounts (rating = 0)

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Both players: rating = 0 | Leaderboard shows "0" | [ ] |
| 2 | Player 1 wins first match | Victory screen shows "Første kamp!" | [ ] |
| 3 | Player 1 rating change | Shows positive change (e.g., +15) | [ ] |
| 4 | Player 2 rating change | Shows negative change (e.g., -15) | [ ] |
| 5 | Check leaderboard | Ratings updated correctly | [ ] |
| 6 | High-rated player vs low-rated | High-rated loses: big rating loss | [ ] |
| 7 | Low-rated wins upset | Shows "Kæmpe sejr!" (if change ≥ 40) | [ ] |
| 8 | Verify negative ratings allowed | Player can have negative rating | [ ] |
| 9 | Check placement arrows | Victory screen shows rank change arrows | [ ] |

**Pass Criteria:** Ratings calculate correctly, privacy rules followed

---

### Scenario 6: Disconnect Handling

**Objective:** Verify graceful handling of player disconnects

**Setup:**
- 2 players in a match

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Match in progress | Both players connected | [ ] |
| 2 | Player 1: Close browser tab | Server detects disconnect | [ ] |
| 3 | Player 2: See disconnect message | "Player1 lost connection" | [ ] |
| 4 | Wait 30 seconds | Player 1 not reconnecting | [ ] |
| 5 | Player 2 declared winner | Match ends, victory screen shown | [ ] |
| 6 | Player 1: Reopen tab, login | Can join new match | [ ] |

**Pass Criteria:** Disconnect handled gracefully, no crashes

---

### Scenario 7: Edge Cases

**Objective:** Test unusual situations

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Try to join full room | Shows "Room full" error | [ ] |
| 2 | Leave waiting room before match | Removed from room cleanly | [ ] |
| 3 | Don't ready up in waiting room | Kicked after timeout (if implemented) | [ ] |
| 4 | Fire weapon with 0 power | Projectile barely moves | [ ] |
| 5 | Fire weapon straight down | Damages own player | [ ] |
| 6 | Two explosions simultaneously | Both calculated correctly | [ ] |
| 7 | Match with all players same HP | Tie-breaker logic (if implemented) | [ ] |

**Pass Criteria:** No crashes, errors handled gracefully

---

### Scenario 8: Mobile Responsiveness

**Objective:** Verify game works on mobile devices

**Setup:**
- Test on mobile device or browser DevTools mobile view

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Open on mobile browser | Login screen visible | [ ] |
| 2 | Login | Keyboard doesn't obstruct form | [ ] |
| 3 | Lobby view | Leaderboard fits screen | [ ] |
| 4 | Find match | Buttons large enough to tap | [ ] |
| 5 | Quiz on mobile | Questions readable | [ ] |
| 6 | Answer quiz | Touch targets work | [ ] |
| 7 | Game scene | Controls accessible | [ ] |
| 8 | Aim with touch | Touch drag to aim works | [ ] |
| 9 | Fire weapon | Touch works for spacebar equivalent | [ ] |
| 10 | Victory screen | Text fits screen | [ ] |

**Pass Criteria:** Fully playable on mobile

---

### Scenario 9: Performance Test

**Objective:** Verify performance under load

**Setup:**
- 8 browser tabs (4 matches running simultaneously)

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Start 4 concurrent matches | Server handles all 8 connections | [ ] |
| 2 | Monitor server CPU/memory | Stays within limits | [ ] |
| 3 | All matches: Complete quiz | No lag or timeout | [ ] |
| 4 | All matches: Play game | Projectiles sync correctly | [ ] |
| 5 | Check browser performance | FPS stays above 30 | [ ] |
| 6 | Monitor network traffic | WebSocket messages < 100 KB/s per client | [ ] |

**Pass Criteria:** Server stable, clients responsive

---

### Scenario 10: Security & Privacy

**Objective:** Verify security measures

**Steps:**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Try to access game without login | Redirects to login | [ ] |
| 2 | Check ratings in Victory screen | Only current user sees their rating number | [ ] |
| 3 | Other players' ratings | Only see placement (#1, #2), not number | [ ] |
| 4 | Leaderboard | Shows rank, username, W-L, K/D (NO rating numbers) | [ ] |
| 5 | Try to manipulate client state | Server validates all actions | [ ] |
| 6 | Inject invalid quiz answers | Server rejects invalid data | [ ] |
| 7 | Try to fire on other player's turn | Server rejects action | [ ] |

**Pass Criteria:** Privacy rules enforced, no exploits

---

## Test Execution Log

**Date:** _________________

**Tester:** _________________

**Environment:** [ ] Local [ ] Deployed

**Summary:**

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1. End-to-End Flow | [ ] | |
| 2. Free-For-All | [ ] | |
| 3. Quiz System | [ ] | |
| 4. Teacher Dashboard | [ ] | |
| 5. Rating System | [ ] | |
| 6. Disconnect Handling | [ ] | |
| 7. Edge Cases | [ ] | |
| 8. Mobile Responsiveness | [ ] | |
| 9. Performance Test | [ ] | |
| 10. Security & Privacy | [ ] | |

**Overall Status:** [ ] Pass [ ] Fail

**Bugs Found:**
1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

**Recommendations:**
1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

---

## Automated Testing (Future Enhancement)

For production, consider adding:

- **Unit tests** (Jest): Test individual functions
- **Integration tests** (Jest + Supertest): Test API endpoints
- **E2E tests** (Playwright/Cypress): Automate browser testing
- **Load testing** (Artillery/k6): Test server under load

---

## Reporting Bugs

When reporting bugs, include:

1. **Scenario** where bug occurred
2. **Steps to reproduce**
3. **Expected result**
4. **Actual result**
5. **Browser** and version
6. **Screenshots** or video
7. **Console errors** (F12 → Console tab)

---

**Last Updated:** 2026-04-23

**Version:** 1.0
