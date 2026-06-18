import { api } from './api'
import type { Alert, AlertFilters, AlertType } from '@/types/alert.types'
import type { PaginatedResponse } from '@/types/lot.types'

// Actual shape returned by GET /alertes
interface BackendAlert {
  idAlerte: string
  typeAlerte: string
  description: string
  dateEmission: string
  idZone: string
}

function mapAlertType(typeAlerte: string): AlertType {
  const t = (typeAlerte ?? '').toLowerCase()
  if (t.includes('fifo')) return 'fifo'
  if (t.includes('expir') || t.includes('date')) return 'expiry'
  return 'threshold'
}

function mapAlert(b: BackendAlert): Alert {
  return {
    id: b.idAlerte,
    type: mapAlertType(b.typeAlerte),
    zone_id: b.idZone,
    message: b.description ?? '',
    is_read: false,
    is_active: true,
    created_at: b.dateEmission ?? new Date().toISOString(),
  }
}

export const alertsService = {
  // GET /alertes?pays=...&idEntrepot=...
  getAlerts: async (filters: AlertFilters = {}): Promise<PaginatedResponse<Alert>> => {
    const qs = new URLSearchParams()
    if (filters.country_id) qs.set('pays', filters.country_id)
    if (filters.warehouse_id) qs.set('idEntrepot', filters.warehouse_id)
    const query = qs.size ? `?${qs.toString()}` : ''
    const alerts = await api.get<BackendAlert[]>(`/alertes${query}`)
    let mapped = alerts.map(mapAlert)

    if (filters.active !== undefined) mapped = mapped.filter((a) => a.is_active === filters.active)
    if (filters.type) mapped = mapped.filter((a) => a.type === filters.type)

    const page = filters.page ?? 1
    const limit = filters.limit ?? mapped.length
    const start = (page - 1) * limit
    return { data: mapped.slice(start, start + limit), total: mapped.length, page, limit }
  },

  // PATCH not covered by the GET-only swagger — kept for compatibility
  markAsRead: (id: string) =>
    api.patch<Alert>(`/alerts/${id}/read`, {}),
}
