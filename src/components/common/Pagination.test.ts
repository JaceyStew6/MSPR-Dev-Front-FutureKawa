import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

function mountPagination(page: number, total: number, limit: number) {
  return mount(Pagination, { props: { page, total, limit } })
}

describe('Pagination', () => {
  it('is not rendered when total is less than or equal to limit', () => {
    // Arrange + Act
    const wrapper = mountPagination(1, 10, 20)

    // Assert
    expect(wrapper.find('.pagination').exists()).toBe(false)
  })

  it('is rendered when total exceeds limit', () => {
    // Arrange + Act
    const wrapper = mountPagination(1, 30, 20)

    // Assert
    expect(wrapper.find('.pagination').exists()).toBe(true)
  })

  it('displays the current page and total page count', () => {
    const wrapper = mountPagination(2, 60, 20)
    expect(wrapper.text()).toContain('Page 2 / 3')
  })

  it('disables the Previous button on the first page', () => {
    const wrapper = mountPagination(1, 40, 20)
    const prev = wrapper.findAll('button')[0]
    expect(prev?.attributes('disabled')).toBeDefined()
  })

  it('disables the Next button on the last page', () => {
    const wrapper = mountPagination(2, 40, 20)
    const next = wrapper.findAll('button')[1]
    expect(next?.attributes('disabled')).toBeDefined()
  })

  it('emits change with page - 1 when Previous is clicked', async () => {
    // Arrange
    const wrapper = mountPagination(3, 60, 20)

    // Act
    await wrapper.findAll('button').at(0)?.trigger('click')

    // Assert
    expect(wrapper.emitted('change')).toEqual([[2]])
  })

  it('emits change with page + 1 when Next is clicked', async () => {
    // Arrange
    const wrapper = mountPagination(1, 60, 20)

    // Act
    await wrapper.findAll('button').at(1)?.trigger('click')

    // Assert
    expect(wrapper.emitted('change')).toEqual([[2]])
  })
})
