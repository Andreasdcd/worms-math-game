/**
 * Room Manager Service
 * Manages game rooms, matchmaking, and player sessions
 */

const crypto = require('crypto');

// In-memory room storage (consider Redis for production)
const rooms = new Map();
const playerRooms = new Map(); // playerId -> roomCode mapping

// Danish worm names pool (200 names)
const DANISH_WORM_NAMES = [
  'Raket-Robert', 'Bomber-Bjarne', 'Sniper-Søren', 'Graver-Gustav',
  'Torpedo-Thomas', 'Granat-Gunnar', 'Missil-Magnus', 'Dynamit-Dennis',
  'Kanon-Klaus', 'Luftslag-Lars', 'Bazooka-Bent', 'Miner-Morten',
  'Airstrike-Anders', 'Cluster-Carl', 'Sheep-Svend', 'Banan-Benny',
  'Shotgun-Stig', 'Uzi-Ulrik', 'Driller-Daniel', 'Blowtorch-Bo',
  'Ninja-Niels', 'Teleport-Torben', 'Kamikaze-Kurt', 'Prod-Peter',
  'Baseball-Bent', 'Flamme-Frank', 'Heilige-Hans', 'Skunk-Simon',
  'Super-Søren', 'Petrol-Poul', 'Rope-Rasmus', 'Jetpack-Jens',
  'Faldskærm-Finn', 'Bungee-Brian', 'Skate-Stefan', 'Girder-Gorm',
  'Sentry-Steen', 'Healing-Henrik', 'Fast-Frederik', 'Lazy-Leif',
  'Freeze-Frede', 'Switch-Sven', 'Laser-Leon', 'Carpet-Christian',
  'Earthquake-Erik', 'Armageddon-Adam', 'Concrete-Christian', 'Mail-Mikkel',
  'Strike-Søren', 'Drill-David', 'Thunder-Thor', 'Tornado-Troels',
  'Vulkan-Victor', 'Hydra-Henrik', 'Phoenix-Philip', 'Dragon-Dorthe',
  'Kraken-Kasper', 'Griffin-Gitte', 'Basilisk-Birthe', 'Chimera-Charlotte',
  'Manticore-Mette', 'Pegasus-Per', 'Sphinx-Sofie', 'Unicorn-Ulla',
  'Yeti-Yvonne', 'Zombie-Zenia', 'Alien-Allan', 'Robot-Rikke',
  'Cyborg-Cecilie', 'Android-Andreas', 'Hologram-Helle', 'Clone-Claus',
  'Mutant-Maja', 'Ninja-Nanna', 'Samurai-Sam', 'Viking-Viggo',
  'Pirat-Pia', 'Ridder-Rune', 'Kriger-Kaj', 'Jæger-Jakob',
  'Skipper-Signe', 'Admiral-Aksel', 'General-Gertrud', 'Kaptajn-Karen',
  'Major-Mathilde', 'Sergent-Søren', 'Korporal-Katrine', 'Løjtnant-Louise',
  'Colonel-Carsten', 'Marshal-Marlene', 'Kommandør-Kristian', 'Chef-Carina',
  'Helt-Hugo', 'Champion-Camilla', 'Mester-Martin', 'Expert-Emma',
  'Pro-Patrick', 'Ace-Anna', 'Legend-Linda', 'Titan-Tina',
  'Gigant-Gitte', 'Kolos-Klaus', 'Monster-Maria', 'Beast-Bente',
  'Demon-Ditte', 'Angel-Anne', 'Saint-Sara', 'Divine-Diana',
  'Mystic-Mikael', 'Magic-Michelle', 'Wizard-William', 'Witch-Winnie',
  'Warlock-Walter', 'Sorcerer-Sanne', 'Shaman-Steen', 'Prophet-Pia',
  'Oracle-Ole', 'Sage-Sidsel', 'Monk-Mogens', 'Priest-Preben',
  'Bishop-Birger', 'Pope-Poul', 'Cardinal-Carl', 'Deacon-Dorthe',
  'Templar-Tage', 'Crusader-Christian', 'Paladin-Peder', 'Knight-Knud',
  'Squire-Sif', 'Page-Pernille', 'Herald-Hans', 'Bard-Birte',
  'Troubadour-Thyra', 'Minstrel-Mads', 'Jester-Jesper', 'Fool-Freja',
  'Clown-Claus', 'Joker-Jannie', 'Trickster-Trine', 'Prankster-Palle',
  'Rogue-Rikke', 'Thief-Tove', 'Bandit-Bent', 'Outlaw-Otto',
  'Rebel-Ruth', 'Renegade-Randi', 'Maverick-Morten', 'Wildcard-Willy',
  'Daredevil-Dina', 'Stuntman-Sten', 'Acrobat-Alice', 'Gymnast-Georg',
  'Athlete-Astrid', 'Sportsman-Søren', 'Runner-Rita', 'Sprinter-Susanne',
  'Jumper-Jan', 'Climber-Connie', 'Swimmer-Svend', 'Dykker-Ditte',
  'Pilot-Peter', 'Driver-Dorthe', 'Sailor-Steen', 'Navigator-Nils',
  'Explorer-Eva', 'Adventurer-Alex', 'Pioneer-Pia', 'Trailblazer-Trine',
  'Pathfinder-Per', 'Scout-Sanne', 'Tracker-Tage', 'Hunter-Hanne',
  'Forager-Finn', 'Gatherer-Grete', 'Farmer-Flemming', 'Gardener-Gerda',
  'Planter-Poul', 'Harvester-Helle', 'Reaper-Rolf', 'Sower-Signe',
  'Builder-Bent', 'Constructor-Carina', 'Architect-Anders', 'Engineer-Emil',
  'Mechanic-Mette', 'Technician-Torben', 'Inventor-Inge', 'Designer-Dennis',
  'Artist-Anne', 'Painter-Per', 'Sculptor-Sif', 'Potter-Pia',
  'Weaver-Wanda', 'Tailor-Trine', 'Cobbler-Carl', 'Smith-Steen',
  'Metalworker-Maja', 'Blacksmith-Bjarne', 'Goldsmith-Gertrud', 'Silversmith-Svend',
  'Jeweler-Jannie', 'Gemcutter-Gorm', 'Polisher-Pia', 'Carver-Christian',
  'Woodworker-Willy', 'Carpenter-Claus', 'Joiner-Jesper', 'Cabinet-Carl',
  'Turner-Tove', 'Cooper-Connie', 'Wheelwright-Walter', 'Wainwright-Winnie',
  'Shipwright-Søren', 'Boatbuilder-Bent', 'Rigger-Randi', 'Sailmaker-Sanne'
];

const MATCH_TYPES = {
  FFA: { name: 'Free For All', minPlayers: 2, maxPlayers: 8, teams: false },
  '1v1': { name: '1v1 Duel', minPlayers: 2, maxPlayers: 2, teams: true },
  '2v2': { name: '2v2 Teams', minPlayers: 4, maxPlayers: 4, teams: true },
  '3v3': { name: '3v3 Teams', minPlayers: 6, maxPlayers: 6, teams: true },
  '4v4': { name: '4v4 Teams', minPlayers: 8, maxPlayers: 8, teams: true }
};

/**
 * Generate a unique room code
 */
function generateRoomCode() {
  // Generate 6-character alphanumeric code
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Get a random Danish worm name (not currently used in room)
 */
function getRandomWormName(excludeNames = []) {
  const availableNames = DANISH_WORM_NAMES.filter(name => !excludeNames.includes(name));
  if (availableNames.length === 0) {
    // Fallback if all names are used
    return `Orm-${Math.floor(Math.random() * 10000)}`;
  }
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

/**
 * Create a new room
 * @param {Object} options - Room options
 * @returns {Object} Room object
 */
function createRoom(options = {}) {
  const {
    matchType = 'FFA',
    isPrivate = false,
    creatorSocketId = null,
    creatorName = null
  } = options;

  if (!MATCH_TYPES[matchType]) {
    throw new Error(`Invalid match type: ${matchType}`);
  }

  const roomCode = generateRoomCode();
  const matchConfig = MATCH_TYPES[matchType];

  const room = {
    code: roomCode,
    matchType,
    matchConfig,
    isPrivate,
    state: 'waiting', // waiting, quiz, playing, finished
    players: [],
    quiz: {
      completed: [],
      results: null,
      turnOrder: []
    },
    game: {
      currentTurn: 0,
      currentPlayerIndex: 0,
      turnStartTime: null
    },
    createdAt: Date.now(),
    lastActivity: Date.now()
  };

  rooms.set(roomCode, room);

  console.log(`✓ Room created: ${roomCode} (${matchType}, ${isPrivate ? 'private' : 'public'})`);

  return room;
}

/**
 * Add a player to a room
 * @param {string} roomCode - Room code
 * @param {Object} player - Player data
 */
function addPlayerToRoom(roomCode, player) {
  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error('Room not found');
  }

  if (room.state !== 'waiting') {
    throw new Error('Room is not accepting players');
  }

  if (room.players.length >= room.matchConfig.maxPlayers) {
    throw new Error('Room is full');
  }

  // Check if player already in room
  if (room.players.find(p => p.socketId === player.socketId)) {
    throw new Error('Player already in room');
  }

  // Assign a Danish worm name
  const usedNames = room.players.map(p => p.assignedName);
  const assignedName = getRandomWormName(usedNames);

  // Assign team if team-based mode
  let team = null;
  if (room.matchConfig.teams) {
    // Simple team balancing: alternate between teams
    const teamCount = room.matchConfig.maxPlayers / 2;
    team = room.players.length % 2 === 0 ? 'A' : 'B';
  }

  const newPlayer = {
    ...player,
    assignedName,
    team,
    ready: false,
    connected: true,
    joinedAt: Date.now()
  };

  room.players.push(newPlayer);
  playerRooms.set(player.socketId, roomCode);
  room.lastActivity = Date.now();

  console.log(`✓ Player ${player.name} joined room ${roomCode} as "${assignedName}" ${team ? `(Team ${team})` : ''}`);

  return { room, player: newPlayer };
}

/**
 * Remove a player from a room
 * @param {string} socketId - Player socket ID
 */
function removePlayerFromRoom(socketId) {
  const roomCode = playerRooms.get(socketId);
  if (!roomCode) {
    return null;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    playerRooms.delete(socketId);
    return null;
  }

  const playerIndex = room.players.findIndex(p => p.socketId === socketId);
  if (playerIndex === -1) {
    return null;
  }

  const [removedPlayer] = room.players.splice(playerIndex, 1);
  playerRooms.delete(socketId);
  room.lastActivity = Date.now();

  console.log(`✓ Player ${removedPlayer.name} left room ${roomCode}`);

  // Delete room if empty and in waiting state
  if (room.players.length === 0 && room.state === 'waiting') {
    rooms.delete(roomCode);
    console.log(`✓ Room ${roomCode} deleted (empty)`);
    return { room: null, player: removedPlayer };
  }

  return { room, player: removedPlayer };
}

/**
 * Set player ready state
 * @param {string} socketId - Player socket ID
 * @param {boolean} ready - Ready state
 */
function setPlayerReady(socketId, ready) {
  const roomCode = playerRooms.get(socketId);
  if (!roomCode) {
    throw new Error('Player not in a room');
  }

  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error('Room not found');
  }

  const player = room.players.find(p => p.socketId === socketId);
  if (!player) {
    throw new Error('Player not found in room');
  }

  player.ready = ready;
  room.lastActivity = Date.now();

  console.log(`✓ Player ${player.name} ${ready ? 'ready' : 'not ready'} in room ${roomCode}`);

  return room;
}

/**
 * Check if all players in a room are ready
 * @param {string} roomCode - Room code
 */
function areAllPlayersReady(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return false;
  }

  if (room.players.length < room.matchConfig.minPlayers) {
    return false;
  }

  return room.players.every(p => p.ready);
}

/**
 * Start quiz phase for a room
 * @param {string} roomCode - Room code
 */
function startQuizPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error('Room not found');
  }

  if (room.state !== 'waiting') {
    throw new Error('Room is not in waiting state');
  }

  room.state = 'quiz';
  room.quiz.startTime = Date.now();
  room.lastActivity = Date.now();

  console.log(`✓ Quiz phase started in room ${roomCode}`);

  return room;
}

/**
 * Start game phase for a room
 * @param {string} roomCode - Room code
 * @param {Array} turnOrder - Turn order from quiz
 */
function startGamePhase(roomCode, turnOrder) {
  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error('Room not found');
  }

  if (room.state !== 'quiz') {
    throw new Error('Room is not in quiz state');
  }

  room.state = 'playing';
  room.quiz.turnOrder = turnOrder;
  room.game.currentPlayerIndex = 0;
  room.game.turnStartTime = Date.now();
  room.lastActivity = Date.now();

  console.log(`✓ Game phase started in room ${roomCode} with turn order:`, turnOrder);

  return room;
}

/**
 * Get room by code
 * @param {string} roomCode - Room code
 */
function getRoom(roomCode) {
  return rooms.get(roomCode);
}

/**
 * Get room for a player
 * @param {string} socketId - Player socket ID
 */
function getPlayerRoom(socketId) {
  const roomCode = playerRooms.get(socketId);
  if (!roomCode) {
    return null;
  }
  return rooms.get(roomCode);
}

/**
 * Get all public rooms in waiting state
 */
function getAvailableRooms() {
  const availableRooms = [];
  for (const [code, room] of rooms.entries()) {
    if (!room.isPrivate && room.state === 'waiting' && room.players.length < room.matchConfig.maxPlayers) {
      availableRooms.push({
        code,
        matchType: room.matchType,
        playerCount: room.players.length,
        maxPlayers: room.matchConfig.maxPlayers,
        createdAt: room.createdAt
      });
    }
  }
  return availableRooms;
}

/**
 * Clean up inactive rooms (older than 1 hour)
 */
function cleanupInactiveRooms() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  let cleanedCount = 0;

  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > oneHour) {
      // Remove all players from room mapping
      room.players.forEach(player => {
        playerRooms.delete(player.socketId);
      });
      rooms.delete(code);
      cleanedCount++;
      console.log(`✓ Cleaned up inactive room: ${code}`);
    }
  }

  return cleanedCount;
}

/**
 * Get all rooms (for debugging/admin)
 */
function getAllRooms() {
  return Array.from(rooms.values());
}

/**
 * Get total online players count
 */
function getOnlinePlayersCount() {
  return playerRooms.size;
}

module.exports = {
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  setPlayerReady,
  areAllPlayersReady,
  startQuizPhase,
  startGamePhase,
  getRoom,
  getPlayerRoom,
  getAvailableRooms,
  cleanupInactiveRooms,
  getAllRooms,
  getOnlinePlayersCount,
  MATCH_TYPES,
  DANISH_WORM_NAMES
};
