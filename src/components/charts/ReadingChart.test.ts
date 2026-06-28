import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReadingChart from './ReadingChart.vue'

vi.mock('chart.js', () => {
  // Must use a regular function (not arrow) so `new Chart()` works
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Chart = vi.fn(function (this: any) { this.destroy = vi.fn() }) as any
  Chart.register = vi.fn()
  return {
    Chart,
    LineController: {},
    LineElement: {},
    PointElement: {},
    LinearScale: {},
    TimeScale: {},
    Tooltip: {},
    Legend: {},
    Filler: {},
  }
})

vi.mock('chart.js/auto', () => ({}))

vi.mock('@/services/readings.service', () => ({
  readingsService: {
    getReadings: vi.fn().mockResolvedValue([]),
  },
}))

import { readingsService } from '@/services/readings.service'

const mockGetReadings = vi.mocked(readingsService.getReadings)

beforeEach(() => {
  vi.clearAllMocks()
  mockGetReadings.mockResolvedValue([])
})

describe('ReadingChart', () => {
  it('calls readingsService.getReadings with the lotId prop on mount', async () => {
    // Arrange + Act
    mount(ReadingChart, { props: { lotId: 'lot-1' } })
    await flushPromises()

    // Assert
    expect(mockGetReadings).toHaveBeenCalledWith(
      expect.objectContaining({ lot_id: 'lot-1' }),
    )
  })

  it('calls readingsService.getReadings with the zoneId prop on mount', async () => {
    // Arrange + Act
    mount(ReadingChart, { props: { zoneId: 'z-1', countryId: 'COLOMBIE' } })
    await flushPromises()

    // Assert
    expect(mockGetReadings).toHaveBeenCalledWith(
      expect.objectContaining({ zone_id: 'z-1', country_id: 'COLOMBIE' }),
    )
  })

  it('shows the loading indicator while fetching', async () => {
    // Arrange
    mockGetReadings.mockImplementation(() => new Promise(() => { }))

    // Act
    const wrapper = mount(ReadingChart, { props: { lotId: 'lot-1' } })
    await vi.dynamicImportSettled?.()

    // Assert
    expect(wrapper.find('.chart-loading').exists()).toBe(true)
  })

  it('renders the canvas element', async () => {
    // Arrange + Act
    const wrapper = mount(ReadingChart, { props: { lotId: 'lot-1' } })
    await flushPromises()

    // Assert
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('includes granularity controls (raw / hourly / daily)', () => {
    // Arrange + Act
    const wrapper = mount(ReadingChart, { props: { lotId: 'lot-1' } })

    // Assert
    const granularityOptions = wrapper.find('select').findAll('option').map((o) => o.text())
    expect(granularityOptions).toContain('Raw')
    expect(granularityOptions).toContain('Hourly')
    expect(granularityOptions).toContain('Daily')
  })

  it('reloads data when the Refresh button is clicked', async () => {
    // Arrange
    const wrapper = mount(ReadingChart, { props: { lotId: 'lot-1' } })
    await flushPromises()
    mockGetReadings.mockClear()

    // Act
    await wrapper.find('.btn-refresh').trigger('click')
    await flushPromises()

    // Assert
    expect(mockGetReadings).toHaveBeenCalledOnce()
  })
})
