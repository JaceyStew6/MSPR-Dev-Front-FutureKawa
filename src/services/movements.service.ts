import { api } from './api'
import type { Movement, StockInPayload, StockOutPayload } from '@/types/movement.types'
import type { PaginatedResponse } from '@/types/lot.types'

export const movementsService = {
  // No GET /movements endpoint in the backend — returns empty to avoid errors
  getMovements: async (_params?: {
    lot_id?: string
    warehouse_id?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Movement>> => {
    return { data: [], total: 0, page: 1, limit: 20 }
  },

  stockIn: (payload: StockInPayload) =>
    api.post<Movement>('/movements/stock-in', payload),

  stockOut: (payload: StockOutPayload) =>
    api.post<Movement>('/movements/stock-out', payload),
}
