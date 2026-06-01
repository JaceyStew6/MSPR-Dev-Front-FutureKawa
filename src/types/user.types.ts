export type UserRole =
  | 'farm_manager'
  | 'warehouse_manager'
  | 'quality'
  | 'supply_chain'
  | 'hq'

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  country_id?: number
  farm_id?: number
  warehouse_ids?: number[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
