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

console.log('Worms Math Game - Multiplayer Edition initialized!');
