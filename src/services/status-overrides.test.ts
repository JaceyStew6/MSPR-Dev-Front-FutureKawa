import { describe, it, expect, beforeEach } from 'vitest'
import { saveStatusOverride, applyStatusOverrides, applyStatusOverride } from './status-overrides'

describe('status-overrides', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveStatusOverride', () => {
    it('persists the override to localStorage', () => {
      // Arrange + Act
      saveStatusOverride('lot-1', 'compliant')

      // Assert
      const stored = JSON.parse(localStorage.getItem('futurekawa_status_overrides')!)
      expect(stored['lot-1']).toBe('compliant')
    })

    it('merges with existing overrides without losing previous entries', () => {
      // Arrange
      saveStatusOverride('lot-1', 'compliant')

      // Act
      saveStatusOverride('lot-2', 'blocked')

      // Assert
      const stored = JSON.parse(localStorage.getItem('futurekawa_status_overrides')!)
      expect(stored['lot-1']).toBe('compliant')
      expect(stored['lot-2']).toBe('blocked')
    })

    it('overwrites a previous override for the same lot', () => {
      // Arrange
      saveStatusOverride('lot-1', 'pending')

      // Act
      saveStatusOverride('lot-1', 'shipped')

      // Assert
      const stored = JSON.parse(localStorage.getItem('futurekawa_status_overrides')!)
      expect(stored['lot-1']).toBe('shipped')
    })
  })

  describe('applyStatusOverrides', () => {
    it('returns lots unchanged when no overrides exist', () => {
      // Arrange
      const lots = [{ id: 'lot-1', status: 'pending' }]

      // Act
      const result = applyStatusOverrides(lots)

      // Assert
      expect(result[0]?.status).toBe('pending')
    })

    it('applies saved override to the matching lot', () => {
      // Arrange
      saveStatusOverride('lot-1', 'compliant')
      const lots = [
        { id: 'lot-1', status: 'pending' },
        { id: 'lot-2', status: 'stored' },
      ]

      // Act
      const result = applyStatusOverrides(lots)

      // Assert
      expect(result[0]?.status).toBe('compliant')
      expect(result[1]?.status).toBe('stored')
    })

    it('does not mutate the original array', () => {
      // Arrange
      saveStatusOverride('lot-1', 'blocked')
      const lots = [{ id: 'lot-1', status: 'pending' }]

      // Act
      applyStatusOverrides(lots)

      // Assert
      expect(lots[0]?.status).toBe('pending')
    })
  })

  describe('applyStatusOverride', () => {
    it('returns the lot unchanged when no override exists', () => {
      // Arrange
      const lot = { id: 'lot-1', status: 'pending' }

      // Act
      const result = applyStatusOverride(lot)

      // Assert
      expect(result.status).toBe('pending')
    })

    it('returns a new object with the overridden status', () => {
      // Arrange
      saveStatusOverride('lot-1', 'shipped')
      const lot = { id: 'lot-1', status: 'pending' }

      // Act
      const result = applyStatusOverride(lot)

      // Assert
      expect(result.status).toBe('shipped')
      expect(lot.status).toBe('pending') // original not mutated
    })
  })
})
