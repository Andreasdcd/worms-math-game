import { GAME_CONFIG, TEAM_COLORS } from '@shared/constants.js';

/**
 * Player Entity
 * Matter circle body + worm sprite + HP bar
 */

class Player {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {object} config - { username, assignedName, teamId }
     */
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.username = config.username || 'Guest';
        this.assignedName = config.assignedName || 'Raket-Robot';
        this.teamId = config.teamId || 1;
        this.teamColor = TEAM_COLORS[this.teamId] || '#FF0000';
        this.hp = GAME_CONFIG.INITIAL_HP;
        this.maxHp = GAME_CONFIG.MAX_HP || GAME_CONFIG.INITIAL_HP;
        this.isDead = false;
        this.radius = 18;
        this.facing = 1; // 1 = right, -1 = left

        // Movement budget — 10 steps per turn, 1 step = 30px of horizontal travel
        this.maxSteps = 10;
        this.stepsRemaining = 10;
        this.pixelsPerStep = 30;
        this._moveAccum = 0;

        // Matter.js circle body — high friction to prevent excessive sliding
        this.body = scene.matter.add.circle(x, y, this.radius, {
            friction: 0.9,
            frictionStatic: 1.2,
            frictionAir: 0.06,
            restitution: 0,
            density: 0.002,
            label: 'player'
        });
        this.body.ownerRef = this;

        // Sprite: use loaded SVG texture if available, otherwise draw a circle
        const textureKey = `worm_${this.teamId}`;
        if (scene.textures.exists(textureKey)) {
            this.sprite = scene.add.image(x, y, textureKey).setDepth(5);
            this.sprite.setDisplaySize(this.radius * 2 + 4, this.radius * 2 + 4);
        } else {
            // Fallback: colored circle graphic as a RenderTexture turned into sprite
            const rt = scene.add.renderTexture(0, 0, this.radius * 2 + 4, this.radius * 2 + 4);
            const g = scene.add.graphics();
            g.fillStyle(parseInt(this.teamColor.replace('#', '0x')), 1);
            g.fillCircle(this.radius + 2, this.radius + 2, this.radius);
            rt.draw(g, 0, 0);
            g.destroy();
            this.sprite = scene.add.image(x, y, rt.texture.key).setDepth(5);
        }

        // HP bar graphics
        this.hpBarGraphics = scene.add.graphics().setDepth(6);
        // Movement bar graphics (below HP bar)
        this.movementBarGraphics = scene.add.graphics().setDepth(6);

        // Name label
        this.nameText = scene.add.text(x, y, this.assignedName, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(7);
    }

    /**
     * Update — sync sprite position to physics body
     */
    update() {
        if (this.isDead) return;
        const pos = this.body.position;

        this.sprite.setPosition(pos.x, pos.y);

        this._renderHpBar(pos);
        this._renderMovementBar(pos);
        this.nameText.setPosition(pos.x, pos.y - this.radius - 26);
    }

    _renderHpBar(pos) {
        this.hpBarGraphics.clear();
        const bw = 40, bh = 5;
        const bx = pos.x - bw / 2;
        const by = pos.y - this.radius - 14;

        // Background
        this.hpBarGraphics.fillStyle(0x222222, 1);
        this.hpBarGraphics.fillRect(bx, by, bw, bh);

        // Fill
        const pct = this.hp / this.maxHp;
        const col = pct > 0.5 ? 0x00CC44 : (pct > 0.25 ? 0xFFCC00 : 0xFF3300);
        this.hpBarGraphics.fillStyle(col, 1);
        this.hpBarGraphics.fillRect(bx, by, bw * pct, bh);

        // Border
        this.hpBarGraphics.lineStyle(1, 0xFFFFFF, 0.8);
        this.hpBarGraphics.strokeRect(bx, by, bw, bh);
    }

    _renderMovementBar(pos) {
        this.movementBarGraphics.clear();
        const bw = 40, bh = 3;
        const bx = pos.x - bw / 2;
        const by = pos.y - this.radius - 7;

        this.movementBarGraphics.fillStyle(0x222222, 1);
        this.movementBarGraphics.fillRect(bx, by, bw, bh);

        const pct = Math.max(0, this.stepsRemaining / this.maxSteps);
        this.movementBarGraphics.fillStyle(0x00BFFF, 1);
        this.movementBarGraphics.fillRect(bx, by, bw * pct, bh);

        this.movementBarGraphics.lineStyle(1, 0xFFFFFF, 0.5);
        this.movementBarGraphics.strokeRect(bx, by, bw, bh);
    }

    /**
     * Consume movement budget based on pixels moved this frame.
     * Returns true if movement happened; caller should not drive velocity when false.
     */
    consumeMovement(pixelsMoved) {
        if (this.stepsRemaining <= 0) return false;
        this._moveAccum += Math.abs(pixelsMoved);
        while (this._moveAccum >= this.pixelsPerStep && this.stepsRemaining > 0) {
            this._moveAccum -= this.pixelsPerStep;
            this.stepsRemaining -= 1;
        }
        return true;
    }

    hasMovementLeft() {
        return this.stepsRemaining > 0;
    }

    resetMovement() {
        this.stepsRemaining = this.maxSteps;
        this._moveAccum = 0;
    }

    /**
     * Apply damage
     * @param {number} amount
     */
    takeDamage(amount) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) this.die();
    }

    /**
     * @returns {boolean}
     */
    isAlive() {
        return !this.isDead;
    }

    /**
     * Kill this worm
     */
    die() {
        this.isDead = true;
        this.hp = 0;
        this.sprite.setAlpha(0.3);
        this.hpBarGraphics.clear();
        this.movementBarGraphics.clear();
        this.nameText.setAlpha(0.4);

        // Flash red then fade
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 600,
            delay: 200
        });
    }

    /**
     * Get center position from physics body
     * @returns {{ x: number, y: number }}
     */
    getPosition() {
        return { x: this.body.position.x, y: this.body.position.y };
    }

    /**
     * Set which direction the worm is facing (1 = right, -1 = left)
     */
    setFacing(dir) {
        if (dir !== 1 && dir !== -1) return;
        if (this.facing === dir) return;
        this.facing = dir;
        if (this.sprite) this.sprite.setFlipX(dir === -1);
    }

    /**
     * Destroy all resources
     */
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.hpBarGraphics) this.hpBarGraphics.destroy();
        if (this.movementBarGraphics) this.movementBarGraphics.destroy();
        if (this.nameText) this.nameText.destroy();
        try { this.scene.matter.world.remove(this.body); } catch (_) {}
    }
}

export default Player;
