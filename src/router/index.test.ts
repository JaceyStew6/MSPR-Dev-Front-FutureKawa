import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from './index'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/stores/auth.store'

const mockUseAuthStore = vi.mocked(useAuthStore)

function mockAuth(isAuthenticated: boolean, role: string | null = null) {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated,
    role,
    autoFilters: {},
  } as never)
}

beforeEach(async () => {
  setActivePinia(createPinia())
  // Reset to a neutral location with no session
  mockAuth(false)
  await router.push('/login')
})

describe('Router — navigation guard', () => {
  describe('unauthenticated access', () => {
    it('redirects to /login when accessing a protected route without a session', async () => {
      // Arrange
      mockAuth(false)

      // Act
      await router.push('/dashboard')

      // Assert
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('allows access to /login without a session', async () => {
      // Arrange
      mockAuth(false)

      // Act
      await router.push('/login')

      // Assert
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('authenticated access to /login', () => {
    it('redirects to /dashboard when an authenticated user visits /login', async () => {
      // Arrange — start from /dashboard so the push to /login is not a duplicate
      mockAuth(true, 'farm_manager')
      await router.push('/dashboard')

      // Act
      await router.push('/login')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('shared routes (all authenticated roles)', () => {
    it('allows any authenticated user to access /dashboard', async () => {
      // Arrange
      mockAuth(true, 'warehouse_manager')

      // Act
      await router.push('/dashboard')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('allows any authenticated user to access /lots', async () => {
      // Arrange
      mockAuth(true, 'quality')

      // Act
      await router.push('/lots')

      // Assert
      expect(router.currentRoute.value.path).toBe('/lots')
    })

    it('allows any authenticated user to access a lot detail page (/lots/:id)', async () => {
      // Arrange
      mockAuth(true, 'farm_manager')

      // Act
      await router.push('/lots/abc-123')

      // Assert
      expect(router.currentRoute.value.path).toBe('/lots/abc-123')
    })

    it('allows any authenticated user to access /alerts', async () => {
      // Arrange
      mockAuth(true, 'supply_chain')

      // Act
      await router.push('/alerts')

      // Assert
      expect(router.currentRoute.value.path).toBe('/alerts')
    })
  })

  describe('role-restricted routes', () => {
    it('allows farm_manager to access /farm', async () => {
      // Arrange
      mockAuth(true, 'farm_manager')

      // Act
      await router.push('/farm')

      // Assert
      expect(router.currentRoute.value.path).toBe('/farm')
    })

    it('redirects farm_manager away from /warehouse to /dashboard', async () => {
      // Arrange
      mockAuth(true, 'farm_manager')

      // Act
      await router.push('/warehouse')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('allows warehouse_manager to access /warehouse', async () => {
      // Arrange
      mockAuth(true, 'warehouse_manager')

      // Act
      await router.push('/warehouse')

      // Assert
      expect(router.currentRoute.value.path).toBe('/warehouse')
    })

    it('redirects warehouse_manager away from /quality to /dashboard', async () => {
      // Arrange
      mockAuth(true, 'warehouse_manager')

      // Act
      await router.push('/quality')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('allows hq to access /hq', async () => {
      // Arrange
      mockAuth(true, 'hq')

      // Act
      await router.push('/hq')

      // Assert
      expect(router.currentRoute.value.path).toBe('/hq')
    })

    it('allows hq to access /quality', async () => {
      // Arrange
      mockAuth(true, 'hq')

      // Act
      await router.push('/quality')

      // Assert
      expect(router.currentRoute.value.path).toBe('/quality')
    })

    it('allows hq to access /supply-chain', async () => {
      // Arrange
      mockAuth(true, 'hq')

      // Act
      await router.push('/supply-chain')

      // Assert
      expect(router.currentRoute.value.path).toBe('/supply-chain')
    })

    it('redirects supply_chain away from /hq to /dashboard', async () => {
      // Arrange
      mockAuth(true, 'supply_chain')

      // Act
      await router.push('/hq')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('allows warehouse_manager to access /monitoring', async () => {
      // Arrange
      mockAuth(true, 'warehouse_manager')

      // Act
      await router.push('/monitoring')

      // Assert
      expect(router.currentRoute.value.path).toBe('/monitoring')
    })

    it('redirects farm_manager away from /monitoring to /dashboard', async () => {
      // Arrange
      mockAuth(true, 'farm_manager')

      // Act
      await router.push('/monitoring')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })

  describe('redirects', () => {
    it('redirects / to /dashboard', async () => {
      // Arrange
      mockAuth(true, 'hq')

      // Act
      await router.push('/')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })

    it('redirects unknown paths to /dashboard when authenticated', async () => {
      // Arrange
      mockAuth(true, 'hq')

      // Act
      await router.push('/this-does-not-exist')

      // Assert
      expect(router.currentRoute.value.path).toBe('/dashboard')
    })
  })
})
