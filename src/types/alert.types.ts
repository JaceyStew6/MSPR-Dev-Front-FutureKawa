export type AlertType = 'threshold' | 'expiry' | 'fifo'

export interface Alert {
  id: number
  type: AlertType
  lot_id?: number
  lot_batch_number?: string
  zone_id?: number
  zone_name?: string
  warehouse_id?: number
  warehouse_name?: string
  country_id?: number
  country_name?: string
  message: string
  is_read: boolean
  is_active: boolean
  created_at: string
}

export interface AlertFilters {
  active?: boolean
  type?: AlertType
  country_id?: number
  warehouse_id?: number
  page?: number
  limit?: number
}
