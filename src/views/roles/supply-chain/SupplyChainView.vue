<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { lotsService } from '@/services/lots.service'
import type { Lot } from '@/types/lot.types'
import LotTable from '@/components/common/LotTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const allLots = ref<Lot[]>([])
const blockedLots = ref<Lot[]>([])
const fifoRiskLots = ref<Lot[]>([])
const loading = ref(false)

// KPIs calculés depuis les lots (reporting/stock exige un `pays` obligatoire côté backend)
const totalLots = ref(0)
const byStatus = ref<Record<string, number>>({})

async function fetchAll() {
  loading.value = true
  try {
    const [lotsRes, blocked] = await Promise.all([
      lotsService.getLots({ sort: 'storage_date_asc', limit: 500 }),
      lotsService.getLots({ status: 'blocked', limit: 100 }),
    ])

    allLots.value = lotsRes.data
    blockedLots.value = blocked.data
    totalLots.value = lotsRes.total

    // FIFO à risque : lots stockés depuis plus de 300 jours
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 300)
    fifoRiskLots.value = lotsRes.data.filter(
      (l) => l.storage_date && new Date(l.storage_date) < cutoff && l.status?.toLowerCase() !== 'shipped',
    )

    // Répartition par statut
    const counts: Record<string, number> = {}
    for (const l of lotsRes.data) {
      const s = l.status?.toLowerCase() ?? 'inconnu'
      counts[s] = (counts[s] ?? 0) + 1
    }
    byStatus.value = counts
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <div class="page">
    <h2>Supply Chain - Vue consolidée</h2>

    <!-- KPI rapides -->
    <div class="kpi-bar">
      <div class="kpi">
        <div class="kpi-val">{{ loading ? '…' : totalLots }}</div>
        <div class="kpi-label">Lots totaux</div>
      </div>
      <div class="kpi kpi--warn">
        <div class="kpi-val">{{ loading ? '…' : fifoRiskLots.length }}</div>
        <div class="kpi-label">FIFO à risque (&gt; 300 j)</div>
      </div>
      <div class="kpi kpi--danger">
        <div class="kpi-val">{{ loading ? '…' : blockedLots.length }}</div>
        <div class="kpi-label">Lots bloqués</div>
      </div>
    </div>

    <!-- Répartition par statut -->
    <div v-if="Object.keys(byStatus).length" class="section">
      <h3>Répartition par statut</h3>
      <div class="status-bar">
        <div v-for="(count, status) in byStatus" :key="status" class="status-seg">
          <StatusBadge :status="String(status)" />
          <span class="seg-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- FIFO à risque -->
    <div class="section">
      <h3>Priorités FIFO - Lots stockés &gt; 300 jours</h3>
      <LotTable :lots="fifoRiskLots" :loading="loading" />
    </div>

    <!-- Lots bloquant les expéditions -->
    <div class="section">
      <h3>Lots bloquant les expéditions</h3>
      <LotTable :lots="blockedLots" :loading="loading" />
    </div>

    <!-- Vue multi-pays -->
    <div class="section">
      <h3>Tous les lots (tri FIFO)</h3>
      <LotTable :lots="allLots" :loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 1.5rem;
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.kpi-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.kpi {
  flex: 1;
  min-width: 150px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  text-align: center;
}

.kpi-val {
  font-size: 2rem;
  font-weight: 700;
  color: #1a2e1a;
}

.kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.kpi--warn .kpi-val { color: #d97706; }
.kpi--danger .kpi-val { color: #dc2626; }

.section {
  margin-bottom: 2.5rem;
}

.status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.status-seg {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 2px 10px 2px 4px;
  font-size: 0.8rem;
}

.seg-count {
  font-weight: 600;
  color: #374151;
}
</style>
