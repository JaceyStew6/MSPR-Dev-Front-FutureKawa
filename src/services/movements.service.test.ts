import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from './api'
import { movementsService } from './movements.service'

const mockPost = vi.mocked(api.post)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('movementsService.getMovements', () => {
  it('returns an empty paginated result without calling the API', async () => {
    // Act
    const result = await movementsService.getMovements()

    // Assert
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('movementsService.stockOut', () => {
  it('posts to the stockout endpoint with idLot and pays as query params', async () => {
    // Arrange
    mockPost.mockResolvedValue({ id: 'mv-1' })

    // Act
    await movementsService.stockOut({ lot_id: 'lot-1', pays: 'COLOMBIE', type: 'shipment' })

    // Assert
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('idLot=lot-1'),
      {},
    )
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('pays=COLOMBIE'),
      {},
    )
  })
})
