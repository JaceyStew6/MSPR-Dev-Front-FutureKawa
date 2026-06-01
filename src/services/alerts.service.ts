import { api } from './api'
import type { Alert, AlertFilters } from '@/types/alert.types'
import type { PaginatedResponse } from '@/types/lot.types'

function buildQs(params: Record<string, string | number | boolean | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number | boolean][]
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : ''
}

export const alertsService = {
  getAlerts: (filters: AlertFilters = {}) =>
    api.get<PaginatedResponse<Alert>>(`/alerts${buildQs(filters as Record<string, string | number | boolean | undefined>)}`),

  markAsRead: (id: number) =>
    api.patch<Alert>(`/alerts/${id}/read`, {}),
}
