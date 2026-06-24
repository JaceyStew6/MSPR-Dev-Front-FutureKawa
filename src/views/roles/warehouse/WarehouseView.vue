<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import { movementsService } from '@/services/movements.service'
import { geoService } from '@/services/geo.service'
import { saveStatusOverride } from '@/services/status-overrides'
import type { Lot } from '@/types/lot.types'
import type { Zone } from '@/types/geo.types'
import LotTable from '@/components/common/LotTable.vue'
import { storeToRefs } from 'pinia'

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', stored: 'Stocké', compliant: 'Conforme',
  alert: 'Alerte', blocked: 'Bloqué', shipped: 'Expédié',
}
function statusLabel(s: string) { return STATUS_LABELS[s.toLowerCase()] ?? s }

const authStore = useAuthStore()
const { autoFilters } = storeToRefs(authStore)

const lots = ref<Lot[]>([])
const zones = ref<Zone[]>([])
const loading = ref(false)
const msg = ref('')
const msgError = ref(false)

function setMsg(text: string, error = false) {
  msg.value = text
  msgError.value = error
}

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
const newStatus = ref('')
const availableStatuses = ['compliant', 'alert', 'blocked', 'shipped']

async function fetchLots() {
  loading.value = true
  try {
    const warehouseId = autoFilters.value.warehouse_ids?.[0]
    const res = await lotsService.getLots({
      warehouse_id: warehouseId,
      country_id: autoFilters.value.country_id,
      sort: 'storage_date_asc',
      limit: 100,
      withReadings: true,
    })
    lots.value = res.data.filter((l) => l.status?.toLowerCase() !== 'shipped')
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
  const pays = autoFilters.value.country_id
  if (!stockInLotId.value || !stockInZoneId.value || !autoFilters.value.warehouse_ids?.[0] || !pays) return
  try {
    await lotsService.stockIn(stockInLotId.value, stockInZoneId.value, autoFilters.value.warehouse_ids[0], pays)
    setMsg('Entrée enregistrée.')
    stockInLotId.value = ''; stockInZoneId.value = undefined
    fetchLots()
  } catch (e) {
    setMsg(`Erreur entrée stock : ${e instanceof Error ? e.message : 'Échec'}`, true)
  }
}

async function doStockOut() {
  const pays = autoFilters.value.country_id
  if (!stockOutLotId.value || !pays) return
  try {
    await movementsService.stockOut({ lot_id: stockOutLotId.value, pays, type: 'shipment' })
    setMsg('Sortie enregistrée.')
    stockOutLotId.value = null; stockOutReason.value = ''
    fetchLots()
  } catch (e) {
    setMsg(`Erreur sortie stock : ${e instanceof Error ? e.message : 'Échec'}`, true)
  }
}

async function doTransfer() {
  const pays = autoFilters.value.country_id
  if (!transferLotId.value || !transferZoneId.value || !pays) {
    setMsg('Erreur : pays non défini dans vos filtres.', true)
    return
  }
  try {
    await lotsService.updateZone(transferLotId.value, transferZoneId.value, pays)
    setMsg('Lot déplacé.')
    transferLotId.value = null; transferZoneId.value = undefined
    fetchLots()
  } catch (e) {
    setMsg(`Erreur déplacement : ${e instanceof Error ? e.message : 'Échec'}`, true)
  }
}

async function doStatusUpdate() {
  const pays = autoFilters.value.country_id
  if (!statusLotId.value || !newStatus.value || !pays) {
    setMsg(!pays ? 'Erreur : pays non défini dans vos filtres.' : 'Veuillez sélectionner un lot et un statut.', true)
    return
  }
  const id = statusLotId.value
  const status = newStatus.value
  try {
    await lotsService.updateStatus(id, status, pays)
    saveStatusOverride(id, status)
    const lot = lots.value.find((l) => l.id === id)
    if (lot) lot.status = status
    setMsg('Statut mis à jour.')
    statusLotId.value = null
  } catch (e) {
    setMsg(`Erreur mise à jour statut : ${e instanceof Error ? e.message : 'Échec'}`, true)
  }
}

onMounted(() => { fetchLots(); loadZones() })
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>Gestion entrepôt</h2>
      <RouterLink to="/warehouse/movements" class="btn-link">Historique mouvements →</RouterLink>
    </div>

    <p v-if="msg" :class="msgError ? 'error' : 'success'">{{ msg }}</p>

    <div class="actions-grid">
      <!-- Stock-in -->
      <!-- <div class="action-card">
        <h3>Entrée en stock</h3>
        <input v-model="stockInLotId" placeholder="ID ou N° lot" />
        <select v-model="stockInZoneId">
          <option :value="undefined">- Zone -</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
        <button @click="doStockIn" :disabled="!stockInLotId || !stockInZoneId">Enregistrer l'entrée</button>
      </div> -->

      <!-- Stock-out -->
      <!-- Endpoint problem for now - error 500 -->
      <div class="action-card">
        <h3>Sortie de stock</h3>
        <select v-model="stockOutLotId">
          <option :value="null">- Sélectionner lot -</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <input v-model="stockOutReason" placeholder="Motif" />
        <button class="btn-danger" @click="doStockOut" :disabled="!stockOutLotId">Sortir le lot</button>
      </div>

      <!-- Zone transfer -->
      <div class="action-card">
        <h3>Déplacer un lot</h3>
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
        <h3>Mettre à jour statut</h3>
        <select v-model="statusLotId">
          <option :value="null">- Sélectionner lot -</option>
          <option v-for="l in lots" :key="l.id" :value="l.id">{{ l.batch_number }}</option>
        </select>
        <select v-model="newStatus">
          <option value="">- Statut -</option>
          <option v-for="s in availableStatuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>
        <button @click="doStatusUpdate" :disabled="!statusLotId || !newStatus">Mettre à jour</button>
      </div>
    </div>

    <!-- Liste lots triée FIFO -->
    <div class="section">
      <h3>Lots en stock <span class="fifo-hint">(tri FIFO - plus anciens en premier)</span></h3>
      <LotTable :lots="lots" :loading="loading" :show-zone="true" :show-readings="true" />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  margin: 0;
}

.btn-link {
  color: #15803d;
  text-decoration: none;
  font-size: 0.875rem;
}

.success {
  color: #15803d;
  font-size: 0.875rem;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 6px;
}

.error {
  color: #b91c1c;
  font-size: 0.875rem;
  background: #fee2e2;
  padding: 8px 12px;
  border-radius: 6px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

h3 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
}

select,
input {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

button {
  padding: 8px;
  background: #1a2e1a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

button:disabled {
  opacity: 0.5;
}

.btn-danger {
  background: #dc2626;
}

.section {
  margin-top: 1rem;
}

.fifo-hint {
  font-weight: 400;
  font-size: 0.78rem;
  color: #6b7280;
}
</style>
