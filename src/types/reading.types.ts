export type Granularity = 'raw' | '1h' | '1d'
export type ThresholdStatus = 'ok' | 'warn' | 'alert'

export interface Reading {
  id: number
  lot_id?: number
  zone_id?: number
  warehouse_id?: number
  temperature: number
  humidity: number
  recorded_at: string
  threshold_status: ThresholdStatus
}

export interface ReadingFilters {
  lot_id?: number
  zone_id?: number
  warehouse_id?: number
  granularity?: Granularity
  from?: string
  to?: string
}

export interface ZoneLatestReading {
  zone_id: number
  zone_name: string
  temperature: number
  humidity: number
  recorded_at: string
  threshold_status: ThresholdStatus
}

export interface WarehouseReadingSummary {
  warehouse_id: number
  zones: ZoneLatestReading[]
}
