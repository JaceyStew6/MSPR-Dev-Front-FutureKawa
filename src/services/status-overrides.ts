const KEY = 'futurekawa_status_overrides'

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveStatusOverride(lotId: string, status: string): void {
  const overrides = load()
  overrides[lotId] = status
  localStorage.setItem(KEY, JSON.stringify(overrides))
}

export function applyStatusOverrides<T extends { id: string; status: string }>(lots: T[]): T[] {
  const overrides = load()
  return lots.map((l) => (overrides[l.id] ? { ...l, status: overrides[l.id] } : l))
}

export function applyStatusOverride<T extends { id: string; status: string }>(lot: T): T {
  const overrides = load()
  return overrides[lot.id] ? { ...lot, status: overrides[lot.id] } : lot
}
