<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { lotsService } from '@/services/lots.service'
import { geoService } from '@/services/geo.service'
import type { Farm } from '@/types/geo.types'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { autoFilters } = storeToRefs(authStore)

const farms = ref<Farm[]>([])
const selectedFarmId = ref('')
const status = ref('pending')
const quantite = ref(0)
const caracteristique = ref(0)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  if (autoFilters.value.country_id) {
    farms.value = await geoService.getFarms(autoFilters.value.country_id)
  }
  selectedFarmId.value = autoFilters.value.farm_id ?? ''
})

async function handleSubmit() {
  if (!selectedFarmId.value || !autoFilters.value.country_id) {
    error.value = 'Please select a farm'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await lotsService.createLot({
      farm_id: selectedFarmId.value,
      pays: autoFilters.value.country_id,
      status: status.value,
      quantite: quantite.value,
      caracteristique: caracteristique.value,
    })
    router.push('/farm')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error during creation'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <RouterLink to="/farm" class="back-link">← Back to farm</RouterLink>
    <h2>Create a lot</h2>

    <form class="form" @submit.prevent="handleSubmit">
      <div class="field">
        <label>Farm *</label>
        <select v-model="selectedFarmId" required>
          <option value="">- Select a farm -</option>
          <option v-for="f in farms" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>Status *</label>
        <select v-model="status" required>
          <option value="pending">Pending</option>
          <option value="stored">Stored</option>
          <option value="compliant">Compliant</option>
          <option value="alert">Alert</option>
          <option value="blocked">Blocked</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      <div class="field">
        <label>Quantity *</label>
        <input type="number" v-model.number="quantite" min="0" required />
      </div>

      <div class="field">
        <label>Characteristic</label>
        <input type="number" v-model.number="caracteristique" min="0" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="form-actions">
        <RouterLink to="/farm" class="btn-cancel">Cancel</RouterLink>
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create lot' }}
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
.error { color: #dc2626; font-size: 0.85rem; margin: 0; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.btn-cancel { padding: 9px 18px; border: 1px solid #d1d5db; border-radius: 8px; background: white; text-decoration: none; font-size: 0.875rem; color: #374151; }
.btn-submit { padding: 9px 18px; background: #15803d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 600; }
.btn-submit:disabled { opacity: 0.6; }
</style>
