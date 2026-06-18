import { defineStore } from 'pinia'
import { ref } from 'vue'

// Filtres en cascade partagés entre toutes les vues liste
export const useFiltersStore = defineStore('filters', () => {
  const countryId = ref<string | undefined>(undefined)
  const farmId = ref<string | undefined>(undefined)
  const warehouseId = ref<string | undefined>(undefined)
  const zoneId = ref<string | undefined>(undefined)

  function setCountry(id: string | undefined) {
    countryId.value = id
    farmId.value = undefined
    warehouseId.value = undefined
    zoneId.value = undefined
  }

  function setFarm(id: string | undefined) {
    farmId.value = id
    warehouseId.value = undefined
    zoneId.value = undefined
  }

  function setWarehouse(id: string | undefined) {
    warehouseId.value = id
    zoneId.value = undefined
  }

  function setZone(id: string | undefined) {
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
