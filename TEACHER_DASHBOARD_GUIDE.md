# Teacher Dashboard Guide - Stream 6

## Overview

The Teacher Dashboard allows teachers to monitor student quiz performance in the Worms Math Game. It provides real-time statistics on student progress across all four math topics (division, brøker, geometri, problemregning).

## Features

### 1. Teacher Authentication
- Secure login system for teachers only
- Separate from student login (stored in different localStorage key)
- Role validation ensures only teachers can access the dashboard

### 2. Student Statistics Table
Displays comprehensive data for all students:
- **Student name** (color-coded by overall performance)
- **Total questions attempted**
- **Overall accuracy percentage**
- **Performance breakdown by topic:**
  - Division
  - Brøker (fractions)
  - Geometri (geometry)
  - Problemregning (word problems)

### 3. Color-Coded Performance Indicators
- **Green** (>80% correct): Excellent performance
- **Yellow** (60-80% correct): Good performance
- **Red** (<60% correct): Needs improvement

### 4. Weakest Topic Highlighting
- Each student's weakest topic is highlighted with a red background
- Helps teachers identify where students need extra support

### 5. Sorting & Filtering
- **Sort by:**
  - Name (A-Z or Z-A)
  - Total Questions (ascending/descending)
  - Correct % (ascending/descending)
- **Filter:**
  - Show only struggling students (<70% correct)

### 6. Real-time Updates
- Refresh button to reload latest statistics
- Data updates as students play quiz matches

## How to Access

### From the Lobby
1. Start the game client
2. On the Lobby screen, look for the **"LÆRER LOGIN"** button in the bottom-right corner
3. Click to access the Teacher Dashboard login

## Setup Instructions

### 1. Create a Teacher Account

Before accessing the dashboard, you need a teacher account. You can create one using:

**Option A: API Request (using Postman/curl)**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "LærerAnna",
    "role": "teacher"
  }'
```

**Option B: Direct Database Insert (Supabase Dashboard)**
```sql
INSERT INTO users (username, role, rating)
VALUES ('LærerAnna', 'teacher', 1000);
```

**Example Teacher Accounts:**
- LærerAnna
- LærerPeter
- LærerMarie
- Lærer_5A

### 2. Login to Dashboard

1. Click **"LÆRER LOGIN"** from the Lobby
2. Enter teacher username (e.g., "LærerAnna")
3. Enter password (currently optional - authentication is username-only MVP)
4. Click **"LOG IND"**

If you try to login with a student account, you'll see:
> "Kun lærere kan tilgå dette område" (Only teachers can access this area)

## Dashboard Layout

```
╔════════════════════════════════════════════════════════════════════════════╗
║                        LÆRER DASHBOARD - 5.A                               ║
║                        Lærer: LærerAnna                                    ║
║                                                                            ║
║  [OPDATER]  [LOG UD]                                                       ║
║                                                                            ║
║  Sorter: [Navn] [Spørgsmål] [Korrekt %]      [Vis kun elever <70% korrekt]║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Elev    │ Spørgsmål │ Korrekt% │ Division  │ Brøker    │ Geometri │ Problemregning ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Alice   │ 45        │ 82%      │ 15/18(83%)│ 12/15(80%)│ 10/12(83%)│ 8/10(80%)     ║
║ Bob     │ 38        │ 71%      │ 10/12(83%)│ 14/18(78%)│ 8/10(80%) │ 6/8(75%)      ║
║ Charlie │ 52        │ 88%      │ 18/20(90%)│ 16/18(89%)│ 12/14(86%)│ 6/10(60%)     ║
║ Diana   │ 28        │ 57%      │ 8/10(80%) │ 6/12(50%) │ 7/8(88%)  │ 7/10(70%)     ║
╚════════════════════════════════════════════════════════════════════════════╝
           Total elever: 4 | Gennemsnitlig nøjagtighed: 74%
```

## Understanding the Data

### Per-Topic Stats
Format: `X/Y (Z%)`
- **X** = Questions answered correctly
- **Y** = Total questions attempted
- **Z%** = Accuracy percentage for that topic

Example: `15/18 (83%)` means:
- 15 correct answers
- 18 total attempts
- 83% accuracy

### Color Coding Examples
- **Alice (82%)** - Green text (excellent overall performance)
- **Bob (71%)** - Yellow text (good performance)
- **Diana (57%)** - Red text (needs improvement)

### Weakest Topic Detection
The topic with the lowest accuracy for each student is highlighted with a red background.

Example: If Charlie has:
- Division: 90%
- Brøker: 89%
- Geometri: 86%
- Problemregning: 60%

Then "Problemregning" will have a red background highlight.

## Using the Controls

### Refresh Button
- Click to reload statistics from the server
- Shows "Opdaterer..." while loading
- Updates all student data with latest quiz attempts

### Sort Controls
Click to sort students by different criteria:

1. **Navn** - Alphabetical by student name
   - Click once: A-Z
   - Click again: Z-A

2. **Spørgsmål** - By total questions attempted
   - Click once: Lowest to highest
   - Click again: Highest to lowest

3. **Korrekt %** - By overall accuracy
   - Click once: Lowest to highest
   - Click again: Highest to lowest

### Filter Toggle
- **"Vis kun elever <70% korrekt"** - Show only struggling students
- Button turns orange when active
- Click again to show all students

### Logout
- Returns to Lobby scene
- Clears teacher session from localStorage
- Students can continue playing

## API Endpoints Used

The dashboard relies on these backend endpoints:

### 1. Teacher Stats
```
GET http://localhost:3000/api/quiz/teacher/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "overall": {
      "totalAttempts": 163,
      "correctAttempts": 122,
      "accuracy": 75,
      "uniqueStudents": 4
    },
    "byTopic": {
      "division": { "total": 48, "correct": 40, "accuracy": 83 },
      "brøker": { "total": 45, "correct": 35, "accuracy": 78 },
      "geometri": { "total": 44, "correct": 37, "accuracy": 84 },
      "problemregning": { "total": 26, "correct": 10, "accuracy": 38 }
    },
    "byUser": [
      {
        "userId": "uuid-123",
        "username": "Alice",
        "total": 45,
        "correct": 37,
        "accuracy": 82,
        "byTopic": {
          "division": { "correct": 15, "total": 18, "accuracy": 83 },
          "brøker": { "correct": 12, "total": 15, "accuracy": 80 },
          "geometri": { "correct": 10, "total": 12, "accuracy": 83 },
          "problemregning": { "correct": 8, "total": 10, "accuracy": 80 }
        }
      }
    ]
  }
}
```

### 2. User by ID (for fetching usernames)
```
GET http://localhost:3000/api/auth/user/:userId
```

### 3. Teacher Login
```
POST http://localhost:3000/api/auth/login
Body: { "username": "LærerAnna" }
```

## Testing the Dashboard

### Step 1: Create Test Accounts

**Teachers:**
```bash
# Create teacher account
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "LærerAnna", "role": "teacher"}'
```

**Students:**
```bash
# Create student accounts (or just login in-game to auto-create)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "Alice", "role": "student"}'

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "Bob", "role": "student"}'

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "Charlie", "role": "student"}'
```

### Step 2: Generate Quiz Data

Students need to play quiz matches to generate data:

1. Login as "Alice"
2. Start a quiz match (or join FFA game)
3. Answer quiz questions
4. Repeat with Bob, Charlie, etc.

Alternatively, insert test data directly:
```sql
-- Insert test quiz attempts
INSERT INTO quiz_attempts (user_id, question_id, answer_given, is_correct, time_spent)
SELECT
  (SELECT id FROM users WHERE username = 'Alice'),
  id,
  correct_answer,
  true,
  10
FROM quiz_questions
LIMIT 20;
```

### Step 3: Access Dashboard

1. Start game client
2. Click "LÆRER LOGIN" in bottom-right corner
3. Login as "LærerAnna"
4. Verify dashboard displays student stats

### Step 4: Test Features

**Sorting:**
- Click "Navn" - Students should sort alphabetically
- Click "Spørgsmål" - Students should sort by question count
- Click "Korrekt %" - Students should sort by accuracy

**Filtering:**
- Click "Vis kun elever <70% korrekt"
- Only students with <70% accuracy should show

**Refresh:**
- Click "OPDATER"
- Dashboard should reload with latest data

**Color Coding:**
- Verify green for >80%
- Verify yellow for 60-80%
- Verify red for <60%

**Weakest Topic:**
- Each student's worst topic should have red background

## Troubleshooting

### "Kun lærere kan tilgå dette område"
- You're trying to login with a student account
- Create a proper teacher account with `role='teacher'`

### "Bruger ikke fundet"
- Teacher account doesn't exist
- Create account using signup API

### Empty Dashboard / "Ingen elevdata tilgængelig"
- No students have played quiz matches yet
- Students need to answer quiz questions to generate data
- Check database: `SELECT COUNT(*) FROM quiz_attempts;`

### Usernames Show as "Ukendt"
- API error fetching user data
- Check server logs
- Verify `/api/auth/user/:userId` endpoint is working

### Dashboard Shows Old Data
- Click "OPDATER" to refresh
- Check server connection
- Verify `/api/quiz/teacher/stats` returns latest data

## Technical Details

### Files Modified/Created

**New Files:**
- `client/src/scenes/TeacherDashboardScene.js` - Main dashboard scene

**Modified Files:**
- `client/src/main.js` - Registered TeacherDashboardScene
- `client/src/scenes/LobbyScene.js` - Added teacher login button
- `server/routes/quiz.js` - Updated /teacher/stats to include usernames
- `server/routes/auth.js` - Added GET /user/:userId endpoint

### localStorage Keys
- `wormsUser` - Student session data
- `wormsTeacher` - Teacher session data (separate from student)

### Database Tables Used
- `users` - Student and teacher accounts
- `quiz_questions` - Question bank (60 questions)
- `quiz_attempts` - Student quiz performance data

## Future Enhancements

Potential features for future versions:

1. **Student Detail View**
   - Click student name to see individual question history
   - View exactly which questions were answered incorrectly
   - Time spent per question

2. **CSV Export**
   - Export button to download stats as CSV
   - Import into Excel for further analysis

3. **Class-wide Analytics**
   - Charts showing topic difficulty distribution
   - Progress over time graphs
   - Identify questions that most students get wrong

4. **Password Authentication**
   - Add proper password hashing for teachers
   - Session management with JWT tokens

5. **Multiple Classes**
   - Support for different classes (5.A, 5.B, etc.)
   - Teacher can select which class to view

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify server is running (`npm start` in server directory)
3. Check database connection (Supabase)
4. Review server logs for API errors

## Summary

The Teacher Dashboard provides a comprehensive view of student quiz performance with:
- Real-time statistics across 4 math topics
- Color-coded performance indicators
- Sorting and filtering capabilities
- Easy-to-read table format
- Identification of struggling students and weak topics

Teachers can now effectively monitor student progress and identify areas where additional support is needed.
