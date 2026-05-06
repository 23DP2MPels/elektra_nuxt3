<template>
  <main>
    <p><NuxtLink to="/account">← Back to account</NuxtLink></p>
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
              <strong>{{ cat.category_name }}</strong> / {{ cat.subcategory_name }} — {{ cat.productCount }} products
            </li>
          </ul>
          <p><button @click="loadAdminData" :disabled="loading">Refresh categories</button></p>
        </section>

        <section class="section-card">
        <h2>{{ selectedProductId ? 'Edit product' : 'Add product' }}</h2>
        <form @submit.prevent="saveProduct">
          <p>
            <label>Product ID</label><br />
            <input v-model="form.id" placeholder="leave empty to generate new" />
          </p>
          <p>
            <label>Name</label><br />
            <input v-model="form.name" required />
          </p>
          <p class="note">
            Выберите категорию и подкатегорию из уже созданных.
            <button type="button" class="link-button" @click="useExistingCategory.value = !useExistingCategory.value">
              {{ useExistingCategory.value ? 'Создать новую категорию/подкатегорию' : 'Выбрать из существующих' }}
            </button>
          </p>

          <template v-if="useExistingCategory.value">
            <p>
              <label>Category</label><br />
              <select v-model="selectedCategorySlug.value" required>
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryOptions" :key="cat.category_slug" :value="cat.category_slug">
                  {{ cat.category_name }} ({{ cat.category_slug }})
                </option>
              </select>
            </p>
            <p>
              <label>Subcategory</label><br />
              <select v-model="form.subcategory_slug" required>
                <option value="" disabled>Select subcategory</option>
                <option v-for="sub in subcategoryOptions" :key="sub.subcategory_slug" :value="sub.subcategory_slug">
                  {{ sub.subcategory_name }} ({{ sub.subcategory_slug }})
                </option>
              </select>
            </p>
            <input type="hidden" :value="form.category_slug" />
            <input type="hidden" :value="form.category_name" />
          </template>

          <template v-else>
            <p>
              <label>Category slug</label><br />
              <input v-model="form.category_slug" required />
            </p>
            <p>
              <label>Category name</label><br />
              <input v-model="form.category_name" required />
            </p>
            <p>
              <label>Subcategory slug</label><br />
              <input v-model="form.subcategory_slug" required />
            </p>
            <p>
              <label>Subcategory name</label><br />
              <input v-model="form.subcategory_name" required />
            </p>
          </template>
          <p>
            <label>Specs (JSON)</label><br />
            <textarea v-model="form.specs_json" rows="8" required />
          </p>
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
                <th>Product</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>{{ product.name }}</td>
                <td>{{ product.category_name }} ({{ product.category_slug }})</td>
                <td>{{ product.subcategory_name }} ({{ product.subcategory_slug }})</td>
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

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const categories = ref<Array<{ category_slug: string; category_name: string; subcategory_slug: string; subcategory_name: string; productCount: number }>>([])
const products = ref<Array<{ id: string; name: string; category_slug: string; category_name: string; subcategory_slug: string; subcategory_name: string; specs_json: string }>>([])

const selectedProductId = ref<string | null>(null)
const useExistingCategory = ref(true)
const selectedCategorySlug = ref('')
const form = reactive({
  id: '',
  name: '',
  category_slug: '',
  category_name: '',
  subcategory_slug: '',
  subcategory_name: '',
  specs_json: '{}',
})

const categoriesBySlug = computed(() => {
  const map = new Map<string, { category_name: string; subcategories: Array<{ subcategory_slug: string; subcategory_name: string }> }>()
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
    form.category_name = category.category_name
    if (!subcategoryOptions.value.length) {
      form.subcategory_slug = ''
      form.subcategory_name = ''
    } else if (!subcategoryOptions.value.some((s) => s.subcategory_slug === form.subcategory_slug)) {
      form.subcategory_slug = subcategoryOptions.value[0].subcategory_slug
      form.subcategory_name = subcategoryOptions.value[0].subcategory_name
    }
  }
})

watch(() => form.subcategory_slug, (value) => {
  const category = categoriesBySlug.value.get(selectedCategorySlug.value)
  if (!category) return
  const selected = category.subcategories.find((s) => s.subcategory_slug === value)
  if (selected) {
    form.subcategory_name = selected.subcategory_name
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

function selectProduct(product: any) {
  selectedProductId.value = product.id
  form.id = product.id
  form.name = product.name
  form.category_slug = product.category_slug
  form.category_name = product.category_name
  form.subcategory_slug = product.subcategory_slug
  form.subcategory_name = product.subcategory_name
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
  form.subcategory_slug = ''
  form.subcategory_name = ''
  form.specs_json = '{}'
  selectedCategorySlug.value = ''
  useExistingCategory.value = categoryOptions.value.length > 0
  message.value = ''
}

async function saveProduct() {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id: form.id,
        name: form.name,
        category_slug: form.category_slug,
        category_name: form.category_name,
        subcategory_slug: form.subcategory_slug,
        subcategory_name: form.subcategory_name,
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

  label {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: 600;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d5dde8;
    background: #f8faff;
    box-sizing: border-box;
    font-size: 1rem;
  }

  textarea {
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
</style>
