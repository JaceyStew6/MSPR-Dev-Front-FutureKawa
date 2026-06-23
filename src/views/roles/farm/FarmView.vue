<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import { movementsService } from '@/services/movements.service'
import type { Lot } from '@/types/lot.types'
import type { StockOutType } from '@/types/movement.types'
import LotTable from '@/components/common/LotTable.vue'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, autoFilters } = storeToRefs(authStore)

const lots = ref<Lot[]>([])
const loading = ref(false)
const stockOutLotId = ref<string | null>(null)
const stockOutType = ref<StockOutType>('shipment')
const submitting = ref(false)
const successMsg = ref('')

async function fetchLots() {
  loading.value = true
  try {
    const res = await lotsService.getLots({
      farm_id: autoFilters.value.farm_id,
      country_id: autoFilters.value.country_id,
      sort: 'storage_date_asc',
      limit: 50,
    })
    lots.value = res.data
  } finally {
    loading.value = false
  }
}

async function handleStockOut() {
  if (!stockOutLotId.value || !autoFilters.value.country_id) return
  submitting.value = true
  try {
    await movementsService.stockOut({
      lot_id: stockOutLotId.value,
      pays: autoFilters.value.country_id,
      type: stockOutType.value,
    })
    successMsg.value = 'Expédition enregistrée.'
    stockOutLotId.value = null
    stockOutType.value = 'shipment'
    await fetchLots()
  } finally {
    submitting.value = false
  }
}

onMounted(fetchLots)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Mon exploitation</h2>
        <p class="sub">{{ user?.name }}</p>
      </div>
      <RouterLink to="/farm/create-lot" class="btn-primary">+ Nouveau lot</RouterLink>
    </div>

    <!-- Sortie rapide -->
    <div class="quick-action">
      <h3>Enregistrer une expédition</h3>
      <div class="form-row">
        <select v-model="stockOutLotId">
          <option :value="null">- Sélectionner un lot -</option>
          <option v-for="lot in lots.filter(l => l.status !== 'shipped')" :key="lot.id" :value="lot.id">
            {{ lot.batch_number }} ({{ lot.status }})
          </option>
        </select>
        <select v-model="stockOutType">
          <option value="shipment">Expédition client</option>
          <option value="transfer">Transfert</option>
          <option value="loss">Perte / destruction</option>
        </select>
        <button class="btn-danger" :disabled="!stockOutLotId || submitting" @click="handleStockOut">
          {{ submitting ? 'Envoi…' : 'Expédier' }}
        </button>
      </div>
      <p v-if="successMsg" class="success">{{ successMsg }}</p>
    </div>

    <!-- Liste lots -->
    <div class="section">
      <h3>Statut de l'exploitation</h3>
      <LotTable :lots="lots" :loading="loading" :show-zone="false" :show-readings="false" />
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
  align-items: flex-start;
  margin-bottom: 2rem;
}

h2 {
  margin: 0 0 0.25rem;
}

.sub {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-primary {
  padding: 8px 16px;
  background: #15803d;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
}

.quick-action {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.btn-danger {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-danger:disabled {
  opacity: 0.5;
}

.success {
  color: #15803d;
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
}

.section {
  margin-top: 1.5rem;
}
</style>
