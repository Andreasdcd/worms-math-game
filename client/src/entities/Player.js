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

        // Matter.js circle body
        this.body = scene.matter.add.circle(x, y, this.radius, {
            friction: GAME_CONFIG.GROUND_FRICTION || 0.5,
            frictionAir: 0.01,
            restitution: GAME_CONFIG.WORM_BOUNCE || 0.1,
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
        this.nameText.setPosition(pos.x, pos.y - this.radius - 22);
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
     * Destroy all resources
     */
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.hpBarGraphics) this.hpBarGraphics.destroy();
        if (this.nameText) this.nameText.destroy();
        try { this.scene.matter.world.remove(this.body); } catch (_) {}
    }
}

export default Player;
