import { api } from './api'
import type { Movement, StockInPayload, StockOutPayload } from '@/types/movement.types'
import type { PaginatedResponse } from '@/types/lot.types'

export const movementsService = {
  getMovements: (params?: { lot_id?: number; warehouse_id?: number; page?: number; limit?: number }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
      : ''
    return api.get<PaginatedResponse<Movement>>(`/movements${qs}`)
  },

  stockIn: (payload: StockInPayload) =>
    api.post<Movement>('/movements/stock-in', payload),

  stockOut: (payload: StockOutPayload) =>
    api.post<Movement>('/movements/stock-out', payload),
}
