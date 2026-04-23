# Quiz System Documentation

## Overview
The Quiz System provides 60 high-quality math questions for 5. klasse (grade 5) students covering four main topics. Players answer 5 random questions at the start of each game to determine turn order.

## Question Distribution

### Total: 60 Questions (15 per topic)

#### 1. Division (15 questions)
- **Topics covered:**
  - Two-digit divisors (144 ÷ 12)
  - Division with remainders (157 ÷ 13 = 12 rest 1)
  - Real-world division problems (sharing, packaging, grouping)

- **Question IDs:** q001 - q015
- **Difficulty range:** Simple mental math to moderate calculations

#### 2. Brøker / Fractions (15 questions)
- **Topics covered:**
  - Addition of fractions with same denominator (1/4 + 1/4)
  - Subtraction of fractions (3/4 - 1/4)
  - Comparing fractions (2/3 vs 3/4)
  - Equivalent fractions (1/2 = ?/8)
  - Simplifying fractions (2/4 = 1/2)

- **Question IDs:** q016 - q030
- **Difficulty range:** Basic fraction concepts to comparison

#### 3. Geometri / Geometry (15 questions)
- **Topics covered:**
  - Area of rectangles and squares (5m × 8m)
  - Perimeter calculations
  - Properties of shapes (corners, sides)
  - Angles (right angles = 90°)
  - Reverse calculations (given area, find side)

- **Question IDs:** q031 - q045
- **Difficulty range:** Basic shapes to formula application

#### 4. Problemregning / Word Problems (15 questions)
- **Topics covered:**
  - Money problems (shopping, change)
  - Time problems (duration, scheduling)
  - Multi-step problems (2 operations)
  - Real-life scenarios (sports, cooking, school)
  - Measurement problems

- **Question IDs:** q046 - q060
- **Difficulty range:** Single-step to two-step problems

## Files Structure

```
server/
├── data/
│   └── quiz_questions.json          # 60 questions in JSON format
├── scripts/
│   └── seedQuizQuestions.js         # Database seeding script
├── routes/
│   └── quiz.js                      # API endpoints (already exists)
├── socket/
│   └── quizHandler.js               # Real-time quiz events
└── database/
    └── schema/
        └── quiz_questions.sql       # Database schema

client/
└── src/
    ├── scenes/
    │   └── QuizScene.js             # Quiz UI scene
    └── utils/
        └── quizManager.js           # Quiz logic utility
```

## Database Schema

```sql
CREATE TABLE quiz_questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,           -- Array of 4 options
  correct_answer INTEGER NOT NULL,  -- Index 0-3
  grade_level INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### GET /api/quiz/random
Fetch random quiz questions.

**Query Parameters:**
- `count` (default: 5) - Number of questions
- `topic` (default: 'all') - Filter by topic
  - Options: 'division', 'broeker', 'geometri', 'problemregning', 'all'

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q001",
      "topic": "division",
      "question": "Hvad er 144 ÷ 12?",
      "options": ["10", "12", "14", "16"],
      "difficulty": "medium"
    }
  ],
  "count": 5,
  "topic": "all"
}
```

**Note:** `correct_answer` is NOT included in the response to prevent cheating.

### POST /api/quiz/attempt
Submit a quiz answer for tracking.

**Body:**
```json
{
  "userId": "user123",
  "questionId": "q001",
  "answerGiven": 1,
  "correctAnswer": 1,
  "timeSpent": 12,
  "matchId": "match456"
}
```

### GET /api/quiz/stats/:userId
Get quiz statistics for a student.

### GET /api/quiz/teacher/stats
Get aggregated stats for all students (teacher dashboard).

## Quiz Flow

### 1. Game Start
```
Player joins room → QuizScene loads → Fetch 5 random questions
```

### 2. Question Display
```
Display question → Show 4 answer buttons → Start 60s timer
```

### 3. Answer Selection
```
Player clicks answer → Show feedback (green/red) → Move to next question
```

### 4. Completion
```
All 5 questions answered → Calculate score + time → Emit to server
```

### 5. Turn Order Determination
```
All players finish → Sort by score (then time) → Emit turn order → Start game
```

## Socket Events

### Client → Server

**quiz:completed**
```javascript
socket.emit('quiz:completed', {
  roomCode: 'ABC123',
  playerName: 'Anna',
  score: 4,              // Correct answers
  completionTime: 42     // Seconds
});
```

**quiz:get_results**
```javascript
socket.emit('quiz:get_results', {
  roomCode: 'ABC123'
});
```

### Server → Client

**quiz:player_completed**
```javascript
socket.on('quiz:player_completed', (data) => {
  // { playerName, score, completionTime, timestamp }
  // Update completion sidebar
});
```

**quiz:all_completed**
```javascript
socket.on('quiz:all_completed', (data) => {
  // { turnOrder: ['Anna', 'Peter', 'Emma'], results: [...] }
  // Transition to GameScene with turn order
});
```

## QuizScene UI Layout

```
┌─────────────────────────────────────────────────────┐
│  MATEMATIK QUIZ                          60         │
│                                       sekunder      │
│  FÆRDIGE:                                          │
│  1. Anna - 35s        ┌──────────────────┐        │
│  2. Peter - 47s       │  Question Text   │        │
│                       │  (centered)      │        │
│                       └──────────────────┘        │
│                       Spørgsmål 3 af 5            │
│                                                    │
│           ┌──────────┐  ┌──────────┐             │
│           │ A. Opt1  │  │ B. Opt2  │             │
│           └──────────┘  └──────────┘             │
│           ┌──────────┐  ┌──────────┐             │
│           │ C. Opt3  │  │ D. Opt4  │             │
│           └──────────┘  └──────────┘             │
│                                                    │
│              RIGTIGT! ✓ / FORKERT ✗              │
└─────────────────────────────────────────────────────┘
```

## UI Features

1. **Timer Display**
   - 60 seconds total (not per question)
   - Green → Orange (< 20s) → Red (< 10s)
   - Auto-submit when time expires

2. **Answer Feedback**
   - Correct: Green flash + button turns green
   - Wrong: Red shake + selected button red, correct button green
   - 1.5 second delay before next question

3. **Completion Sidebar**
   - Real-time updates as players finish
   - Shows: Rank, Name, Completion time
   - Sorted by completion order

4. **Accessibility**
   - Large, readable fonts
   - High contrast colors
   - Clear button states (hover, click)
   - Danish language throughout

## Usage Instructions

### 1. Seed the Database

```bash
cd server
node scripts/seedQuizQuestions.js
```

**Expected Output:**
```
Starting quiz questions seed...
Loaded 60 questions from file
Validated 60 questions
Inserting questions...
Inserted batch 1: 50 questions
Inserted batch 2: 10 questions

==================================================
SEED SUMMARY
==================================================
Total questions in file: 60
Valid questions: 60
Successfully inserted: 60
Errors: 0
==================================================

Questions by topic:
  division: 15
  broeker: 15
  geometri: 15
  problemregning: 15

Seed completed successfully!
```

### 2. Verify Database

```sql
-- Check total count
SELECT COUNT(*) FROM quiz_questions;
-- Should return: 60

-- Check distribution by topic
SELECT topic, COUNT(*)
FROM quiz_questions
GROUP BY topic;

-- division: 15
-- broeker: 15
-- geometri: 15
-- problemregning: 15
```

### 3. Test API Endpoint

```bash
# Get 5 random questions
curl http://localhost:3000/api/quiz/random?count=5&topic=all

# Get division questions only
curl http://localhost:3000/api/quiz/random?count=5&topic=division
```

### 4. Test QuizScene

```javascript
// In Phaser game, transition to QuizScene
this.scene.start('QuizScene', {
  socket: this.socket,
  playerName: 'TestPlayer',
  roomCode: 'TEST123'
});
```

## Quiz Manager API

```javascript
import { quizManager } from './utils/quizManager.js';

// Load questions from API response
quizManager.loadQuestions(questionsArray);

// Select random questions (client-side filtering)
const questions = quizManager.selectRandomQuestions(5, 'division');

// Check answer
const isCorrect = quizManager.checkAnswer('q001', 1);

// Calculate score
const score = quizManager.calculateScore(); // Returns number

// Get completion time
const time = quizManager.getCompletionTime(); // Returns seconds

// Get full results
const results = quizManager.getResults();
// Returns: { score, totalQuestions, percentage, completionTime, answers: [...] }

// Get stats by topic
const stats = quizManager.getStatsByTopic();
// Returns: { division: { total: 2, correct: 1, percentage: 50 }, ... }

// Reset for new quiz
quizManager.reset();
```

## Quality Assurance Checklist

### Question Quality
- [x] All 60 questions created (15 per topic)
- [x] Danish language throughout
- [x] Age-appropriate vocabulary (10-11 year olds)
- [x] Clear, unambiguous wording
- [x] Only ONE correct answer per question
- [x] 3 plausible wrong answers (not obviously wrong)
- [x] Solvable in 10-15 seconds (mental math friendly)
- [x] No typos or grammatical errors
- [x] Realistic contexts relevant to kids

### Technical Implementation
- [x] Valid JSON format
- [x] Unique IDs (q001-q060)
- [x] Correct answer index validation (0-3)
- [x] 4 options per question
- [x] Database schema created
- [x] Seed script functional
- [x] API endpoints working
- [x] Socket events implemented
- [x] QuizScene UI complete
- [x] Quiz manager utility tested

### Integration
- [x] QuizScene → GameScene transition
- [x] Turn order based on quiz results
- [x] Real-time completion updates
- [x] Error handling for API failures
- [x] Socket reconnection support

## Future Enhancements

1. **Adaptive Difficulty**
   - Track player performance by topic
   - Serve harder questions to stronger students
   - Use `difficulty` field in database

2. **Question Rotation**
   - Ensure students don't see same questions repeatedly
   - Track which questions each student has seen
   - Prioritize unseen questions

3. **Analytics Dashboard**
   - Teacher view of class performance
   - Identify struggling topics
   - Student progress over time

4. **Custom Quiz Sets**
   - Teachers create custom question sets
   - Target specific learning objectives
   - Upload questions via admin panel

5. **Multimedia Questions**
   - Add images for geometry questions
   - Interactive diagrams
   - Audio for accessibility

## Troubleshooting

### Questions not loading
```javascript
// Check API endpoint
fetch('/api/quiz/random?count=5')
  .then(r => r.json())
  .then(console.log);

// Check database
// Run: SELECT COUNT(*) FROM quiz_questions;
```

### Socket events not working
```javascript
// Enable debug mode
socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('quiz:player_completed', (data) => console.log('Player completed:', data));
```

### Timer issues
```javascript
// Check if timer event exists
if (this.timerEvent) {
  console.log('Timer active, remaining:', this.timeRemaining);
}

// Manually stop timer
if (this.timerEvent) {
  this.timerEvent.remove();
}
```

## Testing Scenarios

### Scenario 1: Single Player Quiz
1. Start QuizScene with 1 player
2. Answer all 5 questions
3. Verify completion event fires
4. Check turn order contains player
5. Transition to GameScene

### Scenario 2: Multiple Players Race
1. Start QuizScene with 3 players
2. Player 1 finishes first (score: 4, time: 30s)
3. Player 2 finishes second (score: 5, time: 40s)
4. Player 3 finishes last (score: 3, time: 25s)
5. Expected turn order: [Player 2, Player 1, Player 3]
   - Player 2: highest score
   - Player 1: same score as P3 but faster time
   - Player 3: lowest score

### Scenario 3: Timer Expiry
1. Start QuizScene
2. Answer 3 questions
3. Wait for timer to reach 0
4. Verify auto-completion with partial answers
5. Score calculated correctly (3/5)

### Scenario 4: API Failure
1. Disconnect from server
2. Start QuizScene
3. Verify error message displayed
4. Allow retry or fallback behavior

## Danish Math Terms Reference

| English | Danish | Usage |
|---------|--------|-------|
| Division | Division | Topic name |
| Fractions | Brøker | Topic name |
| Geometry | Geometri | Topic name |
| Word Problems | Problemregning | Topic name |
| Remainder | Rest | 157 ÷ 13 = 12 rest 1 |
| Area | Areal | Areal af rektangel |
| Perimeter | Omkreds | Omkreds af kvadrat |
| Rectangle | Rektangel | Geometric shape |
| Square | Kvadrat | Geometric shape |
| Triangle | Trekant | Geometric shape |
| Pentagon | Femkant | Geometric shape |
| Corner | Hjørne | Shape properties |
| Side | Side | Shape properties |
| Angle | Vinkel | 90° angle |
| Answer | Svar | Student's response |
| Question | Spørgsmål | Quiz item |
| Correct | Rigtigt | Feedback |
| Wrong | Forkert | Feedback |
| Finished | Færdige | Completion status |
| Seconds | Sekunder | Time unit |

## Credits

**Question Design:** Aligned with Danish 5. klasse curriculum
**Topics:** Common Core equivalent grade 5 mathematics
**Language:** Danish (da-DK)
**Target Age:** 10-11 years old
**Created:** April 2026 for Worms Math Game

---

**Last Updated:** April 23, 2026
**Version:** 1.0
**Status:** Production Ready
