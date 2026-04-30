<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
      <template v-if="context">
        <span> / </span>
        <NuxtLink :to="`/c/${context.category.slug}`">
          {{ context.category.name }}
        </NuxtLink>
        <span> / </span>
        <NuxtLink :to="`/c/${context.category.slug}/${context.subcategory.slug}`">
          {{ context.subcategory.name }}
        </NuxtLink>
      </template>
    </p>

    <p v-if="context">
      <NuxtLink :to="`/c/${context.category.slug}/${context.subcategory.slug}`">
        Back to products list
      </NuxtLink>
      <span> | </span>
      <NuxtLink :to="`/c/${context.category.slug}`">
        Back to sub-categories
      </NuxtLink>
    </p>

    <template v-if="context">
      <h1>{{ context.product.name }}</h1>

      <h2>Where to buy (prices)</h2>
      <p>
        <button type="button" @click="refreshPrices">
          Refresh prices on site
        </button>
        <span> </span>
        <button type="button" @click="refreshStoreApis">
          Refresh store APIs (regenerate store prices)
        </button>
      </p>

      <p v-if="pricesStatus">
        {{ pricesStatus }}
      </p>

      <ul v-if="prices?.offers?.length">
        <li v-for="o in prices.offers" :key="o.storeId">
          <strong>{{ o.storeId }}</strong>
          <span> — </span>
          {{ o.price }} {{ o.currency }}
          <span> (sku: {{ o.storeSku }})</span>
        </li>
      </ul>
      <p v-else>
        No price offers for this product (maybe no stores sell it).
      </p>

      <h2>Technical information</h2>
      <ul>
        <li v-for="[key, value] in specEntries" :key="key">
          <strong>{{ key }}</strong>: {{ value }}
        </li>
      </ul>
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

const { getProduct } = useCatalog()
const context = computed(() => getProduct(productId.value))

type PriceOffer = {
  storeId: string
  storeSku: string
  currency: string
  price: number
  asOf: string
}

type PricesResponse = {
  productId: string
  updatedAt: string
  cached: boolean
  offers: PriceOffer[]
}

const pricesStatus = ref('')
const { data: prices, refresh: reloadPrices } = await useFetch<PricesResponse>(() => `/api/prices/${productId.value}`, {
  watch: [productId],
})

const specEntries = computed(() => {
  const specs = context.value?.product.specs
  return specs ? Object.entries(specs) : []
})

async function refreshPrices() {
  pricesStatus.value = 'Refreshing site cache...'
  await $fetch('/api/admin/prices/refresh', { method: 'POST', body: { productId: productId.value } })
  await reloadPrices()
  pricesStatus.value = 'Updated.'
}

async function refreshStoreApis() {
  pricesStatus.value = 'Refreshing store APIs...'
  await $fetch('/api/admin/stores/refresh', { method: 'POST' })
  await refreshPrices()
}
</script>

