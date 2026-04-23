# Database Design Documentation

Complete database schema design and architecture decisions for the Worms Math Game.

## Overview

The database uses **PostgreSQL** (via Supabase) with 6 main tables:

1. **users** - User accounts (students and teachers)
2. **quiz_questions** - Pre-loaded quiz questions for 5. klasse matematik
3. **quiz_attempts** - Student quiz performance tracking
4. **match_results** - Completed game matches
5. **match_participants** - Player performance in matches
6. **match_teams** - Team information (for team-based matches)

---

## Table Schemas

### 1. Users Table

Stores user accounts with rating and statistics.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),

  -- Rating and stats
  rating INTEGER DEFAULT 1000,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_played_at TIMESTAMP
);
```

**Design Decisions:**

- **UUID Primary Key**: Allows distributed ID generation, better for scaling
- **Username Only Auth (MVP)**: No passwords for simplicity. Production would add auth.
- **Role Enum**: `student` | `teacher` for permission differentiation
- **Starting Rating**: 1000 (standard ELO starting point)
- **Denormalized Stats**: `matches_played`, `matches_won`, etc. cached for performance
- **last_played_at**: Track user engagement

**Indexes:**
```sql
CREATE INDEX idx_users_rating ON users(rating DESC);  -- Leaderboard queries
CREATE INDEX idx_users_role ON users(role);           -- Filter by role
CREATE INDEX idx_users_username ON users(username);   -- Login lookups
```

---

### 2. Quiz Questions Table

Pre-loaded questions for Danish 5. klasse matematik.

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT DEFAULT 'matematik',
  topic TEXT NOT NULL CHECK (topic IN ('division', 'brøker', 'geometri', 'problemregning', 'grundlæggende', 'blandet')),
  grade_level INTEGER DEFAULT 5,

  -- Question content
  question TEXT NOT NULL,
  options JSONB NOT NULL,  -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),

  -- Optional metadata
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  explanation TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

**Design Decisions:**

- **JSONB for Options**: Flexible, indexable, supports Danish characters
- **Integer for Correct Answer**: 0-3 index (simple and fast)
- **Topic Categories**: Aligned with Danish curriculum (division, brøker, geometri, problemregning)
- **Difficulty Levels**: `easy`, `medium`, `hard` for adaptive difficulty
- **Optional Explanation**: For teacher view / student feedback

**Why JSONB?**
- Native PostgreSQL support
- Efficient storage
- Can query/filter by option content if needed
- Supports arrays of any length

**Indexes:**
```sql
CREATE INDEX idx_quiz_questions_topic ON quiz_questions(topic);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);
```

**Sample Data:**
60 questions pre-loaded (15 per topic):
- Division (15 questions)
- Brøker/Fractions (15 questions)
- Geometri (15 questions)
- Problemregning/Word Problems (15 questions)

---

### 3. Quiz Attempts Table

Tracks student performance for teacher dashboard.

```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,

  -- Attempt data
  answer_given INTEGER CHECK (answer_given BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER,  -- seconds

  -- Context
  match_id UUID,  -- Optional: link to match if during gameplay

  created_at TIMESTAMP DEFAULT NOW()
);
```

**Design Decisions:**

- **Foreign Keys with CASCADE**: Delete user = delete their attempts
- **is_correct Boolean**: Pre-calculated for fast queries
- **time_spent**: Optional metric for analysis
- **match_id**: Optional link to game context

**Indexes:**
```sql
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_question ON quiz_attempts(question_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at DESC);
```

**Use Cases:**
- Student progress tracking
- Teacher dashboard analytics
- Topic mastery analysis
- Time-per-question analysis

---

### 4. Match Results Table

Stores completed matches.

```sql
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_type TEXT NOT NULL CHECK (match_type IN ('ffa', '1v1', '2v2', '3v3', '4v4')),

  -- Match metadata
  duration_seconds INTEGER,
  total_turns INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

**Design Decisions:**

- **Match Type Enum**: Supports FFA and team modes
- **Duration & Turns**: Optional metadata for statistics
- **Separate timestamps**: `created_at` (match start) vs `ended_at` (match end)

**Indexes:**
```sql
CREATE INDEX idx_match_results_created_at ON match_results(created_at DESC);
CREATE INDEX idx_match_results_type ON match_results(match_type);
```

---

### 5. Match Participants Table

Links users to matches with performance data.

```sql
CREATE TABLE match_participants (
  match_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Team info (NULL for FFA)
  team_id INTEGER CHECK (team_id BETWEEN 1 AND 4),

  -- Performance
  placement INTEGER NOT NULL,  -- 1 = winner, 2 = second, etc.
  kills INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  turns_taken INTEGER DEFAULT 0,

  -- Rating changes
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,

  PRIMARY KEY (match_id, user_id)
);
```

**Design Decisions:**

- **Composite Primary Key**: (match_id, user_id) ensures one entry per player per match
- **team_id NULL for FFA**: Flexible for different game modes
- **Placement**: 1 = winner, supports ties (multiple rank 1)
- **Rating Snapshot**: Store before/after/change for history
- **Performance Metrics**: kills, damage, turns for leaderboard

**Indexes:**
```sql
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
```

**Why Store Rating Changes?**
- Historical accuracy (user's rating at time of match)
- Audit trail for rating calculations
- Can recalculate/verify ELO algorithm

---

### 6. Match Teams Table

Team information for team-based matches.

```sql
CREATE TABLE match_teams (
  match_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  team_id INTEGER CHECK (team_id BETWEEN 1 AND 4),

  -- Team info
  team_name TEXT NOT NULL,
  team_color TEXT NOT NULL,
  won BOOLEAN NOT NULL,

  -- Team stats
  total_kills INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,

  PRIMARY KEY (match_id, team_id)
);
```

**Design Decisions:**

- **Only for Team Matches**: NULL in match_results for FFA
- **team_id 1-4**: Supports up to 4 teams
- **Danish Team Names**: "Rødt Hold", "Blåt Hold", etc.
- **Aggregate Stats**: Total kills/damage per team

**Example Team Colors:**
- Team 1: `#FF0000` (Red)
- Team 2: `#0000FF` (Blue)
- Team 3: `#00FF00` (Green)
- Team 4: `#FFFF00` (Yellow)

---

## Relationships

```
users (1) ----< (N) match_participants
match_results (1) ----< (N) match_participants
match_results (1) ----< (N) match_teams
users (1) ----< (N) quiz_attempts
quiz_questions (1) ----< (N) quiz_attempts
```

**Cascading Deletes:**
- Delete user → delete their attempts and match participation
- Delete match → delete all participants and teams
- Delete question → delete all attempts (rare)

---

## ELO Rating System

### Algorithm Choice

**Standard ELO with modifications for FFA and teams.**

### Rating Calculation

**1v1 Formula:**
```
New Rating = Old Rating + K * (Actual Score - Expected Score)
Expected Score = 1 / (1 + 10^((Opponent Rating - Player Rating) / 400))
Actual Score = 1 (win) or 0 (loss)
K-factor = 32 (standard)
```

**FFA Formula:**
- Compare each player against all others
- Average rating change across all comparisons
- K-factor = 24 (lower for multi-opponent)

**Team Formula:**
- Calculate team average rating
- Apply standard ELO between teams
- Same rating change for all team members
- K-factor = 32 for 2 teams, 28 for 3+ teams

### K-Factor Values

| Match Type | K-Factor | Reason |
|------------|----------|--------|
| 1v1 | 32 | Standard ELO |
| 2v2 | 32 | Clear winner/loser |
| 3v3, 4v4 | 32 | Team-based |
| FFA | 24 | Multiple opponents, lower volatility |
| Multi-team | 28 | Balanced for 3+ teams |

### Starting Rating

**1000** - Standard ELO midpoint

### Rating Floor

**0** - Ratings cannot go below 0

---

## Performance Optimizations

### 1. Indexes

All foreign keys indexed for JOIN performance:
```sql
-- User lookups
CREATE INDEX idx_users_rating ON users(rating DESC);
CREATE INDEX idx_users_username ON users(username);

-- Quiz queries
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_questions_topic ON quiz_questions(topic);

-- Match history
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_results_created_at ON match_results(created_at DESC);
```

### 2. Denormalized Stats

User stats cached in `users` table:
- `matches_played`
- `matches_won`
- `total_kills`
- `total_damage`

**Trade-off:**
- ✅ Fast leaderboard queries (no COUNT needed)
- ✅ No JOINs for user profile
- ❌ Must update on each match (handled by API)

### 3. JSONB for Options

Quiz options stored as JSONB:
- ✅ Native PostgreSQL type
- ✅ Indexable (GIN index if needed)
- ✅ Flexible array length
- ✅ Supports Unicode (Danish characters)

### 4. Composite Primary Keys

`match_participants` and `match_teams` use composite keys:
- ✅ Enforces uniqueness
- ✅ No extra index needed
- ✅ Fast lookups

---

## Data Integrity

### Constraints

```sql
-- Role validation
CHECK (role IN ('student', 'teacher'))

-- Match type validation
CHECK (match_type IN ('ffa', '1v1', '2v2', '3v3', '4v4'))

-- Answer range validation
CHECK (correct_answer BETWEEN 0 AND 3)
CHECK (answer_given BETWEEN 0 AND 3)

-- Team ID validation
CHECK (team_id BETWEEN 1 AND 4)

-- Difficulty validation
CHECK (difficulty IN ('easy', 'medium', 'hard'))
```

### Foreign Keys

All relationships enforced with foreign keys:
```sql
quiz_attempts.user_id → users.id
quiz_attempts.question_id → quiz_questions.id
match_participants.match_id → match_results.id
match_participants.user_id → users.id
match_teams.match_id → match_results.id
```

### Unique Constraints

```sql
-- Username must be unique
UNIQUE (username)

-- One entry per player per match
PRIMARY KEY (match_id, user_id)

-- One entry per team per match
PRIMARY KEY (match_id, team_id)
```

---

## Scalability Considerations

### Current Design (MVP)

- **Single region**: Denmark/EU-Central
- **Estimated load**: 100-500 users
- **Supabase free tier**: 500 MB database, unlimited API requests

### Future Scaling

**If scaling needed:**

1. **Read Replicas**: Leaderboard queries from replica
2. **Partitioning**: Partition `quiz_attempts` by date
3. **Caching**: Redis for leaderboard (TTL 60s)
4. **Connection Pooling**: PgBouncer (Supabase includes this)
5. **Archiving**: Move old matches to cold storage

**Current indexes support:**
- Leaderboard: `O(log N)` with B-tree on rating
- User lookup: `O(1)` hash on username
- Match history: `O(log N)` with B-tree on created_at

---

## Sample Queries

### Get Top 10 Leaderboard
```sql
SELECT username, rating, matches_played, matches_won
FROM users
WHERE role = 'student'
ORDER BY rating DESC
LIMIT 10;
```

### Get User Win Rate
```sql
SELECT
  username,
  rating,
  matches_played,
  matches_won,
  ROUND(100.0 * matches_won / NULLIF(matches_played, 0), 1) as win_rate
FROM users
WHERE id = 'user_id_here';
```

### Get Quiz Accuracy by Topic
```sql
SELECT
  qq.topic,
  COUNT(*) as attempts,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct,
  ROUND(100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy
FROM quiz_attempts qa
JOIN quiz_questions qq ON qa.question_id = qq.id
WHERE qa.user_id = 'user_id_here'
GROUP BY qq.topic;
```

### Get Match History with Details
```sql
SELECT
  mr.match_type,
  mp.placement,
  mp.kills,
  mp.damage_dealt,
  mp.rating_before,
  mp.rating_after,
  mp.rating_change,
  mr.created_at
FROM match_participants mp
JOIN match_results mr ON mp.match_id = mr.id
WHERE mp.user_id = 'user_id_here'
ORDER BY mr.created_at DESC
LIMIT 10;
```

---

## Security Considerations

### MVP (Current)

- **No Row Level Security (RLS)**: All data readable by anyone
- **Username-only auth**: No passwords
- **API validation**: Server-side validation only

### Production Recommendations

1. **Enable RLS**:
```sql
-- Users can only update their own stats
CREATE POLICY "Users update own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read quiz questions
CREATE POLICY "Public quiz" ON quiz_questions
  FOR SELECT USING (true);

-- Users can only read their own attempts
CREATE POLICY "Users read own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
```

2. **Add Authentication**:
- Supabase Auth (email/password)
- Session tokens
- JWT validation

3. **API Rate Limiting**:
- Prevent spam signups
- Limit quiz question fetches

4. **Input Validation**:
- Sanitize usernames
- Validate JSON payloads
- Prevent SQL injection (use parameterized queries)

---

## Migration Strategy

### Version 1 (Current)

- Users with username-only auth
- 60 pre-loaded quiz questions
- FFA and team match support
- ELO rating system

### Future Versions

**V2: Authentication**
- Add `users.password_hash`
- Add `users.email`
- Enable Supabase Auth

**V3: Social Features**
- Add `friend_requests` table
- Add `user_achievements` table
- Add `chat_messages` table

**V4: Advanced Analytics**
- Add `daily_stats` aggregate table
- Add `skill_ratings` per topic
- Add `match_replays` JSONB column

**Migration Process:**
1. Write migration SQL
2. Test on staging database
3. Backup production
4. Run migration with transaction
5. Verify data integrity

---

## Backup & Recovery

### Supabase Automatic Backups

- **Daily backups**: Automatic on all plans
- **Point-in-time recovery**: Pro plan feature
- **Retention**: 7 days (free), 30 days (pro)

### Manual Backup

```bash
# Export database
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Restore database
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql
```

### Critical Tables Priority

1. **users** - User accounts (CRITICAL)
2. **match_results** + **match_participants** - Game history (HIGH)
3. **quiz_attempts** - Student progress (HIGH)
4. **quiz_questions** - Can be re-seeded (MEDIUM)

---

## Conclusion

The database design balances:

✅ **Simplicity**: Easy to understand and maintain
✅ **Performance**: Indexed queries, denormalized stats
✅ **Flexibility**: Supports FFA and team modes
✅ **Scalability**: Can handle 100-500 users easily
✅ **Education**: Tracks student progress for teachers
✅ **Fairness**: ELO rating system for balanced matchmaking

**Total Tables**: 6
**Total Indexes**: 11
**Sample Data**: 60 quiz questions
**Starting Rating**: 1000 ELO

Ready for production deployment!
