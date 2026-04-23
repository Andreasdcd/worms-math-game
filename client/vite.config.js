import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/worms-math-game/' : '/',
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, '../shared')
        }
    },
    server: {
        port: 8080
    }
});
