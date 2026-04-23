# API Testing Guide

Complete guide to testing all API endpoints for the Worms Math Game.

## Prerequisites

1. Server running: `cd server && npm start`
2. Supabase configured (see SUPABASE_SETUP.md)
3. Port 3000 available

---

## Testing Tools

### Option 1: curl (Command Line)

Windows PowerShell examples below. For Git Bash/Linux, remove `^` line breaks.

### Option 2: Postman

Import these as requests in Postman collections.

### Option 3: Browser (GET requests only)

Simply paste the URLs in your browser.

---

## Authentication Endpoints

### 1. Create User (Signup)

**Endpoint:** `POST /api/auth/signup`

```powershell
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TestElev1\",\"role\":\"student\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "username": "TestElev1",
    "role": "student",
    "rating": 1000,
    "createdAt": "2026-04-23T..."
  },
  "message": "User created successfully"
}
```

**Test Cases:**
```powershell
# Create a teacher
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Laerer1\",\"role\":\"teacher\"}"

# Create multiple students
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Anna\",\"role\":\"student\"}"

curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Peter\",\"role\":\"student\"}"

# Test duplicate username (should fail)
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"Anna\",\"role\":\"student\"}"

# Test invalid username (should fail)
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"ab\",\"role\":\"student\"}"
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

```powershell
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TestElev1\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "username": "TestElev1",
    "role": "student",
    "rating": 1000,
    "matchesPlayed": 0,
    "matchesWon": 0
  },
  "message": "Login successful"
}
```

---

### 3. Get All Users

**Endpoint:** `GET /api/auth/users`

```powershell
# Get all users
curl http://localhost:3000/api/auth/users

# Filter by role
curl "http://localhost:3000/api/auth/users?role=student"
curl "http://localhost:3000/api/auth/users?role=teacher"
```

**Expected Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid-here",
      "username": "TestElev1",
      "role": "student",
      "rating": 1000,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "totalKills": 0,
      "totalDamage": 0,
      "createdAt": "2026-04-23T..."
    }
  ],
  "count": 1
}
```

---

## Leaderboard Endpoints

### 4. Get Leaderboard

**Endpoint:** `GET /api/leaderboard`

```powershell
# Top 20 players (default)
curl http://localhost:3000/api/leaderboard

# Top 10 players
curl "http://localhost:3000/api/leaderboard?limit=10"

# Top 50 players
curl "http://localhost:3000/api/leaderboard?limit=50"
```

**Expected Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "id": "uuid-here",
      "username": "TopPlayer",
      "rating": 1250,
      "matchesPlayed": 10,
      "matchesWon": 7,
      "winRate": 70,
      "totalKills": 25,
      "totalDamage": 1500,
      "avgKills": 2.5,
      "avgDamage": 150,
      "createdAt": "2026-04-23T..."
    }
  ],
  "count": 1
}
```

---

### 5. Get User Profile

**Endpoint:** `GET /api/leaderboard/profile/:userId`

```powershell
# Replace with actual user ID
curl http://localhost:3000/api/leaderboard/profile/uuid-here
```

**Expected Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid-here",
    "username": "TestElev1",
    "role": "student",
    "rating": 1000,
    "stats": {
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "winRate": 0,
      "lossRate": 100,
      "totalKills": 0,
      "totalDamage": 0,
      "avgKills": 0,
      "avgDamage": 0
    },
    "timestamps": {
      "createdAt": "2026-04-23T...",
      "lastPlayedAt": null
    }
  }
}
```

---

## Quiz Endpoints

### 6. Get Random Quiz Questions

**Endpoint:** `GET /api/quiz/random`

```powershell
# 5 random questions from all topics
curl http://localhost:3000/api/quiz/random

# 5 division questions
curl "http://localhost:3000/api/quiz/random?topic=division&count=5"

# 10 fraction questions
curl "http://localhost:3000/api/quiz/random?topic=brøker&count=10"

# 5 geometry questions
curl "http://localhost:3000/api/quiz/random?topic=geometri&count=5"

# 5 word problems
curl "http://localhost:3000/api/quiz/random?topic=problemregning&count=5"

# 15 mixed questions
curl "http://localhost:3000/api/quiz/random?topic=all&count=15"
```

**Expected Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "uuid-here",
      "topic": "division",
      "question": "Hvad er 56 ÷ 8?",
      "options": ["5", "6", "7", "8"],
      "difficulty": "easy"
    }
  ],
  "count": 5,
  "topic": "division"
}
```

**Note:** `correctAnswer` is NOT included in the response! Client must submit answer and server validates.

---

### 7. Submit Quiz Attempt

**Endpoint:** `POST /api/quiz/attempt`

```powershell
curl -X POST http://localhost:3000/api/quiz/attempt ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user-uuid-here\",\"questionId\":\"question-uuid-here\",\"answerGiven\":2,\"correctAnswer\":2,\"timeSpent\":15}"
```

**Expected Response:**
```json
{
  "success": true,
  "attempt": {
    "id": "uuid-here",
    "isCorrect": true,
    "timeSpent": 15,
    "createdAt": "2026-04-23T..."
  },
  "isCorrect": true
}
```

**Test Cases:**
```powershell
# Correct answer
curl -X POST http://localhost:3000/api/quiz/attempt ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user-uuid\",\"questionId\":\"q-uuid\",\"answerGiven\":2,\"correctAnswer\":2,\"timeSpent\":10}"

# Wrong answer
curl -X POST http://localhost:3000/api/quiz/attempt ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user-uuid\",\"questionId\":\"q-uuid\",\"answerGiven\":1,\"correctAnswer\":2,\"timeSpent\":8}"

# With match context
curl -X POST http://localhost:3000/api/quiz/attempt ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user-uuid\",\"questionId\":\"q-uuid\",\"answerGiven\":2,\"correctAnswer\":2,\"timeSpent\":12,\"matchId\":\"match-uuid\"}"
```

---

### 8. Get User Quiz Stats

**Endpoint:** `GET /api/quiz/stats/:userId`

```powershell
curl http://localhost:3000/api/quiz/stats/user-uuid-here
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "overall": {
      "totalAttempts": 20,
      "correctAttempts": 15,
      "incorrectAttempts": 5,
      "accuracy": 75
    },
    "byTopic": {
      "division": {
        "total": 8,
        "correct": 6,
        "accuracy": 75
      },
      "brøker": {
        "total": 7,
        "correct": 5,
        "accuracy": 71
      },
      "geometri": {
        "total": 5,
        "correct": 4,
        "accuracy": 80
      }
    },
    "recentAttempts": [...]
  }
}
```

---

### 9. Get Teacher Dashboard Stats

**Endpoint:** `GET /api/quiz/teacher/stats`

```powershell
curl http://localhost:3000/api/quiz/teacher/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "overall": {
      "totalAttempts": 150,
      "correctAttempts": 110,
      "accuracy": 73,
      "uniqueStudents": 5
    },
    "byTopic": {
      "division": {
        "total": 40,
        "correct": 30,
        "accuracy": 75
      },
      "brøker": {
        "total": 35,
        "correct": 25,
        "accuracy": 71
      }
    },
    "byUser": [
      {
        "userId": "uuid",
        "total": 30,
        "correct": 22,
        "accuracy": 73,
        "byTopic": {...}
      }
    ]
  }
}
```

---

## Match Endpoints

### 10. Create Match Result

**Endpoint:** `POST /api/matches`

**FFA Match Example:**
```powershell
curl -X POST http://localhost:3000/api/matches ^
  -H "Content-Type: application/json" ^
  -d "{\"matchType\":\"ffa\",\"duration\":180,\"totalTurns\":12,\"participants\":[{\"userId\":\"user1-uuid\",\"teamId\":null,\"placement\":1,\"stats\":{\"kills\":3,\"damage\":450,\"turns\":4}},{\"userId\":\"user2-uuid\",\"teamId\":null,\"placement\":2,\"stats\":{\"kills\":2,\"damage\":300,\"turns\":4}},{\"userId\":\"user3-uuid\",\"teamId\":null,\"placement\":3,\"stats\":{\"kills\":1,\"damage\":150,\"turns\":4}}]}"
```

**1v1 Match Example:**
```powershell
curl -X POST http://localhost:3000/api/matches ^
  -H "Content-Type: application/json" ^
  -d "{\"matchType\":\"1v1\",\"duration\":120,\"totalTurns\":8,\"participants\":[{\"userId\":\"user1-uuid\",\"teamId\":1,\"placement\":1,\"stats\":{\"kills\":1,\"damage\":500,\"turns\":4}},{\"userId\":\"user2-uuid\",\"teamId\":2,\"placement\":2,\"stats\":{\"kills\":0,\"damage\":200,\"turns\":4}}],\"teams\":[{\"teamId\":1,\"teamName\":\"Rødt Hold\",\"teamColor\":\"#FF0000\",\"won\":true,\"stats\":{\"kills\":1,\"damage\":500}},{\"teamId\":2,\"teamName\":\"Blåt Hold\",\"teamColor\":\"#0000FF\",\"won\":false,\"stats\":{\"kills\":0,\"damage\":200}}]}"
```

**2v2 Match Example:**
```powershell
curl -X POST http://localhost:3000/api/matches ^
  -H "Content-Type: application/json" ^
  -d "{\"matchType\":\"2v2\",\"duration\":200,\"totalTurns\":16,\"participants\":[{\"userId\":\"user1-uuid\",\"teamId\":1,\"placement\":1,\"stats\":{\"kills\":2,\"damage\":400,\"turns\":4}},{\"userId\":\"user2-uuid\",\"teamId\":1,\"placement\":1,\"stats\":{\"kills\":1,\"damage\":300,\"turns\":4}},{\"userId\":\"user3-uuid\",\"teamId\":2,\"placement\":2,\"stats\":{\"kills\":1,\"damage\":250,\"turns\":4}},{\"userId\":\"user4-uuid\",\"teamId\":2,\"placement\":2,\"stats\":{\"kills\":0,\"damage\":150,\"turns\":4}}],\"teams\":[{\"teamId\":1,\"teamName\":\"Rødt Hold\",\"teamColor\":\"#FF0000\",\"won\":true,\"stats\":{\"kills\":3,\"damage\":700}},{\"teamId\":2,\"teamName\":\"Blåt Hold\",\"teamColor\":\"#0000FF\",\"won\":false,\"stats\":{\"kills\":1,\"damage\":400}}]}"
```

**Expected Response:**
```json
{
  "success": true,
  "match": {
    "id": "match-uuid",
    "matchType": "ffa",
    "duration": 180,
    "totalTurns": 12,
    "createdAt": "2026-04-23T...",
    "endedAt": "2026-04-23T..."
  },
  "participants": [
    {
      "userId": "user1-uuid",
      "username": "Player1",
      "teamId": null,
      "placement": 1,
      "stats": {
        "kills": 3,
        "damage": 450,
        "turns": 4
      },
      "rating": {
        "before": 1000,
        "after": 1024,
        "change": 24
      }
    }
  ],
  "teams": null,
  "message": "Match saved successfully"
}
```

---

### 11. Get Match History

**Endpoint:** `GET /api/matches/:userId`

```powershell
# Last 10 matches
curl http://localhost:3000/api/matches/user-uuid-here

# Last 20 matches
curl "http://localhost:3000/api/matches/user-uuid-here?limit=20"
```

**Expected Response:**
```json
{
  "success": true,
  "matches": [
    {
      "matchId": "uuid",
      "matchType": "ffa",
      "placement": 1,
      "teamId": null,
      "stats": {
        "kills": 3,
        "damage": 450,
        "turns": 4
      },
      "rating": {
        "before": 1000,
        "after": 1024,
        "change": 24
      },
      "playedAt": "2026-04-23T...",
      "duration": 180
    }
  ],
  "count": 1
}
```

---

### 12. Get Match Details

**Endpoint:** `GET /api/matches/details/:matchId`

```powershell
curl http://localhost:3000/api/matches/details/match-uuid-here
```

**Expected Response:**
```json
{
  "success": true,
  "match": {
    "id": "uuid",
    "matchType": "ffa",
    "duration": 180,
    "totalTurns": 12,
    "createdAt": "2026-04-23T...",
    "endedAt": "2026-04-23T..."
  },
  "participants": [
    {
      "userId": "uuid",
      "username": "Player1",
      "teamId": null,
      "placement": 1,
      "stats": {...},
      "rating": {...}
    }
  ],
  "teams": null
}
```

---

## Complete Testing Flow

### Step 1: Create Test Users

```powershell
# Create 4 students
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"Anna\"}"
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"Peter\"}"
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"Maria\"}"
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"Lars\"}"

# Create 1 teacher
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{\"username\":\"Laerer1\",\"role\":\"teacher\"}"
```

**Save the user IDs from responses!**

---

### Step 2: Test Quiz Flow

```powershell
# Get random questions
curl "http://localhost:3000/api/quiz/random?topic=division&count=5"

# Submit answers (replace UUIDs)
curl -X POST http://localhost:3000/api/quiz/attempt -H "Content-Type: application/json" -d "{\"userId\":\"anna-uuid\",\"questionId\":\"q1-uuid\",\"answerGiven\":2,\"correctAnswer\":2,\"timeSpent\":10}"

# Check stats
curl http://localhost:3000/api/quiz/stats/anna-uuid
```

---

### Step 3: Play Matches

```powershell
# FFA match (replace UUIDs)
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" -d "{\"matchType\":\"ffa\",\"duration\":180,\"totalTurns\":12,\"participants\":[{\"userId\":\"anna-uuid\",\"teamId\":null,\"placement\":1,\"stats\":{\"kills\":3,\"damage\":450,\"turns\":4}},{\"userId\":\"peter-uuid\",\"teamId\":null,\"placement\":2,\"stats\":{\"kills\":2,\"damage\":300,\"turns\":4}},{\"userId\":\"maria-uuid\",\"teamId\":null,\"placement\":3,\"stats\":{\"kills\":1,\"damage\":150,\"turns\":4}},{\"userId\":\"lars-uuid\",\"teamId\":null,\"placement\":4,\"stats\":{\"kills\":0,\"damage\":100,\"turns\":4}}]}"
```

---

### Step 4: Check Leaderboard

```powershell
# View leaderboard
curl http://localhost:3000/api/leaderboard

# Check individual profile
curl http://localhost:3000/api/leaderboard/profile/anna-uuid
```

---

## Error Testing

### Test Invalid Requests

```powershell
# Missing required fields
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d "{}"

# Invalid match type
curl -X POST http://localhost:3000/api/matches -H "Content-Type: application/json" -d "{\"matchType\":\"invalid\",\"participants\":[]}"

# Non-existent user
curl http://localhost:3000/api/leaderboard/profile/00000000-0000-0000-0000-000000000000
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Worms Math Game API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## Notes

1. **UUIDs**: Replace all `uuid-here` placeholders with actual UUIDs from previous responses
2. **Windows PowerShell**: Use `^` for line continuation
3. **Git Bash/Linux**: Use `\` for line continuation
4. **JSON Formatting**: Ensure valid JSON (no trailing commas, proper quotes)
5. **Rating Changes**: ELO rating automatically calculated based on match results

---

## Troubleshooting

### "Supabase credentials not found"
- Check `.env` file exists in `server/` directory
- Verify environment variables are set correctly
- Restart server after changing `.env`

### "User not found"
- Verify user ID is correct UUID
- Check user exists: `curl http://localhost:3000/api/auth/users`

### "Failed to fetch quiz questions"
- Ensure database schema is loaded (run `schema.sql`)
- Check Supabase connection

### "Invalid JSON"
- Validate JSON syntax
- Remove line breaks in Windows PowerShell (use `^`)
- Escape quotes properly

---

**Happy Testing!**
