import { api } from './api'
import type { Country, Farm, Warehouse, Zone } from '@/types/geo.types'

export const geoService = {
  getCountries: () => api.get<Country[]>('/countries'),

  getFarms: (countryId?: number) => {
    const qs = countryId ? `?country_id=${countryId}` : ''
    return api.get<Farm[]>(`/farms${qs}`)
  },

  getWarehouses: (params?: { country_id?: number; farm_id?: number }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
      : ''
    return api.get<Warehouse[]>(`/warehouses${qs}`)
  },

  getZones: (warehouseId: number) =>
    api.get<Zone[]>(`/warehouses/${warehouseId}/zones`),
}
