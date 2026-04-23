-- =====================================================
-- Worms Math Game - Database Schema
-- =====================================================
-- Danish Math Education Game (5. klasse matematik)
-- Supports: Users, Quiz Questions, Match Results, Ratings
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Stores user accounts (students and teachers)
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

-- =====================================================
-- QUIZ QUESTIONS TABLE
-- =====================================================
-- 60+ questions for 5. klasse matematik
-- Topics: division, brøker, geometri, problemregning
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT DEFAULT 'matematik',
  topic TEXT NOT NULL CHECK (topic IN ('division', 'brøker', 'geometri', 'problemregning', 'grundlæggende', 'blandet')),
  grade_level INTEGER DEFAULT 5,

  -- Question content
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),

  -- Optional metadata
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  explanation TEXT, -- Optional explanation for teachers

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- QUIZ ATTEMPTS TABLE
-- =====================================================
-- Track student quiz performance for teacher dashboard
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,

  -- Attempt data
  answer_given INTEGER CHECK (answer_given BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER, -- seconds

  -- Context
  match_id UUID, -- Optional: link to match if during gameplay

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MATCH RESULTS TABLE
-- =====================================================
-- Stores completed matches
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_type TEXT NOT NULL CHECK (match_type IN ('ffa', '1v1', '2v2', '3v3', '4v4')),

  -- Match metadata
  duration_seconds INTEGER, -- Total match duration
  total_turns INTEGER, -- Total turns played

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- =====================================================
-- MATCH PARTICIPANTS TABLE
-- =====================================================
-- Links users to matches with their performance
CREATE TABLE match_participants (
  match_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Team info (NULL for FFA)
  team_id INTEGER CHECK (team_id BETWEEN 1 AND 4),

  -- Performance
  placement INTEGER NOT NULL, -- 1 = winner, 2 = second, etc.
  kills INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  turns_taken INTEGER DEFAULT 0,

  -- Rating changes
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,

  PRIMARY KEY (match_id, user_id)
);

-- =====================================================
-- MATCH TEAMS TABLE
-- =====================================================
-- Team information for team-based matches
CREATE TABLE match_teams (
  match_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  team_id INTEGER CHECK (team_id BETWEEN 1 AND 4),

  -- Team info
  team_name TEXT NOT NULL, -- "Rødt Hold", "Blåt Hold", etc.
  team_color TEXT NOT NULL, -- "#FF0000", "#0000FF", etc.
  won BOOLEAN NOT NULL,

  -- Team stats
  total_kills INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,

  PRIMARY KEY (match_id, team_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_rating ON users(rating DESC);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);

-- Quiz attempts
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_question ON quiz_attempts(question_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at DESC);

-- Quiz questions
CREATE INDEX idx_quiz_questions_topic ON quiz_questions(topic);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);

-- Match participants
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);

-- Match results
CREATE INDEX idx_match_results_created_at ON match_results(created_at DESC);
CREATE INDEX idx_match_results_type ON match_results(match_type);

-- =====================================================
-- SAMPLE DATA - 60 QUIZ QUESTIONS
-- =====================================================

-- Division (15 questions)
INSERT INTO quiz_questions (topic, question, options, correct_answer, difficulty) VALUES
('division', 'Hvad er 56 ÷ 8?', '["5", "6", "7", "8"]', 2, 'easy'),
('division', 'Hvad er 144 ÷ 12?', '["10", "11", "12", "13"]', 2, 'easy'),
('division', 'Hvad er 96 ÷ 8?', '["11", "12", "13", "14"]', 1, 'medium'),
('division', 'Hvad er 225 ÷ 15?', '["13", "14", "15", "16"]', 2, 'medium'),
('division', 'Hvad er 168 ÷ 14?', '["10", "11", "12", "13"]', 2, 'medium'),
('division', 'Hvad er 360 ÷ 18?', '["18", "19", "20", "21"]', 2, 'hard'),
('division', 'Hvad er 294 ÷ 14?', '["19", "20", "21", "22"]', 2, 'hard'),
('division', 'Hvad er 420 ÷ 21?', '["18", "19", "20", "21"]', 2, 'hard'),
('division', '72 ÷ 9 = ?', '["6", "7", "8", "9"]', 2, 'easy'),
('division', '120 ÷ 10 = ?', '["10", "11", "12", "13"]', 2, 'easy'),
('division', 'Hvis 156 skal deles i 13 lige store grupper, hvor mange er der i hver gruppe?', '["10", "11", "12", "13"]', 2, 'medium'),
('division', 'En bager har 240 boller. De skal pakkes i kasser med 16 boller i hver. Hvor mange kasser skal han bruge?', '["13", "14", "15", "16"]', 2, 'hard'),
('division', 'Hvad er 84 ÷ 7?', '["10", "11", "12", "13"]', 2, 'easy'),
('division', 'Hvad er 135 ÷ 9?', '["13", "14", "15", "16"]', 2, 'medium'),
('division', 'Hvad er 252 ÷ 12?', '["19", "20", "21", "22"]', 2, 'hard');

-- Brøker (15 questions)
INSERT INTO quiz_questions (topic, question, options, correct_answer, difficulty) VALUES
('brøker', 'Hvad er 1/2 + 1/2?', '["1/2", "1", "2", "1/4"]', 1, 'easy'),
('brøker', 'Hvad er 1/4 + 1/4?', '["1/8", "1/2", "2/4", "1/4"]', 1, 'easy'),
('brøker', 'Hvad er 3/4 - 1/4?', '["1/4", "1/2", "2/4", "3/4"]', 1, 'easy'),
('brøker', 'Hvad er 2/3 + 1/3?', '["2/3", "3/6", "1", "3/3"]', 2, 'medium'),
('brøker', 'Hvad er 5/6 - 2/6?', '["1/6", "2/6", "3/6", "4/6"]', 2, 'medium'),
('brøker', 'Hvad er 1/2 + 1/4?', '["1/6", "2/6", "3/4", "2/4"]', 2, 'medium'),
('brøker', 'Hvad er 3/5 + 1/5?', '["3/5", "4/5", "2/5", "5/5"]', 1, 'easy'),
('brøker', 'Hvis du har en pizza skåret i 8 stykker, og du spiser 3 stykker, hvilken brøk af pizzaen har du spist?', '["1/8", "3/8", "5/8", "8/3"]', 1, 'medium'),
('brøker', 'Hvad er 2/4 forenklet?', '["1/4", "1/2", "2/2", "4/2"]', 1, 'medium'),
('brøker', 'Hvad er 4/8 forenklet?', '["1/4", "1/2", "2/4", "4/4"]', 1, 'medium'),
('brøker', 'Hvilken brøk er større: 1/2 eller 1/3?', '["1/3", "1/2", "De er lige store", "Kan ikke sammenlignes"]', 1, 'easy'),
('brøker', 'Hvad er 3/4 + 1/8?', '["4/8", "5/8", "7/8", "8/8"]', 2, 'hard'),
('brøker', 'Hvad er 5/10 forenklet?', '["1/5", "1/2", "2/5", "5/5"]', 1, 'medium'),
('brøker', 'Hvis en klasse har 20 elever, og 15 af dem er piger, hvilken brøk af klassen er piger?', '["15/20", "3/4", "20/15", "1/4"]', 1, 'medium'),
('brøker', 'Hvad er 7/8 - 3/8?', '["3/8", "4/8", "5/8", "10/8"]', 1, 'easy');

-- Geometri (15 questions)
INSERT INTO quiz_questions (topic, question, options, correct_answer, difficulty) VALUES
('geometri', 'Hvor mange sider har en trekant?', '["2", "3", "4", "5"]', 1, 'easy'),
('geometri', 'Hvor mange sider har et rektangel?', '["3", "4", "5", "6"]', 1, 'easy'),
('geometri', 'Hvad er arealet af et rektangel med længde 8 cm og bredde 5 cm?', '["13 cm²", "26 cm²", "40 cm²", "80 cm²"]', 2, 'medium'),
('geometri', 'Hvad er omkredsen af et kvadrat med sidelængde 6 cm?', '["12 cm", "18 cm", "24 cm", "36 cm"]', 2, 'medium'),
('geometri', 'Hvor mange grader er der i en ret vinkel?', '["45°", "60°", "90°", "180°"]', 2, 'easy'),
('geometri', 'Hvad er arealet af et kvadrat med sidelængde 7 cm?', '["14 cm²", "28 cm²", "35 cm²", "49 cm²"]', 3, 'medium'),
('geometri', 'Hvor mange hjørner har en terning?', '["4", "6", "8", "12"]', 2, 'medium'),
('geometri', 'Hvad er omkredsen af et rektangel med længde 10 cm og bredde 4 cm?', '["14 cm", "20 cm", "28 cm", "40 cm"]', 2, 'medium'),
('geometri', 'Hvor mange grader er der i en cirkel?', '["90°", "180°", "270°", "360°"]', 3, 'easy'),
('geometri', 'Hvilken form har 5 sider?', '["Pentagon", "Hexagon", "Octagon", "Kvadrat"]', 0, 'medium'),
('geometri', 'Hvad er arealet af et rektangel med længde 12 cm og bredde 3 cm?', '["15 cm²", "24 cm²", "30 cm²", "36 cm²"]', 3, 'medium'),
('geometri', 'Hvor mange flader har en terning?', '["4", "6", "8", "12"]', 1, 'easy'),
('geometri', 'Hvis en trekant har en base på 8 cm og en højde på 6 cm, hvad er så arealet?', '["14 cm²", "24 cm²", "48 cm²", "40 cm²"]', 1, 'hard'),
('geometri', 'Hvad kalder man en trekant med to lige lange sider?', '["Ligebenet", "Ligesidet", "Retvinklet", "Stumpvinklet"]', 0, 'medium'),
('geometri', 'Hvor mange symmetrilinjer har et kvadrat?', '["2", "3", "4", "5"]', 2, 'hard');

-- Problemregning (15 questions)
INSERT INTO quiz_questions (topic, question, options, correct_answer, difficulty) VALUES
('problemregning', 'Anna har 45 kr. Hun køber en is til 12 kr. Hvor mange penge har hun tilbage?', '["57 kr", "33 kr", "23 kr", "37 kr"]', 1, 'easy'),
('problemregning', 'En bus kan have 48 passagerer. Der er allerede 29 passagerer i bussen. Hvor mange flere kan komme med?', '["17", "19", "21", "23"]', 1, 'medium'),
('problemregning', 'Peter samler 24 æbler, og Maria samler 18 æbler. Hvor mange æbler har de tilsammen?', '["36", "40", "42", "44"]', 2, 'easy'),
('problemregning', 'En skole har 125 elever. 58 af dem er drenge. Hvor mange piger er der?', '["57", "63", "67", "73"]', 2, 'medium'),
('problemregning', 'En biograf har 12 rækker med 15 sæder i hver række. Hvor mange sæder er der i alt?', '["160", "170", "180", "190"]', 2, 'hard'),
('problemregning', 'Lisa læser 8 sider hver dag. Hvor mange sider har hun læst efter 7 dage?', '["54", "56", "58", "60"]', 1, 'medium'),
('problemregning', 'En pakke indeholder 6 æbler. Hvor mange æbler er der i 9 pakker?', '["48", "52", "54", "56"]', 2, 'medium'),
('problemregning', 'Mads har 3 gange så mange klistermærker som Sara. Sara har 14 klistermærker. Hvor mange har Mads?', '["28", "38", "42", "48"]', 2, 'medium'),
('problemregning', 'Et tog kører fra København kl. 10:30 og ankommer til Aarhus kl. 13:45. Hvor lang tid tager turen?', '["2 timer 15 min", "2 timer 45 min", "3 timer 15 min", "3 timer 45 min"]', 2, 'hard'),
('problemregning', 'En fabrik producerer 240 legetøjsbiler om dagen. Hvor mange biler producerer de på 5 dage?', '["1000", "1100", "1200", "1300"]', 2, 'hard'),
('problemregning', 'Emma har 72 kr. Hun vil købe chokoladebarer til 8 kr stykket. Hvor mange kan hun købe?', '["8", "9", "10", "11"]', 1, 'medium'),
('problemregning', 'En opgave starter kl. 14:20 og slutter kl. 15:35. Hvor lang tid tager opgaven?', '["55 min", "1 time 5 min", "1 time 15 min", "1 time 25 min"]', 2, 'hard'),
('problemregning', 'Der er 156 elever på en skole. De skal deles i grupper af 12 elever. Hvor mange grupper bliver der?', '["11", "12", "13", "14"]', 2, 'hard'),
('problemregning', 'Thomas sparer 15 kr om ugen. Hvor mange penge har han sparet efter 8 uger?', '["105 kr", "110 kr", "120 kr", "130 kr"]', 2, 'medium'),
('problemregning', 'En cykeltur er 36 km lang. Hvis du har cyklet 18 km, hvilken brøk af turen har du cyklet?', '["1/3", "1/2", "2/3", "3/4"]', 1, 'medium');

-- =====================================================
-- USEFUL QUERIES (FOR REFERENCE)
-- =====================================================

-- Get top 10 players by rating:
-- SELECT username, rating, matches_played, matches_won
-- FROM users
-- WHERE role = 'student'
-- ORDER BY rating DESC
-- LIMIT 10;

-- Get user stats with win rate:
-- SELECT
--   username,
--   rating,
--   matches_played,
--   matches_won,
--   ROUND(100.0 * matches_won / NULLIF(matches_played, 0), 1) as win_rate
-- FROM users
-- WHERE id = 'user_id_here';

-- Get quiz accuracy by topic for a user:
-- SELECT
--   qq.topic,
--   COUNT(*) as attempts,
--   SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct,
--   ROUND(100.0 * SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy
-- FROM quiz_attempts qa
-- JOIN quiz_questions qq ON qa.question_id = qq.id
-- WHERE qa.user_id = 'user_id_here'
-- GROUP BY qq.topic;

-- Get recent match history for user:
-- SELECT
--   mr.match_type,
--   mp.placement,
--   mp.kills,
--   mp.rating_change,
--   mr.created_at
-- FROM match_participants mp
-- JOIN match_results mr ON mp.match_id = mr.id
-- WHERE mp.user_id = 'user_id_here'
-- ORDER BY mr.created_at DESC
-- LIMIT 10;
