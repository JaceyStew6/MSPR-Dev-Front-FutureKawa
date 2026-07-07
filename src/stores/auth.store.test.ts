import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

vi.mock('@/services/geo.service', () => ({
  geoService: {
    getWarehouses: vi.fn().mockResolvedValue([]),
    getFarms: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/api', () => ({
  setToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  api: { get: vi.fn(), post: vi.fn() },
}))

import { authService } from '@/services/auth.service'
import { geoService } from '@/services/geo.service'
import { setToken } from '@/services/api'
import { useAuthStore } from './auth.store'
import type { User } from '@/types/user.types'

const mockLogin = vi.mocked(authService.login)
const mockMe = vi.mocked(authService.me)
const mockGetWarehouses = vi.mocked(geoService.getWarehouses)
const mockGetFarms = vi.mocked(geoService.getFarms)
const mockSetToken = vi.mocked(setToken)

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  email: 'alice@test.com',
  name: 'alice',
  role: 'quality',
  roles: ['quality'],
  country_id: undefined,
  farm_id: undefined,
  warehouse_ids: undefined,
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  describe('isAuthenticated', () => {
    it('returns false when no token is set', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true after a successful login', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok-123' })
      mockMe.mockResolvedValue(makeUser())

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('role', () => {
    it('returns null when not authenticated', () => {
      const store = useAuthStore()
      expect(store.role).toBeNull()
    })

    it('returns the user role after login', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser({ role: 'hq', roles: ['hq'] }))

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(store.role).toBe('hq')
    })
  })

  describe('autoFilters', () => {
    it('exposes country_id and farm_id from the user object', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser({ country_id: 'COLOMBIE', farm_id: 'farm-1' }))

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(store.autoFilters.country_id).toBe('COLOMBIE')
      expect(store.autoFilters.farm_id).toBe('farm-1')
    })
  })

  describe('login', () => {
    it('sets the token in the api client', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'my-token' })
      mockMe.mockResolvedValue(makeUser())

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(mockSetToken).toHaveBeenCalledWith('my-token')
    })

    it('fetches the user via /auth/me after receiving the token', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser({ email: 'alice@test.com' }))

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(mockMe).toHaveBeenCalled()
      expect(store.user?.email).toBe('alice@test.com')
    })

    it('enriches warehouse_ids for warehouse_manager role', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser({ role: 'warehouse_manager', roles: ['warehouse_manager'], country_id: 'COLOMBIE' }))
      mockGetWarehouses.mockResolvedValue([{ id: 'wh-1', name: 'Warehouse 1', country_id: 'COLOMBIE' }])

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(store.user?.warehouse_ids).toEqual(['wh-1'])
    })

    it('enriches farm_id for farm_manager role', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser({ role: 'farm_manager', roles: ['farm_manager'], country_id: 'COLOMBIE' }))
      mockGetFarms.mockResolvedValue([{ id: 'farm-1', name: 'Pepper Farm', country_id: 'COLOMBIE' }])

      // Act
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Assert
      expect(store.user?.farm_id).toBe('farm-1')
    })
  })

  describe('logout', () => {
    it('clears user, token and api token on logout', async () => {
      // Arrange
      const store = useAuthStore()
      mockLogin.mockResolvedValue({ token: 'tok' })
      mockMe.mockResolvedValue(makeUser())
      await store.login({ email: 'alice@test.com', password: 'secret' })

      // Act
      store.logout()

      // Assert
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(mockSetToken).toHaveBeenLastCalledWith(null)
    })
  })

  describe('fetchMe', () => {
    it('sets user from the /auth/me response', async () => {
      // Arrange
      const store = useAuthStore()
      mockMe.mockResolvedValue(makeUser({ name: 'bob' }))

      // Act
      await store.fetchMe()

      // Assert
      expect(store.user?.name).toBe('bob')
    })
  })
})
