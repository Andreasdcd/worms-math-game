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

        const configs = [];

        // Ground — full-width base
        configs.push([W / 2, H - 30, W, 60]);

        // Scatter ~18 floating platforms procedurally across the map
        const numPlatforms = 18;
        for (let i = 0; i < numPlatforms; i++) {
            const col = i % 6;
            const row = Math.floor(i / 6);
            const cellW = W / 6;
            const cellH = (H - 200) / 3;
            // Slight jitter inside each grid cell
            const cx = (col + 0.5) * cellW + (Math.random() - 0.5) * (cellW * 0.4);
            const cy = 140 + row * cellH + (Math.random() - 0.5) * (cellH * 0.5);
            const w = 140 + Math.random() * 180;
            const h = 22;
            configs.push([cx, cy, w, h]);
        }

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
