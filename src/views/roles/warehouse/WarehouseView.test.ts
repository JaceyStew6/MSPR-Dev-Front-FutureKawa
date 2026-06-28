import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import type { Lot } from '@/types/lot.types'
import WarehouseView from './WarehouseView.vue'

vi.mock('@/services/lots.service', () => ({
  lotsService: {
    getLots: vi.fn(),
    stockIn: vi.fn(),
    updateZone: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

vi.mock('@/services/movements.service', () => ({
  movementsService: {
    stockOut: vi.fn(),
  },
}))

vi.mock('@/services/geo.service', () => ({
  geoService: {
    getZones: vi.fn().mockResolvedValue([
      { id: 'z-1', name: 'Zone A' },
    ]),
  },
}))

vi.mock('@/services/status-overrides', () => ({
  saveStatusOverride: vi.fn(),
}))

import { lotsService } from '@/services/lots.service'
import { movementsService } from '@/services/movements.service'

const mockGetLots = vi.mocked(lotsService.getLots)
const mockStockOut = vi.mocked(movementsService.stockOut)
const mockUpdateStatus = vi.mocked(lotsService.updateStatus)
const mockUpdateZone = vi.mocked(lotsService.updateZone)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/warehouse', component: { template: '<div />' } },
    { path: '/warehouse/movements', component: { template: '<div />' } },
  ],
})

const makeLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'lot-1',
  batch_number: 'ABC123',
  farm_id: 'farm-1',
  production_date: '2024-01-01',
  status: 'stored',
  country_id: 'COLOMBIE',
  ...overrides,
})

function mountWarehouse() {
  return mount(WarehouseView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: {
                id: 'u-1',
                name: 'Bob',
                role: 'warehouse_manager',
                country_id: 'COLOMBIE',
                warehouse_ids: ['wh-1'],
              },
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
  mockStockOut.mockResolvedValue(undefined as never)
  mockUpdateStatus.mockResolvedValue(undefined)
  mockUpdateZone.mockResolvedValue(undefined)
})

describe('WarehouseView', () => {
  it('renders the Warehouse management heading', async () => {
    // Arrange + Act
    const wrapper = mountWarehouse()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Warehouse management')
  })

  it('calls getLots on mount', async () => {
    // Arrange + Act
    mountWarehouse()
    await flushPromises()

    // Assert
    expect(mockGetLots).toHaveBeenCalledOnce()
  })

  it('shows the Stock out action card', async () => {
    // Arrange + Act
    const wrapper = mountWarehouse()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Stock out')
  })

  it('shows the Move a lot action card', async () => {
    // Arrange + Act
    const wrapper = mountWarehouse()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Move a lot')
  })

  it('shows the Update status action card', async () => {
    // Arrange + Act
    const wrapper = mountWarehouse()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Update status')
  })

  it('shows a success message after a stock-out', async () => {
    // Arrange
    const wrapper = mountWarehouse()
    await flushPromises()

    // Act - select the lot and trigger the stock-out
    const selects = wrapper.findAll('select')
    expect(selects.length).toBeGreaterThan(0)

    const lotSelect = selects[0]
    if (!lotSelect) {
      throw new Error('Expected a lot select to be rendered')
    }

    await lotSelect.setValue('lot-1')
    await wrapper.find('.btn-danger').trigger('click')
    await flushPromises()

    // Assert
    expect(wrapper.find('.success').text()).toBe('Stock-out recorded.')
  })

  it('shows a success message after updating a lot status', async () => {
    // Arrange
    const wrapper = mountWarehouse()
    await flushPromises()

    // Act - select lot and status in the Update status card (last two selects)
    const selects = wrapper.findAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(2)

    const lotSelect = selects.at(-2)
    const statusSelect = selects.at(-1)

    if (!lotSelect || !statusSelect) {
      throw new Error('Expected the lot and status selects to be rendered')
    }

    await lotSelect.setValue('lot-1')
    await statusSelect.setValue('compliant')
    await wrapper.findAll('button').find((b) => b.text() === 'Update')!.trigger('click')
    await flushPromises()

    // Assert
    expect(wrapper.find('.success').text()).toBe('Status updated.')
  })
})
