# Project Structure - Worms Math Game

## Complete File Tree

```
worms-math-game/
│
├── .gitignore                    # Git ignore rules
├── README.md                     # Full project documentation
├── QUICKSTART.md                 # Quick start guide
├── PROJECT_STRUCTURE.md          # This file
├── install.bat                   # Windows installation script
├── install.sh                    # Linux/Mac installation script
│
├── client/                       # FRONTEND (Phaser.js)
│   ├── package.json             # Dependencies: phaser, socket.io-client
│   ├── index.html               # Main HTML file with game canvas
│   │
│   ├── src/                     # Source code
│   │   ├── main.js              # Phaser game initialization (800x600, Matter physics)
│   │   ├── scenes/              # Game scenes (to be added by other agents)
│   │   ├── entities/            # Player, Projectile, Terrain classes (to be added)
│   │   └── utils/               # Helper functions (to be added)
│   │
│   └── assets/                  # Game assets (images, sounds, sprites)
│
├── server/                       # BACKEND (Node.js + Express + Socket.IO)
│   ├── package.json             # Dependencies: express, socket.io, supabase, cors
│   ├── index.js                 # Express + Socket.IO server entry point
│   │
│   ├── routes/                  # REST API routes (to be added by other agents)
│   ├── socket/                  # WebSocket event handlers (to be added)
│   └── services/                # Business logic (matchmaking, rating, etc.)
│
└── shared/                       # SHARED CODE (client + server)
    └── constants.js             # Game config, match types, colors, events
```

## Module Breakdown

### Client Module (`/client`)
**Purpose**: Phaser.js game frontend
**Port**: 8080
**Tech Stack**:
- Phaser 3.70.0 (game engine)
- Matter.js (physics - bundled with Phaser)
- Socket.IO Client 4.7.0 (WebSocket)
- http-server (dev server)

**Key Features**:
- 800x600 game canvas
- Matter.js physics engine
- WebSocket connection to server
- Modular scene architecture

**Entry Point**: `index.html` → loads Phaser from CDN → `src/main.js`

---

### Server Module (`/server`)
**Purpose**: Node.js backend with WebSocket support
**Port**: 3000
**Tech Stack**:
- Express 4.18.0 (HTTP server)
- Socket.IO 4.7.0 (WebSocket)
- Supabase 2.39.0 (database client)
- CORS 2.8.5 (cross-origin support)

**Key Features**:
- REST API endpoints (health check, game data)
- WebSocket event handlers (matchmaking, gameplay)
- Supabase integration (optional)
- CORS enabled for localhost:8080

**Entry Point**: `index.js`

**Endpoints**:
- `GET /` - Server info
- `GET /health` - Health check
- WebSocket on same port

---

### Shared Module (`/shared`)
**Purpose**: Constants and types used by both client and server
**Key File**: `constants.js`

**Exports**:
- `GAME_CONFIG` - HP, turn time, physics, weapons
- `MATCH_TYPES` - 1v1, 2v2, FFA configurations
- `TEAM_COLORS` - {1: red, 2: blue, 3: green, 4: yellow}
- `SOCKET_EVENTS` - WebSocket event names
- `RATING_CONFIG` - ELO rating system

**Universal Module**: Works in both Node.js (require) and browser (window)

---

## Dependencies Summary

### Client Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| phaser | 3.70.0 | Game engine with Matter.js physics |
| socket.io-client | 4.7.0 | WebSocket client |
| http-server | 14.1.1 | Dev server (devDependency) |

### Server Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.0 | HTTP server framework |
| socket.io | 4.7.0 | WebSocket server |
| @supabase/supabase-js | 2.39.0 | Database client |
| cors | 2.8.5 | CORS middleware |

---

## Game Constants Reference

### Team Colors
- Team 1: `#FF0000` (rød/red)
- Team 2: `#0000FF` (blå/blue)
- Team 3: `#00FF00` (grøn/green)
- Team 4: `#FFFF00` (gul/yellow)

### Match Types
1. **Quickplay 1v1** - Casual 1v1, not ranked
2. **Ranked 1v1** - Competitive 1v1 with ELO
3. **Team 2v2** - 2 players per team
4. **FFA 4 Player** - 4 teams of 1 player each

### Game Settings
- Initial HP: 100
- Turn time: 30 seconds
- Projectile damage: 30 base
- Explosion radius: 50 pixels
- Question time: 15 seconds
- Correct answer bonus: +10 damage
- Wrong answer penalty: -5 damage

---

## Development Workflow

### Installation
```bash
# Windows
install.bat

# Linux/Mac
chmod +x install.sh
./install.sh

# Manual
cd server && npm install
cd ../client && npm install
```

### Running Locally
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm start
```

### Development Mode
```bash
# Server with auto-restart
cd server
npm run dev

# Client (same as start)
cd client
npm run dev
```

---

## Next Steps for Agents

### Game Logic Agent
**Location**: `client/src/scenes/`, `client/src/entities/`
**Tasks**:
- Create GameScene.js with game loop
- Implement Player.js entity class
- Create Projectile.js with physics
- Build Terrain.js with destructible ground
- Add collision detection

### Matchmaking Agent
**Location**: `server/services/matchmaking.js`, `server/socket/matchmaking.js`
**Tasks**:
- Implement matchmaking queue system
- Create team balancing algorithm
- Handle Socket.IO matchmaking events
- Build match creation logic

### Database Agent
**Location**: `server/routes/`, `server/services/`
**Tasks**:
- Design Supabase schema (users, matches, ratings)
- Create API routes for data access
- Implement rating calculation service
- Build match history tracking

### UI Agent
**Location**: `client/src/scenes/`
**Tasks**:
- Create MenuScene.js (main menu)
- Build MatchmakingScene.js (queue UI)
- Design HUD (health, timer, power bar)
- Implement result screen

---

## Architecture Overview

```
┌─────────────┐         WebSocket (Socket.IO)        ┌─────────────┐
│             │◄──────────────────────────────────────►│             │
│   Client    │                                        │   Server    │
│  (Phaser)   │         HTTP REST API                  │  (Express)  │
│             │◄──────────────────────────────────────►│             │
└─────────────┘                                        └──────┬──────┘
      │                                                       │
      │ Uses constants from                                  │
      │                                                       │
      └──────────────►┌──────────────┐◄────────────────────┘
                      │   /shared    │
                      │ constants.js │
                      └──────────────┘
                             │
                             │ Defines
                             ▼
                    ┌─────────────────┐
                    │  Game Rules     │
                    │  Match Types    │
                    │  Team Colors    │
                    │  Socket Events  │
                    └─────────────────┘
```

---

## Testing Checklist

- [ ] Server health endpoint returns `{status: "ok"}`
- [ ] Client opens on http://localhost:8080
- [ ] Game canvas displays (800x600)
- [ ] "Connected to Server!" message appears
- [ ] Browser console shows connection logs
- [ ] Server console shows client connection
- [ ] WebSocket test: `socket.emit('join_matchmaking', {})` works

---

## Deployment Strategy

### Frontend (GitHub Pages)
1. Build client bundle
2. Push to `gh-pages` branch
3. Configure custom domain (optional)

### Backend (Render.com)
1. Connect GitHub repository
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PORT` (auto-set by Render)
3. Deploy from `server/` directory
4. Update client with production WebSocket URL

---

## Status: READY FOR PARALLEL DEVELOPMENT

All foundation components are in place. Other agents can now work independently on their modules without blocking each other.

**Last Updated**: 2026-04-23
**Foundation Agent**: Complete
**Project Status**: Initialized and ready
