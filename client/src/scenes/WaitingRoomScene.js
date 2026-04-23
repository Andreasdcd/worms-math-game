import Phaser from 'phaser';
import { networkManager } from '../utils/networkManager.js';

export default class WaitingRoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WaitingRoomScene' });
    this.players = [];
    this.roomCode = '';
    this.matchType = 'FFA';
    this.isReady = false;
    this.countdown = -1;
  }

  init(data) {
    this.socket = data.socket;
    this.playerName = data.playerName;
    this.userId = data.userId;
    this.roomCode = data.roomCode;
    this.players = data.players || [];
    this.matchType = data.matchType || 'FFA';
    this.isCreator = data.isCreator || false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add.text(width / 2, 40, 'VENTERUM', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Room code display
    const roomCodeBg = this.add.rectangle(width / 2, 100, 400, 60, 0x3a86ff);
    this.add.text(width / 2, 85, 'RUM-KODE:', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, this.roomCode, {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF',
      letterSpacing: '4px'
    }).setOrigin(0.5);

    // Match type
    this.add.text(width / 2, 150, `Type: ${this.getMatchTypeName()}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // Players container
    this.playersContainer = this.add.container(0, 0);
    this.updatePlayerList();

    // Ready button
    this.readyButton = this.createButton(
      width / 2,
      height - 150,
      300,
      70,
      'KLAR',
      () => this.toggleReady()
    );

    // Leave button
    this.createButton(
      width / 2,
      height - 70,
      300,
      50,
      'FORLAD',
      () => this.leaveRoom()
    );

    // Countdown text
    this.countdownText = this.add.text(width / 2, height / 2, '', {
      fontSize: '72px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setVisible(false);

    // Status text
    this.statusText = this.add.text(width / 2, height - 200, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#00FF00'
    }).setOrigin(0.5);

    // Setup network listeners
    this.setupNetworkListeners();
  }

  getMatchTypeName() {
    const types = {
      'FFA': 'Free For All',
      '1v1': '1v1 Duel',
      '2v2': '2v2 Teams',
      '3v3': '3v3 Teams',
      '4v4': '4v4 Teams'
    };
    return types[this.matchType] || this.matchType;
  }

  toggleReady() {
    this.isReady = !this.isReady;

    networkManager.setReady(this.isReady);

    // Update button appearance
    if (this.isReady) {
      this.readyButton.list[0].setFillStyle(0x00FF00);
      this.readyButton.list[1].setText('KLAR ✓');
    } else {
      this.readyButton.list[0].setFillStyle(0x3a86ff);
      this.readyButton.list[1].setText('KLAR');
    }
  }

  leaveRoom() {
    networkManager.leaveRoom();

    // Return to lobby
    this.scene.start('LobbyScene');
  }

  updatePlayerList() {
    // Clear existing player list
    this.playersContainer.removeAll(true);

    const { width } = this.cameras.main;
    const startY = 220;
    const spacing = 80;

    this.add.text(width / 2, startY - 40, `Spillere (${this.players.length}/8)`, {
      fontSize: '28px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.players.forEach((player, index) => {
      const yPos = startY + (index * spacing);

      // Player card
      const cardBg = this.add.rectangle(width / 2, yPos, 600, 70, 0x2a2a3e);
      cardBg.setStrokeStyle(3, player.ready ? 0x00FF00 : 0x666666);

      // Team color (if applicable)
      if (player.team) {
        const teamColor = player.team === 'A' ? 0xFF6B6B : 0x4ECDC4;
        const teamBadge = this.add.rectangle(width / 2 - 270, yPos, 40, 50, teamColor);
        this.add.text(width / 2 - 270, yPos, player.team, {
          fontSize: '24px',
          fontFamily: 'Arial Black',
          color: '#FFFFFF'
        }).setOrigin(0.5);
        this.playersContainer.add(teamBadge);
      }

      // Player name
      const nameText = this.add.text(width / 2 - 220, yPos, player.assignedName || player.name, {
        fontSize: '24px',
        fontFamily: 'Arial Black',
        color: '#FFFFFF'
      }).setOrigin(0, 0.5);

      // Ready status
      const readyText = this.add.text(width / 2 + 220, yPos, player.ready ? '✓ KLAR' : 'VENTER', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: player.ready ? '#00FF00' : '#AAAAAA'
      }).setOrigin(1, 0.5);

      this.playersContainer.add([cardBg, nameText, readyText]);
    });
  }

  startCountdown(seconds) {
    this.countdown = seconds;
    this.countdownText.setVisible(true);
    this.statusText.setText('Alle spillere klar! Starter snart...');

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.countdown--;
        this.countdownText.setText(this.countdown.toString());

        if (this.countdown <= 0) {
          countdownTimer.remove();
          this.countdownText.setText('START!');
          this.cameras.main.flash(500, 0, 255, 0);
        }
      },
      loop: true
    });
  }

  setupNetworkListeners() {
    // Player joined
    this.socket.on('room:player_joined', (data) => {
      console.log('Player joined:', data.player.assignedName);

      this.players.push(data.player);
      this.updatePlayerList();
      this.statusText.setText(`${data.player.assignedName} er tilmeldt!`);

      this.time.delayedCall(2000, () => {
        this.statusText.setText('');
      });
    });

    // Player left
    this.socket.on('room:player_left', (data) => {
      console.log('Player left:', data.playerName);

      this.players = this.players.filter(p => p.assignedName !== data.playerName);
      this.updatePlayerList();
      this.statusText.setText(`${data.playerName} forlod rummet`);

      this.time.delayedCall(2000, () => {
        this.statusText.setText('');
      });
    });

    // Player ready state changed
    this.socket.on('room:player_ready', (data) => {
      const player = this.players.find(p => p.socketId === data.socketId);
      if (player) {
        player.ready = data.ready;
        this.updatePlayerList();

        if (data.allReady) {
          this.statusText.setText('Alle spillere klar!');
        }
      }
    });

    // Quiz countdown
    this.socket.on('room:quiz_countdown', (data) => {
      console.log('Quiz countdown starting:', data.countdown);
      this.startCountdown(data.countdown);
    });

    // Quiz start
    this.socket.on('quiz:start', (data) => {
      console.log('Quiz starting!');

      // Transition to quiz scene
      this.scene.start('QuizScene', {
        socket: this.socket,
        playerName: this.playerName,
        roomCode: this.roomCode
      });
    });

    // Room error
    this.socket.on('room:error', (data) => {
      console.error('Room error:', data.message);
      this.statusText.setText(`Fejl: ${data.message}`).setColor('#FF0000');
    });

    // Player disconnected
    this.socket.on('room:player_disconnected', (data) => {
      console.log('Player disconnected:', data.playerName);

      this.players = this.players.filter(p => p.assignedName !== data.playerName);
      this.updatePlayerList();
      this.statusText.setText(`${data.playerName} mistede forbindelsen`);
    });
  }

  createButton(x, y, width, height, text, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x3a86ff);
    bg.setInteractive({ useHandCursor: true });

    const textObj = this.add.text(0, 0, text, {
      fontSize: '24px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    container.add([bg, textObj]);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x5aa3ff);
    });

    bg.on('pointerout', () => {
      const currentColor = container.list[0].fillColor;
      if (currentColor !== 0x00FF00) {
        bg.setFillStyle(0x3a86ff);
      }
    });

    bg.on('pointerdown', () => {
      if (callback) callback();
    });

    return container;
  }

  shutdown() {
    // Clean up socket listeners
    this.socket.off('room:player_joined');
    this.socket.off('room:player_left');
    this.socket.off('room:player_ready');
    this.socket.off('room:quiz_countdown');
    this.socket.off('quiz:start');
    this.socket.off('room:error');
    this.socket.off('room:player_disconnected');
  }
}
