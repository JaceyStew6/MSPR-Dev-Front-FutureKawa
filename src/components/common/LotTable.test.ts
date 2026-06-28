import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LotTable from './LotTable.vue'
import type { Lot } from '@/types/lot.types'

const router = {
  global: {
    stubs: {
      RouterLink: { template: '<a><slot /></a>' },
      StatusBadge: { template: '<span class="status-badge"><slot /></span>' },
      ThresholdDot: { template: '<span class="threshold-dot" />' },
    },
  },
}

const makeLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'lot-1',
  batch_number: 'ABC123',
  farm_id: 'farm-1',
  farm_name: 'Pepper Farm',
  country_id: 'COLOMBIE',
  country_name: 'Colombia',
  warehouse_id: 'wh-1',
  warehouse_name: 'Main Warehouse',
  zone_id: 'z-1',
  zone_name: 'Zone A',
  production_date: '2024-01-01',
  storage_date: '2024-01-10',
  status: 'stored',
  ...overrides,
})

describe('LotTable', () => {
  it('shows the loading indicator when loading is true', () => {
    // Arrange + Act
    const wrapper = mount(LotTable, {
      props: { lots: [], loading: true },
      ...router,
    })

    // Assert
    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('renders a row for each lot in the table', () => {
    // Arrange
    const lots = [makeLot({ id: 'lot-1' }), makeLot({ id: 'lot-2' })]

    // Act
    const wrapper = mount(LotTable, {
      props: { lots, loading: false },
      ...router,
    })

    // Assert
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('shows "No lots found" when the lots array is empty', () => {
    // Arrange + Act
    const wrapper = mount(LotTable, {
      props: { lots: [], loading: false },
      ...router,
    })

    // Assert
    expect(wrapper.text()).toContain('No lots found')
  })

  it('displays the batch number and country name in each row', () => {
    // Arrange
    const wrapper = mount(LotTable, {
      props: { lots: [makeLot()], loading: false },
      ...router,
    })

    // Assert
    expect(wrapper.text()).toContain('ABC123')
    expect(wrapper.text()).toContain('Colombia')
  })

  it('hides the Zone column when showZone is false', () => {
    // Arrange + Act
    const wrapper = mount(LotTable, {
      props: { lots: [makeLot()], loading: false, showZone: false },
      ...router,
    })

    // Assert
    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).not.toContain('Zone')
  })

  it('hides the Latest reading column when showReadings is false', () => {
    // Arrange + Act
    const wrapper = mount(LotTable, {
      props: { lots: [makeLot()], loading: false, showReadings: false },
      ...router,
    })

    // Assert
    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).not.toContain('Latest reading')
  })

  it('shows the latest reading temperature when the reading is present', () => {
    // Arrange
    const lot = makeLot({
      latest_reading: {
        temperature: 22.5,
        humidity: 65,
        recorded_at: '2024-01-10T10:00:00',
        threshold_status: 'ok',
      },
    })

    // Act
    const wrapper = mount(LotTable, {
      props: { lots: [lot], loading: false, showReadings: true },
      ...router,
    })

    // Assert
    expect(wrapper.text()).toContain('22.5°C')
  })
})
