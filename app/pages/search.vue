<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
    </p>

    <h1>Search</h1>

    <form @submit.prevent="applySearch">
      <input v-model="q" type="search" placeholder="Search products..." />
      <button type="submit">Search</button>
    </form>

    <p v-if="query">
      Results for: <strong>{{ query }}</strong> ({{ results.length }})
    </p>
    <p v-else>
      Type something to search.
    </p>

    <ul v-if="results.length">
      <li v-for="r in results" :key="r.product.id">
        <NuxtLink :to="`/p/${r.product.id}`">{{ r.product.name }}</NuxtLink>
        <span> — </span>
        <NuxtLink :to="`/c/${r.category.slug}`">{{ r.category.name }}</NuxtLink>
        <span> / </span>
        <NuxtLink :to="`/c/${r.category.slug}/${r.subcategory.slug}`">{{ r.subcategory.name }}</NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q || ''))
const query = computed(() => String(route.query.q || '').trim())

const { searchProducts } = useCatalog()
const results = computed(() => (query.value ? searchProducts(query.value) : []))

function applySearch() {
  router.push({ path: '/search', query: q.value.trim() ? { q: q.value.trim() } : {} })
}
</script>

