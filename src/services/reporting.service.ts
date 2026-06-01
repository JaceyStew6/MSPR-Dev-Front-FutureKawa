import { api } from './api'
import type { GlobalReport, StockReport, QualityReport } from '@/types/reporting.types'

export const reportingService = {
  getGlobal: () => api.get<GlobalReport>('/reporting/global'),
  getStock: (params?: { country_id?: number }) => {
    const qs = params?.country_id ? `?country_id=${params.country_id}` : ''
    return api.get<StockReport>(`/reporting/stock${qs}`)
  },
  getQuality: (params?: { country_id?: number; from?: string; to?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
      : ''
    return api.get<QualityReport>(`/reporting/quality${qs}`)
  },
}
