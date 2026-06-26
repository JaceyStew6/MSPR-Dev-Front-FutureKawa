<script setup lang="ts">
const props = defineProps<{ page: number; total: number; limit: number }>()
const emit = defineEmits<{ (e: 'change', page: number): void }>()

const totalPages = () => Math.ceil(props.total / props.limit)
</script>

<template>
  <div v-if="total > limit" class="pagination">
    <button :disabled="page <= 1" @click="emit('change', page - 1)">‹ Previous</button>
    <span>Page {{ page }} / {{ totalPages() }}</span>
    <button :disabled="page >= totalPages()" @click="emit('change', page + 1)">Next ›</button>
  </div>
</template>

<style scoped>
.pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1rem; }
button {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
button:disabled { opacity: 0.4; cursor: default; }
span { font-size: 0.875rem; color: #6b7280; }
</style>
