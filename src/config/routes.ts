// src/config/routes.ts
import type { UserRole } from '@/types/user.types'

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
    farm_manager: '/farm',
    warehouse_manager: '/home',
    quality: '/quality',
    supply_chain: '/supply-chain',
    hq: '/hq'
}