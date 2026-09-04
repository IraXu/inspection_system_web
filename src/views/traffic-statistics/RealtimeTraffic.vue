<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { TeamOutlined, LoginOutlined, LogoutOutlined, DashboardOutlined, ReloadOutlined } from '@antdv-next/icons'
import { useTrafficStore, scenarioTemplates } from '@/stores/traffic'

const trafficStore = useTrafficStore()
const scenario = computed(() => trafficStore.currentScenario)
const insideUnit = computed(() => (scenario.value.objectName === '目标' ? '个' : '人'))

const selectedPoint = ref<string | undefined>(undefined)
const lastUpdate = ref('2026-09-04 14:30:00')
const refreshTick = ref(0)

const pointOptions = computed(() =>
  trafficStore.points.map(p => ({ value: p.id, label: `${p.name}（${p.orgPath.split('/').pop()}）` })))

const refresh = () => {
  refreshTick.value++
  lastUpdate.value = '2026-09-04 14:30:00'
}

// ========== 实时指标卡 ==========
const baseInside = computed(() => scenario.value.thresholds.inside)
const stats = computed(() => [
  { key: 'inside', title: '当前在数', value: Math.round(baseInside.value * 0.4) + (refreshTick.value % 5), suffix: insideUnit.value, icon: DashboardOutlined, color: '#722ed1' },
  { key: 'enter', title: '今日进入', value: baseInside.value * 3 + refreshTick.value, suffix: scenario.value.unit, icon: LoginOutlined, color: '#52c41a' },
  { key: 'exit', title: '今日离开', value: Math.round(baseInside.value * 2.8) + refreshTick.value, suffix: scenario.value.unit, icon: LogoutOutlined, color: '#faad14' },
  { key: 'total', title: '今日总人次', value: baseInside.value * 6 + refreshTick.value * 2, suffix: scenario.value.unit, icon: TeamOutlined, color: '#1677ff' },
])

// ========== 24 小时进出曲线 ==========
const curveHours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const curveValues = computed(() => {
  const base = baseInside.value
  return {
    enter: curveHours.map((_, i) => Math.round(base * (Math.sin(i / 4) * 0.5 + 0.8))),
    exit: curveHours.map((_, i) => Math.round(base * (Math.cos(i / 4) * 0.4 + 0.7))),
  }
})

// ========== 点位实时列表 ==========
interface PointRow {
  id: string
  name: string
  orgPath: string
  inside: number
  enter: number
  exit: number
  total: number
  warn: boolean
}

const pointRows = computed<PointRow[]>(() => {
  const base = baseInside.value
  return trafficStore.points
    .filter(p => !selectedPoint.value || p.id === selectedPoint.value)
    .map((p, i) => {
      const factor = 1 + ((i * 7) % 10) / 10
      const inside = Math.round(base * 0.4 * factor)
      return {
        id: p.id,
        name: p.name,
        orgPath: p.orgPath,
        inside,
        enter: Math.round(base * 3 * factor),
        exit: Math.round(base * 2.8 * factor),
        total: Math.round(base * 6 * factor),
        warn: inside >= p.thresholds.inside,
      }
    })
})

const pointColumns = [
  { title: '计数点位', dataIndex: 'name', key: 'name' },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '当前在数', dataIndex: 'inside', key: 'inside', align: 'right' as const },
  { title: '今日进入', dataIndex: 'enter', key: 'enter', align: 'right' as const },
  { title: '今日离开', dataIndex: 'exit', key: 'exit', align: 'right' as const },
  { title: '今日总人次', dataIndex: 'total', key: 'total', align: 'right' as const },
  { title: '状态', dataIndex: 'warn', key: 'warn', align: 'center' as const },
]

// ========== ECharts ==========
const curveChartRef = ref<HTMLElement>()
let curveChart: echarts.ECharts | null = null

const renderCurve = () => {
  if (!curveChart) return
  curveChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['进入', '离开'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: curveHours, boundaryGap: false },
    yAxis: { type: 'value', name: scenario.value.unit },
    series: [
      { name: '进入', type: 'line', smooth: true, data: curveValues.value.enter, itemStyle: { color: '#52c41a' }, areaStyle: { color: 'rgba(82,196,26,0.10)' } },
      { name: '离开', type: 'line', smooth: true, data: curveValues.value.exit, itemStyle: { color: '#faad14' }, areaStyle: { color: 'rgba(250,173,20,0.10)' } },
    ],
  })
}

const handleResize = () => curveChart?.resize()
const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
    nextTick(() => {
      curveChart = echarts.init(curveChartRef.value!)
      renderCurve()
      window.addEventListener('resize', handleResize)
    })
  }, 800)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  curveChart?.dispose()
})
</script>

<template>
  <div class="page-container">
    <!-- 顶部工具栏 -->
    <a-card class="toolbar-card" :loading="loading">
      <a-space wrap :size="12">
        <span class="toolbar-label">场景模板</span>
        <a-select
          :value="trafficStore.currentScenarioKey"
          :options="scenarioTemplates.map(s => ({ value: s.key, label: s.name }))"
          style="width: 140px"
          @change="(v: string) => trafficStore.setScenario(v)"
        />
        <a-tag color="blue">{{ scenario.objectName }}</a-tag>
        <span class="toolbar-label">计数点位</span>
        <a-select v-model:value="selectedPoint" :options="pointOptions" allow-clear placeholder="全部点位" style="width: 220px" />
        <a-button size="small" type="primary" ghost @click="refresh">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
        <span class="update-time">最后更新：{{ lastUpdate }}</span>
      </a-space>
    </a-card>

    <!-- 实时指标卡 -->
    <div class="stats-grid">
      <a-card v-for="item in stats" :key="item.key" class="stat-card" :loading="loading">
        <div class="stat-item">
          <div class="stat-icon" :style="{ background: item.color + '1f', color: item.color }">
            <component :is="item.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">
              <span class="stat-number">{{ item.value.toLocaleString() }}</span>
              <span class="stat-suffix">{{ item.suffix }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 实时进出曲线 -->
    <a-card :loading="loading" title="实时进出曲线（近 24 小时）" class="section-card">
      <div ref="curveChartRef" class="chart-box"></div>
    </a-card>

    <!-- 点位实时列表 -->
    <a-card :loading="loading" title="点位实时列表">
      <a-table :columns="pointColumns" :data-source="pointRows" :pagination="false" size="middle">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'warn'">
            <a-tag :color="record.warn ? 'red' : 'green'">
              {{ record.warn ? '超限预警' : '正常' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'inside'">
            <span :style="{ color: record.warn ? '#ff4d4f' : '#1a1a1a', fontWeight: record.warn ? 600 : 400 }">
              {{ record.inside }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.page-container { padding: 8px; }
.toolbar-card { margin-bottom: 16px; }
.toolbar-card :deep(.ant-card-body) { padding: 14px 20px; }
.toolbar-label { font-size: 13px; color: #666; }
.update-time { font-size: 12px; color: #999; margin-left: 8px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
@media (max-width: 1400px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-card { transition: box-shadow 0.2s, transform 0.2s; }
.stat-card:hover { box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
.stat-card :deep(.ant-card-body) { padding: 20px; }
.stat-item { display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.stat-info { min-width: 0; }
.stat-title { font-size: 13px; color: #999; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-value { display: flex; align-items: baseline; }
.stat-number { font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1; }
.stat-suffix { font-size: 13px; color: #999; margin-left: 4px; }
.section-card { margin-bottom: 16px; }
.chart-box { height: 280px; width: 100%; }
</style>
