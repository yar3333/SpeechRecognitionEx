import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            formats: ['es'],
            //fileName: () => `index.js`
        },
        minify: false,
        rollupOptions: {
            // External packages that should not be bundled into your library.
            // external: ['react', 'react-dom', 'react/jsx-runtime']
            external: [
                './index.js',
                '../../../../script.js',
                '../../../extensions.js',
            ]
            //external: Object.keys((pkg as any).dependencies || {})
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})