export type AlertType = 'threshold' | 'expiry' | 'fifo'

export interface Alert {
  id: string
  type: AlertType
  lot_id?: string
  lot_batch_number?: string
  zone_id?: string
  zone_name?: string
  warehouse_id?: string
  warehouse_name?: string
  country_id?: string
  country_name?: string
  message: string
  is_read: boolean
  is_active: boolean
  created_at: string
}

export interface AlertFilters {
  active?: boolean
  type?: AlertType
  country_id?: string
  warehouse_id?: string
  page?: number
  limit?: number
}
