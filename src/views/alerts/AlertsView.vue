<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAlertsStore } from '@/stores/alerts.store'
import { alertsService } from '@/services/alerts.service'
import type { Alert, AlertType } from '@/types/alert.types'
import Pagination from '@/components/common/Pagination.vue'
import { storeToRefs } from 'pinia'

const alertsStore = useAlertsStore()
const { alerts: storeAlerts } = storeToRefs(alertsStore)

const alerts = ref<Alert[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)
const typeFilter = ref<AlertType | ''>('')
const activeOnly = ref(true)

async function fetchAlerts() {
  loading.value = true
  try {
    const res = await alertsService.getAlerts({
      active: activeOnly.value || undefined,
      type: typeFilter.value || undefined,
      page: page.value,
      limit,
    })
    alerts.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function markRead(id: number) {
  await alertsStore.markAsRead(id)
  const a = alerts.value.find((x) => x.id === id)
  if (a) a.is_read = true
}

onMounted(fetchAlerts)
watch([typeFilter, activeOnly], () => { page.value = 1; fetchAlerts() })
watch(page, fetchAlerts)

const TYPE_LABEL: Record<AlertType, string> = {
  threshold: 'Hors plage',
  expiry: 'Expiration',
  fifo: 'FIFO',
}
</script>

<template>
  <div class="page">
    <h2>Alertes</h2>

    <div class="filters-bar">
      <label class="checkbox-label">
        <input type="checkbox" v-model="activeOnly" />
        Actives uniquement
      </label>
      <select v-model="typeFilter">
        <option value="">— Tous types —</option>
        <option value="threshold">Hors plage (température/humidité)</option>
        <option value="expiry">Expiration (> 365 jours)</option>
        <option value="fifo">FIFO à risque</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Chargement…</div>

    <ul v-else class="alert-list">
      <li
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-item"
        :class="{ 'alert-item--read': alert.is_read }"
      >
        <div class="alert-meta">
          <span class="alert-type" :class="`alert-type--${alert.type}`">
            {{ TYPE_LABEL[alert.type] }}
          </span>
          <span class="alert-loc">{{ alert.country_name }}<span v-if="alert.warehouse_name"> · {{ alert.warehouse_name }}</span></span>
        </div>
        <p class="alert-message">{{ alert.message }}</p>
        <div class="alert-footer">
          <span class="alert-date">{{ new Date(alert.created_at).toLocaleString('fr-FR') }}</span>
          <span v-if="alert.lot_batch_number">
            <RouterLink :to="`/lots/${alert.lot_id}`" class="lot-link">Lot {{ alert.lot_batch_number }}</RouterLink>
          </span>
          <button v-if="!alert.is_read" class="btn-read" @click="markRead(alert.id)">
            Marquer lu
          </button>
          <span v-else class="read-label">✓ Lu</span>
        </div>
      </li>
      <li v-if="alerts.length === 0" class="empty">Aucune alerte</li>
    </ul>

    <Pagination :page="page" :total="total" :limit="limit" @change="page = $event" />
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 900px; margin: 0 auto; }
h2 { margin: 0 0 1.5rem; }
.filters-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; cursor: pointer; }
select { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
.loading { text-align: center; padding: 2rem; color: #6b7280; }
.alert-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.alert-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.alert-item--read { opacity: 0.6; }
.alert-meta { display: flex; align-items: center; gap: 0.75rem; }
.alert-type {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
}
.alert-type--threshold { background: #fee2e2; color: #991b1b; }
.alert-type--expiry    { background: #fef3c7; color: #92400e; }
.alert-type--fifo      { background: #ede9fe; color: #5b21b6; }
.alert-loc { font-size: 0.8rem; color: #6b7280; }
.alert-message { margin: 0; font-size: 0.9rem; color: #111827; }
.alert-footer { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.alert-date { font-size: 0.78rem; color: #9ca3af; }
.lot-link { font-size: 0.8rem; color: #15803d; text-decoration: none; }
.lot-link:hover { text-decoration: underline; }
.btn-read {
  padding: 3px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.78rem;
}
.btn-read:hover { background: #f0fdf4; }
.read-label { font-size: 0.78rem; color: #15803d; }
.empty { text-align: center; color: #9ca3af; padding: 2rem; }
</style>
