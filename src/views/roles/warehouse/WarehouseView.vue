<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import { movementsService } from '@/services/movements.service'
import { geoService } from '@/services/geo.service'
import type { Lot, LotStatus } from '@/types/lot.types'
import type { Zone } from '@/types/geo.types'
import LotTable from '@/components/common/LotTable.vue'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { autoFilters } = storeToRefs(authStore)

const lots = ref<Lot[]>([])
const zones = ref<Zone[]>([])
const loading = ref(false)
const msg = ref('')

// Stock-in
const stockInLotId = ref('')
const stockInZoneId = ref<string | undefined>()

// Stock-out
const stockOutLotId = ref<string | null>(null)
const stockOutReason = ref('')

// Zone transfer
const transferLotId = ref<string | null>(null)
const transferZoneId = ref<string | undefined>()

// Status update
const statusLotId = ref<string | null>(null)
const newStatus = ref<LotStatus>('stored')

async function fetchLots() {
  loading.value = true
  try {
    const warehouseId = autoFilters.value.warehouse_ids?.[0]
    const res = await lotsService.getLots({ warehouse_id: warehouseId, sort: 'storage_date_asc', limit: 100 })
    lots.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadZones() {
  const ids = autoFilters.value.warehouse_ids ?? []
  const country = autoFilters.value.country_id
  const allZones = await Promise.all(ids.map((id) => geoService.getZones(id, country)))
  zones.value = allZones.flat()
}

async function doStockIn() {
  if (!stockInLotId.value || !stockInZoneId.value || !autoFilters.value.warehouse_ids?.[0]) return
  await lotsService.stockIn(stockInLotId.value, stockInZoneId.value, autoFilters.value.warehouse_ids[0])
  msg.value = 'Entrée enregistrée.'
  stockInLotId.value = ''; stockInZoneId.value = undefined
  fetchLots()
}

async function doStockOut() {
  if (!stockOutLotId.value) return
  await movementsService.stockOut({ lot_id: stockOutLotId.value, reason: stockOutReason.value })
  msg.value = 'Sortie enregistrée.'
  stockOutLotId.value = null; stockOutReason.value = ''
  fetchLots()
}

async function doTransfer() {
  if (!transferLotId.value || !transferZoneId.value) return
  await lotsService.updateZone(transferLotId.value, transferZoneId.value)
  msg.value = 'Lot déplacé.'
  transferLotId.value = null; transferZoneId.value = undefined
  fetchLots()
}

async function doStatusUpdate() {
  if (!statusLotId.value) return
  await lotsService.updateStatus(statusLotId.value, newStatus.value)
  msg.value = 'Statut mis à jour.'
  statusLotId.value = null
  fetchLots()
}

onMounted(() => { fetchLots(); loadZones() })
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>Gestion entrepôt</h2>
      <RouterLink to="/warehouse/movements" class="btn-link">Historique mouvements →</RouterLink>
    </div>

    <p v-if="msg" class="success">{{ msg }}</p>

    <div class="actions-grid">
      <!-- Stock-in -->
      <div class="action-card">
        <h3>📥 Entrée en stock</h3>
        <input v-model="stockInLotId" placeholder="ID ou N° lot" />
        <select v-model="stockInZoneId">
          <option :value="undefined">- Zone -</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
        <button @click="doStockIn" :disabled="!stockInLotId || !stockInZoneId">Enregistrer l'entrée</button>
      </div>

      <!-- Stock-out -->
      <div class="action-card">
        <h3>📤 Sortie de stock</h3>
        <select v-model="stockOutLotId">
          <option :value="null">- Sélectionner lot -</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <input v-model="stockOutReason" placeholder="Motif" />
        <button class="btn-danger" @click="doStockOut" :disabled="!stockOutLotId">Sortir le lot</button>
      </div>

      <!-- Zone transfer -->
      <div class="action-card">
        <h3>🔄 Déplacer un lot</h3>
        <select v-model="transferLotId">
          <option :value="null">- Sélectionner lot -</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <select v-model="transferZoneId">
          <option :value="undefined">- Nouvelle zone -</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
        <button @click="doTransfer" :disabled="!transferLotId || !transferZoneId">Déplacer</button>
      </div>

      <!-- Status update -->
      <div class="action-card">
        <h3>✏️ Mettre à jour statut</h3>
        <select v-model="statusLotId">
          <option :value="null">- Sélectionner lot -</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <select v-model="newStatus">
          <option value="stored">Stocké</option>
          <option value="compliant">Conforme</option>
          <option value="alert">Alerte</option>
          <option value="blocked">Bloqué</option>
          <option value="shipped">Expédié</option>
        </select>
        <button @click="doStatusUpdate" :disabled="!statusLotId">Mettre à jour</button>
      </div>
    </div>

    <!-- Liste lots triée FIFO -->
    <div class="section">
      <h3>Lots en stock <span class="fifo-hint">(tri FIFO - plus anciens en premier)</span></h3>
      <LotTable :lots="lots" :loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
h2 { margin: 0; }
.btn-link { color: #15803d; text-decoration: none; font-size: 0.875rem; }
.success { color: #15803d; font-size: 0.875rem; background: #f0fdf4; padding: 8px 12px; border-radius: 6px; }
.actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.action-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
h3 { margin: 0 0 0.25rem; font-size: 0.9rem; font-weight: 600; }
select, input { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; width: 100%; box-sizing: border-box; }
button { padding: 8px; background: #1a2e1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
button:disabled { opacity: 0.5; }
.btn-danger { background: #dc2626; }
.section { margin-top: 1rem; }
.fifo-hint { font-weight: 400; font-size: 0.78rem; color: #6b7280; }
</style>
