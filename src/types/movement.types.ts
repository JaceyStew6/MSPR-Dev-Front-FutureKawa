export type MovementType = 'stock_in' | 'stock_out' | 'zone_transfer'

export interface Movement {
  id: number
  lot_id: number
  lot_batch_number?: string
  type: MovementType
  from_zone_id?: number
  from_zone_name?: string
  to_zone_id?: number
  to_zone_name?: string
  warehouse_id?: number
  warehouse_name?: string
  reason?: string
  performed_by?: string
  performed_at: string
}

export interface StockInPayload {
  lot_id: number
  zone_id: number
  warehouse_id: number
}

export interface StockOutPayload {
  lot_id: number
  warehouse_id: number
  reason?: string
}

export interface ZoneTransferPayload {
  lot_id: number
  zone_id: number
}
