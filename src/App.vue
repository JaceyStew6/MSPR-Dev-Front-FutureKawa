<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppNav from '@/components/common/AppNav.vue'
import { useAuthStore } from '@/stores/auth.store'
import { storeToRefs } from 'pinia'

const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

authStore.init()
</script>

<template>
  <div id="app">
    <AppNav v-if="isAuthenticated && route.path !== '/login'" />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  color: #111827;
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

a { color: inherit; }
</style>
