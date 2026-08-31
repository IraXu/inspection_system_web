<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message, Modal } from 'antdv-next'
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, ClockCircleOutlined,
  ThunderboltOutlined, PoweroffOutlined, AlertOutlined, QuestionCircleOutlined,
} from '@antdv-next/icons'

// ========== 类型定义 ==========
type PlanTrigger = 'TIME' | 'EVENT'
type PlanType = 'DAILY' | 'WEEKLY' | 'ONCE'
type PlanAction = 'POWER_OFF' | 'POWER_ON'
type PlanLifecycle = 'PENDING' | 'ACTIVE' | 'EXPIRED'
type PlanStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'DISABLED'
type AlertType = 'OVERLOAD' | 'OFFLINE' | 'ABNORMAL'

interface PowerPlan {
  key: string
  name: string
  trigger: PlanTrigger
  action: PlanAction
  targetOrgs: string[]   // 作用组织（门店）
  targetMeters: string[] // 作用电表（空 = 组织下全部电表）
  enabled: boolean       // 启停开关
  lifecycle: PlanLifecycle // 生命周期（由执行时间自动判断）
  remark?: string
  operator: string      // 操作人
  updatedAt: string     // 更新时间
  // 定时触发（trigger = TIME）
  type?: PlanType
  time?: string        // 定时执行时间展示文案
  dailyTime?: string   // 每天：HH:mm
  weekDays?: number[]  // 每周：1-7
  weeklyTime?: string  // 每周：HH:mm
  onceDate?: string    // 一次性：YYYY-MM-DD
  onceTime?: string    // 一次性：HH:mm
  // 事件触发（trigger = EVENT）
  eventType?: AlertType
}

const triggerMap: Record<PlanTrigger, { text: string; color: string }> = {
  TIME: { text: '定时触发', color: 'blue' },
  EVENT: { text: '事件触发', color: 'volcano' },
}
const actionMap: Record<PlanAction, { text: string; color: string }> = {
  POWER_OFF: { text: '断电', color: 'red' },
  POWER_ON: { text: '通电', color: 'green' },
}
const alertTypeMap: Record<AlertType, { text: string; color: string }> = {
  OVERLOAD: { text: '超载', color: 'red' },
  OFFLINE: { text: '电表离线', color: 'orange' },
  ABNORMAL: { text: '异常波动', color: 'blue' },
}
const statusMap: Record<PlanStatus, { text: string; color: string }> = {
  PENDING: { text: '待生效', color: 'blue' },
  ACTIVE: { text: '生效中', color: 'green' },
  EXPIRED: { text: '已过期', color: 'default' },
  DISABLED: { text: '已停用', color: 'orange' },
}

// 状态含义说明（悬浮展示）
const statusDescriptions: { key: PlanStatus; desc: string }[] = [
  { key: 'PENDING', desc: '计划已启用，尚未到执行时间' },
  { key: 'ACTIVE', desc: '计划已启用，处于执行周期内' },
  { key: 'EXPIRED', desc: '一次性计划已执行完，不再触发' },
  { key: 'DISABLED', desc: '已手动停用，不会自动执行' },
]

// 综合状态：已过期优先级最高（终态），其次停用，最后按生命周期
const planStatus = (p: PowerPlan): PlanStatus => {
  if (p.lifecycle === 'EXPIRED') return 'EXPIRED'
  if (!p.enabled) return 'DISABLED'
  return p.lifecycle
}

const storeOptions = [
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
]

// 门店简称（用于电表区分，同名电表靠门店区分）
const storeShortName = (path: string) => path.split('/').map(s => s.trim()).filter(Boolean).pop() || path

// 各门店通用电表名称（同名电表靠门店区分）
const meterNames = ['总表', '冷藏区', '照明区', '空调区', '厨房区']

// ========== Mock 数据 ==========
// 大数据量演示：超多作用对象
const manyOrgs = Array.from({ length: 200 }, (_, i) => {
  const region = `区域${String(Math.floor(i / 20) + 1).padStart(2, '0')}`
  return `新加坡 / ${region} / 连锁门店${String(i + 1).padStart(3, '0')}`
})
const manyMeters = Array.from({ length: 150 }, (_, i) => {
  const org = manyOrgs[i % manyOrgs.length]
  return `${storeShortName(org)} / ${meterNames[i % meterNames.length]}`
})

const mockPlans: PowerPlan[] = [
  { key: '0', name: '全国连锁门店夜间统一断电', trigger: 'TIME', type: 'DAILY', action: 'POWER_OFF', time: '每天 23:30', dailyTime: '23:30', targetOrgs: manyOrgs, targetMeters: manyMeters, enabled: true, lifecycle: 'ACTIVE', remark: '覆盖 200 家门店、150 块电表的统一断电节能计划', operator: '🫏建成', updatedAt: '2026-08-28 09:15:00' },
  { key: '1', name: '公寓夜间节能断电', trigger: 'TIME', type: 'DAILY', action: 'POWER_OFF', time: '每天 23:00', dailyTime: '23:00', targetOrgs: [storeOptions[0], storeOptions[4]], targetMeters: [], enabled: true, lifecycle: 'ACTIVE', remark: '深夜闭店后自动断电节能', operator: '李运维', updatedAt: '2026-08-27 22:40:00' },
  { key: '2', name: '酒店退房断电', trigger: 'TIME', type: 'ONCE', action: 'POWER_OFF', time: '2026-09-01 12:00', onceDate: '2026-09-01', onceTime: '12:00', targetOrgs: [storeOptions[3]], targetMeters: [], enabled: true, lifecycle: 'PENDING', remark: '客房退租后断电', operator: '王主管', updatedAt: '2026-08-27 16:20:00' },
  { key: '3', name: '出租房欠费断电', trigger: 'TIME', type: 'ONCE', action: 'POWER_OFF', time: '2026-08-20 09:00', onceDate: '2026-08-20', onceTime: '09:00', targetOrgs: [storeOptions[1], storeOptions[2]], targetMeters: [], enabled: true, lifecycle: 'EXPIRED', remark: '欠费租户统一断电', operator: '🫏建成', updatedAt: '2026-08-26 11:05:00' },
  { key: '4', name: '周末恢复供电', trigger: 'TIME', type: 'WEEKLY', action: 'POWER_ON', time: '每周六 08:00', weekDays: [6], weeklyTime: '08:00', targetOrgs: [storeOptions[5], storeOptions[6]], targetMeters: [], enabled: true, lifecycle: 'ACTIVE', remark: '周末营业前恢复供电', operator: '李运维', updatedAt: '2026-08-25 19:30:00' },
  { key: '5', name: '商铺清晨通电', trigger: 'TIME', type: 'DAILY', action: 'POWER_ON', time: '每天 07:30', dailyTime: '07:30', targetOrgs: [storeOptions[7], storeOptions[8]], targetMeters: [], enabled: true, lifecycle: 'ACTIVE', remark: '营业前自动通电', operator: '王主管', updatedAt: '2026-08-25 09:45:00' },
  { key: '6', name: '空房节能断电', trigger: 'TIME', type: 'DAILY', action: 'POWER_OFF', time: '每天 22:00', dailyTime: '22:00', targetOrgs: [storeOptions[9]], targetMeters: [], enabled: false, lifecycle: 'ACTIVE', remark: '空置客房定时断电', operator: '🫏建成', updatedAt: '2026-08-24 14:10:00' },
  { key: '7', name: '节假日停业断电', trigger: 'TIME', type: 'ONCE', action: 'POWER_OFF', time: '2026-10-01 18:00', onceDate: '2026-10-01', onceTime: '18:00', targetOrgs: [storeOptions[10], storeOptions[11]], targetMeters: [], enabled: true, lifecycle: 'PENDING', remark: '节假日统一停业断电', operator: '李运维', updatedAt: '2026-08-23 10:00:00' },
  { key: '8', name: '早高峰通电', trigger: 'TIME', type: 'WEEKLY', action: 'POWER_ON', time: '每周一 06:30', weekDays: [1], weeklyTime: '06:30', targetOrgs: [storeOptions[0]], targetMeters: [], enabled: false, lifecycle: 'ACTIVE', remark: '周一早高峰提前通电', operator: '王主管', updatedAt: '2026-08-22 17:25:00' },
  { key: '9', name: '超载自动断电', trigger: 'EVENT', action: 'POWER_OFF', eventType: 'OVERLOAD', targetOrgs: [storeOptions[0], storeOptions[3], storeOptions[7]], targetMeters: ['乌节路旗舰店 / 总表', '樟宜机场店 / 冷藏区'], enabled: true, lifecycle: 'ACTIVE', remark: '功率超载时立即断电，防止火灾', operator: '🫏建成', updatedAt: '2026-08-21 08:50:00' },
  { key: '10', name: '异常波动断电', trigger: 'EVENT', action: 'POWER_OFF', eventType: 'ABNORMAL', targetOrgs: [storeOptions[5]], targetMeters: ['裕廊东店 / 照明区'], enabled: true, lifecycle: 'ACTIVE', remark: '用电量异常波动时断电排查', operator: '李运维', updatedAt: '2026-08-20 15:35:00' },
  { key: '11', name: '离线恢复供电', trigger: 'EVENT', action: 'POWER_ON', eventType: 'OFFLINE', targetOrgs: [storeOptions[9], storeOptions[11]], targetMeters: [], enabled: false, lifecycle: 'ACTIVE', remark: '电表恢复在线后自动通电', operator: '王主管', updatedAt: '2026-08-19 12:15:00' },
]

// 触发条件展示文案
const triggerCondition = (p: PowerPlan): string => {
  if (p.trigger === 'TIME') return p.time || '—'
  return alertTypeMap[p.eventType as AlertType]?.text || '—'
}

// ========== 统计卡片 ==========
const stats = computed(() => [
  { title: '生效中', value: mockPlans.filter(p => planStatus(p) === 'ACTIVE').length, icon: ThunderboltOutlined, color: '#52c41a' },
  { title: '待生效', value: mockPlans.filter(p => planStatus(p) === 'PENDING').length, icon: ClockCircleOutlined, color: '#1677ff' },
  { title: '已停用', value: mockPlans.filter(p => planStatus(p) === 'DISABLED').length, icon: PoweroffOutlined, color: '#faad14' },
  { title: '已过期', value: mockPlans.filter(p => planStatus(p) === 'EXPIRED').length, icon: AlertOutlined, color: '#999999' },
])

// ========== 筛选（点击查询才生效） ==========
const loading = ref(false)
const dataSource = ref<PowerPlan[]>([])
const triggerFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string | undefined>(undefined)

const triggerOptions = [
  { value: 'TIME', label: '定时触发' },
  { value: 'EVENT', label: '事件触发' },
]
const statusOptions = [
  { value: 'PENDING', label: '待生效' },
  { value: 'ACTIVE', label: '生效中' },
  { value: 'EXPIRED', label: '已过期' },
  { value: 'DISABLED', label: '已停用' },
]

const columns = [
  { title: '计划名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 160 },
  { title: '触发方式', dataIndex: 'trigger', key: 'trigger', width: 90 },
  { title: '触发条件', dataIndex: 'condition', key: 'condition', ellipsis: true, width: 150 },
  { title: '动作', dataIndex: 'action', key: 'action', width: 80 },
  { title: '作用对象', dataIndex: 'scope', key: 'scope', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true, width: 160 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 90 },
  { title: '操作', key: 'op', width: 150, fixed: 'right' as const },
]

const pagination = reactive({ current: 1, pageSize: 10 })
const pagedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return dataSource.value.slice(start, start + pagination.pageSize)
})

const fetchData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  dataSource.value = mockPlans.filter(p => {
    const triggerOk = !triggerFilter.value || p.trigger === triggerFilter.value
    const statusOk = !statusFilter.value || planStatus(p) === statusFilter.value
    return triggerOk && statusOk
  })
  pagination.current = 1
  loading.value = false
}

const handleReset = () => {
  triggerFilter.value = undefined
  statusFilter.value = undefined
  fetchData()
}

// ========== 创建/编辑 ==========
const modalVisible = ref(false)
const editingKey = ref<string | null>(null)

const typeOptions = [
  { value: 'DAILY', label: '每天' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'ONCE', label: '一次性' },
]
const eventTypeOptions = [
  { value: 'OVERLOAD', label: '超载' },
  { value: 'OFFLINE', label: '电表离线' },
  { value: 'ABNORMAL', label: '异常波动' },
]

const form = reactive({
  name: '',
  trigger: 'TIME' as PlanTrigger,
  action: 'POWER_OFF' as PlanAction,
  type: 'DAILY' as PlanType,
  dailyTime: '',
  weekDays: [] as number[],
  weeklyTime: '',
  onceDate: '',
  onceTime: '',
  eventType: 'OVERLOAD' as AlertType,
  targetOrgs: [] as string[],
  targetMeters: [] as string[],
  remark: '',
})

// 作用电表选项：按所选组织分组（组名=门店简称），组内展示电表名
const targetMeterOptions = computed(() => {
  return form.targetOrgs.map(org => {
    const short = storeShortName(org)
    return {
      label: short,
      options: meterNames.map(name => ({
        value: `${short} / ${name}`,
        label: name,
      })),
    }
  })
})

// 组织变化时清空已选电表，避免残留不属于新组织的电表
const onTargetOrgsChange = () => {
  form.targetMeters = []
}

const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const weekOpts = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

const openCreate = () => {
  editingKey.value = null
  Object.assign(form, {
    name: '', trigger: 'TIME', action: 'POWER_OFF', type: 'DAILY',
    dailyTime: '', weekDays: [], weeklyTime: '', onceDate: '', onceTime: '',
    eventType: 'OVERLOAD',
    targetOrgs: [], targetMeters: [], remark: '',
  })
  modalVisible.value = true
}
const openEdit = (record: PowerPlan) => {
  editingKey.value = record.key
  Object.assign(form, {
    name: record.name,
    trigger: record.trigger,
    action: record.action,
    type: record.type || 'DAILY',
    dailyTime: record.dailyTime || '',
    weekDays: record.weekDays ? [...record.weekDays] : [],
    weeklyTime: record.weeklyTime || '',
    onceDate: record.onceDate || '',
    onceTime: record.onceTime || '',
    eventType: record.eventType || 'OVERLOAD',
    targetOrgs: [...record.targetOrgs],
    targetMeters: [...record.targetMeters],
    remark: record.remark || '',
  })
  modalVisible.value = true
}

const formatNow = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// 根据计划类型与执行时间计算生命周期
const calcLifecycle = (): PlanLifecycle => {
  if (form.trigger === 'TIME' && form.type === 'ONCE') {
    const target = new Date(`${form.onceDate}T${form.onceTime}:00`)
    return target.getTime() > Date.now() ? 'PENDING' : 'EXPIRED'
  }
  return 'ACTIVE'
}

const handleSubmit = () => {
  if (!form.name.trim()) { message.warning('请输入计划名称'); return }
  if (form.targetOrgs.length === 0) { message.warning('请选择作用组织'); return }

  const base = {
    name: form.name.trim(),
    trigger: form.trigger,
    action: form.action,
    targetOrgs: [...form.targetOrgs],
    targetMeters: [...form.targetMeters],
    remark: form.remark.trim() || undefined,
    operator: '🫏建成',
    updatedAt: formatNow(),
  }

  let payload: Omit<PowerPlan, 'key' | 'enabled' | 'lifecycle'> = { ...base }

  if (form.trigger === 'TIME') {
    let time = ''
    if (form.type === 'DAILY') {
      if (!form.dailyTime) { message.warning('请选择执行时间'); return }
      time = `每天 ${form.dailyTime}`
    } else if (form.type === 'WEEKLY') {
      if (form.weekDays.length === 0) { message.warning('请选择执行星期'); return }
      if (!form.weeklyTime) { message.warning('请选择执行时间'); return }
      const days = form.weekDays.map(d => weekDayNames[d - 1]).join('、')
      time = `每周${days} ${form.weeklyTime}`
    } else {
      if (!form.onceDate) { message.warning('请选择执行日期'); return }
      if (!form.onceTime) { message.warning('请选择执行时间'); return }
      time = `${form.onceDate} ${form.onceTime}`
    }
    payload = {
      ...base,
      type: form.type,
      time,
      dailyTime: form.dailyTime,
      weekDays: [...form.weekDays],
      weeklyTime: form.weeklyTime,
      onceDate: form.onceDate,
      onceTime: form.onceTime,
    }
  } else {
    payload = {
      ...base,
      eventType: form.eventType,
    }
  }

  if (editingKey.value) {
    const target = mockPlans.find(p => p.key === editingKey.value)
    if (target) {
      // 清除旧的触发条件字段，避免切换触发方式时残留
      delete target.type
      delete target.time
      delete target.dailyTime
      delete target.weekDays
      delete target.weeklyTime
      delete target.onceDate
      delete target.onceTime
      delete target.eventType
      Object.assign(target, payload, { lifecycle: calcLifecycle() })
    }
    message.success('计划已更新')
  } else {
    mockPlans.unshift({ key: String(Date.now()), enabled: true, lifecycle: calcLifecycle(), ...payload })
    message.success('计划已创建')
  }
  modalVisible.value = false
  fetchData()
}

// ========== 启停 / 删除 ==========
const toggleStatus = (record: PowerPlan) => {
  const enabling = !record.enabled
  Modal.confirm({
    title: enabling ? '启用计划' : '停用计划',
    content: enabling
      ? `确定要启用计划「${record.name}」吗？启用后将在满足触发条件时自动执行。`
      : `确定要停用计划「${record.name}」吗？停用后该计划将不再自动执行。`,
    okText: enabling ? '启用' : '停用',
    cancelText: '取消',
    okButtonProps: enabling ? {} : { danger: true },
    onOk: () => {
      record.enabled = enabling
      message.success(enabling ? '已启用计划' : '已停用计划')
      fetchData()
    },
  })
}
const handleDelete = (record: PowerPlan) => {
  Modal.confirm({
    title: '删除计划',
    content: `确定要删除计划「${record.name}」吗？删除后不可恢复。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      const idx = mockPlans.findIndex(p => p.key === record.key)
      if (idx > -1) mockPlans.splice(idx, 1)
      message.success('计划已删除')
      fetchData()
    },
  })
}

// ========== 作用对象详情（弹窗） ==========
const scopeVisible = ref(false)
const scopeRecord = ref<PowerPlan | null>(null)
const orgKeyword = ref('')
const meterKeyword = ref('')

const filteredOrgs = computed(() => {
  if (!scopeRecord.value) return []
  const kw = orgKeyword.value.trim()
  return kw ? scopeRecord.value.targetOrgs.filter(o => o.includes(kw)) : scopeRecord.value.targetOrgs
})
const filteredMeters = computed(() => {
  if (!scopeRecord.value) return []
  const kw = meterKeyword.value.trim()
  return kw ? scopeRecord.value.targetMeters.filter(m => m.includes(kw)) : scopeRecord.value.targetMeters
})

const orgColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' as const },
  { title: '组织路径', dataIndex: 'path', key: 'path', ellipsis: true },
]
const meterColumns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' as const },
  { title: '门店', dataIndex: 'store', key: 'store', width: 200, ellipsis: true },
  { title: '电表', dataIndex: 'name', key: 'name' },
]
const orgTableData = computed(() =>
  filteredOrgs.value.map((path, i) => ({ index: i + 1, path })))
const meterTableData = computed(() =>
  filteredMeters.value.map((m, i) => {
    const idx = m.lastIndexOf(' / ')
    const store = idx > 0 ? m.slice(0, idx) : m
    const name = idx > 0 ? m.slice(idx + 3) : '—'
    return { index: i + 1, store, name }
  }))

// 弹窗内简易分页（避免大数据量一次性渲染卡顿）
const orgPagination = reactive({ current: 1, pageSize: 10 })
const meterPagination = reactive({ current: 1, pageSize: 10 })
const orgPaged = computed(() => {
  const start = (orgPagination.current - 1) * orgPagination.pageSize
  return orgTableData.value.slice(start, start + orgPagination.pageSize)
})
const meterPaged = computed(() => {
  const start = (meterPagination.current - 1) * meterPagination.pageSize
  return meterTableData.value.slice(start, start + meterPagination.pageSize)
})

watch(orgKeyword, () => { orgPagination.current = 1 })
watch(meterKeyword, () => { meterPagination.current = 1 })

const openScope = (record: PowerPlan) => {
  scopeRecord.value = record
  orgKeyword.value = ''
  meterKeyword.value = ''
  orgPagination.current = 1
  meterPagination.current = 1
  scopeVisible.value = true
}

fetchData()
</script>

<template>
  <div class="page-container">
    <!-- 统计卡片 -->
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
          <a-select v-model:value="triggerFilter" placeholder="触发方式" allow-clear style="width: 140px" :options="triggerOptions" />
          <a-select v-model:value="statusFilter" placeholder="状态" allow-clear style="width: 120px" :options="statusOptions" />
          <a-button type="primary" @click="fetchData">
            <SearchOutlined /> 查询
          </a-button>
          <a-button @click="handleReset">
            <ReloadOutlined /> 重置
          </a-button>
        </a-space>
        <a-button type="primary" @click="openCreate">
          <PlusOutlined /> 新建计划
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1270 }"
      >
        <template #headerCell="{ column }">
          <template v-if="column.key === 'status'">
            <span>状态</span>
            <a-tooltip placement="top" color="#fff" overlay-class-name="status-tooltip">
              <template #title>
                <div class="status-desc-list">
                  <div v-for="s in statusDescriptions" :key="s.key" class="status-desc-item">
                    <a-tag :color="statusMap[s.key].color">{{ statusMap[s.key].text }}</a-tag>
                    <span>{{ s.desc }}</span>
                  </div>
                </div>
              </template>
              <QuestionCircleOutlined class="status-help-icon" />
            </a-tooltip>
          </template>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'trigger'">
            <a-tag :color="triggerMap[record.trigger as PlanTrigger].color">{{ triggerMap[record.trigger as PlanTrigger].text }}</a-tag>
          </template>
          <template v-if="column.key === 'condition'">
            <span>{{ triggerCondition(record) }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-tag :color="actionMap[record.action as PlanAction].color">{{ actionMap[record.action as PlanAction].text }}</a-tag>
          </template>
          <template v-if="column.key === 'scope'">
            <a class="scope-link" @click="openScope(record)">{{ record.targetOrgs.length }} 个组织 · {{ record.targetMeters.length ? record.targetMeters.length + ' 个电表' : '全部电表' }}</a>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusMap[planStatus(record)].color">
              {{ statusMap[planStatus(record)].text }}
            </a-tag>
          </template>
          <template v-if="column.key === 'remark'">
            <a-tooltip :title="record.remark || ''" placement="topLeft">
              <span class="remark-text">{{ record.remark || '—' }}</span>
            </a-tooltip>
          </template>
          <template v-if="column.key === 'op'">
            <a-space :size="0" class="op-space">
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <template v-if="record.lifecycle !== 'EXPIRED'">
                <a-button v-if="record.enabled" type="link" size="small" style="color: #faad14" @click="toggleStatus(record)">停用</a-button>
                <a-button v-else type="link" size="small" style="color: #52c41a" @click="toggleStatus(record)">启用</a-button>
              </template>
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无用电计划" />
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

    <!-- 创建/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="editingKey ? '编辑计划' : '新建计划'" ok-text="保存" cancel-text="取消" @ok="handleSubmit" width="560px" :styles="{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' } }">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="计划名称" required>
          <a-input v-model:value="form.name" placeholder="请输入计划名称" />
        </a-form-item>
        <a-form-item label="触发方式" required>
          <a-radio-group v-model:value="form.trigger">
            <a-radio value="TIME">定时触发</a-radio>
            <a-radio value="EVENT">事件触发</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="动作" required>
          <a-radio-group v-model:value="form.action">
            <a-radio value="POWER_OFF">断电</a-radio>
            <a-radio value="POWER_ON">通电</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 定时触发 -->
        <template v-if="form.trigger === 'TIME'">
          <a-form-item label="计划周期" required>
            <a-select v-model:value="form.type" :options="typeOptions" />
          </a-form-item>
          <a-form-item label="执行时间" required>
            <template v-if="form.type === 'DAILY'">
              <a-time-picker v-model:value="form.dailyTime" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 180px" />
              <div class="form-hint">每天将在所选时间自动执行</div>
            </template>
            <template v-else-if="form.type === 'WEEKLY'">
              <a-checkbox-group v-model:value="form.weekDays" :options="weekOpts" />
              <a-time-picker v-model:value="form.weeklyTime" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 180px; margin-top: 12px" />
              <div class="form-hint">每周将在所勾选日期的所选时间自动执行</div>
            </template>
            <template v-else>
              <a-space>
                <a-date-picker v-model:value="form.onceDate" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 160px" />
                <a-time-picker v-model:value="form.onceTime" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 140px" />
              </a-space>
            </template>
          </a-form-item>
        </template>

        <!-- 事件触发 -->
        <template v-else>
          <a-form-item label="告警类型" required>
            <a-select v-model:value="form.eventType" :options="eventTypeOptions" />
          </a-form-item>
        </template>
        <a-form-item label="作用组织" required>
          <a-select
            v-model:value="form.targetOrgs"
            mode="multiple"
            placeholder="批量选择组织/门店"
            :options="storeOptions.map(o => ({ value: o, label: o }))"
            :max-tag-count="2"
            @change="onTargetOrgsChange"
          />
        </a-form-item>
        <a-form-item label="作用电表">
          <a-select
            v-model:value="form.targetMeters"
            mode="multiple"
            placeholder="选择电表（留空则作用于所选组织全部电表）"
            :options="targetMeterOptions"
            :disabled="form.targetOrgs.length === 0"
            :max-tag-count="2"
          />
          <div class="form-hint">留空表示作用于所选组织的全部电表</div>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" placeholder="选填" :rows="2" style="margin-bottom: 8px" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 作用对象详情弹窗 -->
    <a-modal v-model:open="scopeVisible" :title="`作用对象详情 · ${scopeRecord?.name || ''}`" :footer="null" width="720px">
      <div class="scope-summary">
        <a-tag color="blue">组织 {{ scopeRecord?.targetOrgs.length ?? 0 }} 个</a-tag>
        <a-tag :color="scopeRecord?.targetMeters.length ? 'green' : 'default'">
          电表 {{ scopeRecord?.targetMeters.length ? scopeRecord.targetMeters.length + ' 个' : '全部' }}
        </a-tag>
      </div>

      <div class="scope-block">
        <div class="scope-block-head">
          <span class="scope-block-title">作用组织</span>
          <a-input v-model:value="orgKeyword" placeholder="搜索组织路径" allow-clear size="small" style="width: 200px" />
        </div>
        <a-table :columns="orgColumns" :data-source="orgPaged" :pagination="false" size="small" row-key="index">
          <template #emptyText>
            <a-empty description="无匹配组织" :image-style="{ height: '40px' }" />
          </template>
        </a-table>
        <div class="scope-pagination">
          <a-pagination v-model:current="orgPagination.current" :page-size="orgPagination.pageSize" :total="filteredOrgs.length" size="small" :show-total="(t: number) => `共 ${t} 条`" />
        </div>
      </div>

      <div class="scope-block">
        <div class="scope-block-head">
          <span class="scope-block-title">作用电表</span>
          <a-input v-model:value="meterKeyword" placeholder="搜索电表" allow-clear size="small" style="width: 200px" />
        </div>
        <a-table :columns="meterColumns" :data-source="meterPaged" :pagination="false" size="small" row-key="index">
          <template #emptyText>
            <a-empty description="作用于所选组织的全部电表" :image-style="{ height: '40px' }" />
          </template>
        </a-table>
        <div class="scope-pagination">
          <a-pagination v-model:current="meterPagination.current" :page-size="meterPagination.pageSize" :total="filteredMeters.length" size="small" :show-total="(t: number) => `共 ${t} 条`" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.page-container {
  padding: 8px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 1200px) {
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
.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.scope-link {
  color: #1677ff;
  cursor: pointer;
  white-space: nowrap;
}
.scope-link:hover {
  color: #4096ff;
}
.scope-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.scope-block {
  margin-bottom: 16px;
}
.scope-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.scope-block-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
:deep(.ant-table-thead > tr > th),
:deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
}
:deep(.ant-table) {
  table-layout: fixed;
}
:deep(.ant-table-content) > table {
  width: 100% !important;
  min-width: 1270px !important;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.status-help-icon {
  color: #999;
  cursor: pointer;
  margin-left: 4px;
  font-size: 13px;
}
.scope-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.remark-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.op-space {
  white-space: nowrap;
}
</style>

<!-- 状态说明 Tooltip（非 scoped，overlay 被 teleport 到 body） -->
<style>
.status-tooltip .ant-tooltip-inner {
  background: #fff !important;
  color: #333 !important;
  padding: 12px 14px;
}
.status-tooltip .ant-tooltip-arrow::before {
  background: #fff !important;
}
.status-desc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-desc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}
.status-desc-item .ant-tag {
  margin: 0;
  flex-shrink: 0;
}
</style>
