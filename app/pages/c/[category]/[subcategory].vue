<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
      <span> / </span>
      <NuxtLink :to="`/c/${categorySlug}`">Back to category</NuxtLink>
    </p>

    <template v-if="category && subcategory">
      <h1>{{ category.name }} / {{ subcategory.name }}</h1>

      <h2>Filters</h2>
      <p>
        <label>
          Search inside:
          <input v-model="localQuery" type="search" placeholder="Search in this list..." />
        </label>
      </p>

      <p>
        <label>
          Sort:
          <select v-model="sortBy">
            <option value="none">None</option>
            <option value="price-asc">Price (low → high)</option>
            <option value="price-desc">Price (high → low)</option>
            <option value="name-asc">Name (A → Z)</option>
          </select>
        </label>
      </p>

      <div v-if="priceRange.max > 0">
        <div><strong>Price range</strong> (min price)</div>
        <label>
          From:
          <input v-model.number="priceMin" type="number" :min="priceRange.min" :max="priceRange.max" />
        </label>
        <span> </span>
        <label>
          To:
          <input v-model.number="priceMax" type="number" :min="priceRange.min" :max="priceRange.max" />
        </label>
        <div>
          Available: {{ priceRange.min }} – {{ priceRange.max }} {{ priceRange.currency }}
        </div>
      </div>

      <div v-if="facets.length">
        <div v-for="facet in facets" :key="facet.key" style="margin-bottom: 8px;">
          <template v-if="facet.kind === 'enum'">
            <label>
              {{ facet.key }}:
              <select v-model="enumFilters[facet.key]">
                <option value="">All</option>
                <option v-for="v in facet.values" :key="v" :value="v">{{ v }}</option>
              </select>
            </label>
          </template>

          <template v-else-if="facet.kind === 'boolean'">
            <label>
              {{ facet.key }}:
              <select v-model="booleanFilters[facet.key]">
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </template>

          <template v-else-if="facet.kind === 'number'">
            <div>
              <strong>{{ facet.key }}</strong>
            </div>
            <label>
              Min:
              <input v-model.number="numberMin[facet.key]" type="number" :placeholder="String(facet.min)" />
            </label>
            <span> </span>
            <label>
              Max:
              <input v-model.number="numberMax[facet.key]" type="number" :placeholder="String(facet.max)" />
            </label>
            <div>
              Range: {{ facet.min }} – {{ facet.max }}
            </div>
          </template>
        </div>
      </div>

      <h2>Products</h2>
      <p v-if="subcategory.products.length">
        Showing: {{ filteredProducts.length }} / {{ subcategory.products.length }}
      </p>

      <template v-if="filteredProducts.length">
        <ul>
          <li v-for="p in filteredProducts" :key="p.id">
            <NuxtLink :to="`/p/${p.id}`">
              {{ p.name }}
            </NuxtLink>
            <template v-if="minPricesMap[p.id] != null">
              <span> — from </span>
              <strong>{{ minPricesMap[p.id] }}</strong>
              <span> {{ minPriceCurrency }}</span>
            </template>
          </li>
        </ul>
      </template>
      <template v-else>
        <p v-if="subcategory.products.length">No products match your filters.</p>
        <p v-else>This sub-category has no products yet.</p>
      </template>
    </template>

    <template v-else>
      <h1>Sub-category not found</h1>
      <p>Category: {{ categorySlug }}</p>
      <p>Sub-category: {{ subcategorySlug }}</p>
    </template>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => String(route.params.category || ''))
const subcategorySlug = computed(() => String(route.params.subcategory || ''))

const { getCategory, getSubcategory } = useCatalog()

const category = computed(() => {
  return getCategory(categorySlug.value)
})

const subcategory = computed(() => {
  return getSubcategory(categorySlug.value, subcategorySlug.value)
})

type Facet =
  | { key: string; kind: 'enum'; values: string[] }
  | { key: string; kind: 'boolean' }
  | { key: string; kind: 'number'; min: number; max: number }

const localQuery = ref('')
const sortBy = ref<'none' | 'price-asc' | 'price-desc' | 'name-asc'>('none')
const enumFilters = reactive<Record<string, string>>({})
const booleanFilters = reactive<Record<string, '' | 'true' | 'false'>>({})
const numberMin = reactive<Record<string, number | null>>({})
const numberMax = reactive<Record<string, number | null>>({})

type MinPricesResponse = {
  items: Array<{ productId: string; minPrice: number; currency: string }>
}

const { data: minPrices } = await useFetch<MinPricesResponse>(() => '/api/prices/subcategory', {
  query: { category: categorySlug, subcategory: subcategorySlug },
  watch: [categorySlug, subcategorySlug],
})

const minPricesMap = computed<Record<string, number | null>>(() => {
  const out: Record<string, number | null> = {}
  const items = minPrices.value?.items ?? []
  for (const it of items) out[it.productId] = it.minPrice
  return out
})

const minPriceCurrency = computed(() => (minPrices.value?.items?.[0]?.currency ?? 'EUR'))

const priceRange = computed(() => {
  const values = Object.values(minPricesMap.value).filter(v => typeof v === 'number' && Number.isFinite(v)) as number[]
  if (!values.length) return { min: 0, max: 0, currency: minPriceCurrency.value }
  return { min: Math.min(...values), max: Math.max(...values), currency: minPriceCurrency.value }
})

const priceMin = ref<number>(0)
const priceMax = ref<number>(0)

watch(priceRange, (r) => {
  if (!r.max) return
  if (!priceMin.value && !priceMax.value) {
    priceMin.value = r.min
    priceMax.value = r.max
  } else {
    // keep values within bounds
    if (priceMin.value < r.min) priceMin.value = r.min
    if (priceMax.value > r.max) priceMax.value = r.max
  }
}, { immediate: true })

function toKind(value: unknown) {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number' && Number.isFinite(value)) return 'number'
  return 'string'
}

const facets = computed<Facet[]>(() => {
  const products = subcategory.value?.products ?? []
  if (!products.length) return []

  const keyToValues = new Map<string, unknown[]>()
  for (const p of products) {
    for (const [k, v] of Object.entries(p.specs)) {
      if (!keyToValues.has(k)) keyToValues.set(k, [])
      keyToValues.get(k)!.push(v)
    }
  }

  const out: Facet[] = []
  const keys = Array.from(keyToValues.keys()).sort((a, b) => a.localeCompare(b))

  for (const key of keys) {
    const values = keyToValues.get(key) ?? []
    const kinds = new Set(values.map(toKind))

    // If mixed types -> treat as enum (string)
    if (kinds.size > 1) {
      const enumValues = Array.from(new Set(values.map(v => String(v)))).sort()
      if (enumValues.length && enumValues.length <= 20) out.push({ key, kind: 'enum', values: enumValues })
      continue
    }

    const kind = kinds.values().next().value as 'boolean' | 'number' | 'string'

    if (kind === 'boolean') {
      out.push({ key, kind: 'boolean' })
      continue
    }

    if (kind === 'number') {
      const nums = values.filter(v => typeof v === 'number') as number[]
      if (!nums.length) continue
      out.push({ key, kind: 'number', min: Math.min(...nums), max: Math.max(...nums) })
      continue
    }

    const enumValues = Array.from(new Set(values.map(v => String(v)))).sort()
    if (enumValues.length && enumValues.length <= 20) {
      out.push({ key, kind: 'enum', values: enumValues })
    }
  }

  return out
})

const filteredProducts = computed(() => {
  const products = subcategory.value?.products ?? []
  const q = localQuery.value.trim().toLowerCase()

  const filtered = products.filter((p) => {
    if (q) {
      const inName = p.name.toLowerCase().includes(q)
      const inSpecs = Object.values(p.specs).some(v => String(v).toLowerCase().includes(q))
      if (!inName && !inSpecs) return false
    }

    for (const facet of facets.value) {
      const raw = p.specs[facet.key]

      if (facet.kind === 'enum') {
        const selected = enumFilters[facet.key]
        if (selected && String(raw) !== selected) return false
      } else if (facet.kind === 'boolean') {
        const selected = booleanFilters[facet.key]
        if (selected) {
          const expected = selected === 'true'
          if (raw !== expected) return false
        }
      } else if (facet.kind === 'number') {
        const min = numberMin[facet.key]
        const max = numberMax[facet.key]
        if (min == null && max == null) continue
        if (typeof raw !== 'number') return false
        if (min != null && raw < min) return false
        if (max != null && raw > max) return false
      }
    }

    const mp = minPricesMap.value[p.id]
    if (typeof mp === 'number' && priceRange.value.max > 0) {
      if (mp < priceMin.value || mp > priceMax.value) return false
    }

    return true
  })

  if (sortBy.value === 'name-asc') {
    return filtered.slice().sort((a, b) => a.name.localeCompare(b.name))
  }
  if (sortBy.value === 'price-asc') {
    return filtered.slice().sort((a, b) => (minPricesMap.value[a.id] ?? Number.POSITIVE_INFINITY) - (minPricesMap.value[b.id] ?? Number.POSITIVE_INFINITY))
  }
  if (sortBy.value === 'price-desc') {
    return filtered.slice().sort((a, b) => (minPricesMap.value[b.id] ?? 0) - (minPricesMap.value[a.id] ?? 0))
  }

  return filtered
})


</script>

