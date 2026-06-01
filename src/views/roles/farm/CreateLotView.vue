<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import { geoService } from '@/services/geo.service'
import type { Zone } from '@/types/geo.types'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { autoFilters } = storeToRefs(authStore)

const productionDate = ref('')
const zoneId = ref<number | undefined>(undefined)
const zones = ref<Zone[]>([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  // Charger les zones de l'entrepôt de l'exploitation
  if (autoFilters.value.warehouse_ids?.length) {
    const allZones = await Promise.all(autoFilters.value.warehouse_ids.map((wId) => geoService.getZones(wId)))
    zones.value = allZones.flat()
  }
})

async function handleSubmit() {
  if (!productionDate.value || !zoneId.value || !autoFilters.value.farm_id) {
    error.value = 'Veuillez remplir tous les champs'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await lotsService.createLot({
      production_date: productionDate.value,
      farm_id: autoFilters.value.farm_id,
      zone_id: zoneId.value,
    })
    router.push('/farm')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la création'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <RouterLink to="/farm" class="back-link">← Retour à l'exploitation</RouterLink>
    <h2>Créer un lot</h2>

    <form class="form" @submit.prevent="handleSubmit">
      <div class="field">
        <label>Date de production *</label>
        <input type="date" v-model="productionDate" required />
      </div>

      <div class="field">
        <label>Zone de stockage *</label>
        <select v-model="zoneId" required>
          <option :value="undefined">— Sélectionner une zone —</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
        <small v-if="zones.length === 0" class="hint">Aucune zone disponible pour votre exploitation</small>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="form-actions">
        <RouterLink to="/farm" class="btn-cancel">Annuler</RouterLink>
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Création…' : 'Créer le lot' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 520px; margin: 0 auto; }
.back-link { color: #15803d; text-decoration: none; font-size: 0.875rem; }
h2 { margin: 1rem 0 1.5rem; }
.form { display: flex; flex-direction: column; gap: 1.25rem; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; }
.field { display: flex; flex-direction: column; gap: 4px; }
label { font-size: 0.875rem; font-weight: 500; color: #374151; }
input, select { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
.hint { color: #9ca3af; font-size: 0.78rem; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.btn-cancel { padding: 9px 18px; border: 1px solid #d1d5db; border-radius: 8px; background: white; text-decoration: none; font-size: 0.875rem; color: #374151; }
.btn-submit { padding: 9px 18px; background: #15803d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 600; }
.btn-submit:disabled { opacity: 0.6; }
</style>
