# Multiplayer Quickstart Guide

**For developers who want to test the system ASAP**

---

## 1. Start Server (Terminal 1)

```bash
cd server
npm install
node index.js
```

Expected output:
```
==========================================
    WORMS MATH GAME - MULTIPLAYER SERVER
==========================================
Server:      http://localhost:3000
WebSocket:   ws://localhost:3000
Health:      http://localhost:3000/health
==========================================
Features:
  ✓ Matchmaking & Room System
  ✓ Quiz Phase & Turn Order
  ✓ Server-Authoritative Game
  ✓ Real-time Synchronization
  ✓ 200 Danish Worm Names
==========================================
```

---

## 2. Start Client (Terminal 2)

```bash
cd client
npm install
npm run dev
```

Expected output:
```
> vite

  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/
```

---

## 3. Open 2 Browser Tabs

**Tab 1:**
- Navigate to http://localhost:8080
- Enter username: `Alice`
- Click "LOG IND"

**Tab 2:**
- Navigate to http://localhost:8080
- Enter username: `Bob`
- Click "LOG IND"

---

## 4. Test Matchmaking

**Both tabs:**
- Click "FIND KAMP (FFA)"
- Wait 1-2 seconds
- Match found! → Waiting Room

---

## 5. In Waiting Room

**Observe:**
- Room code displayed (e.g., "ABC123")
- Both players listed
- Danish names assigned (e.g., "Raket-Robert", "Bomber-Bjarne")

**Both tabs:**
- Click "KLAR" button
- Wait for 5-second countdown
- Quiz starts automatically

---

## 6. Complete Quiz

**Both tabs:**
- Answer 5 math questions
- Complete within 60 seconds
- See other player's completion

**After both complete:**
- Turn order displayed
- 3-second delay
- Game starts

---

## 7. Play Game

**Observe:**
- Only active player can aim/fire
- 30-second timer per turn
- Turns rotate automatically
- HP bars update in real-time

**When match ends:**
- Winner announced
- Stats displayed
- Return to lobby

---

## Quick Commands

### Test Private Room

**Tab 1:**
```
Click "OPRET PRIVAT SPIL"
Note room code (e.g., "XYZ789")
```

**Tab 2:**
```
Click "INDTAST KODE"
Enter: XYZ789
Click "TILMELD"
```

### Check Server Health

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T...",
  "supabase": "connected",
  "onlinePlayers": 2
}
```

### View All Rooms (Debug)

Open browser console:
```javascript
fetch('http://localhost:3000/api/rooms')
  .then(r => r.json())
  .then(console.log)
```

---

## Troubleshooting

### "Cannot connect to server"

**Check:**
1. Server running on port 3000?
   ```bash
   netstat -an | grep 3000
   ```
2. CORS enabled?
   - Should allow localhost:8080
3. Firewall blocking?

**Fix:**
```bash
# Restart server
cd server
node index.js
```

### "Matchmaking never finds match"

**Reason:** Need 2+ players in queue **simultaneously**

**Fix:**
- Open both tabs quickly
- Click "FIND KAMP" within 5 seconds of each other

### "Quiz doesn't start"

**Reason:** Not all players clicked "KLAR"

**Fix:**
- Ensure ALL players in room click ready
- Check for disconnected players

### "Room code invalid"

**Reason:** Codes are case-sensitive and 6 characters

**Fix:**
- Enter code in UPPERCASE
- Double-check for typos

---

## Expected Console Logs

### Server Console (Good)

```
[Socket] Client connected: abc123def
✓ Player1 joined FFA matchmaking queue (1 waiting)
[Socket] Client connected: xyz789ghi
✓ Player2 joined FFA matchmaking queue (2 waiting)
✓ Match created: ABC123 (FFA) with 2 players
✓ Room created: ABC123 (FFA, public)
✓ Player1 joined room ABC123 as "Raket-Robert"
✓ Player2 joined room ABC123 as "Bomber-Bjarne"
✓ Player Player1 ready in room ABC123
✓ Player Player2 ready in room ABC123
✓ Starting quiz countdown for room ABC123
Quiz session initialized for room ABC123 with 2 players
Player1 completed quiz - Score: 4, Time: 45s
Player2 completed quiz - Score: 5, Time: 52s
All players completed quiz in room ABC123
Turn order for room ABC123: [ 'Bomber-Bjarne', 'Raket-Robert' ]
✓ Game started for room ABC123
✓ Turn advanced to Bomber-Bjarne
```

### Client Console (Good)

```
[Network] Connecting to http://localhost:3000...
[Network] Connected to server: abc123def
Joined matchmaking queue
Match found! Room: ABC123
Joined room: ABC123
Player joined: Bomber-Bjarne
All players ready!
Quiz countdown starting: 5
Quiz starting!
Quiz completed - Score: 4/5, Time: 45s
All players completed quiz. Turn order: ...
Game starting!
Turn start: Bomber-Bjarne
```

---

## File Locations

**Server:**
- Entry point: `server/index.js`
- Room system: `server/services/roomManager.js`
- Matchmaking: `server/socket/matchmakingHandler.js`
- Game logic: `server/socket/gameHandler.js`

**Client:**
- Entry point: `client/src/main.js`
- Lobby: `client/src/scenes/LobbyScene.js`
- Waiting room: `client/src/scenes/WaitingRoomScene.js`
- Quiz: `client/src/scenes/QuizScene.js`
- Game: `client/src/scenes/GameScene.js`
- Network: `client/src/utils/networkManager.js`

---

## Next Actions

1. ✅ Test 2-player matchmaking
2. ✅ Test private rooms
3. ✅ Test quiz integration
4. ⚠️ Update GameScene for multiplayer (see GAMESCENE_INTEGRATION_GUIDE.md)
5. ⚠️ Test full game flow
6. ⚠️ Test with 4+ players
7. ⚠️ Test disconnect/reconnect

---

## Success Criteria

- ✅ 2 players can find each other
- ✅ Room codes work
- ✅ Danish names assigned
- ✅ Quiz determines turn order
- ⚠️ Game plays with correct turns (after GameScene update)
- ⚠️ Winner determined correctly (after GameScene update)
- ⚠️ Ratings updated (after GameScene update)

---

**Total Setup Time:** < 5 minutes
**First Match Time:** < 2 minutes
**Full Test:** < 10 minutes

Ready to play! 🎮
