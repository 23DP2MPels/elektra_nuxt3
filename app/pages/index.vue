<template>
  <main>
    <h1>Catalog</h1>
    <p>Top categories (sub-categories are inside).</p>

    <p>
      <NuxtLink to="/search">Search</NuxtLink>
    </p>

    <ul>
      <li v-for="c in categories" :key="c.slug">
        <NuxtLink :to="`/c/${c.slug}`">
          {{ c.name }}
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
const { categories } = useCatalog()
</script>

