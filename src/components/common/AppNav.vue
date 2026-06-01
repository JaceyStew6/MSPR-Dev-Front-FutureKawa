<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import AlertBadge from './AlertBadge.vue'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const router = useRouter()
const { user, role } = storeToRefs(authStore)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="nav">
    <div class="nav-brand">
      <RouterLink to="/dashboard" class="brand-link">🌿 FutureKawa</RouterLink>
    </div>

    <ul class="nav-links">
      <li><RouterLink to="/lots">Lots</RouterLink></li>
      <li><RouterLink to="/alerts">Alertes</RouterLink></li>

      <!-- Farm Manager -->
      <template v-if="role === 'farm_manager'">
        <li><RouterLink to="/farm">Mon exploitation</RouterLink></li>
      </template>

      <!-- Warehouse Manager -->
      <template v-if="role === 'warehouse_manager'">
        <li><RouterLink to="/warehouse">Entrepôt</RouterLink></li>
        <li><RouterLink to="/monitoring">Monitoring</RouterLink></li>
      </template>

      <!-- Équipe Qualité -->
      <template v-if="role === 'quality'">
        <li><RouterLink to="/quality">Qualité</RouterLink></li>
        <li><RouterLink to="/monitoring">Monitoring</RouterLink></li>
      </template>

      <!-- Supply Chain -->
      <template v-if="role === 'supply_chain'">
        <li><RouterLink to="/supply-chain">Supply Chain</RouterLink></li>
      </template>

      <!-- HQ / Siège -->
      <template v-if="role === 'hq'">
        <li><RouterLink to="/hq">Reporting</RouterLink></li>
        <li><RouterLink to="/monitoring">Monitoring</RouterLink></li>
        <li><RouterLink to="/quality">Qualité</RouterLink></li>
        <li><RouterLink to="/supply-chain">Supply Chain</RouterLink></li>
      </template>
    </ul>

    <div class="nav-right">
      <AlertBadge />
      <span class="user-info">{{ user?.name }} · <em>{{ user?.role }}</em></span>
      <button class="btn-logout" @click="handleLogout">Déconnexion</button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.5rem;
  height: 56px;
  background: #1a2e1a;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}
.brand-link { color: white; text-decoration: none; font-weight: 700; font-size: 1.1rem; }
.nav-links { list-style: none; display: flex; gap: 1rem; margin: 0; padding: 0; flex: 1; }
.nav-links a { color: #c1d1c1; text-decoration: none; font-size: 0.9rem; }
.nav-links a.router-link-active { color: white; font-weight: 600; }
.nav-right { display: flex; align-items: center; gap: 1rem; margin-left: auto; }
.user-info { font-size: 0.82rem; color: #9cb09c; }
.user-info em { color: #6ee7b7; font-style: normal; }
.btn-logout {
  background: transparent;
  border: 1px solid #4a7a4a;
  color: #c1d1c1;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
}
.btn-logout:hover { background: #2d4a2d; }
</style>
