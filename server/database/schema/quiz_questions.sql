-- Quiz Questions Table
-- Stores all quiz questions for the math game

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT 'matematik',
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 answer options
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  grade_level INTEGER NOT NULL DEFAULT 5,
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic ON quiz_questions(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_grade_level ON quiz_questions(grade_level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_questions_updated_at();

-- Insert sample data (will be replaced by seed script)
-- See server/scripts/seedQuizQuestions.js for full question set

COMMENT ON TABLE quiz_questions IS 'Quiz questions for the Worms Math Game - 5. klasse (grade 5)';
COMMENT ON COLUMN quiz_questions.topic IS 'Question topic: division, broeker, geometri, problemregning';
COMMENT ON COLUMN quiz_questions.options IS 'Array of 4 answer options as JSON';
COMMENT ON COLUMN quiz_questions.correct_answer IS 'Index of correct answer (0-3)';
COMMENT ON COLUMN quiz_questions.difficulty IS 'Difficulty level for adaptive learning (future feature)';
