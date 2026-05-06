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
const enumFilters = reactive<Record<string, string>>({})
const booleanFilters = reactive<Record<string, '' | 'true' | 'false'>>({})
const numberMin = reactive<Record<string, number | null>>({})
const numberMax = reactive<Record<string, number | null>>({})

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

  return products.filter((p) => {
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
        if (typeof raw !== 'number') return false
        const min = numberMin[facet.key]
        const max = numberMax[facet.key]
        if (min != null && raw < min) return false
        if (max != null && raw > max) return false
      }
    }

    return true
  })
})


</script>

