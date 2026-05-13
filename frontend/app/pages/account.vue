<template>
  <main class="account-page">
    <!-- Navigation -->
    <nav class="nav-links">
      <NuxtLink :to="localePath('/')" class="nav-link">{{ $t('account.nav.home') }}</NuxtLink>
      <NuxtLink :to="localePath('/search')" class="nav-link secondary">{{ $t('account.nav.search') }}</NuxtLink>
    </nav>

    <!-- Authenticated User Section -->
    <div v-if="me?.user" class="account-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">{{ $t('account.hero.title') }}</h1>
          <p class="hero-subtitle">{{ $t('account.hero.subtitle') }}</p>
        </div>
      </section>

      <!-- Account Info -->
      <section class="account-section">
        <div class="account-card">
          <div class="account-header">
            <div class="user-avatar">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="user-info">
              <h2>{{ me.user.email }}</h2>
              <p v-if="me.user.is_admin" class="admin-badge">{{ $t('account.admin') }}</p>
            </div>
          </div>

          <div class="account-actions">
            <button @click="logout" :disabled="busy" class="logout-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              {{ $t('account.logout') }}
            </button>
          </div>
        </div>
      </section>

      <!-- Admin Panel Link -->
      <section v-if="me.user.is_admin" class="admin-section">
        <div class="admin-card">
          <div class="admin-header">
            <div class="admin-icon">⚙️</div>
            <div>
              <h3>{{ $t('account.adminPanel') }}</h3>
              <p>{{ $t('account.adminDescription') }}</p>
            </div>
          </div>
          <NuxtLink :to="localePath('/admin')" class="admin-btn">{{ $t('account.goToAdmin') }}</NuxtLink>
        </div>
      </section>

      <!-- Favorites Section -->
      <section class="favorites-section">
        <div class="section-header">
          <h2>{{ $t('account.favorites.title') }}</h2>
          <p>{{ $t('account.favorites.subtitle') }}</p>
        </div>

        <div v-if="favoritesLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ $t('account.favorites.loading') }}</p>
        </div>

        <div v-else-if="favorites.length" class="favorites-grid">
          <div v-for="product in favorites" :key="product.id" class="favorite-card">
            <div class="favorite-content">
              <h3 class="favorite-title">
                <NuxtLink :to="localePath(`/p/${product.id}`)">{{ product.name }}</NuxtLink>
              </h3>
              <div class="favorite-category">
                <NuxtLink :to="localePath(`/c/${product.category_slug}`)" class="category-link">
                  {{ localLabel(product.category_name) }}
                </NuxtLink>
                <span class="separator">/</span>
                <NuxtLink :to="localePath(`/c/${product.category_slug}/${product.subcategory_slug}`)" class="subcategory-link">
                  {{ localLabel(product.subcategory_name) }}
                </NuxtLink>
              </div>
            </div>
            <div class="favorite-actions">
              <NuxtLink :to="localePath(`/p/${product.id}`)" class="view-btn">{{ $t('account.favorites.view') }}</NuxtLink>
            </div>
          </div>
        </div>

        <div v-else class="empty-favorites">
          <div class="empty-icon">❤️</div>
          <h3>{{ $t('account.favorites.empty.title') }}</h3>
          <p>{{ $t('account.favorites.empty.description') }}</p>
          <NuxtLink :to="localePath('/')" class="browse-btn">{{ $t('account.favorites.empty.browse') }}</NuxtLink>
        </div>
      </section>

      <!-- Admin Actions -->
      <section v-if="me.user.is_admin" class="admin-actions-section">
        <div class="admin-actions-card">
          <h3>Admin Actions</h3>
          <p>Refresh product prices from external sources</p>

          <div class="admin-controls">
            <button @click="refreshAllPrices" :disabled="busy" class="refresh-btn">
              <svg v-if="busy" class="loading-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh all prices
            </button>
            <p v-if="adminMessage" class="admin-message">{{ adminMessage }}</p>
          </div>

          <div class="admin-tip">
            <p><strong>Tip:</strong> Default admin credentials: <code>admin@local</code> / <code>admin123</code></p>
          </div>
        </div>
      </section>
    </div>

    <!-- Login/Register Section -->
    <div v-else class="auth-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Account access</h1>
          <p class="hero-subtitle">Log in or register to access your account</p>
        </div>
      </section>

      <!-- Auth Forms -->
      <section class="auth-section">
        <div class="auth-container">
          <div v-if="authMode === 'login'" class="auth-card">
            <div class="auth-header">
              <h2>Login</h2>
              <p>No account yet? Create one to access your favorites and profile.</p>
            </div>

            <form @submit.prevent="login" class="auth-form">
              <div class="form-group">
                <label for="login-email">Email</label>
                <input
                  id="login-email"
                  v-model="loginEmail"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="form-group">
                <label for="login-password">Password</label>
                <input
                  id="login-password"
                  v-model="loginPassword"
                  type="password"
                  placeholder="Your password"
                  required
                />
              </div>

              <button type="submit" :disabled="busy" class="auth-btn">
                <span v-if="busy" class="loading-spinner small"></span>
                Login
              </button>
            </form>

            <p class="auth-toggle-text">
              Don't have an account?
              <button type="button" class="link-button" @click="authMode = 'register'">Create one now</button>.
            </p>
          </div>

          <div v-else class="auth-card">
            <div class="auth-header">
              <h2>Register</h2>
              <p>Already have an account? Use the form below to sign in.</p>
            </div>

            <form @submit.prevent="register" class="auth-form">
              <div class="form-group">
                <label for="register-email">Email</label>
                <input
                  id="register-email"
                  v-model="registerEmail"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="form-group">
                <label for="register-password">Password</label>
                <input
                  id="register-password"
                  v-model="registerPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  minlength="6"
                  required
                />
              </div>

              <div class="form-group">
                <label for="register-confirm">Confirm password</label>
                <input
                  id="register-confirm"
                  v-model="registerConfirm"
                  type="password"
                  placeholder="Confirm your password"
                  minlength="6"
                  required
                />
              </div>

              <button type="submit" :disabled="busy" class="auth-btn secondary">
                <span v-if="busy" class="loading-spinner small"></span>
                Register
              </button>
            </form>

            <p class="auth-toggle-text">
              Already have an account?
              <button type="button" class="link-button" @click="authMode = 'login'">Sign in instead</button>.
            </p>
          </div>
        </div>

        <!-- Message -->
        <div v-if="message" class="auth-message">
          <p :class="{ error: message.includes('error') || message.includes('match'), success: !message.includes('error') && !message.includes('match') }">
            {{ message }}
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { normalizeLocalizedLabel } from '~/composables/useLocalizedName'

const localePath = useLocalePath()
const { locale } = useI18n()
const loginEmail = ref('')
const loginPassword = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirm = ref('')
const authMode = ref<'login' | 'register'>('login')
const message = ref('')
const adminMessage = ref('')
const busy = ref(false)

const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

const { data: me, pending: meLoading, refresh: refreshMe } = await useFetch('/api/auth/me', {
  credentials: 'include',
})

const { data: favoritesData, pending: favoritesLoading, refresh: refreshFavorites } = await useFetch('/api/favorites', {
  immediate: computed(() => Boolean(me.value?.user)),
  credentials: 'include',
})

const favorites = computed(() => favoritesData.value || [])

async function login() {
  busy.value = true
  message.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: loginEmail.value, password: loginPassword.value },
    })
    await refreshMe()
    await refreshFavorites()
  } catch (e: any) {
    message.value = String(e?.statusMessage || e?.message || 'Login error')
  } finally {
    busy.value = false
  }
}

async function register() {
  if (registerPassword.value !== registerConfirm.value) {
    message.value = 'Passwords do not match'
    return
  }

  busy.value = true
  message.value = ''
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email: registerEmail.value, password: registerPassword.value },
    })
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
<style scoped>
.account-page {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-links {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;
}

.nav-link:hover {
  background: #f3f4f6;
}

.nav-link.secondary {
  color: #6b7280;
}

.nav-link.secondary:hover {
  background: #f3f4f6;
}

.hero-section {
  padding: 2rem;
  text-align: center;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1rem;
  color: #6b7280;
}

.account-section,
.admin-section,
.favorites-section,
.admin-actions-section,
.auth-section {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.auth-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-switcher {
  display: flex;
  gap: 0;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.switch-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-btn.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}

.switch-btn:first-child {
  border-right: none;
}

.switch-btn.active + .switch-btn {
  border-left: 1px solid #111827;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.auth-toggle-text {
  margin-top: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  text-align: center;
}

.link-button {
  border: none;
  background: none;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.account-card,
.admin-card,
.favorites-grid,
.admin-actions-card,
.auth-card {
  background: #fff;
  border: 1px solid #e5e7eb;
}

.auth-card {
  padding: 2rem;
}

.auth-header {
  margin-bottom: 2rem;
  text-align: center;
}

.auth-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6b7280;
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #111827;
}

.auth-btn {
  padding: 0.75rem 1.5rem;
  background: #111827;
  color: #fff;
  border: 1px solid #111827;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 1rem;
}

.auth-btn:hover:not(:disabled) {
  background: #374151;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-btn.secondary {
  background: #fff;
  color: #111827;
}

.auth-btn.secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.auth-message {
  margin-top: 1.5rem;
  text-align: center;
}

.auth-message p {
  padding: 0.75rem;
  font-weight: 500;
}

.auth-message p.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.auth-message p.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.account-header {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  width: 4rem;
  height: 4rem;
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.user-avatar svg {
  width: 2rem;
  height: 2rem;
}

.user-info h2 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.5rem;
}

.admin-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.85rem;
  font-weight: 600;
}

.account-actions {
  padding: 2rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: #fff;
  border: 1px solid #dc2626;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-header {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.admin-icon {
  font-size: 2rem;
}

.admin-header h3 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 1.3rem;
}

.admin-header p {
  margin: 0;
  color: #6b7280;
}

.admin-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #111827;
  color: #fff;
  border: 1px solid #111827;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
}

.admin-btn:hover {
  background: #374151;
}

.section-header {
  margin-bottom: 2rem;
  text-align: center;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  color: #111827;
  font-size: 2rem;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #111827;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.favorites-grid {
  display: grid;
  gap: 1rem;
}

.favorite-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #f8faff;
  transition: all 0.2s ease;
}

.favorite-card:hover {
  border-color: #2f5f9b;
  box-shadow: 0 4px 12px rgba(47, 95, 155, 0.1);
}

.favorite-content {
  flex: 1;
}

.favorite-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.favorite-title a {
  color: #1f2a43;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.favorite-title a:hover {
  color: #2f5f9b;
}

.favorite-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-link,
.subcategory-link {
  color: #0369a1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.category-link:hover,
.subcategory-link:hover {
  color: #0284c7;
}

.separator {
  color: #6b7280;
}

.favorite-actions {
  margin-left: 1rem;
}

.view-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #2f5f9b;
  color: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
}

.view-btn:hover {
  background: #1f4770;
}

.empty-favorites {
  text-align: center;
  padding: 3rem 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-favorites h3 {
  margin: 0 0 1rem 0;
  color: #1f2a43;
  font-size: 1.5rem;
}

.empty-favorites p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.browse-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #2f5f9b;
  color: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease;
}

.browse-btn:hover {
  background: #1f4770;
}

.admin-actions-card {
  padding: 2rem;
}

.admin-actions-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2a43;
  font-size: 1.5rem;
}

.admin-actions-card > p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.admin-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #047857;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

.admin-message {
  font-weight: 600;
  color: #059669;
}

.admin-tip {
  padding: 1rem;
  background: #f8faff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.admin-tip code {
  background: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.auth-container {
  display: grid;
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.auth-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(33, 77, 124, 0.06);
  overflow: hidden;
}

.auth-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.auth-header h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2a43;
  font-size: 1.5rem;
}

.auth-header p {
  margin: 0;
  color: #6b7280;
}

.auth-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #2f5f9b;
  box-shadow: 0 0 0 3px rgba(47, 95, 155, 0.1);
}

.auth-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2f5f9b;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-btn:hover:not(:disabled) {
  background: #1f4770;
}

.auth-btn.secondary {
  background: #6b7280;
}

.auth-btn.secondary:hover:not(:disabled) {
  background: #4b5563;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner.small {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.auth-message {
  max-width: 800px;
  margin: 2rem auto 0;
  text-align: center;
}

.auth-message p {
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.auth-message p.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.auth-message p.success {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #bbf7d0;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .account-header,
  .admin-header {
    flex-direction: column;
    text-align: center;
  }

  .favorite-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .favorite-actions {
    margin-left: 0;
    align-self: stretch;
  }

  .view-btn {
    width: 100%;
    text-align: center;
  }

  .auth-container {
    grid-template-columns: 1fr;
  }

  .admin-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-btn {
    justify-content: center;
  }
}
</style>
