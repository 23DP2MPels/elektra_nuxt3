<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
    </p>

    <h1 v-if="category">
      {{ category.name }}
    </h1>

    <template v-if="category">
      <h2>Sub-categories</h2>
      <ul>
        <li v-for="s in category.subcategories" :key="s.slug">
          <NuxtLink :to="`/c/${category.slug}/${s.slug}`">
            {{ s.name }}
          </NuxtLink>
        </li>
      </ul>
    </template>

    <template v-else>
      <h1>Category not found</h1>
      <p>Unknown category: {{ categorySlug }}</p>
    </template>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => String(route.params.category || ''))
const { getCategory } = useCatalog()

const category = computed(() => getCategory(categorySlug.value))
</script>

