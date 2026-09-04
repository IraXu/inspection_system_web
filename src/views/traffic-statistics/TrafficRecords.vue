<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'antdv-next'
import { DownloadOutlined, QuestionCircleOutlined } from '@antdv-next/icons'
import { useTrafficStore, scenarioTemplates } from '@/stores/traffic'

const trafficStore = useTrafficStore()
const scenario = computed(() => trafficStore.currentScenario)

// ========== 筛选 ==========
const pointFilter = ref<string[]>([])
const typeFilter = ref<string[]>([])
const dateRange = ref<any[]>([])

const pointOptions = computed(() => trafficStore.points.map(p => ({ value: p.id, label: `${p.name}（${p.orgPath.split('/').pop()}）` })))
const typeOptions = computed(() => scenario.value.targetTypes.map(t => ({ value: t, label: t })))

// ========== 明细数据 ==========
interface TrafficRecord {
  key: string
  time: string
  pointName: string
  orgPath: string
  total: number
  enter: number
  exit: number
  inside: number
  targetType: string
}

const mockRecords: TrafficRecord[] = Array.from({ length: 48 }, (_, i) => {
  const p = trafficStore.points[i % trafficStore.points.length]
  const types = p.targetTypes.length ? p.targetTypes : scenario.value.targetTypes
  const targetType = types[i % types.length]
  const base = p.thresholds.inside
  const day = String(27 - Math.floor(i / 4)).padStart(2, '0')
  const hour = String(20 - (i % 12)).padStart(2, '0')
  return {
    key: String(i + 1),
    time: `2026-08-${day} ${hour}:00`,
    pointName: p.name,
    orgPath: p.orgPath,
    total: base * 6 + i,
    enter: base * 3 + i,
    exit: Math.round(base * 2.8 + i),
    inside: Math.round(base * 0.4),
    targetType,
  }
})

const filteredRecords = computed(() => {
  return mockRecords.filter(r => {
    if (pointFilter.value.length && !pointFilter.value.includes(trafficStore.points.find(p => p.name === r.pointName)?.id ?? '')) return false
    if (typeFilter.value.length && !typeFilter.value.includes(r.targetType)) return false
    return true
  })
})

const columns = [
  { title: '时间', dataIndex: 'time', key: 'time' },
  { title: '计数点位', dataIndex: 'pointName', key: 'pointName' },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '总人次', dataIndex: 'total', key: 'total', align: 'right' as const },
  { title: '进入', dataIndex: 'enter', key: 'enter', align: 'right' as const },
  { title: '离开', dataIndex: 'exit', key: 'exit', align: 'right' as const },
  { title: '在数', dataIndex: 'inside', key: 'inside', align: 'right' as const },
  { title: '目标分类', dataIndex: 'targetType', key: 'targetType', align: 'center' as const },
]

const pagination = ref({ current: 1, pageSize: 10 })
const pagedRecords = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.pageSize
  return filteredRecords.value.slice(start, start + pagination.value.pageSize)
})

const handleExport = () => {
  // TODO: 对接后端 API — 导出人流统计明细 GET /api/traffic/statistics/export
  message.success('已开始导出报表')
}
</script>

<template>
  <div class="page-container">
    <a-card>
      <template #title>
        <span>统计明细</span>
        <a-tooltip title="按点位/时间/目标分类查询总人次、进入、离开、在数">
          <QuestionCircleOutlined style="margin-left:6px;color:#999" />
        </a-tooltip>
      </template>
      <div class="filter-toolbar">
        <a-space wrap :size="8">
          <span class="filter-label">场景模板</span>
          <a-select
            :value="trafficStore.currentScenarioKey"
            :options="scenarioTemplates.map(s => ({ value: s.key, label: s.name }))"
            size="small"
            style="width: 120px"
            @change="(v: string) => trafficStore.setScenario(v)"
          />
          <a-select
            v-model:value="pointFilter"
            mode="multiple"
            placeholder="选择计数点位"
            size="small"
            :options="pointOptions"
            style="width: 220px"
            allow-clear
            :max-tag-count="1"
          />
          <a-select
            v-model:value="typeFilter"
            mode="multiple"
            placeholder="目标分类"
            size="small"
            :options="typeOptions"
            style="width: 160px"
            allow-clear
            :max-tag-count="1"
          />
          <a-range-picker v-model:value="dateRange" size="small" :placeholder="['开始日期', '结束日期']" />
          <a-button size="small" type="primary" ghost @click="handleExport">
            <template #icon><DownloadOutlined /></template>导出
          </a-button>
        </a-space>
      </div>

      <a-table :columns="columns" :data-source="pagedRecords" :pagination="false" size="middle">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'targetType'">
            <a-tag>{{ record.targetType }}</a-tag>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无数据，请调整筛选条件" />
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
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
.page-container { padding: 8px; }
.filter-toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.filter-label { font-size: 13px; color: #666; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
:deep(.ant-table) { table-layout: fixed; }
</style>
