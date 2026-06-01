import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filtres en cascade partagés entre toutes les vues liste
export const useFiltersStore = defineStore('filters', () => {
  const countryId = ref<number | undefined>(undefined)
  const farmId = ref<number | undefined>(undefined)
  const warehouseId = ref<number | undefined>(undefined)
  const zoneId = ref<number | undefined>(undefined)

  function setCountry(id: number | undefined) {
    countryId.value = id
    farmId.value = undefined
    warehouseId.value = undefined
    zoneId.value = undefined
  }

  function setFarm(id: number | undefined) {
    farmId.value = id
    warehouseId.value = undefined
    zoneId.value = undefined
  }

  function setWarehouse(id: number | undefined) {
    warehouseId.value = id
    zoneId.value = undefined
  }

  function setZone(id: number | undefined) {
    zoneId.value = id
  }

  function reset() {
    countryId.value = undefined
    farmId.value = undefined
    warehouseId.value = undefined
    zoneId.value = undefined
  }

  return { countryId, farmId, warehouseId, zoneId, setCountry, setFarm, setWarehouse, setZone, reset }
})
