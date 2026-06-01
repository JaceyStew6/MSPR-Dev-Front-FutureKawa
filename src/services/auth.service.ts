import { api } from './api'
import type { LoginPayload, AuthResponse, User } from '@/types/user.types'

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  logout: () => api.post<void>('/auth/logout', {}),

  me: () => api.get<User>('/auth/me'),
}
