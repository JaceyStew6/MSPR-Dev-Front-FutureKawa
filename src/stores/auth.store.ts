import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import { geoService } from '@/services/geo.service'
import { setToken, setUnauthorizedHandler } from '@/services/api'
import type { User, UserRole, LoginPayload } from '@/types/user.types'

const STORAGE_KEY = 'fk_session'

function saveSession(tok: string, u: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: tok, user: u }))
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

function loadSession(): { token: string; user: User } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Restore from localStorage so the session survives page reloads
  const saved = loadSession()

  const user = ref<User | null>(saved?.user ?? null)
  const token = ref<string | null>(saved?.token ?? null)

  if (saved?.token) setToken(saved.token)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed<UserRole | null>(() => user.value?.role ?? null)

  const autoFilters = computed(() => ({
    country_id: user.value?.country_id,
    farm_id: user.value?.farm_id,
    warehouse_ids: user.value?.warehouse_ids,
  }))

  async function enrichWarehouseIds(u: User): Promise<User> {
    if (u.role !== 'warehouse_manager' || !u.country_id || u.warehouse_ids?.length) return u
    try {
      const warehouses = await geoService.getWarehouses({ country_id: u.country_id })
      const ids = warehouses.map((w) => w.id).filter(Boolean)
      return ids.length ? { ...u, warehouse_ids: ids } : u
    } catch {
      return u
    }
  }

  async function enrichFarmId(u: User): Promise<User> {
    if (u.role !== 'farm_manager' || !u.country_id || u.farm_id) return u
    try {
      const farms = await geoService.getFarms(u.country_id)
      return farms.length ? { ...u, farm_id: farms[0].id } : u
    } catch {
      return u
    }
  }

  async function enrich(u: User): Promise<User> {
    return enrichFarmId(await enrichWarehouseIds(u))
  }

  async function login(payload: LoginPayload) {
    const res = await authService.login(payload)
    token.value = res.token
    user.value = await enrich(res.user)
    setToken(res.token)
    saveSession(res.token, user.value)
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // ignore network errors on logout
    } finally {
      token.value = null
      user.value = null
      setToken(null)
      clearSession()
    }
  }

  async function fetchMe() {
    const me = await authService.me()
    user.value = await enrich(me)
  }

  function init() {
    setUnauthorizedHandler(() => logout())
  }

  return { user, token, isAuthenticated, role, autoFilters, login, logout, fetchMe, init }
})
