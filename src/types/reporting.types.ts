export interface GlobalKPIs {
  total_lots: number
  compliance_rate: number
  active_alerts: number
  avg_age_days: number
  movements_last_30d: number
}

export interface CountryBreakdown {
  country_id: number
  country_name: string
  total_lots: number
  compliance_rate: number
  active_alerts: number
}

export interface GlobalReport {
  kpis: GlobalKPIs
  by_country: CountryBreakdown[]
}

export interface StockReport {
  total_lots: number
  by_status: Record<string, number>
  by_country: CountryBreakdown[]
  fifo_at_risk: number
}

export interface QualityReport {
  compliance_rate: number
  total_alerts: number
  incidents: number
  by_zone: {
    zone_id: number
    zone_name: string
    warehouse_name: string
    drift_count: number
    compliance_rate: number
  }[]
}
