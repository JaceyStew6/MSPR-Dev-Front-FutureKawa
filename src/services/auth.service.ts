import { api } from './api'
import type {
  LoginPayload,
  RegisterPayload,
  BackendAuthResponse,
  BackendMeResponse,
  BackendRole,
  User,
  UserRole,
} from '@/types/user.types'

// The backend has no dedicated "farm manager" role: ROLE_OPERATION_MANAGER is
// the role authorized to create lots (POST /lot), which is the farm manager's
// action in this app, so it is mapped to 'farm_manager' here.
const ROLE_MAP: Record<BackendRole, UserRole> = {
  ROLE_ADMIN: 'admin',
  ROLE_HEADQUARTER: 'hq',
  ROLE_WAREHOUSE_MANAGER: 'warehouse_manager',
  ROLE_QUALITY: 'quality',
  ROLE_OPERATION_MANAGER: 'farm_manager',
  ROLE_SUPPLY_CHAIN: 'supply_chain',
}

// A user can hold several backend roles at once; this order picks which one
// drives routing/UI when that happens.
const ROLE_PRIORITY: UserRole[] = [
  'admin',
  'hq',
  'warehouse_manager',
  'quality',
  'supply_chain',
  'farm_manager',
]

function toUser(me: BackendMeResponse): User {
  const roles = me.roles.map((r) => ROLE_MAP[r]).filter((r): r is UserRole => Boolean(r))
  const role = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? 'hq'

  return {
    id: me.id,
    email: me.email,
    name: me.email.split('@')[0] ?? me.email,
    role,
    roles,
    country_id: me.countryId ?? undefined,
  }
}

// Unlike the rest of the API (mounted at the root, e.g. /countries, /lot/**),
// AuthController is mounted under /api/auth (@RequestMapping("/api/auth")),
// so these paths need the /api prefix while the others don't.
export const authService = {
  login: (payload: LoginPayload) => api.post<BackendAuthResponse>('/api/auth/login', payload),

  register: (payload: RegisterPayload) => api.post<BackendAuthResponse>('/api/auth/register', payload),

  // Stateless JWT: the backend exposes no /auth/logout endpoint, logout is client-side only.

  me: async (): Promise<User> => toUser(await api.get<BackendMeResponse>('/api/auth/me')),
}
