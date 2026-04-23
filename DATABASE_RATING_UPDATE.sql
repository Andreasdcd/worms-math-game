-- Database Update for Rating System (Stream 7)
-- Changes rating default from 1000 to 0
-- Run this ONLY if database was created with old schema

-- IMPORTANT: This will reset all existing ratings to 0
-- Only run this if you want to reset the rating system

-- Option 1: Update the default for new users only
ALTER TABLE users
ALTER COLUMN rating SET DEFAULT 0;

-- Option 2: Reset ALL existing users to 0 (DESTRUCTIVE!)
-- Uncomment only if you want to reset:
-- UPDATE users SET rating = 0;

-- Verify the change:
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'rating';

-- Expected output:
-- column_name | column_default
-- rating      | 0

-- Check current user ratings:
SELECT username, rating, matches_played, matches_won
FROM users
ORDER BY rating DESC
LIMIT 10;

-- NOTE: The application code has been updated to:
-- 1. Start new users at rating 0
-- 2. Allow negative ratings (no floor)
-- 3. Handle rating 0 as "first match"

-- No further database changes needed for Stream 7
