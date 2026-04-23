import { GAME_CONFIG } from '@shared/constants.js';

/**
 * Projectile Entity
 * Matter circle body affected by gravity, fired at angle+power.
 * powerFactor tuned so 100% power at 45° crosses most of the 800px world.
 */

const POWER_FACTOR = 0.5; // velocity = power * POWER_FACTOR

class Projectile {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - start x
     * @param {number} y - start y
     * @param {number} angle - radians (negative = upward in Phaser coords)
     * @param {number} power - 0..100
     */
    constructor(scene, x, y, angle, power) {
        this.scene = scene;
        this.angle = angle;
        this.power = power;
        this.damage = GAME_CONFIG.PROJECTILE_DAMAGE_BASE;
        this.radius = GAME_CONFIG.PROJECTILE_RADIUS || 6;
        this.isDestroyed = false;
        this.lifetime = 0;
        this.maxLifetime = 10;

        // Physics body
        this.body = scene.matter.add.circle(x, y, this.radius, {
            friction: 0,
            frictionAir: 0.0005,
            restitution: 0.1,
            density: 0.003,
            label: 'projectile',
            ignoreGravity: false
        });
        this.body.ownerRef = this;

        // Apply initial velocity
        // Phaser y-axis is inverted: negative y = upward
        const speed = power * POWER_FACTOR;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        scene.matter.body.setVelocity(this.body, { x: vx, y: vy });

        // Graphics
        this.graphics = scene.add.graphics().setDepth(8);
        this.trail = [];
        this.maxTrailLength = 12;
    }

    /**
     * @param {number} delta - ms since last frame
     */
    update(delta) {
        if (this.isDestroyed) return;

        this.lifetime += delta / 1000;
        if (this.lifetime > this.maxLifetime) {
            this.destroy();
            return;
        }

        const pos = this.body.position;
        this.trail.push({ x: pos.x, y: pos.y });
        if (this.trail.length > this.maxTrailLength) this.trail.shift();

        this._render();
    }

    _render() {
        if (this.isDestroyed) return;
        this.graphics.clear();

        // Trail
        this.trail.forEach((pt, i) => {
            const a = ((i + 1) / this.trail.length) * 0.5;
            this.graphics.fillStyle(0xFFAA00, a);
            this.graphics.fillCircle(pt.x, pt.y, this.radius * 0.5);
        });

        // Rocket body
        const pos = this.body.position;
        this.graphics.fillStyle(0xFF4400, 1);
        this.graphics.fillCircle(pos.x, pos.y, this.radius);
        this.graphics.lineStyle(2, 0xFFFFFF, 1);
        this.graphics.strokeCircle(pos.x, pos.y, this.radius);
    }

    getPosition() {
        return { x: this.body.position.x, y: this.body.position.y };
    }

    /**
     * Fire method — re-applies velocity (useful if projectile was repositioned)
     * @param {number} x
     * @param {number} y
     * @param {number} angle
     * @param {number} power
     */
    fire(x, y, angle, power) {
        this.scene.matter.body.setPosition(this.body, { x, y });
        const speed = power * POWER_FACTOR;
        this.scene.matter.body.setVelocity(this.body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.graphics.destroy();
        try { this.scene.matter.world.remove(this.body); } catch (_) {}
    }
}

export default Projectile;
