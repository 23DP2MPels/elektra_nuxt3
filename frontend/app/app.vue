<script setup lang="ts">
const switchLocalePath = useSwitchLocalePath()
const { locales } = useI18n()
</script>

<template>
  <VApp>
    <div class="language-switcher">
      <NuxtLink v-for="locale in locales" :key="locale.code" :to="switchLocalePath(locale.code)" class="lang-link">
        {{ locale.name }}
      </NuxtLink>
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
  border-radius: 0.5rem;
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
  border-radius: 0.75rem;
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
