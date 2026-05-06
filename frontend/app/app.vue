<script setup lang="ts">
const counter = ref(0) // executes in server and client environments

const handleClick = () => {
  counter.value++ // executes only in a client environment
}
</script>

<template>
  <VApp>
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
  background: #eef4fb;
  color: #111827;
}

html, body, #__nuxt {
  min-height: 100%;
}

body {
  margin: 0;
  padding: 0;
  background: linear-gradient(180deg, #f7faff 0%, #eef4fb 45%, #dde8f6 100%);
  color: #111827;
}

main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}

h1, h2, h3 {
  font-family: 'Inter', sans-serif;
  color: #1f2a43;
}

a {
  color: #2550b5;
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
  border: 1px solid #cbd5e1;
}

ul {
  padding-left: 1.25rem;
}

p {
  line-height: 1.75;
}
</style>
