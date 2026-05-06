<template>
  <main>
    <div class="breadcrumb">
      <NuxtLink to="/">Главная</NuxtLink>
      <span> / </span>
      <NuxtLink :to="`/c/${categorySlug}`">{{ categoryName }}</NuxtLink>
      <span> / </span>
      <span>{{ subcategoryName }}</span>
    </div>

    <div v-if="loading" class="loading">Загрузка товаров...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="categoryName && subcategoryName">
      <div class="page-header">
        <h1>{{ categoryName }} / {{ subcategoryName }}</h1>
        <p class="product-count">Найдено товаров: {{ filteredProducts.length }} из {{ products.length }}</p>
      </div>

      <div class="content-grid">
        <aside class="filters-sidebar">
          <div class="filters-card">
            <h2>Фильтры</h2>

            <div class="filter-group">
              <label class="filter-label">
                Поиск в товарах:
                <input v-model="localQuery" type="search" placeholder="Введите название или характеристику..." class="search-input" />
              </label>
            </div>

            <div v-if="facets.length" class="facets-list">
              <div v-for="facet in facets" :key="facet.key" class="facet-item">
                <template v-if="facet.kind === 'enum'">
                  <label class="facet-label">{{ facet.key }}:</label>
                  <select v-model="enumFilters[facet.key]" class="facet-select">
                    <option value="">Все</option>
                    <option v-for="v in facet.values" :key="v" :value="v">{{ v }}</option>
                  </select>
                </template>

                <template v-else-if="facet.kind === 'boolean'">
                  <label class="facet-label">{{ facet.key }}:</label>
                  <select v-model="booleanFilters[facet.key]" class="facet-select">
                    <option value="">Все</option>
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
                </template>

                <template v-else-if="facet.kind === 'number'">
                  <div class="number-facet">
                    <strong class="facet-label">{{ facet.key }}</strong>
                    <div class="number-inputs">
                      <label>
                        От:
                        <input v-model.number="numberMin[facet.key]" type="number" :placeholder="String(facet.min)" class="number-input" />
                      </label>
                      <label>
                        До:
                        <input v-model.number="numberMax[facet.key]" type="number" :placeholder="String(facet.max)" class="number-input" />
                      </label>
                    </div>
                    <div class="range-info">Диапазон: {{ facet.min }} – {{ facet.max }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </aside>

        <section class="products-section">
          <template v-if="filteredProducts.length">
            <div class="products-grid">
              <div v-for="p in filteredProducts" :key="p.id" class="product-card">
                <NuxtLink :to="`/p/${p.id}`" class="product-link">
                  <h3 class="product-name">{{ p.name }}</h3>
                  <div class="product-specs">
                    <div v-for="[key, value] in Object.entries(p.specs ?? {}).slice(0, 3)" :key="key" class="spec-item">
                      <span class="spec-key">{{ key }}:</span>
                      <span class="spec-value">{{ String(value) }}</span>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="no-products">
              <p v-if="products.length">Нет товаров, соответствующих фильтрам.</p>
              <p v-else>В этой подкатегории пока нет товаров.</p>
            </div>
          </template>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="error-card">
        <h1>Подкатегория не найдена</h1>
        <p>Категория: {{ categorySlug }}</p>
        <p>Подкатегория: {{ subcategorySlug }}</p>
        <NuxtLink to="/" class="back-link">Вернуться на главную</NuxtLink>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => String(route.params.category || ''))
const subcategorySlug = computed(() => String(route.params.subcategory || ''))

const products = ref<Array<{ id: string; name: string; category_slug: string; category_name: string; subcategory_slug: string; subcategory_name: string; specs_json: string; specs: Record<string, any> }>>([])
const categoryName = ref('')
const subcategoryName = ref('')
const loading = ref(true)
const error = ref('')

const url = computed(
  () => `/api/products?category=${encodeURIComponent(categorySlug.value)}&subcategory=${encodeURIComponent(subcategorySlug.value)}&limit=200`
)
const { data, pending, error: fetchError } = await useFetch(url)

watchEffect(() => {
  if (data.value) {
    products.value = data.value ?? []
    if (products.value.length) {
      categoryName.value = products.value[0].category_name
      subcategoryName.value = products.value[0].subcategory_name
    }
  }
  if (fetchError.value) {
    error.value = String(fetchError.value.message || fetchError.value.statusMessage || 'Failed to load products')
  }
  loading.value = Boolean(pending.value)
})

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

const parsedProducts = computed(() => {
  return products.value.map((p) => {
    let specs: Record<string, any> = {}
    if (p.specs && typeof p.specs === 'object') {
      specs = p.specs
    } else if (typeof p.specs_json === 'string' && p.specs_json.trim()) {
      try {
        specs = JSON.parse(p.specs_json)
      } catch {
        specs = {}
      }
    }
    return {
      ...p,
      specs,
    }
  })
})

const facets = computed(() => {
  const list = parsedProducts.value
  if (!list.length) return []

  const keyToValues = new Map<string, unknown[]>()
  for (const p of list) {
    for (const [k, v] of Object.entries(p.specs ?? {})) {
      if (!keyToValues.has(k)) keyToValues.set(k, [])
      keyToValues.get(k)!.push(v)
    }
  }

  const out: Array<{ key: string; kind: 'enum' | 'boolean' | 'number'; values?: string[]; min?: number; max?: number }> = []
  const keys = Array.from(keyToValues.keys()).sort((a, b) => a.localeCompare(b))

  for (const key of keys) {
    const values = keyToValues.get(key) ?? []
    const kinds = new Set(values.map(toKind))

    if (kinds.size > 1) {
      const enumValues = Array.from(new Set(values.map((v) => String(v)))).sort()
      if (enumValues.length && enumValues.length <= 20) out.push({ key, kind: 'enum', values: enumValues })
      continue
    }

    const kind = kinds.values().next().value as 'boolean' | 'number' | 'string'
    if (kind === 'boolean') {
      out.push({ key, kind: 'boolean' })
      continue
    }

    if (kind === 'number') {
      const nums = values.filter((v) => typeof v === 'number') as number[]
      if (!nums.length) continue
      out.push({ key, kind: 'number', min: Math.min(...nums), max: Math.max(...nums) })
      continue
    }

    const enumValues = Array.from(new Set(values.map((v) => String(v)))).sort()
    if (enumValues.length && enumValues.length <= 20) {
      out.push({ key, kind: 'enum', values: enumValues })
    }
  }

  return out
})

const filteredProducts = computed(() => {
  const q = localQuery.value.trim().toLowerCase()
  const list = parsedProducts.value

  return list.filter((p) => {
    if (q) {
      const inName = p.name.toLowerCase().includes(q)
      const inSpecs = Object.values(p.specs ?? {}).some((v) => String(v).toLowerCase().includes(q))
      if (!inName && !inSpecs) return false
    }

    for (const facet of facets.value) {
      const raw = (p.specs ?? {})[facet.key]

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
        if (typeof raw !== 'number') {
          if (min != null || max != null) return false
          continue
        }
        if (min != null && raw < min) return false
        if (max != null && raw > max) return false
      }
    }

    return true
  })
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 2rem;
  color: #64748b;
}

.breadcrumb a {
  color: #2f5f9b;
}

.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 2rem 0;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #2f5f9b, #1f4770);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.product-count {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
}

.filters-sidebar {
  position: sticky;
  top: 2rem;
}

.filters-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  padding: 1.5rem;
}

.filters-card h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #1f2a43;
  font-size: 1.4rem;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d5dde8;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: #f8faff;
}

.facets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.facet-item {
  padding: 1rem;
  background: #f8faff;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

.facet-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.facet-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d5dde8;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 0.9rem;
}

.number-facet {
  width: 100%;
}

.number-inputs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.number-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d5dde8;
  border-radius: 0.5rem;
  background: #fff;
  font-size: 0.9rem;
}

.range-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.products-section {
  min-height: 500px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(33, 77, 124, 0.12);
}

.product-link {
  display: block;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
}

.product-name {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #1f2a43;
  line-height: 1.3;
}

.product-specs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-key {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.85rem;
}

.spec-value {
  color: #374151;
  font-size: 0.85rem;
  text-align: right;
}

.no-products {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
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
  .content-grid {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>

