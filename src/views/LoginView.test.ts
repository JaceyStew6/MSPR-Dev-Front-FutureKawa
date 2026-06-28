import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertsStore } from '@/stores/alerts.store'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
    { path: '/farm', component: { template: '<div />' } },
    { path: '/warehouse', component: { template: '<div />' } },
    { path: '/quality', component: { template: '<div />' } },
    { path: '/supply-chain', component: { template: '<div />' } },
    { path: '/hq', component: { template: '<div />' } },
  ],
})

function mountLogin() {
  return mount(LoginView, {
    global: {
      plugins: [
        router,
        createTestingPinia({ createSpy: vi.fn }),
      ],
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LoginView', () => {
  it('renders the email and password fields', () => {
    // Arrange + Act
    const wrapper = mountLogin()

    // Assert
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('disables the submit button and shows "Signing in…" while loading', async () => {
    // Arrange
    const wrapper = mountLogin()
    const authStore = useAuthStore()
    vi.mocked(authStore.login).mockImplementation(() => new Promise(() => {}))

    await wrapper.find('input[type="email"]').setValue('alice@test.com')
    await wrapper.find('input[type="password"]').setValue('secret')

    // Act
    await wrapper.find('form').trigger('submit')

    // Assert
    const button = wrapper.find('button[type="submit"]')
    expect(button.text()).toBe('Signing in…')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows an error message when login throws', async () => {
    // Arrange
    const wrapper = mountLogin()
    const authStore = useAuthStore()
    vi.mocked(authStore.login).mockRejectedValue(new Error('Invalid credentials'))

    await wrapper.find('input[type="email"]').setValue('wrong@test.com')
    await wrapper.find('input[type="password"]').setValue('bad')

    // Act
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Assert
    expect(wrapper.find('.error').text()).toBe('Invalid credentials')
  })

  it('calls alertsStore.startPolling after a successful login', async () => {
    // Arrange
    const wrapper = mountLogin()
    const authStore = useAuthStore()
    const alertsStore = useAlertsStore()
    vi.mocked(authStore.login).mockResolvedValue(undefined)
    Object.defineProperty(authStore, 'role', { value: 'quality', configurable: true })

    await wrapper.find('input[type="email"]').setValue('alice@test.com')
    await wrapper.find('input[type="password"]').setValue('secret')

    // Act
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Assert
    expect(alertsStore.startPolling).toHaveBeenCalled()
  })
})
