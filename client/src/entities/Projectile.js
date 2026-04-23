/**
 * Projectile Entity
 * Represents a fired projectile (bazooka rocket) with physics and trail effects
 */

class Projectile {
    /**
     * Create a new projectile
     * @param {Phaser.Scene} scene - The scene this projectile belongs to
     * @param {number} x - Starting x position
     * @param {number} y - Starting y position
     * @param {number} angle - Launch angle in radians
     * @param {number} power - Launch power (0-100)
     */
    constructor(scene, x, y, angle, power) {
        this.scene = scene;
        this.angle = angle;
        this.power = power;
        this.damage = window.GAME_CONSTANTS.GAME_CONFIG.PROJECTILE_DAMAGE_BASE;
        this.radius = window.GAME_CONSTANTS.GAME_CONFIG.PROJECTILE_RADIUS;
        this.isDestroyed = false;
        this.lifetime = 0;
        this.maxLifetime = 10; // 10 seconds max

        // Create Matter.js physics body (circle)
        this.body = scene.matter.add.circle(x, y, this.radius, {
            friction: 0,
            frictionAir: 0.01,
            restitution: 0.8,
            density: 0.002,
            label: 'projectile'
        });

        // Store reference to this projectile in the body for collision detection
        this.body.gameObject = this;

        // Calculate and apply initial velocity
        this.calculateTrajectory(angle, power);

        // Graphics for rendering
        this.graphics = scene.add.graphics();

        // Trail effect (particle-like trail)
        this.trail = [];
        this.maxTrailLength = 15;
    }

    /**
     * Calculate trajectory and apply velocity
     * @param {number} angle - Angle in radians
     * @param {number} power - Power (0-100)
     */
    calculateTrajectory(angle, power) {
        // Power 100 = velocity magnitude 20
        const maxVelocity = 20;
        const velocityMagnitude = (power / 100) * maxVelocity;

        // Convert angle and magnitude to velocity vector
        const velocityX = Math.cos(angle) * velocityMagnitude;
        const velocityY = Math.sin(angle) * velocityMagnitude;

        // Apply velocity to body
        this.scene.matter.body.setVelocity(this.body, {
            x: velocityX,
            y: velocityY
        });
    }

    /**
     * Update projectile (called each frame)
     * @param {number} delta - Time since last frame (ms)
     */
    update(delta) {
        if (this.isDestroyed) return;

        // Update lifetime
        this.lifetime += delta / 1000; // Convert ms to seconds

        // Auto-destroy if exceeded max lifetime
        if (this.lifetime > this.maxLifetime) {
            this.destroy();
            return;
        }

        // Add current position to trail
        this.trail.push({
            x: this.body.position.x,
            y: this.body.position.y
        });

        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Render
        this.render();
    }

    /**
     * Render the projectile and trail
     */
    render() {
        if (this.isDestroyed) return;

        this.graphics.clear();

        // Draw trail (white fading circles)
        this.trail.forEach((point, index) => {
            const alpha = (index + 1) / this.trail.length;
            const trailRadius = this.radius * 0.5 * alpha;
            this.graphics.fillStyle(0xFFFFFF, alpha * 0.6);
            this.graphics.fillCircle(point.x, point.y, trailRadius);
        });

        // Draw projectile body (red circle)
        const pos = this.body.position;
        this.graphics.fillStyle(0xFF0000, 1);
        this.graphics.fillCircle(pos.x, pos.y, this.radius);

        // Add white outline
        this.graphics.lineStyle(2, 0xFFFFFF, 1);
        this.graphics.strokeCircle(pos.x, pos.y, this.radius);
    }

    /**
     * Get projectile position
     * @returns {object} Position {x, y}
     */
    getPosition() {
        return {
            x: this.body.position.x,
            y: this.body.position.y
        };
    }

    /**
     * Destroy the projectile and clean up resources
     */
    destroy() {
        if (this.isDestroyed) return;

        this.isDestroyed = true;
        this.graphics.destroy();
        this.scene.matter.world.remove(this.body);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Projectile;
}
