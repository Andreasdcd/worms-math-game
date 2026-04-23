# Worms Math Game - Deployment Guide

Complete guide for deploying the Worms Math Game to production using **GitHub Pages** (frontend) and **Render.com** (backend).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Section 1: Supabase Setup](#section-1-supabase-setup)
- [Section 2: Deploy Backend to Render.com](#section-2-deploy-backend-to-rendercom)
- [Section 3: Deploy Frontend to GitHub Pages](#section-3-deploy-frontend-to-github-pages)
- [Section 4: Post-Deployment Testing](#section-4-post-deployment-testing)
- [Section 5: Monitoring & Maintenance](#section-5-monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deployment, ensure you have:

- **GitHub Account** (free)
- **Render.com Account** (free tier available)
- **Supabase Account** (free tier available)
- **Git** installed locally
- **Node.js** (v16+) installed locally
- Project pushed to GitHub repository

---

## Section 1: Supabase Setup

Supabase provides the PostgreSQL database for user accounts, matches, and leaderboards.

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `worms-math-game` (or your choice)
   - **Database Password**: (Generate strong password - SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is sufficient
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to initialize

### 1.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the contents of `server/database/schema.sql` from your project
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify tables created: Go to **Table Editor** and check:
   - `users`
   - `matches`
   - `match_participants`

### 1.3 Seed Quiz Questions

1. In Supabase SQL Editor, click **"New Query"**
2. Open `server/data/quiz_questions.json` locally
3. For each question, run INSERT statements:

```sql
INSERT INTO quiz_questions (question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, difficulty, topic)
VALUES
('Hvad er 7 + 8?', '15', '14', '16', '13', 'easy', 'addition'),
('Hvad er 12 - 5?', '7', '6', '8', '5', 'easy', 'subtraction');
-- Add all questions...
```

Or use the seed script (if you have Node.js locally):
```bash
cd server
npm install
node scripts/seedQuizQuestions.js
```

### 1.4 Get API Credentials

1. In Supabase dashboard, go to **Settings > API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public** key: Long string starting with `eyJ...`

**IMPORTANT:** Keep these credentials secure!

---

## Section 2: Deploy Backend to Render.com

Render.com will host the Node.js/Socket.io server (free tier includes 750 hours/month).

### 2.1 Prepare Repository

1. Ensure `server/render.yaml` exists in your repo (already created)
2. Commit and push all changes:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2.2 Create Render Web Service

1. Go to [https://render.com](https://render.com)
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Select `worms-math-game` repository
6. Fill in:
   - **Name**: `worms-math-server`
   - **Region**: Frankfurt (or closest to users)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free

### 2.3 Configure Environment Variables

Still in Render web service settings, go to **Environment** tab:

Add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `10000` | Default Render port |
| `SUPABASE_URL` | `https://your-project-id.supabase.co` | From Supabase |
| `SUPABASE_KEY` | `eyJ...` | Your anon key from Supabase |
| `CLIENT_URL` | `https://YOUR_GITHUB_USERNAME.github.io/worms-math-game` | Update after deploying frontend |

### 2.4 Deploy Server

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Start your server
3. Wait 3-5 minutes for first deployment
4. Check **Logs** tab for any errors
5. Once deployed, note your server URL:
   - Example: `https://worms-math-server.onrender.com`

### 2.5 Test Server

1. Open browser to: `https://YOUR_APP_NAME.onrender.com/health`
2. You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T12:00:00.000Z"
}
```

If you see this, server is running!

**Note:** Free tier servers sleep after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.

---

## Section 3: Deploy Frontend to GitHub Pages

GitHub Pages will host the static frontend files (free for public repos).

### 3.1 Update Frontend Configuration

1. Open `client/package.json`
2. Update `homepage` field:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/worms-math-game"
```

3. Open `client/src/utils/networkManager.js` (or wherever server URL is configured)
4. Update server URL to your Render URL:
```javascript
const SERVER_URL = 'https://YOUR_APP_NAME.onrender.com';
```

5. Commit changes:
```bash
git add client/package.json client/src/utils/networkManager.js
git commit -m "Update URLs for production"
git push origin main
```

### 3.2 Build Frontend

```bash
cd client
npm install
npm run build
```

This creates a `dist/` folder with all files ready for deployment.

### 3.3 Deploy to GitHub Pages

```bash
npm run deploy
```

This command:
1. Builds the project
2. Pushes `dist/` contents to `gh-pages` branch
3. GitHub automatically serves it

### 3.4 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your site will be live at: `https://YOUR_USERNAME.github.io/worms-math-game`

### 3.5 Update Server CORS

Now that frontend is deployed, update server's `CLIENT_URL`:

1. Go back to Render dashboard
2. Select your web service
3. Go to **Environment** tab
4. Update `CLIENT_URL` to:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/worms-math-game
   ```
5. Click **Save Changes**
6. Server will automatically redeploy (takes 1-2 minutes)

---

## Section 4: Post-Deployment Testing

### 4.1 Complete Flow Test

1. Open your deployed site: `https://YOUR_USERNAME.github.io/worms-math-game`
2. Click **"Log Ind"** (Login)
3. Create account (or login)
4. Verify you see the lobby with leaderboard
5. Click **"Find Match"**
6. (In another browser tab/window) Login with different account
7. Both players join same room
8. Complete quiz phase
9. Play game match
10. Verify:
    - Turns work correctly
    - Projectiles sync between clients
    - Damage applies
    - Winner announced
    - Ratings update
    - Leaderboard refreshes

### 4.2 Test Checklist

- [ ] Login/registration works
- [ ] Matchmaking finds opponents
- [ ] Quiz appears and timer works
- [ ] Quiz answers submit correctly
- [ ] Turn order based on quiz performance
- [ ] Game physics sync between clients
- [ ] Damage calculation correct
- [ ] Win condition triggers
- [ ] Ratings update (visible in Victory screen)
- [ ] Leaderboard displays correctly
- [ ] Teacher dashboard accessible
- [ ] Mobile responsiveness works

### 4.3 Performance Checks

**Server:**
- First request may take 30-60s (cold start on free tier)
- Subsequent requests < 500ms

**Client:**
- Initial load < 3s on decent connection
- Socket connection established within 2s
- No console errors in browser DevTools

---

## Section 5: Monitoring & Maintenance

### 5.1 Monitor Server Health

**Render Dashboard:**
- Check **Metrics** tab for:
  - CPU usage
  - Memory usage
  - Request count
- Check **Logs** for errors

**Server Logs:**
- Access via Render dashboard → Logs tab
- Look for:
  - Connection errors
  - Database errors
  - Socket.io errors

### 5.2 Monitor Database

**Supabase Dashboard:**
- Go to **Database** → **Tables**
- Check row counts:
  - `users`: Growing as players register
  - `matches`: Growing as matches complete
  - `quiz_questions`: Should have 100+ questions

**Performance:**
- Go to **Database** → **Roles & Privileges**
- Monitor query performance
- Free tier: 500 MB storage, 2 GB data transfer

### 5.3 Backup Database

1. Supabase dashboard → **Database** → **Backups**
2. Free tier: Daily backups retained for 7 days
3. For manual backup:
   - Use Supabase SQL Editor
   - Run: `SELECT * FROM users;` (export as CSV)
   - Repeat for each table

### 5.4 Update Deployment

**Update Frontend:**
```bash
cd client
# Make changes...
git add .
git commit -m "Update frontend"
git push origin main
npm run deploy
```

**Update Backend:**
```bash
cd server
# Make changes...
git add .
git commit -m "Update server"
git push origin main
# Render automatically redeploys on git push
```

---

## Troubleshooting

### Frontend Issues

**Problem:** GitHub Pages shows 404

**Solution:**
1. Check Settings → Pages is enabled
2. Verify branch is `gh-pages`
3. Wait 2-3 minutes after deploy
4. Clear browser cache

---

**Problem:** Can't connect to server

**Solution:**
1. Check browser console for errors
2. Verify `SERVER_URL` matches your Render URL
3. Check CORS settings on server
4. Ensure server is running (check Render logs)

---

### Backend Issues

**Problem:** Server deployment fails

**Solution:**
1. Check Render logs for error message
2. Verify `package.json` has all dependencies
3. Ensure `index.js` exists in `server/` folder
4. Check environment variables are set

---

**Problem:** Database connection error

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
2. Check Supabase project is active (not paused)
3. Test connection from server logs
4. Verify database schema is loaded

---

**Problem:** Server sleeps on free tier

**Solution:**
- Expected behavior on Render free tier
- Server sleeps after 15 min inactivity
- First request wakes server (30-60s delay)
- Upgrade to paid tier ($7/month) for always-on server

---

**Problem:** Socket.io connection fails

**Solution:**
1. Check browser console for WebSocket errors
2. Verify server supports WebSocket (Render does by default)
3. Check firewall/antivirus isn't blocking WebSocket
4. Try different browser

---

### Database Issues

**Problem:** Quiz questions not loading

**Solution:**
1. Supabase → SQL Editor → Run:
   ```sql
   SELECT COUNT(*) FROM quiz_questions;
   ```
2. If count is 0, re-run seed script
3. Check question format matches schema

---

**Problem:** Ratings not updating

**Solution:**
1. Check server logs for `/api/matches` POST errors
2. Verify `ratingService.js` has correct logic
3. Test manually:
   ```bash
   curl -X POST https://your-app.onrender.com/api/matches \
     -H "Content-Type: application/json" \
     -d '{"type":"ffa","participants":[...]}'
   ```

---

## Cost Breakdown (Free Tier)

| Service | Free Tier Limits | Upgrade Cost |
|---------|-----------------|--------------|
| **GitHub Pages** | 100 GB bandwidth/month | Free (unlimited for public repos) |
| **Render.com** | 750 hours/month, sleeps after 15min | $7/month for always-on |
| **Supabase** | 500 MB database, 2 GB bandwidth | $25/month for Pro |

**Total:** $0/month for development/testing

**Total (Production):** ~$32/month for production-ready setup

---

## Next Steps

1. Complete [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Review [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for test scenarios
3. Read [USER_MANUAL.md](./USER_MANUAL.md) for player/teacher guides
4. Monitor deployment for first 24 hours

---

## Support

**Issues:**
- Check GitHub repository Issues tab
- Review server logs on Render
- Check Supabase logs

**Documentation:**
- [README.md](./README.md) - Project overview
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist
- [USER_MANUAL.md](./USER_MANUAL.md) - End-user guide

---

**Deployment Date:** _________________

**Deployed By:** _________________

**URLs:**
- Frontend: `https://________________.github.io/worms-math-game`
- Backend: `https://________________.onrender.com`
- Database: `https://________________.supabase.co`

**Status:** [ ] Dev [ ] Staging [ ] Production
