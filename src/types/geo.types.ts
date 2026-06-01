export interface Country {
  id: number
  name: string
  code: string
}

export interface Farm {
  id: number
  name: string
  country_id: number
  country_name?: string
}

export interface Warehouse {
  id: number
  name: string
  country_id: number
  farm_id?: number
}

export interface Zone {
  id: number
  name: string
  warehouse_id: number
  target_temperature?: number
  target_humidity?: number
  tolerance?: number
}
