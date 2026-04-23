import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants.js';
import Player from '../entities/Player.js';
import Terrain from '../entities/Terrain.js';
import Projectile from '../entities/Projectile.js';
import Explosion from '../entities/Explosion.js';

/**
 * GameScene - Main game scene
 * Handles game loop, player turns, physics, and rendering
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Initialize scene data
     * @param {object} data - Data from previous scene (multiplayer or local)
     */
    init(data = {}) {
        // Multiplayer data from previous scene
        this.socket = data.socket || null;
        this.playerName = data.playerName || null;
        this.userId = data.userId || null;
        this.roomCode = data.roomCode || null;
        this.turnOrder = data.turnOrder || [];
        this.serverPlayers = data.players || [];
        this.isMultiplayer = !!this.socket;

        // Local game state
        this.players = [];
        this.terrain = null;
        this.currentPlayerIndex = 0;
        this.turnTimeRemaining = GAME_CONFIG.TURN_TIME;
        this.turnTimer = null;
        this.isAiming = false;
        this.aimPower = 0;
        this.aimAngle = 0;
        this.powerCharging = false;
        this.activeProjectile = null;
        this.activeExplosion = null;
        this.isTurnActive = true;
        this.isMyTurn = false;
        this.gameEnded = false;

        // Match statistics and tracking
        this.matchStats = {};
        this.matchStartTime = null;
        this.totalTurns = 0;
        this.matchType = data.matchType || 'ffa';

        // Random Danish worm names for test players
        this.wormNames = [
            'Raket-Robert',
            'Bomber-Bjarne',
            'Granat-Grete',
            'Missile-Morten',
            'Torpedo-Trine',
            'Dynamit-Dennis'
        ];
    }

    /**
     * Create scene content
     */
    create() {
        console.log('GameScene created!', this.isMultiplayer ? 'MULTIPLAYER' : 'LOCAL');

        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Setup Matter.js world
        this.matter.world.setBounds(0, 0,
            GAME_CONFIG.WORLD_WIDTH,
            GAME_CONFIG.WORLD_HEIGHT
        );

        // Setup collision detection
        this.setupCollisionDetection();

        // Create terrain
        this.terrain = new Terrain(this);

        // Create players (multiplayer or local test)
        if (this.isMultiplayer) {
            this.createMultiplayerPlayers();
            this.setupMultiplayerListeners();
        } else {
            this.createTestPlayers();
        }

        // Setup camera to follow active player
        this.cameras.main.setBounds(0, 0,
            GAME_CONFIG.WORLD_WIDTH,
            GAME_CONFIG.WORLD_HEIGHT
        );

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Setup mouse for aiming
        this.input.on('pointermove', this.handleMouseMove, this);

        // Create HUD
        this.createHUD();

        // Create aiming graphics
        this.aimArrow = this.add.graphics();
        this.powerBarGraphics = this.add.graphics();

        // Start match timer
        this.matchStartTime = Date.now();

        // Start turn timer (only for local, multiplayer waits for server)
        if (!this.isMultiplayer) {
            this.startTurnTimer();
            this.focusOnActivePlayer();
        }
    }

    /**
     * Setup collision detection for projectiles
     */
    setupCollisionDetection() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                this.handleCollision(pair.bodyA, pair.bodyB);
            });
        });
    }

    /**
     * Handle collision between bodies
     * @param {object} bodyA - First physics body
     * @param {object} bodyB - Second physics body
     */
    handleCollision(bodyA, bodyB) {
        // Check if one of the bodies is a projectile
        const projectileBody = bodyA.label === 'projectile' ? bodyA :
                              (bodyB.label === 'projectile' ? bodyB : null);

        if (!projectileBody || !this.activeProjectile) return;

        // Get the other body (what the projectile hit)
        const otherBody = projectileBody === bodyA ? bodyB : bodyA;

        console.log('Projectile collision detected!');

        // Create explosion at projectile position
        const pos = this.activeProjectile.getPosition();
        this.createExplosion(pos.x, pos.y, this.activeProjectile.damage);

        // Destroy projectile
        this.activeProjectile.destroy();
        this.activeProjectile = null;

        // Wait for explosion to finish, then end turn
        this.time.delayedCall(1200, () => {
            this.checkWinCondition();
            if (!this.gameEnded) {
                this.endTurn();
            }
        });
    }

    /**
     * Create explosion effect and apply damage
     * @param {number} x - Explosion x position
     * @param {number} y - Explosion y position
     * @param {number} damage - Base damage amount
     */
    createExplosion(x, y, damage) {
        this.activeExplosion = new Explosion(this, x, y, damage);
    }

    /**
     * Create 4 test players for development
     */
    createTestPlayers() {
        const spawnPositions = [
            { x: 150, y: 300 },  // Left platform
            { x: 400, y: 200 },  // Center platform
            { x: 650, y: 350 },  // Right platform
            { x: 200, y: 150 }   // Top left platform
        ];

        // Shuffle worm names
        const shuffledNames = [...this.wormNames].sort(() => Math.random() - 0.5);

        for (let i = 0; i < 4; i++) {
            const teamId = (i % 2) + 1; // Alternating teams: 1, 2, 1, 2
            const pos = spawnPositions[i];

            const player = new Player(this, pos.x, pos.y, {
                username: `Player${i + 1}`,
                assignedName: shuffledNames[i],
                teamId: teamId
            });

            this.players.push(player);

            // Initialize match stats
            this.matchStats[player.assignedName] = {
                name: player.assignedName,
                teamId: player.teamId,
                teamColor: player.teamColor,
                damageDealt: 0,
                finalHp: player.hp
            };
        }

        console.log('Created 4 test players:', this.players.map(p => p.assignedName));
    }

    /**
     * Create players from server data (multiplayer)
     */
    createMultiplayerPlayers() {
        console.log('Creating multiplayer players from server data:', this.serverPlayers);

        this.serverPlayers.forEach((serverPlayer, index) => {
            const spawnX = 200 + (index * 300);
            const spawnY = this.terrain.getHeightAt(spawnX) - 20;

            const player = new Player(this, spawnX, spawnY, {
                username: serverPlayer.name,
                assignedName: serverPlayer.assignedName,
                teamId: serverPlayer.team || null
            });

            // Store server data reference
            player.socketId = serverPlayer.socketId;
            player.userId = serverPlayer.userId;
            player.hp = serverPlayer.hp || 100;

            this.players.push(player);

            // Initialize match stats
            this.matchStats[player.assignedName] = {
                name: player.assignedName,
                teamId: player.teamId,
                teamColor: player.teamColor,
                damageDealt: 0,
                kills: 0,
                turns: 0,
                finalHp: player.hp
            };
        });

        console.log('Created multiplayer players:', this.players.map(p => p.assignedName));
    }

    /**
     * Setup multiplayer socket event listeners
     */
    setupMultiplayerListeners() {
        console.log('Setting up multiplayer listeners...');

        // Turn start
        this.socket.on('game:turn_start', (data) => {
            console.log('Turn start:', data.playerName);

            // Find player by assigned name
            const playerIndex = this.players.findIndex(
                p => p.assignedName === data.playerName
            );

            if (playerIndex !== -1) {
                this.currentPlayerIndex = playerIndex;
                this.isMyTurn = (data.playerName === this.playerName);
                this.turnTimeRemaining = data.timer || GAME_CONFIG.TURN_TIME;
                this.isTurnActive = this.isMyTurn;
                this.totalTurns++;

                // Update stats
                if (this.matchStats[data.playerName]) {
                    this.matchStats[data.playerName].turns++;
                }

                this.startTurnTimer();
                this.focusOnActivePlayer();
                this.updateHUD();

                if (this.isMyTurn) {
                    this.showMessage('DIN TUR!', '#00FF00');
                }
            }
        });

        // Projectile fired
        this.socket.on('game:projectile_fired', (data) => {
            console.log('Projectile fired by:', data.playerName);

            // Create visual projectile from server data
            this.createProjectileFromServer(
                data.projectile.startPos,
                data.projectile.velocity
            );
        });

        // Explosion
        this.socket.on('game:explosion', (data) => {
            console.log('Explosion at:', data.position);

            // Create visual explosion
            this.createExplosion(data.position.x, data.position.y, 50);
        });

        // Damage dealt
        this.socket.on('game:damage_dealt', (data) => {
            console.log('Damage dealt:', data.damagedPlayers);

            // Apply damage to players
            data.damagedPlayers.forEach(damaged => {
                const player = this.players.find(
                    p => p.socketId === damaged.playerId
                );
                if (player) {
                    player.takeDamage(damaged.damage);
                    player.hp = damaged.newHP;

                    // Update stats
                    if (this.matchStats[player.assignedName]) {
                        this.matchStats[player.assignedName].finalHp = player.hp;
                    }
                }
            });

            this.updateHUD();
        });

        // Player died
        this.socket.on('game:player_died', (data) => {
            console.log('Player died:', data.playerName);

            const player = this.players.find(
                p => p.assignedName === data.playerName
            );
            if (player) {
                player.die();

                // Track kill credit
                if (data.killedBy) {
                    if (this.matchStats[data.killedBy]) {
                        this.matchStats[data.killedBy].kills++;
                    }
                }
            }
        });

        // Match end
        this.socket.on('game:match_end', (data) => {
            console.log('Match ended. Winner:', data.winner);

            this.gameEnded = true;

            // Stop turn timer
            if (this.turnTimer) {
                this.turnTimer.remove();
            }

            // Transition to victory scene
            this.time.delayedCall(2000, () => {
                this.transitionToVictory(data);
            });
        });

        // Turn timeout
        this.socket.on('game:turn_timeout', (data) => {
            console.log('Turn timeout for:', data.playerName);

            if (this.isMyTurn) {
                this.showMessage('TID ER GÅET!', '#FF0000');
            }
        });

        console.log('✓ Multiplayer listeners setup complete');
    }

    /**
     * Show temporary message on screen
     */
    showMessage(text, color) {
        const messageText = this.add.text(400, 300, text, {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Fade out and destroy
        this.tweens.add({
            targets: messageText,
            alpha: 0,
            y: 250,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    /**
     * Create HUD overlay
     */
    createHUD() {
        // Top-left: Current turn indicator
        this.turnText = this.add.text(10, 10, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Top-center: Turn timer
        this.timerText = this.add.text(400, 10, '', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0);

        // Top-right: Player HP list
        this.hpListText = this.add.text(790, 10, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'right'
        }).setOrigin(1, 0);

        // Bottom-center: Power bar label (shown when aiming)
        this.powerText = this.add.text(400, 550, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.powerText.setVisible(false);

        // Update HUD
        this.updateHUD();
    }

    /**
     * Update HUD text
     */
    updateHUD() {
        const activePlayer = this.players[this.currentPlayerIndex];

        // Turn indicator
        this.turnText.setText(`${activePlayer.assignedName}'s Turn`);
        this.turnText.setColor(activePlayer.teamColor);

        // Timer
        const timeColor = this.turnTimeRemaining <= 10 ? '#FF0000' : '#ffffff';
        this.timerText.setText(`Time: ${Math.ceil(this.turnTimeRemaining)}s`);
        this.timerText.setColor(timeColor);

        // HP list
        let hpListStr = 'Players:\n';
        this.players.forEach((player, index) => {
            const isActive = index === this.currentPlayerIndex ? '> ' : '  ';
            const hpBar = this.createHPBarString(player.hp, player.maxHp);
            hpListStr += `${isActive}${player.assignedName}: ${hpBar} ${player.hp}\n`;
        });
        this.hpListText.setText(hpListStr);
    }

    /**
     * Create a visual HP bar string
     * @param {number} hp - Current HP
     * @param {number} maxHp - Maximum HP
     * @returns {string} HP bar representation
     */
    createHPBarString(hp, maxHp) {
        const barLength = 10;
        const filled = Math.ceil((hp / maxHp) * barLength);
        return '[' + '='.repeat(filled) + ' '.repeat(barLength - filled) + ']';
    }

    /**
     * Start the turn timer
     */
    startTurnTimer() {
        this.turnTimeRemaining = GAME_CONFIG.TURN_TIME;

        // Clear existing timer if any
        if (this.turnTimer) {
            this.turnTimer.remove();
        }

        // Create timer that ticks every second
        this.turnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onTurnTick,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Handle turn timer tick
     */
    onTurnTick() {
        this.turnTimeRemaining--;

        if (this.turnTimeRemaining <= 0) {
            this.endTurn();
        }

        this.updateHUD();
    }

    /**
     * End current turn and move to next player
     */
    endTurn() {
        console.log('Turn ended for', this.players[this.currentPlayerIndex].assignedName);

        if (this.isMultiplayer) {
            // Multiplayer: Server controls turn advancement
            // Just send end turn signal if it's my turn
            if (this.isMyTurn) {
                this.socket.emit('game:end_turn', {
                    roomCode: this.roomCode
                });

                this.isMyTurn = false;
                this.isTurnActive = false;
            }

            // Reset aim state
            this.isAiming = false;
            this.aimPower = 0;
            this.powerCharging = false;
        } else {
            // Local mode: Advance turn locally
            // Move to next player
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

            // Skip dead players
            let attempts = 0;
            while (this.players[this.currentPlayerIndex].isDead && attempts < this.players.length) {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                attempts++;
            }

            // Reset aim state
            this.isAiming = false;
            this.aimPower = 0;
            this.powerCharging = false;
            this.isTurnActive = true;

            // Restart turn timer
            this.startTurnTimer();

            // Focus camera on new active player
            this.focusOnActivePlayer();

            // Update HUD
            this.updateHUD();
        }
    }

    /**
     * Focus camera on the active player
     */
    focusOnActivePlayer() {
        const activePlayer = this.players[this.currentPlayerIndex];
        const pos = activePlayer.getPosition();

        // Smooth camera pan to player
        this.cameras.main.pan(pos.x, pos.y, 500, 'Sine.easeInOut');
    }

    /**
     * Handle mouse movement for aiming
     * @param {object} pointer - Phaser pointer object
     */
    handleMouseMove(pointer) {
        if (this.players.length === 0) return;

        const activePlayer = this.players[this.currentPlayerIndex];
        const playerPos = activePlayer.getPosition();

        // Calculate angle from player to mouse
        const dx = pointer.worldX - playerPos.x;
        const dy = pointer.worldY - playerPos.y;
        this.aimAngle = Math.atan2(dy, dx);

        activePlayer.setAimAngle(this.aimAngle);
    }

    /**
     * Handle spacebar for power charging
     */
    handlePowerCharge() {
        // Start charging when spacebar is pressed
        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            this.powerCharging = true;
            this.aimPower = 0;
            this.powerText.setVisible(true);
        }

        // Charge power while held
        if (this.spaceBar.isDown && this.powerCharging) {
            this.aimPower = Math.min(100, this.aimPower + 2); // Charge at 2% per frame
        }

        // Fire when released
        if (this.spaceBar.isUp && this.powerCharging) {
            this.fireWeapon();
            this.powerCharging = false;
            this.powerText.setVisible(false);
        }
    }

    /**
     * Fire weapon
     */
    fireWeapon() {
        if (!this.isTurnActive || this.activeProjectile) return;

        const activePlayer = this.players[this.currentPlayerIndex];
        const pos = activePlayer.getPosition();
        const power = this.aimPower / 100;

        console.log(`${activePlayer.assignedName} firing with power: ${this.aimPower}%, angle: ${(this.aimAngle * 180 / Math.PI).toFixed(1)}°`);

        if (this.isMultiplayer) {
            // Multiplayer: Send action to server
            if (!this.isMyTurn) {
                console.log('Not your turn!');
                return;
            }

            this.socket.emit('game:action', {
                roomCode: this.roomCode,
                angle: this.aimAngle,
                power: power
            });

            // Visual feedback
            this.showMessage('AFFYRING...', '#00FF00');

            // Disable input
            this.isTurnActive = false;
        } else {
            // Local mode: Create projectile immediately
            this.activeProjectile = new Projectile(
                this,
                pos.x,
                pos.y,
                this.aimAngle,
                this.aimPower
            );

            // Track projectile with camera
            this.trackProjectile();

            // Mark turn as inactive (player can't move/fire again)
            this.isTurnActive = false;

            // Set up timeout for projectile
            this.time.delayedCall(10000, () => {
                // If projectile still exists after 10 seconds, destroy it and end turn
                if (this.activeProjectile) {
                    this.activeProjectile.destroy();
                    this.activeProjectile = null;
                    this.endTurn();
                }
            });
        }
    }

    /**
     * Create projectile from server event (multiplayer only)
     */
    createProjectileFromServer(startPos, velocity) {
        console.log('Creating projectile from server:', startPos, velocity);

        // Create visual projectile with server-provided data
        this.activeProjectile = new Projectile(
            this,
            startPos.x,
            startPos.y,
            0, // Angle not needed (using velocity directly)
            100 // Power not needed
        );

        // Override velocity with server values
        if (this.activeProjectile.body) {
            this.matter.body.setVelocity(this.activeProjectile.body, {
                x: velocity.x,
                y: velocity.y
            });
        }

        // Track projectile with camera
        this.trackProjectile();

        // Set up timeout for projectile
        this.time.delayedCall(10000, () => {
            if (this.activeProjectile) {
                this.activeProjectile.destroy();
                this.activeProjectile = null;
            }
        });
    }

    /**
     * Track projectile with camera
     */
    trackProjectile() {
        if (!this.activeProjectile) return;

        const pos = this.activeProjectile.getPosition();

        // Smoothly pan camera to projectile
        this.cameras.main.pan(pos.x, pos.y, 100, 'Linear', false);

        // Continue tracking while projectile exists
        if (!this.activeProjectile.isDestroyed) {
            this.time.delayedCall(16, () => this.trackProjectile());
        }
    }

    /**
     * Check win condition (local mode only)
     */
    checkWinCondition() {
        if (this.isMultiplayer) {
            // Server handles win detection in multiplayer
            return;
        }

        // Count alive players per team
        const teamAlive = {};

        this.players.forEach(player => {
            if (!player.isDead) {
                if (!teamAlive[player.teamId]) {
                    teamAlive[player.teamId] = [];
                }
                teamAlive[player.teamId].push(player);
            }
        });

        const aliveTeams = Object.keys(teamAlive).length;

        // Check if only one team remains
        if (aliveTeams <= 1) {
            this.endGame(teamAlive);
        }
    }

    /**
     * End game and show victory screen (local mode)
     * @param {object} teamAlive - Map of team IDs to alive players
     */
    async endGame(teamAlive) {
        console.log('Game Over!');
        this.gameEnded = true;

        // Stop turn timer
        if (this.turnTimer) {
            this.turnTimer.remove();
        }

        // Determine winner
        const winningTeamId = Object.keys(teamAlive)[0];
        const winningPlayers = teamAlive[winningTeamId] || [];
        const winner = winningPlayers.length > 0 ?
            winningPlayers[0].assignedName :
            'No one';

        const teamColor = winningPlayers.length > 0 ?
            winningPlayers[0].teamColor :
            '#FFFFFF';

        // Update final stats
        this.players.forEach(player => {
            if (this.matchStats[player.assignedName]) {
                this.matchStats[player.assignedName].finalHp = player.hp;
            }
        });

        // Convert matchStats object to array
        const statsArray = Object.values(this.matchStats);

        // Wait a moment, then show victory screen
        this.time.delayedCall(2000, () => {
            this.scene.start('VictoryScene', {
                winner: winner,
                teamId: winningTeamId,
                teamColor: teamColor,
                matchStats: statsArray,
                socket: this.socket,
                playerName: this.playerName,
                userId: this.userId
            });
        });
    }

    /**
     * Transition to victory scene (multiplayer)
     * @param {object} data - Match end data from server
     */
    transitionToVictory(data) {
        console.log('Transitioning to victory scene with data:', data);

        // Convert matchStats object to array
        const statsArray = Object.values(this.matchStats);

        this.scene.start('VictoryScene', {
            socket: this.socket,
            playerName: this.playerName,
            userId: this.userId,
            winner: data.winner,
            stats: data.stats || statsArray,
            duration: data.duration,
            matchStats: statsArray,
            ratingChanges: data.ratingChanges || null,
            currentUserId: this.userId,
            leaderboardChanges: data.leaderboardChanges || null
        });
    }

    /**
     * Render aiming arrow
     */
    renderAimArrow() {
        this.aimArrow.clear();

        if (this.players.length === 0) return;

        const activePlayer = this.players[this.currentPlayerIndex];
        const pos = activePlayer.getPosition();

        // Draw arrow showing aim direction
        const arrowLength = 50;
        const endX = pos.x + Math.cos(this.aimAngle) * arrowLength;
        const endY = pos.y + Math.sin(this.aimAngle) * arrowLength;

        // Arrow line
        this.aimArrow.lineStyle(3, 0xFFFFFF, 1);
        this.aimArrow.beginPath();
        this.aimArrow.moveTo(pos.x, pos.y);
        this.aimArrow.lineTo(endX, endY);
        this.aimArrow.strokePath();

        // Arrow head
        const headLength = 10;
        const headAngle = Math.PI / 6;
        this.aimArrow.fillStyle(0xFFFFFF, 1);
        this.aimArrow.beginPath();
        this.aimArrow.moveTo(endX, endY);
        this.aimArrow.lineTo(
            endX - headLength * Math.cos(this.aimAngle - headAngle),
            endY - headLength * Math.sin(this.aimAngle - headAngle)
        );
        this.aimArrow.lineTo(
            endX - headLength * Math.cos(this.aimAngle + headAngle),
            endY - headLength * Math.sin(this.aimAngle + headAngle)
        );
        this.aimArrow.closePath();
        this.aimArrow.fillPath();
    }

    /**
     * Render power bar
     */
    renderPowerBar() {
        this.powerBarGraphics.clear();

        if (!this.powerCharging) return;

        // Power bar background
        const barWidth = 200;
        const barHeight = 20;
        const barX = 400 - barWidth / 2;
        const barY = 520;

        // Background
        this.powerBarGraphics.fillStyle(0x000000, 0.7);
        this.powerBarGraphics.fillRect(barX, barY, barWidth, barHeight);

        // Power fill (gradient from green to yellow to red)
        let powerColor = 0x00FF00; // Green
        if (this.aimPower > 66) {
            powerColor = 0xFF0000; // Red
        } else if (this.aimPower > 33) {
            powerColor = 0xFFFF00; // Yellow
        }

        this.powerBarGraphics.fillStyle(powerColor, 1);
        this.powerBarGraphics.fillRect(barX, barY, (barWidth * this.aimPower) / 100, barHeight);

        // Border
        this.powerBarGraphics.lineStyle(2, 0xFFFFFF, 1);
        this.powerBarGraphics.strokeRect(barX, barY, barWidth, barHeight);

        // Update power text
        this.powerText.setText(`Power: ${Math.floor(this.aimPower)}%`);
    }

    /**
     * Update loop
     * @param {number} time - Total elapsed time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        if (this.players.length === 0 || this.gameEnded) return;

        const activePlayer = this.players[this.currentPlayerIndex];

        // In multiplayer, only allow input on your turn
        if (this.isMultiplayer && !this.isMyTurn) {
            this.aimArrow.clear();
            this.powerBarGraphics.clear();
        }

        // Update all players
        this.players.forEach((player, index) => {
            const isActivePlayer = index === this.currentPlayerIndex;
            const canControl = this.isMultiplayer ? this.isMyTurn : isActivePlayer;
            player.update(this.cursors, canControl && isActivePlayer);
        });

        // Update active projectile
        if (this.activeProjectile) {
            this.activeProjectile.update(delta);
        }

        // Update active explosion
        if (this.activeExplosion) {
            this.activeExplosion.update(delta);
            if (this.activeExplosion.isComplete) {
                this.activeExplosion = null;
            }
        }

        // Handle power charging (only if turn is active)
        const canCharge = this.isMultiplayer ? this.isMyTurn && this.isTurnActive : this.isTurnActive;
        if (canCharge) {
            this.handlePowerCharge();
        }

        // Render aim arrow (only if allowed)
        if (!this.isMultiplayer || this.isMyTurn) {
            this.renderAimArrow();
            this.renderPowerBar();
        }

        // Update camera to smoothly follow active player or projectile
        if (this.activeProjectile && !this.activeProjectile.isDestroyed) {
            // Follow projectile
            const projPos = this.activeProjectile.getPosition();
            this.cameras.main.scrollX = Phaser.Math.Linear(
                this.cameras.main.scrollX,
                projPos.x - 400,
                0.1
            );
            this.cameras.main.scrollY = Phaser.Math.Linear(
                this.cameras.main.scrollY,
                projPos.y - 300,
                0.1
            );
        } else if (activePlayer) {
            // Follow active player
            const pos = activePlayer.getPosition();
            this.cameras.main.scrollX = Phaser.Math.Linear(
                this.cameras.main.scrollX,
                pos.x - 400,
                0.05
            );
            this.cameras.main.scrollY = Phaser.Math.Linear(
                this.cameras.main.scrollY,
                pos.y - 300,
                0.05
            );
        }
    }

    /**
     * Clean up scene
     */
    shutdown() {
        if (this.turnTimer) {
            this.turnTimer.remove();
        }

        this.players.forEach(player => player.destroy());
        this.players = [];

        if (this.terrain) {
            this.terrain.destroy();
        }

        // Remove socket listeners (multiplayer only)
        if (this.isMultiplayer && this.socket) {
            this.socket.off('game:turn_start');
            this.socket.off('game:projectile_fired');
            this.socket.off('game:explosion');
            this.socket.off('game:damage_dealt');
            this.socket.off('game:player_died');
            this.socket.off('game:match_end');
            this.socket.off('game:turn_timeout');
        }
    }
}

export default GameScene;
