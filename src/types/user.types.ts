export type UserRole =
  | 'admin'
  | 'farm_manager'
  | 'warehouse_manager'
  | 'quality'
  | 'supply_chain'
  | 'hq'

// Role enum as returned by the backend (com.backendSiege.domain.model.Role)
export type BackendRole =
  | 'ROLE_ADMIN'
  | 'ROLE_HEADQUARTER'
  | 'ROLE_WAREHOUSE_MANAGER'
  | 'ROLE_QUALITY'
  | 'ROLE_OPERATION_MANAGER'
  | 'ROLE_SUPPLY_CHAIN'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  roles: UserRole[]
  country_id?: string
  farm_id?: string
  warehouse_ids?: string[]
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  role?: BackendRole
}

// Raw response shape from POST /api/auth/login and /api/auth/register (AuthResponseDTO)
export interface BackendAuthResponse {
  token: string
}

// Raw response shape from GET /api/auth/me (MeResponseDTO)
export interface BackendMeResponse {
  id: string
  email: string
  roles: BackendRole[]
  countryId: string | null
}
