// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Fix noisy dev errors from source-map WASM ("unreachable")
  sourcemap: false,

  // Оставляем только модуль. Он сам подтянет стили и плагины Vite.
  modules: [
    'vuetify-nuxt-module'
  ],

  // Указываем серверный каталог отдельно, чтобы backend кода находился в backend/server.
  serverDir: '../backend/server',
  modulesDir: ['../node_modules'],

  // Настройки Vuetify (если понадобятся в будущем) пишутся здесь
  vuetify: {
    moduleOptions: {
      /* автоматический импорт стилей уже включен */
    },
    vuetifyOptions: {
      // Здесь можно будет настроить тему (темная/светлая)
    }
  }
})

