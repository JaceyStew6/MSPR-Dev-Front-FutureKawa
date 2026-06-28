import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'

function mountBadge(status: string) {
  return mount(StatusBadge, { props: { status } })
}

describe('StatusBadge', () => {
  it('displays "Pending" for the pending status', () => {
    const wrapper = mountBadge('pending')
    expect(wrapper.text()).toBe('Pending')
  })

  it('displays "Stored" for the stored status', () => {
    const wrapper = mountBadge('stored')
    expect(wrapper.text()).toBe('Stored')
  })

  it('displays "Compliant" for the compliant status', () => {
    const wrapper = mountBadge('compliant')
    expect(wrapper.text()).toBe('Compliant')
  })

  it('displays "Alert" for the alert status', () => {
    const wrapper = mountBadge('alert')
    expect(wrapper.text()).toBe('Alert')
  })

  it('displays "Blocked" for the blocked status', () => {
    const wrapper = mountBadge('blocked')
    expect(wrapper.text()).toBe('Blocked')
  })

  it('displays "Shipped" for the shipped status', () => {
    const wrapper = mountBadge('shipped')
    expect(wrapper.text()).toBe('Shipped')
  })

  it('falls back to rendering the raw status for unknown values', () => {
    const wrapper = mountBadge('custom-status')
    expect(wrapper.text()).toBe('custom-status')
  })

  it('is case-insensitive for known statuses', () => {
    const wrapper = mountBadge('PENDING')
    expect(wrapper.text()).toBe('Pending')
  })
})
