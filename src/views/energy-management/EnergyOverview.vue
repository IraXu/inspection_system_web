<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, reactive, nextTick } from 'vue'
import { message } from 'antdv-next'
import * as echarts from 'echarts'
import { ThunderboltOutlined, DatabaseOutlined, PercentageOutlined, CalendarOutlined, DashboardOutlined, DownloadOutlined, QuestionCircleOutlined } from '@antdv-next/icons'

// ========== 类型定义 ==========
interface StoreUsage {
  key: string
  orgPath: string       // 所属组织路径（全路径）
  todayUsage: number    // 今日用电 kWh
  monthUsage: number    // 本月用电 kWh
  momChange: number     // 环比 %
  powerStatus: 'POWER_ON' | 'POWER_OFF'
}

interface EnergyRecord {
  key: string
  orgPath: string
  meterName: string
  period: string
  usage: number
  peakPower: number
  avgPower: number
}

// ========== 指标卡片（等宽对齐，无筛选） ==========
const stats = [
  { title: '接入电表数', value: 48, suffix: '台', icon: DatabaseOutlined, color: '#1677ff' },
  { title: '电表在线率', value: 87.5, suffix: '%', icon: PercentageOutlined, color: '#52c41a' },
  { title: '今日用电', value: 1280.5, suffix: 'kWh', icon: ThunderboltOutlined, color: '#faad14' },
  { title: '本月用电', value: 38420.8, suffix: 'kWh', icon: CalendarOutlined, color: '#722ed1' },
  { title: '当前总功率', value: 156.3, suffix: 'kW', icon: DashboardOutlined, color: '#eb2f96' },
]

// ========== 门店用电排名数据（大数据量演示） ==========
const storePaths = [
  '新加坡 / 中央区 / 乌节路 / 乌节路旗舰店',
  '新加坡 / 滨海湾 / 滨海湾金沙店',
  '新加坡 / 牛车水 / 牛车水店',
  '新加坡 / 樟宜 / 樟宜机场店',
  '新加坡 / 武吉士 / 武吉士店',
  '新加坡 / 裕廊东 / 裕廊东店',
  '新加坡 / 淡滨尼 / 淡滨尼店',
  '新加坡 / 大巴窑 / 大巴窑店',
  '新加坡 / 实龙岗 / 实龙岗店',
  '新加坡 / 碧山 / 碧山店',
  '新加坡 / 义顺 / 义顺店',
  '新加坡 / 宏茂桥 / 宏茂桥店',
  '新加坡 / 勿洛 / 勿洛店',
  '新加坡 / 加冷 / 加冷店',
  '新加坡 / 榜鹅 / 榜鹅店',
  '新加坡 / 后港 / 后港店',
  '新加坡 / 盛港 / 盛港店',
  '新加坡 / 金文泰 / 金文泰店',
  '新加坡 / 武吉巴督 / 武吉巴督店',
  '新加坡 / 红山 / 红山店',
]

const storeUsage: StoreUsage[] = storePaths.map((orgPath, i) => {
  const todayUsage = Number((80 + ((i * 13) % 140)).toFixed(1))
  const monthUsage = Number((todayUsage * 28 + i * 37).toFixed(1))
  const momChange = Number(((i % 15) - 7).toFixed(1))
  const powerStatus: 'POWER_ON' | 'POWER_OFF' = i % 12 === 5 ? 'POWER_OFF' : 'POWER_ON'
  return { key: String(i + 1), orgPath, todayUsage, monthUsage, momChange, powerStatus }
})

const rankColumns = [
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '今日用电 (kWh)', dataIndex: 'todayUsage', key: 'todayUsage', align: 'right' as const },
  { title: '本月用电 (kWh)', dataIndex: 'monthUsage', key: 'monthUsage', align: 'right' as const },
  { title: '环比', dataIndex: 'momChange', key: 'momChange', align: 'right' as const },
  { title: '供电状态', dataIndex: 'powerStatus', key: 'powerStatus', align: 'center' as const },
]

// ========== 门店排名维度筛选 ==========
const rankDim = ref<'today' | 'month'>('today')
const rankDimOptions = [
  { value: 'today', label: '按今日' },
  { value: 'month', label: '按本月' },
]

const sortedStoreUsage = computed(() =>
  [...storeUsage].sort((a, b) =>
    rankDim.value === 'today' ? b.todayUsage - a.todayUsage : b.monthUsage - a.monthUsage))

// ========== 电表明细（大数据量演示） ==========
const recordMeterNames = ['总表', '冷藏区', '照明区', '空调区']

const mockRecords: EnergyRecord[] = Array.from({ length: 40 }, (_, i) => {
  const orgPath = storePaths[i % storePaths.length]
  const meterName = recordMeterNames[i % recordMeterNames.length]
  const day = String(26 - Math.floor(i / 5)).padStart(2, '0')
  const usage = Number((60 + ((i * 17) % 160)).toFixed(1))
  const peakPower = Number((usage / 8).toFixed(1))
  const avgPower = Number((usage / 14).toFixed(1))
  return { key: String(i + 1), orgPath, meterName, period: `2026-08-${day}`, usage, peakPower, avgPower }
})

const recordColumns = [
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '电表', dataIndex: 'meterName', key: 'meterName' },
  { title: '日期', dataIndex: 'period', key: 'period' },
  { title: '用电量 (kWh)', dataIndex: 'usage', key: 'usage', align: 'right' as const },
  { title: '峰值功率 (kW)', dataIndex: 'peakPower', key: 'peakPower', align: 'right' as const },
  { title: '平均功率 (kW)', dataIndex: 'avgPower', key: 'avgPower', align: 'right' as const },
]

const orgFilter = ref<string[]>([])
const detailRange = ref<any[]>([])
const orgOptions = storeUsage.map(s => ({ value: s.orgPath, label: s.orgPath }))

const filteredRecords = computed(() => {
  if (orgFilter.value.length === 0) return mockRecords
  return mockRecords.filter(r => orgFilter.value.includes(r.orgPath))
})

const rankPagination = reactive({ current: 1, pageSize: 10 })
const recordPagination = reactive({ current: 1, pageSize: 10 })

const pagedStoreUsage = computed(() => {
  const start = (rankPagination.current - 1) * rankPagination.pageSize
  return sortedStoreUsage.value.slice(start, start + rankPagination.pageSize)
})
const pagedRecords = computed(() => {
  const start = (recordPagination.current - 1) * recordPagination.pageSize
  return filteredRecords.value.slice(start, start + recordPagination.pageSize)
})

const handleExport = () => {
  // TODO: 对接后端 API — 导出电表明细 GET /api/energy/statistics/export
  message.success('已开始导出报表')
}

// ========== 趋势图时间范围 ==========
const trendRange = ref<any[]>([])

// ========== ECharts ==========
const trendChartRef = ref<HTMLElement>()
const rankChartRef = ref<HTMLElement>()
const curveChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let rankChart: echarts.ECharts | null = null
let curveChart: echarts.ECharts | null = null

const trendDays = ['08-21', '08-22', '08-23', '08-24', '08-25', '08-26', '08-27']
const trendValues = [1180, 1245, 1198, 1320, 1265, 1350, 1280]

const shortName = (orgPath: string) => orgPath.split('/').pop()?.trim() || orgPath

// ========== 实时用电曲线（近 24 小时功率） ==========
const curveStore = ref<string | undefined>(undefined)
const curveMeter = ref<string | undefined>(undefined)
const curveMeterOptions = computed(() => {
  if (!curveStore.value) return []
  return ['总表', '冷藏区', '照明区', '空调区', '厨房区'].map(n => ({ value: n, label: n }))
})
watch(curveStore, () => { curveMeter.value = undefined })
const curveHours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const curveValues = [12.5, 10.2, 8.9, 7.8, 7.2, 8.1, 10.5, 15.3, 18.2, 20.1, 21.5, 22.3, 22.8, 21.9, 20.5, 19.8, 18.6, 20.2, 22.1, 23.5, 21.8, 18.9, 16.2, 14.1]

const renderCharts = () => {
  if (trendChart) {
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: trendDays, boundaryGap: false },
      yAxis: { type: 'value', name: 'kWh' },
      series: [{
        name: '用电量', type: 'line', smooth: true, data: trendValues,
        itemStyle: { color: '#1677ff' },
        areaStyle: { color: 'rgba(22,119,255,0.10)' },
      }],
    })
  }
  if (rankChart) {
    const data = sortedStoreUsage.value
    const values = data.map(s => rankDim.value === 'today' ? s.todayUsage : s.monthUsage)
    rankChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 10, right: 30, top: 10, bottom: 20, containLabel: true },
      xAxis: { type: 'value', name: 'kWh' },
      yAxis: { type: 'category', data: data.map(s => shortName(s.orgPath)).reverse(), inverse: true },
      series: [{
        type: 'bar', data: values.reverse(),
        barMaxWidth: 18,
        itemStyle: { color: '#1677ff', borderRadius: [0, 4, 4, 0] },
      }],
    })
  }
}

const renderCurveChart = () => {
  if (curveChart) {
    curveChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: curveHours, boundaryGap: false },
      yAxis: { type: 'value', name: 'kW' },
      series: [{
        name: '功率', type: 'line', smooth: true, data: curveValues,
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82,196,26,0.10)' },
      }],
    })
  }
}

watch(rankDim, () => renderCharts())

const handleResize = () => {
  trendChart?.resize()
  rankChart?.resize()
  curveChart?.resize()
}

const loading = ref(true)

onMounted(() => {
  // 模拟数据加载（大数据量/查询慢场景演示骨架屏）
  setTimeout(() => {
    loading.value = false
    nextTick(() => {
      trendChart = echarts.init(trendChartRef.value!)
      rankChart = echarts.init(rankChartRef.value!)
      curveChart = echarts.init(curveChartRef.value!)
      renderCharts()
      renderCurveChart()
      window.addEventListener('resize', handleResize)
    })
  }, 800)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  rankChart?.dispose()
  curveChart?.dispose()
})
</script>

<template>
  <div class="page-container">
    <!-- 指标卡片：等宽对齐（无筛选） -->
    <div class="stats-grid">
      <a-card v-for="item in stats" :key="item.title" class="stat-card" :loading="loading">
        <div class="stat-item">
          <div class="stat-icon" :style="{ background: item.color + '1f', color: item.color }">
            <component :is="item.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">
              <span class="stat-number">{{ item.value }}</span>
              <span class="stat-suffix">{{ item.suffix }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 图表区：左右并排 -->
    <a-row :gutter="[16, 16]" class="chart-row">
      <a-col :span="24" :lg="14">
        <a-card :loading="loading">
          <template #title>用电趋势</template>
          <template #extra>
            <a-range-picker v-model:value="trendRange" size="small" :placeholder="['开始日期', '结束日期']" style="width: 240px" />
          </template>
          <div ref="trendChartRef" class="chart-box"></div>
        </a-card>
      </a-col>
      <a-col :span="24" :lg="10">
        <a-card :loading="loading">
          <template #title>门店用电排名</template>
          <template #extra>
            <a-select v-model:value="rankDim" :options="rankDimOptions" size="small" style="width:100px" />
          </template>
          <div ref="rankChartRef" class="chart-box"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 实时用电曲线 -->
    <a-card :loading="loading" class="section-card">
      <template #title>实时用电曲线</template>
      <template #extra>
        <a-space wrap :size="8">
          <a-select
            v-model:value="curveStore"
            placeholder="选择门店"
            allow-clear
            show-search
            :options="orgOptions"
            size="small"
            style="width: 220px"
          />
          <a-select
            v-model:value="curveMeter"
            :placeholder="curveStore ? '选择电表' : '请先选择门店'"
            allow-clear
            :options="curveMeterOptions"
            :disabled="!curveStore"
            size="small"
            style="width: 130px"
          />
        </a-space>
      </template>
      <div ref="curveChartRef" class="curve-chart"></div>
    </a-card>

    <!-- 门店用电明细 -->
    <a-card title="门店用电明细" class="section-card" :loading="loading">
      <a-table
        :columns="rankColumns"
        :data-source="pagedStoreUsage"
        :pagination="false"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'momChange'">
            <span :style="{ color: record.momChange > 0 ? '#ff4d4f' : '#52c41a' }">
              {{ record.momChange > 0 ? '+' : '' }}{{ record.momChange }}%
            </span>
          </template>
          <template v-if="column.key === 'powerStatus'">
            <a-tag :color="record.powerStatus === 'POWER_ON' ? 'green' : 'red'">
              {{ record.powerStatus === 'POWER_ON' ? '已供电' : '已断电' }}
            </a-tag>
          </template>
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="rankPagination.current"
          v-model:pageSize="rankPagination.pageSize"
          :total="sortedStoreUsage.length"
          show-size-changer
          :page-size-options="['10','20','50','100']"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </a-card>

    <!-- 电表明细（组织路径 + 日期 + 导出） -->
    <a-card :loading="loading">
      <template #title>
        <span>电表明细</span>
        <a-tooltip title="按日统计各电表的用电量、峰值功率与平均功率">
          <QuestionCircleOutlined style="margin-left:6px;color:#999" />
        </a-tooltip>
      </template>
      <div class="filter-toolbar">
        <a-space wrap :size="8">
          <a-select
            v-model:value="orgFilter"
            mode="multiple"
            placeholder="选择组织路径"
            size="small"
            :options="orgOptions"
            style="width: 200px"
            allow-clear
            :max-tag-count="1"
          />
          <a-range-picker v-model:value="detailRange" size="small" :placeholder="['开始日期', '结束日期']" />
          <a-button size="small" type="primary" ghost @click="handleExport">
            <template #icon><DownloadOutlined /></template>导出
          </a-button>
        </a-space>
      </div>
      <a-table
        :columns="recordColumns"
        :data-source="pagedRecords"
        :pagination="false"
        size="middle"
      >
        <template #emptyText>
          <a-empty description="暂无数据，请调整筛选条件" />
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="recordPagination.current"
          v-model:pageSize="recordPagination.pageSize"
          :total="filteredRecords.length"
          show-size-changer
          :page-size-options="['10','20','50','100']"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.page-container {
  padding: 8px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 1400px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
.stat-card {
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.stat-card :deep(.ant-card-body) {
  padding: 20px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-info {
  min-width: 0;
}
.stat-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-value {
  display: flex;
  align-items: baseline;
}
.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1;
}
.stat-suffix {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}
.chart-row {
  margin-bottom: 16px;
}
.chart-box {
  height: 320px;
  width: 100%;
}
.section-card {
  margin-bottom: 16px;
}
.curve-chart {
  height: 280px;
  width: 100%;
}
.filter-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
:deep(.ant-table) {
  table-layout: fixed;
}
</style>
