<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { ROLE_DEFAULT_ROUTES } from '@/config/routes'

const router = useRouter()
const authStore = useAuthStore()
const alertsStore = useAlertsStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    alertsStore.startPolling()

    const route = ROLE_DEFAULT_ROUTES[authStore.role!] || '/dashboard'
    router.push(route)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>🌿 FutureKawa</h1>
      <p class="subtitle">Coffee lot management & traceability</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@futurekawa.com" required
            autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••" required
            autocomplete="current-password" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f4f0;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
}

h1 {
  font-size: 1.75rem;
  margin: 0 0 0.25rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 2rem;
}

.login-form {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #15803d;
}

.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}

.btn-login {
  padding: 11px;
  background: #15803d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-login:hover:not(:disabled) {
  background: #166534;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
