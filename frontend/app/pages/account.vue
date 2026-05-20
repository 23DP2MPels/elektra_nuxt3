<template>
  <main class="account-page">
    <!-- Navigation -->
    <nav class="nav-links">
      <NuxtLink :to="localePath('/')" class="nav-link">{{ $t('account.nav.home') }}</NuxtLink>
      <NuxtLink :to="localePath('/search')" class="nav-link secondary">{{ $t('account.nav.search') }}</NuxtLink>
    </nav>

    <!-- Authenticated User Section -->
    <div v-if="isNetworkError" class="network-error">
      <div class="error-icon">📶</div>
      <h3>{{ $t('networkError.title') }}</h3>
      <p>{{ $t('networkError.message') }}</p>
      <button @click="retryLoad" class="retry-btn">{{ $t('networkError.retry') }}</button>
    </div>

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
            <br>
            <button type="button" @click="showChangePassword = !showChangePassword" class="change-password-btn">
              {{ $t('account.changePassword') }}
            </button>
          </div>

          <!-- Change Password Form -->
          <div v-if="showChangePassword" class="change-password-form">
            <h3>{{ $t('account.changePassword') }}</h3>
            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label for="current-pass">{{ $t('account.currentPassword') }}</label>
                <div class="password-input-wrapper">
                  <input
                    id="current-pass"
                    v-model="passwordOld"
                    :type="showOldPassword ? 'text' : 'password'"
                    placeholder="Enter your current password"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showOldPassword = !showOldPassword">
                    <svg v-if="!showOldPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="new-pass">{{ $t('account.newPassword') }}</label>
                <div class="password-input-wrapper">
                  <input
                    id="new-pass"
                    v-model="passwordNew"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showNewPassword = !showNewPassword">
                    <svg v-if="!showNewPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="confirm-pass">{{ $t('account.confirmPassword') }}</label>
                <div class="password-input-wrapper">
                  <input
                    id="confirm-pass"
                    v-model="passwordConfirm"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm new password"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                    <svg v-if="!showConfirmPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" :disabled="busy" class="submit-btn">
                  {{ busy ? 'Updating...' : $t('account.updatePassword') }}
                </button>
                <button type="button" @click="showChangePassword = false" class="cancel-btn">
                  {{ $t('account.cancel') }}
                </button>
              </div>
            </form>
            <div v-if="passwordMessage" class="password-message" :class="{ success: passwordMessage.includes('successfully'), error: !passwordMessage.includes('successfully') }">
              {{ passwordMessage }}
            </div>
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

      <!-- Delete Account Section -->
      <section class="delete-account-section">
        <div class="delete-account-card">
          <h3>{{ $t('account.dangerZone') }}</h3>
          <p>{{ $t('account.dangerZoneDesc') }}</p>

          <div class="delete-actions">
            <button @click="deleteAccount" :disabled="busy" class="delete-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              {{ $t('account.deleteAccount') }}
            </button>
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
                <div class="password-input-wrapper">
                  <input
                    id="login-password"
                    v-model="loginPassword"
                    :type="showLoginPassword ? 'text' : 'password'"
                    placeholder="Your password"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showLoginPassword = !showLoginPassword">
                    <svg v-if="!showLoginPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
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
                <div class="password-input-wrapper">
                  <input
                    id="register-password"
                    v-model="registerPassword"
                    :type="showRegisterPassword ? 'text' : 'password'"
                    placeholder="At least 6 characters"
                    minlength="6"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showRegisterPassword = !showRegisterPassword">
                    <svg v-if="!showRegisterPassword" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="register-confirm">Confirm password</label>
                <div class="password-input-wrapper">
                  <input
                    id="register-confirm"
                    v-model="registerConfirm"
                    :type="showRegisterConfirm ? 'text' : 'password'"
                    placeholder="Confirm your password"
                    minlength="6"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showRegisterConfirm = !showRegisterConfirm">
                    <svg v-if="!showRegisterConfirm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
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
import { ref, computed, watchEffect } from 'vue'
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
const passwordMessage = ref('')
const passwordOld = ref('')
const passwordNew = ref('')
const passwordConfirm = ref('')
const showChangePassword = ref(false)
const busy = ref(false)

// Password visibility toggles
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirm = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Network error handling
const isNetworkError = ref(false)

async function retryLoad() {
  isNetworkError.value = false
  try {
    await refreshMe()
    await refreshFavorites()
  } catch (e: any) {
    if (!navigator.onLine || e?.message?.includes('fetch') || e?.message?.includes('network')) {
      isNetworkError.value = true
    }
  }
}

const localLabel = (value: unknown) => normalizeLocalizedLabel(value, locale.value)

const { data: me, pending: meLoading, refresh: refreshMe, error: meError } = await useFetch('/api/auth/me', {
  credentials: 'include',
})

const { data: favoritesData, pending: favoritesLoading, refresh: refreshFavorites, error: favoritesError } = await useFetch('/api/favorites', {
  immediate: computed(() => Boolean(me.value?.user)),
  credentials: 'include',
})

const favorites = computed(() => favoritesData.value || [])

// Watch for network errors
watchEffect(() => {
  const hasMeError = meError.value && (!navigator.onLine || String(meError.value.message || meError.value.statusMessage).includes('fetch') || String(meError.value.message || meError.value.statusMessage).includes('network'))
  const hasFavoritesError = favoritesError.value && (!navigator.onLine || String(favoritesError.value.message || favoritesError.value.statusMessage).includes('fetch') || String(favoritesError.value.message || favoritesError.value.statusMessage).includes('network'))
  isNetworkError.value = Boolean(hasMeError || hasFavoritesError)
})

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
  if (!registerPassword.value.trim()) {
    message.value = 'Password cannot be only spaces'
    return
  }
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(registerPassword.value)) {
    message.value = 'Password contains invalid characters'
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

async function changePassword() {
  if (!passwordOld.value) {
    passwordMessage.value = 'Current password is required'
    return
  }
  if (!passwordNew.value) {
    passwordMessage.value = 'New password is required'
    return
  }
  if (passwordNew.value.length < 6) {
    passwordMessage.value = 'New password must be at least 6 characters'
    return
  }
  if (!passwordNew.value.trim()) {
    passwordMessage.value = 'Password cannot be only spaces'
    return
  }
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(passwordNew.value)) {
    passwordMessage.value = 'Password contains invalid characters'
    return
  }
  if (passwordNew.value !== passwordConfirm.value) {
    passwordMessage.value = 'Passwords do not match'
    return
  }

  busy.value = true
  passwordMessage.value = ''
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        old_password: passwordOld.value,
        new_password: passwordNew.value,
        confirm_password: passwordConfirm.value,
      },
      credentials: 'include',
    })
    passwordMessage.value = $t('account.passwordChanged')
    passwordOld.value = ''
    passwordNew.value = ''
    passwordConfirm.value = ''
    setTimeout(() => {
      showChangePassword.value = false
      passwordMessage.value = ''
    }, 2000)
  } catch (e: any) {
    passwordMessage.value = String(e?.statusMessage || e?.message || 'Failed to change password')
  } finally {
    busy.value = false
  }
}

async function deleteAccount() {
  const confirmed = confirm($t('account.deleteConfirm'))
  if (!confirmed) return

  busy.value = true
  try {
    await $fetch('/api/auth/delete-account', {
      method: 'POST',
      credentials: 'include',
    })
    // Redirect to home page after successful deletion
    await navigateTo(localePath('/'))
  } catch (e: any) {
    alert(String(e?.statusMessage || e?.message || 'Failed to delete account'))
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

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  flex: 1;
  padding-right: 2.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #111827;
}

.password-toggle svg {
  width: 1.25rem;
  height: 1.25rem;
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

.change-password-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: #fff;
  border: 1px solid #6366f1;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-right: 1rem;
}

.change-password-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.change-password-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.change-password-form {
  margin-top: 1.5rem;
  padding: 2rem;
  background: #f8faff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}

.change-password-form h3 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.2rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.password-form .form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.password-form .form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  border-radius: 0.5rem;
  transition: border-color 0.2s ease;
}

.password-form .form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: #fff;
  border: 1px solid #6366f1;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f3f4f6;
}

.password-message {
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.password-message.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.password-message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
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

.delete-account-section {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.delete-account-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.delete-account-card h3 {
  margin: 0 0 0.5rem 0;
  color: #dc2626;
  font-size: 1.3rem;
}

.delete-account-card > p {
  margin: 0 0 2rem 0;
  color: #6b7280;
}

.delete-actions {
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: #fff;
  border: 1px solid #dc2626;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn svg {
  width: 1rem;
  height: 1rem;
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
