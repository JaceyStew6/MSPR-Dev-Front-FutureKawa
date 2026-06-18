<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFiltersStore } from '@/stores/filters.store'
import { useAuthStore } from '@/stores/auth.store'
import { geoService } from '@/services/geo.service'
import type { Country, Farm, Warehouse, Zone } from '@/types/geo.types'
import { storeToRefs } from 'pinia'

const filtersStore = useFiltersStore()
const authStore = useAuthStore()
const { countryId, farmId, warehouseId, zoneId } = storeToRefs(filtersStore)
const { autoFilters } = storeToRefs(authStore)

const countries = ref<Country[]>([])
const farms = ref<Farm[]>([])
const warehouses = ref<Warehouse[]>([])
const zones = ref<Zone[]>([])

onMounted(async () => {
  countries.value = await geoService.getCountries()
  // Pré-remplir depuis autoFilters si rôle limité
  if (autoFilters.value.country_id) {
    filtersStore.setCountry(autoFilters.value.country_id)
  }
})

watch(countryId, async (id) => {
  farms.value = id ? await geoService.getFarms(id) : []
  warehouses.value = id ? await geoService.getWarehouses({ country_id: id }) : []
  zones.value = []
})

watch(warehouseId, async (id) => {
  zones.value = id ? await geoService.getZones(id, countryId.value) : []
})
</script>

<template>
  <div class="cascade-filter">
    <select
      :value="countryId"
      @change="filtersStore.setCountry(($event.target as HTMLSelectElement).value || undefined)"
      :disabled="!!autoFilters.country_id"
    >
      <option value="">- Pays -</option>
      <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>

    <select
      :value="farmId"
      @change="filtersStore.setFarm(($event.target as HTMLSelectElement).value || undefined)"
      :disabled="!countryId"
    >
      <option value="">- Exploitation -</option>
      <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
    </select>

    <select
      :value="warehouseId"
      @change="filtersStore.setWarehouse(($event.target as HTMLSelectElement).value || undefined)"
      :disabled="!countryId"
    >
      <option value="">- Entrepôt -</option>
      <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
    </select>

    <select
      :value="zoneId"
      @change="filtersStore.setZone(($event.target as HTMLSelectElement).value || undefined)"
      :disabled="!warehouseId"
    >
      <option value="">- Zone -</option>
      <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
    </select>

    <button class="btn-reset" @click="filtersStore.reset()">Réinitialiser</button>
  </div>
</template>

<style scoped>
.cascade-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  min-width: 150px;
}
select:disabled { background: #f3f4f6; color: #9ca3af; }
.btn-reset {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-reset:hover { background: #f9fafb; }
</style>
