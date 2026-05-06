<template>
  <main>
    <div class="breadcrumb">
      <NuxtLink to="/">Главная</NuxtLink>
      <template v-if="product">
        <span> / </span>
        <NuxtLink :to="`/c/${product.category_slug}`">
          {{ product.category_name }}
        </NuxtLink>
        <span> / </span>
        <NuxtLink :to="`/c/${product.category_slug}/${product.subcategory_slug}`">
          {{ product.subcategory_name }}
        </NuxtLink>
      </template>
    </div>

    <div class="nav-links">
      <NuxtLink :to="product ? `/c/${product.category_slug}/${product.subcategory_slug}` : '/'" class="nav-link secondary">← К товарам</NuxtLink>
      <NuxtLink to="/account" class="nav-link">Личный кабинет</NuxtLink>
    </div>

    <template v-if="product">
      <div class="product-layout">
        <div class="product-main">
          <div class="product-header">
            <h1>{{ product.name }}</h1>
            <div class="product-meta">
              <span class="category-badge">{{ product.category_name }}</span>
              <span class="subcategory-badge">{{ product.subcategory_name }}</span>
            </div>
          </div>

          <div class="product-content">
            <section class="specs-section">
              <h2>Технические характеристики</h2>
              <div class="specs-grid">
                <div v-for="[key, value] in specEntries" :key="key" class="spec-row">
                  <span class="spec-key">{{ key }}</span>
                  <span class="spec-value">{{ value }}</span>
                </div>
              </div>
            </section>

            <section class="favorites-section">
              <h2>Избранное</h2>
              <div class="favorites-controls">
                <button @click="toggleFavorite" :disabled="favBusy" class="favorite-btn" :class="{ active: isFavorite }">
                  <span v-if="favBusy">Загрузка...</span>
                  <span v-else>{{ isFavorite ? 'Убрать из избранного' : 'Добавить в избранное' }}</span>
                </button>
                <span v-if="favMsg" class="fav-message" :class="{ success: favMsg.includes('добавлено'), error: favMsg.includes('ошибка') || favMsg.includes('Login') }">
                  {{ favMsg }}
                </span>
              </div>
            </section>
          </div>
        </div>

        <aside class="product-sidebar">
          <div class="prices-card">
            <h3>Цены</h3>
            <div class="price-controls">
              <button @click="refreshPrices" :disabled="pricesLoading || refreshing" class="refresh-btn">
                {{ refreshing ? 'Обновление...' : 'Обновить цены' }}
              </button>
              <span v-if="refreshError" class="error">{{ refreshError }}</span>
            </div>

            <div v-if="pricesLoading" class="loading">Загрузка цен...</div>
            <div v-else class="prices-list">
              <div v-for="p in prices" :key="p.storeId" class="price-item" :class="{ ok: p.ok, error: !p.ok }">
                <div class="price-header">
                  <strong>{{ p.storeName }}</strong>
                  <span class="external-id">(ID: {{ p.externalId }})</span>
                </div>
                <div class="price-value">
                  {{ formatPrice(p.priceCents, p.currency) }}
                </div>
                <div class="price-meta">
                  <span v-if="p.error" class="price-error">Ошибка: {{ p.error }}</span>
                  <span v-if="p.fetchedAt" class="price-date">
                    Обновлено: {{ new Date(p.fetchedAt).toLocaleString('ru-RU') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="error-card">
        <h1>Товар не найден</h1>
        <p>Неизвестный ID товара: {{ productId }}</p>
        <NuxtLink to="/" class="back-link">Вернуться на главную</NuxtLink>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const productId = computed(() => String(route.params.id || ''))

const { data: product } = await useFetch(`/api/products/${productId.value}`)

const specEntries = computed(() => {
  const specs = (product.value as any)?.specs
  return specs ? Object.entries(specs) : []
})

type PriceItem = {
  storeId: string
  storeName: string
  externalId: string
  currency: string
  priceCents: number
  fetchedAt: number
  ok: boolean
  error: string | null
}

const pricesLoading = ref(false)
const refreshing = ref(false)
const refreshError = ref('')
const prices = ref<PriceItem[]>([])

async function loadPrices() {
  if (!productId.value) return
  pricesLoading.value = true
  try {
    const res = await $fetch<{ prices: PriceItem[] }>(`/api/prices/${productId.value}`)
    prices.value = res.prices
  } finally {
    pricesLoading.value = false
  }
}

function formatPrice(cents: number, currency: string) {
  if (!cents) return `— ${currency}`
  return `${(cents / 100).toFixed(2)} ${currency}`
}

async function refreshPrices() {
  refreshError.value = ''
  refreshing.value = true
  try {
    // IMPORTANT: do not navigate to /refresh in router. We call API.
    await $fetch(`/api/prices/${productId.value}/refresh`, { method: 'POST' })
    await loadPrices()
  } catch (e: any) {
    refreshError.value = String(e?.statusMessage || e?.message || 'Refresh failed')
  } finally {
    refreshing.value = false
  }
}

// favorites (requires login)
const favBusy = ref(false)
const favMsg = ref('')
const isFavorite = ref(false)

async function loadFavoriteState() {
  favMsg.value = ''
  try {
    const favs = await $fetch<Array<{ id: string }>>('/api/favorites', { credentials: 'include' })
    isFavorite.value = favs.some(f => f.id === productId.value)
  } catch {
    isFavorite.value = false
  }
}

async function toggleFavorite() {
  favBusy.value = true
  favMsg.value = ''
  try {
    if (!isFavorite.value) {
      await $fetch(`/api/favorites/${productId.value}`, { method: 'POST', credentials: 'include' })
      isFavorite.value = true
      favMsg.value = '(added)'
    } else {
      await $fetch(`/api/favorites/${productId.value}`, { method: 'DELETE', credentials: 'include' })
      isFavorite.value = false
      favMsg.value = '(removed)'
    }
  } catch (e: any) {
    favMsg.value = String(e?.statusMessage || e?.message || 'Login required')
  } finally {
    favBusy.value = false
  }
}

await loadPrices()
await loadFavoriteState()
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 1.5rem;
  color: #64748b;
}

.breadcrumb a {
  color: #2f5f9b;
}

.nav-links {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #fff;
  border: 2px solid #2f5f9b;
  border-radius: 0.5rem;
  color: #2f5f9b;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #2f5f9b;
  color: #fff;
}

.nav-link.secondary {
  border-color: #6b7280;
  color: #6b7280;
}

.nav-link.secondary:hover {
  background: #6b7280;
  color: #fff;
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  align-items: start;
}

.product-main {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  overflow: hidden;
}

.product-header {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.product-header h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  color: #1f2a43;
}

.product-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-badge,
.subcategory-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.product-content {
  padding: 2rem;
}

.specs-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #1f2a43;
  font-size: 1.4rem;
}

.specs-grid {
  display: grid;
  gap: 1rem;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8faff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.spec-key {
  font-weight: 600;
  color: #374151;
}

.spec-value {
  color: #6b7280;
  text-align: right;
}

.favorites-section h2 {
  margin-bottom: 1rem;
  color: #1f2a43;
  font-size: 1.4rem;
}

.favorites-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.favorite-btn {
  padding: 0.75rem 1.5rem;
  background: #fef3c7;
  border: 2px solid #f59e0b;
  color: #92400e;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.favorite-btn:hover:not(:disabled) {
  background: #fde68a;
}

.favorite-btn.active {
  background: #f59e0b;
  color: #fff;
}

.favorite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fav-message {
  font-weight: 600;
}

.fav-message.success {
  color: #059669;
}

.fav-message.error {
  color: #dc2626;
}

.product-sidebar {
  position: sticky;
  top: 2rem;
}

.prices-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  padding: 1.5rem;
}

.prices-card h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1f2a43;
  font-size: 1.3rem;
}

.price-controls {
  margin-bottom: 1.5rem;
}

.refresh-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2f5f9b;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #1f4770;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #64748b;
}

.prices-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.price-item {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #f8faff;
}

.price-item.ok {
  border-color: #10b981;
  background: #f0fdf4;
}

.price-item.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.price-header strong {
  color: #1f2a43;
}

.external-id {
  font-size: 0.8rem;
  color: #6b7280;
}

.price-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #059669;
  margin-bottom: 0.5rem;
}

.price-meta {
  font-size: 0.85rem;
  color: #6b7280;
}

.price-error {
  color: #dc2626;
}

.price-date {
  color: #64748b;
}

.error-card {
  text-align: center;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  padding: 3rem 2rem;
  max-width: 500px;
  margin: 2rem auto;
}

.error-card h1 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: #2f5f9b;
  color: #fff;
  border-radius: 0.75rem;
  text-decoration: none;
  transition: background 0.2s ease;
}

.back-link:hover {
  background: #1f4770;
}

@media (max-width: 768px) {
  .product-layout {
    grid-template-columns: 1fr;
  }

  .product-sidebar {
    position: static;
  }
}
</style>

