import { api } from './api'
import type { Lot, LotFilters, LotStatus, PaginatedResponse } from '@/types/lot.types'

function buildQs(params: Record<string, string | number | boolean | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number | boolean][]
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : ''
}

export const lotsService = {
  getLots: (filters: LotFilters = {}) =>
    api.get<PaginatedResponse<Lot>>(`/lots${buildQs(filters as Record<string, string | number | boolean | undefined>)}`),

  getLot: (id: number) => api.get<Lot>(`/lots/${id}`),

  createLot: (payload: { production_date: string; farm_id: number; zone_id: number }) =>
    api.post<Lot>('/lots', payload),

  updateStatus: (id: number, status: LotStatus) =>
    api.patch<Lot>(`/lots/${id}/status`, { status }),

  updateZone: (id: number, zone_id: number) =>
    api.patch<Lot>(`/lots/${id}/zone`, { zone_id }),
}
