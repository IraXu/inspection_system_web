<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { TeamOutlined, LoginOutlined, LogoutOutlined, DashboardOutlined, PieChartOutlined } from '@antdv-next/icons'
import { useTrafficStore, scenarioTemplates } from '@/stores/traffic'

const trafficStore = useTrafficStore()
const scenario = computed(() => trafficStore.currentScenario)

// ========== 指标卡片 ==========
const insideUnit = computed(() => (scenario.value.objectName === '目标' ? '个' : '人'))
const stats = computed(() => {
  const base = scenario.value.thresholds.inside
  return [
    { key: 'total', title: '总人次', value: base * 6, suffix: scenario.value.unit, icon: TeamOutlined, color: '#1677ff' },
    { key: 'enter', title: '进入', value: base * 3, suffix: scenario.value.unit, icon: LoginOutlined, color: '#52c41a' },
    { key: 'exit', title: '离开', value: Math.round(base * 2.8), suffix: scenario.value.unit, icon: LogoutOutlined, color: '#faad14' },
    { key: 'inside', title: '当前在数', value: Math.round(base * 0.4), suffix: insideUnit.value, icon: DashboardOutlined, color: '#722ed1' },
  ]
})

// ========== 趋势图控制 ==========
const trendRange = ref<any[]>([])
const granularity = ref<'hour' | 'day' | 'week' | 'month'>('day')
const metricKey = ref<'total' | 'enter' | 'exit' | 'inside'>('total')

const granularityOptions = [
  { value: 'hour', label: '按小时' },
  { value: 'day', label: '按天' },
  { value: 'week', label: '按周' },
  { value: 'month', label: '按月' },
]
const metricOptions = [
  { value: 'total', label: '总人次' },
  { value: 'enter', label: '进入' },
  { value: 'exit', label: '离开' },
  { value: 'inside', label: '在' },
]

const trendCategories = computed(() => {
  if (granularity.value === 'hour') return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  if (granularity.value === 'week') return Array.from({ length: 12 }, (_, i) => `第 ${i + 1} 周`)
  if (granularity.value === 'month') return Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
  return Array.from({ length: 14 }, (_, i) => `08-${String(13 + i).padStart(2, '0')}`)
})

const trendValues = computed(() => {
  const base = scenario.value.thresholds.inside
  return trendCategories.value.map((_, i) => {
    const wave = Math.sin(i / 2) * 0.3 + 0.7
    const mul = metricKey.value === 'inside' ? 0.4 : metricKey.value === 'total' ? 6 : metricKey.value === 'enter' ? 3 : 2.8
    return Math.max(0, Math.round(base * mul * wave))
  })
})

// ========== 点位排名 ==========
const rankMetric = ref<'total' | 'enter' | 'inside'>('total')
const rankOptions = [
  { value: 'total', label: '按总人次' },
  { value: 'enter', label: '按进入' },
  { value: 'inside', label: '按在数' },
]
const shortName = (orgPath: string) => orgPath.split('/').pop()?.trim() || orgPath

const rankData = computed(() => {
  const base = scenario.value.thresholds.inside
  return trafficStore.points
    .map((p, i) => {
      const factor = 1 + ((i * 7) % 10) / 10
      return {
        name: p.name,
        total: Math.round(base * 6 * factor),
        enter: Math.round(base * 3 * factor),
        inside: Math.round(base * 0.4 * factor),
      }
    })
    .sort((a, b) => {
      const av = a[rankMetric.value]
      const bv = b[rankMetric.value]
      return bv - av
    })
})

// ========== 目标分类占比 ==========
const pieData = computed(() => {
  const types = scenario.value.targetTypes
  const total = 100
  const weights = types.map((_, i) => 0.55 - i * 0.08)
  const sum = weights.reduce((a, b) => a + b, 0)
  return types.map((t, i) => ({ name: t, value: Math.round((weights[i] / sum) * total) }))
})
const pieColors = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96']

// ========== ECharts ==========
const trendChartRef = ref<HTMLElement>()
const rankChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let rankChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const renderCharts = () => {
  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: trendCategories.value, boundaryGap: false },
      yAxis: { type: 'value', name: scenario.value.unit },
      series: [{
        name: metricOptions.find(o => o.value === metricKey.value)?.label,
        type: 'line', smooth: true, data: trendValues.value,
        itemStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22,119,255,0.10)' },
      }],
    })
  }
  if (rankChart) {
    const data = rankData.value
    rankChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 10, right: 30, top: 10, bottom: 20, containLabel: true },
      xAxis: { type: 'value', name: scenario.value.unit },
      yAxis: { type: 'category', data: data.map(d => d.name).reverse(), inverse: true },
      series: [{
        type: 'bar', data: data.map(d => d[rankMetric.value]).reverse(),
        barMaxWidth: 18,
        itemStyle: { color: '#1677ff', borderRadius: [0, 4, 4, 0] },
      }],
    })
  }
  if (pieChart) {
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
        data: pieData.value,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        color: pieColors,
        label: { formatter: '{b}\n{c}%' },
      }],
    })
  }
}

watch([scenario, granularity, metricKey, rankMetric], () => renderCharts())

const handleResize = () => {
  trendChart?.resize()
  rankChart?.resize()
  pieChart?.resize()
}

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
    nextTick(() => {
      trendChart = echarts.init(trendChartRef.value!)
      rankChart = echarts.init(rankChartRef.value!)
      pieChart = echarts.init(pieChartRef.value!)
      renderCharts()
      window.addEventListener('resize', handleResize)
    })
  }, 800)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  rankChart?.dispose()
  pieChart?.dispose()
})
</script>

<template>
  <div class="page-container">
    <!-- 顶部工具栏：场景模板 + 时间范围 -->
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
        <span class="toolbar-label">统计时间</span>
        <a-range-picker v-model:value="trendRange" :placeholder="['开始日期', '结束日期']" style="width: 240px" />
      </a-space>
    </a-card>

    <!-- 指标卡片 -->
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

    <!-- 图表区：趋势 + 排名 -->
    <a-row :gutter="[16, 16]" class="chart-row">
      <a-col :span="24" :lg="14">
        <a-card :loading="loading">
          <template #title>计数趋势</template>
          <template #extra>
            <a-space :size="8">
              <a-select v-model:value="metricKey" :options="metricOptions" size="small" style="width: 110px" />
              <a-select v-model:value="granularity" :options="granularityOptions" size="small" style="width: 100px" />
            </a-space>
          </template>
          <div ref="trendChartRef" class="chart-box"></div>
        </a-card>
      </a-col>
      <a-col :span="24" :lg="10">
        <a-card :loading="loading">
          <template #title>点位排名</template>
          <template #extra>
            <a-select v-model:value="rankMetric" :options="rankOptions" size="small" style="width: 110px" />
          </template>
          <div ref="rankChartRef" class="chart-box"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 目标分类占比 -->
    <a-card :loading="loading" title="目标分类占比">
      <template #extra>
        <PieChartOutlined style="color: #999" />
      </template>
      <div ref="pieChartRef" class="pie-chart"></div>
    </a-card>
  </div>
</template>

<style scoped>
.page-container { padding: 8px; }
.toolbar-card { margin-bottom: 16px; }
.toolbar-card :deep(.ant-card-body) { padding: 14px 20px; }
.toolbar-label { font-size: 13px; color: #666; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 1400px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-card { transition: box-shadow 0.2s, transform 0.2s; }
.stat-card:hover { box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
.stat-card :deep(.ant-card-body) { padding: 20px; }
.stat-item { display: flex; align-items: center; gap: 14px; }
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.stat-info { min-width: 0; }
.stat-title { font-size: 13px; color: #999; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-value { display: flex; align-items: baseline; }
.stat-number { font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1; }
.stat-suffix { font-size: 13px; color: #999; margin-left: 4px; }
.chart-row { margin-bottom: 16px; }
.chart-box { height: 320px; width: 100%; }
.pie-chart { height: 320px; width: 100%; }
</style>
