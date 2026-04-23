/**
 * Player Entity
 * Represents a single worm in the game with physics body, HP, and team affiliation
 */

class Player {
    /**
     * Create a new player/worm
     * @param {Phaser.Scene} scene - The scene this player belongs to
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {object} config - Player configuration
     */
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.username = config.username || 'Guest';
        this.assignedName = config.assignedName || 'Raket-Robot';
        this.teamId = config.teamId || 1;
        this.teamColor = window.GAME_CONSTANTS.TEAM_COLORS[this.teamId] || '#FF0000';
        this.hp = window.GAME_CONSTANTS.GAME_CONFIG.INITIAL_HP;
        this.maxHp = window.GAME_CONSTANTS.GAME_CONFIG.MAX_HP;
        this.isDead = false;
        this.radius = 15;

        // Create Matter.js physics body (circle)
        this.body = scene.matter.add.circle(x, y, this.radius, {
            friction: window.GAME_CONSTANTS.GAME_CONFIG.GROUND_FRICTION,
            frictionAir: 0.01,
            restitution: window.GAME_CONSTANTS.GAME_CONFIG.WORM_BOUNCE,
            density: 0.001
        });

        // Store reference to this player in the body for collision detection
        this.body.gameObject = this;

        // Graphics for rendering
        this.graphics = scene.add.graphics();
        this.hpBarGraphics = scene.add.graphics();
        this.nameText = scene.add.text(0, 0, this.assignedName, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Movement state
        this.moveSpeed = 3;
        this.isActive = false;

        // Aim state (for visual feedback)
        this.aimAngle = 0;

        // Fall damage tracking
        this.previousY = y;
        this.isFalling = false;
        this.fallVelocity = 0;
    }

    /**
     * Update player position and rendering
     * @param {object} cursors - Keyboard cursor keys
     * @param {boolean} isActiveTurn - Whether this is the active player
     */
    update(cursors, isActiveTurn) {
        this.isActive = isActiveTurn;

        // Handle movement only for active player
        if (isActiveTurn && !this.isDead) {
            if (cursors.left.isDown) {
                this.body.setVelocityX(-this.moveSpeed);
            } else if (cursors.right.isDown) {
                this.body.setVelocityX(this.moveSpeed);
            }
        }

        // Check for fall damage
        this.checkFallDamage();

        // Update rendering
        this.render();
    }

    /**
     * Check for fall damage based on velocity
     */
    checkFallDamage() {
        const currentY = this.body.position.y;
        const velocityY = this.body.velocity.y;

        // Check if falling (moving downward)
        if (velocityY > 5) {
            this.isFalling = true;
            this.fallVelocity = Math.max(this.fallVelocity, velocityY);
        } else if (this.isFalling && Math.abs(velocityY) < 2) {
            // Just landed
            this.handleLanding();
        }

        this.previousY = currentY;
    }

    /**
     * Handle landing and apply fall damage if necessary
     */
    handleLanding() {
        const fallDamageThreshold = 10;
        const maxFallDamage = 20;

        if (this.fallVelocity > fallDamageThreshold) {
            // Calculate fall damage based on velocity
            const damagePercent = Math.min(1, (this.fallVelocity - fallDamageThreshold) / 20);
            const damage = Math.floor(damagePercent * maxFallDamage);

            if (damage > 0) {
                console.log(`${this.assignedName} took ${damage} fall damage (velocity: ${this.fallVelocity.toFixed(1)})`);
                this.takeDamage(damage);
            }
        }

        // Reset fall state
        this.isFalling = false;
        this.fallVelocity = 0;
    }

    /**
     * Render the player, HP bar, and name
     */
    render() {
        const pos = this.body.position;

        // Clear previous graphics
        this.graphics.clear();
        this.hpBarGraphics.clear();

        // Draw player circle
        this.graphics.fillStyle(parseInt(this.teamColor.replace('#', '0x')), 1);
        this.graphics.fillCircle(pos.x, pos.y, this.radius);

        // Add outline for active player
        if (this.isActive) {
            this.graphics.lineStyle(3, 0xFFFFFF, 1);
            this.graphics.strokeCircle(pos.x, pos.y, this.radius);
        } else {
            this.graphics.lineStyle(2, 0x000000, 1);
            this.graphics.strokeCircle(pos.x, pos.y, this.radius);
        }

        // Draw HP bar above player
        const barWidth = 40;
        const barHeight = 5;
        const barX = pos.x - barWidth / 2;
        const barY = pos.y - this.radius - 15;

        // Background (black)
        this.hpBarGraphics.fillStyle(0x000000, 1);
        this.hpBarGraphics.fillRect(barX, barY, barWidth, barHeight);

        // HP fill (green to red gradient based on HP)
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? 0x00FF00 : (hpPercent > 0.25 ? 0xFFFF00 : 0xFF0000);
        this.hpBarGraphics.fillStyle(hpColor, 1);
        this.hpBarGraphics.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        this.hpBarGraphics.lineStyle(1, 0xFFFFFF, 1);
        this.hpBarGraphics.strokeRect(barX, barY, barWidth, barHeight);

        // Update name text position
        this.nameText.setPosition(pos.x, barY - 10);
    }

    /**
     * Apply damage to the player
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.die();
        }
    }

    /**
     * Handle player death
     */
    die() {
        this.isDead = true;
        this.graphics.setAlpha(0.3);
        this.hpBarGraphics.setAlpha(0.3);
        this.nameText.setAlpha(0.3);
    }

    /**
     * Get player position
     * @returns {object} Position {x, y}
     */
    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y
        };
    }

    /**
     * Set aim angle (for visual feedback)
     * @param {number} angle - Angle in radians
     */
    setAimAngle(angle) {
        this.aimAngle = angle;
    }

    /**
     * Destroy the player and clean up resources
     */
    destroy() {
        this.graphics.destroy();
        this.hpBarGraphics.destroy();
        this.nameText.destroy();
        this.scene.matter.world.remove(this.body);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
