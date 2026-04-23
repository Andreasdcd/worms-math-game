/**
 * Shared Constants
 * Used by both client and server
 */

// Game configuration
const GAME_CONFIG = {
    // Player settings
    INITIAL_HP: 100,
    MAX_HP: 100,
    FALL_DAMAGE_THRESHOLD: 300, // Velocity threshold for fall damage
    FALL_DAMAGE_MULTIPLIER: 0.5,

    // Turn settings
    TURN_TIME: 30, // seconds per turn
    TURN_GRACE_PERIOD: 5, // extra seconds for shot

    // Weapon settings
    PROJECTILE_POWER_MIN: 100,
    PROJECTILE_POWER_MAX: 500,
    PROJECTILE_DAMAGE_BASE: 30,
    PROJECTILE_RADIUS: 8,
    EXPLOSION_RADIUS: 80,

    // Math question settings
    QUESTION_TIME: 15, // seconds to answer
    CORRECT_ANSWER_BONUS: 10, // extra damage
    WRONG_ANSWER_PENALTY: 5, // damage reduction

    // Team settings
    MIN_PLAYERS_PER_TEAM: 1,
    MAX_PLAYERS_PER_TEAM: 4,
    WORMS_PER_PLAYER: 3,

    // Physics
    GRAVITY: 1,
    WORM_BOUNCE: 0.2,
    GROUND_FRICTION: 0.1,

    // World settings
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 600,
    TERRAIN_SEGMENTS: 50
};

// Match types
const MATCH_TYPES = {
    QUICKPLAY_1V1: {
        id: 'quickplay_1v1',
        name: '1v1 Quick Match',
        teams: 2,
        playersPerTeam: 1,
        ranked: false
    },
    RANKED_1V1: {
        id: 'ranked_1v1',
        name: '1v1 Ranked',
        teams: 2,
        playersPerTeam: 1,
        ranked: true
    },
    TEAM_2V2: {
        id: 'team_2v2',
        name: '2v2 Team Match',
        teams: 2,
        playersPerTeam: 2,
        ranked: false
    },
    FFA_4PLAYER: {
        id: 'ffa_4player',
        name: 'Free For All (4 Players)',
        teams: 4,
        playersPerTeam: 1,
        ranked: false
    }
};

// Team colors (Danish color names in comments)
const TEAM_COLORS = {
    1: '#FF0000', // rød (red)
    2: '#0000FF', // blå (blue)
    3: '#00FF00', // grøn (green)
    4: '#FFFF00'  // gul (yellow)
};

// WebSocket events
const SOCKET_EVENTS = {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WELCOME: 'welcome',

    // Matchmaking
    JOIN_MATCHMAKING: 'join_matchmaking',
    LEAVE_MATCHMAKING: 'leave_matchmaking',
    MATCHMAKING_STATUS: 'matchmaking_status',
    MATCH_FOUND: 'match_found',

    // Game flow
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    TURN_START: 'turn_start',
    TURN_END: 'turn_end',

    // Actions
    GAME_ACTION: 'game_action',
    PLAYER_MOVE: 'player_move',
    PLAYER_SHOOT: 'player_shoot',
    PLAYER_ANSWER: 'player_answer',

    // State updates
    GAME_STATE: 'game_state',
    DAMAGE_DEALT: 'damage_dealt',
    PLAYER_ELIMINATED: 'player_eliminated',

    // MVP Combat events
    GAME_INIT: 'game:start',
    GAME_INITIALIZED: 'game:initialized',
    TURN_START: 'turn:start',
    TURN_END_CLIENT: 'turn:end',
    PLAYER_SHOOT_EVENT: 'player:shoot',
    PLAYER_DAMAGED: 'player:damaged',
    PLAYER_ELIMINATED_EVENT: 'player:eliminated',
    GAME_END_EVENT: 'game:end'
};

// Rating system constants
const RATING_CONFIG = {
    INITIAL_RATING: 0, // Start at 0 as per requirements
    K_FACTOR: 32, // ELO K-factor
    MIN_RATING: null, // No floor - ratings can go negative
    MAX_RATING: null // No ceiling
};

export { GAME_CONFIG, MATCH_TYPES, TEAM_COLORS, SOCKET_EVENTS, RATING_CONFIG };
