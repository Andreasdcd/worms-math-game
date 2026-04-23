# User Manual - Worms Math Game

## For Students (Players)

### Getting Started

#### 1. Create an Account

1. Open the game website
2. Click **"Log Ind"** (Login)
3. Don't have an account? Enter:
   - **Brugernavn** (Username)
   - **Adgangskode** (Password)
4. Click **"Opret Konto"** (Create Account)
5. You're in!

#### 2. Navigate the Lobby

After logging in, you'll see:

- **Your Rating** (top-left) - Starts at 0
- **Leaderboard** - Top 20 players
- **Find Match** button - Start matchmaking
- **Teacher Dashboard** button (if you're a teacher)

### Playing a Match

#### Step 1: Find Match

1. Click **"Find Match"**
2. Choose game mode:
   - **1v1** - One vs one
   - **FFA** - Free for all (up to 8 players)
   - **2v2** - Team battle (coming soon)

#### Step 2: Waiting Room

1. Wait for other players to join
2. Click **"KLAR"** (Ready) when you're ready
3. When all players are ready, countdown starts
4. **5... 4... 3... 2... 1... START!**

#### Step 3: Quiz Phase (60 seconds)

**Goal:** Answer math questions correctly and quickly!

- **Timer** shows remaining time (top-right)
- **Question** appears in center
- **4 answer buttons** (A, B, C, D)
- **Completion sidebar** (left) shows who's finished

**Tips:**
- Correct answers = earlier turns in game
- Speed matters! Finish quickly
- Wrong answers are okay, just keep going

**Controls:**
- Click answer button with mouse
- Or press keyboard: **A**, **B**, **C**, **D**

#### Step 4: Game (Artillery Combat)

**Goal:** Be the last worm standing!

**Your Turn:**

1. **Aim** - Move mouse to aim at opponent
   - Yellow arrow shows your aim direction
2. **Charge Power** - Hold **SPACEBAR**
   - Power bar fills up (0-100%)
   - Green = low, Yellow = medium, Red = max
3. **Fire** - Release **SPACEBAR**
   - Projectile launches
   - Watch it fly!
4. **Wait** - Turn automatically ends

**Controls:**
| Key | Action |
|-----|--------|
| **Mouse Move** | Aim direction |
| **SPACE (hold)** | Charge power |
| **SPACE (release)** | Fire weapon |
| **Arrow Keys** | Move worm (if implemented) |

**HUD (Heads-Up Display):**
- **Top-left**: Current player's turn
- **Top-center**: Turn timer (30 seconds)
- **Top-right**: All players' HP bars
- **Bottom**: Power bar (when charging)

**Tips:**
- Aim high for long shots
- Account for gravity (projectile arcs down)
- Try to hit terrain above enemy (debris falls)
- Watch out for self-damage!

#### Step 5: Victory Screen

**Match Over!**

You'll see:
- **Winner announcement**
- **Match statistics**:
  - Damage dealt
  - Final HP
- **Rating changes**:
  - Your new rating (green = gain, red = loss)
  - Placement on leaderboard (▲ moved up, ▼ moved down)

**Special Messages:**
- **"Første kamp!"** - This was your first match
- **"Kæmpe sejr!"** - Huge upset victory (+40 or more rating)

**What's Next?**
- Click **"Return to Lobby"** to play again
- Check updated leaderboard
- Your rating is saved automatically

---

### Understanding Ratings

**How Ratings Work:**
- Start at **0** (not 1000!)
- Win = gain rating (usually +15 to +25)
- Lose = lose rating (usually -15 to -25)
- **Can go negative** (yes, you can have -50 rating!)

**Factors:**
- **Opponent's rating** - Beat higher-rated = bigger gain
- **Your rating** - Lower-rated players gain more
- **Placement** - 1st place gains most, last loses most

**Leaderboard:**
- Shows top 20 players
- Your rank displayed even if not in top 20
- Updated after every match

---

## For Teachers

### Accessing Teacher Dashboard

1. Login with teacher account
2. Click **"Teacher Dashboard"** in lobby
3. View student performance

**Note:** Teacher accounts must be created by database admin.

### Dashboard Features

#### Student List

- All registered students
- Click student to view details

#### Student Details

**Quiz Performance:**
- **Topics**: Addition, Subtraction, Multiplication, Division
- **Accuracy %** per topic
- **Total questions answered**

**Combat Stats:**
- **Matches played**
- **Win-Loss record**
- **K/D ratio** (Kills/Deaths)
- **Average damage dealt**
- **Accuracy %** (hits vs shots)

**Match History:**
- Recent matches
- Date, opponent, outcome
- Quiz score
- Combat performance

#### Class Overview

- Average quiz accuracy
- Most common weak topics
- Top performers
- Students needing help

### Using Data for Instruction

**Identify Struggles:**
- Students with low quiz accuracy in specific topics
- Compare combat stats (engagement indicator)
- Track improvement over time

**Celebrate Success:**
- High performers on leaderboard
- Improved quiz scores
- Better win-loss ratios

**Differentiate Learning:**
- Assign targeted practice based on weak topics
- Group students by skill level
- Use competitive rankings for motivation

---

## FAQ (Frequently Asked Questions)

**Q: I forgot my password. Can I reset it?**

A: Currently, password reset is not implemented. Contact your teacher or admin.

**Q: Why can't I find a match?**

A: Make sure other players are searching for the same game mode. Try FFA (most popular).

**Q: The server is slow. Why?**

A: Free tier servers sleep after 15 minutes. First request may take 30-60 seconds to wake up.

**Q: Can I play on mobile?**

A: Yes! The game works on mobile browsers, but desktop is recommended for better controls.

**Q: My rating is negative. Is that bad?**

A: It's okay! Ratings can go negative. Keep playing and practicing to improve.

**Q: How do I become a teacher?**

A: Ask your administrator to update your account in the database.

**Q: Can I customize my worm?**

A: Not yet, but customization is planned for future versions!

**Q: What if I disconnect during a match?**

A: You'll lose the match if you don't reconnect within 30 seconds.

**Q: Are there power-ups?**

A: Not in version 1.0, but they're planned for version 1.1!

**Q: Can I see my own rating number?**

A: Yes! You see your exact rating in Victory screen and lobby. Others only see your placement (#1, #2, etc).

**Q: Why does quiz performance matter?**

A: Better quiz scores = earlier turns in game = more chances to eliminate opponents!

---

## Controls Reference

### Lobby
| Action | Control |
|--------|---------|
| Find Match | Click button |
| View Leaderboard | Scroll |

### Quiz
| Action | Control |
|--------|---------|
| Answer A | Click or press **A** |
| Answer B | Click or press **B** |
| Answer C | Click or press **C** |
| Answer D | Click or press **D** |

### Game
| Action | Control |
|--------|---------|
| Aim | **Mouse Move** |
| Charge Power | **Hold SPACE** |
| Fire Weapon | **Release SPACE** |

### Universal
| Action | Control |
|--------|---------|
| Open Console | **F12** (for debugging) |
| Refresh Page | **F5** or **Ctrl+R** |

---

## Tips & Strategies

### Quiz Tips

1. **Speed matters** - Finish quickly for better turn order
2. **Don't overthink** - First instinct is usually right
3. **Practice math** - The better you are, the better you play
4. **Stay calm** - 60 seconds is plenty of time

### Combat Tips

1. **Aim high** - Projectiles arc down due to gravity
2. **Use terrain** - Hit above enemies to drop debris
3. **Watch power** - 100% isn't always best
4. **Patience** - Take your full 30 seconds if needed
5. **Practice** - Play more to learn projectile physics
6. **Self-damage** - Don't shoot too close to yourself!

### Rating Tips

1. **Play consistently** - More matches = more accurate rating
2. **Learn from losses** - Watch what winners do
3. **Don't fear losing** - Ratings recover with wins
4. **Challenge yourself** - Play against higher-rated players
5. **Have fun** - Ratings are just numbers!

---

## Troubleshooting

### Game Won't Load

- Refresh page (F5)
- Clear browser cache
- Try different browser
- Check internet connection

### Can't Aim or Fire

- Make sure it's your turn (name highlighted)
- Check that timer hasn't expired
- Try refreshing page

### Projectile Doesn't Appear

- Check internet connection
- Verify server is running
- Refresh both players' browsers

### Match Won't End

- Wait for server to detect winner
- If stuck for > 1 minute, refresh

---

## Contact & Support

**For Students:**
- Ask your teacher for help
- Report bugs to teacher

**For Teachers:**
- Contact system administrator
- Check documentation in GitHub repository

---

**Version:** 1.0.0

**Last Updated:** 2026-04-23
