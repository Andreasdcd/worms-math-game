# Supabase Setup Guide

Complete step-by-step guide to set up Supabase for the Worms Math Game.

## Prerequisites

- A GitHub or Google account (for Supabase login)
- Basic understanding of SQL

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with GitHub or Google
4. Click **"New Project"**
5. Fill in project details:
   - **Organization**: Select or create one
   - **Name**: `worms-math-game` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to Denmark (e.g., `eu-central-1`)
   - **Pricing Plan**: Free tier is sufficient for development
6. Click **"Create new project"**
7. Wait 2-3 minutes for provisioning

---

## Step 2: Get API Credentials

1. Once the project is ready, go to **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Project API keys**:
     - `anon` `public` key (safe for client-side)
     - `service_role` key (NEVER expose to client)

4. Copy the following:
   - **URL**: The Project URL
   - **anon key**: The public API key

**Important**: We'll use the `anon` key for now since MVP doesn't have auth. For production, you'd use Row Level Security (RLS).

---

## Step 3: Run Database Schema

1. In Supabase dashboard, click **SQL Editor** (in left sidebar)
2. Click **"New query"**
3. Open the file `server/database/schema.sql` from this project
4. Copy the ENTIRE contents of `schema.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter`)
7. You should see:
   - ✅ "Success. No rows returned"
   - Check the **Tables** section in left sidebar to verify tables were created

**Expected tables:**
- `users`
- `quiz_questions` (pre-populated with 60 questions!)
- `quiz_attempts`
- `match_results`
- `match_participants`
- `match_teams`

---

## Step 4: Verify Sample Data

1. In Supabase dashboard, click **Table Editor** (in left sidebar)
2. Click **`quiz_questions`** table
3. You should see 60 rows of quiz questions in Danish
4. Verify different topics: `division`, `brøker`, `geometri`, `problemregning`

---

## Step 5: Configure Environment Variables

1. In your project root, create `.env` file:
   ```bash
   cd C:\Users\decro\worms-math-game\server
   copy .env.example .env
   ```

2. Open `.env` and fill in your credentials:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=your_anon_public_key_here
   PORT=3000
   ```

3. **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`.

---

## Step 6: Test Connection

1. Start the server:
   ```bash
   cd C:\Users\decro\worms-math-game\server
   npm start
   ```

2. You should see:
   ```
   Supabase initialized
   Server running on port 3000
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-04-23T...",
     "supabase": "connected"
   }
   ```

---

## Step 7: Test API Endpoints

### Create a user
```bash
curl -X POST http://localhost:3000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TestElev1\"}"
```

### Get leaderboard
```bash
curl http://localhost:3000/api/leaderboard
```

### Get random quiz questions
```bash
curl "http://localhost:3000/api/quiz/random?topic=division&count=5"
```

---

## Optional: Enable Row Level Security (RLS)

For MVP, we're skipping authentication. But for production:

1. Go to **Authentication** > **Policies**
2. Enable RLS on all tables
3. Create policies:
   - Users can read all quiz questions
   - Users can only insert their own quiz attempts
   - Users can read leaderboard
   - etc.

Example policy (for future):
```sql
-- Allow users to read all quiz questions
CREATE POLICY "Public quiz questions" ON quiz_questions
  FOR SELECT USING (true);

-- Allow users to insert their own quiz attempts
CREATE POLICY "Users insert own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Troubleshooting

### Issue: "Supabase credentials not found"
- Check that `.env` file exists in `server/` directory
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set correctly
- Restart the server after changing `.env`

### Issue: "relation 'users' does not exist"
- Make sure you ran the entire `schema.sql` in SQL Editor
- Check for any SQL errors in the Supabase dashboard

### Issue: "Invalid API key"
- Double-check you're using the `anon` key, not `service_role`
- Ensure there are no extra spaces in the `.env` file

### Issue: Connection timeout
- Check your internet connection
- Verify the Supabase project URL is correct
- Try accessing the Supabase dashboard to confirm project is running

---

## Useful Supabase Dashboard Features

### 1. Table Editor
- View and edit data directly
- Add test users manually
- Inspect quiz questions

### 2. SQL Editor
- Run custom queries
- Test complex joins
- Debug data issues

### 3. Database > Logs
- View all queries
- Monitor performance
- Debug slow queries

### 4. API Documentation
- Auto-generated docs for your tables
- Example curl commands
- JavaScript/TypeScript examples

---

## Next Steps

1. ✅ Database schema created
2. ✅ Sample quiz questions inserted
3. ✅ API credentials configured
4. 🔜 Test API endpoints
5. 🔜 Build game logic
6. 🔜 Connect frontend

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Security Notes for Production

1. **Never expose `service_role` key** - Only use in server-side code
2. **Enable RLS** - Protect user data with row-level security
3. **Use environment variables** - Never hardcode credentials
4. **Enable HTTPS** - Always use secure connections
5. **Backup your database** - Supabase has automatic backups, but verify

---

**Good luck! You're ready to build the Worms Math Game!** 🎮
