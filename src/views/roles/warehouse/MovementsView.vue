<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { movementsService } from '@/services/movements.service'
import type { Movement } from '@/types/movement.types'
import Pagination from '@/components/common/Pagination.vue'

const movements = ref<Movement[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)

async function fetchMovements() {
  loading.value = true
  try {
    const res = await movementsService.getMovements({ page: page.value, limit })
    movements.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchMovements)

const TYPE_LABEL: Record<string, string> = {
  stock_in: 'In',
  stock_out: 'Out',
  zone_transfer: 'Transfer',
}
</script>

<template>
  <div class="page">
    <RouterLink to="/warehouse" class="back-link">← Back to warehouse</RouterLink>
    <h2>Movement history</h2>

    <div v-if="loading" class="loading">Loading…</div>

    <table v-else class="movements-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Lot No.</th>
          <th>From / To</th>
          <th>Reason</th>
          <th>Operator</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in movements" :key="m.id">
          <td>{{ new Date(m.performed_at).toLocaleString('en-US') }}</td>
          <td>
            <span class="type-badge" :class="`type--${m.type}`">{{ TYPE_LABEL[m.type] }}</span>
          </td>
          <td class="mono">{{ m.lot_batch_number ?? m.lot_id }}</td>
          <td>
            <span v-if="m.from_zone_name">{{ m.from_zone_name }} → </span>
            <span v-if="m.to_zone_name">{{ m.to_zone_name }}</span>
            <span v-if="!m.from_zone_name && !m.to_zone_name">-</span>
          </td>
          <td>{{ m.reason ?? '-' }}</td>
          <td>{{ m.performed_by ?? '-' }}</td>
        </tr>
        <tr v-if="movements.length === 0">
          <td colspan="6" class="empty">No movements</td>
        </tr>
      </tbody>
    </table>

    <Pagination :page="page" :total="total" :limit="limit" @change="page = $event; fetchMovements()" />
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
.back-link { color: #15803d; text-decoration: none; font-size: 0.875rem; }
h2 { margin: 1rem 0 1.5rem; }
.loading { text-align: center; padding: 2rem; color: #6b7280; }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
tr:hover td { background: #f9fafb; }
.type-badge { padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.type--stock_in    { background: #dcfce7; color: #15803d; }
.type--stock_out   { background: #fee2e2; color: #b91c1c; }
.type--zone_transfer { background: #dbeafe; color: #1d4ed8; }
.mono { font-family: monospace; }
.empty { text-align: center; color: #9ca3af; padding: 2rem; }
</style>
