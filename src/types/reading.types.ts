export type Granularity = 'raw' | '1h' | '1d'
export type ThresholdStatus = 'ok' | 'warn' | 'alert'

export interface Reading {
  id: string
  lot_id?: string
  zone_id?: string
  warehouse_id?: string
  temperature: number
  humidity: number
  recorded_at: string
  threshold_status: ThresholdStatus
}

export interface ReadingFilters {
  lot_id?: string
  zone_id?: string
  warehouse_id?: string
  country_id?: string
  granularity?: Granularity
  from?: string
  to?: string
}

export interface ZoneLatestReading {
  zone_id: string
  zone_name: string
  temperature: number
  humidity: number
  recorded_at: string
  threshold_status: ThresholdStatus
}

export interface WarehouseReadingSummary {
  warehouse_id: string
  zones: ZoneLatestReading[]
}
