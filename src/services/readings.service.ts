import { api } from './api'
import type { Reading, ReadingFilters, ZoneLatestReading, WarehouseReadingSummary } from '@/types/reading.types'

// Shape GET /lot/{idLot}/mesures → List<MesureLotResponseDto>
interface BackendLotReading {
  temperature: number
  humidite: number
  dateMesure: string
}

// Shape GET /readings/{idZone}/ and GET /zones/{idZone}/readings/latest → MesureResponseDto
interface BackendReading {
  idMesure?: string
  temperature: number
  humidite: number
  dateMesure: string
  idCapteur?: string
}

// Shape GET /warehouses/{idEntrepot}/readings/summary → List<CapteurSummaryResponseDto>
interface BackendSensorSummary {
  zone_id: string
  zone_name: string
  last_temp: number
  last_humidity: number
  avg_temp_24h?: number
  avg_humidity_24h?: number
}

function mapLotReading(b: BackendLotReading, index: number): Reading {
  return {
    id: String(index),
    temperature: b.temperature ?? 0,
    humidity: b.humidite ?? 0,
    recorded_at: b.dateMesure ?? new Date().toISOString(),
    threshold_status: 'ok',
  }
}

function mapReading(b: BackendReading, index: number): Reading {
  return {
    id: b.idMesure ?? String(index),
    temperature: b.temperature ?? 0,
    humidity: b.humidite ?? 0,
    recorded_at: b.dateMesure ?? new Date().toISOString(),
    threshold_status: 'ok',
  }
}

export const readingsService = {
  getReadings: async (filters: ReadingFilters = {}): Promise<Reading[]> => {
    // Readings by lot → GET /lot/{idLot}/mesures
    if (filters.lot_id) {
      const readings = await api.get<BackendLotReading[]>(`/lot/${filters.lot_id}/mesures`)
      return readings.map(mapLotReading)
    }
    // Readings by zone → GET /readings/{idZone}/?pays=&startDate=...&endDate=...
    if (filters.zone_id) {
      const from = filters.from ? `${filters.from}T00:00:00` : '2020-01-01T00:00:00'
      const to = filters.to ? `${filters.to}T23:59:59` : new Date().toISOString().slice(0, 19)
      try {
        const readings = await api.get<BackendReading[]>(
          `/readings/${filters.zone_id}/?pays=&startDate=${from}&endDate=${to}`,
        )
        return readings.map(mapReading)
      } catch {
        return []
      }
    }
    return []
  },

  // GET /zones/{idZone}/readings/latest?pays=...
  getZoneLatest: async (zoneId: string, country?: string): Promise<ZoneLatestReading> => {
    const qs = country ? `?pays=${country}` : ''
    const m = await api.get<BackendReading>(`/zones/${zoneId}/readings/latest${qs}`)
    return {
      zone_id: zoneId,
      zone_name: '',
      temperature: m.temperature ?? 0,
      humidity: m.humidite ?? 0,
      recorded_at: m.dateMesure ?? new Date().toISOString(),
      threshold_status: 'ok',
    }
  },

  // GET /warehouses/{idEntrepot}/readings/summary?pays=...
  getWarehouseSummary: async (warehouseId: string, country?: string): Promise<WarehouseReadingSummary> => {
    const qs = country ? `?pays=${country}` : ''
    const summaries = await api.get<BackendSensorSummary[]>(
      `/warehouses/${warehouseId}/readings/summary${qs}`,
    )
    return {
      warehouse_id: warehouseId,
      zones: summaries.map((s) => ({
        zone_id: s.zone_id,
        zone_name: s.zone_name,
        temperature: Number(s.last_temp) ?? 0,
        humidity: Number(s.last_humidity) ?? 0,
        recorded_at: new Date().toISOString(),
        threshold_status: 'ok' as const,
      })),
    }
  },
}
