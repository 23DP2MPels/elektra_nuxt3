<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath()
const { locales, locale } = useI18n()
const selectedLanguageCookie = useCookie('i18n_redirected')

const currentLocaleName = computed(() => {
  const current = locales.value.find(l => l.code === locale.value)
  return current?.name || 'English'
})

function selectLanguage(code: string) {
  localStorage.setItem('selected_language', code)
  selectedLanguageCookie.value = code
}

// Load saved language from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem('selected_language')
  if (saved && locales.value.some(l => l.code === saved)) {
    locale.value = saved
  }
})
</script>

<template>
  <VApp>
    <div class="language-switcher">
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            color="primary"
            v-bind="props"
            variant="outlined"
            prepend-icon="mdi-translate"
          >
            {{ currentLocaleName }}
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="lang in locales"
            :key="lang.code"
            :to="switchLocalePath(lang.code)"
            @click="selectLanguage(lang.code)"
          >
            <v-list-item-title>{{ lang.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <NuxtRouteAnnouncer />
    <VMain>
      <NuxtPage />
    </VMain>
  </VApp>
</template>

<style global>
:root {
  color-scheme: light;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  color: #111827;
}

* {
  box-sizing: border-box;
}

html, body, #__nuxt {
  min-height: 100%;
}

body {
  margin: 0;
  padding: 0;
  background: #f8fafc;
  color: #111827;
}

.v-btn_prepend {
  margin-inline: 0
}

.language-switcher {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1000;
}

.lang-link {
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  color: #111827;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s ease;
}

.lang-link:hover {
  background: #f8fafc;
}

main {
  width: 100%;
  margin: 0;
  padding: 2.5rem 1.5rem 3rem;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', sans-serif;
  color: #111827;
  margin: 0;
}

a {
  color: #1f2937;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button, input, select, textarea {
  font: inherit;
}

button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  cursor: pointer;
}

input, select, textarea {
  border: 1px solid #d1d5db;
}

ul {
  padding-left: 1.25rem;
}

p {
  line-height: 1.75;
}
</style>
