import Phaser from 'phaser';
import { GAME_CONFIG } from '@shared/constants.js';

/**
 * Explosion Entity
 * Visual effect and damage application for explosions
 */

class Explosion {
    /**
     * Create a new explosion
     * @param {Phaser.Scene} scene - The scene this explosion belongs to
     * @param {number} x - Explosion center x
     * @param {number} y - Explosion center y
     * @param {number} damage - Base damage amount
     * @param {number} radius - Explosion radius (defaults to config)
     */
    constructor(scene, x, y, damage, radius = null) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.radius = radius || GAME_CONFIG.EXPLOSION_RADIUS;
        this.maxRadius = this.radius;
        this.currentRadius = 0;
        this.lifetime = 0;
        this.duration = 1.0; // 1 second animation
        this.isComplete = false;

        // Graphics for rendering
        this.graphics = scene.add.graphics();

        // Particle system
        this.particles = [];
        this.createParticles();

        // Apply damage immediately upon creation
        this.applyDamage();
    }

    /**
     * Create explosion particles
     */
    createParticles() {
        const particleCount = Phaser.Math.Between(20, 30);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Phaser.Math.FloatBetween(-0.2, 0.2);
            const speed = Phaser.Math.FloatBetween(2, 5);
            const size = Phaser.Math.FloatBetween(3, 8);

            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: 1.0,
                decay: Phaser.Math.FloatBetween(0.8, 1.2)
            });
        }
    }

    /**
     * Apply damage to all players in radius
     */
    applyDamage() {
        if (!this.scene.players) return;

        this.scene.players.forEach(player => {
            if (player.isDead) return;

            const playerPos = player.getPosition();
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                playerPos.x, playerPos.y
            );

            // Check if player is within damage radius
            if (distance <= this.maxRadius) {
                // Calculate damage with linear falloff
                const damageFalloff = 1 - (distance / this.maxRadius);
                const actualDamage = Math.floor(this.damage * damageFalloff);

                // Apply damage
                if (actualDamage > 0) {
                    player.takeDamage(actualDamage);

                    // Visual feedback: Flash player red
                    this.flashPlayer(player);

                    // Apply knockback force
                    this.applyKnockback(player, distance);

                    console.log(`${player.assignedName} took ${actualDamage} damage (${Math.floor(damageFalloff * 100)}%)`);
                }
            }
        });

        // Update HUD to reflect damage
        if (this.scene.updateHUD) {
            this.scene.updateHUD();
        }
    }

    /**
     * Flash player red when damaged
     * @param {Player} player - Player to flash
     */
    flashPlayer(player) {
        // Store original alpha
        const originalAlpha = player.graphics.alpha;

        // Flash sequence
        this.scene.tweens.add({
            targets: player.graphics,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                player.graphics.setAlpha(originalAlpha);
            }
        });

        // Tint the player red briefly
        const originalTint = player.graphics.fillColor;
        player.graphics.clear();
        player.graphics.fillStyle(0xFF0000, 1);

        this.scene.time.delayedCall(300, () => {
            player.render(); // Re-render with original color
        });
    }

    /**
     * Apply knockback force to player
     * @param {Player} player - Player to knock back
     * @param {number} distance - Distance from explosion center
     */
    applyKnockback(player, distance) {
        if (!player.body) return;

        const playerPos = player.getPosition();
        const angle = Math.atan2(playerPos.y - this.y, playerPos.x - this.x);

        // Knockback strength inversely proportional to distance
        const knockbackStrength = (1 - distance / this.maxRadius) * 15;

        const knockbackX = Math.cos(angle) * knockbackStrength;
        const knockbackY = Math.sin(angle) * knockbackStrength;

        // Apply impulse to player
        this.scene.matter.body.applyForce(player.body,
            { x: playerPos.x, y: playerPos.y },
            { x: knockbackX * 0.001, y: knockbackY * 0.001 }
        );
    }

    /**
     * Update explosion animation
     * @param {number} delta - Time since last frame (ms)
     */
    update(delta) {
        if (this.isComplete) return;

        // Update lifetime
        this.lifetime += delta / 1000; // Convert to seconds

        // Calculate animation progress (0 to 1)
        const progress = Math.min(1, this.lifetime / this.duration);

        // Expand then contract (ease out)
        if (progress < 0.4) {
            // Expand phase
            this.currentRadius = this.maxRadius * (progress / 0.4);
        } else {
            // Contract phase
            const contractProgress = (progress - 0.4) / 0.6;
            this.currentRadius = this.maxRadius * (1 - contractProgress);
        }

        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.life -= (delta / 1000) * particle.decay;
        });

        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);

        // Check if animation is complete
        if (progress >= 1) {
            this.isComplete = true;
            this.destroy();
            return;
        }

        // Render
        this.render();
    }

    /**
     * Render explosion effect
     */
    render() {
        if (this.isComplete) return;

        this.graphics.clear();

        const progress = this.lifetime / this.duration;
        const alpha = 1 - progress;

        // Draw expanding circle (orange to red gradient effect)
        if (this.currentRadius > 0) {
            // Outer ring (red)
            this.graphics.fillStyle(0xFF4500, alpha * 0.8);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius);

            // Inner ring (orange-yellow)
            this.graphics.fillStyle(0xFFAA00, alpha);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius * 0.7);

            // Core (bright yellow)
            this.graphics.fillStyle(0xFFFF00, alpha);
            this.graphics.fillCircle(this.x, this.y, this.currentRadius * 0.4);
        }

        // Draw particles
        this.particles.forEach(particle => {
            const particleAlpha = particle.life;
            const particleColor = particle.life > 0.5 ? 0xFF8800 : 0x884400;

            this.graphics.fillStyle(particleColor, particleAlpha);
            this.graphics.fillCircle(particle.x, particle.y, particle.size * particle.life);
        });
    }

    /**
     * Destroy explosion and clean up
     */
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        this.isComplete = true;
    }
}

export default Explosion;
