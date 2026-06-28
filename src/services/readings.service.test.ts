import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from './api'
import { readingsService } from './readings.service'

const mockGet = vi.mocked(api.get)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('readingsService.getLatestReading', () => {
  it('returns the reading with the most recent dateMesure', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { temperature: 20, humidite: 60, dateMesure: '2024-01-01T08:00:00' },
      { temperature: 22, humidite: 65, dateMesure: '2024-01-01T10:00:00' },
      { temperature: 18, humidite: 55, dateMesure: '2024-01-01T06:00:00' },
    ])

    // Act
    const result = await readingsService.getLatestReading('lot-1')

    // Assert
    expect(result?.temperature).toBe(22)
    expect(result?.dateMesure).toBe('2024-01-01T10:00:00')
  })

  it('returns null when no readings exist', async () => {
    // Arrange
    mockGet.mockResolvedValue([])

    // Act
    const result = await readingsService.getLatestReading('lot-1')

    // Assert
    expect(result).toBeNull()
  })

  it('returns null on API error', async () => {
    // Arrange
    mockGet.mockRejectedValue(new Error('Network error'))

    // Act
    const result = await readingsService.getLatestReading('lot-1')

    // Assert
    expect(result).toBeNull()
  })
})

describe('readingsService.getReadings', () => {
  it('fetches lot readings via /lot/:id/mesures', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { temperature: 21, humidite: 62, dateMesure: '2024-01-01T10:00:00' },
    ])

    // Act
    const result = await readingsService.getReadings({ lot_id: 'lot-1', granularity: 'raw' })

    // Assert
    expect(mockGet).toHaveBeenCalledWith('/lot/lot-1/mesures')
    expect(result[0]?.temperature).toBe(21)
    expect(result[0]?.humidity).toBe(62)
    expect(result[0]?.threshold_status).toBe('ok')
  })

  it('averages readings within the same hour for 1h granularity', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { temperature: 20, humidite: 60, dateMesure: '2024-01-01T10:00:00' },
      { temperature: 22, humidite: 70, dateMesure: '2024-01-01T10:30:00' },
      { temperature: 18, humidite: 50, dateMesure: '2024-01-01T11:00:00' },
    ])

    // Act
    const result = await readingsService.getReadings({ lot_id: 'lot-1', granularity: '1h' })

    // Assert - two buckets: 10:xx and 11:xx
    expect(result).toHaveLength(2)
    expect(result[0]?.temperature).toBe(21) // (20+22)/2
    expect(result[0]?.humidity).toBe(65)    // (60+70)/2
  })

  it('aggregates readings per day for 1d granularity', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { temperature: 20, humidite: 60, dateMesure: '2024-01-01T10:00:00' },
      { temperature: 24, humidite: 80, dateMesure: '2024-01-01T22:00:00' },
      { temperature: 18, humidite: 55, dateMesure: '2024-01-02T08:00:00' },
    ])

    // Act
    const result = await readingsService.getReadings({ lot_id: 'lot-1', granularity: '1d' })

    // Assert - two day buckets
    expect(result).toHaveLength(2)
    expect(result[0]?.temperature).toBe(22) // (20+24)/2
  })

  it('returns empty array when neither lot_id nor zone_id is provided', async () => {
    // Act
    const result = await readingsService.getReadings({})

    // Assert
    expect(result).toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('fetches zone readings via /readings/:id/ when zone_id is provided', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { idMesure: 'm-1', temperature: 19, humidite: 58, dateMesure: '2024-01-01T10:00:00' },
    ])

    // Act
    const result = await readingsService.getReadings({ zone_id: 'z-1', country_id: 'COLOMBIE', granularity: 'raw' })

    // Assert
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/readings/z-1/'))
    expect(result[0]?.id).toBe('m-1')
  })
})

describe('readingsService.getWarehouseSummary', () => {
  it('maps backend sensor summaries to zone readings', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { zone_id: 'z-1', zone_name: 'Zone A', last_temp: 21, last_humidity: 65 },
    ])

    // Act
    const result = await readingsService.getWarehouseSummary('wh-1', 'COLOMBIE')

    // Assert
    expect(result.warehouse_id).toBe('wh-1')
    expect(result.zones).toHaveLength(1)
    expect(result.zones[0]?.temperature).toBe(21)
    expect(result.zones[0]?.humidity).toBe(65)
    expect(result.zones[0]?.zone_name).toBe('Zone A')
  })
})
