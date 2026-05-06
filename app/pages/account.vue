<template>
  <main>
    <p>
      <NuxtLink to="/">Home</NuxtLink>
    </p>

    <h1>Account</h1>

    <div v-if="meLoading">Loading...</div>
    <div v-else-if="me?.user">
      <p>
        Logged in as: <strong>{{ me.user.email }}</strong>
      </p>

      <p>
        <button @click="logout" :disabled="busy">Logout</button>
      </p>

      <h2>Favorites</h2>
      <p v-if="favoritesLoading">Loading favorites...</p>
      <ul v-else>
        <li v-for="p in favorites" :key="p.id">
          <NuxtLink :to="`/p/${p.id}`">{{ p.name }}</NuxtLink>
          <span> — </span>
          <NuxtLink :to="`/c/${p.category_slug}`">{{ p.category_name }}</NuxtLink>
          <span> / </span>
          <NuxtLink :to="`/c/${p.category_slug}/${p.subcategory_slug}`">{{ p.subcategory_name }}</NuxtLink>
        </li>
      </ul>

      <h2>Admin</h2>
      <p>Admin can refresh all prices with one button.</p>
      <p>
        <button @click="refreshAllPrices" :disabled="busy">Refresh all prices</button>
        <span v-if="adminMessage"> {{ adminMessage }}</span>
      </p>
      <p style="opacity: 0.8;">
        Tip: default admin is <strong>admin@local</strong> / <strong>admin123</strong>
      </p>
    </div>

    <div v-else>
      <h2>Login</h2>
      <form @submit.prevent="login">
        <p><input v-model="email" placeholder="email" /></p>
        <p><input v-model="password" type="password" placeholder="password" /></p>
        <button type="submit" :disabled="busy">Login</button>
      </form>

      <h2>Register</h2>
      <form @submit.prevent="register">
        <p><input v-model="email" placeholder="email" /></p>
        <p><input v-model="password" type="password" placeholder="password (min 6)" /></p>
        <button type="submit" :disabled="busy">Register</button>
      </form>

      <p v-if="message">{{ message }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')
const message = ref('')
const adminMessage = ref('')
const busy = ref(false)

const { data: me, pending: meLoading, refresh: refreshMe } = await useFetch('/api/auth/me')

const { data: favoritesData, pending: favoritesLoading, refresh: refreshFavorites } = await useFetch('/api/favorites', {
  immediate: computed(() => Boolean(me.value?.user)),
})

const favorites = computed(() => favoritesData.value || [])

async function login() {
  busy.value = true
  message.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshMe()
    await refreshFavorites()
  } catch (e: any) {
    message.value = String(e?.statusMessage || e?.message || 'Login error')
  } finally {
    busy.value = false
  }
}

async function register() {
  busy.value = true
  message.value = ''
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshMe()
    await refreshFavorites()
  } catch (e: any) {
    message.value = String(e?.statusMessage || e?.message || 'Register error')
  } finally {
    busy.value = false
  }
}

async function logout() {
  busy.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshMe()
  } finally {
    busy.value = false
  }
}

async function refreshAllPrices() {
  busy.value = true
  adminMessage.value = ''
  try {
    const res = await $fetch<{ refreshedProducts: number }>('/api/prices/refresh-all', { method: 'POST' })
    adminMessage.value = `(refreshed ${res.refreshedProducts})`
  } catch (e: any) {
    adminMessage.value = String(e?.statusMessage || e?.message || 'Refresh error')
  } finally {
    busy.value = false
  }
}
</script>

