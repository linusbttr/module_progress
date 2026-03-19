export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    srcDir: 'app/',
    serverDir: 'server/',

    css: ['~/css/global.css'],

    app: {
        head: {
            title: 'Module Progress',
            meta: [{charset: 'utf-8'}, {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
        },
    },

    typescript: {
        // Verhindert dass Vite tsconfig.app.json liest bevor Nuxt es generiert hat
        typeCheck: false,
    },

    nitro: {},
})
