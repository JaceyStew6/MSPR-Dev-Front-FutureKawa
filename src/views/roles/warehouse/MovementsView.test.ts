import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import MovementsView from './MovementsView.vue'

vi.mock('@/services/movements.service', () => ({
  movementsService: {
    getMovements: vi.fn(),
  },
}))

import { movementsService } from '@/services/movements.service'

const mockGetMovements = vi.mocked(movementsService.getMovements)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/warehouse', component: { template: '<div />' } },
    { path: '/warehouse/movements', component: { template: '<div />' } },
  ],
})

function mountMovements() {
  return mount(MovementsView, {
    global: {
      plugins: [router],
      stubs: { Pagination: true },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMovements.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
})

describe('MovementsView', () => {
  it('shows the Movement history heading', async () => {
    // Arrange + Act
    const wrapper = mountMovements()
    await flushPromises()

    // Assert
    expect(wrapper.text()).toContain('Movement history')
  })

  it('shows "No movements" when the list is empty', async () => {
    // Arrange + Act
    const wrapper = mountMovements()
    await flushPromises()

    // Assert
    expect(wrapper.find('.empty').text()).toBe('No movements')
  })

  it('renders movement rows with type labels', async () => {
    // Arrange
    mockGetMovements.mockResolvedValue({
      data: [
        {
          id: 'mv-1',
          type: 'stock_in',
          lot_id: 'lot-1',
          lot_batch_number: 'ABC123',
          performed_at: '2024-01-15T10:00:00',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    })

    // Act
    const wrapper = mountMovements()
    await flushPromises()

    // Assert
    expect(wrapper.find('.type-badge').text()).toBe('In')
    expect(wrapper.text()).toContain('ABC123')
  })

  it('shows the loading indicator while fetching', async () => {
    // Arrange
    mockGetMovements.mockImplementation(() => new Promise(() => {}))

    // Act
    const wrapper = mountMovements()
    await nextTick()

    // Assert
    expect(wrapper.find('.loading').exists()).toBe(true)
  })
})
