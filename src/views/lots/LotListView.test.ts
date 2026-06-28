import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import LotListView from './LotListView.vue'

vi.mock('@/services/lots.service', () => ({
  lotsService: {
    getLots: vi.fn(),
  },
}))

import { lotsService } from '@/services/lots.service'

const mockGetLots = vi.mocked(lotsService.getLots)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/lots', component: { template: '<div />' } },
    { path: '/farm/create-lot', component: { template: '<div />' } },
  ],
})

const makeLot = (overrides = {}) => ({
  id: 'lot-1',
  batch_number: 'ABC123',
  farm_id: 'farm-1',
  farm_name: 'Pepper Farm',
  country_id: 'COLOMBIE',
  country_name: 'Colombia',
  warehouse_id: 'wh-1',
  warehouse_name: 'Main Warehouse',
  production_date: '2024-01-01',
  storage_date: '2024-01-10',
  status: 'stored',
  ...overrides,
})

function mountList(role = 'quality') {
  return mount(LotListView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: { user: { id: 'u-1', name: 'Alice', role }, token: 'tok' },
            filters: {},
          },
          stubActions: false,
        }),
      ],
      stubs: {
        CascadeFilter: true,
        LotTable: { template: '<div class="lot-table"><slot /></div>' },
        Pagination: true,
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetLots.mockResolvedValue({ data: [makeLot()], total: 1, page: 1, limit: 20 })
})

describe('LotListView', () => {
  it('shows the page title', async () => {
    // Arrange + Act
    const wrapper = mountList()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Coffee lots')
  })

  it('calls lotsService.getLots on mount', async () => {
    // Arrange + Act
    mountList()
    await flushPromises()

    // Assert
    expect(mockGetLots).toHaveBeenCalledOnce()
  })

  it('shows the "+ Create a lot" button for farm_manager role', async () => {
    // Arrange + Act
    const wrapper = mountList('farm_manager')
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('+ Create a lot')
  })

  it('hides the "+ Create a lot" button for non-farm roles', async () => {
    // Arrange + Act
    const wrapper = mountList('quality')
    await flushPromises()

    // Assert
    expect(wrapper.text()).not.toContain('+ Create a lot')
  })
})
