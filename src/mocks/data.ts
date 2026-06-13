// ─── Données mock réalistes pour FutureKawa ───────────────────────────────────
// Activées uniquement quand VITE_MOCK=true (voir .env)

// ── Géographie ────────────────────────────────────────────────────────────────

export const COUNTRIES = [
  { id: 1, name: 'Colombie', code: 'CO' },
  { id: 2, name: 'Brésil', code: 'BR' },
  { id: 3, name: 'Equateur', code: 'EQ' },
]

export const FARMS = [
  { id: 1, name: 'Finca El Paraíso', country_id: 1, country_name: 'Colombie' },
  { id: 2, name: 'Finca La Esperanza', country_id: 1, country_name: 'Colombie' },
  { id: 3, name: 'Vitoria Estate', country_id: 2, country_name: 'Brésil' },
  { id: 4, name: 'Plantation Tumbes Sud', country_id: 3, country_name: 'Equateur' },
]

export const WAREHOUSES = [
  { id: 1, name: 'Entrepôt Bogotá Central', country_id: 1, farm_id: 1 },
  { id: 2, name: 'Entrepôt Medellín', country_id: 1, farm_id: 2 },
  { id: 3, name: 'Entrepôt Corumba', country_id: 2, farm_id: 3 },
  { id: 4, name: 'Entrepôt Tumbes', country_id: 3, farm_id: 4 },
]

export const ZONES: Record<number, { id: number; name: string; warehouse_id: number; target_temperature: number; target_humidity: number; tolerance: number }[]> = {
  1: [
    { id: 1, name: 'Zone A - Séchage', warehouse_id: 1, target_temperature: 22, target_humidity: 55, tolerance: 5 },
    { id: 2, name: 'Zone B - Stockage froid', warehouse_id: 1, target_temperature: 15, target_humidity: 60, tolerance: 3 },
    { id: 3, name: 'Zone C - Transit', warehouse_id: 1, target_temperature: 20, target_humidity: 65, tolerance: 8 },
  ],
  2: [
    { id: 4, name: 'Zone M1 - Principal', warehouse_id: 2, target_temperature: 18, target_humidity: 58, tolerance: 4 },
    { id: 5, name: 'Zone M2 - Réserve', warehouse_id: 2, target_temperature: 16, target_humidity: 60, tolerance: 4 },
  ],
  3: [
    { id: 6, name: 'Zone BR-A', warehouse_id: 3, target_temperature: 24, target_humidity: 50, tolerance: 6 },
    { id: 7, name: 'Zone BR-B', warehouse_id: 3, target_temperature: 22, target_humidity: 55, tolerance: 5 },
  ],
  4: [
    { id: 8, name: 'Zone EQ-Principal', warehouse_id: 4, target_temperature: 26, target_humidity: 60, tolerance: 7 },
  ],
}

// ── Utilisateurs (un par rôle) ─────────────────────────────────────────────────

export const USERS = [
  {
    id: 1,
    email: 'farm@futurekawa.com',
    password: 'test',
    name: 'Carlos Mendez',
    role: 'farm_manager',
    country_id: 1,
    farm_id: 1,
    warehouse_ids: [1],
  },
  {
    id: 2,
    email: 'warehouse@futurekawa.com',
    password: 'test',
    name: 'Sophie Martin',
    role: 'warehouse_manager',
    country_id: 1,
    farm_id: undefined,
    warehouse_ids: [1, 2],
  },
  {
    id: 3,
    email: 'quality@futurekawa.com',
    password: 'test',
    name: 'Aïsha Koné',
    role: 'quality',
    country_id: undefined,
    farm_id: undefined,
    warehouse_ids: undefined,
  },
  {
    id: 4,
    email: 'supply@futurekawa.com',
    password: 'test',
    name: 'Thomas Legrand',
    role: 'supply_chain',
    country_id: undefined,
    farm_id: undefined,
    warehouse_ids: undefined,
  },
  {
    id: 5,
    email: 'hq@futurekawa.com',
    password: 'test',
    name: 'Marie Dupont',
    role: 'hq',
    country_id: undefined,
    farm_id: undefined,
    warehouse_ids: undefined,
  },
]

// ── Lots ──────────────────────────────────────────────────────────────────────

const now = new Date()
function daysAgo(n: number) { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString() }

export const LOTS = [
  {
    id: 1, batch_number: 'CO-2024-0001',
    farm_id: 1, farm_name: 'Finca El Paraíso',
    country_id: 1, country_name: 'Colombie',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    zone_id: 1, zone_name: 'Zone A - Séchage',
    production_date: daysAgo(120), storage_date: daysAgo(115),
    status: 'stored',
    latest_reading: { temperature: 22.4, humidity: 56.2, recorded_at: daysAgo(0), threshold_status: 'ok' },
  },
  {
    id: 2, batch_number: 'CO-2024-0002',
    farm_id: 1, farm_name: 'Finca El Paraíso',
    country_id: 1, country_name: 'Colombie',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    zone_id: 2, zone_name: 'Zone B - Stockage froid',
    production_date: daysAgo(320), storage_date: daysAgo(310),
    status: 'alert',
    latest_reading: { temperature: 19.1, humidity: 74.5, recorded_at: daysAgo(0), threshold_status: 'alert' },
  },
  {
    id: 3, batch_number: 'CO-2024-0003',
    farm_id: 2, farm_name: 'Finca La Esperanza',
    country_id: 1, country_name: 'Colombie',
    warehouse_id: 2, warehouse_name: 'Entrepôt Medellín',
    zone_id: 4, zone_name: 'Zone M1 - Principal',
    production_date: daysAgo(60), storage_date: daysAgo(55),
    status: 'compliant',
    latest_reading: { temperature: 18.2, humidity: 57.8, recorded_at: daysAgo(0), threshold_status: 'ok' },
  },
  {
    id: 4, batch_number: 'BR-2024-0001',
    farm_id: 3, farm_name: 'Vitoria Estate',
    country_id: 2, country_name: 'Brésil',
    warehouse_id: 3, warehouse_name: 'Entrepôt Corumba',
    zone_id: 6, zone_name: 'Zone BR-A',
    production_date: daysAgo(400), storage_date: daysAgo(390),
    status: 'blocked',
    latest_reading: { temperature: 28.9, humidity: 80.1, recorded_at: daysAgo(0), threshold_status: 'alert' },
  },
  {
    id: 5, batch_number: 'EQ-2024-0001',
    farm_id: 4, farm_name: 'Plantation Tumbes Sud',
    country_id: 3, country_name: 'Equateur',
    warehouse_id: 4, warehouse_name: 'Entrepôt Tumbes',
    zone_id: 8, zone_name: 'Zone EQ-Principal',
    production_date: daysAgo(30), storage_date: daysAgo(25),
    status: 'pending',
    latest_reading: { temperature: 25.3, humidity: 61.0, recorded_at: daysAgo(0), threshold_status: 'warn' },
  },
  {
    id: 6, batch_number: 'CO-2024-0004',
    farm_id: 1, farm_name: 'Finca El Paraíso',
    country_id: 1, country_name: 'Colombie',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    zone_id: 3, zone_name: 'Zone C - Transit',
    production_date: daysAgo(200), storage_date: daysAgo(190),
    status: 'shipped',
    latest_reading: null,
  },
  {
    id: 7, batch_number: 'BR-2024-0002',
    farm_id: 3, farm_name: 'Vitoria Estate',
    country_id: 2, country_name: 'Brésil',
    warehouse_id: 3, warehouse_name: 'Entrepôt Corumba',
    zone_id: 7, zone_name: 'Zone BR-B',
    production_date: daysAgo(45), storage_date: daysAgo(40),
    status: 'stored',
    latest_reading: { temperature: 22.1, humidity: 54.3, recorded_at: daysAgo(0), threshold_status: 'ok' },
  },
]

// ── Readings ──────────────────────────────────────────────────────────────────

function generateReadings(lotId: number, baseTemp: number, baseHumid: number, count = 24) {
  return Array.from({ length: count }, (_, i) => ({
    id: lotId * 1000 + i,
    lot_id: lotId,
    temperature: +(baseTemp + (Math.random() - 0.5) * 4).toFixed(1),
    humidity: +(baseHumid + (Math.random() - 0.5) * 8).toFixed(1),
    recorded_at: daysAgo(count - i),
    threshold_status: Math.random() > 0.85 ? 'warn' : 'ok',
  }))
}

export const READINGS: Record<number, ReturnType<typeof generateReadings>> = {
  1: generateReadings(1, 22, 56),
  2: generateReadings(2, 19, 74),
  3: generateReadings(3, 18, 58),
  4: generateReadings(4, 29, 80),
  5: generateReadings(5, 25, 61),
  7: generateReadings(7, 22, 54),
}

// ── Alertes ──────────────────────────────────────────────────────────────────

export const ALERTS = [
  {
    id: 1, type: 'threshold',
    lot_id: 2, lot_batch_number: 'CO-2024-0002',
    zone_id: 2, zone_name: 'Zone B - Stockage froid',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    country_id: 1, country_name: 'Colombie',
    message: 'Humidité hors plage : 74.5% (max 63%). Zone B - Stockage froid.',
    is_read: false, is_active: true,
    created_at: daysAgo(1),
  },
  {
    id: 2, type: 'expiry',
    lot_id: 4, lot_batch_number: 'BR-2024-0001',
    zone_id: 6, zone_name: 'Zone BR-A',
    warehouse_id: 3, warehouse_name: 'Entrepôt Corumba',
    country_id: 2, country_name: 'Brésil',
    message: 'Lot BR-2024-0001 stocké depuis 390 jours - dépasse la limite de 365 jours.',
    is_read: false, is_active: true,
    created_at: daysAgo(25),
  },
  {
    id: 3, type: 'fifo',
    lot_id: 2, lot_batch_number: 'CO-2024-0002',
    zone_id: 2, zone_name: 'Zone B - Stockage froid',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    country_id: 1, country_name: 'Colombie',
    message: 'Rotation FIFO à risque : lot CO-2024-0002 stocké depuis 310 jours, lots plus récents déjà expédiés.',
    is_read: true, is_active: true,
    created_at: daysAgo(5),
  },
  {
    id: 4, type: 'threshold',
    lot_id: 4, lot_batch_number: 'BR-2024-0001',
    zone_id: 6, zone_name: 'Zone BR-A',
    warehouse_id: 3, warehouse_name: 'Entrepôt Corumba',
    country_id: 2, country_name: 'Brésil',
    message: 'Température critique : 28.9°C (max 30°C). Surveillance renforcée requise.',
    is_read: false, is_active: true,
    created_at: daysAgo(2),
  },
  {
    id: 5, type: 'threshold',
    lot_id: 5, lot_batch_number: 'EQ-2024-0001',
    zone_id: 8, zone_name: 'Zone EQ-Principal',
    warehouse_id: 4, warehouse_name: 'Entrepôt Tumbes',
    country_id: 3, country_name: 'Equateur',
    message: 'Humidité en limite haute : 61.0% (seuil warn 60%). Surveiller.',
    is_read: true, is_active: false,
    created_at: daysAgo(3),
  },
]

// ── Mouvements ────────────────────────────────────────────────────────────────

export const MOVEMENTS = [
  {
    id: 1, lot_id: 6, lot_batch_number: 'CO-2024-0004',
    type: 'stock_in', from_zone_id: null, from_zone_name: null,
    to_zone_id: 3, to_zone_name: 'Zone C - Transit',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    reason: null, performed_by: 'Sophie Martin', performed_at: daysAgo(195),
  },
  {
    id: 2, lot_id: 6, lot_batch_number: 'CO-2024-0004',
    type: 'stock_out', from_zone_id: 3, from_zone_name: 'Zone C - Transit',
    to_zone_id: null, to_zone_name: null,
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    reason: 'Expédition client Paris', performed_by: 'Sophie Martin', performed_at: daysAgo(10),
  },
  {
    id: 3, lot_id: 1, lot_batch_number: 'CO-2024-0001',
    type: 'stock_in', from_zone_id: null, from_zone_name: null,
    to_zone_id: 1, to_zone_name: 'Zone A - Séchage',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    reason: null, performed_by: 'Sophie Martin', performed_at: daysAgo(115),
  },
  {
    id: 4, lot_id: 2, lot_batch_number: 'CO-2024-0002',
    type: 'zone_transfer', from_zone_id: 1, from_zone_name: 'Zone A - Séchage',
    to_zone_id: 2, to_zone_name: 'Zone B - Stockage froid',
    warehouse_id: 1, warehouse_name: 'Entrepôt Bogotá Central',
    reason: 'Rotation séchage terminée', performed_by: 'Sophie Martin', performed_at: daysAgo(100),
  },
]

// ── Reporting ─────────────────────────────────────────────────────────────────

export const REPORTING_GLOBAL = {
  kpis: {
    total_lots: LOTS.length,
    compliance_rate: 0.71,
    active_alerts: ALERTS.filter((a) => a.is_active && !a.is_read).length,
    avg_age_days: 134,
    movements_last_30d: 8,
  },
  by_country: [
    { country_id: 1, country_name: 'Colombie', total_lots: 4, compliance_rate: 0.75, active_alerts: 2 },
    { country_id: 2, country_name: 'Brésil', total_lots: 2, compliance_rate: 0.50, active_alerts: 2 },
    { country_id: 3, country_name: 'Equateur', total_lots: 1, compliance_rate: 1.00, active_alerts: 0 },
  ],
}

export const REPORTING_STOCK = {
  total_lots: LOTS.length,
  by_status: { pending: 1, stored: 2, compliant: 1, alert: 1, blocked: 1, shipped: 1 },
  by_country: REPORTING_GLOBAL.by_country,
  fifo_at_risk: 2,
}

export const REPORTING_QUALITY = {
  compliance_rate: 0.71,
  total_alerts: ALERTS.filter((a) => a.is_active).length,
  incidents: 2,
  by_zone: [
    { zone_id: 2, zone_name: 'Zone B - Stockage froid', warehouse_name: 'Entrepôt Bogotá Central', drift_count: 8, compliance_rate: 0.60 },
    { zone_id: 6, zone_name: 'Zone BR-A', warehouse_name: 'Entrepôt Corumba', drift_count: 12, compliance_rate: 0.45 },
    { zone_id: 1, zone_name: 'Zone A - Séchage', warehouse_name: 'Entrepôt Bogotá Central', drift_count: 2, compliance_rate: 0.92 },
    { zone_id: 4, zone_name: 'Zone M1 - Principal', warehouse_name: 'Entrepôt Medellín', drift_count: 1, compliance_rate: 0.97 },
    { zone_id: 8, zone_name: 'Zone EQ-Principal', warehouse_name: 'Entrepôt Tumbes', drift_count: 3, compliance_rate: 0.88 },
  ],
}

// ── Zone readings summary ─────────────────────────────────────────────────────

export const WAREHOUSE_SUMMARIES: Record<number, object> = {
  1: {
    warehouse_id: 1,
    zones: [
      { zone_id: 1, zone_name: 'Zone A - Séchage', temperature: 22.4, humidity: 56.2, recorded_at: daysAgo(0), threshold_status: 'ok' },
      { zone_id: 2, zone_name: 'Zone B - Stockage froid', temperature: 19.1, humidity: 74.5, recorded_at: daysAgo(0), threshold_status: 'alert' },
      { zone_id: 3, zone_name: 'Zone C - Transit', temperature: 20.3, humidity: 63.1, recorded_at: daysAgo(0), threshold_status: 'ok' },
    ],
  },
  2: {
    warehouse_id: 2,
    zones: [
      { zone_id: 4, zone_name: 'Zone M1 - Principal', temperature: 18.2, humidity: 57.8, recorded_at: daysAgo(0), threshold_status: 'ok' },
      { zone_id: 5, zone_name: 'Zone M2 - Réserve', temperature: 16.8, humidity: 59.4, recorded_at: daysAgo(0), threshold_status: 'ok' },
    ],
  },
  3: {
    warehouse_id: 3,
    zones: [
      { zone_id: 6, zone_name: 'Zone BR-A', temperature: 28.9, humidity: 80.1, recorded_at: daysAgo(0), threshold_status: 'alert' },
      { zone_id: 7, zone_name: 'Zone BR-B', temperature: 22.1, humidity: 54.3, recorded_at: daysAgo(0), threshold_status: 'ok' },
    ],
  },
  4: {
    warehouse_id: 4,
    zones: [
      { zone_id: 8, zone_name: 'Zone EQ-Principal', temperature: 25.3, humidity: 61.0, recorded_at: daysAgo(0), threshold_status: 'warn' },
    ],
  },
}
