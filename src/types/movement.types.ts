export type MovementType = 'stock_in' | 'stock_out' | 'zone_transfer'
export type StockOutType = 'shipment' | 'transfer' | 'loss'

export interface Movement {
  id: string
  lot_id: string
  lot_batch_number?: string
  type: MovementType
  from_zone_id?: string
  from_zone_name?: string
  to_zone_id?: string
  to_zone_name?: string
  warehouse_id?: string
  warehouse_name?: string
  reason?: string
  performed_by?: string
  performed_at: string
}

export interface StockInPayload {
  lot_id: string
  zone_id: string
  warehouse_id: string
}

export interface StockOutPayload {
  lot_id: string
  pays: string
  type: StockOutType
}

export interface StockOutResponse {
  idHistorique: string
  status: string
}

export interface ZoneTransferPayload {
  lot_id: string
  zone_id: string
}
