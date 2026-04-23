import { GAME_CONFIG } from '@shared/constants.js';

/**
 * Terrain Entity
 * Static ground + floating platforms drawn as brown rectangles
 */

class Terrain {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.graphics = scene.add.graphics().setDepth(1);

        this._build();
    }

    _build() {
        const W = GAME_CONFIG.WORLD_WIDTH;
        const H = GAME_CONFIG.WORLD_HEIGHT;

        // [centerX, centerY, width, height]
        const configs = [
            // Ground (full-width)
            [W / 2,       H - 20,  W,   40],
            // Left low platform
            [150,         H - 120, 200, 20],
            // Center mid platform
            [W / 2,       H - 220, 180, 20],
            // Right mid platform
            [650,         H - 140, 160, 20],
            // Top-left high platform
            [200,         H - 340, 140, 20],
            // Right high
            [620,         H - 280, 120, 20]
        ];

        configs.forEach(([cx, cy, w, h]) => {
            const body = this.scene.matter.add.rectangle(cx, cy, w, h, {
                isStatic: true,
                friction: 0.8,
                restitution: 0,
                label: 'terrain'
            });
            this.platforms.push({ body, cx, cy, w, h });
        });

        this._draw();
    }

    _draw() {
        this.graphics.clear();

        this.platforms.forEach(({ cx, cy, w, h }) => {
            const x = cx - w / 2;
            const y = cy - h / 2;

            // Dirt fill
            this.graphics.fillStyle(0x8B4513, 1);
            this.graphics.fillRect(x, y, w, h);

            // Grass top strip
            this.graphics.fillStyle(0x4CAF50, 1);
            this.graphics.fillRect(x, y, w, 5);

            // Dark border
            this.graphics.lineStyle(2, 0x3D1A00, 1);
            this.graphics.strokeRect(x, y, w, h);
        });
    }

    /**
     * Get approximate ground Y for a given X (used for spawn placement)
     * @param {number} x
     * @returns {number}
     */
    getHeightAt(x) {
        // Return top of ground platform
        const ground = this.platforms[0];
        return ground ? ground.cy - ground.h / 2 : GAME_CONFIG.WORLD_HEIGHT - 40;
    }

    getPlatforms() {
        return this.platforms.map(p => p.body);
    }

    destroy() {
        this.graphics.destroy();
        this.platforms.forEach(p => {
            try { this.scene.matter.world.remove(p.body); } catch (_) {}
        });
        this.platforms = [];
    }
}

export default Terrain;
