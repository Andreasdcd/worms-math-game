# Worms Math Game

A multiplayer artillery game inspired by Worms, where players answer math questions to determine turn order and then battle it out in physics-based combat!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)

## Project Overview

This is a web-based multiplayer game built with:
- **Frontend**: Phaser.js 3.70 (game engine) with Matter.js physics
- **Backend**: Node.js with Express and Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Deployment**: GitHub Pages (frontend) + Render.com (backend)

## Project Structure

```
worms-math-game/
├── client/               # Frontend (Phaser.js game)
│   ├── index.html       # Main HTML file
│   ├── src/
│   │   ├── main.js      # Phaser game entry point
│   │   ├── scenes/      # Game scenes (menu, gameplay, etc.)
│   │   ├── entities/    # Player, projectile classes
│   │   └── utils/       # Helper functions
│   ├── assets/          # Images, sounds, sprites
│   └── package.json
│
├── server/              # Backend (Node.js)
│   ├── index.js         # Express + Socket.IO entry point
│   ├── routes/          # REST API routes
│   ├── socket/          # WebSocket event handlers
│   ├── services/        # Business logic (matchmaking, rating, etc.)
│   └── package.json
│
├── shared/              # Shared code between client/server
│   └── constants.js     # Game constants, match types, colors
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm installed
- Git (optional)

### 1. Install Client Dependencies

```bash
cd client
npm install
```

### 2. Install Server Dependencies

```bash
cd ../server
npm install
```

### 3. Configure Environment (Optional)

Create a `.env` file in the `server/` directory for Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
```

The server will run without Supabase if credentials are not provided.

## Running Locally

### Start the Server

```bash
cd server
npm start
```

The server will start on `http://localhost:3000`

You should see:
```
=================================
Worms Math Game Server
=================================
Server running on port 3000
Health check: http://localhost:3000/health
WebSocket: ws://localhost:3000
=================================
```

### Start the Client

In a new terminal:

```bash
cd client
npm start
```

This will start a local web server on `http://localhost:8080` and open the game in your browser.

You should see the Phaser game window with a "Loading..." or "Connected to Server!" message.

## Testing the Setup

### 1. Test Server Health Check

Open your browser or use curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T...",
  "supabase": "not configured"
}
```

### 2. Test Client Connection

1. Open `http://localhost:8080` in your browser
2. Open browser console (F12)
3. You should see:
   - "Preloading assets..."
   - "Game created!"
   - "Connected to server: [socket-id]" (if server is running)

### 3. Test WebSocket Communication

In the browser console, try:
```javascript
socket.emit('join_matchmaking', { playerName: 'Test' });
```

You should see a response in the server console.

## Development Workflow

### Client Development
```bash
cd client
npm run dev  # Starts server without auto-opening browser
```

### Server Development (with auto-restart)
```bash
cd server
npm run dev  # Uses Node.js --watch flag for auto-restart
```

## ✨ Features

### Core Gameplay
- **Turn-Based Artillery Combat** - Worms-style physics-based battles
- **Math Quiz Integration** - Answer math questions to determine turn order
- **Real-time Multiplayer** - Socket.io powered synchronization
- **Destructible Terrain** - Dynamic terrain destruction with explosions
- **Matter.js Physics** - Realistic projectile trajectories

### Game Modes
- **1v1 Duel** - Head-to-head battles
- **Free-For-All (FFA)** - Up to 8 players compete
- **Team Battles** - 2v2, 3v3, 4v4 team modes

### Progression & Stats
- **ELO Rating System** - Competitive ranking (starts at 0, can go negative)
- **Leaderboard** - Top 20 players with W-L records and K/D ratios
- **Match Statistics** - Damage dealt, accuracy, kills, deaths tracked
- **Teacher Dashboard** - Track student progress and quiz performance

### Educational Value
- **100+ Math Questions** - Addition, subtraction, multiplication, division
- **Difficulty Levels** - Easy, medium, hard questions
- **Performance Tracking** - Teachers can monitor quiz accuracy by topic

## 🎮 How to Play

### 1. Lobby & Matchmaking
- Login or register
- View leaderboard (top 20 players)
- Click "Find Match" and select mode (1v1, FFA, Teams)

### 2. Quiz Phase (60 seconds)
- Answer math questions quickly and correctly
- Better performance = earlier turn order in game
- See who's finished in real-time

### 3. Artillery Combat
- **Aim**: Use mouse to aim your shot
- **Power**: Hold SPACE to charge power (0-100%)
- **Fire**: Release SPACE to launch projectile
- **Strategy**: Account for wind, terrain, and distance

### 4. Victory
- Last worm/team standing wins
- View match statistics and rating changes
- Check updated leaderboard placement

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - How to deploy to production
- **[Integration Testing](./INTEGRATION_TESTING.md)** - Test scenarios and execution
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist
- **[User Manual](./USER_MANUAL.md)** - Player and teacher guides
- **[Database Design](./server/database/DATABASE_DESIGN.md)** - Schema documentation
- **[API Documentation](#api-documentation)** - REST and WebSocket endpoints

## 🎓 For Teachers

### Teacher Dashboard
- Login with teacher account
- View student list and performance
- Track quiz accuracy by topic
- Monitor match history and combat stats

### Creating Teacher Account
Teachers must be granted access by updating the database:
```sql
UPDATE users SET role = 'teacher' WHERE username = 'teacher_username';
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Game Engine | Phaser.js | 3.70.0 |
| Physics | Matter.js | (bundled with Phaser) |
| Frontend Server | http-server | 14.1.1 |
| Backend Server | Express | 4.18.0 |
| WebSocket | Socket.IO | 4.7.0 |
| Database | Supabase | 2.39.0 |
| Language | JavaScript | ES6+ |

## 🚀 Deployment

### Quick Deployment

**Frontend (GitHub Pages - Free):**
```bash
cd client
npm install gh-pages --save-dev
npm run deploy
```

**Backend (Render.com - Free Tier):**
1. Connect GitHub repository to Render
2. Set environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `CLIENT_URL`
3. Deploy automatically from `main` branch

**Full deployment guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📡 API Documentation

### Authentication

**POST `/api/auth/register`**
```json
{
  "username": "player1",
  "password": "password123"
}
```

**POST `/api/auth/login`**
```json
{
  "username": "player1",
  "password": "password123"
}
```
Returns: `{ success: true, userId, username, rating }`

### Quiz

**GET `/api/quiz/random?difficulty=easy&limit=5`**

Returns 5 random math questions of specified difficulty.

### Matches

**POST `/api/matches`**
```json
{
  "type": "ffa",
  "participants": [...],
  "duration": 180
}
```
Returns rating changes for all participants.

### Leaderboard

**GET `/api/leaderboard?limit=20`**

Returns top 20 players with stats (rank, username, matches, W-L, K/D).

**GET `/api/leaderboard/profile/:userId`**

Returns specific player's detailed stats.

### WebSocket Events

**Client → Server:**
- `join_matchmaking` - Join matchmaking queue
- `leave_matchmaking` - Leave queue
- `ready` - Mark ready in waiting room
- `quiz:answer` - Submit quiz answer
- `game:action` - Fire weapon (angle, power)

**Server → Client:**
- `matchmaking:matched` - Match found
- `quiz:start` - Quiz begins
- `game:turn_start` - Player's turn begins
- `game:projectile_fired` - Projectile launched
- `game:damage_dealt` - Damage applied
- `game:match_end` - Game over

## 🔧 Troubleshooting

### Server Won't Start
- Check port 3000 is not in use: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
- Verify Node.js version: `node --version` (need v16+)
- Check `.env` file exists and has correct Supabase credentials

### Client Can't Connect to Server
- Verify server is running: `curl http://localhost:3000/health`
- Check `SERVER_URL` in `client/src/utils/networkManager.js`
- Open browser console (F12) and look for WebSocket errors
- Ensure CORS is enabled on server

### Players Can't Find Each Other
- Both players must select same game mode
- Check server logs for matchmaking events
- Verify WebSocket connection established
- Try refreshing both browser tabs

### Projectiles Don't Sync
- Check browser console for `game:projectile_fired` events
- Verify both clients connected to same room
- Check server logs for game state updates
- Ensure both players' browsers support WebSocket

### Database Connection Issues
- Verify Supabase project is active (not paused)
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Test connection: Run server and check logs
- Ensure schema is loaded: `SELECT * FROM users LIMIT 1;`

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style
- Use camelCase for variables
- Comment complex logic
- Test locally before submitting
- Follow existing patterns

## 📈 Roadmap

### Version 1.1 (Planned)
- [ ] Power-ups (shields, double damage, healing)
- [ ] More worm characters and customization
- [ ] Replay system for matches
- [ ] Achievements and badges

### Version 2.0 (Future)
- [ ] Tournament mode
- [ ] AI opponents for practice
- [ ] Map editor for custom terrains
- [ ] Voice chat integration

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

## 💬 Support

**Documentation:**
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [User Manual](./USER_MANUAL.md)
- [Testing Guide](./INTEGRATION_TESTING.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)

**Contact:**
- GitHub Issues: [Report Bug](https://github.com/YOUR_USERNAME/worms-math-game/issues)
- Email: support@example.com

---

**Last Updated:** 2026-04-23 | **Version:** 1.0.0 | **Status:** Production Ready
