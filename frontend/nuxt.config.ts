// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI, // Nuxt сам подтянет это из .env
  },

  // Fix noisy dev errors from source-map WASM ("unreachable")
  sourcemap: false,

  
  

  // Указываем серверный каталог отдельно, чтобы backend кода находился в backend/server.
  serverDir: '../backend/server',
  modulesDir: ['../node_modules', './node_modules'],
  // Оставляем только модуль. Он сам подтянет стили и плагины Vite.
  modules: ['vuetify-nuxt-module', '@nuxtjs/i18n'],

  // Настройки Vuetify (если понадобятся в будущем) пишутся здесь
  vuetify: {
    moduleOptions: {
      /* автоматический импорт стилей уже включен */
    },
    vuetifyOptions: {
      // Здесь можно будет настроить тему (темная/светлая)
    }
  },

  // Настройки i18n
  i18n: {
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', iso: 'en-US', file: 'en.json' },
      { code: 'ru', name: 'Русский', iso: 'ru-RU', file: 'ru.json' },
      { code: 'lv', name: 'Latviešu', iso: 'lv-LV', file: 'lv.json' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    },
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
})

