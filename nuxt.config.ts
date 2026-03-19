import {defineNuxtConfig} from "nuxt/config";

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    srcDir: 'app/',
    css: ['~/css/global.css'],

    app: {
        head: {
            title: 'Module Progress',
            meta: [{charset: 'utf-8'}, {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
        },
    },

    nitro: {
        // node:sqlite needs the experimental flag in Node 22; Node 24+ it's stable.
        // The flag is passed via NODE_OPTIONS in package.json scripts and Dockerfile.
    },
})
