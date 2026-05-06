<template>
  <main class="search-page">
    <!-- Navigation -->
    <nav class="nav-links">
      <NuxtLink to="/" class="nav-link">Главная</NuxtLink>
      <NuxtLink to="/account" class="nav-link secondary">Аккаунт</NuxtLink>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Поиск товаров</h1>
        <p class="hero-subtitle">Найдите нужный товар в нашем каталоге</p>
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
              placeholder="Введите название товара..."
              class="search-input"
            />
            <button type="submit" class="search-btn">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Искать
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
          <p>Ищем товары...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Ошибка поиска</h3>
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
              <div class="result-content">
                <h3 class="result-title">
                  <NuxtLink :to="`/p/${result.id}`">{{ result.name }}</NuxtLink>
                </h3>
                <div class="result-category">
                  <NuxtLink :to="`/c/${result.category_slug}`" class="category-link">
                    {{ result.category_name }}
                  </NuxtLink>
                  <span class="category-separator">/</span>
                  <NuxtLink :to="`/c/${result.category_slug}/${result.subcategory_slug}`" class="subcategory-link">
                    {{ result.subcategory_name }}
                  </NuxtLink>
                </div>
              </div>
              <div class="result-actions">
                <NuxtLink :to="`/p/${result.id}`" class="view-btn">
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
const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q || ''))
const query = computed(() => String(route.query.q || '').trim())
const results = ref<Array<{ id: string; name: string; category_slug: string; category_name: string; subcategory_slug: string; subcategory_name: string }>>([])
const loading = ref(false)
const error = ref('')

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
  router.push({ path: '/search', query: q.value.trim() ? { q: q.value.trim() } : {} })
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-links {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(47, 95, 155, 0.3);
  border-radius: 0.5rem;
  color: #2f5f9b;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.nav-link:hover {
  background: #2f5f9b;
  color: #fff;
  border-color: #2f5f9b;
}

.nav-link.secondary {
  border-color: rgba(107, 114, 128, 0.3);
  color: #6b7280;
}

.nav-link.secondary:hover {
  background: #6b7280;
  color: #fff;
  border-color: #6b7280;
}

.hero-section {
  padding: 3rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0;
}

.search-section {
  padding: 2rem;
}

.search-container {
  max-width: 600px;
  margin: 0 auto;
}

.search-form {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.1);
  padding: 2rem;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2f5f9b;
  box-shadow: 0 0 0 3px rgba(47, 95, 155, 0.1);
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #2f5f9b;
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-btn:hover {
  background: #1f4770;
}

.search-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.results-section {
  padding: 2rem;
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
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  padding: 3rem 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2f5f9b;
  border-radius: 50%;
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
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  overflow: hidden;
}

.results-header {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8faff;
}

.results-header h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2a43;
  font-size: 1.8rem;
}

.results-count {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.results-count strong {
  color: #2f5f9b;
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
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #f8faff;
  transition: all 0.2s ease;
}

.result-card:hover {
  border-color: #2f5f9b;
  box-shadow: 0 4px 12px rgba(47, 95, 155, 0.1);
}

.result-content {
  flex: 1;
}

.result-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.result-title a {
  color: #1f2a43;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.result-title a:hover {
  color: #2f5f9b;
}

.result-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-link,
.subcategory-link {
  color: #0369a1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.category-link:hover,
.subcategory-link:hover {
  color: #0284c7;
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
  background: #2f5f9b;
  color: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
}

.view-btn:hover {
  background: #1f4770;
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
    gap: 1rem;
  }

  .result-actions {
    margin-left: 0;
    align-self: stretch;
  }

  .view-btn {
    width: 100%;
    text-align: center;
  }
}
</style>

