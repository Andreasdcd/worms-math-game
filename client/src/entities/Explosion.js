import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants.js';

/**
 * Explosion Entity
 * Visual flash + particle burst. Applies linear-falloff damage.
 */

class Explosion {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} baseDamage
     * @param {number} [radius]
     */
    constructor(scene, x, y, baseDamage, radius) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.baseDamage = baseDamage || GAME_CONFIG.PROJECTILE_DAMAGE_BASE;
        this.radius = radius || GAME_CONFIG.EXPLOSION_RADIUS;
        this.lifetime = 0;
        this.duration = 0.9; // seconds
        this.isComplete = false;
        this.currentRadius = 0;

        this.graphics = scene.add.graphics().setDepth(9);
        this.particles = [];
        this._spawnParticles();
    }

    // ───────────────── Damage ─────────────────

    /**
     * Apply linear-falloff damage to each player within radius.
     * @param {Player[]} players
     * @param {number} cx
     * @param {number} cy
     * @param {number} radius
     * @param {number} baseDamage
     */
    damageNearby(players, cx, cy, radius, baseDamage) {
        if (!players) return;
        players.forEach(player => {
            if (player.isDead) return;
            const pos = player.getPosition();
            const dist = Phaser.Math.Distance.Between(cx, cy, pos.x, pos.y);
            if (dist <= radius) {
                const falloff = 1 - (dist / radius);
                const dmg = Math.max(1, Math.floor(baseDamage * falloff));
                player.takeDamage(dmg);
                this._knockback(player, dist, cx, cy, radius);
                console.log(`${player.assignedName} tog ${dmg} skade (afstand ${dist.toFixed(0)}px)`);
            }
        });
    }

    _knockback(player, dist, cx, cy, radius) {
        const pos = player.getPosition();
        const angle = Math.atan2(pos.y - cy, pos.x - cx);
        const str = (1 - dist / radius) * 0.012;
        try {
            this.scene.matter.body.applyForce(
                player.body,
                { x: pos.x, y: pos.y },
                { x: Math.cos(angle) * str, y: Math.sin(angle) * str }
            );
        } catch (_) {}
    }

    // ───────────────── Particles ─────────────────

    _spawnParticles() {
        const count = Phaser.Math.Between(18, 28);
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i / count) + Phaser.Math.FloatBetween(-0.3, 0.3);
            const spd = Phaser.Math.FloatBetween(1.5, 5);
            this.particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                size: Phaser.Math.FloatBetween(3, 9),
                life: 1,
                decay: Phaser.Math.FloatBetween(0.7, 1.1)
            });
        }
    }

    // ───────────────── Update / Render ─────────────────

    update(delta) {
        if (this.isComplete) return;
        this.lifetime += delta / 1000;
        const t = Math.min(1, this.lifetime / this.duration);

        // Expand then contract
        this.currentRadius = t < 0.35
            ? this.radius * (t / 0.35)
            : this.radius * (1 - (t - 0.35) / 0.65);

        // Update particles
        const dt = delta / 1000;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // mini gravity
            p.life -= dt * p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        if (t >= 1) {
            this.isComplete = true;
            this.destroy();
            return;
        }

        this._render(t);
    }

    _render(t) {
        this.graphics.clear();
        const alpha = 1 - t;

        if (this.currentRadius > 0) {
            this.graphics.fillStyle(0xFF4500, alpha * 0.75);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius);

            this.graphics.fillStyle(0xFF9900, alpha);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius * 0.65);

            this.graphics.fillStyle(0xFFFF88, alpha);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius * 0.35);
        }

        this.particles.forEach(p => {
            const col = p.life > 0.5 ? 0xFF8800 : 0x663300;
            this.graphics.fillStyle(col, p.life);
            this.graphics.fillCircle(p.x, p.y, p.size * p.life);
        });
    }

    destroy() {
        this.isComplete = true;
        if (this.graphics) this.graphics.destroy();
    }
}

export default Explosion;
