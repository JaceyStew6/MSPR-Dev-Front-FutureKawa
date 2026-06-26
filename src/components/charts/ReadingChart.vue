<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import 'chart.js/auto'
import { readingsService } from '@/services/readings.service'
import type { Granularity } from '@/types/reading.types'

// Enregistrement Chart.js (évite le tree-shaking)
Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler)

const props = defineProps<{
  lotId?: string
  zoneId?: string
  warehouseId?: string
  countryId?: string
}>()

const granularity = ref<Granularity>('1h')
const from = ref<string>(defaultFrom())
const to = ref<string>(new Date().toISOString().slice(0, 10))
const loading = ref(false)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function defaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

async function loadAndRender() {
  if (!canvasRef.value) return
  loading.value = true
  try {
    const readings = await readingsService.getReadings({
      lot_id: props.lotId,
      zone_id: props.zoneId,
      warehouse_id: props.warehouseId,
      country_id: props.countryId,
      granularity: granularity.value,
      from: from.value,
      to: to.value,
    })

    const labels = readings.map((r) => new Date(r.recorded_at).toLocaleString('en-US'))
    const temps = readings.map((r) => r.temperature)
    const humids = readings.map((r) => r.humidity)

    if (chart) chart.destroy()

    chart = new Chart(canvasRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            yAxisID: 'y',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Humidity (%)',
            data: humids,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            yAxisID: 'y2',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index' },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Temperature (°C)' },
          },
          y2: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Humidity (%)' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => nextTick(loadAndRender))
watch([granularity, from, to], loadAndRender)
watch(() => props.zoneId, loadAndRender)
onUnmounted(() => chart?.destroy())
</script>

<template>
  <div class="chart-wrapper">
    <div class="chart-controls">
      <select v-model="granularity">
        <option value="raw">Raw</option>
        <option value="1h">Hourly</option>
        <option value="1d">Daily</option>
      </select>
      <label>From <input type="date" v-model="from" /></label>
      <label>To <input type="date" v-model="to" /></label>
      <button @click="loadAndRender" class="btn-refresh">↻ Refresh</button>
    </div>
    <div class="chart-container">
      <div v-if="loading" class="chart-loading">Loading data…</div>
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper { display: flex; flex-direction: column; gap: 0.75rem; }
.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}
.chart-controls select,
.chart-controls input {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.btn-refresh {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}
.chart-container { position: relative; height: 300px; }
.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.7);
  color: #6b7280;
  z-index: 1;
}
</style>
