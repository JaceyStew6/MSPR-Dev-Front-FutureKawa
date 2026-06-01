<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { lotsService } from '@/services/lots.service'
import { readingsService } from '@/services/readings.service'
import type { Lot, LotStatus } from '@/types/lot.types'
import LotTable from '@/components/common/LotTable.vue'

const lots = ref<Lot[]>([])
const loading = ref(false)
const msg = ref('')

// Mise à jour statut
const statusLotId = ref<number | null>(null)
const newStatus = ref<LotStatus>('compliant')

// Export tracabilité
const exportLotId = ref<number | null>(null)
const exporting = ref(false)

async function fetchLots() {
  loading.value = true
  try {
    const res = await lotsService.getLots({ sort: 'storage_date_asc', limit: 100 })
    lots.value = res.data
  } finally {
    loading.value = false
  }
}

async function doStatusUpdate() {
  if (!statusLotId.value) return
  await lotsService.updateStatus(statusLotId.value, newStatus.value)
  msg.value = `Statut du lot mis à jour : ${newStatus.value}`
  statusLotId.value = null
  fetchLots()
}

async function exportTraceability() {
  if (!exportLotId.value) return
  exporting.value = true
  try {
    // Récupérer toutes les mesures du lot + infos lot
    const [lot, readings] = await Promise.all([
      lotsService.getLot(exportLotId.value),
      readingsService.getReadings({ lot_id: exportLotId.value, granularity: 'raw' }),
    ])

    // Construire CSV
    const header = 'Date,Température (°C),Humidité (%),Statut seuil'
    const rows = readings.map((r) =>
      `${new Date(r.recorded_at).toLocaleString('fr-FR')},${r.temperature},${r.humidity},${r.threshold_status}`
    )
    const csv = [
      `Rapport de traçabilité — Lot ${lot.batch_number}`,
      `Exploitation: ${lot.farm_name} | Pays: ${lot.country_name} | Statut: ${lot.status}`,
      '',
      header,
      ...rows,
    ].join('\n')

    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracabilite_${lot.batch_number}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

onMounted(fetchLots)
</script>

<template>
  <div class="page">
    <h2>Équipe Qualité</h2>
    <p v-if="msg" class="success">{{ msg }}</p>

    <div class="actions-grid">
      <!-- Mise à jour statut -->
      <div class="action-card">
        <h3>✏️ Mettre à jour le statut d'un lot</h3>
        <select v-model="statusLotId">
          <option :value="null">— Sélectionner un lot —</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }} ({{ l.status }})</option>
        </select>
        <select v-model="newStatus">
          <option value="compliant">Conforme</option>
          <option value="alert">Alerte</option>
          <option value="blocked">Bloqué</option>
        </select>
        <button @click="doStatusUpdate" :disabled="!statusLotId">Valider</button>
      </div>

      <!-- Export tracabilité -->
      <div class="action-card">
        <h3>📄 Exporter rapport de traçabilité</h3>
        <select v-model="exportLotId">
          <option :value="null">— Sélectionner un lot —</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <button @click="exportTraceability" :disabled="!exportLotId || exporting">
          {{ exporting ? 'Génération…' : '⬇ Télécharger CSV' }}
        </button>
        <small class="hint">Inclut toutes les mesures IoT + statuts du lot</small>
      </div>
    </div>

    <!-- Lots avec alertes / non-conformités -->
    <div class="section">
      <h3>Lots non conformes / en alerte</h3>
      <LotTable :lots="lots.filter(l => ['alert', 'blocked'].includes(l.status))" :loading="loading" />
    </div>

    <div class="section">
      <h3>Tous les lots</h3>
      <LotTable :lots="lots" :loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
h2 { margin: 0 0 1rem; }
.success { color: #15803d; font-size: 0.875rem; background: #f0fdf4; padding: 8px 12px; border-radius: 6px; margin-bottom: 1rem; }
.actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.action-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
h3 { margin: 0 0 0.25rem; font-size: 0.9rem; font-weight: 600; }
select { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; width: 100%; }
button { padding: 8px; background: #1a2e1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
button:disabled { opacity: 0.5; }
.hint { color: #9ca3af; font-size: 0.78rem; }
.section { margin-bottom: 2rem; }
</style>
