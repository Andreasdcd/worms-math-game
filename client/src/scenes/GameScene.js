import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants.js';
import { networkManager } from '../utils/networkManager.js';
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
     * Initialize scene data passed from QuizScene
     * @param {object} data - { firstTurnUserId, roomCode, socket, playerName, userId, turnOrder, players }
     */
    init(data = {}) {
        this.firstTurnUserId = data.firstTurnUserId || null;
        this.roomCode = data.roomCode || null;
        this.socket = data.socket || null;
        this.playerName = data.playerName || null;
        this.userId = data.userId || null;
        this.turnOrderNames = data.turnOrder || [];
        this.serverPlayers = data.players || [];
        this.isMultiplayer = !!(this.socket);

        // Local game state
        this.players = [];
        this.terrain = null;
        this.currentPlayerIndex = 0;
        this.currentTurnUserId = this.firstTurnUserId || null;
        this.turnTimeRemaining = GAME_CONFIG.TURN_TIME;
        this.turnTimer = null;
        this.aimAngle = -Math.PI / 4; // Default aim 45° upward-right
        this.aimPower = 0;
        this.powerCharging = false;
        this.activeProjectile = null;
        this.activeExplosion = null;
        this.isTurnActive = true;
        this.isMyTurn = false;
        this.gameEnded = false;
        this.matchStats = {};
        this.matchStartTime = null;
        this.totalTurns = 0;
        this.wormNames = [
            'Raket-Robert', 'Bomber-Bjarne', 'Granat-Grete',
            'Missile-Morten', 'Torpedo-Trine', 'Dynamit-Dennis'
        ];
    }

    /**
     * Preload worm SVG assets
     */
    preload() {
        this.load.svg('worm_1', 'assets/worm_red.svg', { width: 48, height: 48 });
        this.load.svg('worm_2', 'assets/worm_blue.svg', { width: 48, height: 48 });
        this.load.svg('worm_3', 'assets/worm_green.svg', { width: 48, height: 48 });
        this.load.svg('worm_4', 'assets/worm_yellow.svg', { width: 48, height: 48 });
    }

    /**
     * Create scene content
     */
    create() {
        console.log('GameScene created!', this.isMultiplayer ? 'MULTIPLAYER' : 'LOCAL');

        this.cameras.main.setBackgroundColor('#87CEEB');

        // Setup Matter.js world bounds
        this.matter.world.setBounds(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        // Setup collision detection
        this.setupCollisionDetection();

        // Create terrain
        this.terrain = new Terrain(this);

        // Create players
        if (this.isMultiplayer && this.serverPlayers.length > 0) {
            this.createMultiplayerPlayers();
            this.setupMultiplayerListeners();
        } else {
            this.createTestPlayers();
        }

        // Determine initial turn
        if (this.currentTurnUserId) {
            const idx = this.players.findIndex(p => p.userId === this.currentTurnUserId);
            if (idx !== -1) this.currentPlayerIndex = idx;
        }

        // Camera bounds
        this.cameras.main.setBounds(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // HUD elements
        this.createHUD();

        // Aim graphics
        this.aimArrow = this.add.graphics().setDepth(10);
        this.powerBarGraphics = this.add.graphics().setDepth(10);

        this.matchStartTime = Date.now();

        this.playersWhoHadTurn = new Set();
        this.roundNumber = 1;

        if (!this.isMultiplayer) {
            const first = this.players[this.currentPlayerIndex];
            if (first) {
                first.resetMovement();
                first._movementDepletedFired = false;
            }
            this.startTurnTimer();
            this.focusOnActivePlayer();
            this.isMyTurn = true;
            this.isTurnActive = true;
        }

        // Broadcast game:start if multiplayer and we are the room initiator
        if (this.isMultiplayer) {
            networkManager.send('game:start', {
                roomCode: this.roomCode,
                firstTurnUserId: this.firstTurnUserId
            });
        }
    }

    /**
     * Setup Matter.js collision events
     */
    setupCollisionDetection() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                this.handleCollision(pair.bodyA, pair.bodyB);
            });
        });
    }

    handleCollision(bodyA, bodyB) {
        if (!this.activeProjectile) return;
        if (this.activeProjectile.isDestroyed) return;

        const isProj = b => b.label === 'projectile';
        const projBody = isProj(bodyA) ? bodyA : (isProj(bodyB) ? bodyB : null);
        if (!projBody) return;

        // Only explode on collision with terrain or player — ignore world bounds / unlabeled bodies
        const other = projBody === bodyA ? bodyB : bodyA;
        if (other.label !== 'terrain' && other.label !== 'player') return;

        const pos = this.activeProjectile.getPosition();
        this.triggerExplosion(pos.x, pos.y);
    }

    triggerExplosion(x, y) {
        if (this.activeProjectile && !this.activeProjectile.isDestroyed) {
            this.activeProjectile.destroy();
            this.activeProjectile = null;
        }

        const exp = new Explosion(this, x, y, GAME_CONFIG.PROJECTILE_DAMAGE_BASE);
        exp.damageNearby(this.players, x, y, GAME_CONFIG.EXPLOSION_RADIUS, GAME_CONFIG.PROJECTILE_DAMAGE_BASE);
        this.activeExplosion = exp;

        // Update HUD after damage
        this.updateHUD();

        // Check win and then end turn after animation
        this.time.delayedCall(1200, () => {
            this.checkWinCondition();
            if (!this.gameEnded) {
                this.endTurn();
            }
        });
    }

    // ───────────────── Player creation ─────────────────

    createTestPlayers() {
        const spawnPositions = [
            { x: 150, y: 300 },
            { x: 400, y: 200 },
            { x: 650, y: 350 },
            { x: 200, y: 150 }
        ];
        const shuffledNames = [...this.wormNames].sort(() => Math.random() - 0.5);

        for (let i = 0; i < 4; i++) {
            const teamId = i + 1;
            const pos = spawnPositions[i];

            const player = new Player(this, pos.x, pos.y, {
                username: `Spiller${i + 1}`,
                assignedName: shuffledNames[i],
                teamId
            });
            player.userId = `local_${i}`;
            this.players.push(player);

            this.matchStats[player.assignedName] = {
                name: player.assignedName,
                teamId: player.teamId,
                damageDealt: 0,
                finalHp: player.hp
            };
        }

        // Single player hotseat: first player is always "mine"
        this.currentPlayerIndex = 0;
        console.log('Created test players:', this.players.map(p => p.assignedName));
    }

    createMultiplayerPlayers() {
        this.serverPlayers.forEach((sp, index) => {
            const spawnX = 150 + (index * Math.floor((GAME_CONFIG.WORLD_WIDTH - 200) / Math.max(this.serverPlayers.length - 1, 1)));
            const spawnY = 300;
            const player = new Player(this, spawnX, spawnY, {
                username: sp.name || sp.playerName,
                assignedName: sp.assignedName || sp.name || `Spiller${index + 1}`,
                teamId: sp.team || (index + 1)
            });
            player.userId = sp.userId || sp.socketId;
            player.socketId = sp.socketId;
            this.players.push(player);

            this.matchStats[player.assignedName] = {
                name: player.assignedName,
                teamId: player.teamId,
                damageDealt: 0,
                finalHp: player.hp
            };
        });
        console.log('Created multiplayer players:', this.players.map(p => p.assignedName));
    }

    // ───────────────── Multiplayer networking ─────────────────

    setupMultiplayerListeners() {
        // Server tells us who goes first / game is initialized
        networkManager.on('game:initialized', (data) => {
            const idx = this.players.findIndex(p => p.userId === data.currentTurnUserId);
            if (idx !== -1) this.currentPlayerIndex = idx;
            this.currentTurnUserId = data.currentTurnUserId;
            this.isMyTurn = (data.currentTurnUserId === this.userId);
            this.isTurnActive = this.isMyTurn;
            this.startTurnTimer();
            this.focusOnActivePlayer();
            this.updateHUD();
        });

        // Next turn
        networkManager.on('turn:start', (data) => {
            const idx = this.players.findIndex(p => p.userId === data.userId);
            if (idx !== -1) {
                this.currentPlayerIndex = idx;
                this.currentTurnUserId = data.userId;
            }
            this.isMyTurn = (data.userId === this.userId);
            this.isTurnActive = this.isMyTurn;
            this.aimAngle = -Math.PI / 4;
            this.aimPower = 0;
            this.powerCharging = false;
            this.startTurnTimer();
            this.focusOnActivePlayer();
            this.updateHUD();
            if (this.isMyTurn) this.showMessage('Din tur!', '#00FF00');
        });

        // Other player fired
        networkManager.on('player:shoot', (data) => {
            if (data.userId === this.userId) return; // We already fired locally
            this.activeProjectile = new Projectile(this, data.x, data.y, data.angle, data.power);
        });

        // Player damaged (from authoritative client)
        networkManager.on('player:damaged', (data) => {
            const player = this.players.find(p => p.userId === data.targetUserId);
            if (player) {
                player.hp = Math.max(0, data.hp);
                if (player.hp <= 0 && !player.isDead) player.die();
                this.updateHUD();
            }
        });

        // Player eliminated notification
        networkManager.on('player:eliminated', (data) => {
            const player = this.players.find(p => p.userId === data.userId);
            if (player && !player.isDead) player.die();
            this.updateHUD();
        });

        // Game over
        networkManager.on('game:end', (data) => {
            this.gameEnded = true;
            if (this.turnTimer) this.turnTimer.remove();
            this.time.delayedCall(2000, () => {
                this.scene.start('VictoryScene', {
                    winner: data.winnerUserId,
                    stats: data.stats,
                    socket: this.socket,
                    playerName: this.playerName,
                    userId: this.userId
                });
            });
        });

        console.log('Multiplayer listeners set up');
    }

    // ───────────────── HUD ─────────────────

    createHUD() {
        const style = (size, color = '#ffffff') => ({
            fontSize: `${size}px`,
            fontFamily: 'Arial',
            color,
            stroke: '#000000',
            strokeThickness: 4
        });

        // All HUD elements are fixed to camera
        this.turnText = this.add.text(10, 10, '', style(18)).setScrollFactor(0).setDepth(20);
        this.timerText = this.add.text(10, 34, '', style(16)).setScrollFactor(0).setDepth(20);
        this.hpText = this.add.text(10, 58, '', style(14)).setScrollFactor(0).setDepth(20);

        // Power bar label
        this.powerText = this.add.text(
            GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT - 50, '',
            style(16)
        ).setOrigin(0.5).setScrollFactor(0).setDepth(20).setVisible(false);

        this.updateHUD();
    }

    updateHUD() {
        if (this.players.length === 0) return;
        const ap = this.players[this.currentPlayerIndex];

        this.turnText.setText(`Tur: ${ap.assignedName}`);
        this.turnText.setColor(ap.teamColor);

        const tc = this.turnTimeRemaining <= 10 ? '#FF4444' : '#ffffff';
        this.timerText.setText(`Tid: ${Math.ceil(this.turnTimeRemaining)}s`);
        this.timerText.setColor(tc);

        this.hpText.setText(`HP: ${ap.hp}/${ap.maxHp}`);
    }

    // ───────────────── Timer ─────────────────

    startTurnTimer() {
        this.turnTimeRemaining = GAME_CONFIG.TURN_TIME;
        if (this.turnTimer) this.turnTimer.remove();
        this.turnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onTurnTick,
            callbackScope: this,
            loop: true
        });
    }

    onTurnTick() {
        this.turnTimeRemaining = Math.max(0, this.turnTimeRemaining - 1);
        if (this.turnTimeRemaining <= 0) {
            this.endTurn();
        }
        this.updateHUD();
    }

    // ───────────────── Turn logic ─────────────────

    /**
     * When movement is consumed, check if this player ran out.
     * If so, fast-forward the turn timer to 10s (or less if already under).
     */
    onMovementConsumed(ap) {
        if (ap.hasMovementLeft()) return;
        if (ap._movementDepletedFired) return;
        ap._movementDepletedFired = true;
        this.turnTimeRemaining = Math.min(this.turnTimeRemaining, 10);
        this.showMessage('Ingen skridt tilbage — 10s til at skyde!', '#FFAA00');
        this.updateHUD();
    }

    endTurn() {
        if (this.turnTimer) this.turnTimer.remove();

        // Mark current player as having completed their turn this round
        const current = this.players[this.currentPlayerIndex];
        if (current) {
            if (!this.playersWhoHadTurn) this.playersWhoHadTurn = new Set();
            this.playersWhoHadTurn.add(current.userId);
        }

        if (this.isMultiplayer) {
            if (this.isMyTurn) {
                networkManager.send('turn:end', { roomCode: this.roomCode });
            }
            this.isMyTurn = false;
            this.isTurnActive = false;
            return;
        }

        // Check if round is complete — all alive players have had their turn
        const alive = this.players.filter(p => !p.isDead);
        const remaining = alive.filter(p => !this.playersWhoHadTurn.has(p.userId));

        if (remaining.length === 0) {
            this.startNewRound();
            return;
        }

        // Local hotseat: advance to next alive player who hasn't gone yet
        let attempts = 0;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        } while (
            (this.players[this.currentPlayerIndex].isDead ||
             this.playersWhoHadTurn.has(this.players[this.currentPlayerIndex].userId))
            && attempts <= this.players.length
        );

        this.beginTurnForCurrent();
    }

    beginTurnForCurrent() {
        const ap = this.players[this.currentPlayerIndex];
        if (!ap) return;

        this.aimAngle = -Math.PI / 4;
        this.aimPower = 0;
        this.powerCharging = false;
        this.isTurnActive = true;
        this.isMyTurn = true;

        ap.resetMovement();
        ap._movementDepletedFired = false;

        this.startTurnTimer();
        this.focusOnActivePlayer();
        this.updateHUD();
        this.showMessage(`Tur: ${ap.assignedName}`, '#FFFF00');
    }

    /**
     * All alive players have had their turn — trigger a new quiz round
     * to re-determine turn order.
     */
    startNewRound() {
        this.playersWhoHadTurn = new Set();
        this.roundNumber = (this.roundNumber || 1) + 1;

        if (this.isMultiplayer && this.roomCode) {
            // Multiplayer: go back to QuizScene for a new quiz round
            this.scene.start('QuizScene', { roomCode: this.roomCode, roundNumber: this.roundNumber });
            return;
        }

        // Local mode: shuffle turn order and continue
        this.showMessage(`Runde ${this.roundNumber}! Ny rækkefølge...`, '#00FFFF');
        this.time.delayedCall(1500, () => {
            // Shuffle alive players to front
            const alive = this.players.filter(p => !p.isDead);
            if (alive.length === 0) return;
            const next = alive[Math.floor(Math.random() * alive.length)];
            this.currentPlayerIndex = this.players.indexOf(next);
            this.beginTurnForCurrent();
        });
    }

    focusOnActivePlayer() {
        const ap = this.players[this.currentPlayerIndex];
        if (!ap) return;
        const pos = ap.getPosition();
        this.cameras.main.pan(pos.x, pos.y, 500, 'Sine.easeInOut');
        this.cameras.main.startFollow(ap.sprite, true, 0.08, 0.08);
    }

    // ───────────────── Input / Aiming / Firing ─────────────────

    handleMovement() {
        if (!this.isTurnActive || this.activeProjectile) return;
        const ap = this.players[this.currentPlayerIndex];
        if (!ap || ap.isDead) return;

        const moveSpeed = 3;
        if (this.cursors.left.isDown && ap.hasMovementLeft()) {
            this.matter.body.setVelocity(ap.body, { x: -moveSpeed, y: ap.body.velocity.y });
            ap.setFacing(-1);
            ap.consumeMovement(moveSpeed);
            this.onMovementConsumed(ap);
        } else if (this.cursors.right.isDown && ap.hasMovementLeft()) {
            this.matter.body.setVelocity(ap.body, { x: moveSpeed, y: ap.body.velocity.y });
            ap.setFacing(1);
            ap.consumeMovement(moveSpeed);
            this.onMovementConsumed(ap);
        }

        // Aim angle with Up/Down arrows: range -90° (straight up) to 0° (horizontal right)
        if (this.cursors.up.isDown) {
            this.aimAngle = Math.max(-Math.PI / 2, this.aimAngle - 0.03);
        } else if (this.cursors.down.isDown) {
            this.aimAngle = Math.min(0, this.aimAngle + 0.03);
        }
    }

    handlePowerCharge() {
        if (!this.isTurnActive || this.activeProjectile) return;

        if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
            this.powerCharging = true;
            this.aimPower = 0;
            this.chargeStartTime = this.time.now;
            this.powerText.setVisible(true);
        }

        if (this.spaceBar.isDown && this.powerCharging) {
            // Quadratic curve: slow start, then accelerates. Full power after ~2.5s.
            const elapsed = (this.time.now - this.chargeStartTime) / 1000;
            const chargeDuration = 2.5;
            const t = Math.min(1, elapsed / chargeDuration);
            this.aimPower = 100 * (t * t);
        }

        if (Phaser.Input.Keyboard.JustUp(this.spaceBar) && this.powerCharging) {
            this.fireWeapon();
            this.powerCharging = false;
            this.powerText.setVisible(false);
        }
    }

    fireWeapon() {
        if (!this.isTurnActive || this.activeProjectile) return;
        const ap = this.players[this.currentPlayerIndex];
        if (!ap || ap.isDead) return;

        const pos = ap.getPosition();
        const power = this.aimPower;

        // Mirror aim angle across vertical axis when facing left
        const effAngle = ap.facing === 1 ? this.aimAngle : (Math.PI - this.aimAngle);

        // Spawn projectile outside the shooter's body so it doesn't self-collide
        const muzzleDist = ap.radius + (GAME_CONFIG.PROJECTILE_RADIUS || 8) + 6;
        const spawnX = pos.x + Math.cos(effAngle) * muzzleDist;
        const spawnY = pos.y + Math.sin(effAngle) * muzzleDist;

        if (this.isMultiplayer && this.isMyTurn) {
            networkManager.send('player:shoot', {
                roomCode: this.roomCode,
                angle: effAngle,
                power,
                x: spawnX,
                y: spawnY
            });
        }

        console.log(`Affyring: vinkel=${(effAngle * 180 / Math.PI).toFixed(1)}°, kraft=${power.toFixed(0)}%, facing=${ap.facing}`);

        this.activeProjectile = new Projectile(this, spawnX, spawnY, effAngle, power);
        this.isTurnActive = false;

        // Safety net: if projectile somehow never collides in 15s, end turn without exploding
        this.time.delayedCall(15000, () => {
            if (this.activeProjectile && !this.activeProjectile.isDestroyed) {
                this.activeProjectile.destroy();
                this.activeProjectile = null;
                this.checkWinCondition();
                if (!this.gameEnded) this.endTurn();
            }
        });
    }

    // ───────────────── Rendering ─────────────────

    renderAimArrow() {
        this.aimArrow.clear();
        if (!this.isTurnActive || this.players.length === 0) return;

        const ap = this.players[this.currentPlayerIndex];
        const pos = ap.getPosition();
        const len = 55;
        const effAngle = ap.facing === 1 ? this.aimAngle : (Math.PI - this.aimAngle);
        const endX = pos.x + Math.cos(effAngle) * len;
        const endY = pos.y + Math.sin(effAngle) * len;

        this.aimArrow.lineStyle(3, 0xFFFFFF, 0.9);
        this.aimArrow.beginPath();
        this.aimArrow.moveTo(pos.x, pos.y);
        this.aimArrow.lineTo(endX, endY);
        this.aimArrow.strokePath();

        const hl = 10;
        const ha = Math.PI / 6;
        this.aimArrow.fillStyle(0xFFFFFF, 0.9);
        this.aimArrow.beginPath();
        this.aimArrow.moveTo(endX, endY);
        this.aimArrow.lineTo(endX - hl * Math.cos(effAngle - ha), endY - hl * Math.sin(effAngle - ha));
        this.aimArrow.lineTo(endX - hl * Math.cos(effAngle + ha), endY - hl * Math.sin(effAngle + ha));
        this.aimArrow.closePath();
        this.aimArrow.fillPath();
    }

    renderPowerBar() {
        this.powerBarGraphics.clear();
        if (!this.powerCharging) return;

        const bw = 200, bh = 20;
        const bx = GAME_CONFIG.WORLD_WIDTH / 2 - bw / 2;
        const by = GAME_CONFIG.WORLD_HEIGHT - 70;

        this.powerBarGraphics.fillStyle(0x000000, 0.7);
        this.powerBarGraphics.fillRect(bx, by, bw, bh);

        const col = this.aimPower > 66 ? 0xFF0000 : (this.aimPower > 33 ? 0xFFFF00 : 0x00FF00);
        this.powerBarGraphics.fillStyle(col, 1);
        this.powerBarGraphics.fillRect(bx, by, (bw * this.aimPower) / 100, bh);

        this.powerBarGraphics.lineStyle(2, 0xFFFFFF, 1);
        this.powerBarGraphics.strokeRect(bx, by, bw, bh);

        this.powerText.setText(`Kraft: ${Math.floor(this.aimPower)}%`);
    }

    // ───────────────── Win condition ─────────────────

    checkWinCondition() {
        const alive = this.players.filter(p => !p.isDead);
        if (alive.length <= 1) {
            this.endGame(alive);
        }
    }

    endGame(alivePlayers) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        if (this.turnTimer) this.turnTimer.remove();

        const winner = alivePlayers.length > 0 ? alivePlayers[0] : null;
        const winnerName = winner ? winner.assignedName : 'Ingen';

        this.showMessage(`Vinder: ${winnerName}`, winner ? winner.teamColor : '#FFFFFF');

        if (this.isMultiplayer) {
            networkManager.send('game:end', {
                roomCode: this.roomCode,
                winnerUserId: winner ? winner.userId : null
            });
        }

        this.players.forEach(p => {
            if (this.matchStats[p.assignedName]) {
                this.matchStats[p.assignedName].finalHp = p.hp;
            }
        });

        this.time.delayedCall(3000, () => {
            this.scene.start('VictoryScene', {
                winner: winnerName,
                teamId: winner ? winner.teamId : null,
                teamColor: winner ? winner.teamColor : '#FFFFFF',
                matchStats: Object.values(this.matchStats),
                socket: this.socket,
                playerName: this.playerName,
                userId: this.userId
            });
        });
    }

    // ───────────────── Utility ─────────────────

    showMessage(text, color = '#ffffff') {
        const msg = this.add.text(
            GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2 - 60, text, {
                fontSize: '42px',
                fontFamily: 'Arial Black',
                color,
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(30);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: GAME_CONFIG.WORLD_HEIGHT / 2 - 110,
            duration: 1800,
            ease: 'Cubic.easeOut',
            onComplete: () => msg.destroy()
        });
    }

    // ───────────────── Update loop ─────────────────

    update(time, delta) {
        if (this.gameEnded) return;
        if (this.players.length === 0) return;

        // Player movement + aim (only on active turn)
        if (!this.isMultiplayer || this.isMyTurn) {
            this.handleMovement();
            this.handlePowerCharge();
        }

        // Update all players
        this.players.forEach(p => p.update());

        // Update projectile
        if (this.activeProjectile) {
            this.activeProjectile.update(delta);
            // Follow projectile with camera
            if (!this.activeProjectile.isDestroyed) {
                const pp = this.activeProjectile.getPosition();
                this.cameras.main.stopFollow();
                this.cameras.main.scrollX = Phaser.Math.Linear(
                    this.cameras.main.scrollX, pp.x - GAME_CONFIG.WORLD_WIDTH / 2, 0.12
                );
                this.cameras.main.scrollY = Phaser.Math.Linear(
                    this.cameras.main.scrollY, pp.y - GAME_CONFIG.WORLD_HEIGHT / 2, 0.12
                );
            }
        }

        // Update explosion animation
        if (this.activeExplosion) {
            this.activeExplosion.update(delta);
            if (this.activeExplosion.isComplete) this.activeExplosion = null;
        }

        // Render aim + power bar
        this.renderAimArrow();
        this.renderPowerBar();
    }

    // ───────────────── Cleanup ─────────────────

    shutdown() {
        if (this.turnTimer) this.turnTimer.remove();
        this.players.forEach(p => p.destroy());
        this.players = [];
        if (this.terrain) this.terrain.destroy();

        if (this.isMultiplayer) {
            networkManager.off('game:initialized');
            networkManager.off('turn:start');
            networkManager.off('player:shoot');
            networkManager.off('player:damaged');
            networkManager.off('player:eliminated');
            networkManager.off('game:end');
        }
    }
}

export default GameScene;
