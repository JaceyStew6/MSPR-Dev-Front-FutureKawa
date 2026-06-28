import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from './DashboardView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/lots', component: { template: '<div />' } },
    { path: '/alerts', component: { template: '<div />' } },
    { path: '/farm', component: { template: '<div />' } },
    { path: '/farm/create-lot', component: { template: '<div />' } },
    { path: '/warehouse', component: { template: '<div />' } },
    { path: '/monitoring', component: { template: '<div />' } },
    { path: '/quality', component: { template: '<div />' } },
    { path: '/supply-chain', component: { template: '<div />' } },
    { path: '/hq', component: { template: '<div />' } },
    { path: '/dashboard', component: { template: '<div />' } },
  ],
})

type AlertLike = {
  id: string
  is_read: boolean
  is_active: boolean
  type: string
  message: string
  created_at: string
}

function mountDashboard(role: string, alertsData: AlertLike[] = []) {
  return mount(DashboardView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              user: { id: 'u-1', name: 'Alice', role },
              token: 'tok',
            },
            alerts: { alerts: alertsData },
          },
        }),
      ],
    },
  })
}

describe('DashboardView', () => {
  it('greets the user by name', () => {
    // Arrange + Act
    const wrapper = mountDashboard('quality')

    // Assert
    expect(wrapper.text()).toContain('Hello, Alice')
  })

  it('displays the human-readable role label', () => {
    const wrapper = mountDashboard('farm_manager')
    expect(wrapper.text()).toContain('Farm Manager')
  })

  it('shows the unread alerts count', () => {
    // Arrange
    const alerts = [
      { id: 'a-1', is_read: false, is_active: true, type: 'threshold', message: 'x', created_at: '' },
      { id: 'a-2', is_read: false, is_active: true, type: 'threshold', message: 'x', created_at: '' },
    ]

    // Act
    const wrapper = mountDashboard('quality', alerts)

    // Assert
    expect(wrapper.find('.card-value').text()).toBe('2')
  })

  it('shows farm-specific quick links for farm_manager role', () => {
    // Arrange + Act
    const wrapper = mountDashboard('farm_manager')

    // Assert
    expect(wrapper.text()).toContain('Create a lot')
    expect(wrapper.text()).toContain('My Farm')
  })

  it('shows warehouse-specific quick links for warehouse_manager role', () => {
    const wrapper = mountDashboard('warehouse_manager')
    expect(wrapper.text()).toContain('Warehouse')
    expect(wrapper.text()).toContain('Monitoring')
  })

  it('shows the recent alerts section only when there are active unread alerts', () => {
    // Arrange - no alerts
    const wrapperEmpty = mountDashboard('quality', [])
    expect(wrapperEmpty.find('.recent-alerts').exists()).toBe(false)

    // Arrange - with one active unread alert
    const alerts = [
      { id: 'a-1', is_read: false, is_active: true, type: 'threshold', message: 'Test', created_at: '2024-01-01T00:00:00' },
    ]
    const wrapperWithAlert = mountDashboard('quality', alerts)
    expect(wrapperWithAlert.find('.recent-alerts').exists()).toBe(true)
  })

  it('shows hq global reporting link for hq role', () => {
    const wrapper = mountDashboard('hq')
    expect(wrapper.text()).toContain('Global reporting')
  })
})
