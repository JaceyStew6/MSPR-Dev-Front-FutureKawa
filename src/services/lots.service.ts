import { api } from './api'
import { geoService } from './geo.service'
import type { Lot, LotFilters, LotStatus, PaginatedResponse } from '@/types/lot.types'

// Actual shape returned by GET /lots and GET /lot/{id}
interface BackendLot {
  idLot: string
  status?: string
  quantite?: number
  caracteristique?: number
  dateSortie?: string
  dateStockage?: string
  dateProduction?: string
  emplacement?: string
  idExploitation?: string
  idEntrepot?: string
}

function mapLot(b: BackendLot): Lot {
  return {
    id: b.idLot,
    batch_number: b.idLot.substring(0, 8).toUpperCase(),
    farm_id: b.idExploitation ?? '',
    warehouse_id: b.idEntrepot,
    // emplacement peut contenir un UUID de zone ou un nom texte — résolu dans enrichWithNames
    zone_id: b.emplacement,
    production_date: b.dateProduction ?? '',
    storage_date: b.dateStockage,
    status: (b.status?.toLowerCase() as LotStatus) ?? 'pending',
  }
}

async function enrichWithNames(lots: Lot[], country_id: string): Promise<Lot[]> {
  const countryName = country_id.charAt(0).toUpperCase() + country_id.slice(1).toLowerCase()
  const [warehouses, farms] = await Promise.all([
    geoService.getWarehouses({ country_id }),
    geoService.getFarms(country_id),
  ])
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]))
  const farmMap = new Map(farms.map((f) => [f.id, f.name]))

  const zoneLists = await Promise.all(
    warehouses.map((w) => geoService.getZones(w.id, country_id))
  )
  const allZones = zoneLists.flat()
  // Double index pour gérer les deux cas possibles de `emplacement` :
  //   UUID  → lookup UUID→nom
  //   nom texte → lookup nom→UUID (pour que le filtre zone_id fonctionne)
  const zoneNameById = new Map(allZones.map((z) => [z.id, z.name]))
  const zoneIdByName = new Map(allZones.map((z) => [z.name.toLowerCase(), z.id]))

  return lots.map((l) => {
    const raw = l.zone_id
    const nameFromId = raw ? zoneNameById.get(raw) : undefined
    const idFromName = raw ? zoneIdByName.get(raw.toLowerCase()) : undefined
    return {
      ...l,
      country_id,
      country_name: countryName,
      warehouse_name: l.warehouse_id ? (warehouseMap.get(l.warehouse_id) ?? l.warehouse_name) : l.warehouse_name,
      farm_name: l.farm_id ? (farmMap.get(l.farm_id) ?? l.farm_name) : l.farm_name,
      zone_id: nameFromId ? raw : (idFromName ?? undefined),
      zone_name: nameFromId ?? (idFromName ? raw : raw),
    }
  })
}

export const lotsService = {
  getLots: async (filters: LotFilters = {}): Promise<PaginatedResponse<Lot>> => {
    const raw = await api.get<BackendLot[]>('/lots')
    let mapped = raw.map(mapLot)

    if (filters.country_id) {
      mapped = await enrichWithNames(mapped, filters.country_id)
    }

    // Client-side filtering (backend does not support filters)
    if (filters.status) mapped = mapped.filter((l) => l.status === filters.status)
    if (filters.warehouse_id) mapped = mapped.filter((l) => l.warehouse_id === filters.warehouse_id)
    if (filters.zone_id) mapped = mapped.filter((l) => l.zone_id === filters.zone_id)
    if (filters.farm_id) mapped = mapped.filter((l) => l.farm_id === filters.farm_id)

    // FIFO sort by storage date if requested
    if (filters.sort === 'storage_date_asc') {
      mapped.sort((a, b) => (a.storage_date ?? '').localeCompare(b.storage_date ?? ''))
    }

    // Simulated pagination
    const page = filters.page ?? 1
    const limit = filters.limit ?? mapped.length
    const start = (page - 1) * limit
    return { data: mapped.slice(start, start + limit), total: mapped.length, page, limit }
  },

  getLot: async (id: string, country_id?: string): Promise<Lot> => {
    const lot = await api.get<BackendLot>(`/lot/${id}`).then(mapLot)
    if (!country_id) return lot
    const [enriched] = await enrichWithNames([lot], country_id)
    return enriched
  },

  createLot: (payload: { production_date: string; farm_id: string; zone_id: string }) =>
    api.post<BackendLot>('/lots', payload).then(mapLot),

  updateStatus: (id: string, status: LotStatus) =>
    api.patch<BackendLot>(`/lots/${id}/status`, { status }).then(mapLot),

  updateZone: (id: string, zone_id: string, warehouse_id?: string) =>
    api.patch<BackendLot>(`/lots/${id}/zone`, { zone_id, ...(warehouse_id && { warehouse_id }) }).then(mapLot),

  stockIn: async (lot_id: string, zone_id: string, warehouse_id: string): Promise<Lot> => {
    await api.patch<BackendLot>(`/lots/${lot_id}/status`, { status: 'stored' })
    return api.patch<BackendLot>(`/lots/${lot_id}/zone`, { zone_id, warehouse_id }).then(mapLot)
  },
}
