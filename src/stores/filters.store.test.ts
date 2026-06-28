import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFiltersStore } from './filters.store'

describe('useFiltersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises with all filters undefined', () => {
    // Arrange + Act
    const store = useFiltersStore()

    // Assert
    expect(store.countryId).toBeUndefined()
    expect(store.farmId).toBeUndefined()
    expect(store.warehouseId).toBeUndefined()
    expect(store.zoneId).toBeUndefined()
  })

  describe('setCountry', () => {
    it('sets the countryId', () => {
      // Arrange
      const store = useFiltersStore()

      // Act
      store.setCountry('COLOMBIE')

      // Assert
      expect(store.countryId).toBe('COLOMBIE')
    })

    it('clears farm, warehouse, and zone when the country changes', () => {
      // Arrange
      const store = useFiltersStore()
      store.farmId = 'farm-1'
      store.warehouseId = 'wh-1'
      store.zoneId = 'zone-1'

      // Act
      store.setCountry('BRESIL')

      // Assert
      expect(store.farmId).toBeUndefined()
      expect(store.warehouseId).toBeUndefined()
      expect(store.zoneId).toBeUndefined()
    })
  })

  describe('setFarm', () => {
    it('sets the farmId and clears warehouse and zone', () => {
      // Arrange
      const store = useFiltersStore()
      store.countryId = 'COLOMBIE'
      store.warehouseId = 'wh-1'
      store.zoneId = 'zone-1'

      // Act
      store.setFarm('farm-2')

      // Assert
      expect(store.farmId).toBe('farm-2')
      expect(store.warehouseId).toBeUndefined()
      expect(store.zoneId).toBeUndefined()
      expect(store.countryId).toBe('COLOMBIE')
    })
  })

  describe('setWarehouse', () => {
    it('sets the warehouseId and clears zone only', () => {
      // Arrange
      const store = useFiltersStore()
      store.countryId = 'COLOMBIE'
      store.farmId = 'farm-1'
      store.zoneId = 'zone-1'

      // Act
      store.setWarehouse('wh-2')

      // Assert
      expect(store.warehouseId).toBe('wh-2')
      expect(store.zoneId).toBeUndefined()
      expect(store.countryId).toBe('COLOMBIE')
      expect(store.farmId).toBe('farm-1')
    })
  })

  describe('setZone', () => {
    it('sets only the zoneId without affecting other filters', () => {
      // Arrange
      const store = useFiltersStore()
      store.countryId = 'COLOMBIE'
      store.farmId = 'farm-1'
      store.warehouseId = 'wh-1'

      // Act
      store.setZone('zone-2')

      // Assert
      expect(store.zoneId).toBe('zone-2')
      expect(store.countryId).toBe('COLOMBIE')
      expect(store.farmId).toBe('farm-1')
      expect(store.warehouseId).toBe('wh-1')
    })
  })

  describe('reset', () => {
    it('clears all filters', () => {
      // Arrange
      const store = useFiltersStore()
      store.countryId = 'COLOMBIE'
      store.farmId = 'farm-1'
      store.warehouseId = 'wh-1'
      store.zoneId = 'zone-1'

      // Act
      store.reset()

      // Assert
      expect(store.countryId).toBeUndefined()
      expect(store.farmId).toBeUndefined()
      expect(store.warehouseId).toBeUndefined()
      expect(store.zoneId).toBeUndefined()
    })
  })
})
