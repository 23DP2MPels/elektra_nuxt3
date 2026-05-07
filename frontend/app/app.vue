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
