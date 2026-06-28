import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AlertBadge from './AlertBadge.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/alerts', component: { template: '<div />' } }],
})

function mountBadge(unreadCount: number) {
  return mount(AlertBadge, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: { alerts: { alerts: [] } },
        }),
      ],
    },
  })
}

describe('AlertBadge', () => {
  it('does not show the count badge when unreadCount is zero', () => {
    // Arrange + Act
    const wrapper = mountBadge(0)

    // Assert
    expect(wrapper.find('.badge').exists()).toBe(false)
  })

  it('shows the count badge when there are unread alerts', async () => {
    // Arrange
    const wrapper = mount(AlertBadge, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              alerts: {
                alerts: [
                  { id: 'a-1', is_read: false, is_active: true },
                  { id: 'a-2', is_read: false, is_active: true },
                ],
              },
            },
          }),
        ],
      },
    })

    // Assert
    expect(wrapper.find('.badge').exists()).toBe(true)
    expect(wrapper.find('.badge').text()).toBe('2')
  })

  it('shows 99+ when unread count exceeds 99', async () => {
    // Arrange
    const alerts = Array.from({ length: 100 }, (_, i) => ({
      id: `a-${i}`,
      is_read: false,
      is_active: true,
    }))
    const wrapper = mount(AlertBadge, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            createSpy: vi.fn,
            initialState: { alerts: { alerts } },
          }),
        ],
      },
    })

    // Assert
    expect(wrapper.find('.badge').text()).toBe('99+')
  })
})
