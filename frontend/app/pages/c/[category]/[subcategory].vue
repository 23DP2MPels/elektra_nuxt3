<template>
  <main>
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/')">Galvenā</NuxtLink>
      <span> / </span>
      <NuxtLink :to="localePath(`/c/${categorySlug}`)">{{ categoryName }}</NuxtLink>
      <span> / </span>
      <span>{{ subcategoryName }}</span>
    </div>

    <div v-if="loading" class="loading">Ielādē preces...</div>
    <div v-else-if="isNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <h2>{{ $t('networkError.title') }}</h2>
      <p>{{ $t('networkError.message') }}</p>
      <button @click="retryLoad" class="retry-btn">{{ $t('networkError.retry') }}</button>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="categoryName && subcategoryName">
      <div class="page-header">
        <h1>{{ displayCategoryName }} / {{ displaySubcategoryName }}</h1>
        <p class="product-count">Atrastas preces: {{ filteredProducts.length }} no {{ products.length }}</p>
      </div>

      <div class="content-grid">
        <aside class="filters-sidebar">
          <div class="filters-card">
            <h2>Filtri</h2>

            <div class="filter-group">
              <label class="filter-label">
                Meklēt precēs:
                <input v-model="localQuery" type="search" placeholder="Ievadiet nosaukumu vai parametru..." class="search-input" />
              </label>
            </div>

            <div v-if="facets.length" class="facets-list">
              <div v-for="facet in facets" :key="facet.key" class="facet-item">
                <template v-if="facet.kind === 'enum'">
                  <label class="facet-label">{{ facetName(facet.key) }}:</label>
                  <select v-model="enumFilters[facet.key]" class="facet-select">
                    <option value="">Visi</option>
                    <option v-for="v in facet.values" :key="v" :value="v">{{ v }}</option>
                  </select>
                </template>

                <template v-if="facet.kind === 'boolean'">
                  <label class="facet-label">{{ facetName(facet.key) }}:</label>
                  <select v-model="booleanFilters[facet.key]" class="facet-select">
                    <option value="">Visi</option>
                    <option value="true">Jā</option>
                    <option value="false">Nē</option>
                  </select>
                </template>

                <template v-else-if="facet.kind === 'number'">
                  <div class="number-facet">
                    <strong class="facet-label">{{ facetName(facet.key) }}</strong>
                    <div class="number-inputs">
                      <div class="input-group">
                        <label class="input-label">No:</label>
                        <input v-model.number="numberMin[facet.key]" type="number" :placeholder="String(facet.min)" class="number-input" />
                      </div>
                      <div class="input-group">
                        <label class="input-label">Līdz:</label>
                        <input v-model.number="numberMax[facet.key]" type="number" :placeholder="String(facet.max)" class="number-input" />
                      </div>
                    </div>
                    <div class="range-info">Diapazons: {{ facet.min }} – {{ facet.max }}</div>
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
                <NuxtLink :to="localePath(`/p/${p.id}`)" class="product-link">
                  <div class="product-image-container">
                    <img :src="getProductImage(p)" :alt="p.image_alt || p.name" class="product-preview" @error="onImageError" />
                  </div>
                  <h3 class="product-name">{{ p.name }}</h3>
                  <div class="product-price-range">
                    <strong>Cena</strong>
                    <span>no {{ formatPrice(p.price_min) }} līdz {{ formatPrice(p.price_max) }}</span>
                  </div>
                  <div class="product-specs">
                    <div v-for="[key, value] in Object.entries(p.specs ?? {}).slice(0, 3)" :key="key" class="spec-item">
                      <span class="spec-key">{{ key }}:</span>
                      <span class="spec-value">{{ String(value) }}</span>
                    </div>
                  </div>
                </NuxtLink>
                <button @click="toggleCompare(p.id)" class="compare-btn" :class="{ active: isInCompare(p.id) }">
                  {{ isInCompare(p.id) ? 'Izņemt no salīdzināšanas' : 'Salīdzināt' }}
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="no-products">
              <p v-if="products.length">Nav preču, kas atbilstu izvēlētajiem filtriem.</p>
              <p v-else">Šajā apakškategorijā pašlaik nav preču.</p>
            </div>
          </template>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="error-card">
        <h1>Apakškategorija nav atrasta</h1>
        <p>Kategorija: {{ categorySlug }}</p>
        <p>Apakškategorija: {{ subcategorySlug }}</p>
        <NuxtLink :to="localePath('/')" class="back-link">Atgriezties uz sākumlapu</NuxtLink>
      </div>
    </template>

    <div v-if="compareList.length" class="compare-tray">
      <div class="compare-items">
        <div v-for="item in compareList" :key="item.id" class="compare-item">
          <img :src="item.image_url || getProductImage(item)" :alt="item.image_alt || item.name" />
        </div>
        <span class="compare-summary">Izvēlētas {{ compareList.length }} no {{ compareCountLimit }} precēm</span>
      </div>
      <div class="compare-actions">
        <button class="compare-open-btn" @click="openCompareModal" :disabled="compareList.length < 2">
          Salīdzināt izvēlēto
        </button>
        <button class="compare-clear-btn" @click="clearCompare">Notīrīt</button>
      </div>
      <p v-if="compareError" class="compare-error">{{ compareError }}</p>
    </div>

    <div v-if="compareModalOpen" class="compare-modal-backdrop" @click.self="closeCompareModal">
      <div class="compare-modal">
        <div class="compare-modal-header">
          <h2>Preču salīdzināšana</h2>
          <button class="close-modal" @click="closeCompareModal">×</button>
        </div>
        <div class="compare-modal-thumbs">
          <div v-for="item in compareList" :key="item.id" class="compare-modal-thumb">
            <img :src="item.image_url || getProductImage(item)" :alt="item.image_alt || item.name" />
            <span>{{ item.name }}</span>
          </div>
        </div>
        <div class="compare-table-container">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Parametrs</th>
                <th v-for="item in compareList" :key="item.id">{{ item.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="price-compare-row">
                <td class="spec-key">Cenas diapazons</td>
                <td v-for="item in compareList" :key="item.id" class="spec-value price-range-cell">
                  no {{ formatPrice(item.price_min) }} līdz {{ formatPrice(item.price_max) }}
                </td>
              </tr>
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
import { ref, computed, reactive, watchEffect, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'
const localePath = useLocalePath()

const { locale } = useI18n()
const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

const route = useRoute()
const categorySlug = computed(() => String(route.params.category || ''))
const subcategorySlug = computed(() => String(route.params.subcategory || ''))

const products = ref<Array<{ id: string; name: string; category_slug: string; category_name: unknown; subcategory_slug: string; subcategory_name: unknown; specs_json: string; specs: Record<string, any>; price_min?: number; price_max?: number }>>([])
const categoryName = ref('')
const subcategoryName = ref('')
const loading = ref(true)
const error = ref('')
const isNetworkError = ref(false)

const url = computed(
  () => `/api/products?category=${encodeURIComponent(categorySlug.value)}&subcategory=${encodeURIComponent(subcategorySlug.value)}&limit=200`
)
const { data, pending, error: fetchError, refresh } = await useFetch(url)

watchEffect(() => {
  if (data.value) {
    products.value = data.value ?? []
    if (products.value.length) {
      categoryName.value = localLabel(products.value[0].category_name)
      subcategoryName.value = localLabel(products.value[0].subcategory_name)
    }
    isNetworkError.value = false
  }
  if (fetchError.value) {
    const errorMessage = String(fetchError.value.message || fetchError.value.statusMessage || 'Neizdevās ielādēt preces')
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch') || !navigator.onLine) {
      isNetworkError.value = true
      error.value = ''
    } else {
      error.value = errorMessage
      isNetworkError.value = false
    }
  }
  loading.value = Boolean(pending.value)
})

function retryLoad() {
  isNetworkError.value = false
  error.value = ''
  refresh()
}

const displayCategoryName = computed(() => categoryName.value || 'Ielādē...')
const displaySubcategoryName = computed(() => subcategoryName.value || 'Ielādē...')

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

function getProductImage(p: any) {
  if (p.image_url) return p.image_url
  const subcatSlug = p.subcategory_slug || ''
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
  return new Intl.NumberFormat('lv-LV', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(cents / 100)
}

const compareKey = computed(() => `compare_${categorySlug.value}`)

const compareList = ref<any[]>([])

const allCompareSpecs = computed(() => {
  const specs = new Set<string>()
  compareList.value.forEach((item) => {
    Object.keys(item.specs ?? {}).forEach((key) => specs.add(key))
  })
  return Array.from(specs).sort()
})

function loadCompare() {
  const stored = localStorage.getItem(compareKey.value)
  if (stored) {
    try {
      compareList.value = JSON.parse(stored).slice(0, compareCountLimit)
    } catch {
      compareList.value = []
    }
  }
}

function saveCompare() {
  localStorage.setItem(compareKey.value, JSON.stringify(compareList.value))
}

function toggleCompare(productId: string) {
  const existing = compareList.value.find(p => p.id === productId)
  if (existing) {
    compareList.value = compareList.value.filter(p => p.id !== productId)
    compareError.value = ''
  } else {
    if (compareList.value.length >= compareCountLimit) {
      compareError.value = `Maksimāli var izvēlēties līdz ${compareCountLimit} precēm salīdzināšanai.`
      return
    }
    const product = parsedProducts.value.find(p => p.id === productId)
    if (product) {
      compareList.value.push(product)
      compareError.value = ''
    }
  }
  saveCompare()
}

function isInCompare(productId: string) {
  return compareList.value.some(p => p.id === productId)
}

const compareCountLimit = 5
const compareModalOpen = ref(false)
const compareError = ref('')

function openCompareModal() {
  if (compareList.value.length < 2) {
    compareError.value = 'Izvēlieties vismaz divas preces, lai salīdzinātu.'
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
  saveCompare()
}

onMounted(() => {
  loadCompare()
})

const facetNameMap: Record<string, string> = {
  battery_hours: 'Akumulatora darbības laiks (st.)',
  battery_mah: 'Akumulatora ietilpība (mAh)',
  battery_wh: 'Akumulatora ietilpība (Wh)',
  screen_inch: 'Ekrāna diagonāle (collas)',
  ram_gb: 'Operatīvā atmiņa (GB)',
  storage_gb: 'Iebūvētā atmiņa (GB)',
  weight_g: 'Svars (g)',
  weight_kg: 'Svars (kg)',
  power_w: 'Jauda (W)',
  resolution: 'Ekrāna izšķirtspēja',
  refresh_hz: 'Ekrāna atsvaidzes intensitāte (Hz)',
  age: 'Vecums',
  height_cm: 'Augstums (cm)',
}

function facetName(key: string): string {
  return facetNameMap[key] || key
}
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
  align-self: start;
  /* Atsevišķs ritināšanas apgabals filtriem neatkarīgi no lapas */
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

.filters-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  overflow-y: auto; /* Aktivizē iekšējo ritjoslu filtriem */
}

.filters-card h2 {
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: #111827;
  font-size: 1.35rem;
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
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.facet-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
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
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-label {
  min-width: 30px;
  font-size: 0.9rem;
  color: #374151;
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
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  position: relative;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.product-link {
  display: block;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
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

.price-compare-row {
  background: #f0fdf4;
}

.price-range-cell {
  font-weight: bold;
  color: #16a34a !important;
}

.compare-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  background: #2f5f9b;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s ease;
}

.compare-btn:hover {
  background: #1f4770;
}

.compare-btn.active {
  background: #c00;
}

.product-image-container {
  width: 100%;
  height: 200px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: -1.5rem -1.5rem 1rem -1.5rem;
}

.product-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-price-range {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.95rem;
  color: #334155;
}

.product-price-range strong {
  font-weight: 700;
  color: #111827;
}

.product-name {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #111827;
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
  color: #475569;
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
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
  border-radius: 0.85rem;
  padding: 1rem;
  text-align: center;
}

.error-card {
  text-align: center;
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
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

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    max-height: none;
  }

  .filters-card {
    overflow-y: visible;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
