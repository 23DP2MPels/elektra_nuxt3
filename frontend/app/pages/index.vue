<template>
  <main>
    <div class="hero">
      <h1>{{ $t('catalog.title') }}</h1>
      <p>{{ $t('catalog.subtitle') }}</p>
    </div>

    <div class="nav-links">
      <NuxtLink :to="localePath('/search')" class="nav-link">{{ $t('catalog.search') }}</NuxtLink>
      <NuxtLink :to="localePath('/account')" class="nav-link">{{ $t('catalog.account') }}</NuxtLink>
    </div>

    <div v-if="loading" class="loading">{{ $t('catalog.loading') }}</div>
    <div v-else-if="isNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <h2>{{ $t('networkError.title') }}</h2>
      <p>{{ $t('networkError.message') }}</p>
      <button @click="retryLoad" class="retry-btn">{{ $t('networkError.retry') }}</button>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="categories-grid">
      <div v-for="c in categories" :key="c.category_slug" class="category-card">
        <NuxtLink :to="localePath(`/c/${c.category_slug}`)" class="category-link">
          <h3>{{ localLabel(c.category_name) }}</h3>
          <p class="category-count">{{ c.productCount }} {{ $t('catalog.products') }}</p>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'

const localePath = useLocalePath()
const { locale } = useI18n()
const categories = ref<Array<{ category_slug: string; category_name: unknown; productCount: number }>>([])
const loading = ref(true)
const error = ref('')
const isNetworkError = ref(false)

const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

async function loadCategories() {
  loading.value = true
  error.value = ''
  isNetworkError.value = false
  try {
    const { data } = await useFetch('/api/catalog/categories')
    categories.value = data.value ?? []
  } catch (err: any) {
    const errorMessage = String(err?.message || err?.statusMessage || 'Failed to load categories')
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch') || !navigator.onLine) {
      isNetworkError.value = true
    } else {
      error.value = errorMessage
    }
  } finally {
    loading.value = false
  }
}

function retryLoad() {
  loadCategories()
}

// Initial load
loadCategories()
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
  transition: background 0.2s ease;
}

.category-card:hover {
  background: #f8fafc;
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
  padding: 1rem;
  text-align: center;
}

.network-error {
  text-align: center;
  padding: 3rem 2rem;
  background: #f8faff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  margin: 2rem auto;
  max-width: 500px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.network-error h2 {
  margin: 0 0 1rem 0;
  color: #1f2a43;
  font-size: 1.5rem;
}

.network-error p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.retry-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #2f5f9b;
  color: #fff;
  border: 1px solid #2f5f9b;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #1f4770;
}
</style>

