<template>
  <main>
    <div class="breadcrumb">
      <NuxtLink :to="localePath('/')">Главная</NuxtLink>
      <span> / </span>
      <span>{{ localLabel(category?.category_name) }}</span>
    </div>

    <div v-if="isNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <h3>{{ $t('networkError.title') }}</h3>
      <p>{{ $t('networkError.message') }}</p>
      <button @click="retryLoad" class="retry-btn">{{ $t('networkError.retry') }}</button>
    </div>

    <div v-if="loading" class="loading">Загрузка подкатегорий...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="category">
      <div class="category-header">
        <h1>{{ localLabel(category.category_name) }}</h1>
        <p>Выберите подкатегорию для просмотра товаров</p>
      </div>

      <div class="subcategories-grid">
        <div v-for="s in category.subcategories" :key="s.subcategory_slug" class="subcategory-card">
          <NuxtLink :to="localePath(`/c/${category.category_slug}/${s.subcategory_slug}`)" class="subcategory-link">
            <h3>{{ localLabel(s.subcategory_name) }}</h3>
            <p class="subcategory-count">{{ s.productCount }} товаров</p>
          </NuxtLink>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="error-card">
        <h1>Категория не найдена</h1>
        <p>Неизвестная категория: {{ categorySlug }}</p>
        <NuxtLink :to="localePath('/')" class="back-link">Вернуться на главную</NuxtLink>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'

const localePath = useLocalePath()
const { locale } = useI18n()
const route = useRoute()
const categorySlug = computed(() => String(route.params.category || ''))

const category = ref<{ category_slug: string; category_name: unknown; subcategories: Array<{ subcategory_slug: string; subcategory_name: unknown; productCount: number }> } | null>(null)
const loading = ref(true)
const error = ref('')

// Network error handling
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

const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

const url = computed(() => `/api/catalog/subcategories?category=${encodeURIComponent(categorySlug.value)}`)

const { data, pending, error: fetchError } = await useFetch(url)

watchEffect(() => {
  if (data.value) {
    category.value = {
      category_slug: data.value.category_slug,
      category_name: data.value.category_name,
      subcategories: data.value.subcategories,
    }
  }
  if (fetchError.value) {
    const errorMessage = String(fetchError.value.message || fetchError.value.statusMessage || 'Failed to load category')
    if (!navigator.onLine || errorMessage.includes('fetch') || errorMessage.includes('network')) {
      isNetworkError.value = true
    } else {
      error.value = errorMessage
    }
  }
  loading.value = Boolean(pending.value)
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

.category-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 2rem 0;
}

.category-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #2f5f9b, #1f4770);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.category-header p {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.subcategory-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.subcategory-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(33, 77, 124, 0.12);
}

.subcategory-link {
  display: block;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
}

.subcategory-link h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
  color: #1f2a43;
}

.subcategory-count {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
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
</style>

