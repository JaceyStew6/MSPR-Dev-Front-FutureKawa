<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportingService } from '@/services/reporting.service'
import type { GlobalReport, QualityReport } from '@/types/reporting.types'

const globalReport = ref<GlobalReport | null>(null)
const qualityReport = ref<QualityReport | null>(null)
const loading = ref(false)
const fromDate = ref(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10))
const toDate = ref(new Date().toISOString().slice(0, 10))

async function fetchReports() {
  loading.value = true
  try {
    const [gr, qr] = await Promise.all([
      reportingService.getGlobal(),
      reportingService.getQuality({ from: fromDate.value, to: toDate.value }),
    ])
    globalReport.value = gr
    qualityReport.value = qr
  } finally {
    loading.value = false
  }
}

onMounted(fetchReports)

function pct(n: number) { return `${(n * 100).toFixed(1)}%` }
</script>

<template>
  <div class="page">
    <h2>Reporting Global - Siège</h2>

    <div v-if="loading && !globalReport" class="loading">Chargement…</div>

    <template v-else-if="globalReport">
      <!-- KPIs globaux -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-val">{{ globalReport.kpis.total_lots }}</div>
          <div class="kpi-label">Lots totaux</div>
        </div>
        <div class="kpi-card" :class="globalReport.kpis.compliance_rate >= 0.9 ? 'kpi--green' : 'kpi--orange'">
          <div class="kpi-val">{{ pct(globalReport.kpis.compliance_rate) }}</div>
          <div class="kpi-label">Taux de conformité</div>
        </div>
        <div class="kpi-card" :class="globalReport.kpis.active_alerts > 10 ? 'kpi--red' : ''">
          <div class="kpi-val">{{ globalReport.kpis.active_alerts }}</div>
          <div class="kpi-label">Alertes actives</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ Math.round(globalReport.kpis.avg_age_days) }}j</div>
          <div class="kpi-label">Âge moyen des lots</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ globalReport.kpis.movements_last_30d }}</div>
          <div class="kpi-label">Mouvements (30j)</div>
        </div>
      </div>

      <!-- Breakdown par pays -->
      <div class="section">
        <h3>Vue par pays</h3>
        <table class="country-table">
          <thead>
            <tr>
              <th>Pays</th>
              <th>Lots</th>
              <th>Conformité</th>
              <th>Alertes actives</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in globalReport.by_country" :key="c.country_id">
              <td>{{ c.country_name }}</td>
              <td>{{ c.total_lots }}</td>
              <td :class="c.compliance_rate >= 0.9 ? 'good' : 'warn'">{{ pct(c.compliance_rate) }}</td>
              <td :class="c.active_alerts > 5 ? 'bad' : ''">{{ c.active_alerts }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Qualité par période -->
      <div class="section">
        <div class="section-header">
          <h3>Reporting qualité</h3>
          <div class="date-range">
            <label>Du <input type="date" v-model="fromDate" /></label>
            <label>Au <input type="date" v-model="toDate" /></label>
            <button @click="fetchReports">Actualiser</button>
          </div>
        </div>

        <template v-if="qualityReport">
          <div class="quality-kpis">
            <div class="q-kpi"><strong>{{ pct(qualityReport.compliance_rate) }}</strong> Conformité</div>
            <div class="q-kpi"><strong>{{ qualityReport.total_alerts }}</strong> Alertes</div>
            <div class="q-kpi"><strong>{{ qualityReport.incidents }}</strong> Incidents</div>
          </div>

          <h4>Dérives par zone</h4>
          <table class="country-table">
            <thead>
              <tr><th>Zone</th><th>Entrepôt</th><th>Dérives</th><th>Conformité</th></tr>
            </thead>
            <tbody>
              <tr v-for="z in qualityReport.by_zone" :key="z.zone_id">
                <td>{{ z.zone_name }}</td>
                <td>{{ z.warehouse_name }}</td>
                <td :class="z.drift_count > 5 ? 'bad' : ''">{{ z.drift_count }}</td>
                <td :class="z.compliance_rate >= 0.9 ? 'good' : 'warn'">{{ pct(z.compliance_rate) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
h2 { margin: 0 0 1.5rem; }
h3 { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 600; }
h4 { margin: 1rem 0 0.5rem; font-size: 0.875rem; font-weight: 600; }
.loading { text-align: center; padding: 2rem; color: #6b7280; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
.kpi-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; text-align: center; }
.kpi-val { font-size: 1.8rem; font-weight: 700; }
.kpi-label { font-size: 0.78rem; color: #6b7280; margin-top: 4px; }
.kpi--green { border-color: #86efac; }
.kpi--green .kpi-val { color: #15803d; }
.kpi--orange .kpi-val { color: #d97706; }
.kpi--red .kpi-val { color: #dc2626; }
.section { margin-bottom: 2.5rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
.date-range { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; flex-wrap: wrap; }
.date-range input { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; }
.date-range button { padding: 5px 12px; background: #1a2e1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
.country-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.country-table th { background: #f9fafb; padding: 9px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
.country-table td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; }
.country-table tr:hover td { background: #f9fafb; }
.good { color: #15803d; font-weight: 600; }
.warn { color: #d97706; font-weight: 600; }
.bad  { color: #dc2626; font-weight: 600; }
.quality-kpis { display: flex; gap: 2rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.q-kpi { font-size: 0.9rem; color: #374151; }
.q-kpi strong { font-size: 1.4rem; color: #111827; display: block; }
</style>
