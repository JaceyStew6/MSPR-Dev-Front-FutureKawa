import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CascadeFilter from './CascadeFilter.vue'

vi.mock('@/services/geo.service', () => ({
  geoService: {
    getCountries: vi.fn().mockResolvedValue([
      { id: 'COLOMBIE', name: 'Colombia', code: 'COLOMBIE' },
      { id: 'BRESIL', name: 'Brazil', code: 'BRESIL' },
    ]),
    getFarms: vi.fn().mockResolvedValue([
      { id: 'farm-1', name: 'Pepper Farm', country_id: 'COLOMBIE' },
    ]),
    getWarehouses: vi.fn().mockResolvedValue([
      { id: 'wh-1', name: 'Main Warehouse', country_id: 'COLOMBIE' },
    ]),
    getZones: vi.fn().mockResolvedValue([
      { id: 'z-1', name: 'Zone A', warehouse_id: 'wh-1' },
    ]),
  },
}))

import { geoService } from '@/services/geo.service'

const mockGetCountries = vi.mocked(geoService.getCountries)
const mockGetFarms = vi.mocked(geoService.getFarms)
const mockGetWarehouses = vi.mocked(geoService.getWarehouses)
const mockGetZones = vi.mocked(geoService.getZones)

function mountFilter(authState = {}) {
  return mount(CascadeFilter, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: { user: null, token: null, ...authState },
            filters: { countryId: undefined, farmId: undefined, warehouseId: undefined, zoneId: undefined },
          },
          stubActions: false,
        }),
      ],
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCountries.mockResolvedValue([
    { id: 'COLOMBIE', name: 'Colombia', code: 'COLOMBIE' },
    { id: 'BRESIL', name: 'Brazil', code: 'BRESIL' },
  ])
  mockGetFarms.mockResolvedValue([{ id: 'farm-1', name: 'Pepper Farm', country_id: 'COLOMBIE' }])
  mockGetWarehouses.mockResolvedValue([{ id: 'wh-1', name: 'Main Warehouse', country_id: 'COLOMBIE' }])
  mockGetZones.mockResolvedValue([{ id: 'z-1', name: 'Zone A', warehouse_id: 'wh-1' }])
})

describe('CascadeFilter', () => {
  it('loads and renders the list of countries on mount', async () => {
    // Arrange + Act
    const wrapper = mountFilter()
    await flushPromises()

    // Assert
    expect(mockGetCountries).toHaveBeenCalledOnce()
    const selects = wrapper.findAll('select')
    const countrySelect = selects.at(0)
    const options = countrySelect?.findAll('option') ?? []
    expect(options.some((o) => o.text() === 'Colombia')).toBe(true)
    expect(options.some((o) => o.text() === 'Brazil')).toBe(true)
  })

  it('loads farms and warehouses when a country is selected', async () => {
    // Arrange
    const wrapper = mountFilter()
    await flushPromises()

    // Act - simulate selecting a country
    const countrySelect = wrapper.findAll('select')[0]
    await countrySelect?.setValue('COLOMBIE')
    await flushPromises()

    // Assert
    expect(mockGetFarms).toHaveBeenCalledWith('COLOMBIE')
    expect(mockGetWarehouses).toHaveBeenCalledWith({ country_id: 'COLOMBIE' })
  })

  it('disables the zone select when no warehouse is selected', async () => {
    // Arrange + Act
    const wrapper = mountFilter()
    await flushPromises()

    // Assert
    const zoneSelect = wrapper.findAll('select')[3]
    expect(zoneSelect?.attributes('disabled')).toBeDefined()
  })

  it('disables the country select when the user has an autoFilter country', async () => {
    // Arrange
    const wrapper = mountFilter({
      user: { id: 'u-1', name: 'Alice', role: 'farm_manager', country_id: 'COLOMBIE' },
    })
    await flushPromises()

    // Assert
    const countrySelect = wrapper.findAll('select')[0]
    expect(countrySelect?.attributes('disabled')).toBeDefined()
  })
})
