<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'antdv-next'
import { DownloadOutlined, QuestionCircleOutlined } from '@antdv-next/icons'
import { useTrafficStore } from '@/stores/traffic'
import { useEnterpriseStore } from '@/stores/enterprise'

const trafficStore = useTrafficStore()
const enterpriseStore = useEnterpriseStore()
const scenarioLabel = computed(() => enterpriseStore.scenarioLabel)

/**
 * 统计规则：每行 = 一个计数点位在一个时间粒度周期内的汇总。
 * - 总人次：该周期内的到访累计（进入的人次）
 * - 进入 / 离开：该周期内进入、离开区域的目标数
 * 在数属于实时指标，不作为时段明细展示。
 */

// ========== 筛选 ==========
const pointFilter = ref<string[]>([])
const granularity = ref<'hour' | 'day' | 'week' | 'month'>('day')
const dateRange = ref<any[]>([])

const granularityOptions = [
  { value: 'hour', label: '按小时' },
  { value: 'day', label: '按天' },
  { value: 'week', label: '按周' },
  { value: 'month', label: '按月' },
]

// ========== 明细数据 ==========
interface TrafficRecord {
  key: string
  period: string
  pointName: string
  orgPath: string
  total: number
  enter: number
  exit: number
}

const formatPeriod = (index: number): string => {
  if (granularity.value === 'hour') {
    const day = String(27 - Math.floor(index / 24)).padStart(2, '0')
    const hour = String(23 - (index % 24)).padStart(2, '0')
    return `2026-08-${day} ${hour}:00`
  }
  if (granularity.value === 'week') return `2026 第 ${30 - index} 周`
  if (granularity.value === 'month') return `2026-${String(8 - index).padStart(2, '0')}`
  return `2026-08-${String(27 - index).padStart(2, '0')}`
}

const periodCount = computed(() => {
  if (granularity.value === 'hour') return 24
  if (granularity.value === 'week') return 4
  if (granularity.value === 'month') return 6
  return 14
})

const mockRecords = computed<TrafficRecord[]>(() => {
  const rows: TrafficRecord[] = []
  const points = trafficStore.points.filter(p => pointFilter.value.length === 0 || pointFilter.value.includes(p.id))
  points.forEach((p, pi) => {
    for (let i = 0; i < periodCount.value; i++) {
      const factor = 1 + ((pi * 7 + i * 3) % 10) / 10
      const base = p.insideThreshold
      const enter = Math.round(base * 6 * factor)
      rows.push({
        key: `${p.id}-${i}`,
        period: formatPeriod(i),
        pointName: p.name,
        orgPath: p.orgPath,
        total: enter,
        enter,
        exit: Math.round(enter * 0.93),
      })
    }
  })
  return rows
})

const columns = [
  { title: '统计周期', dataIndex: 'period', key: 'period' },
  { title: '计数点位', dataIndex: 'pointName', key: 'pointName' },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '总人次', dataIndex: 'total', key: 'total', align: 'right' as const },
  { title: '进入', dataIndex: 'enter', key: 'enter', align: 'right' as const },
  { title: '离开', dataIndex: 'exit', key: 'exit', align: 'right' as const },
]

const pagination = ref({ current: 1, pageSize: 10 })
const pagedRecords = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.pageSize
  return mockRecords.value.slice(start, start + pagination.value.pageSize)
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
        <a-tooltip title="按计数点位与统计周期汇总：总人次为该周期到访累计，进入/离开为该周期进出数">
          <QuestionCircleOutlined style="margin-left:6px;color:#999" />
        </a-tooltip>
      </template>
      <div class="filter-toolbar">
        <a-space wrap :size="8">
          <span class="filter-label">应用场景</span>
          <a-tag color="blue">{{ scenarioLabel }}</a-tag>
          <span class="filter-label">统计周期</span>
          <a-select v-model:value="granularity" :options="granularityOptions" size="small" style="width: 100px" />
          <a-select
            v-model:value="pointFilter"
            mode="multiple"
            placeholder="选择计数点位"
            size="small"
            :options="trafficStore.pointOptions"
            style="width: 220px"
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
        <template #emptyText>
          <a-empty description="暂无数据，请调整筛选条件" />
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="mockRecords.length"
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
