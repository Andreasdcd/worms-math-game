import Phaser from 'phaser';
import { networkManager } from '../utils/networkManager.js';
import { SERVER_URL } from '../config.js';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
    this.playerName = '';
    this.userId = null;
    this.rating = 0; // Start at 0 as per requirements
    this.leaderboard = [];
    this.userRank = null;
    this.onlinePlayers = 0;
    this.matchmakingActive = false;
    this.leaderboardContainer = null;
    this.ratingText = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0f0f23).setOrigin(0);

    // Title
    this.add.text(width / 2, 60, 'WORMS MATH GAME', {
      fontSize: '64px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 120, 'Multiplayer Lobby', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Check if logged in
    const storedUser = localStorage.getItem('wormsUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.playerName = user.username;
      this.userId = user.id;
      this.rating = user.rating !== undefined ? user.rating : 0; // Default to 0
      this.showMainMenu();
    } else {
      this.showLoginForm();
    }

    // Setup network connection
    this.setupNetwork();

    // Fetch leaderboard
    this.fetchLeaderboard();

    // Online players counter (top-right)
    this.onlinePlayersText = this.add.text(width - 20, 20, 'Online: 0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#00FF00'
    }).setOrigin(1, 0);

    // Update online count periodically
    this.time.addEvent({
      delay: 5000,
      callback: this.updateOnlineCount,
      callbackScope: this,
      loop: true
    });

    // Refresh leaderboard periodically
    this.time.addEvent({
      delay: 30000, // Every 30 seconds
      callback: this.fetchLeaderboard,
      callbackScope: this,
      loop: true
    });
  }

  showLoginForm() {
    const { width, height } = this.cameras.main;

    // Login container
    const loginContainer = this.add.container(width / 2, height / 2 - 50);

    const bg = this.add.rectangle(0, 0, 500, 300, 0x1a1a2e);
    bg.setStrokeStyle(4, 0x3a86ff);

    const title = this.add.text(0, -120, 'Indtast dit navn', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    const instruction = this.add.text(0, -70, 'Brugernavn (3-20 tegn):', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#AAAAAA'
    }).setOrigin(0.5);

    // Username input field (simulated with DOM element)
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = 'Dit brugernavn...';
    inputElement.maxLength = 20;
    inputElement.style.position = 'absolute';
    inputElement.style.left = `${width / 2 - 150}px`;
    inputElement.style.top = `${height / 2 - 50}px`;
    inputElement.style.width = '300px';
    inputElement.style.height = '40px';
    inputElement.style.fontSize = '20px';
    inputElement.style.padding = '8px';
    inputElement.style.borderRadius = '8px';
    inputElement.style.border = '2px solid #3a86ff';
    inputElement.style.backgroundColor = '#0f0f23';
    inputElement.style.color = '#FFFFFF';
    inputElement.style.textAlign = 'center';
    document.body.appendChild(inputElement);
    inputElement.focus();

    this.inputElement = inputElement;

    // Login button
    const loginButton = this.createButton(0, 60, 280, 60, 'LOG IND', () => {
      const username = inputElement.value.trim();
      if (username.length >= 3 && username.length <= 20) {
        this.login(username);
      } else {
        this.showError('Brugernavn skal være 3-20 tegn');
      }
    });

    loginContainer.add([bg, title, instruction, loginButton]);

    // Error text
    this.errorText = this.add.text(width / 2, height / 2 + 150, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FF0000'
    }).setOrigin(0.5);

    // Handle Enter key
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginButton.emit('pointerdown');
      }
    });
  }

  async login(username) {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data
        localStorage.setItem('wormsUser', JSON.stringify(data.user));
        this.playerName = data.user.username;
        this.userId = data.user.id;
        this.rating = data.user.rating !== undefined ? data.user.rating : 0;

        // Remove login form
        if (this.inputElement) {
          this.inputElement.remove();
        }

        // Show main menu
        this.scene.restart();
      } else {
        // User not found - try signup
        await this.signup(username);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Kunne ikke oprette forbindelse til serveren');
    }
  }

  async signup(username) {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role: 'student' })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data
        localStorage.setItem('wormsUser', JSON.stringify(data.user));
        this.playerName = data.user.username;
        this.userId = data.user.id;
        this.rating = data.user.rating !== undefined ? data.user.rating : 0;

        // Remove login form
        if (this.inputElement) {
          this.inputElement.remove();
        }

        // Show main menu
        this.scene.restart();
      } else {
        this.showError(data.message || 'Kunne ikke oprette bruger');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.showError('Kunne ikke oprette forbindelse til serveren');
    }
  }

  showError(message) {
    if (this.errorText) {
      this.errorText.setText(message);
      this.time.delayedCall(3000, () => {
        this.errorText.setText('');
      });
    }
  }

  showMainMenu() {
    const { width, height } = this.cameras.main;

    // Welcome text
    this.add.text(width / 2, 180, `Velkommen, ${this.playerName}!`, {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Rating display (top-left corner)
    this.ratingText = this.add.text(20, 60, `Din rating: ${this.rating}`, {
      fontSize: '20px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0, 0);

    // Main buttons
    const buttonY = 300;
    const buttonSpacing = 80;

    // Find Match button
    this.findMatchButton = this.createButton(
      width / 2,
      buttonY,
      350,
      70,
      'FIND KAMP (FFA)',
      () => this.startMatchmaking('FFA')
    );

    // Create Private Game button
    this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      350,
      70,
      'OPRET PRIVAT SPIL',
      () => this.createPrivateGame()
    );

    // Join by Code button
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      350,
      70,
      'INDTAST KODE',
      () => this.showJoinByCode()
    );

    // Leaderboard (right side)
    this.showLeaderboard();

    // Matchmaking status text
    this.matchmakingStatusText = this.add.text(width / 2, buttonY + buttonSpacing * 3, '', {
      fontSize: '24px',
      fontFamily: 'Arial Bold',
      color: '#00FF00'
    }).setOrigin(0.5);
  }

  /**
   * Update rating display with animation
   * @param {number} newRating - New rating value
   */
  updateRating(newRating) {
    const oldRating = this.rating;
    this.rating = newRating;

    if (this.ratingText) {
      this.ratingText.setText(`Din rating: ${newRating}`);

      // Animate rating change
      const change = newRating - oldRating;
      if (change !== 0) {
        const changeColor = change > 0 ? '#00FF00' : '#FF4444';
        const changeSign = change > 0 ? '+' : '';

        const floatingText = this.add.text(
          this.ratingText.x + 150,
          this.ratingText.y,
          `${changeSign}${change}`,
          {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: changeColor,
            stroke: '#000',
            strokeThickness: 4
          }
        ).setOrigin(0, 0);

        // Float upward and fade
        this.tweens.add({
          targets: floatingText,
          y: floatingText.y - 40,
          alpha: 0,
          duration: 1500,
          ease: 'Cubic.easeOut',
          onComplete: () => floatingText.destroy()
        });
      }
    }

    // Update localStorage
    const storedUser = JSON.parse(localStorage.getItem('wormsUser'));
    if (storedUser) {
      storedUser.rating = newRating;
      localStorage.setItem('wormsUser', JSON.stringify(storedUser));
    }
  }

  startMatchmaking(matchType) {
    if (this.matchmakingActive) {
      // Cancel matchmaking
      networkManager.leaveMatchmaking(matchType);
      this.matchmakingActive = false;
      this.matchmakingStatusText.setText('');
      this.findMatchButton.setText('FIND KAMP (FFA)');
      return;
    }

    networkManager.joinMatchmaking(this.playerName, this.userId, matchType, this.rating);
    this.matchmakingActive = true;
    this.matchmakingStatusText.setText('Søger efter kamp...');
    this.findMatchButton.setText('ANNULLER');
  }

  createPrivateGame() {
    networkManager.createRoom(this.playerName, this.userId, 'FFA', this.rating);
  }

  showJoinByCode() {
    const { width, height } = this.cameras.main;

    // Create input overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    overlay.setInteractive();

    const panel = this.add.rectangle(width / 2, height / 2, 500, 300, 0x1a1a2e);
    panel.setStrokeStyle(4, 0x3a86ff);

    const title = this.add.text(width / 2, height / 2 - 100, 'Indtast Rum-kode', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Code input (DOM element)
    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.placeholder = 'ABC123';
    codeInput.maxLength = 6;
    codeInput.style.position = 'absolute';
    codeInput.style.left = `${width / 2 - 100}px`;
    codeInput.style.top = `${height / 2 - 20}px`;
    codeInput.style.width = '200px';
    codeInput.style.height = '40px';
    codeInput.style.fontSize = '24px';
    codeInput.style.padding = '8px';
    codeInput.style.borderRadius = '8px';
    codeInput.style.border = '2px solid #3a86ff';
    codeInput.style.backgroundColor = '#0f0f23';
    codeInput.style.color = '#FFFFFF';
    codeInput.style.textAlign = 'center';
    codeInput.style.textTransform = 'uppercase';
    document.body.appendChild(codeInput);
    codeInput.focus();

    const joinBtn = this.createButton(width / 2, height / 2 + 70, 200, 50, 'TILMELD', () => {
      const code = codeInput.value.trim().toUpperCase();
      if (code.length === 6) {
        networkManager.joinRoom(code, this.playerName, this.userId, this.rating);
        codeInput.remove();
        overlay.destroy();
        panel.destroy();
        title.destroy();
        joinBtn.destroy();
        cancelBtn.destroy();
      }
    });

    const cancelBtn = this.createButton(width / 2, height / 2 + 130, 200, 50, 'ANNULLER', () => {
      codeInput.remove();
      overlay.destroy();
      panel.destroy();
      title.destroy();
      joinBtn.destroy();
      cancelBtn.destroy();
    });

    codeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinBtn.emit('pointerdown');
      }
    });
  }

  async fetchLeaderboard() {
    try {
      const response = await fetch(`${SERVER_URL}/api/leaderboard?limit=20`);
      const data = await response.json();

      if (data.success) {
        this.leaderboard = data.leaderboard;

        // Find current user's rank
        const userIndex = this.leaderboard.findIndex(p => p.id === this.userId);
        if (userIndex !== -1) {
          this.userRank = userIndex + 1;
        } else {
          // User not in top 20
          this.userRank = null;
        }

        // Refresh leaderboard display if already shown
        if (this.leaderboardContainer) {
          this.leaderboardContainer.destroy();
          this.showLeaderboard();
        }
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
    }
  }

  showLeaderboard() {
    const { width, height } = this.cameras.main;

    const startX = width - 380;
    const startY = 160;

    this.leaderboardContainer = this.add.container(0, 0);

    // Title
    const title = this.add.text(startX + 180, startY, 'LEADERBOARD (TOP 20)', {
      fontSize: '20px',
      fontFamily: 'Arial Black',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    this.leaderboardContainer.add(title);

    // Column headers
    const headerY = startY + 35;
    const headers = [
      { text: '#', x: startX, align: 0 },
      { text: 'Spiller', x: startX + 30, align: 0 },
      { text: 'Kampe', x: startX + 200, align: 0.5 },
      { text: 'W-L', x: startX + 270, align: 0.5 },
      { text: 'K/D', x: startX + 330, align: 0.5 }
    ];

    headers.forEach(header => {
      const headerText = this.add.text(header.x, headerY, header.text, {
        fontSize: '14px',
        fontFamily: 'Arial Black',
        color: '#AAAAAA',
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(header.align, 0);

      this.leaderboardContainer.add(headerText);
    });

    // Player rows
    const rowStartY = headerY + 25;
    const displayedPlayers = this.leaderboard.slice(0, 20);

    displayedPlayers.forEach((player, index) => {
      const rowY = rowStartY + (index * 22);
      const isCurrentUser = player.id === this.userId;

      // Highlight current user's row
      if (isCurrentUser) {
        const highlight = this.add.rectangle(
          startX + 175,
          rowY + 7,
          360,
          20,
          0xFFD700,
          0.15
        );
        this.leaderboardContainer.add(highlight);
      }

      const rowColor = isCurrentUser ? '#FFD700' : '#FFFFFF';
      const fontSize = isCurrentUser ? '15px' : '14px';

      // Rank
      const rankText = this.add.text(startX, rowY, `${index + 1}`, {
        fontSize: fontSize,
        fontFamily: isCurrentUser ? 'Arial Black' : 'Arial',
        color: rowColor,
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0, 0);

      // Username (truncate if too long)
      const displayName = player.username.length > 15
        ? player.username.substring(0, 14) + '...'
        : player.username;

      const nameText = this.add.text(startX + 30, rowY, displayName, {
        fontSize: fontSize,
        fontFamily: isCurrentUser ? 'Arial Black' : 'Arial',
        color: rowColor,
        stroke: '#000',
        strokeThickness: 2
      }).setOrigin(0, 0);

      // Matches
      const matchesText = this.add.text(
        startX + 200,
        rowY,
        player.matchesPlayed.toString(),
        {
          fontSize: fontSize,
          fontFamily: 'Arial',
          color: rowColor,
          stroke: '#000',
          strokeThickness: 2
        }
      ).setOrigin(0.5, 0);

      // W-L Record
      const wins = player.matchesWon;
      const losses = player.matchesPlayed - player.matchesWon;
      const wlText = this.add.text(
        startX + 270,
        rowY,
        `${wins}-${losses}`,
        {
          fontSize: fontSize,
          fontFamily: 'Arial',
          color: rowColor,
          stroke: '#000',
          strokeThickness: 2
        }
      ).setOrigin(0.5, 0);

      // K/D Ratio
      const kdRatio = player.matchesPlayed > 0
        ? (player.totalKills / Math.max(1, player.matchesPlayed - player.matchesWon)).toFixed(1)
        : '0.0';

      const kdText = this.add.text(
        startX + 330,
        rowY,
        kdRatio,
        {
          fontSize: fontSize,
          fontFamily: 'Arial',
          color: rowColor,
          stroke: '#000',
          strokeThickness: 2
        }
      ).setOrigin(0.5, 0);

      this.leaderboardContainer.add([rankText, nameText, matchesText, wlText, kdText]);
    });

    // If user not in top 20, show their position at bottom
    if (this.userRank === null && this.userId) {
      const separatorY = rowStartY + (20 * 22) + 5;

      const separator = this.add.text(startX + 175, separatorY, '...', {
        fontSize: '18px',
        fontFamily: 'Arial Black',
        color: '#AAAAAA'
      }).setOrigin(0.5, 0);

      this.leaderboardContainer.add(separator);

      // Get user's actual data
      this.fetchUserRankDisplay(startX, separatorY + 20);
    }
  }

  async fetchUserRankDisplay(x, y) {
    try {
      const response = await fetch(`${SERVER_URL}/api/leaderboard/profile/${this.userId}`);
      const data = await response.json();

      if (data.success) {
        const profile = data.profile;

        // Calculate approximate rank
        const allResponse = await fetch(`${SERVER_URL}/api/leaderboard?limit=100`);
        const allData = await allResponse.json();

        let rank = '?';
        if (allData.success) {
          const userIndex = allData.leaderboard.findIndex(p => p.id === this.userId);
          if (userIndex !== -1) {
            rank = userIndex + 1;
          }
        }

        // Display user row
        const highlight = this.add.rectangle(x + 175, y + 7, 360, 20, 0xFFD700, 0.2);
        this.leaderboardContainer.add(highlight);

        const userRow = this.add.text(x, y, `#${rank} (Du)`, {
          fontSize: '15px',
          fontFamily: 'Arial Black',
          color: '#FFD700',
          stroke: '#000',
          strokeThickness: 2
        }).setOrigin(0, 0);

        this.leaderboardContainer.add(userRow);
      }
    } catch (error) {
      console.error('User rank display error:', error);
    }
  }

  async updateOnlineCount() {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      const data = await response.json();
      this.onlinePlayers = data.onlinePlayers || 0;
      this.onlinePlayersText.setText(`Online: ${this.onlinePlayers}`);
    } catch (error) {
      // Ignore
    }
  }

  setupNetwork() {
    networkManager.connect();

    // Matchmaking events
    networkManager.on('matchmaking:joined', (data) => {
      console.log('Joined matchmaking queue');
    });

    networkManager.on('matchmaking:found', (data) => {
      console.log('Match found! Room:', data.roomCode);
      this.matchmakingActive = false;

      // Transition to waiting room
      this.scene.start('WaitingRoomScene', {
        socket: networkManager.getSocket(),
        playerName: this.playerName,
        userId: this.userId,
        roomCode: data.roomCode,
        players: data.players,
        matchType: data.matchType
      });
    });

    // Room events
    networkManager.on('room:created', (data) => {
      console.log('Room created:', data.roomCode);

      // Transition to waiting room
      this.scene.start('WaitingRoomScene', {
        socket: networkManager.getSocket(),
        playerName: this.playerName,
        userId: this.userId,
        roomCode: data.roomCode,
        players: [data.player],
        matchType: data.matchType,
        isCreator: true
      });
    });

    networkManager.on('room:joined', (data) => {
      console.log('Joined room:', data.roomCode);

      // Transition to waiting room
      this.scene.start('WaitingRoomScene', {
        socket: networkManager.getSocket(),
        playerName: this.playerName,
        userId: this.userId,
        roomCode: data.roomCode,
        players: data.players,
        matchType: data.matchType
      });
    });

    networkManager.on('room:error', (data) => {
      console.error('Room error:', data.message);
      this.showError(data.message);
    });

    networkManager.on('matchmaking:error', (data) => {
      console.error('Matchmaking error:', data.message);
      this.showError(data.message);
      this.matchmakingActive = false;
    });
  }

  createButton(x, y, width, height, text, callback, color = 0x3a86ff) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, color);
    bg.setInteractive({ useHandCursor: true });

    const textObj = this.add.text(0, 0, text, {
      fontSize: Math.min(24, Math.floor(height / 2)),
      fontFamily: 'Arial Black',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    container.add([bg, textObj]);

    // Store text object for updates
    container.setText = (newText) => {
      textObj.setText(newText);
    };

    // Hover effects
    bg.on('pointerover', () => {
      const lighter = Phaser.Display.Color.ValueToColor(color);
      lighter.lighten(20);
      bg.setFillStyle(lighter.color);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
    });

    bg.on('pointerdown', () => {
      const darker = Phaser.Display.Color.ValueToColor(color);
      darker.darken(20);
      bg.setFillStyle(darker.color);
      if (callback) callback();
    });

    bg.on('pointerup', () => {
      const lighter = Phaser.Display.Color.ValueToColor(color);
      lighter.lighten(20);
      bg.setFillStyle(lighter.color);
    });

    return container;
  }

  shutdown() {
    // Clean up DOM elements
    if (this.inputElement) {
      this.inputElement.remove();
    }

    // Remove network listeners
    networkManager.off('matchmaking:joined');
    networkManager.off('matchmaking:found');
    networkManager.off('room:created');
    networkManager.off('room:joined');
    networkManager.off('room:error');
    networkManager.off('matchmaking:error');
  }
}
