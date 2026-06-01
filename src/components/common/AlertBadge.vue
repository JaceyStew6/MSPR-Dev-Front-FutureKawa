<script setup lang="ts">
import { useAlertsStore } from '@/stores/alerts.store'
import { storeToRefs } from 'pinia'

const alertsStore = useAlertsStore()
const { unreadCount } = storeToRefs(alertsStore)
</script>

<template>
  <RouterLink to="/alerts" class="alert-badge-link">
    <span class="bell">🔔</span>
    <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
  </RouterLink>
</template>

<style scoped>
.alert-badge-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.bell { font-size: 1.2rem; }
.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #dc2626;
  color: white;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
