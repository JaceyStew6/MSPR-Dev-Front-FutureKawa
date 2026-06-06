<script setup lang="ts">
import type { Lot } from '@/types/lot.types'
import StatusBadge from './StatusBadge.vue'
import ThresholdDot from './ThresholdDot.vue'

defineProps<{
  lots: Lot[]
  loading?: boolean
}>()

function formatDate(d: string | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div class="table-wrapper">
    <div v-if="loading" class="loading">Chargement…</div>
    <table v-else class="lot-table">
      <thead>
        <tr>
          <th>N° Lot</th>
          <th>Pays</th>
          <th>Exploitation</th>
          <th>Entrepôt / Zone</th>
          <th>Date production</th>
          <th>Date stockage ↑ (FIFO)</th>
          <th>Statut</th>
          <th>Dernière mesure</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lot in lots" :key="lot.id">
          <td class="batch">{{ lot.batch_number }}</td>
          <td>{{ lot.country_name ?? lot.country_id }}</td>
          <td>{{ lot.farm_name ?? lot.farm_id }}</td>
          <td>{{ lot.warehouse_name ?? '-' }}<span v-if="lot.zone_name"> / {{ lot.zone_name }}</span></td>
          <td>{{ formatDate(lot.production_date) }}</td>
          <td>{{ formatDate(lot.storage_date) }}</td>
          <td><StatusBadge :status="lot.status" /></td>
          <td>
            <template v-if="lot.latest_reading">
              <ThresholdDot :status="lot.latest_reading.threshold_status" />
              {{ lot.latest_reading.temperature.toFixed(1) }}°C
              {{ lot.latest_reading.humidity.toFixed(0) }}%
            </template>
            <span v-else class="no-data">-</span>
          </td>
          <td>
            <RouterLink :to="`/lots/${lot.id}`" class="btn-detail">Détail</RouterLink>
          </td>
        </tr>
        <tr v-if="lots.length === 0">
          <td colspan="9" class="empty">Aucun lot trouvé</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper { overflow-x: auto; }
.loading { padding: 2rem; text-align: center; color: #6b7280; }
.lot-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.lot-table th {
  background: #f9fafb;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}
.lot-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.lot-table tr:hover td { background: #f9fafb; }
.batch { font-family: monospace; font-weight: 600; }
.no-data { color: #9ca3af; }
.empty { text-align: center; color: #9ca3af; padding: 2rem; }
.btn-detail {
  color: #15803d;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8rem;
}
.btn-detail:hover { text-decoration: underline; }
</style>
