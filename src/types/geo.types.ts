export interface Country {
  id: string
  name: string
  code: string
}

export interface Farm {
  id: string
  name: string
  country_id: string
  country_name?: string
}

export interface Warehouse {
  id: string
  name: string
  country_id: string
  farm_id?: string
}

export interface Zone {
  id: string
  name: string
  warehouse_id: string
  target_temperature?: number
  target_humidity?: number
  tolerance?: number
}
