# Developer Quick Reference

## Installation & Startup

```bash
# One-time setup
cd C:\Users\decro\worms-math-game
install.bat  # Windows
# or
./install.sh # Linux/Mac

# Start server (Terminal 1)
cd server && npm start

# Start client (Terminal 2)
cd client && npm start
```

## Important Paths

| Path | Purpose |
|------|---------|
| `C:\Users\decro\worms-math-game\` | Project root |
| `client/src/main.js` | Phaser entry point |
| `server/index.js` | Express entry point |
| `shared/constants.js` | Shared constants |

## URLs

| Service | URL |
|---------|-----|
| Client | http://localhost:8080 |
| Server | http://localhost:3000 |
| Health | http://localhost:3000/health |
| WebSocket | ws://localhost:3000 |

## Team Colors

```javascript
TEAM_COLORS = {
    1: '#FF0000', // Red (rød)
    2: '#0000FF', // Blue (blå)
    3: '#00FF00', // Green (grøn)
    4: '#FFFF00'  // Yellow (gul)
}
```

## Game Constants (Quick Access)

```javascript
// Client (browser)
window.GAME_CONSTANTS.GAME_CONFIG.INITIAL_HP // 100
window.GAME_CONSTANTS.TEAM_COLORS[1] // '#FF0000'

// Server (Node.js)
const { GAME_CONFIG, TEAM_COLORS } = require('../shared/constants');
```

## Common Socket Events

```javascript
// Client → Server
socket.emit('join_matchmaking', { playerName: 'Player1' });
socket.emit('game_action', { type: 'shoot', power: 300 });

// Server → Client
socket.emit('match_found', { matchId: '123', teams: [...] });
socket.emit('game_state', { players: [...], turn: 1 });
```

## File Locations for Agents

| Agent | Primary Location | Files to Create |
|-------|------------------|-----------------|
| Game Logic | `client/src/scenes/` | GameScene.js, MenuScene.js |
| Game Logic | `client/src/entities/` | Player.js, Projectile.js |
| Matchmaking | `server/services/` | matchmaking.js |
| Matchmaking | `server/socket/` | matchmaking.js |
| Database | `server/routes/` | users.js, matches.js |
| Database | `server/services/` | rating.js, database.js |
| UI | `client/src/scenes/` | MenuScene.js, HUDScene.js |

## Adding New Dependencies

```bash
# Client
cd client
npm install <package-name>

# Server
cd server
npm install <package-name>
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Or visit in browser
http://localhost:3000/health
```

## Debugging

```javascript
// Client (browser console)
console.log(game); // Phaser game instance
console.log(socket); // Socket.IO client

// Server (add to index.js)
console.log('Client connected:', socket.id);
```

## Phaser Basics

```javascript
// Scene structure
class GameScene extends Phaser.Scene {
    preload() { /* Load assets */ }
    create() { /* Initialize game */ }
    update(time, delta) { /* Game loop */ }
}
```

## Common Tasks

### Add New Scene
1. Create `client/src/scenes/MyScene.js`
2. Import in `main.js`
3. Add to Phaser config scenes array

### Add Socket Event
1. Add event name to `shared/constants.js` SOCKET_EVENTS
2. Client: `socket.on('event_name', handler)`
3. Server: `socket.on('event_name', handler)`

### Add API Route
1. Create `server/routes/myroute.js`
2. Import in `server/index.js`
3. Add: `app.use('/api/myroute', require('./routes/myroute'))`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `PORT=3001 npm start` |
| Port 8080 in use | `npx http-server -p 8081` |
| Can't connect | Check server is running |
| CORS error | Verify server CORS config |
| Module not found | Run `npm install` |

## Environment Variables

Create `server/.env`:
```env
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
PORT=3000
```

## Git Commands (If Using Git)

```bash
git init
git add .
git commit -m "Initial foundation setup"
git remote add origin <your-repo>
git push -u origin main
```

## Production Build

```bash
# Build client (TODO: Add build script)
cd client
npm run build

# Deploy server to Render.com
# Set environment variables in Render dashboard
```

---

**Last Updated**: 2026-04-23
