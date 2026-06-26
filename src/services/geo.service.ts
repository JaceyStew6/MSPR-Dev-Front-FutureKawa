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

const COUNTRY_NAMES: Record<string, string> = {
  BRESIL: 'Brazil',
  COLOMBIE: 'Colombia',
  EQUATEUR: 'Ecuador',
}

export function formatCountryName(id: string): string {
  return COUNTRY_NAMES[id.toUpperCase()] ?? (id.charAt(0).toUpperCase() + id.slice(1).toLowerCase())
}

function formatFarmName(nom: string): string {
  const cleaned = nom.replace(/^exploitation\s+/i, '').trim()
  const title = cleaned.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  return /farm/i.test(title) ? title : `${title} Farm`
}

function formatWarehouseName(nom: string): string {
  const cleaned = nom.replace(/^entrepôt\s+/i, '').replace(/^entrepot\s+/i, '').trim()
  const title = cleaned.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  return /warehouse/i.test(title) ? title : `${title} Warehouse`
}

export const geoService = {
  // GET /countries → Map<String, CountrySettings>
  getCountries: async (): Promise<Country[]> => {
    const map = await api.get<Record<string, BackendCountrySettings>>('/countries')
    return Object.keys(map).map((name) => ({ id: name, name: formatCountryName(name), code: name }))
  },

  // GET /farms/{pays} → List<Exploitation>
  getFarms: async (countryId?: string): Promise<Farm[]> => {
    if (!countryId) return []
    const farms = await api.get<BackendFarm[]>(`/farms/${countryId}`)
    return farms.map((f) => ({
      id: f.idExploitation,
      name: formatFarmName(f.nom),
      country_id: countryId,
    }))
  },

  // GET /warehouses/{pays} → List<Entrepot>
  getWarehouses: async (params?: { country_id?: string; farm_id?: string }): Promise<Warehouse[]> => {
    if (params?.country_id) {
      const list = await api.get<BackendWarehouse[]>(`/warehouses/${params.country_id}`)
      return list.map((w) => ({ id: w.idEntrepot, name: formatWarehouseName(w.nom), country_id: params.country_id! }))
    }
    // No country: fetch all countries and aggregate
    const countries = await geoService.getCountries()
    const results = await Promise.all(
      countries.map((c) =>
        api
          .get<BackendWarehouse[]>(`/warehouses/${c.id}`)
          .then((list) => list.map((w) => ({ id: w.idEntrepot, name: formatWarehouseName(w.nom), country_id: c.id })))
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
