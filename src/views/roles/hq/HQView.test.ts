import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import HQView from './HQView.vue'

vi.mock('@/services/reporting.service', () => ({
  reportingService: {
    getGlobal: vi.fn(),
    getQuality: vi.fn(),
    getStock: vi.fn(),
  },
}))

vi.mock('@/services/geo.service', () => ({
  geoService: {
    getCountries: vi.fn(),
  },
}))

import { reportingService } from '@/services/reporting.service'
import { geoService } from '@/services/geo.service'

const mockGetGlobal = vi.mocked(reportingService.getGlobal)
const mockGetQuality = vi.mocked(reportingService.getQuality)
const mockGetStock = vi.mocked(reportingService.getStock)
const mockGetCountries = vi.mocked(geoService.getCountries)

const mockGlobalReport = {
  kpis: {
    total_lots: 42,
    compliance_rate: 0.95,
    avg_age_days: 120,
    movements_last_30d: 15,
  },
}

const mockQualityReport = {
  compliance_rate: 0.9,
  total_alerts: 3,
  incidents: 1,
  by_zone: [],
}

const mockStockReport = {
  total_lots: 20,
  fifo_at_risk: 2,
  by_status: {},
  by_country: [],
}

function mountHQ() {
  return mount(HQView, {
    global: {
      stubs: {},
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetGlobal.mockResolvedValue(mockGlobalReport as never)
  mockGetQuality.mockResolvedValue(mockQualityReport)
  mockGetStock.mockResolvedValue(mockStockReport)
  mockGetCountries.mockResolvedValue([
    { id: 'COLOMBIE', name: 'Colombia', code: 'CO' },
    { id: 'BRESIL', name: 'Brazil', code: 'BR' },
  ])
})

describe('HQView', () => {
  it('renders the Global Reporting heading', async () => {
    // Arrange + Act
    const wrapper = mountHQ()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Global Reporting - Headquarters')
  })

  it('calls reportingService.getGlobal on mount', async () => {
    // Arrange + Act
    mountHQ()
    await flushPromises()

    // Assert
    expect(mockGetGlobal).toHaveBeenCalledOnce()
  })

  it('calls geoService.getCountries on mount', async () => {
    // Arrange + Act
    mountHQ()
    await flushPromises()

    // Assert
    expect(mockGetCountries).toHaveBeenCalledOnce()
  })

  it('shows a loading indicator before data arrives', async () => {
    // Arrange - keep promises unresolved
    mockGetGlobal.mockReturnValue(new Promise(() => { }) as never)

    // Act
    const wrapper = mountHQ()
    await nextTick()

    // Assert
    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('displays the total lots KPI from the global report', async () => {
    // Arrange + Act
    const wrapper = mountHQ()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('Total lots')
  })

  it('displays the compliance rate KPI', async () => {
    // Arrange + Act
    const wrapper = mountHQ()
    await flushPromises()

    // Assert - 0.95 → 95.0%
    expect(wrapper.text()).toContain('95.0%')
    expect(wrapper.text()).toContain('Compliance rate')
  })

  it('shows the country breakdown table with country rows', async () => {
    // Arrange + Act
    const wrapper = mountHQ()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Country breakdown')
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Colombia')
    expect(wrapper.text()).toContain('Brazil')
  })

  it('calls getStock for each country', async () => {
    // Arrange + Act
    mountHQ()
    await flushPromises()

    // Assert - one getStock call per country (2 countries)
    expect(mockGetStock).toHaveBeenCalledTimes(2)
    expect(mockGetStock).toHaveBeenCalledWith(expect.objectContaining({ country_id: 'COLOMBIE' }))
    expect(mockGetStock).toHaveBeenCalledWith(expect.objectContaining({ country_id: 'BRESIL' }))
  })
})
