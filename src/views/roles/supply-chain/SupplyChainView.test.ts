import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Lot } from '@/types/lot.types'
import SupplyChainView from './SupplyChainView.vue'

vi.mock('@/services/lots.service', () => ({
  lotsService: {
    getLots: vi.fn(),
  },
}))

import { lotsService } from '@/services/lots.service'

const mockGetLots = vi.mocked(lotsService.getLots)

const makeLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'lot-1',
  batch_number: 'ABC123',
  farm_id: 'farm-1',
  production_date: '2024-01-01',
  status: 'stored',
  country_id: 'COLOMBIE',
  storage_date: new Date().toISOString().slice(0, 10),
  ...overrides,
})

const OLD_DATE = new Date(Date.now() - 310 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

function mountSupplyChain() {
  return mount(SupplyChainView, {
    global: {
      stubs: {
        LotTable: { template: '<div class="lot-table" />' },
        StatusBadge: { template: '<span class="status-badge"><slot /></span>' },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // First call: all lots; second call: blocked lots
  mockGetLots
    .mockResolvedValueOnce({ data: [makeLot(), makeLot({ id: 'lot-2', status: 'alert', storage_date: OLD_DATE })], total: 2, page: 1, limit: 500 })
    .mockResolvedValueOnce({ data: [makeLot({ id: 'lot-3', status: 'blocked' })], total: 1, page: 1, limit: 100 })
})

describe('SupplyChainView', () => {
  it('renders the Supply Chain heading', async () => {
    // Arrange + Act
    const wrapper = mountSupplyChain()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Supply Chain - Consolidated view')
  })

  it('calls getLots twice on mount', async () => {
    // Arrange + Act
    mountSupplyChain()
    await flushPromises()

    // Assert
    expect(mockGetLots).toHaveBeenCalledTimes(2)
  })

  it('calls getLots with status:blocked for the second query', async () => {
    // Arrange + Act
    mountSupplyChain()
    await flushPromises()

    // Assert
    expect(mockGetLots).toHaveBeenCalledWith(expect.objectContaining({ status: 'blocked' }))
  })

  it('displays the total lots KPI', async () => {
    // Arrange + Act
    const wrapper = mountSupplyChain()
    await flushPromises()

    // Assert - total from lotsRes.total = 2
    expect(wrapper.text()).toContain('Total lots')
    expect(wrapper.find('.kpi-val').text()).toBe('2')
  })

  it('computes FIFO at risk lots from lots stored > 300 days', async () => {
    const wrapper = mountSupplyChain()
    await flushPromises()

    const kpiValues = wrapper.findAll('.kpi-val')
    expect(kpiValues.length).toBeGreaterThanOrEqual(2)

    expect(kpiValues[1]?.text()).toBe('1')
  })

  it('shows the blocked lots KPI', async () => {
    const wrapper = mountSupplyChain()
    await flushPromises()

    const kpiValues = wrapper.findAll('.kpi-val')
    expect(kpiValues.length).toBeGreaterThanOrEqual(3)

    expect(kpiValues[2]?.text()).toBe('1')
  })
})
