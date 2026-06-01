import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { setToken, setUnauthorizedHandler } from '@/services/api'
import type { User, UserRole, LoginPayload } from '@/types/user.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed<UserRole | null>(() => user.value?.role ?? null)

  // Filtres automatiques selon le rôle de l'utilisateur
  const autoFilters = computed(() => ({
    country_id: user.value?.country_id,
    farm_id: user.value?.farm_id,
    warehouse_ids: user.value?.warehouse_ids,
  }))

  async function login(payload: LoginPayload) {
    const res = await authService.login(payload)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // ignorer erreur réseau au logout
    } finally {
      token.value = null
      user.value = null
      setToken(null)
    }
  }

  async function fetchMe() {
    const me = await authService.me()
    user.value = me
  }

  function init() {
    // Enregistre le handler 401 pour logout automatique
    setUnauthorizedHandler(() => logout())
  }

  return { user, token, isAuthenticated, role, autoFilters, login, logout, fetchMe, init }
})
