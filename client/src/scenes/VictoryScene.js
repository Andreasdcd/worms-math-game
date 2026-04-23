/**
 * VictoryScene - Displays winner and match statistics
 */

class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    /**
     * Initialize scene with game data
     * @param {object} data - Victory data from game scene
     */
    init(data) {
        this.winner = data.winner;
        this.teamId = data.teamId;
        this.teamColor = data.teamColor;
        this.matchStats = data.matchStats || [];
        this.ratingChanges = data.ratingChanges || null;
        this.currentUserId = data.currentUserId || null;
        this.leaderboardChanges = data.leaderboardChanges || null;

        // Multiplayer data
        this.socket = data.socket || null;
        this.playerName = data.playerName || null;
        this.userId = data.userId || null;
    }

    /**
     * Create victory screen
     */
    create() {
        console.log('VictoryScene created!');

        // Set background color
        this.cameras.main.setBackgroundColor('#2C3E50');

        // Center coordinates
        const centerX = 400;
        const centerY = 300;

        // Victory banner
        this.add.text(centerX, 80, 'VICTORY!', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Winner name and team
        const winnerText = `${this.winner} Wins!`;
        this.add.text(centerX, 160, winnerText, {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: this.teamColor,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Team indicator
        this.add.text(centerX, 210, `Team ${this.teamId}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: this.teamColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Match statistics header
        this.add.text(centerX, 270, 'Match Statistics', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Display player statistics
        this.displayStatistics(centerX, 310);

        // Rating changes (Stream 7)
        if (this.ratingChanges && this.ratingChanges.length > 0) {
            this.displayRatingChanges(centerX, 450);
        } else {
            this.add.text(centerX, 450, 'Henter ratings...', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#888888',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }

        // Play Again button
        this.createPlayAgainButton(centerX, 530);

        // Celebration particles
        this.createCelebrationParticles();
    }

    /**
     * Display match statistics for each player
     * @param {number} x - X position
     * @param {number} y - Starting Y position
     */
    displayStatistics(x, y) {
        const statsContainer = this.add.container(0, 0);

        // Table header
        const headerText = 'Player               Damage Dealt    Final HP';
        this.add.text(x, y, headerText, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Player stats rows
        this.matchStats.forEach((stat, index) => {
            const rowY = y + 30 + (index * 25);

            // Format stats
            const nameStr = stat.name.padEnd(20, ' ');
            const damageStr = stat.damageDealt.toString().padStart(12, ' ');
            const hpStr = stat.finalHp.toString().padStart(11, ' ');

            const rowText = `${nameStr}${damageStr}${hpStr}`;

            this.add.text(x, rowY, rowText, {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: stat.teamColor,
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        });
    }

    /**
     * Display rating changes with animations
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    displayRatingChanges(x, y) {
        // Header
        this.add.text(x, y - 30, 'Ratings & Placering:', {
            fontSize: '22px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Display each player's rating change
        this.ratingChanges.forEach((change, index) => {
            const rowY = y + 10 + (index * 35);
            const isCurrentUser = change.userId === this.currentUserId;

            // Player name
            const nameColor = isCurrentUser ? '#FFD700' : change.teamColor || '#FFFFFF';
            this.add.text(x - 250, rowY, change.username, {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: isCurrentUser ? 'bold' : 'normal',
                color: nameColor,
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // Placement change
            const placementText = `#${change.placement}`;
            const oldPlacement = this.leaderboardChanges && this.leaderboardChanges[change.userId]
                ? this.leaderboardChanges[change.userId].oldRank
                : change.placement;

            const placementChange = oldPlacement - change.placement; // Positive = moved up
            let placementArrow = '';
            if (placementChange > 0) placementArrow = ` ▲${placementChange}`;
            else if (placementChange < 0) placementArrow = ` ▼${Math.abs(placementChange)}`;

            this.add.text(x - 100, rowY, placementText + placementArrow, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: placementChange > 0 ? '#00FF00' : placementChange < 0 ? '#FF6666' : '#AAAAAA',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);

            // Rating display - only show number for current user
            if (isCurrentUser) {
                const ratingColor = change.ratingChange >= 0 ? '#00FF00' : '#FF4444';
                const ratingSign = change.ratingChange >= 0 ? '+' : '';

                // Display: "Din rating: 47 → 62 (+15)"
                const ratingText = `Din rating: ${change.ratingBefore} → ${change.ratingAfter} (${ratingSign}${change.ratingChange})`;

                const ratingTextObj = this.add.text(x + 20, rowY, ratingText, {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: ratingColor,
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0, 0.5);

                // Animate the change number
                if (change.ratingChange !== 0) {
                    this.animateRatingChange(x + 240, rowY, change.ratingChange);
                }

                // Special messages for edge cases
                if (change.ratingBefore === 0) {
                    this.add.text(x, rowY + 20, 'Første kamp!', {
                        fontSize: '14px',
                        fontFamily: 'Arial',
                        color: '#FFD700',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);
                } else if (Math.abs(change.ratingChange) >= 40) {
                    const message = change.ratingChange > 0 ? 'Kæmpe sejr!' : 'Kæmpe tab!';
                    this.add.text(x, rowY + 20, message, {
                        fontSize: '14px',
                        fontFamily: 'Arial',
                        color: change.ratingChange > 0 ? '#FFD700' : '#FF4444',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);
                }
            } else {
                // For other players: Show placement change only
                const changeText = change.ratingChange >= 0
                    ? `(+${change.ratingChange} rating)`
                    : `(${change.ratingChange} rating)`;

                this.add.text(x + 20, rowY, changeText, {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: '#888888',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0, 0.5);
            }
        });
    }

    /**
     * Animate rating change number floating upward
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} change - Rating change amount
     */
    animateRatingChange(x, y, change) {
        const color = change >= 0 ? '#00FF00' : '#FF4444';
        const sign = change >= 0 ? '+' : '';

        const floatingText = this.add.text(x, y, `${sign}${change}`, {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Float upward and fade out
        this.tweens.add({
            targets: floatingText,
            y: y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                floatingText.destroy();
            }
        });

        // Slight scale pulse
        this.tweens.add({
            targets: floatingText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            yoyo: true,
            ease: 'Cubic.easeOut'
        });
    }

    /**
     * Create Play Again button
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createPlayAgainButton(x, y) {
        // Button background
        const buttonWidth = 200;
        const buttonHeight = 50;

        const button = this.add.graphics();
        button.fillStyle(0x27AE60, 1);
        button.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        button.lineStyle(3, 0xFFFFFF, 1);
        button.strokeRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);

        // Button text (changes based on mode)
        const buttonLabel = this.socket ? 'Return to Lobby' : 'Play Again';
        const buttonText = this.add.text(x, y, buttonLabel, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Make button interactive
        const hitArea = new Phaser.Geom.Rectangle(
            x - buttonWidth / 2,
            y - buttonHeight / 2,
            buttonWidth,
            buttonHeight
        );

        button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        buttonText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Hover effect
        button.on('pointerover', () => {
            button.clear();
            button.fillStyle(0x2ECC71, 1);
            button.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
            button.lineStyle(3, 0xFFFF00, 1);
            button.strokeRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });

        button.on('pointerout', () => {
            button.clear();
            button.fillStyle(0x27AE60, 1);
            button.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
            button.lineStyle(3, 0xFFFFFF, 1);
            button.strokeRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        });

        // Click handler
        button.on('pointerdown', () => {
            this.restartGame();
        });

        buttonText.on('pointerdown', () => {
            this.restartGame();
        });
    }

    /**
     * Create celebration particles
     */
    createCelebrationParticles() {
        // Create confetti particles falling from top
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(-100, 0);

            const particle = this.add.graphics();
            const color = Phaser.Math.RND.pick([0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF]);

            particle.fillStyle(color, 1);
            particle.fillRect(x, y, 5, 10);

            // Animate falling
            this.tweens.add({
                targets: particle,
                y: 650,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Linear',
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(0, 800);
                    particle.y = -10;
                }
            });

            // Add rotation
            this.tweens.add({
                targets: particle,
                angle: 360,
                duration: Phaser.Math.Between(1000, 2000),
                ease: 'Linear',
                repeat: -1
            });
        }
    }

    /**
     * Restart the game / Return to lobby
     */
    restartGame() {
        console.log('Returning to lobby...');

        // Stop this scene
        this.scene.stop('VictoryScene');

        // If socket exists, return to lobby (multiplayer)
        // Otherwise, restart game (local mode)
        if (this.socket) {
            this.scene.start('LobbyScene', {
                socket: this.socket,
                playerName: this.playerName,
                userId: this.userId
            });
        } else {
            // Local mode - restart game
            this.scene.start('GameScene');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VictoryScene;
}
