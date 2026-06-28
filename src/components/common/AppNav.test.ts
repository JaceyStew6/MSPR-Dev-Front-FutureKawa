import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppNav from './AppNav.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: { template: '<div />' } },
    { path: '/warehouse', component: { template: '<div />' } },
    { path: '/quality', component: { template: '<div />' } },
    { path: '/supply-chain', component: { template: '<div />' } },
    { path: '/hq', component: { template: '<div />' } },
    { path: '/farm', component: { template: '<div />' } },
    { path: '/lots', component: { template: '<div />' } },
    { path: '/monitoring', component: { template: '<div />' } },
    { path: '/alerts', component: { template: '<div />' } },
  ],
})

function mountNav(role: string, name = 'Alice') {
  return mount(AppNav, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: { id: 'u-1', name, role },
              token: 'tok',
            },
          },
        }),
      ],
      stubs: { AlertBadge: true },
    },
  })
}

describe('AppNav', () => {
  it('displays the logged-in user name', () => {
    const wrapper = mountNav('quality', 'Alice')
    expect(wrapper.text()).toContain('Alice')
  })

  it('shows Warehouse and Monitoring links for warehouse_manager role', () => {
    // Arrange + Act
    const wrapper = mountNav('warehouse_manager')

    // Assert
    expect(wrapper.text()).toContain('Warehouse')
    expect(wrapper.text()).toContain('Monitoring')
  })

  it('shows Quality and Supply Chain links for hq role', () => {
    // Arrange + Act
    const wrapper = mountNav('hq')

    // Assert
    expect(wrapper.text()).toContain('Quality')
    expect(wrapper.text()).toContain('Supply Chain')
  })

  it('shows the Lots link for quality role', () => {
    // Arrange + Act
    const wrapper = mountNav('quality')

    // Assert
    expect(wrapper.text()).toContain('Lots')
  })

  it('calls logout and redirects to /login when the logout button is clicked', async () => {
    // Arrange
    const wrapper = mountNav('quality')
    const authStore = useAuthStore()
    const pushSpy = vi.spyOn(router, 'push')

    // Act
    await wrapper.find('.btn-logout').trigger('click')
    await flushPromises()

    // Assert
    expect(authStore.logout).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/login')
  })
})
