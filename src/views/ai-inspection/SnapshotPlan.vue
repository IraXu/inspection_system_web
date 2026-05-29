<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { message, Modal } from 'antdv-next'
import { PlusOutlined, SearchOutlined, ExclamationCircleOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined } from '@antdv-next/icons'
import type { SnapshotPlan } from '@/types'

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

const mockPlans: SnapshotPlan[] = [
  { id: '1', name: '门店A日常抓拍计划', validFrom: '2026-05-01', validUntil: '2026-12-31', snapshotPeriods: [{ start: '08:00', end: '20:00' }], frequency: 30, cycleDays: [1,2,3,4,5], deviceIds: ['d1','d2','d3'], deviceNames: ['xx相机','xx相机','xx相机'], status: 'active', creator: '管理员', createdAt: '2026-04-20 10:00:00', updatedAt: '2026-05-25 14:00:00' },
  { id: '2', name: '门店B大厅监控抓拍', validFrom: '2026-05-15', validUntil: '2026-11-30', snapshotPeriods: [{ start: '06:00', end: '22:00' }], frequency: 15, cycleDays: [1,2,3,4,5,6,7], deviceIds: ['d5','d6'], deviceNames: ['xx相机','xx相机'], status: 'active', creator: '管理员', createdAt: '2026-05-10 09:00:00', updatedAt: '2026-05-26 11:00:00' },
  { id: '3', name: '门店C展示区抓拍', validFrom: '2026-03-01', validUntil: '2026-05-28', snapshotPeriods: [{ start: '09:00', end: '18:00' }], frequency: 10, cycleDays: [1,2,3,4,5], deviceIds: ['d8','d9'], deviceNames: ['xx相机','xx相机'], status: 'expired', creator: '管理员', createdAt: '2026-02-28 08:00:00', updatedAt: '2026-05-28 18:00:00' },
  { id: '4', name: '门店A后场区域抓拍', validFrom: '2026-06-01', validUntil: '2026-12-31', snapshotPeriods: [{ start: '08:00', end: '18:00' }], frequency: 30, cycleDays: [1,3,5], deviceIds: ['d4'], deviceNames: ['xx相机'], status: 'paused', creator: '管理员', createdAt: '2026-05-20 15:00:00', updatedAt: '2026-05-27 09:00:00' },
  { id: '5', name: '门店D全景抓拍', validFrom: '2026-05-01', validUntil: '2026-10-31', snapshotPeriods: [{ start: '07:00', end: '21:00' }], frequency: 20, cycleDays: [2,4,6], deviceIds: ['d10'], deviceNames: ['xx相机'], status: 'active', creator: '管理员', createdAt: '2026-04-25 13:00:00', updatedAt: '2026-05-25 10:00:00' },
]

const plans = ref([...mockPlans])
const searchName = ref(''); const searchStatus = ref<string | undefined>(undefined); const selectedRowKeys = ref<string[]>([])

const statusMap: Record<string, { label: string; color: string }> = { active: { label: '启用中', color: 'green' }, paused: { label: '已暂停', color: 'orange' }, expired: { label: '已过期', color: 'default' } }

const wl = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
const formatCycleCompact = (p: SnapshotPlan) => {
  const d = [...p.cycleDays].sort((a, b) => a - b); if (d.length === 7) return `每天 每${p.frequency}分钟`
  const r: string[] = []; let s = d[0], e = d[0]
  for (let i = 1; i <= d.length; i++) { if (i < d.length && d[i] === e + 1) { e = d[i] } else { r.push(s === e ? wl[s] : `${wl[s]}至${wl[e]}`); if (i < d.length) { s = d[i]; e = d[i] } } }
  return `${r.join('、')} 每${p.frequency}分钟`
}

const filteredPlans = ref([...mockPlans])
const doSearch = () => { filteredPlans.value = mockPlans.filter(p => { if (searchName.value && !p.name.includes(searchName.value)) return false; if (searchStatus.value && p.status !== searchStatus.value) return false; return true }) }
const doReset = () => { searchName.value = ''; searchStatus.value = undefined; filteredPlans.value = [...mockPlans] }

const columns = [
  { title: '计划名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true }, { title: '设备数', key: 'deviceCount', width: 70, align: 'center' as const },
  { title: '计划有效期', key: 'validPeriod', width: 200, align: 'center' as const }, { title: '抓拍周期', key: 'cycle', width: 200, ellipsis: true },
  { title: '状态', key: 'status', width: 90, align: 'center' as const }, { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, align: 'center' as const }, { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160, align: 'center' as const },
  { title: '操作', key: 'action', width: 180, align: 'center' as const },
]

const modalVisible = ref(false); const modalTitle = ref('新建抓拍计划'); const editingId = ref<string | null>(null); const saving = ref(false)
const formName = ref(''); const formDateRange = ref<any>(null); const formTimeStart = ref(''); const formTimeEnd = ref('')
const formFrequency = ref<number | null>(null); const formCycleDays = ref<number[]>([])
const formDeviceIds = ref<string[]>([]); const deviceTreeSearch = ref(''); const deviceTreeSelected = ref('')
const deviceTableData = ref<typeof mockAllDevices>([]); const deviceSelectedRowKeys = ref<string[]>([]); const devicePage = ref(1); const devicePageSize = ref(10)

const weekDays = [{ label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 }, { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 }, { label: '日', value: 7 }]
const toggleWeekDay = (d: number) => { const i = formCycleDays.value.indexOf(d); if (i > -1) formCycleDays.value.splice(i, 1); else formCycleDays.value.push(d) }

const findOrgNode = (ns: any[], k: string): any => { for (const n of ns) { if (n.key === k) return n; if (n.children) { const f = findOrgNode(n.children, k); if (f) return f } } return null }
const onDeviceTreeSelect = (ks: string[]) => { if (ks.length) { deviceTreeSelected.value = ks[0]; const o = findOrgNode(mockOrgTree, ks[0]); deviceTableData.value = mockAllDevices.filter(d => d.org === o?.title || ks[0] === 'org-1'); devicePage.value = 1 } }
const syncDeviceSelection = () => { formDeviceIds.value = [...deviceSelectedRowKeys.value] }

const deviceStatusMap: Record<string, { label: string; color: string }> = { online: { label: '在线', color: '#67C23A' }, offline: { label: '离线', color: '#F56C6C' }, sleep: { label: '休眠中', color: '#E6A23C' } }
const deviceTableColumns = [{ title: '设备名称', dataIndex: 'name', key: 'name', align: 'center' as const }, { title: '设备状态', key: 'status', width: 90, align: 'center' as const }]
const paginatedDevices = computed(() => { const s = (devicePage.value - 1) * devicePageSize.value; return deviceTableData.value.slice(s, s + devicePageSize.value) })

const resetForm = () => { formName.value = ''; formDateRange.value = null; formTimeStart.value = ''; formTimeEnd.value = ''; formFrequency.value = null; formCycleDays.value = []; formDeviceIds.value = []; deviceSelectedRowKeys.value = []; deviceTableData.value = mockAllDevices; deviceTreeSelected.value = 'org-1'; deviceTreeSearch.value = ''; devicePage.value = 1 }
const openAdd = () => { modalTitle.value = '新建抓拍计划'; editingId.value = null; resetForm(); modalVisible.value = true }
const openEdit = (plan: SnapshotPlan) => { modalTitle.value = '编辑抓拍计划'; editingId.value = plan.id; formName.value = plan.name; formDateRange.value = null; formTimeStart.value = ''; formTimeEnd.value = ''; formFrequency.value = plan.frequency; formCycleDays.value = [...plan.cycleDays]; formDeviceIds.value = [...plan.deviceIds]; deviceSelectedRowKeys.value = [...plan.deviceIds]; deviceTableData.value = mockAllDevices; devicePage.value = 1; modalVisible.value = true }

const handleSave = () => {
  if (!formName.value.trim()) { message.warning('请输入计划名称'); return }
  if (!formDateRange.value?.[0]) { message.warning('请选择计划有效期'); return }
  if (!formTimeStart.value || !formTimeEnd.value) { message.warning('请选择抓拍时段'); return }
  if (formTimeStart.value >= formTimeEnd.value) { message.warning('开始时间不能晚于结束时间'); return }
  if (!formFrequency.value) { message.warning('请设置抓拍频率'); return }
  if (!formCycleDays.value.length) { message.warning('请至少选择一个执行日'); return }
  if (!formDeviceIds.value.length) { message.warning('请至少选择一台设备'); return }
  saving.value = true
  setTimeout(() => { const now = new Date().toISOString().replace('T', ' ').slice(0, 19); const vf = formDateRange.value[0]?.format?.('YYYY-MM-DD') || String(formDateRange.value[0] || ''); const vu = formDateRange.value[1]?.format?.('YYYY-MM-DD') || String(formDateRange.value[1] || ''); const dns = formDeviceIds.value.map(id => mockAllDevices.find(d => d.id === id)?.name || id); const data: SnapshotPlan = { id: editingId.value || String(Date.now()), name: formName.value.trim(), validFrom: vf, validUntil: vu, snapshotPeriods: [{ start: formTimeStart.value, end: formTimeEnd.value }], frequency: formFrequency.value || 30, cycleDays: [...formCycleDays.value], deviceIds: [...formDeviceIds.value], deviceNames: dns, status: 'active', creator: '当前用户', createdAt: editingId.value ? undefined! : now, updatedAt: now }; if (editingId.value) { const idx = plans.value.findIndex(p => p.id === editingId.value); if (idx > -1) { data.createdAt = plans.value[idx].createdAt; data.status = plans.value[idx].status === 'expired' ? (data.validUntil >= new Date().toISOString().slice(0, 10) ? 'active' : 'expired') : plans.value[idx].status; plans.value[idx] = data } message.success('抓拍计划更新成功') } else { plans.value.unshift(data); message.success('抓拍计划创建成功') } filteredPlans.value = [...plans.value]; modalVisible.value = false; saving.value = false }, 500)
}

const toggleStatus = (plan: SnapshotPlan) => { if (plan.status === 'expired') return; plan.status = (plan.status === 'active' ? 'paused' : 'active') as SnapshotPlan['status']; plan.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19); message.success(plan.status === 'active' ? '计划已启用' : '计划已暂停') }
const handleDelete = (plan: SnapshotPlan) => { if (plan.status !== 'expired') return; Modal.confirm({ title: '确定删除该抓拍计划吗？', icon: () => h(ExclamationCircleOutlined), content: '删除后不可恢复。', okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { plans.value = plans.value.filter(p => p.id !== plan.id); filteredPlans.value = [...plans.value]; message.success('抓拍计划已删除') } }) }
const batchDelete = () => { if (!selectedRowKeys.value.length) { message.warning('请先选择要删除的计划'); return }; const eids = selectedRowKeys.value.filter(id => plans.value.find(p => p.id === id)?.status === 'expired'); const ne = selectedRowKeys.value.filter(id => !eids.includes(id)); if (ne.length > 0) { message.error(`所选计划中有 ${ne.length} 个非"已过期"状态，仅已过期的计划支持删除，请重新选择`); return }; Modal.confirm({ title: '确定批量删除所选抓拍计划吗？', icon: () => h(ExclamationCircleOutlined), content: `将删除 ${eids.length} 个已过期的计划，删除后不可恢复。`, okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { plans.value = plans.value.filter(p => !eids.includes(p.id)); filteredPlans.value = [...plans.value]; selectedRowKeys.value = []; message.success(`已成功删除 ${eids.length} 个计划`) } }) }
const rowSelection = computed(() => ({ selectedRowKeys: selectedRowKeys.value, onChange: (keys: string[]) => { selectedRowKeys.value = keys } }))
</script>

<template>
  <div class="snapshot-plan">
    <div class="page-toolbar">
      <div class="toolbar-row">
        <a-space wrap>
          <a-input v-model:value="searchName" placeholder="计划名称" style="width:200px" allow-clear @pressEnter="doSearch"><template #prefix><SearchOutlined /></template></a-input>
          <a-select v-model:value="searchStatus" placeholder="计划状态" style="width:200px" allow-clear :options="[{ label:'启用中', value:'active' },{ label:'已暂停', value:'paused' },{ label:'已过期', value:'expired' }]" />
          <a-button type="primary" @click="doSearch">查询</a-button>
          <a-button @click="doReset">重置</a-button>
        </a-space>
      </div>
      <div class="toolbar-row">
        <a-space>
          <a-button type="primary" @click="openAdd"><PlusOutlined /> 新建抓拍计划</a-button>
          <a-button danger @click="batchDelete" :disabled="!selectedRowKeys.length"><DeleteOutlined /> 批量删除</a-button>
          <span v-if="selectedRowKeys.length" class="selected-count">已选 {{ selectedRowKeys.length }} 项</span>
        </a-space>
      </div>
    </div>

    <a-table :columns="columns" :data-source="filteredPlans" :row-selection="rowSelection" row-key="id" :scroll="{ x: 1320 }" size="middle" :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10','20','50','100'] }">
      <template #headerCell="{ column }">
        <template v-if="column.key === 'status'">
          状态
          <span class="info-tip">
            ⓘ
            <span class="info-tip-pop">
              <span>启用中：计划正在执行中，按设定频率自动抓拍</span>
              <span>已暂停：计划已暂停，不会执行抓拍，可手动恢复</span>
              <span>已过期：计划已超有效期，不再执行，可编辑或删除</span>
            </span>
          </span>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'deviceCount'"><span class="col-center">{{ record.deviceIds?.length || 0 }}</span></template>
        <template v-else-if="column.key === 'validPeriod'"><span class="col-center">{{ record.validFrom }} ~ {{ record.validUntil }}</span></template>
        <template v-else-if="column.key === 'cycle'"><span>{{ formatCycleCompact(record) }}</span></template>
        <template v-else-if="column.key === 'status'"><a-tag :color="statusMap[record.status]?.color">{{ statusMap[record.status]?.label }}</a-tag></template>
        <template v-else-if="column.key === 'action'">
          <a-space :size="4">
            <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button v-if="record.status !== 'expired'" type="link" size="small" :style="{ color: record.status === 'active' ? '#fa8c16' : '#52c41a' }" @click="toggleStatus(record)">{{ record.status === 'active' ? '暂停' : '启用' }}</a-button>
            <a-button v-if="record.status === 'expired'" type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'creator' || column.dataIndex === 'createdAt' || column.dataIndex === 'updatedAt'"><span class="col-center">{{ record[column.dataIndex] || '-' }}</span></template>
        <template v-else-if="column.dataIndex"><span>{{ record[column.dataIndex] || '-' }}</span></template>
      </template>
    </a-table>

    <a-modal v-model:open="modalVisible" :title="modalTitle" width="720px" :confirm-loading="saving" cancel-text="取消" ok-text="确定" @ok="handleSave" :body-style="{ padding: '24px 32px' }">
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" :colon="false" class="plan-form">
        <a-form-item label="计划名称" required><a-input v-model:value="formName" placeholder="请输入计划名称" :maxlength="50" style="width:100%" /></a-form-item>
        <a-form-item label="计划有效期" required><a-range-picker v-model:value="formDateRange" style="width:100%" :placeholder="['开始日期', '结束日期']"><template #suffixIcon><CalendarOutlined /></template></a-range-picker></a-form-item>
        <a-form-item label="抓拍时段" required>
          <div class="time-range-wrap"><a-time-picker v-model:value="formTimeStart" format="HH:mm" placeholder="开始时间" style="flex:1" :input-read-only="true"><template #suffixIcon><ClockCircleOutlined /></template></a-time-picker><span class="time-sep">~</span><a-time-picker v-model:value="formTimeEnd" format="HH:mm" placeholder="结束时间" style="flex:1" :input-read-only="true"><template #suffixIcon><ClockCircleOutlined /></template></a-time-picker></div>
        </a-form-item>
        <a-form-item label="抓拍频率" required>
          <div class="freq-inline"><span class="freq-prefix">每</span><a-input-number v-model:value="formFrequency" :min="5" :max="30" :step="5" placeholder="范围5~30" style="width:120px" /><span class="freq-suffix">分钟抓拍一次</span></div>
        </a-form-item>
        <a-form-item label="执行周期" required>
          <div class="weekday-selector"><button v-for="d in weekDays" :key="d.value" type="button" class="wd-btn" :class="{ active: formCycleDays.includes(d.value) }" @click="toggleWeekDay(d.value)">{{ d.label }}</button></div>
        </a-form-item>
        <a-form-item label="选择设备" required>
          <div class="device-picker">
            <div class="dp-top-bar">已选 <strong style="color:#409EFF">{{ formDeviceIds.length }}</strong> 个设备</div>
            <div class="dp-body">
              <div class="dp-left">
                <div class="dp-tree-search"><a-input v-model:value="deviceTreeSearch" placeholder="搜索设备" size="small" allow-clear><template #prefix><SearchOutlined /></template></a-input></div>
                <a-tree :tree-data="mockOrgTree" :field-names="{ children:'children', title:'title', key:'key' }" default-expand-all block-node default-selected-keys="['org-1']" :selected-keys="[deviceTreeSelected || 'org-1']" @select="onDeviceTreeSelect" />
              </div>
              <div class="dp-right">
                <a-table :columns="deviceTableColumns" :data-source="paginatedDevices" :row-selection="{ selectedRowKeys: deviceSelectedRowKeys, onChange: (ks: string[]) => { deviceSelectedRowKeys = ks; syncDeviceSelection() } }" row-key="id" :pagination="false" size="small" :scroll="{ y: 220 }">
                  <template #bodyCell="{ column, record }"><template v-if="column.key === 'status'"><span :style="{ color: deviceStatusMap[record.status]?.color, fontWeight: 500 }">{{ deviceStatusMap[record.status]?.label }}</span></template></template>
                </a-table>
                <div class="dp-pagination"><span>共 {{ deviceTableData.length }} 条</span><a-pagination v-model:current="devicePage" :total="deviceTableData.length" :page-size="devicePageSize" size="small" show-size-changer :page-size-options="['10','20','50']" style="margin-left:auto" /></div>
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.snapshot-plan { padding: 0; }
.page-toolbar { margin-bottom: 16px; }
.toolbar-row { margin-bottom: 12px; }
.toolbar-row:last-child { margin-bottom: 0; }
.selected-count { color: #1677ff; font-size: 13px; margin-left: 8px; }
.col-center { display: flex; justify-content: center; }
.time-range-wrap { display: flex; align-items: center; gap: 8px; width: 100%; }
.time-sep { color: #999; flex-shrink: 0; }
.freq-inline { display: flex; align-items: center; gap: 8px; }
.freq-prefix, .freq-suffix { font-size: 13px; color: #333; }
.weekday-selector { display: flex; gap: 0; border: 1px solid #dcdfe6; border-radius: 6px; overflow: hidden; width: fit-content; }
.wd-btn { width: 40px; height: 34px; border: none; border-right: 1px solid #dcdfe6; background: #fff; color: #606266; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; outline: none; padding: 0; margin: 0; }
.wd-btn:last-child { border-right: none; }
.wd-btn:hover { background: #ecf5ff; color: #409EFF; }
.wd-btn.active { background: #409EFF; color: #fff; border-color: #409EFF; }
.wd-btn.active + .wd-btn { border-left-color: #409EFF; }
.device-picker { border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
.dp-top-bar { padding: 6px 12px; font-size: 12px; color: #666; border-bottom: 1px solid #e8e8e8; background: #fafbfc; }
.dp-body { display: flex; height: 320px; }
.dp-left { width: 210px; border-right: 1px solid #e8e8e8; display: flex; flex-direction: column; background: #fafbfc; }
.dp-tree-search { padding: 8px; border-bottom: 1px solid #e8e8e8; }
.dp-left :deep(.ant-tree) { flex: 1; overflow-y: auto; padding: 6px 8px; background: transparent; font-size: 13px; }
.dp-left :deep(.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected) { background: #e6f0ff; }
.dp-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.dp-pagination { display: flex; align-items: center; padding: 8px 12px; border-top: 1px solid #e8e8e8; font-size: 12px; color: #999; flex-shrink: 0; }
:deep(.ant-table-wrapper) { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 500; color: #333; font-size: 13px; padding: 10px 12px; white-space: nowrap; }
:deep(.ant-table-tbody > tr > td) { padding: 10px 12px; font-size: 13px; color: #555; }
:deep(.ant-table-tbody > tr:hover > td) { background: #f0f5ff !important; }
:deep(.ant-pagination) { padding: 12px 16px; }
.plan-form :deep(.ant-form-item) { margin-bottom: 20px; }
.plan-form :deep(.ant-form-item-label > label) { font-size: 13px; color: #333; font-weight: 500; }
.plan-form :deep(.ant-form-item-label > label::before) { color: #ff4d4f !important; }
:deep(.ant-modal-header) { padding: 18px 24px 16px; border-bottom: 1px solid #f0f0f0; }
:deep(.ant-modal-header .ant-modal-title) { font-size: 16px; font-weight: 600; }
:deep(.ant-modal-footer) { padding: 12px 24px; border-top: 1px solid #f0f0f0; }
.info-tip { position: relative; color: #bbb; font-size: 11px; cursor: help; margin-left: 2px; display: inline-block; }
.info-tip-pop { display: none; position: absolute; top: 100%; left: 0; background: #fff; color: #666; font-size: 10px; padding: 8px 12px; white-space: nowrap; box-shadow: 0 2px 12px rgba(0,0,0,.12); border-radius: 6px; z-index: 9999; line-height: 2; pointer-events: none; margin-top: 4px; text-align: left; }
.info-tip-pop span { display: block; }
.info-tip:hover .info-tip-pop { display: block; }
:deep(.ant-table-thead > tr > th) { overflow: visible !important; }
:deep(.ant-table-container) { overflow: visible !important; }
:deep(.ant-table-header) { overflow: visible !important; }
:deep(.ant-table) { overflow: visible !important; }
.info-tip:hover .info-tip-pop { display: block; }
</style>

<style>
.status-tip .ant-tooltip-inner { background: #fff !important; color: #666 !important; box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important; font-size: 7px; padding: 8px 12px; max-width: none !important; }
.status-tip .ant-tooltip-arrow-content { background: #fff !important; }
.tip-inner { line-height: 1.8; }
.tip-inner b { color: #333; }
</style>
