<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFiltersStore } from '@/stores/filters.store'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import type { Lot, LotStatus } from '@/types/lot.types'
import LotTable from '@/components/common/LotTable.vue'
import CascadeFilter from '@/components/common/CascadeFilter.vue'
import Pagination from '@/components/common/Pagination.vue'
import { storeToRefs } from 'pinia'

const filtersStore = useFiltersStore()
const authStore = useAuthStore()
const { countryId, farmId, warehouseId, zoneId } = storeToRefs(filtersStore)
const { autoFilters } = storeToRefs(authStore)

const lots = ref<Lot[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)
const statusFilter = ref<LotStatus | ''>('')

async function fetchLots() {
  loading.value = true
  try {
    const res = await lotsService.getLots({
      country_id: countryId.value ?? autoFilters.value.country_id,
      farm_id: farmId.value ?? autoFilters.value.farm_id,
      warehouse_id: warehouseId.value,
      zone_id: zoneId.value,
      status: statusFilter.value || undefined,
      sort: 'storage_date_asc',
      page: page.value,
      limit,
      withReadings: true,
    })
    lots.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchLots)
watch([countryId, farmId, warehouseId, zoneId, statusFilter], () => { page.value = 1; fetchLots() })
watch(page, fetchLots)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>Lots de café</h2>
      <RouterLink v-if="authStore.role === 'farm_manager'" to="/farm/create-lot" class="btn-primary">
        + Créer un lot
      </RouterLink>
    </div>

    <div class="filters-bar">
      <CascadeFilter />
      <select v-model="statusFilter" class="status-filter">
        <option value="">- Tous les statuts -</option>
        <option value="pending">En attente</option>
        <option value="stored">Stocké</option>
        <option value="compliant">Conforme</option>
        <option value="alert">Alerte</option>
        <option value="blocked">Bloqué</option>
        <option value="shipped">Expédié</option>
      </select>
    </div>

    <LotTable
      :lots="lots"
      :loading="loading"
      :show-zone="authStore.role !== 'farm_manager'"
      :show-readings="authStore.role !== 'farm_manager'"
    />
    <Pagination :page="page" :total="total" :limit="limit" @change="page = $event" />
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 1300px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
h2 { margin: 0; font-size: 1.4rem; }
.filters-bar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }
.status-filter { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
.btn-primary {
  padding: 8px 16px;
  background: #15803d;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
