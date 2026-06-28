import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/alerts.service', () => ({
  alertsService: {
    getAlerts: vi.fn(),
    markAsRead: vi.fn(),
  },
}))

vi.mock('@/services/api', () => ({
  setToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  api: { get: vi.fn() },
}))

import { alertsService } from '@/services/alerts.service'
import { useAlertsStore } from './alerts.store'

const mockGetAlerts = vi.mocked(alertsService.getAlerts)
const mockMarkAsRead = vi.mocked(alertsService.markAsRead)

const makeAlert = (overrides = {}) => ({
  id: 'a-1',
  type: 'threshold' as const,
  message: 'Temperature too high',
  is_read: false,
  is_active: true,
  created_at: '2024-01-15T10:00:00',
  ...overrides,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAlertsStore', () => {
  describe('unreadCount', () => {
    it('counts only active and unread alerts', async () => {
      // Arrange
      const store = useAlertsStore()
      mockGetAlerts.mockResolvedValue({
        data: [
          makeAlert({ id: 'a-1', is_read: false, is_active: true }),
          makeAlert({ id: 'a-2', is_read: true, is_active: true }),
          makeAlert({ id: 'a-3', is_read: false, is_active: false }),
        ],
        total: 3,
        page: 1,
        limit: 100,
      })

      // Act
      await store.fetchAlerts()

      // Assert
      expect(store.unreadCount).toBe(1)
    })
  })

  describe('fetchAlerts', () => {
    it('populates alerts from the service response', async () => {
      // Arrange
      const store = useAlertsStore()
      mockGetAlerts.mockResolvedValue({
        data: [makeAlert()],
        total: 1,
        page: 1,
        limit: 100,
      })

      // Act
      await store.fetchAlerts()

      // Assert
      expect(store.alerts).toHaveLength(1)
      expect(store.alerts[0]?.id).toBe('a-1')
    })

    it('sets loading to false after fetching', async () => {
      // Arrange
      const store = useAlertsStore()
      mockGetAlerts.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 })

      // Act
      await store.fetchAlerts()

      // Assert
      expect(store.loading).toBe(false)
    })

    it('does not throw and keeps loading false when the service fails', async () => {
      // Arrange
      const store = useAlertsStore()
      mockGetAlerts.mockRejectedValue(new Error('Network error'))

      // Act
      await store.fetchAlerts()

      // Assert
      expect(store.loading).toBe(false)
    })
  })

  describe('markAsRead', () => {
    it('updates the matching alert to is_read: true locally', async () => {
      // Arrange
      const store = useAlertsStore()
      store.alerts = [makeAlert({ id: 'a-1', is_read: false })]
      mockMarkAsRead.mockResolvedValue({} as never)

      // Act
      await store.markAsRead('a-1')

      // Assert
      expect(store.alerts).toHaveLength(1)
      expect(store.alerts[0]?.is_read).toBe(true)
    })

    it('still marks the alert locally even when the API call fails', async () => {
      // Arrange
      const store = useAlertsStore()
      store.alerts = [makeAlert({ id: 'a-1', is_read: false })]
      mockMarkAsRead.mockRejectedValue(new Error('Not implemented'))

      // Act
      await store.markAsRead('a-1')

      // Assert
      expect(store.alerts).toHaveLength(1)
      expect(store.alerts[0]?.is_read).toBe(true)
    })
  })

  describe('startPolling / stopPolling', () => {
    it('calls getAlerts immediately on startPolling', async () => {
      // Arrange
      const store = useAlertsStore()
      mockGetAlerts.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 })

      // Act
      store.startPolling()
      store.stopPolling()
      await flushPromises()

      // Assert - startPolling triggers a fetch immediately
      expect(mockGetAlerts).toHaveBeenCalledOnce()
    })
  })
})
