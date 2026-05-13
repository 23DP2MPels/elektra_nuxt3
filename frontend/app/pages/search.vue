<template>
  <main class="search-page">
    <!-- Navigation -->
    <nav class="nav-links">
      <NuxtLink :to="localePath('/')" class="nav-link">{{ $t('search.nav.home') }}</NuxtLink>
      <NuxtLink :to="localePath('/account')" class="nav-link secondary">{{ $t('search.nav.account') }}</NuxtLink>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">{{ $t('search.hero.title') }}</h1>
        <p class="hero-subtitle">{{ $t('search.hero.subtitle') }}</p>
      </div>
    </section>

    <!-- Search Form -->
    <section class="search-section">
      <div class="search-container">
        <form @submit.prevent="applySearch" class="search-form">
          <div class="search-input-group">
            <input
              v-model="q"
              type="search"
              :placeholder="$t('search.form.placeholder')"
              class="search-input"
            />
            <button type="submit" class="search-btn">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              {{ $t('search.form.button') }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- Results Section -->
    <section class="results-section">
      <div class="results-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ $t('search.loading') }}</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>{{ $t('search.error.title') }}</h3>
          <p>{{ error }}</p>
        </div>

        <div v-else-if="query" class="results-content">
          <div class="results-header">
            <h2>Результаты поиска</h2>
            <p class="results-count">
              Найдено товаров: <strong>{{ results.length }}</strong>
              <span v-if="query">по запросу "{{ query }}"</span>
            </p>
          </div>

          <div v-if="results.length" class="results-grid">
            <div v-for="result in results" :key="result.id" class="result-card">
              <div class="result-image-container">
                <img :src="getResultImage(result)" :alt="result.name" class="result-preview" @error="onImageError" />
              </div>
              <div class="result-content">
                <h3 class="result-title">
                  <NuxtLink :to="localePath(`/p/${result.id}`)">{{ result.name }}</NuxtLink>
                </h3>
                <div class="result-category">
                  <NuxtLink :to="localePath(`/c/${result.category_slug}`)" class="category-link">
                    {{ localLabel(result.category_name) }}
                  </NuxtLink>
                  <span class="category-separator">/</span>
                  <NuxtLink :to="localePath(`/c/${result.category_slug}/${result.subcategory_slug}`)" class="subcategory-link">
                    {{ localLabel(result.subcategory_name) }}
                  </NuxtLink>
                </div>
                <div class="result-price">
                  <strong>Цена:</strong>
                  <span>от {{ formatPrice(result.price_min) }} до {{ formatPrice(result.price_max) }}</span>
                </div>
              </div>
              <div class="result-actions">
                <NuxtLink :to="localePath(`/p/${result.id}`)" class="view-btn">
                  Посмотреть
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-else class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или проверьте написание</p>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">💡</div>
          <h3>Начните поиск</h3>
          <p>Введите название товара в поле поиска выше</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { locale } = useI18n()

const q = ref(String(route.query.q || ''))
const query = computed(() => String(route.query.q || '').trim())
const results = ref<Array<{ id: string; name: string; category_slug: string; category_name: unknown; subcategory_slug: string; subcategory_name: unknown }>>([])
const loading = ref(false)
const error = ref('')

const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

async function loadResults() {
  if (!query.value) {
    results.value = []
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await useFetch(`/api/products?q=${encodeURIComponent(query.value)}&limit=200`)
    results.value = data.value ?? []
  } catch (err: any) {
    error.value = String(err?.message || err?.statusMessage || 'Search failed')
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  loadResults()
})

function applySearch() {
  const path = localePath('/search')
  const queryString = q.value.trim() ? `?q=${encodeURIComponent(q.value.trim())}` : ''
  router.push(path + queryString)
}

function getResultImage(result: any) {
  if (result.image_url) return result.image_url
  const subcatSlug = result.subcategory_slug || ''
  const placeholders: Record<string, string> = {
    'gamepads': '/img/product_img_placeholder/gamepad.png',
    'phones': '/img/product_img_placeholder/phone.png',
    'laptops': '/img/product_img_placeholder/laptop.png',
  }
  return placeholders[subcatSlug] || '/img/product_img_placeholder/default.png'
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/img/product_img_placeholder/default.png'
}

function formatPrice(cents: number | null | undefined, currency = 'EUR') {
  if (cents == null || cents <= 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(cents / 100)
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f8fafc;
}

.nav-links {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  color: #111827;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.nav-link:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.nav-link.secondary {
  border-color: #cbd5e1;
  color: #475569;
}

.nav-link.secondary:hover {
  background: #f1f5f9;
}

.hero-section {
  padding: 1.75rem 0;
  text-align: center;
}

.hero-content {
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
}

.hero-subtitle {
  font-size: 1rem;
  color: #475569;
  margin-bottom: 0;
}

.search-section {
  padding: 2rem 0;
}

.search-container {
  max-width: 720px;
  margin: 0 auto;
}

.search-form {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 1.75rem;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.95rem 1rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #94a3b8;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.95rem 1.5rem;
  background: #111827;
  color: #fff;
  border: 1px solid #111827;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-btn:hover {
  background: #1f2937;
}

.search-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.results-section {
  padding: 2rem 0;
}

.results-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state,
.error-state,
.empty-state,
.no-results {
  text-align: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 3rem 2rem;
  max-width: 520px;
  margin: 0 auto;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #111827;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon,
.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.results-content {
  background: #fff;
  border: 1px solid #e2e8f0;
}

.results-header {
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.results-header h2 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.8rem;
}

.results-count {
  margin: 0;
  color: #475569;
  font-size: 1rem;
}

.results-count strong {
  color: #111827;
  font-weight: 700;
}

.results-grid {
  display: grid;
  gap: 1rem;
  padding: 2rem;
}

.result-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  transition: border-color 0.2s ease;
}

.result-card:hover {
  border-color: #cbd5e1;
}

.result-image-container {
  width: 120px;
  height: 120px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.result-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.result-title a {
  color: #111827;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.result-title a:hover {
  color: #1f2937;
}

.result-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-link,
.subcategory-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.category-link:hover,
.subcategory-link:hover {
  color: #1d4ed8;
}

.category-separator {
  color: #6b7280;
}

.result-actions {
  margin-left: 1rem;
}

.view-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #111827;
  color: #fff;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
}

.view-btn:hover {
  background: #1f2937;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .search-input-group {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
    justify-content: center;
  }

  .result-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-actions {
    margin-left: 0;
    width: 100%;
  }

  .view-btn {
    width: 100%;
    text-align: center;
  }
}
</style>

