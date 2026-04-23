/**
 * Terrain Entity
 * Creates and manages static platforms using Matter.js
 */

class Terrain {
    /**
     * Create terrain for the game world
     * @param {Phaser.Scene} scene - The scene this terrain belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.graphics = scene.add.graphics();
        this.terrainColor = 0x8B4513; // Brown color

        this.createPlatforms();
    }

    /**
     * Create the platform layout
     */
    createPlatforms() {
        const worldWidth = window.GAME_CONSTANTS.GAME_CONFIG.WORLD_WIDTH;
        const worldHeight = window.GAME_CONSTANTS.GAME_CONFIG.WORLD_HEIGHT;

        // Platform configuration: [x, y, width, height]
        const platformConfigs = [
            // Ground platform (bottom)
            [worldWidth / 2, worldHeight - 20, worldWidth, 40],

            // Left platform (low)
            [150, worldHeight - 120, 200, 30],

            // Center platform (medium height)
            [worldWidth / 2, worldHeight - 220, 180, 30],

            // Right platform (medium height)
            [650, worldHeight - 140, 160, 30],

            // Top left platform (high)
            [200, worldHeight - 340, 140, 30]
        ];

        // Create each platform as a static Matter.js rectangle
        platformConfigs.forEach(([x, y, width, height]) => {
            const platform = this.scene.matter.add.rectangle(x, y, width, height, {
                isStatic: true,
                friction: 0.8,
                restitution: 0
            });

            // Store platform data
            this.platforms.push({
                body: platform,
                x: x,
                y: y,
                width: width,
                height: height
            });
        });

        // Render the platforms
        this.render();
    }

    /**
     * Render all platforms
     */
    render() {
        this.graphics.clear();

        // Draw each platform
        this.platforms.forEach(platform => {
            // Fill
            this.graphics.fillStyle(this.terrainColor, 1);
            this.graphics.fillRect(
                platform.x - platform.width / 2,
                platform.y - platform.height / 2,
                platform.width,
                platform.height
            );

            // Border
            this.graphics.lineStyle(2, 0x000000, 1);
            this.graphics.strokeRect(
                platform.x - platform.width / 2,
                platform.y - platform.height / 2,
                platform.width,
                platform.height
            );
        });
    }

    /**
     * Get all platform bodies
     * @returns {Array} Array of Matter.js bodies
     */
    getPlatforms() {
        return this.platforms.map(p => p.body);
    }

    /**
     * Clean up terrain
     */
    destroy() {
        this.graphics.destroy();
        this.platforms.forEach(platform => {
            this.scene.matter.world.remove(platform.body);
        });
        this.platforms = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Terrain;
}
