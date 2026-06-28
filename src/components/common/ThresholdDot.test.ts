import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThresholdDot from './ThresholdDot.vue'

describe('ThresholdDot', () => {
  it('renders a dot element for each status', () => {
    const statuses = ['ok', 'warn', 'alert'] as const
    for (const status of statuses) {
      const wrapper = mount(ThresholdDot, { props: { status } })
      expect(wrapper.find('.dot').exists()).toBe(true)
    }
  })

  it('does not render a label when the label prop is omitted', () => {
    // Arrange + Act
    const wrapper = mount(ThresholdDot, { props: { status: 'ok' } })

    // Assert
    expect(wrapper.find('.dot-label').exists()).toBe(false)
  })

  it('renders the label text when the label prop is provided', () => {
    // Arrange + Act
    const wrapper = mount(ThresholdDot, { props: { status: 'warn', label: 'warning' } })

    // Assert
    expect(wrapper.find('.dot-label').text()).toBe('warning')
  })

  it('applies different background colors for each threshold status', () => {
    // Arrange
    const okDot = mount(ThresholdDot, { props: { status: 'ok' } }).find('.dot')
    const warnDot = mount(ThresholdDot, { props: { status: 'warn' } }).find('.dot')
    const alertDot = mount(ThresholdDot, { props: { status: 'alert' } }).find('.dot')

    // Assert - colors should differ across statuses
    const okColor = okDot.attributes('style')
    const warnColor = warnDot.attributes('style')
    const alertColor = alertDot.attributes('style')

    expect(okColor).not.toBe(warnColor)
    expect(warnColor).not.toBe(alertColor)
  })
})
