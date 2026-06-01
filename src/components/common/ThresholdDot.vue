<script setup lang="ts">
import type { ThresholdStatus } from '@/types/reading.types'

defineProps<{ status: ThresholdStatus; label?: string }>()

const COLOR: Record<ThresholdStatus, string> = {
  ok:    '#16a34a',
  warn:  '#d97706',
  alert: '#dc2626',
}
</script>

<template>
  <span class="dot-wrapper">
    <span class="dot" :style="{ background: COLOR[status] }" />
    <span v-if="label" class="dot-label">{{ label }}</span>
  </span>
</template>

<style scoped>
.dot-wrapper { display: inline-flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-label { font-size: 0.85rem; }
</style>
