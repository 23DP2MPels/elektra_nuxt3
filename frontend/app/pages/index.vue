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

    <!-- Products of the Day Carousel -->
    <br/>
    <div class="carousel-section">
      <h2 class="carousel-title">{{ $t('carousel.title') }}</h2>
      <div v-if="randomProductsLoading" class="carousel-loading">{{ $t('catalog.loading') }}</div>
      <div v-else 
           class="carousel-container" 
           ref="carouselContainer"
           @mouseenter="pauseAutoScroll"
           @mouseleave="resumeAutoScroll"
      >
        <div class="carousel-track" ref="carouselTrack">
          <NuxtLink 
            v-for="product in randomProducts" 
            :key="product.id" 
            :to="localePath(`/p/${product.id}`)"
            class="product-card"
          >
            <img 
              :src="product.image_url || getDefaultImage(product.subcategory_slug || '')" 
              :alt="product.image_alt || product.name" 
              class="product-image"
              @error="onImageError"
            />
            <h3 class="product-name">{{ localLabel(product.name) }}</h3>
            <p class="product-price">
              {{ $t('carousel.from') }} {{ formatPrice(product.price_min) }} {{ $t('carousel.to') }} {{ formatPrice(product.price_max) }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'

const localePath = useLocalePath()
const { locale } = useI18n()
const categories = ref<Array<{ category_slug: string; category_name: unknown; productCount: number }>>([])
const loading = ref(true)
const error = ref('')
const isNetworkError = ref(false)

// Random products for carousel
const randomProducts = ref<Array<any>>([])
const randomProductsLoading = ref(true)

// Carousel refs and auto-scroll
const carouselContainer = ref<HTMLElement | null>(null)
const carouselTrack = ref<HTMLElement | null>(null)
let autoScrollInterval: number | null = null
let visibleProductsCount = 0
let currentScrollIndex = 0
let isPaused = false

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

async function loadRandomProducts() {
  randomProductsLoading.value = true
  try {
    const { data } = await useFetch('/api/products/random')
    randomProducts.value = data.value ?? []
    // Initialize carousel after products are loaded
    await nextTick()
    initCarousel()
  } catch (err: any) {
    console.error('Failed to load random products:', err)
    randomProducts.value = []
  } finally {
    randomProductsLoading.value = false
  }
}

function calculateVisibleProducts() {
  if (!carouselContainer.value || !carouselTrack.value) return 0
  
  const containerWidth = carouselContainer.value.clientWidth
  const cardWidth = 220 // Fixed card width from CSS
  const gap = 20 // Gap from CSS (1.25rem = 20px)
  
  const visible = Math.floor((containerWidth + gap) / (cardWidth + gap))
  return Math.max(1, visible)
}

function scrollCarousel() {
  if (!carouselContainer.value || isPaused) return
  
  visibleProductsCount = calculateVisibleProducts()
  const cardWidth = 220
  const gap = 20
  const scrollAmount = visibleProductsCount * (cardWidth + gap)
  
  currentScrollIndex += visibleProductsCount
  
  // If we've scrolled past the end, reset to beginning
  if (currentScrollIndex >= randomProducts.value.length) {
    currentScrollIndex = 0
  }
  
  carouselContainer.value.scrollTo({
    left: currentScrollIndex * (cardWidth + gap),
    behavior: 'smooth'
  })
}

function startAutoScroll() {
  if (autoScrollInterval) clearInterval(autoScrollInterval)
  autoScrollInterval = window.setInterval(scrollCarousel, 10000) // 10 seconds
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }
}

function pauseAutoScroll() {
  isPaused = true
}

function resumeAutoScroll() {
  isPaused = false
}

function initCarousel() {
  visibleProductsCount = calculateVisibleProducts()
  currentScrollIndex = 0
  startAutoScroll()
}

function retryLoad() {
  loadCategories()
}

function formatPrice(cents: number) {
  if (!cents) return '0.00 euro'
  return `${(cents / 100).toFixed(2)} euro`
}

function getDefaultImage(subcategorySlug: string) {
  const placeholders: Record<string, string> = {
    'gamepads': '/img/product_img_placeholder/gamepad.png',
    'phones': '/img/product_img_placeholder/phone.png',
    'laptops': '/img/product_img_placeholder/laptop.png',
  }
  return placeholders[subcategorySlug] || '/img/product_img_placeholder/default.png'
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/img/product_img_placeholder/default.png'
}

onMounted(() => {
  window.addEventListener('resize', () => {
    visibleProductsCount = calculateVisibleProducts()
  })
})

onUnmounted(() => {
  stopAutoScroll()
})

// Initial load
loadCategories()
loadRandomProducts()
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

/* Carousel Styles */
.carousel-section {
  margin-bottom: 3rem;
}

.carousel-title {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: #111827;
}

.carousel-loading {
  text-align: center;
  padding: 2rem;
  color: #475569;
}

.carousel-container {
  overflow-x: auto;
  padding: 1rem 0;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.carousel-container::-webkit-scrollbar {
  height: 8px;
}

.carousel-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.carousel-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.carousel-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.carousel-track {
  display: flex;
  gap: 1.25rem;
  padding: 0.5rem;
}

.product-card {
  flex: 0 0 220px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(33, 77, 124, 0.1);
  border-color: #94a3b8;
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  background: #f8fafc;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.8rem;
}

.product-price {
  font-size: 0.9rem;
  color: #059669;
  font-weight: 600;
  margin: 0;
  padding-top: auto;
}
</style>

