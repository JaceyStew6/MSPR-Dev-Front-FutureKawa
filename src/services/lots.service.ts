import { api } from './api'
import { geoService } from './geo.service'
import { readingsService } from './readings.service'
import type { Lot, LotFilters, LotStatus, PaginatedResponse } from '@/types/lot.types'

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

// country_id est optionnel : s'il est absent, on infère le pays depuis l'entrepôt du lot
async function enrichWithNames(lots: Lot[], country_id?: string): Promise<Lot[]> {
  // Fetch warehouses — scoped si country_id fourni, tous les pays sinon
  const warehouses = await geoService.getWarehouses(country_id ? { country_id } : undefined)
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]))

  // Pays effectivement présents dans les lots (via leur entrepôt)
  const neededCountries = new Set<string>()
  if (country_id) {
    neededCountries.add(country_id)
  } else {
    for (const l of lots) {
      const wh = l.warehouse_id ? warehouseMap.get(l.warehouse_id) : undefined
      if (wh?.country_id) neededCountries.add(wh.country_id)
    }
  }

  // Exploitations par pays
  const farmMapByCountry = new Map<string, Map<string, string>>()
  await Promise.all(
    [...neededCountries].map(async (cId) => {
      const farms = await geoService.getFarms(cId)
      farmMapByCountry.set(cId, new Map(farms.map((f) => [f.id, f.name])))
    }),
  )

  // Zones de tous les entrepôts concernés
  const zoneLists = await Promise.all(
    warehouses.map((w) => geoService.getZones(w.id, w.country_id)),
  )
  const allZones = zoneLists.flat()
  // Double index : UUID→nom ET nom→UUID (emplacement peut contenir l'un ou l'autre)
  const zoneNameById = new Map(allZones.map((z) => [z.id, z.name]))
  const zoneIdByName = new Map(allZones.map((z) => [z.name.toLowerCase(), z.id]))

  return lots.map((l) => {
    const warehouse = l.warehouse_id ? warehouseMap.get(l.warehouse_id) : undefined
    const lotCountry = country_id ?? warehouse?.country_id ?? ''
    const countryName = lotCountry
      ? lotCountry.charAt(0).toUpperCase() + lotCountry.slice(1).toLowerCase()
      : l.country_name

    const farmMap = lotCountry ? farmMapByCountry.get(lotCountry) : undefined

    const raw = l.zone_id
    const nameFromId = raw ? zoneNameById.get(raw) : undefined
    const idFromName = raw ? zoneIdByName.get(raw.toLowerCase()) : undefined

    return {
      ...l,
      country_id: lotCountry || l.country_id,
      country_name: countryName,
      warehouse_name: warehouse?.name ?? l.warehouse_name,
      farm_name: l.farm_id && farmMap ? (farmMap.get(l.farm_id) ?? l.farm_name) : l.farm_name,
      zone_id: nameFromId ? raw : (idFromName ?? undefined),
      zone_name: nameFromId ?? (idFromName ? raw : raw),
    }
  })
}

export const lotsService = {
  getLots: async (filters: LotFilters = {}): Promise<PaginatedResponse<Lot>> => {
    const raw = await api.get<BackendLot[]>('/lots')
    let mapped = raw.map(mapLot)

    // Enrichir les noms si country_id fourni OU si withReadings demandé (pour les rôles sans pays)
    if (filters.country_id || filters.withReadings) {
      mapped = await enrichWithNames(mapped, filters.country_id)
    }

    // Filtrage client (le backend ne supporte pas les filtres)
    if (filters.status) mapped = mapped.filter((l) => l.status === filters.status)
    if (filters.warehouse_id) mapped = mapped.filter((l) => l.warehouse_id === filters.warehouse_id)
    if (filters.zone_id) mapped = mapped.filter((l) => l.zone_id === filters.zone_id)
    if (filters.farm_id) mapped = mapped.filter((l) => l.farm_id === filters.farm_id)

    if (filters.sort === 'storage_date_asc') {
      mapped.sort((a, b) => (a.storage_date ?? '').localeCompare(b.storage_date ?? ''))
    }

    const page = filters.page ?? 1
    const limit = filters.limit ?? mapped.length
    const start = (page - 1) * limit
    const pageData = mapped.slice(start, start + limit)

    if (filters.withReadings) {
      const latestReadings = await Promise.all(pageData.map((l) => readingsService.getLatestReading(l.id)))
      return {
        data: pageData.map((l, i) => {
          const r = latestReadings[i]
          return r
            ? {
                ...l,
                latest_reading: {
                  temperature: r.temperature,
                  humidity: r.humidite,
                  recorded_at: r.dateMesure,
                  threshold_status: 'ok' as const,
                },
              }
            : l
        }),
        total: mapped.length,
        page,
        limit,
      }
    }

    return { data: pageData, total: mapped.length, page, limit }
  },

  getLot: async (id: string, country_id?: string): Promise<Lot> => {
    const lot = await api.get<BackendLot>(`/lot/${id}`).then(mapLot)
    const [enriched] = await enrichWithNames([lot], country_id)
    return enriched
  },

  createLot: (payload: {
    farm_id: string
    pays: string
    status: string
    quantite: number
    caracteristique: number
  }): Promise<void> => {
    const qs = new URLSearchParams({ pays: payload.pays }).toString()
    return api.post<void>(`/lot?${qs}`, {
      idExploitation: payload.farm_id,
      status: payload.status,
      quantite: payload.quantite,
      caracteristique: payload.caracteristique,
      dateProduction: new Date().toISOString().split('T')[0],
    })
  },

  updateStatus: (id: string, status: LotStatus) =>
    api.patch<BackendLot>(`/lots/${id}/status`, { status }).then(mapLot),

  updateZone: (id: string, zone_id: string, warehouse_id?: string) =>
    api.patch<BackendLot>(`/lots/${id}/zone`, { zone_id, ...(warehouse_id && { warehouse_id }) }).then(mapLot),

  stockIn: async (lot_id: string, zone_id: string, warehouse_id: string): Promise<Lot> => {
    await api.patch<BackendLot>(`/lots/${lot_id}/status`, { status: 'stored' })
    return api.patch<BackendLot>(`/lots/${lot_id}/zone`, { zone_id, warehouse_id }).then(mapLot)
  },
}
