<template>
  <main>
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/')">{{ $t('product.nav.home') }}</NuxtLink>
      <template v-if="product">
        <span> / </span>
        <NuxtLink :to="localePath(`/c/${product.category_slug}`)">
          {{ categoryName }}
        </NuxtLink>
        <span> / </span>
        <NuxtLink :to="localePath(`/c/${product.category_slug}/${product.subcategory_slug}`)">
          {{ subcategoryName }}
        </NuxtLink>
      </template>
    </div>

    <div class="nav-links">
      <NuxtLink :to="product ? localePath(`/c/${product.category_slug}/${product.subcategory_slug}`) : localePath('/')" class="nav-link secondary">{{ $t('product.nav.backToProducts') }}</NuxtLink>
      <NuxtLink :to="localePath('/account')" class="nav-link">{{ $t('product.nav.myProfile') }}</NuxtLink>
    </div>

    <div v-if="isNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <h3>{{ $t('networkError.title') }}</h3>
      <p>{{ $t('networkError.message') }}</p>
      <button @click="retryLoad" class="retry-btn">{{ $t('networkError.retry') }}</button>
    </div>

    <template v-if="product">
      <div class="product-layout">
        <div class="product-main">
          <div class="product-image-card">
            <img :src="imageUrl" :alt="product.image_alt || product.name" class="product-image" @error="onImageError" />
          </div>
          <div class="product-header">
            <h1>{{ product.name }}</h1>
            <div class="product-meta">
              <span class="category-badge">{{ categoryName }}</span>
              <span class="subcategory-badge">{{ subcategoryName }}</span>
            </div>
          </div>

          <div class="product-content">
            <section class="specs-section">
              <h2>{{ $t('product.specs.title') }}</h2>
              <div class="specs-grid">
                <div v-for="[key, value] in specEntries" :key="key" class="spec-row">
                  <span class="spec-key">{{ key }}</span>
                  <span class="spec-value">{{ value }}</span>
                </div>
              </div>
            </section>

            <section class="favorites-section">
              <h2>{{ $t('product.favorites.title') }}</h2>
              <div class="favorites-controls">
                <button @click="toggleFavorite" :disabled="favBusy" class="favorite-btn" :class="{ active: isFavorite }">
                  <span v-if="favBusy">{{ $t('product.favorites.loading') }}</span>
                  <span v-else>{{ isFavorite ? $t('product.favorites.remove') : $t('product.favorites.add') }}</span>
                </button>
                <span v-if="favMsg" class="fav-message" :class="{ success: favMsg === $t('product.favoriteMessages.added') || favMsg === $t('product.favoriteMessages.removed'), error: favMsg !== $t('product.favoriteMessages.added') && favMsg !== $t('product.favoriteMessages.removed') }">
                  {{ favMsg }}
                </span>
              </div>
            </section>

          </div>
        </div>

        <aside class="product-sidebar">
          <div class="prices-card">
            <h3>{{ $t('product.prices.title') }}</h3>
            <div class="price-controls">
              <button style="display: none" @click="refreshPrices" :disabled="pricesLoading || refreshing" class="refresh-btn">
                {{ refreshing ? $t('product.prices.refreshing') : $t('product.prices.refresh') }}
              </button>
              <span v-if="refreshError" class="error">{{ refreshError }}</span>
            </div>

            <div v-if="pricesLoading" class="loading">{{ $t('product.prices.loading') }}</div>
            <div v-else class="prices-list">
              <a 
                v-for="p in prices" 
                :key="p.storeId" 
                :href="p.shopUrl || `https://${p.storeName}.com`" 
                target="_blank" 
                rel="noopener noreferrer"
                class="price-item clickable-store-card" 
                :class="{ ok: p.ok, error: !p.ok }"
                :title="$t('product.prices.openStore')"
              >
                <div class="price-header">
                  <div class="store-info-group">
                    <img :src="storeLogos[p.storeId] || defaultStoreLogo" :alt="p.storeName" class="store-logo" />
                    <strong>{{ p.storeName }}</strong>
                  </div>
                  <span class="external-id-badge">{{ $t('product.prices.toStore') }}</span>
                </div>
                <div class="price-value">
                  {{ formatPrice(p.priceCents, p.currency) }}
                </div>
                <div class="price-meta">
                  <span v-if="p.oldPriceCents !== null" class="old-price">
                    {{ $t('product.prices.previousPrice') }} {{ formatPrice(p.oldPriceCents, p.currency) }}
                  </span>
                  <br></br>
                  <span v-if="p.error" class="price-error">{{ $t('product.prices.error') }} {{ p.error }}</span>
                  <span v-if="p.fetchedAt" class="price-date">
                    {{ $t('product.prices.updated') }} {{ formatDate(p.fetchedAt) }}
                  </span>
                </div>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="error-card">
        <h1>{{ $t('product.notFound.title') }}</h1>
        <p>{{ $t('product.notFound.unknownId') }} {{ productId }}</p>
        <NuxtLink :to="localePath('/')" class="back-link">{{ $t('product.notFound.backToHome') }}</NuxtLink>
      </div>
    </template>

    <div v-if="compareList.length" class="compare-tray">
      <div class="compare-items">
        <div v-for="item in compareList" :key="item.id" class="compare-item">
          <img :src="item.image_url || getDefaultImage(item.subcategory_slug || '')" :alt="item.image_alt || item.name" />
        </div>
        <span class="compare-summary">{{ $t('product.compare.selected') }} {{ compareList.length }} {{ $t('product.compare.of') }} {{ compareCountLimit }} {{ $t('product.compare.products') }}</span>
      </div>
      <div class="compare-actions">
        <button class="compare-open-btn" @click="openCompareModal" :disabled="compareList.length < 2">
          {{ $t('product.compare.compareSelected') }}
        </button>
        <button class="compare-clear-btn" @click="clearCompare">{{ $t('product.compare.clear') }}</button>
      </div>
      <p v-if="compareError" class="compare-error">{{ compareError }}</p>
    </div>

    <div v-if="compareModalOpen" class="compare-modal-backdrop" @click.self="closeCompareModal">
      <div class="compare-modal">
        <div class="compare-modal-header">
          <h2>{{ $t('product.compare.title') }}</h2>
          <button class="close-modal" @click="closeCompareModal">×</button>
        </div>
        <div class="compare-modal-thumbs">
          <div v-for="item in compareList" :key="item.id" class="compare-modal-thumb">
            <img :src="item.image_url || getDefaultImage(item.subcategory_slug || '')" :alt="item.image_alt || item.name" />
            <span>{{ item.name }}</span>
          </div>
        </div>
        <div class="compare-table-container">
          <table class="compare-table">
            <thead>
              <tr>
                <th>{{ $t('product.compare.parameter') }}</th>
                <th v-for="item in compareList" :key="item.id">{{ item.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spec of allCompareSpecs" :key="spec">
                <td class="spec-key">{{ facetName(spec) }}</td>
                <td v-for="item in compareList" :key="item.id" class="spec-value">
                  {{ item.specs?.[spec] ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'
const route = useRoute()
const localePath = useLocalePath()
const { locale } = useI18n()
const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)
const productId = computed(() => String(route.params.id || ''))

const { data: product } = await useFetch(`/api/products/${productId.value}`)

const specEntries = computed(() => {
  const specs = (product.value as any)?.specs
  return specs ? Object.entries(specs) : []
})

const categoryName = computed(() => {
  const name = localLabel((product.value as any)?.category_name)
  return name || (product.value as any)?.category_slug || ''
})
const subcategoryName = computed(() => {
  const name = localLabel((product.value as any)?.subcategory_name)
  return name || (product.value as any)?.subcategory_slug || ''
})

type PriceItem = {
  storeId: string
  storeName: string
  externalId: string
  currency: string
  priceCents: number
  oldPriceCents: number | null
  fetchedAt: number
  ok: boolean
  error: string | null
  shopUrl?: string
}

// Tīkla kļūdu apstrāde
const isNetworkError = ref(false)

async function retryLoad() {
  isNetworkError.value = false
  try {
    await navigateTo(route.fullPath, { replace: true })
  } catch (e: any) {
    if (!navigator.onLine || e?.message?.includes('fetch') || e?.message?.includes('network')) {
      isNetworkError.value = true
    }
  }
}

// Cenu stāvoklis
const pricesLoading = ref(false)
const refreshing = ref(false)
const refreshError = ref('')
const prices = ref<PriceItem[]>([])

const defaultProductImage = '/img/product_img_placeholder/gamepad.png'
const defaultStoreLogo = '/img/store_logos/store-default.png'
const storeLogos: Record<string, string> = {
  'store-a': '/img/store_logos/store-a.png',
  'store-b': '/img/store_logos/store-b.png',
  'store-c': '/img/store_logos/store-c.png',
}

const getDefaultImage = (subcategorySlug: string) => {
  const placeholders: Record<string, string> = {
    'gamepads': '/img/product_img_placeholder/gamepad.png',
    'phones': '/img/product_img_placeholder/phone.png',
    'laptops': '/img/product_img_placeholder/laptop.png',
  }
  return placeholders[subcategorySlug] || '/img/product_img_placeholder/default.png'
}

const imageUrl = computed(() => {
  return (product.value as any)?.image_url || getDefaultImage((product.value as any)?.subcategory_slug || '')
})

const compareKey = computed(() => product.value ? `compare_${product.value.category_slug}_${product.value.subcategory_slug}` : '')

const compareCountLimit = 5
const compareList = ref<any[]>([])
const compareModalOpen = ref(false)
const compareError = ref('')

function loadCompare() {
  if (!compareKey.value || !process.client) return
  const stored = localStorage.getItem(compareKey.value)
  if (stored) {
    try {
      compareList.value = JSON.parse(stored).slice(0, compareCountLimit)
    } catch {
      compareList.value = []
    }
  }
}

watchEffect(() => {
  if (compareKey.value && process.client) {
    loadCompare()
  }
})

const allCompareSpecs = computed(() => {
  const specs = new Set<string>()
  compareList.value.forEach((item) => {
    Object.keys(item.specs ?? {}).forEach((key) => specs.add(key))
  })
  return Array.from(specs).sort()
})

function openCompareModal() {
  if (compareList.value.length < 2) {
    compareError.value = $t('product.compare.selectAtLeastTwo')
    return
  }
  compareError.value = ''
  compareModalOpen.value = true
}

function closeCompareModal() {
  compareModalOpen.value = false
}

function clearCompare() {
  compareList.value = []
  compareError.value = ''
  if (compareKey.value && process.client) {
    localStorage.removeItem(compareKey.value)
  }
}

onMounted(() => {
  loadCompare()
})

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

function formatDate(timestamp: number | string) {
  if (!timestamp) return '—'
  try {
    return new Date(timestamp).toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'lv-LV')
  } catch {
    return '—'
  }
}

async function refreshPrices() {
  refreshError.value = ''
  refreshing.value = true
  try {
    await $fetch(`/api/prices/${productId.value}/refresh`, { method: 'POST' })
    await loadPrices()
  } catch (e: any) {
    refreshError.value = String(e?.statusMessage || e?.message || $t('product.refreshError'))
  } finally {
    refreshing.value = false
  }
}

// Izlase (nepieciešama autorizācija)
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
      favMsg.value = $t('product.favoriteMessages.added')
    } else {
      await $fetch(`/api/favorites/${productId.value}`, { method: 'DELETE', credentials: 'include' })
      isFavorite.value = false
      favMsg.value = $t('product.favoriteMessages.removed')
    }
  } catch (e: any) {
    favMsg.value = String(e?.statusMessage || e?.message || $t('product.favoriteMessages.authRequired'))
  } finally {
    favBusy.value = false
  }
}

await loadPrices()
await loadFavoriteState()

function facetName(key: string): string {
  return $t(`product.specsMap.${key}`) || key
}
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

.compare-tray {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.95);
  color: #fff;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
}

.compare-items {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
}

.compare-item {
  width: 64px;
  height: 64px;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #fff;
  flex-shrink: 0;
}

.compare-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compare-summary {
  min-width: 170px;
  font-weight: 600;
}

.compare-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.compare-open-btn,
.compare-clear-btn {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.compare-open-btn {
  background: #3b82f6;
  color: #fff;
}

.compare-open-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.compare-clear-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
}

.compare-error {
  color: #fca5a5;
  margin-top: 0.5rem;
}

.compare-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 1rem;
}

.compare-modal {
  width: min(1200px, 100%);
  max-height: min(90vh, 100%);
  overflow: auto;
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
}

.compare-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.close-modal {
  border: none;
  background: transparent;
  color: #111827;
  font-size: 1.75rem;
  cursor: pointer;
}

.compare-modal-thumbs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.compare-modal-thumb {
  width: 110px;
  text-align: center;
}

.compare-modal-thumb img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 1rem;
  margin-bottom: 0.5rem;
}

.compare-table-container {
  overflow-x: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
}

.compare-table th,
.compare-table td {
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
}

.compare-table th {
  background: #f8fafc;
}

.compare-table .spec-key {
  font-weight: 700;
}

.compare-table .spec-value {
  color: #475569;
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

/* ─── MAZAFORMATĒTAIS VEIKALU SAIŠU STILS ─── */
.clickable-store-card {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.clickable-store-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(33, 77, 124, 0.08);
}

.store-info-group {
  display: flex;
  align-items: center;
}

.external-id-badge {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2f5f9b;
  background: #f0f6ff;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.2s, color 0.2s;
}

.clickable-store-card:hover .external-id-badge {
  background: #2f5f9b;
  color: #fff;
}
/* ────────────────────────────── */

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

.price-sidebar {
  display: grid;
  gap: 0.25rem;
}

.old-price {
  color: #7c3aed;
  font-weight: 600;
}

.price-error {
  color: #dc2626;
}

.price-date {
  color: #64748b;
}

.product-image-card {
  display: grid;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.product-image {
  width: 100%;
  max-width: 520px;
  height: auto;
  margin: 0 auto;
  border-radius: 1rem;
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.brand-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #ffffff;
  color: #1f2937;
  font-weight: 600;
}

.brand-logo,
.store-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.store-logo {
  margin-right: 0.75rem;
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

.network-error {
  text-align: center;
  padding: 3rem 2rem;
  background: #f8faff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  margin: 2rem auto;
  max-width: 500px;
}

.network-error .error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.network-error h3 {
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

@media (max-width: 768px) {
  .product-layout {
    grid-template-columns: 1fr;
  }

  .product-sidebar {
    position: static;
  }
}
</style>
