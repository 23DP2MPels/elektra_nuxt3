<template>
  <main>
    <p><NuxtLink :to="localePath('/account')">← Back to account</NuxtLink></p>
    <h1>Admin panel</h1>

    <div v-if="loading">Loading admin data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="admin-grid">
        <section class="section-card">
          <h2>Categories</h2>
          <p v-if="categories.length === 0">No categories yet.</p>
          <ul v-else>
            <li v-for="cat in categories" :key="cat.category_slug + cat.subcategory_slug">
              <strong>{{ localLabel(cat.category_name) }}</strong> / {{ localLabel(cat.subcategory_name) }} — {{ cat.productCount }} products
            </li>
          </ul>
          <p><button @click="loadAdminData" :disabled="loading">Refresh categories</button></p>
        </section>

        <section class="section-card">
          <h2>Initialize Prices</h2>
          <p>Generate prices for all products in all stores</p>
          <p>
            <button @click="initializeAllPrices" :disabled="initializingPrices">
              {{ initializingPrices ? 'Initializing...' : 'Initialize All Prices' }}
            </button>
          </p>
          <p v-if="initializePricesMessage" class="message">{{ initializePricesMessage }}</p>
        </section>

        <section class="section-card">
        <h2>{{ selectedProductId ? 'Edit product' : 'Add product' }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-row">
            <div class="form-field">
              <label>Product ID</label>
              <input v-model="form.id" placeholder="leave empty to generate new" />
            </div>
            <div class="form-field">
              <label>Name</label>
              <input v-model="form.name" required />
            </div>
          </div>
          <div class="form-field">
            <label>Image URL / path</label>
            <input v-model="form.image_url" placeholder="/img/product_img_placeholder/gamepad.png" />
          </div>
          <p class="note" style="visibility:hidden">
            Выберите категорию и подкатегорию из уже созданных.
            <button type="button" class="link-button" @click="useExistingCategory.value = !useExistingCategory.value">
              {{ useExistingCategory.value ? 'Создать новую категорию/подкатегорию' : 'Выбрать из существующих' }}
            </button>
          </p>

          <template v-if="useExistingCategory.value">
            <div class="form-row">
              <div class="form-field">
                <label>Category</label>
                <select v-model="selectedCategorySlug.value" required>
                  <option value="" disabled>Select category</option>
                  <option v-for="cat in categoryOptions" :key="cat.category_slug" :value="cat.category_slug">
                    {{ localLabel(cat.category_name) }} ({{ cat.category_slug }})
                  </option>
                </select>
              </div>
              <div class="form-field">
                <label>Subcategory</label>
                <select v-model="form.subcategory_slug" required>
                  <option value="" disabled>Select subcategory</option>
                  <option v-for="sub in subcategoryOptions" :key="sub.subcategory_slug" :value="sub.subcategory_slug">
                    {{ localLabel(sub.subcategory_name) }} ({{ sub.subcategory_slug }})
                  </option>
                </select>
              </div>
            </div>
            <div class="translations-preview">
              <div class="translation-column">
                <h3>Category translations</h3>
                <p>EN: {{ form.category_name_en || form.category_name }}</p>
                <p>RU: {{ form.category_name_ru || form.category_name }}</p>
                <p>LV: {{ form.category_name_lv || form.category_name }}</p>
              </div>
              <div class="translation-column">
                <h3>Subcategory translations</h3>
                <p>EN: {{ form.subcategory_name_en || form.subcategory_name }}</p>
                <p>RU: {{ form.subcategory_name_ru || form.subcategory_name }}</p>
                <p>LV: {{ form.subcategory_name_lv || form.subcategory_name }}</p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="form-row">
              <div class="form-field">
                <label>Category slug</label>
                <input v-model="form.category_slug" required />
              </div>
              <div class="form-field">
                <label>Category name (EN)</label>
                <input v-model="form.category_name_en" />
              </div>
              <div class="form-field">
                <label>Category name (RU)</label>
                <input v-model="form.category_name_ru" />
              </div>
              <div class="form-field">
                <label>Category name (LV)</label>
                <input v-model="form.category_name_lv" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Subcategory slug</label>
                <input v-model="form.subcategory_slug" required />
              </div>
              <div class="form-field">
                <label>Subcategory name (EN)</label>
                <input v-model="form.subcategory_name_en" />
              </div>
              <div class="form-field">
                <label>Subcategory name (RU)</label>
                <input v-model="form.subcategory_name_ru" />
              </div>
              <div class="form-field">
                <label>Subcategory name (LV)</label>
                <input v-model="form.subcategory_name_lv" />
              </div>
            </div>
          </template>
          <div class="form-field">
            <label>Specs (JSON)</label>
            <textarea v-model="form.specs_json" rows="8" required />
          </div>
          <p>
            <button type="submit" :disabled="saving">Save product</button>
            <button type="button" @click="resetForm" :disabled="saving">Reset</button>
          </p>
          <p v-if="message" class="message">{{ message }}</p>
        </form>
      </section>

      <section class="section-card">
        <h2>Products</h2>
        <p v-if="products.length === 0">No products available.</p>
        <div v-else class="products-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td><img :src="product.image_url || '/img/product_img_placeholder/default.png'" :alt="product.name" class="product-thumb" @error="onImageError" /></td>
                <td>{{ product.name }}</td>
                <td>{{ localLabel(product.category_name) }} ({{ product.category_slug }})</td>
                <td>{{ localLabel(product.subcategory_name) }} ({{ product.subcategory_slug }})</td>
                <td>
                  <button @click="selectProduct(product)">Edit</button>
                  <button @click="deleteProduct(product.id)" :disabled="saving">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'
const localePath = useLocalePath()
const { locale } = useI18n()
const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const categories = ref<Array<{ category_slug: string; category_name: unknown; subcategory_slug: string; subcategory_name: unknown; productCount: number }>>([])
const products = ref<Array<{ id: string; name: string; category_slug: string; category_name: unknown; subcategory_slug: string; subcategory_name: unknown; specs_json: string; image_url?: string }>>([])

const selectedProductId = ref<string | null>(null)
const useExistingCategory = ref(true)
const selectedCategorySlug = ref('')
const initializingPrices = ref(false)
const initializePricesMessage = ref('')
const form = reactive({
  id: '',
  name: '',
  category_slug: '',
  category_name: '',
  category_name_en: '',
  category_name_ru: '',
  category_name_lv: '',
  subcategory_slug: '',
  subcategory_name: '',
  subcategory_name_en: '',
  subcategory_name_ru: '',
  subcategory_name_lv: '',
  image_url: '',
  specs_json: '{}',
})

const categoriesBySlug = computed(() => {
  const map = new Map<string, { category_name: unknown; subcategories: Array<{ subcategory_slug: string; subcategory_name: unknown }> }>()
  for (const item of categories.value) {
    if (!map.has(item.category_slug)) {
      map.set(item.category_slug, { category_name: item.category_name, subcategories: [] })
    }
    const entry = map.get(item.category_slug)!
    if (!entry.subcategories.some((s) => s.subcategory_slug === item.subcategory_slug)) {
      entry.subcategories.push({ subcategory_slug: item.subcategory_slug, subcategory_name: item.subcategory_name })
    }
  }
  return map
})

const categoryOptions = computed(() => {
  return Array.from(categoriesBySlug.value.entries()).map(([slug, entry]) => ({
    category_slug: slug,
    category_name: entry.category_name,
    subcategories: entry.subcategories,
  }))
})

const subcategoryOptions = computed(() => {
  const category = categoriesBySlug.value.get(selectedCategorySlug.value)
  return category?.subcategories ?? []
})

watch(selectedCategorySlug, (value) => {
  const category = categoriesBySlug.value.get(value)
  if (category) {
    form.category_slug = value
    form.category_name = localLabel(category.category_name)
    form.category_name_en = typeof category.category_name === 'object' ? String(category.category_name.en || '') : ''
    form.category_name_ru = typeof category.category_name === 'object' ? String(category.category_name.ru || '') : ''
    form.category_name_lv = typeof category.category_name === 'object' ? String(category.category_name.lv || '') : ''

    if (!subcategoryOptions.value.length) {
      form.subcategory_slug = ''
      form.subcategory_name = ''
      form.subcategory_name_en = ''
      form.subcategory_name_ru = ''
      form.subcategory_name_lv = ''
    } else if (!subcategoryOptions.value.some((s) => s.subcategory_slug === form.subcategory_slug)) {
      form.subcategory_slug = subcategoryOptions.value[0].subcategory_slug
      form.subcategory_name = localLabel(subcategoryOptions.value[0].subcategory_name)
      form.subcategory_name_en = typeof subcategoryOptions.value[0].subcategory_name === 'object' ? String(subcategoryOptions.value[0].subcategory_name.en || '') : ''
      form.subcategory_name_ru = typeof subcategoryOptions.value[0].subcategory_name === 'object' ? String(subcategoryOptions.value[0].subcategory_name.ru || '') : ''
      form.subcategory_name_lv = typeof subcategoryOptions.value[0].subcategory_name === 'object' ? String(subcategoryOptions.value[0].subcategory_name.lv || '') : ''
    }
  }
})

watch(() => form.subcategory_slug, (value) => {
  const category = categoriesBySlug.value.get(selectedCategorySlug.value)
  if (!category) return
  const selected = category.subcategories.find((s) => s.subcategory_slug === value)
  if (selected) {
    form.subcategory_name = localLabel(selected.subcategory_name)
    form.subcategory_name_en = typeof selected.subcategory_name === 'object' ? String(selected.subcategory_name.en || '') : ''
    form.subcategory_name_ru = typeof selected.subcategory_name === 'object' ? String(selected.subcategory_name.ru || '') : ''
    form.subcategory_name_lv = typeof selected.subcategory_name === 'object' ? String(selected.subcategory_name.lv || '') : ''
  }
})

async function loadAdminData() {
  loading.value = true
  error.value = ''
  try {
    const [catData, prodData] = await Promise.all([
      $fetch<{ categories: Array<any> }>('/api/admin/categories', { credentials: 'include' }),
      $fetch<{ products: Array<any> }>('/api/admin/products', { credentials: 'include' }),
    ])
    categories.value = catData.categories
        products.value = prodData.products
    if (categoryOptions.value.length && !selectedCategorySlug.value) {
      selectedCategorySlug.value = categoryOptions.value[0].category_slug
      useExistingCategory.value = true
    }
  } catch (e: any) {
    error.value = String(e?.statusMessage || e?.message || 'Cannot load admin data')
  } finally {
    loading.value = false
  }
}

async function initializeAllPrices() {
  initializingPrices.value = true
  initializePricesMessage.value = ''
  try {
    const result = await $fetch<any>('/api/admin/prices/init-all', {
      method: 'POST',
      credentials: 'include',
    })
    initializePricesMessage.value = `✓ Success! Initialized ${result.initialized_prices} prices for ${result.products_count} products across ${result.stores_count} stores.`
  } catch (e: any) {
    initializePricesMessage.value = `✗ Error: ${String(e?.statusMessage || e?.message || 'Failed to initialize prices')}`
  } finally {
    initializingPrices.value = false
  }
}

function selectProduct(product: any) {
  selectedProductId.value = product.id
  form.id = product.id
  form.name = product.name
  form.category_slug = product.category_slug
  form.category_name = localLabel(product.category_name)
  form.category_name_en = typeof product.category_name === 'object' ? String(product.category_name.en || '') : ''
  form.category_name_ru = typeof product.category_name === 'object' ? String(product.category_name.ru || '') : ''
  form.category_name_lv = typeof product.category_name === 'object' ? String(product.category_name.lv || '') : ''
  form.subcategory_slug = product.subcategory_slug
  form.subcategory_name = localLabel(product.subcategory_name)
  form.subcategory_name_en = typeof product.subcategory_name === 'object' ? String(product.subcategory_name.en || '') : ''
  form.subcategory_name_ru = typeof product.subcategory_name === 'object' ? String(product.subcategory_name.ru || '') : ''
  form.subcategory_name_lv = typeof product.subcategory_name === 'object' ? String(product.subcategory_name.lv || '') : ''
  form.image_url = product.image_url || ''
  form.specs_json = product.specs_json || '{}'
  selectedCategorySlug.value = product.category_slug
  useExistingCategory.value = true
}

function resetForm() {
  selectedProductId.value = null
  form.id = ''
  form.name = ''
  form.category_slug = ''
  form.category_name = ''
  form.category_name_en = ''
  form.category_name_ru = ''
  form.category_name_lv = ''
  form.subcategory_slug = ''
  form.subcategory_name = ''
  form.subcategory_name_en = ''
  form.subcategory_name_ru = ''
  form.subcategory_name_lv = ''
  form.image_url = ''
  form.specs_json = '{}'
  selectedCategorySlug.value = ''
  useExistingCategory.value = categoryOptions.value.length > 0
  message.value = ''
}

function buildLocalizedLabelObject(value: string, en: string, ru: string, lv: string) {
  const localized: Record<string, string> = {}
  if (en?.trim()) localized.en = en.trim()
  if (ru?.trim()) localized.ru = ru.trim()
  if (lv?.trim()) localized.lv = lv.trim()
  if (Object.keys(localized).length) return localized
  return value?.trim() || ''
}

async function saveProduct() {
  saving.value = true
  message.value = ''
  const categoryNameValue = buildLocalizedLabelObject(
    form.category_name,
    form.category_name_en,
    form.category_name_ru,
    form.category_name_lv,
  )
  const subcategoryNameValue = buildLocalizedLabelObject(
    form.subcategory_name,
    form.subcategory_name_en,
    form.subcategory_name_ru,
    form.subcategory_name_lv,
  )
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id: form.id,
        name: form.name,
        category_slug: form.category_slug,
        category_name: categoryNameValue,
        subcategory_slug: form.subcategory_slug,
        subcategory_name: subcategoryNameValue,
        image_url: form.image_url,
        specs_json: form.specs_json,
      },
      credentials: 'include',
    })
    message.value = 'Saved successfully'
    await loadAdminData()
  } catch (e: any) {
    message.value = String(e?.statusMessage || e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

async function deleteProduct(productId: string) {
  saving.value = true
  message.value = ''
  try {
    await $fetch(`/api/admin/products/${productId}`, { method: 'DELETE', credentials: 'include' })
    message.value = 'Product deleted'
    resetForm()
    await loadAdminData()
  } catch (e: any) {
    message.value = String(e?.statusMessage || e?.message || 'Delete failed')
  } finally {
    saving.value = false
  }
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/img/product_img_placeholder/default.png'
}

await loadAdminData()
</script>

<style scoped>
.error {
  color: #c00;
}
.message {
  color: #060;
}
.products-container {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ddd;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 0.4rem;
  text-align: left;
}
button {
  margin-right: 0.5rem;
}
  button {
    margin-right: 0.5rem;
    padding: 0.65rem 1rem;
    border: 1px solid #2f5f9b;
    background: #2f5f9b;
    color: #fff;
    border-radius: 0.45rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  button:hover:not(:disabled) {
    background: #1f4770;
  }

  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .link-button {
    background: none;
    color: #2f5f9b;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.95rem;
  }

  .note {
    margin-bottom: 1rem;
    color: #444;
    font-size: 0.95rem;
  }

  .section-card {
    background: #fff;
    border: 1px solid #e0e6ef;
    box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .admin-grid {
    display: grid;
    gap: 1.5rem;
  }

  .admin-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .translations-preview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding: 1rem;
    background: #f8faff;
    border: 1px solid #d5dde8;
    border-radius: 0.75rem;
  }

  .translation-column h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    color: #1f2937;
  }

  .translation-column p {
    margin: 0.25rem 0;
    color: #475569;
    font-size: 0.95rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
  }

  .form-field label {
    margin-bottom: 0.35rem;
    font-weight: 600;
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 0.9rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d5dde8;
    background: #f8faff;
    box-sizing: border-box;
    font-size: 1rem;
  }

  .form-field textarea {
    width: 100%;
    font-family: inherit;
  }

  .products-container {
    max-height: 55vh;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 1rem;
    background: #fafbff;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #eef2f7;
    padding: 0.85rem 0.9rem;
    text-align: left;
  }

  tr:last-child td {
    border-bottom: none;
  }

  th {
    background: #f2f6ff;
    font-weight: 700;
  }

  .message {
    color: #0a6b36;
    margin-top: 0.75rem;
  }

  .error {
    color: #c00;
  }

.product-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
