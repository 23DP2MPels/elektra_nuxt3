<template>
  <main>
    <div class="hero">
      <h1>Каталог товаров</h1>
      <p>Найдите нужный товар в удобных категориях</p>
    </div>

    <div class="nav-links">
      <NuxtLink to="/search" class="nav-link">Поиск товаров</NuxtLink>
      <NuxtLink to="/account" class="nav-link">Личный кабинет</NuxtLink>
    </div>

    <div v-if="loading" class="loading">Загрузка категорий...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="categories-grid">
      <div v-for="c in categories" :key="c.category_slug" class="category-card">
        <NuxtLink :to="`/c/${c.category_slug}`" class="category-link">
          <h3>{{ c.category_name }}</h3>
          <p class="category-count">{{ c.productCount }} товаров</p>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const categories = ref<Array<{ category_slug: string; category_name: string; productCount: number }>>([])
const loading = ref(true)
const error = ref('')

try {
  const { data } = await useFetch('/api/catalog/categories')
  categories.value = data.value ?? []
} catch (err: any) {
  error.value = String(err?.message || err?.statusMessage || 'Failed to load categories')
} finally {
  loading.value = false
}
</script>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 2rem 0;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #2f5f9b, #1f4770);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 1.2rem;
  color: #64748b;
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
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border: 2px solid #2f5f9b;
  border-radius: 0.75rem;
  color: #2f5f9b;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(47, 95, 155, 0.1);
}

.nav-link:hover {
  background: #2f5f9b;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(47, 95, 155, 0.2);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(33, 77, 124, 0.12);
}

.category-link {
  display: block;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
}

.category-link h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2a43;
}

.category-count {
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
</style>

