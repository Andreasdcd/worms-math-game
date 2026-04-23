/**
 * Worms Math Game - Main Entry Point
 * Initializes Phaser game with multiplayer scenes
 */

import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import QuizScene from './scenes/QuizScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import WaitingRoomScene from './scenes/WaitingRoomScene.js';
import TeacherDashboardScene from './scenes/TeacherDashboardScene.js';

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 1
            },
            debug: false, // Set to true to see physics debug overlay
            enableSleeping: false
        }
    },
    scene: [
        LobbyScene,              // Start with lobby
        WaitingRoomScene,        // Waiting for players
        QuizScene,               // Math quiz
        GameScene,               // Main game
        VictoryScene,            // Post-match
        TeacherDashboardScene    // Teacher dashboard
    ]
};

// Initialize the game
const game = new Phaser.Game(config);

// Export for debugging
window.game = game;

// Dev bypass: #combat in URL skips auth/lobby and jumps straight into GameScene with test players.
// Remove this block before production release.
if (window.location.hash === '#combat') {
    game.events.once('ready', () => {
        game.scene.stop('LobbyScene');
        game.scene.start('GameScene');
    });
    console.warn('[DEV] Combat bypass active — skipping lobby/quiz. Remove #combat from URL to return to normal flow.');
}

console.log('Worms Math Game - Multiplayer Edition initialized!');
