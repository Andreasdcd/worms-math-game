# Database Quick Reference Card

**Worms Math Game - Database & API Cheat Sheet**

---

## Setup (First Time)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy URL and anon key

2. **Configure Environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run Schema**
   - Open Supabase SQL Editor
   - Paste entire `database/schema.sql`
   - Click Run

4. **Start Server**
   ```bash
   npm start
   ```

---

## API Endpoints

### Authentication
```bash
# Signup
POST /api/auth/signup
Body: {"username":"Anna","role":"student"}

# Login
POST /api/auth/login
Body: {"username":"Anna"}

# List users
GET /api/auth/users
GET /api/auth/users?role=student
```

### Leaderboard
```bash
# Top players
GET /api/leaderboard
GET /api/leaderboard?limit=10

# User profile
GET /api/leaderboard/profile/:userId
```

### Quiz
```bash
# Random questions
GET /api/quiz/random?topic=division&count=5
# Topics: division, brøker, geometri, problemregning, all

# Submit attempt
POST /api/quiz/attempt
Body: {
  "userId":"uuid",
  "questionId":"uuid",
  "answerGiven":2,
  "correctAnswer":2,
  "timeSpent":15
}

# User stats
GET /api/quiz/stats/:userId

# Teacher stats
GET /api/quiz/teacher/stats
```

### Matches
```bash
# Create match
POST /api/matches
Body: {
  "matchType":"ffa",
  "duration":180,
  "totalTurns":12,
  "participants":[...]
}

# Match history
GET /api/matches/:userId
GET /api/matches/:userId?limit=20

# Match details
GET /api/matches/details/:matchId
```

---

## Database Tables

```
users               - User accounts + rating
quiz_questions      - 60 pre-loaded questions
quiz_attempts       - Student performance
match_results       - Completed matches
match_participants  - Player stats per match
match_teams         - Team info (team modes)
```

---

## ELO Rating

- **Starting:** 1000
- **K-Factor:** 32 (1v1, teams), 24 (FFA)
- **Floor:** 0 (can't go below)

---

## Quiz Topics

```
division         - Division (÷)
brøker          - Fractions
geometri        - Geometry
problemregning  - Word problems
all             - Mixed
```

---

## Match Types

```
ffa   - Free-for-all (2-8 players)
1v1   - 1 vs 1
2v2   - 2 vs 2
3v3   - 3 vs 3
4v4   - 4 vs 4
```

---

## Quick Tests

```powershell
# Create user
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"TestUser\"}"

# Get questions
curl "http://localhost:3000/api/quiz/random?topic=division&count=5"

# Check leaderboard
curl http://localhost:3000/api/leaderboard

# Health check
curl http://localhost:3000/health
```

---

## Common Queries

```sql
-- Top 10 leaderboard
SELECT username, rating FROM users
WHERE role='student' ORDER BY rating DESC LIMIT 10;

-- User win rate
SELECT username, matches_played, matches_won,
  ROUND(100.0*matches_won/matches_played,1) as win_rate
FROM users WHERE id='uuid';

-- Quiz accuracy by topic
SELECT qq.topic, COUNT(*) as total,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct
FROM quiz_attempts qa
JOIN quiz_questions qq ON qa.question_id=qq.id
WHERE qa.user_id='uuid'
GROUP BY qq.topic;
```

---

## Error Codes

```
200 - OK
201 - Created
400 - Bad Request (validation)
404 - Not Found
409 - Conflict (duplicate)
500 - Server Error
```

---

## Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
PORT=3000
```

---

## Files Location

```
server/database/schema.sql           - Database schema
server/database/SUPABASE_SETUP.md   - Setup guide
server/database/API_TESTING_GUIDE.md - Test examples
server/routes/                       - API endpoints
server/services/                     - Business logic
```

---

## Troubleshooting

**"Supabase not connected"**
→ Check .env file, restart server

**"User not found"**
→ Verify UUID is correct

**"Invalid JSON"**
→ Escape quotes in PowerShell

**"Schema errors"**
→ Run entire schema.sql, check logs

---

## Next Steps

1. ✅ Database complete
2. 🔜 Game Lobby (matchmaking)
3. 🔜 Game Engine (gameplay)
4. 🔜 Teacher Dashboard (analytics)

---

**Full docs:** See `server/database/` folder
