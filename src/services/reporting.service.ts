import { api } from './api'
import type { GlobalReport, StockReport, QualityReport } from '@/types/reporting.types'

// Actual shapes returned by the backend
interface BackendReportingGlobal {
  totalLots: number
  avgAgeDays: number
  complianceRate: number
  countMouvementLast30Days: number
}

interface BackendReportingQuality {
  alertCount: number
  complianceRate: number
  nonComplianceCount: number
}

interface BackendReportingStock {
  totalLots: number
  avgAgeDays: number
  complianceRate: number
  lotIdsUrgentFifo?: string[]
}

export const reportingService = {
  // GET /reporting/global (no parameters)
  getGlobal: async (): Promise<GlobalReport> => {
    const dto = await api.get<BackendReportingGlobal>('/reporting/global')
    return {
      kpis: {
        total_lots: dto.totalLots,
        compliance_rate: dto.complianceRate,
        active_alerts: 0,
        avg_age_days: dto.avgAgeDays,
        movements_last_30d: dto.countMouvementLast30Days,
      },
      by_country: [],
    }
  },

  // GET /reporting/stock?pays=...&startDate=...&endDate=...
  getStock: async (params?: { country_id?: string; startDate?: string; endDate?: string }): Promise<StockReport> => {
    const country = params?.country_id ?? ''
    const startDate = params?.startDate ?? '2020-01-01T00:00:00'
    const endDate = params?.endDate ?? new Date().toISOString().slice(0, 19)
    try {
      const dto = await api.get<BackendReportingStock>(
        `/reporting/stock?pays=${country}&startDate=${startDate}&endDate=${endDate}`,
      )
      return {
        total_lots: dto.totalLots,
        by_status: {},
        by_country: [],
        fifo_at_risk: dto.lotIdsUrgentFifo?.length ?? 0,
      }
    } catch {
      return { total_lots: 0, by_status: {}, by_country: [], fifo_at_risk: 0 }
    }
  },

  // GET /reporting/quality?startDate=...&endDate=... (pays is optional)
  getQuality: async (params?: { country_id?: string; from?: string; to?: string }): Promise<QualityReport> => {
    const startDate = params?.from ? `${params.from}T00:00:00` : '2020-01-01T00:00:00'
    const endDate = params?.to ? `${params.to}T23:59:59` : new Date().toISOString().slice(0, 19)
    const countryQs = params?.country_id ? `pays=${params.country_id}&` : ''
    const dto = await api.get<BackendReportingQuality>(
      `/reporting/quality?${countryQs}startDate=${startDate}&endDate=${endDate}`,
    )
    return {
      compliance_rate: dto.complianceRate,
      total_alerts: dto.alertCount,
      incidents: dto.nonComplianceCount,
      by_zone: [],
    }
  },
}
