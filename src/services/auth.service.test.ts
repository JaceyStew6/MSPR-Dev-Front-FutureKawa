import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from './api'
import { authService } from './auth.service'

const mockGet = vi.mocked(api.get)
const mockPost = vi.mocked(api.post)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.login', () => {
  it('posts credentials and returns the raw backend token response', async () => {
    // Arrange
    const payload = { email: 'alice@test.com', password: 'secret' }
    const response = { token: 'tok-123' }
    mockPost.mockResolvedValue(response)

    // Act
    const result = await authService.login(payload)

    // Assert
    expect(mockPost).toHaveBeenCalledWith('/api/auth/login', payload)
    expect(result).toEqual(response)
  })
})

describe('authService.me', () => {
  it('fetches the current user and maps backend roles to the frontend role model', async () => {
    // Arrange
    const backendUser = {
      id: 'u-1',
      email: 'alice@test.com',
      roles: ['ROLE_QUALITY'],
      countryId: 'country-uuid',
    }
    mockGet.mockResolvedValue(backendUser)

    // Act
    const result = await authService.me()

    // Assert
    expect(mockGet).toHaveBeenCalledWith('/api/auth/me')
    expect(result).toEqual({
      id: 'u-1',
      email: 'alice@test.com',
      name: 'alice',
      role: 'quality',
      roles: ['quality'],
      country_id: 'country-uuid',
    })
  })

  it('maps ROLE_ADMIN to the admin role', async () => {
    // Arrange
    mockGet.mockResolvedValue({
      id: 'u-2',
      email: 'admin@test.com',
      roles: ['ROLE_ADMIN'],
      countryId: null,
    })

    // Act
    const result = await authService.me()

    // Assert
    expect(result.role).toBe('admin')
    expect(result.country_id).toBeUndefined()
  })

  it('picks the highest-priority role when a user holds several', async () => {
    // Arrange
    mockGet.mockResolvedValue({
      id: 'u-3',
      email: 'multi@test.com',
      roles: ['ROLE_SUPPLY_CHAIN', 'ROLE_HEADQUARTER'],
      countryId: null,
    })

    // Act
    const result = await authService.me()

    // Assert
    expect(result.role).toBe('hq')
    expect(result.roles).toEqual(expect.arrayContaining(['hq', 'supply_chain']))
  })
})
