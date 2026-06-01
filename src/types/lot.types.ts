export type LotStatus = 'pending' | 'stored' | 'compliant' | 'alert' | 'blocked' | 'shipped'

export interface Lot {
  id: number
  batch_number: string
  farm_id: number
  farm_name?: string
  country_id: number
  country_name?: string
  warehouse_id?: number
  warehouse_name?: string
  zone_id?: number
  zone_name?: string
  production_date: string
  storage_date?: string
  status: LotStatus
  latest_reading?: {
    temperature: number
    humidity: number
    recorded_at: string
    threshold_status: 'ok' | 'warn' | 'alert'
  }
}

export interface LotFilters {
  country_id?: number
  farm_id?: number
  warehouse_id?: number
  zone_id?: number
  status?: LotStatus
  page?: number
  limit?: number
  sort?: 'storage_date_asc' | 'storage_date_desc' | 'production_date_asc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
