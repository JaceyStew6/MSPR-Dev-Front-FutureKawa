import { api } from './api'
import type { Reading, ReadingFilters, ZoneLatestReading, WarehouseReadingSummary } from '@/types/reading.types'

function buildQs(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string | number][]
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : ''
}

export const readingsService = {
  getReadings: (filters: ReadingFilters = {}) =>
    api.get<Reading[]>(`/readings${buildQs(filters as Record<string, string | number | undefined>)}`),

  getZoneLatest: (zoneId: number) =>
    api.get<ZoneLatestReading>(`/zones/${zoneId}/readings/latest`),

  getWarehouseSummary: (warehouseId: number) =>
    api.get<WarehouseReadingSummary>(`/warehouses/${warehouseId}/readings/summary`),
}
