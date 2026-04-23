# Quick Start Guide

## Installation & First Run

### Step 1: Install Server Dependencies
```bash
cd server
npm install
```

Expected output: Dependencies installed successfully.

### Step 2: Install Client Dependencies
```bash
cd ../client
npm install
```

Expected output: Dependencies installed successfully.

### Step 3: Start the Server (Terminal 1)
```bash
cd server
npm start
```

Expected output:
```
=================================
Worms Math Game Server
=================================
Server running on port 3000
Health check: http://localhost:3000/health
WebSocket: ws://localhost:3000
=================================
```

### Step 4: Start the Client (Terminal 2 - New Window)
```bash
cd client
npm start
```

Expected output:
- Web server starts on http://localhost:8080
- Browser opens automatically
- Game window displays with "Connected to Server!" message

## Testing the Setup

### 1. Test Health Endpoint
Open a browser and visit: `http://localhost:3000/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T...",
  "supabase": "not configured"
}
```

### 2. Test Game Client
- Game canvas should be visible (800x600)
- Text should display "Worms Math Game" and "Connected to Server!"
- Browser console should show connection messages

### 3. Test WebSocket Connection
Open browser console (F12) and run:
```javascript
socket.emit('join_matchmaking', { playerName: 'TestPlayer' });
```

Server console should log the matchmaking attempt.

## Troubleshooting

### Port Already in Use
If port 3000 or 8080 is busy:
```bash
# Change server port
PORT=3001 npm start

# Change client port
npx http-server -p 8081
```

### Dependencies Not Installing
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Client Can't Connect to Server
1. Ensure server is running on port 3000
2. Check for CORS errors in browser console
3. Verify server URL in client/src/main.js (should be http://localhost:3000)

## Next Steps

The foundation is ready! Other agents can now:
- Add game scenes to `client/src/scenes/`
- Create entity classes in `client/src/entities/`
- Implement matchmaking in `server/services/`
- Add API routes in `server/routes/`
- Build Socket.IO handlers in `server/socket/`

## File Structure Summary

```
worms-math-game/
├── client/               [Frontend - Phaser.js]
│   ├── index.html       ✓ Created
│   ├── src/main.js      ✓ Created (Phaser config)
│   ├── package.json     ✓ Created (dependencies)
│   └── [subdirs]        ✓ Ready for development
│
├── server/              [Backend - Node.js]
│   ├── index.js         ✓ Created (Express + Socket.IO)
│   ├── package.json     ✓ Created (dependencies)
│   └── [subdirs]        ✓ Ready for development
│
├── shared/
│   └── constants.js     ✓ Created (game config, colors, events)
│
└── README.md            ✓ Created (full documentation)
```

All systems ready for parallel development!
