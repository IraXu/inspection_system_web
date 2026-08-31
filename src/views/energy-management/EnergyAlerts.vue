<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import {
  SearchOutlined, ReloadOutlined, QuestionCircleOutlined, ClockCircleOutlined, SyncOutlined,
  EyeOutlined, CheckCircleOutlined, AlertFilled, UserOutlined,
} from '@antdv-next/icons'

// ========== 类型定义 ==========
type AlertStatus = 'PENDING' | 'PROCESSING' | 'REVIEWING' | 'CLOSED'

interface AlertRecord {
  key: string
  time: string
  orgPath: string
  meterName: string
  type: 'OVERLOAD' | 'OFFLINE' | 'ABNORMAL'
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
  status: AlertStatus
  detail: string
  handler?: string
  reviewer?: string
  handleResult?: string
  closeType?: 'NORMAL' | 'FALSE_POSITIVE'
  assignTime?: string
  handleTime?: string
  closeTime?: string
}

const typeMap: Record<AlertRecord['type'], { text: string; color: string }> = {
  OVERLOAD: { text: '超载', color: 'red' },
  OFFLINE: { text: '电表离线', color: 'orange' },
  ABNORMAL: { text: '异常波动', color: 'blue' },
}
const severityMap: Record<AlertRecord['severity'], { text: string; color: string }> = {
  INFO: { text: '提示', color: 'blue' },
  WARNING: { text: '一般', color: 'orange' },
  CRITICAL: { text: '严重', color: 'red' },
  EMERGENCY: { text: '紧急', color: 'volcano' },
}
const statusMap: Record<AlertStatus, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'orange' },
  PROCESSING: { text: '处理中', color: 'blue' },
  REVIEWING: { text: '待复核', color: 'purple' },
  CLOSED: { text: '已关闭', color: 'green' },
}

// ========== Mock 数据 ==========
const orgPaths = [
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
]
const meterNames = ['总表', '冷藏区', '照明区', '空调区', '厨房区']
const alertTypes: AlertRecord['type'][] = ['OVERLOAD', 'OFFLINE', 'ABNORMAL']
const alertSeverities: AlertRecord['severity'][] = ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY']
const alertStatuses: AlertStatus[] = ['PENDING', 'PROCESSING', 'REVIEWING', 'CLOSED']
const detailByType: Record<AlertRecord['type'], (n: number) => string> = {
  OVERLOAD: n => `功率 ${(50 + n * 1.3).toFixed(1)}kW 超过阈值 50kW`,
  OFFLINE: n => `连续 ${(n % 5) + 3} 次心跳无响应`,
  ABNORMAL: n => `用电量环比波动 ${(n % 20) + 5}%`,
}
const memberNames = ['李运维', '王主管', '张巡检', '陈工程', '刘店长']

const pad2 = (n: number) => String(n).padStart(2, '0')
const shiftTime = (day: string, hour: number, minute: string, second: string, offsetHour: number) =>
  `2026-08-${day} ${pad2((hour + offsetHour) % 24)}:${minute}:${second}`

const mockAlerts: AlertRecord[] = Array.from({ length: 48 }, (_, i) => {
  const type = alertTypes[i % 3]
  const status = alertStatuses[i % 4]
  const day = String(27 - Math.floor(i / 3)).padStart(2, '0')
  const hour = 23 - (i % 24)
  const minute = String((i * 7) % 60).padStart(2, '0')
  const second = String((i * 13) % 60).padStart(2, '0')
  const time = `2026-08-${day} ${pad2(hour)}:${minute}:${second}`
  return {
    key: String(i + 1),
    time,
    orgPath: orgPaths[i % orgPaths.length],
    meterName: meterNames[i % meterNames.length],
    type,
    severity: alertSeverities[i % 4],
    status,
    detail: detailByType[type](i + 1),
    handler: status === 'PENDING' ? undefined : memberNames[(i + 1) % memberNames.length],
    reviewer: status === 'PROCESSING' || status === 'REVIEWING' || status === 'CLOSED' ? memberNames[(i + 2) % memberNames.length] : undefined,
    handleResult: status === 'REVIEWING' || status === 'CLOSED' ? '已现场排查并恢复正常' : undefined,
    closeType: status === 'CLOSED' ? (i % 5 === 0 ? 'FALSE_POSITIVE' : 'NORMAL') : undefined,
    assignTime: status === 'PENDING' ? undefined : shiftTime(day, hour, minute, second, 1),
    handleTime: status === 'REVIEWING' || status === 'CLOSED' ? shiftTime(day, hour, minute, second, 2) : undefined,
    closeTime: status === 'CLOSED' ? shiftTime(day, hour, minute, second, 3) : undefined,
  }
})

// ========== 顶部数据卡片 ==========
const stats = computed(() => {
  const pending = mockAlerts.filter(a => a.status === 'PENDING').length
  const processing = mockAlerts.filter(a => a.status === 'PROCESSING').length
  const reviewing = mockAlerts.filter(a => a.status === 'REVIEWING').length
  const closed = mockAlerts.filter(a => a.status === 'CLOSED').length
  const critical = mockAlerts.filter(a => (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY') && a.status !== 'CLOSED').length
  return [
    { title: '待处理', value: pending, icon: ClockCircleOutlined, color: '#faad14' },
    { title: '处理中', value: processing, icon: SyncOutlined, color: '#1677ff' },
    { title: '待复核', value: reviewing, icon: EyeOutlined, color: '#722ed1' },
    { title: '已关闭', value: closed, icon: CheckCircleOutlined, color: '#52c41a' },
    { title: '严重告警', value: critical, icon: AlertFilled, color: '#ff4d4f' },
  ]
})

// ========== 数据权限 ==========
const currentRole = '系统管理员'
const dataScope = '全部组织'
const permissions = ['查看', '指派', '复核', '关闭']

// ========== 筛选（点击查询才生效） ==========
const loading = ref(false)
const dataSource = ref<AlertRecord[]>([])
const typeFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string | undefined>(undefined)
const handlerFilter = ref<string | undefined>(undefined)

const typeOptions = [
  { value: 'OVERLOAD', label: '超载' },
  { value: 'OFFLINE', label: '电表离线' },
  { value: 'ABNORMAL', label: '异常波动' },
]
const statusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'REVIEWING', label: '待复核' },
  { value: 'CLOSED', label: '已关闭' },
]
const handlerOptions = memberNames.map(n => ({ value: n, label: n }))

const columns = [
  { title: '告警时间', dataIndex: 'time', key: 'time', width: 160 },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '电表', dataIndex: 'meterName', key: 'meterName', width: 90 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
  { title: '处理人', dataIndex: 'handler', key: 'handler', width: 90 },
  { title: '复核人', dataIndex: 'reviewer', key: 'reviewer', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 240 },
]

const pagination = reactive({ current: 1, pageSize: 10 })
const pagedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return dataSource.value.slice(start, start + pagination.pageSize)
})

// TODO: 对接后端 API — 查询能耗告警列表 GET /api/energy/alerts
const fetchData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  dataSource.value = mockAlerts.filter(a => {
    const typeOk = !typeFilter.value || a.type === typeFilter.value
    const statusOk = !statusFilter.value || a.status === statusFilter.value
    const handlerOk = !handlerFilter.value || a.handler === handlerFilter.value
    return typeOk && statusOk && handlerOk
  })
  pagination.current = 1
  loading.value = false
}

const handleReset = () => {
  typeFilter.value = undefined
  statusFilter.value = undefined
  handlerFilter.value = undefined
  fetchData()
}

// ========== 指派处理 ==========
const assignVisible = ref(false)
const assignTarget = ref<AlertRecord | null>(null)
const handler = ref<string | undefined>(undefined)
const reviewer = ref<string | undefined>(undefined)
const memberOptions = memberNames.map(n => ({ value: n, label: n }))

const openAssign = (record: AlertRecord) => {
  assignTarget.value = record
  handler.value = undefined
  reviewer.value = undefined
  assignVisible.value = true
}
const confirmAssign = () => {
  if (!handler.value) { message.warning('请选择处理人'); return }
  if (!reviewer.value) { message.warning('请选择复核人'); return }
  if (assignTarget.value) {
    assignTarget.value.handler = handler.value
    assignTarget.value.reviewer = reviewer.value
    assignTarget.value.status = 'PROCESSING'
    assignTarget.value.assignTime = new Date().toLocaleString('zh-CN', { hour12: false })
  }
  assignVisible.value = false
  message.success('已指派处理人')
}

// ========== 提交处理 ==========
const submitVisible = ref(false)
const submitTarget = ref<AlertRecord | null>(null)
const handleResult = ref('')

const openSubmit = (record: AlertRecord) => {
  submitTarget.value = record
  handleResult.value = ''
  submitVisible.value = true
}
const confirmSubmit = () => {
  if (!handleResult.value.trim()) { message.warning('请填写处理结果'); return }
  if (submitTarget.value) {
    submitTarget.value.handleResult = handleResult.value.trim()
    submitTarget.value.status = 'REVIEWING'
    submitTarget.value.handleTime = new Date().toLocaleString('zh-CN', { hour12: false })
  }
  submitVisible.value = false
  message.success('已提交处理结果，等待复核')
}

// ========== 复核 ==========
const handleApprove = (record: AlertRecord) => {
  record.status = 'CLOSED'
  record.closeType = 'NORMAL'
  record.closeTime = new Date().toLocaleString('zh-CN', { hour12: false })
  message.success('复核通过，告警已关闭')
}
const handleReject = (record: AlertRecord) => {
  record.status = 'PROCESSING'
  message.warning('已驳回，退回处理')
}

// ========== 标记误报 ==========
const handleMarkFalsePositive = (record: AlertRecord) => {
  record.status = 'CLOSED'
  record.closeType = 'FALSE_POSITIVE'
  record.handleResult = '经核实为误报'
  record.closeTime = new Date().toLocaleString('zh-CN', { hour12: false })
  message.success('已标记为误报')
}

// ========== 处理流程详情 ==========
const detailVisible = ref(false)
const detailRecord = ref<AlertRecord | null>(null)

const flowSteps = computed(() => {
  const r = detailRecord.value
  if (!r) return []
  const steps = [
    { title: '告警触发', time: r.time, content: `${typeMap[r.type].text}：${r.detail}`, color: 'red' },
  ]
  if (r.handler) {
    steps.push({ title: '指派处理', time: r.assignTime || '—', content: `处理人：${r.handler} · 复核人：${r.reviewer || '—'}`, color: 'blue' })
  }
  if (r.handleResult) {
    steps.push({ title: '提交处理结果', time: r.handleTime || '—', content: r.handleResult, color: 'blue' })
  }
  if (r.status === 'CLOSED') {
    steps.push({
      title: r.closeType === 'FALSE_POSITIVE' ? '标记误报' : '复核通过',
      time: r.closeTime || '—',
      content: r.closeType === 'FALSE_POSITIVE' ? '经核实为误报，告警关闭' : '复核通过，告警关闭',
      color: 'green',
    })
  }
  return steps
})

const openDetail = (record: AlertRecord) => {
  detailRecord.value = record
  detailVisible.value = true
}

fetchData()
</script>

<template>
  <div class="page-container">
    <!-- 数据权限 -->
    <div class="perm-bar">
      <UserOutlined class="perm-icon" />
      <span class="perm-label">当前角色</span>
      <a-tag color="blue">{{ currentRole }}</a-tag>
      <span class="perm-divider">·</span>
      <span class="perm-label">数据范围</span>
      <b>{{ dataScope }}</b>
      <span class="perm-divider">·</span>
      <span class="perm-label">操作权限</span>
      <span>{{ permissions.join(' / ') }}</span>
    </div>

    <!-- 数据卡片 -->
    <div class="stats-grid">
      <a-card v-for="s in stats" :key="s.title" class="stat-card">
        <div class="stat-item">
          <div class="stat-icon" :style="{ background: s.color + '1f', color: s.color }">
            <component :is="s.icon" />
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ s.title }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>
      </a-card>
    </div>

    <a-card>
      <div class="toolbar">
        <a-space wrap>
          <a-select v-model:value="typeFilter" placeholder="告警类型" allow-clear style="width: 140px" :options="typeOptions" />
          <a-select v-model:value="statusFilter" placeholder="处理状态" allow-clear style="width: 140px" :options="statusOptions" />
          <a-select v-model:value="handlerFilter" placeholder="处理人" allow-clear style="width: 140px" :options="handlerOptions" />
          <a-button type="primary" @click="fetchData">
            <SearchOutlined /> 查询
          </a-button>
          <a-button @click="handleReset">
            <ReloadOutlined /> 重置
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :loading="loading"
        :pagination="false"
      >
        <template #headerCell="{ column }">
          <template v-if="column.key === 'action'">
            <span>操作</span>
            <a-tooltip placement="top" overlay-class-name="alert-action-tooltip">
              <QuestionCircleOutlined style="margin-left:4px;color:#999" />
              <template #title>
                <div class="tooltip-body">
                  <div>处理流程：待处理 → 指派处理人 → 处理中 → 提交结果 → 待复核 → 复核关闭</div>
                  <div>待处理阶段可「标记误报」直接关闭</div>
                </div>
              </template>
            </a-tooltip>
          </template>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="typeMap[record.type as AlertRecord['type']].color">
              {{ typeMap[record.type as AlertRecord['type']].text }}
            </a-tag>
          </template>
          <template v-if="column.key === 'handler'">
            <span>{{ record.handler || '—' }}</span>
          </template>
          <template v-if="column.key === 'reviewer'">
            <span>{{ record.reviewer || '—' }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag v-if="record.status === 'CLOSED' && record.closeType === 'FALSE_POSITIVE'" color="default">误报</a-tag>
            <a-tag v-else :color="statusMap[record.status as AlertStatus].color">
              {{ statusMap[record.status as AlertStatus].text }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space :size="0" class="action-space">
              <template v-if="record.status === 'PENDING'">
                <a-button type="link" size="small" @click="openAssign(record)">指派处理</a-button>
                <a-button type="link" danger size="small" @click="handleMarkFalsePositive(record)">标记误报</a-button>
              </template>
              <a-button v-if="record.status === 'PROCESSING'" type="link" size="small" @click="openSubmit(record)">提交处理</a-button>
              <template v-if="record.status === 'REVIEWING'">
                <a-button type="link" size="small" @click="handleApprove(record)">复核通过</a-button>
                <a-button type="link" danger size="small" @click="handleReject(record)">驳回</a-button>
              </template>
              <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无告警" />
        </template>
      </a-table>

      <div class="pagination-wrap">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="dataSource.length"
          show-size-changer
          :page-size-options="['10','20','50','100']"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </a-card>

    <!-- 指派处理弹窗 -->
    <a-modal v-model:open="assignVisible" title="指派处理" ok-text="确认指派" cancel-text="取消" @ok="confirmAssign" width="480px">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="告警信息">
          <span>{{ assignTarget?.orgPath }} / {{ assignTarget?.meterName }}</span>
        </a-form-item>
        <a-form-item label="处理人" required>
          <a-select v-model:value="handler" placeholder="选择处理人" :options="memberOptions" />
        </a-form-item>
        <a-form-item label="复核人" required>
          <a-select v-model:value="reviewer" placeholder="选择复核人" :options="memberOptions" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 提交处理弹窗 -->
    <a-modal v-model:open="submitVisible" title="提交处理结果" ok-text="提交" cancel-text="取消" @ok="confirmSubmit" width="480px">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="告警信息">
          <span>{{ submitTarget?.orgPath }} / {{ submitTarget?.meterName }}</span>
        </a-form-item>
        <a-form-item label="处理结果" required>
          <a-textarea v-model:value="handleResult" placeholder="请填写处理结果（如：已排查并恢复正常）" :rows="3" style="margin-bottom: 8px" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 处理流程详情抽屉 -->
    <a-drawer v-model:open="detailVisible" title="告警处理详情" width="480px">
      <a-descriptions :column="1" size="small" bordered style="margin-bottom: 24px">
        <a-descriptions-item label="所属组织路径">{{ detailRecord?.orgPath }}</a-descriptions-item>
        <a-descriptions-item label="电表">{{ detailRecord?.meterName }}</a-descriptions-item>
        <a-descriptions-item label="告警类型">
          <a-tag v-if="detailRecord" :color="typeMap[detailRecord.type].color">{{ typeMap[detailRecord.type].text }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="告警级别">
          <a-tag v-if="detailRecord" :color="severityMap[detailRecord.severity].color">{{ severityMap[detailRecord.severity].text }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="当前状态">
          <a-tag v-if="detailRecord" :color="statusMap[detailRecord.status].color">{{ statusMap[detailRecord.status].text }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <a-timeline>
        <a-timeline-item v-for="(step, idx) in flowSteps" :key="idx" :color="step.color">
          <div class="flow-title">{{ step.title }}</div>
          <div class="flow-time">{{ step.time }}</div>
          <div class="flow-content">{{ step.content }}</div>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>
  </div>
</template>

<style scoped>
.page-container {
  padding: 8px;
}
.perm-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
}
.perm-icon {
  color: #1677ff;
  font-size: 16px;
}
.perm-label {
  color: #999;
}
.perm-divider {
  color: #d9d9d9;
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
.stat-card :deep(.ant-card-body) {
  padding: 16px 20px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.stat-title {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
:deep(.ant-table-thead > tr > th),
:deep(.ant-table-tbody > tr > td) {
  padding: 12px 14px;
}
.action-space {
  white-space: nowrap;
}
:deep(.ant-table) {
  table-layout: fixed;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.flow-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.flow-time {
  font-size: 12px;
  color: #999;
  margin: 2px 0;
}
.flow-content {
  font-size: 13px;
  color: #666;
}
</style>

<style>
/* 操作列 tooltip：白色背景 */
.alert-action-tooltip .ant-tooltip-inner {
  background: #fff;
  color: #333;
}
.alert-action-tooltip .ant-tooltip-arrow::before {
  background: #fff;
}
</style>
