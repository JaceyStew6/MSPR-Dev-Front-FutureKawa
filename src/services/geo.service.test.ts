import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geoService, formatCountryName } from './geo.service'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from './api'
const mockGet = vi.mocked(api.get)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('formatCountryName', () => {
  it('maps COLOMBIE to Colombia', () => {
    expect(formatCountryName('COLOMBIE')).toBe('Colombia')
  })

  it('maps BRESIL to Brazil', () => {
    expect(formatCountryName('BRESIL')).toBe('Brazil')
  })

  it('maps EQUATEUR to Ecuador', () => {
    expect(formatCountryName('EQUATEUR')).toBe('Ecuador')
  })

  it('falls back to title-case for unknown country IDs', () => {
    expect(formatCountryName('MEXICO')).toBe('Mexico')
  })
})

describe('geoService.getCountries', () => {
  it('returns countries with English display names from backend keys', async () => {
    // Arrange
    mockGet.mockResolvedValue({ COLOMBIE: {}, BRESIL: {}, EQUATEUR: {} })

    // Act
    const result = await geoService.getCountries()

    // Assert
    expect(result).toHaveLength(3)
    expect(result.find((c) => c.id === 'COLOMBIE')?.name).toBe('Colombia')
    expect(result.find((c) => c.id === 'BRESIL')?.name).toBe('Brazil')
    expect(result.find((c) => c.id === 'EQUATEUR')?.name).toBe('Ecuador')
  })

  it('keeps the raw backend key as the id', async () => {
    // Arrange
    mockGet.mockResolvedValue({ COLOMBIE: {} })

    // Act
    const countries = await geoService.getCountries()
    expect(countries).toHaveLength(1)

    // Assert
    const country = countries[0]
    expect(country?.id).toBe('COLOMBIE')
  })
})

describe('geoService.getFarms', () => {
  it('returns empty array when no countryId is provided', async () => {
    const result = await geoService.getFarms()
    expect(result).toEqual([])
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('strips "exploitation" prefix and appends "Farm" suffix', async () => {
    // Arrange
    mockGet.mockResolvedValue([{ idExploitation: 'f-1', nom: 'exploitation pepper' }])

    // Act
    const farms = await geoService.getFarms('COLOMBIE')
    expect(farms).toHaveLength(1)

    // Assert
    const farm = farms[0]
    expect(farm?.name).toBe('Pepper Farm')
    expect(farm?.id).toBe('f-1')
    expect(farm?.country_id).toBe('COLOMBIE')
  })

  it('does not add Farm suffix if the name already contains Farm', async () => {
    // Arrange
    mockGet.mockResolvedValue([{ idExploitation: 'f-1', nom: 'Green Farm' }])

    // Act
    const farms = await geoService.getFarms('COLOMBIE')
    expect(farms).toHaveLength(1)

    // Assert
    const farm = farms[0]
    expect(farm?.name).toBe('Green Farm')
  })
})

describe('geoService.getWarehouses', () => {
  it('fetches warehouses for a specific country and appends Warehouse suffix', async () => {
    // Arrange
    mockGet.mockResolvedValue([{ idEntrepot: 'wh-1', nom: 'entrepot principal' }])

    // Act
    const warehouses = await geoService.getWarehouses({ country_id: 'COLOMBIE' })
    expect(warehouses).toHaveLength(1)

    // Assert
    const warehouse = warehouses[0]
    expect(warehouse?.name).toBe('Principal Warehouse')
    expect(warehouse?.id).toBe('wh-1')
    expect(warehouse?.country_id).toBe('COLOMBIE')
  })

  it('does not add Warehouse suffix if the name already contains Warehouse', async () => {
    // Arrange
    mockGet.mockResolvedValue([{ idEntrepot: 'wh-1', nom: 'Main Warehouse' }])

    // Act
    const warehouses = await geoService.getWarehouses({ country_id: 'COLOMBIE' })
    expect(warehouses).toHaveLength(1)

    // Assert
    const warehouse = warehouses[0]
    expect(warehouse?.name).toBe('Main Warehouse')
  })

  it('aggregates warehouses from all countries when no country is specified', async () => {
    // Arrange - first call = /countries, then two warehouse calls
    mockGet
      .mockResolvedValueOnce({ COLOMBIE: {}, BRESIL: {} })
      .mockResolvedValueOnce([{ idEntrepot: 'wh-c', nom: 'colom' }])
      .mockResolvedValueOnce([{ idEntrepot: 'wh-b', nom: 'bresil' }])

    // Act
    const result = await geoService.getWarehouses()

    // Assert
    expect(result).toHaveLength(2)
  })
})

describe('geoService.getZones', () => {
  it('fetches zones for a warehouse and maps them', async () => {
    // Arrange
    mockGet.mockResolvedValue([
      { idZone: 'z-1', nomZone: 'Zone A', idEntrepot: 'wh-1' },
    ])

    // Act
    const zones = await geoService.getZones('wh-1', 'COLOMBIE')
    expect(zones).toHaveLength(1)

    // Assert
    const zone = zones[0]
    expect(zone?.id).toBe('z-1')
    expect(zone?.name).toBe('Zone A')
    expect(zone?.warehouse_id).toBe('wh-1')
  })
})
