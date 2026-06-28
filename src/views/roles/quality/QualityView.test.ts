import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import type { Lot } from '@/types/lot.types'
import QualityView from './QualityView.vue'

vi.mock('@/services/lots.service', () => ({
  lotsService: {
    getLots: vi.fn(),
    getLot: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

vi.mock('@/services/readings.service', () => ({
  readingsService: {
    getReadings: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/status-overrides', () => ({
  saveStatusOverride: vi.fn(),
}))

import { lotsService } from '@/services/lots.service'

const mockGetLots = vi.mocked(lotsService.getLots)
const mockUpdateStatus = vi.mocked(lotsService.updateStatus)

const makeLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'lot-1',
  batch_number: 'ABC123',
  farm_id: 'farm-1',
  production_date: '2024-01-01',
  status: 'stored',
  country_id: 'COLOMBIE',
  farm_name: 'Pepper Farm',
  country_name: 'Colombia',
  ...overrides,
})

function mountQuality(role = 'quality', countryId = 'COLOMBIE') {
  return mount(QualityView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: { id: 'u-1', name: 'Carol', role, country_id: countryId },
              token: 'tok',
            },
          },
        }),
      ],
      stubs: { LotTable: { template: '<div class="lot-table" />' } },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetLots.mockResolvedValue({ data: [makeLot()], total: 1, page: 1, limit: 100 })
  mockUpdateStatus.mockResolvedValue(undefined)
})

describe('QualityView', () => {
  it('renders the Quality heading', async () => {
    // Arrange + Act
    const wrapper = mountQuality()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Quality')
  })

  it('calls getLots on mount', async () => {
    // Arrange + Act
    mountQuality()
    await flushPromises()

    // Assert
    expect(mockGetLots).toHaveBeenCalledOnce()
  })

  it('shows the Update lot status section for quality role', async () => {
    // Arrange + Act
    const wrapper = mountQuality('quality')
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Update lot status')
  })

  it('hides the Update lot status section for non-quality roles', async () => {
    // Arrange + Act
    const wrapper = mountQuality('hq')
    await flushPromises()

    // Assert
    expect(wrapper.text()).not.toContain('Update lot status')
  })

  it('always shows the Export traceability report section', async () => {
    // Arrange + Act
    const wrapper = mountQuality()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Export traceability report')
  })

  it('shows a success message with the status name after updating', async () => {
    // Arrange
    const wrapper = mountQuality('quality')
    await flushPromises()

    // Act
    const selects = wrapper.findAll('select')
    expect(selects).toHaveLength(3)

    const lotSelect = selects[0]
    const statusSelect = selects[1]

    if (!lotSelect || !statusSelect) {
      throw new Error('Expected the lot and status selects to be rendered')
    }

    await lotSelect.setValue('lot-1')
    await statusSelect.setValue('compliant')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Assert
    expect(wrapper.find('.success').text()).toContain('Status updated: Compliant')
  })
})
