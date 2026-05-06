<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
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
    </p>

    <p v-if="product">
      <NuxtLink :to="`/c/${product.category_slug}/${product.subcategory_slug}`">
        Back to products list
      </NuxtLink>
      <span> | </span>
      <NuxtLink :to="`/c/${product.category_slug}`">
        Back to sub-categories
      </NuxtLink>
      <span> | </span>
      <NuxtLink to="/account">Account</NuxtLink>
    </p>

    <template v-if="product">
      <h1>{{ product.name }}</h1>

      <h2>Technical information</h2>
      <ul>
        <li v-for="[key, value] in specEntries" :key="key">
          <strong>{{ key }}</strong>: {{ value }}
        </li>
      </ul>

      <h2>Prices</h2>
      <p>
        <button @click="refreshPrices" :disabled="pricesLoading || refreshing">
          Refresh prices (POST)
        </button>
        <span v-if="refreshError"> {{ refreshError }}</span>
      </p>

      <p v-if="pricesLoading">Loading prices...</p>
      <ul v-else>
        <li v-for="p in prices" :key="p.storeId">
          <strong>{{ p.storeName }}</strong> (external: {{ p.externalId }})
          — {{ formatPrice(p.priceCents, p.currency) }}
          — ok={{ p.ok }}
          <span v-if="p.error"> — error: {{ p.error }}</span>
          <span v-if="p.fetchedAt"> — fetched: {{ new Date(p.fetchedAt).toLocaleString() }}</span>
        </li>
      </ul>

      <h2>Favorites</h2>
      <p>
        <button @click="toggleFavorite" :disabled="favBusy">
          {{ isFavorite ? 'Remove from favorites' : 'Add to favorites' }}
        </button>
        <span v-if="favMsg"> {{ favMsg }}</span>
      </p>
    </template>

    <template v-else>
      <h1>Product not found</h1>
      <p>Unknown product id: {{ productId }}</p>
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
    const favs = await $fetch<Array<{ id: string }>>('/api/favorites')
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
      await $fetch(`/api/favorites/${productId.value}`, { method: 'POST' })
      isFavorite.value = true
      favMsg.value = '(added)'
    } else {
      await $fetch(`/api/favorites/${productId.value}`, { method: 'DELETE' })
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

