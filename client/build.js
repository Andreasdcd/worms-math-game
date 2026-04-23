/**
 * Build script for GitHub Pages deployment
 * Copies all necessary files to dist/ folder
 */

const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building for production...');

// Copy index.html
console.log('Copying index.html...');
fs.copyFileSync(
    path.join(__dirname, 'index.html'),
    path.join(distDir, 'index.html')
);

// Copy src directory recursively
console.log('Copying src/...');
const srcDir = path.join(__dirname, 'src');
const distSrcDir = path.join(distDir, 'src');
copyRecursive(srcDir, distSrcDir);

// Copy assets directory if it exists
const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
    console.log('Copying assets/...');
    const distAssetsDir = path.join(distDir, 'assets');
    copyRecursive(assetsDir, distAssetsDir);
}

// Copy node_modules/phaser and socket.io-client
console.log('Copying dependencies...');
const nodeModulesDir = path.join(__dirname, 'node_modules');
const distNodeModulesDir = path.join(distDir, 'node_modules');

if (!fs.existsSync(distNodeModulesDir)) {
    fs.mkdirSync(distNodeModulesDir);
}

// Copy phaser
const phaserSrc = path.join(nodeModulesDir, 'phaser');
const phaserDest = path.join(distNodeModulesDir, 'phaser');
if (fs.existsSync(phaserSrc)) {
    copyRecursive(phaserSrc, phaserDest);
}

// Copy socket.io-client
const socketSrc = path.join(nodeModulesDir, 'socket.io-client');
const socketDest = path.join(distNodeModulesDir, 'socket.io-client');
if (fs.existsSync(socketSrc)) {
    copyRecursive(socketSrc, socketDest);
}

// Copy .nojekyll
fs.copyFileSync(
    path.join(__dirname, '.nojekyll'),
    path.join(distDir, '.nojekyll')
);

console.log('✓ Build complete! Output: dist/');

/**
 * Copy directory recursively
 */
function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
