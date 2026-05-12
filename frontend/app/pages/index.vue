<template>
  <main>
    <div class="hero">
      <h1>{{ $t('catalog.title') }}</h1>
      <p>{{ $t('catalog.subtitle') }}</p>
    </div>

    <div class="nav-links">
      <NuxtLink to="/search" class="nav-link">{{ $t('catalog.search') }}</NuxtLink>
      <NuxtLink to="/account" class="nav-link">{{ $t('catalog.account') }}</NuxtLink>
    </div>

    <div v-if="loading" class="loading">{{ $t('catalog.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="categories-grid">
      <div v-for="c in categories" :key="c.category_slug" class="category-card">
        <NuxtLink :to="`/c/${c.category_slug}`" class="category-link">
          <h3>{{ c.category_name }}</h3>
          <p class="category-count">{{ c.productCount }} {{ $t('catalog.products') }}</p>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const categories = ref<Array<{ category_slug: string; category_name: string; productCount: number }>>([])
const loading = ref(true)
const error = ref('')

try {
  const { data } = await useFetch('/api/catalog/categories')
  categories.value = data.value ?? []
} catch (err: any) {
  error.value = String(err?.message || err?.statusMessage || 'Failed to load categories')
} finally {
  loading.value = false
}
</script>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem 0 2rem;
}

.hero h1 {
  font-size: clamp(2.2rem, 4vw, 3rem);
  margin-bottom: 0.5rem;
  color: #111827;
}

.hero p {
  font-size: 1.05rem;
  color: #475569;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.4rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.85rem;
  color: #111827;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.category-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.category-link {
  display: block;
  padding: 1.75rem;
  text-decoration: none;
  color: inherit;
}

.category-link h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.35rem;
}

.category-count {
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #475569;
}

.error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.85rem;
  padding: 1rem;
  text-align: center;
}
</style>

