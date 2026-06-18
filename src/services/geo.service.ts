import { api } from './api'
import type { Country, Farm, Warehouse, Zone } from '@/types/geo.types'

// Actual shapes returned by the backend
interface BackendCountrySettings {
  url?: string
  tolerences?: unknown
}

interface BackendFarm {
  idExploitation: string
  nom: string
  adresse?: string
}

interface BackendWarehouse {
  idEntrepot: string
  localisation?: string
  nom: string
}

interface BackendZone {
  idZone: string
  nomZone: string
  idEntrepot: string
  idCapteur?: string
  lotCount?: number
}

export const geoService = {
  // GET /countries → Map<String, CountrySettings>
  getCountries: async (): Promise<Country[]> => {
    const map = await api.get<Record<string, BackendCountrySettings>>('/countries')
    return Object.keys(map).map((name) => ({ id: name, name, code: name }))
  },

  // GET /farms/{pays} → List<Exploitation>
  getFarms: async (countryId?: string): Promise<Farm[]> => {
    if (!countryId) return []
    const farms = await api.get<BackendFarm[]>(`/farms/${countryId}`)
    return farms.map((f) => ({
      id: f.idExploitation,
      name: f.nom,
      country_id: countryId,
    }))
  },

  // GET /warehouses/{pays} → List<Entrepot>
  getWarehouses: async (params?: { country_id?: string; farm_id?: string }): Promise<Warehouse[]> => {
    if (params?.country_id) {
      const list = await api.get<BackendWarehouse[]>(`/warehouses/${params.country_id}`)
      return list.map((w) => ({ id: w.idEntrepot, name: w.nom, country_id: params.country_id! }))
    }
    // No country: fetch all countries and aggregate
    const countries = await geoService.getCountries()
    const results = await Promise.all(
      countries.map((c) =>
        api
          .get<BackendWarehouse[]>(`/warehouses/${c.id}`)
          .then((list) => list.map((w) => ({ id: w.idEntrepot, name: w.nom, country_id: c.id })))
          .catch(() => [] as Warehouse[]),
      ),
    )
    return results.flat()
  },

  // GET /warehouses/{entrepotId}/zones?pays=... → List<ZoneResponseDto>
  getZones: async (warehouseId: string, country?: string): Promise<Zone[]> => {
    const qs = country ? `?pays=${country}` : ''
    const zones = await api.get<BackendZone[]>(`/warehouses/${warehouseId}/zones${qs}`)
    return zones.map((z) => ({
      id: z.idZone,
      name: z.nomZone,
      warehouse_id: z.idEntrepot,
    }))
  },
}
