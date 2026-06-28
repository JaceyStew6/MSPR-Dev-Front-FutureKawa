import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('./geo.service', () => ({
  geoService: {
    getZones: vi.fn().mockResolvedValue([]),
    getWarehouses: vi.fn().mockResolvedValue([]),
  },
}))

import { api } from './api'
import { alertsService } from './alerts.service'

const mockGet = vi.mocked(api.get)
const mockPatch = vi.mocked(api.patch)

const makeBackendAlert = (overrides = {}) => ({
  idAlerte: 'a-1',
  typeAlerte: 'temperature',
  description: 'Temperature exceeded threshold',
  dateEmission: '2024-01-15T10:00:00',
  idZone: 'z-1',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockResolvedValue([makeBackendAlert()])
})

describe('alertsService.getAlerts', () => {
  it('maps backend alerts to the frontend Alert shape', async () => {
    // Act
    const result = await alertsService.getAlerts()
    expect(result.data).toHaveLength(1)

    // Assert
    const alert = result.data[0]
    expect(alert?.id).toBe('a-1')
    expect(alert?.message).toBe('Temperature exceeded threshold')
    expect(alert?.is_read).toBe(false)
    expect(alert?.is_active).toBe(true)
    expect(alert?.created_at).toBe('2024-01-15T10:00:00')
  })

  describe('alert type detection', () => {
    it('classifies "fifo" type alerts', async () => {
      // Arrange
      mockGet.mockResolvedValue([makeBackendAlert({ typeAlerte: 'FIFO_VIOLATION' })])

      // Act
      const { data } = await alertsService.getAlerts()

      // Assert
      expect(data[0]?.type).toBe('fifo')
    })

    it('classifies expiry type alerts when description contains "expir"', async () => {
      // Arrange
      mockGet.mockResolvedValue([makeBackendAlert({ typeAlerte: 'DATE_EXPIRATION' })])

      // Act
      const { data } = await alertsService.getAlerts()

      // Assert
      expect(data[0]?.type).toBe('expiry')
    })

    it('classifies all other alerts as threshold', async () => {
      // Arrange
      mockGet.mockResolvedValue([makeBackendAlert({ typeAlerte: 'TEMPERATURE' })])

      // Act
      const { data } = await alertsService.getAlerts()

      // Assert
      expect(data[0]?.type).toBe('threshold')
    })
  })

  describe('filtering', () => {
    it('returns only active alerts when active filter is true', async () => {
      // Arrange - all alerts are active by default (is_active: true from mapAlert)
      mockGet.mockResolvedValue([makeBackendAlert({ idAlerte: 'a-1' })])

      // Act
      const { data } = await alertsService.getAlerts({ active: true })

      // Assert
      expect(data).toHaveLength(1)
    })

    it('filters by type when type filter is provided', async () => {
      // Arrange
      mockGet.mockResolvedValue([
        makeBackendAlert({ idAlerte: 'a-1', typeAlerte: 'FIFO_VIOLATION' }),
        makeBackendAlert({ idAlerte: 'a-2', typeAlerte: 'TEMPERATURE' }),
      ])

      // Act
      const { data } = await alertsService.getAlerts({ type: 'fifo' })

      // Assert
      expect(data).toHaveLength(1)
      expect(data[0]?.id).toBe('a-1')
    })
  })

  describe('pagination', () => {
    it('returns the correct page slice and total', async () => {
      // Arrange
      mockGet.mockResolvedValue([
        makeBackendAlert({ idAlerte: 'a-1' }),
        makeBackendAlert({ idAlerte: 'a-2' }),
        makeBackendAlert({ idAlerte: 'a-3' }),
      ])

      // Act
      const result = await alertsService.getAlerts({ page: 1, limit: 2 })

      // Assert
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
    })
  })

  it('builds the query string with pays and idEntrepot params', async () => {
    // Act
    await alertsService.getAlerts({ country_id: 'COLOMBIE', warehouse_id: 'wh-1' })

    // Assert
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('pays=COLOMBIE'),
    )
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('idEntrepot=wh-1'),
    )
  })
})

describe('alertsService.markAsRead', () => {
  it('patches the alert read endpoint', async () => {
    // Arrange
    mockPatch.mockResolvedValue({})

    // Act
    await alertsService.markAsRead('a-1')

    // Assert
    expect(mockPatch).toHaveBeenCalledWith('/alerts/a-1/read', {})
  })
})
