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
        },
        minify: false,
        rollupOptions: {
            external: [
                'jquery',
                './index.js',
                '../../../../../../script.js',
                '../../../../../extensions.js',
                '../../../../../utils.js',
                '../../../../../textgen-settings.js',
            ],
            input: {
                'speech-recognition-ex': './src/main.ts',
                'wave-worker': './src/wave-worker.ts',
            },
            output: {
                entryFileNames: _ => '[name].js'
            },
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        "process.env": {},
    },
})
