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
  it('posts credentials and returns the auth response', async () => {
    // Arrange
    const payload = { email: 'alice@test.com', password: 'secret' }
    const response = { token: 'tok-123', user: { id: 'u-1', name: 'Alice', role: 'quality' } }
    mockPost.mockResolvedValue(response)

    // Act
    const result = await authService.login(payload)

    // Assert
    expect(mockPost).toHaveBeenCalledWith('/auth/login', payload)
    expect(result).toEqual(response)
  })
})

describe('authService.logout', () => {
  it('posts to the logout endpoint', async () => {
    // Arrange
    mockPost.mockResolvedValue(undefined)

    // Act
    await authService.logout()

    // Assert
    expect(mockPost).toHaveBeenCalledWith('/auth/logout', {})
  })
})

describe('authService.me', () => {
  it('fetches the current user', async () => {
    // Arrange
    const user = { id: 'u-1', name: 'Alice', role: 'quality', email: 'alice@test.com' }
    mockGet.mockResolvedValue(user)

    // Act
    const result = await authService.me()

    // Assert
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(user)
  })
})
