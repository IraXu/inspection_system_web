<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { message, Modal } from 'antdv-next'
import { PlusOutlined, SearchOutlined, ExclamationCircleOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined } from '@antdv-next/icons'
import type { AIInspectionTask } from '@/types'

// ========== 模拟数据 ==========
const mockOrgTree = [
  { key: 'org-1', title: '鹤梦信息大中华区', children: [
    { key: 'org-1-1', title: '华北大区', children: [{ key: 'org-1-1-1', title: '北京分店' }, { key: 'org-1-1-2', title: '天津分店' }] },
    { key: 'org-1-2', title: '华南大区', children: [{ key: 'org-1-2-1', title: '广州分店(5)' }, { key: 'org-1-2-2', title: '深圳分店' }] },
    { key: 'org-1-3', title: '华东大区', children: [{ key: 'org-1-3-1', title: '上海分店' }, { key: 'org-1-3-2', title: '杭州分店' }] },
  ]},
]

const mockAllDevices = [
  { id: 'd1', name: 'xx相机', org: '广州分店(5)', status: 'online' }, { id: 'd2', name: 'xx相机', org: '广州分店(5)', status: 'offline' },
  { id: 'd3', name: 'xx相机', org: '广州分店(5)', status: 'sleep' }, { id: 'd4', name: 'xx相机', org: '广州分店(5)', status: 'online' },
  { id: 'd5', name: 'xx相机', org: '广州分店(5)', status: 'online' }, { id: 'd6', name: 'xx相机', org: '深圳分店', status: 'online' },
  { id: 'd7', name: 'xx相机', org: '深圳分店', status: 'offline' }, { id: 'd8', name: 'xx相机', org: '北京分店', status: 'sleep' },
  { id: 'd9', name: 'xx相机', org: '上海分店', status: 'online' }, { id: 'd10', name: 'xx相机', org: '杭州分店', status: 'online' },
]

const mockAlgorithms = [
  { id: 'alg1', name: '地面整洁度识别' }, { id: 'alg2', name: '物品摆放规范检测' },
  { id: 'alg3', name: '安全通道占用检测' }, { id: 'alg4', name: '灭火器在位检测' },
  { id: 'alg5', name: '灯光设备状态检测' }, { id: 'alg6', name: '卫生死角识别' },
]

const mockPersonnel = ['张三', '李四', '王五', '赵六', '孙七']

const mockTasks: AIInspectionTask[] = [
  { id: '1', name: '门店A日常AI巡检', taskNo: 'AI20260505-001', validFrom: '2026-05-01', validUntil: '2026-12-31', snapshotStart: '08:00', snapshotEnd: '20:00', frequency: 30, cycleDays: [1,2,3,4,5], deviceIds: ['d1','d2','d3'], deviceNames: ['xx相机','xx相机','xx相机'], algorithmIds: ['alg1','alg2','alg3'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测'], autoCreateTicket: true, assigneeId: 'p1', assigneeName: '张三', status: 'active', creator: '管理员', createdAt: '2026-05-05 09:00:00', updatedAt: '2026-05-25 10:00:00' },
  { id: '2', name: '门店B大厅AI巡检', taskNo: 'AI20260516-002', validFrom: '2026-05-15', validUntil: '2026-11-30', snapshotStart: '06:00', snapshotEnd: '22:00', frequency: 15, cycleDays: [1,2,3,4,5,6,7], deviceIds: ['d5','d6'], deviceNames: ['xx相机','xx相机'], algorithmIds: ['alg4','alg5'], algorithmNames: ['灭火器在位检测','灯光设备状态检测'], autoCreateTicket: false, assigneeId: null, assigneeName: null, status: 'active', creator: '管理员', createdAt: '2026-05-16 14:00:00', updatedAt: '2026-05-26 08:00:00' },
  { id: '3', name: '门店A后场AI巡检', taskNo: 'AI20260520-003', validFrom: '2026-06-01', validUntil: '2026-09-30', snapshotStart: '09:00', snapshotEnd: '18:00', frequency: 10, cycleDays: [1,3,5], deviceIds: ['d4'], deviceNames: ['xx相机'], algorithmIds: ['alg6'], algorithmNames: ['卫生死角识别'], autoCreateTicket: true, assigneeId: 'p2', assigneeName: '李四', status: 'paused', creator: '管理员', createdAt: '2026-05-20 15:00:00', updatedAt: '2026-05-27 09:00:00' },
  { id: '4', name: '门店C展示区巡检', taskNo: 'AI20260301-004', validFrom: '2026-03-01', validUntil: '2026-05-28', snapshotStart: '09:00', snapshotEnd: '18:00', frequency: 10, cycleDays: [1,2,3,4,5], deviceIds: ['d8','d9'], deviceNames: ['xx相机','xx相机'], algorithmIds: ['alg1','alg2'], algorithmNames: ['地面整洁度识别','物品摆放规范检测'], autoCreateTicket: false, assigneeId: null, assigneeName: null, status: 'completed', creator: '管理员', createdAt: '2026-03-01 08:00:00', updatedAt: '2026-05-28 18:00:00' },
  { id: '5', name: '门店D卫生专项巡检', taskNo: 'AI20260510-005', validFrom: '2026-05-01', validUntil: '2026-10-31', snapshotStart: '07:00', snapshotEnd: '21:00', frequency: 20, cycleDays: [2,4,6], deviceIds: ['d10'], deviceNames: ['xx相机'], algorithmIds: ['alg1','alg6'], algorithmNames: ['地面整洁度识别','卫生死角识别'], autoCreateTicket: true, assigneeId: 'p3', assigneeName: '王五', status: 'active', creator: '管理员', createdAt: '2026-05-10 10:00:00', updatedAt: '2026-05-25 16:00:00' },
]

// ========== 列表状态 ==========
const tasks = ref([...mockTasks])
const searchName = ref(''); const searchAlgorithm = ref<string[]>([]); const searchStatus = ref<string | undefined>(undefined)
const selectedRowKeys = ref<string[]>([])

const statusMap: Record<string, { label: string; color: string }> = { active: { label: '执行中', color: 'green' }, paused: { label: '已暂停', color: 'orange' }, completed: { label: '已完成', color: 'default' } }
const algoOpts = mockAlgorithms.map(a => ({ label: a.name, value: a.id }))

const wl = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
const formatCycleCompact = (t: AIInspectionTask) => {
  const d = [...t.cycleDays].sort((a, b) => a - b)
  if (d.length === 7) return `每天 ${t.snapshotStart}~${t.snapshotEnd} 每${t.frequency}分钟`
  const r: string[] = []; let s = d[0], e = d[0]
  for (let i = 1; i <= d.length; i++) { if (i < d.length && d[i] === e + 1) { e = d[i] } else { r.push(s === e ? wl[s] : `${wl[s]}至${wl[e]}`); if (i < d.length) { s = d[i]; e = d[i] } } }
  return `${r.join('、')} ${t.snapshotStart}~${t.snapshotEnd} 每${t.frequency}分钟`
}

const filteredTasks = ref([...mockTasks])
const doSearch = () => { filteredTasks.value = mockTasks.filter(t => { if (searchName.value && !t.name.includes(searchName.value)) return false; if (searchStatus.value && t.status !== searchStatus.value) return false; if (searchAlgorithm.value.length && !searchAlgorithm.value.some(a => t.algorithmIds.includes(a))) return false; return true }) }
const doReset = () => { searchName.value = ''; searchAlgorithm.value = []; searchStatus.value = undefined; filteredTasks.value = [...mockTasks] }

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
  { title: '设备数', key: 'deviceCount', width: 70, align: 'center' as const },
  { title: '任务有效期', key: 'validPeriod', width: 200, align: 'center' as const },
  { title: '抓拍周期', key: 'cycle', width: 260, ellipsis: true },
  { title: 'AI算法', key: 'algorithms', width: 200, align: 'center' as const },
  { title: '自动提单', key: 'autoTicket', width: 80, align: 'center' as const },
  { title: '状态', key: 'status', width: 90, align: 'center' as const },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, align: 'center' as const },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160, align: 'center' as const },
  { title: '操作', key: 'action', width: 180, align: 'center' as const },
]

// ========== 抽屉表单 ==========
const drawerVisible = ref(false); const drawerTitle = ref('新建AI巡检任务'); const editingId = ref<string | null>(null); const saving = ref(false)
const formName = ref(''); const formValidRange = ref<any>(null)
const formSnapshotStart = ref(''); const formSnapshotEnd = ref('')
const formFrequency = ref<number | null>(null)
const formCycleDays = ref<number[]>([])
const formDeviceIds = ref<string[]>([]); const deviceSelectedRowKeys = ref<string[]>([])
const formAlgorithmIds = ref<string[]>([])
const formAutoTicket = ref(false); const formAssignee = ref<string[]>([])

// 设备选择
const deviceTreeSearch = ref(''); const deviceTreeSelected = ref('org-1')
const deviceTableData = ref<typeof mockAllDevices>([])
const devicePage = ref(1); const devicePageSize = ref(10)

const weekDays = [{ label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 }, { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 }, { label: '日', value: 7 }]
const toggleWeekDay = (d: number) => { const i = formCycleDays.value.indexOf(d); if (i > -1) formCycleDays.value.splice(i, 1); else formCycleDays.value.push(d) }

const findOrgNode = (ns: any[], k: string): any => { for (const n of ns) { if (n.key === k) return n; if (n.children) { const f = findOrgNode(n.children, k); if (f) return f } } return null }
const onDeviceTreeSelect = (ks: string[]) => { if (ks.length) { deviceTreeSelected.value = ks[0]; const o = findOrgNode(mockOrgTree, ks[0]); deviceTableData.value = mockAllDevices.filter(d => d.org === o?.title || ks[0] === 'org-1'); devicePage.value = 1 } }
const syncDeviceSelection = () => { formDeviceIds.value = [...deviceSelectedRowKeys.value] }

const deviceStatusMap: Record<string, { label: string; color: string }> = { online: { label: '在线', color: '#67C23A' }, offline: { label: '离线', color: '#F56C6C' }, sleep: { label: '休眠中', color: '#E6A23C' } }
const deviceTableColumns = [{ title: '设备名称', dataIndex: 'name', key: 'name', align: 'center' as const }, { title: '设备状态', key: 'status', width: 90, align: 'center' as const }]
const paginatedDevices = computed(() => { const s = (devicePage.value - 1) * devicePageSize.value; return deviceTableData.value.slice(s, s + devicePageSize.value) })

const resetForm = () => { formName.value = ''; formValidRange.value = null; formSnapshotStart.value = ''; formSnapshotEnd.value = ''; formFrequency.value = null; formCycleDays.value = []; formDeviceIds.value = []; deviceSelectedRowKeys.value = []; formAlgorithmIds.value = []; formAutoTicket.value = false; formAssignee.value = []; deviceTableData.value = mockAllDevices; deviceTreeSelected.value = 'org-1'; deviceTreeSearch.value = ''; devicePage.value = 1 }
const openAdd = () => { drawerTitle.value = '新建AI巡检任务'; editingId.value = null; resetForm(); drawerVisible.value = true }
const openEdit = (task: AIInspectionTask) => { if (task.status === 'completed') return; drawerTitle.value = '编辑AI巡检任务'; editingId.value = task.id; formName.value = task.name; formValidRange.value = null; formSnapshotStart.value = task.snapshotStart; formSnapshotEnd.value = task.snapshotEnd; formFrequency.value = task.frequency; formCycleDays.value = [...task.cycleDays]; formDeviceIds.value = [...task.deviceIds]; deviceSelectedRowKeys.value = [...task.deviceIds]; formAlgorithmIds.value = [...task.algorithmIds]; formAutoTicket.value = task.autoCreateTicket; formAssignee.value = task.assigneeId ? [task.assigneeId] : []; deviceTableData.value = mockAllDevices; devicePage.value = 1; drawerVisible.value = true }

const handleSave = () => {
  if (!formName.value.trim()) { message.warning('请输入任务名称'); return }
  if (!formValidRange.value?.[0]) { message.warning('请选择任务有效期'); return }
  if (!formSnapshotStart.value || !formSnapshotEnd.value) { message.warning('请选择抓拍时段'); return }
  if (formSnapshotStart.value >= formSnapshotEnd.value) { message.warning('开始时间不能晚于结束时间'); return }
  if (!formFrequency.value) { message.warning('请设置抓拍频率'); return }
  if (!formCycleDays.value.length) { message.warning('请至少选择一个执行日'); return }
  if (!formDeviceIds.value.length) { message.warning('请至少选择一台设备'); return }
  if (!formAlgorithmIds.value.length) { message.warning('请至少选择一个AI算法'); return }
  if (formAutoTicket.value && !formAssignee.value.length) { message.warning('开启自动提单时请选择问题指派人'); return }
  saving.value = true
  setTimeout(() => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const vf = formValidRange.value[0]?.format?.('YYYY-MM-DD') || String(formValidRange.value[0] || '')
    const vu = formValidRange.value[1]?.format?.('YYYY-MM-DD') || String(formValidRange.value[1] || '')
    const dns = formDeviceIds.value.map(id => mockAllDevices.find(d => d.id === id)?.name || id)
    const algoNames = formAlgorithmIds.value.map(id => mockAlgorithms.find(x => x.id === id)?.name || id)
    const an = formAssignee.value.length ? mockPersonnel.find((_, i) => `p${i + 1}` === formAssignee.value[0]) || formAssignee.value[0] : null
    const data: AIInspectionTask = {
      id: editingId.value || String(Date.now()),
      name: formName.value.trim(),
      taskNo: editingId.value ? (tasks.value.find(t => t.id === editingId.value)?.taskNo || '') : `AI${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(tasks.value.length + 1).padStart(3, '0')}`,
      validFrom: vf, validUntil: vu,
      snapshotStart: formSnapshotStart.value, snapshotEnd: formSnapshotEnd.value,
      frequency: formFrequency.value || 30, cycleDays: [...formCycleDays.value],
      deviceIds: [...formDeviceIds.value], deviceNames: dns,
      algorithmIds: [...formAlgorithmIds.value], algorithmNames: algoNames,
      autoCreateTicket: formAutoTicket.value,
      assigneeId: formAssignee.value.length ? formAssignee.value[0] : null,
      assigneeName: an,
      status: 'active', creator: '当前用户',
      createdAt: editingId.value ? undefined! : now, updatedAt: now,
    }
    if (editingId.value) {
      const idx = tasks.value.findIndex(t => t.id === editingId.value)
      if (idx > -1) { data.createdAt = tasks.value[idx].createdAt; data.status = tasks.value[idx].status; tasks.value[idx] = data }
      message.success('AI巡检任务更新成功')
    } else {
      tasks.value.unshift(data)
      message.success('AI巡检任务创建成功')
    }
    filteredTasks.value = [...tasks.value]; drawerVisible.value = false; saving.value = false
  }, 500)
}

const toggleStatus = (task: AIInspectionTask) => { if (task.status === 'completed') return; task.status = (task.status === 'active' ? 'paused' : 'active') as AIInspectionTask['status']; task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19); message.success(task.status === 'active' ? '任务已启用' : '任务已暂停') }
const handleDelete = (task: AIInspectionTask) => { if (task.status !== 'completed') return; Modal.confirm({ title: '确定删除该AI巡检任务吗？', icon: () => h(ExclamationCircleOutlined), content: '删除后不可恢复。', okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { tasks.value = tasks.value.filter(t => t.id !== task.id); filteredTasks.value = [...tasks.value]; message.success('AI巡检任务已删除') } }) }
const batchDelete = () => { if (!selectedRowKeys.value.length) { message.warning('请先选择要删除的任务'); return }; const cids = selectedRowKeys.value.filter(id => tasks.value.find(t => t.id === id)?.status === 'completed'); const nc = selectedRowKeys.value.filter(id => !cids.includes(id)); if (nc.length > 0) { message.error(`所选任务中有 ${nc.length} 个非"已完成"状态，仅已完成的任务支持删除，请重新选择`); return }; Modal.confirm({ title: '确定批量删除所选AI巡检任务吗？', icon: () => h(ExclamationCircleOutlined), content: `将删除 ${cids.length} 个已完成的任务，删除后不可恢复。`, okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { tasks.value = tasks.value.filter(t => !cids.includes(t.id)); filteredTasks.value = [...tasks.value]; selectedRowKeys.value = []; message.success(`已成功删除 ${cids.length} 个任务`) } }) }
const rowSelection = computed(() => ({ selectedRowKeys: selectedRowKeys.value, onChange: (keys: string[]) => { selectedRowKeys.value = keys } }))
</script>

<template>
  <div class="ai-task-page">
    <div class="page-toolbar">
      <div class="toolbar-row">
        <a-space wrap>
          <a-input v-model:value="searchName" placeholder="任务名称" style="width:200px" allow-clear @pressEnter="doSearch"><template #prefix><SearchOutlined /></template></a-input>
          <a-select v-model:value="searchAlgorithm" mode="multiple" placeholder="AI算法" style="width:200px" allow-clear :options="algoOpts" :max-tag-count="2" />
          <a-select v-model:value="searchStatus" placeholder="任务状态" style="width:200px" allow-clear :options="[{ label:'执行中', value:'active' },{ label:'已暂停', value:'paused' },{ label:'已完成', value:'completed' }]" />
          <a-button type="primary" @click="doSearch">查询</a-button>
          <a-button @click="doReset">重置</a-button>
        </a-space>
      </div>
      <div class="toolbar-row">
        <a-space>
          <a-button type="primary" @click="openAdd"><PlusOutlined /> 新建AI巡检任务</a-button>
          <a-button danger @click="batchDelete" :disabled="!selectedRowKeys.length"><DeleteOutlined /> 批量删除</a-button>
          <span v-if="selectedRowKeys.length" class="selected-count">已选 {{ selectedRowKeys.length }} 项</span>
        </a-space>
      </div>
    </div>

    <a-table :columns="columns" :data-source="filteredTasks" :row-selection="rowSelection" row-key="id" :scroll="{ x: 1560 }" size="middle" :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10','20','50','100'] }">
      <template #headerCell="{ column }">
        <template v-if="column.key === 'status'">
          状态
          <span class="info-tip">
            ⓘ
            <span class="info-tip-pop">
              <span>执行中：任务正在执行中，按设定周期自动抓拍+AI分析</span>
              <span>已暂停：任务已暂停，不会执行抓拍和分析，可手动恢复</span>
              <span>已完成：任务已超有效期，不再执行，可删除</span>
            </span>
          </span>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'"><div class="task-name-cell"><span class="task-name-text">{{ record.name }}</span><span class="task-name-no">（{{ record.taskNo }}）</span></div></template>
        <template v-else-if="column.key === 'deviceCount'"><span class="col-center">{{ record.deviceIds?.length || 0 }}</span></template>
        <template v-else-if="column.key === 'validPeriod'"><span class="col-center">{{ record.validFrom }} ~ {{ record.validUntil }}</span></template>
        <template v-else-if="column.key === 'cycle'"><span>{{ formatCycleCompact(record) }}</span></template>
        <template v-else-if="column.key === 'algorithms'"><div class="algo-tags"><a-tag v-for="(n,i) in record.algorithmNames" :key="i" color="blue">{{ n }}</a-tag></div></template>
        <template v-else-if="column.key === 'autoTicket'"><a-tag :color="record.autoCreateTicket?'green':'default'">{{ record.autoCreateTicket?'是':'否' }}</a-tag></template>
        <template v-else-if="column.key === 'status'"><a-tag :color="statusMap[record.status]?.color">{{ statusMap[record.status]?.label }}</a-tag></template>
        <template v-else-if="column.key === 'action'">
          <a-space :size="4">
            <a-button v-if="record.status !== 'completed'" type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button v-if="record.status !== 'completed'" type="link" size="small" :style="{ color: record.status === 'active' ? '#fa8c16' : '#52c41a' }" @click="toggleStatus(record)">{{ record.status === 'active' ? '暂停' : '启用' }}</a-button>
            <a-button v-if="record.status === 'completed'" type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'creator' || column.dataIndex === 'createdAt' || column.dataIndex === 'updatedAt'"><span class="col-center">{{ record[column.dataIndex] || '-' }}</span></template>
        <template v-else-if="column.dataIndex"><span>{{ record[column.dataIndex] || '-' }}</span></template>
      </template>
    </a-table>

    <!-- 新建/编辑抽屉 -->
    <a-drawer v-model:open="drawerVisible" :title="drawerTitle" width="720px" :closable="true" :mask-closable="false" placement="right" :footer-style="{ textAlign: 'right' }">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" :colon="false" class="task-form">
        <!-- 基础信息 -->
        <a-form-item label="任务名称" required><a-input v-model:value="formName" placeholder="请输入任务名称" :maxlength="50" style="width:100%" show-count /></a-form-item>
        <a-form-item label="任务有效期" required><a-range-picker v-model:value="formValidRange" style="width:100%" :placeholder="['开始日期', '结束日期']"><template #suffixIcon><CalendarOutlined /></template></a-range-picker></a-form-item>

        <!-- 抓拍配置 -->
        <a-divider orientation="center" style="font-size:13px;font-weight:500;color:#1677ff;margin:8px 0 16px">抓拍配置</a-divider>
        <a-form-item label="抓拍时段" required>
          <div class="time-range-wrap"><a-time-picker v-model:value="formSnapshotStart" format="HH:mm" placeholder="开始时间" style="flex:1" :input-read-only="true"><template #suffixIcon><ClockCircleOutlined /></template></a-time-picker><span class="time-sep">~</span><a-time-picker v-model:value="formSnapshotEnd" format="HH:mm" placeholder="结束时间" style="flex:1" :input-read-only="true"><template #suffixIcon><ClockCircleOutlined /></template></a-time-picker></div>
        </a-form-item>
        <a-form-item label="抓拍频率" required>
          <div class="freq-inline"><span class="freq-prefix">每</span><a-input-number v-model:value="formFrequency" :min="5" :max="30" :step="5" placeholder="范围5~30" style="width:120px" /><span class="freq-suffix">分钟抓拍一次</span></div>
        </a-form-item>
        <a-form-item label="执行周期" required>
          <div class="weekday-selector"><button v-for="d in weekDays" :key="d.value" type="button" class="wd-btn" :class="{ active: formCycleDays.includes(d.value) }" @click="toggleWeekDay(d.value)">{{ d.label }}</button></div>
        </a-form-item>
        <a-form-item label="选择设备" required>
          <div class="device-picker">
            <div class="dp-top-bar">已选 <strong style="color:#409EFF">{{ formDeviceIds.length }}</strong> 台设备</div>
            <div class="dp-body">
              <div class="dp-left">
                <div class="dp-tree-search"><a-input v-model:value="deviceTreeSearch" placeholder="搜索设备" size="small" allow-clear><template #prefix><SearchOutlined /></template></a-input></div>
                <a-tree :tree-data="mockOrgTree" :field-names="{ children:'children', title:'title', key:'key' }" default-expand-all block-node default-selected-keys="['org-1']" :selected-keys="[deviceTreeSelected || 'org-1']" @select="onDeviceTreeSelect" />
              </div>
              <div class="dp-right">
                <a-table :columns="deviceTableColumns" :data-source="paginatedDevices" :row-selection="{ selectedRowKeys: deviceSelectedRowKeys, onChange: (ks: string[]) => { deviceSelectedRowKeys = ks; syncDeviceSelection() } }" row-key="id" :pagination="false" size="small" :scroll="{ y: 220 }">
                  <template #bodyCell="{ column, record }"><template v-if="column.key === 'status'"><span :style="{ color: deviceStatusMap[record.status]?.color, fontWeight: 500 }">{{ deviceStatusMap[record.status]?.label }}</span></template></template>
                </a-table>
                <div class="dp-pagination"><span>共 {{ deviceTableData.length }} 台</span><a-pagination v-model:current="devicePage" :total="deviceTableData.length" :page-size="devicePageSize" size="small" show-size-changer :page-size-options="['10','20','50']" style="margin-left:auto" /></div>
              </div>
            </div>
          </div>
        </a-form-item>

        <!-- AI分析配置 -->
        <a-divider orientation="center" style="font-size:13px;font-weight:500;color:#1677ff;margin:8px 0 16px">AI分析配置</a-divider>
        <a-form-item label="AI算法" required>
          <a-select v-model:value="formAlgorithmIds" mode="multiple" placeholder="请选择AI分析算法" style="width:100%" :options="algoOpts" :not-found-content="'暂无可用的AI算法，请前往 设备管理→智能服务商城 购买并绑定算法'" />
        </a-form-item>
        <a-form-item label="自动提单"><a-switch v-model:checked="formAutoTicket" /> <span style="margin-left:8px;color:#999;font-size:12px">{{ formAutoTicket ? '异常时自动生成整改单' : '异常时需人工处理' }}</span></a-form-item>
        <a-form-item v-if="formAutoTicket" label="问题指派" required><a-select v-model:value="formAssignee" mode="multiple" placeholder="选择问题指派人" style="width:100%" :options="mockPersonnel.map((p,i) => ({ label: p, value: `p${i+1}` }))" /></a-form-item>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">确定</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
.ai-task-page { padding: 0; }
.page-toolbar { margin-bottom: 16px; }
.toolbar-row { margin-bottom: 12px; }
.toolbar-row:last-child { margin-bottom: 0; }
.selected-count { color: #1677ff; font-size: 13px; margin-left: 8px; }
.col-center { display: flex; justify-content: center; }
.task-name-cell { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.task-name-text { font-size: 13px; color: #333; line-height: 1.4; }
.task-name-no { font-size: 11px; color: #999; line-height: 1.3; }
.algo-tags { display: flex; flex-wrap: wrap; gap: 4px; }

/* 状态提示 */
.info-tip { position: relative; display: inline-flex; cursor: help; color: #bbb; font-size: 11px; margin-left: 2px; font-style: normal; }
.info-tip-pop { display: none; position: absolute; top: 20px; left: 0; background: #fff; color: #666; font-size: 10px; white-space: nowrap; padding: 8px 12px; border-radius: 6px; box-shadow: 0 2px 12px rgba(0,0,0,0.12); z-index: 100; line-height: 1.8; flex-direction: column; gap: 2px; }
.info-tip:hover .info-tip-pop { display: flex; }

/* 表单 */
.task-form :deep(.ant-form-item) { margin-bottom: 16px; }
.task-form :deep(.ant-form-item-label > label) { font-size: 13px; color: #333; }
.task-form :deep(.ant-form-item-label > label::before) { color: #ff4d4f !important; }

/* 时间范围 */
.time-range-wrap { display: flex; align-items: center; gap: 8px; width: 100%; }
.time-sep { color: #999; flex-shrink: 0; }

/* 频率 */
.freq-inline { display: flex; align-items: center; gap: 8px; }
.freq-prefix, .freq-suffix { font-size: 13px; color: #333; }

/* 周期 */
.weekday-selector { display: flex; gap: 0; border: 1px solid #dcdfe6; border-radius: 6px; overflow: hidden; width: fit-content; }
.wd-btn { width: 40px; height: 34px; border: none; border-right: 1px solid #dcdfe6; background: #fff; color: #606266; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; outline: none; padding: 0; margin: 0; }
.wd-btn:last-child { border-right: none; }
.wd-btn:hover { background: #ecf5ff; color: #409EFF; }
.wd-btn.active { background: #409EFF; color: #fff; border-color: #409EFF; }
.wd-btn.active + .wd-btn { border-left-color: #409EFF; }

/* 设备选择 */
.device-picker { border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
.dp-top-bar { padding: 6px 12px; font-size: 12px; color: #666; border-bottom: 1px solid #e8e8e8; background: #fafbfc; }
.dp-body { display: flex; height: 320px; }
.dp-left { width: 200px; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.dp-tree-search { padding: 8px; border-bottom: 1px solid #f0f0f0; }
.dp-left :deep(.ant-tree) { flex: 1; overflow: auto; padding: 4px 8px; font-size: 13px; }
.dp-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.dp-right :deep(.ant-table-wrapper) { flex: 1; overflow: auto; }
.dp-pagination { display: flex; align-items: center; padding: 6px 12px; font-size: 12px; color: #999; border-top: 1px solid #f0f0f0; }
</style>

