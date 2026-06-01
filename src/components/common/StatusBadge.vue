<script setup lang="ts">
import type { LotStatus } from '@/types/lot.types'

const props = defineProps<{ status: LotStatus }>()

const CONFIG: Record<LotStatus, { label: string; class: string }> = {
  pending:   { label: 'En attente',   class: 'badge--gray' },
  stored:    { label: 'Stocké',       class: 'badge--blue' },
  compliant: { label: 'Conforme',     class: 'badge--green' },
  alert:     { label: 'Alerte',       class: 'badge--orange' },
  blocked:   { label: 'Bloqué',       class: 'badge--red' },
  shipped:   { label: 'Expédié',      class: 'badge--purple' },
}
</script>

<template>
  <span class="badge" :class="CONFIG[props.status].class">
    {{ CONFIG[props.status].label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge--gray   { background: #e5e7eb; color: #374151; }
.badge--blue   { background: #dbeafe; color: #1d4ed8; }
.badge--green  { background: #dcfce7; color: #15803d; }
.badge--orange { background: #ffedd5; color: #c2410c; }
.badge--red    { background: #fee2e2; color: #b91c1c; }
.badge--purple { background: #f3e8ff; color: #7e22ce; }
</style>
