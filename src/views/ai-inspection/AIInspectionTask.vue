<script setup lang="ts">
import { ref, h, computed, watch } from 'vue'
import { message, Modal } from 'antdv-next'
import { PlusOutlined, SearchOutlined, ExclamationCircleOutlined, DeleteOutlined, CalendarOutlined } from '@antdv-next/icons'
import type { AIInspectionTask } from '@/types'

const mockAlgorithms = [
  { id: 'alg1', name: '地面整洁度识别' }, { id: 'alg2', name: '物品摆放规范检测' },
  { id: 'alg3', name: '安全通道占用检测' }, { id: 'alg4', name: '灭火器在位检测' },
  { id: 'alg5', name: '灯光设备状态检测' }, { id: 'alg6', name: '卫生死角识别' },
]

const mockPlans = [
  { id: '1', name: '门店A日常抓拍计划', validFrom: '2026-05-01', validUntil: '2026-12-31', status: 'active', deviceCount: 3 },
  { id: '2', name: '门店B大厅监控抓拍', validFrom: '2026-05-15', validUntil: '2026-11-30', status: 'active', deviceCount: 2 },
  { id: '4', name: '门店A后场区域抓拍', validFrom: '2026-06-01', validUntil: '2026-12-31', status: 'paused', deviceCount: 1 },
  { id: '5', name: '门店D全景抓拍', validFrom: '2026-05-01', validUntil: '2026-10-31', status: 'active', deviceCount: 1 },
]

const mockPersonnel = ['张三', '李四', '王五', '赵六', '孙七']

const mockTasks: AIInspectionTask[] = [
  { id: '1', name: '门店A日常AI巡检', taskNo: 'AI20260505-001', planId: '1', planName: '门店A日常抓拍计划', validFrom: '2026-05-01', validUntil: '2026-12-31', algorithmIds: ['alg1','alg2','alg3'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测'], cycleDays: [1,2,3,4,5], autoCreateTicket: true, assigneeId: 'p1', assigneeName: '张三', status: 'active', creator: '管理员', createdAt: '2026-05-05 09:00:00', updatedAt: '2026-05-25 10:00:00' },
  { id: '2', name: '门店B大厅AI巡检', taskNo: 'AI20260516-002', planId: '2', planName: '门店B大厅监控抓拍', validFrom: '2026-05-15', validUntil: '2026-11-30', algorithmIds: ['alg4','alg5'], algorithmNames: ['灭火器在位检测','灯光设备状态检测'], cycleDays: [1,2,3,4,5,6,7], autoCreateTicket: false, assigneeId: null, assigneeName: null, status: 'active', creator: '管理员', createdAt: '2026-05-16 14:00:00', updatedAt: '2026-05-26 08:00:00' },
  { id: '3', name: '门店A后场AI巡检', taskNo: 'AI20260520-003', planId: '4', planName: '门店A后场区域抓拍', validFrom: '2026-06-01', validUntil: '2026-09-30', algorithmIds: ['alg6'], algorithmNames: ['卫生死角识别'], cycleDays: [1,3,5], autoCreateTicket: true, assigneeId: 'p2', assigneeName: '李四', status: 'paused', creator: '管理员', createdAt: '2026-05-20 15:00:00', updatedAt: '2026-05-27 09:00:00' },
  { id: '4', name: '门店C展示区巡检', taskNo: 'AI20260301-004', planId: '3', planName: '门店C展示区抓拍(已过期)', validFrom: '2026-03-01', validUntil: '2026-05-28', algorithmIds: ['alg1','alg2'], algorithmNames: ['地面整洁度识别','物品摆放规范检测'], cycleDays: [1,2,3,4,5], autoCreateTicket: false, assigneeId: null, assigneeName: null, status: 'completed', creator: '管理员', createdAt: '2026-03-01 08:00:00', updatedAt: '2026-05-28 18:00:00' },
  { id: '5', name: '门店D卫生专项巡检', taskNo: 'AI20260510-005', planId: '5', planName: '门店D全景抓拍', validFrom: '2026-05-01', validUntil: '2026-10-31', algorithmIds: ['alg1','alg6'], algorithmNames: ['地面整洁度识别','卫生死角识别'], cycleDays: [2,4,6], autoCreateTicket: true, assigneeId: 'p3', assigneeName: '王五', status: 'active', creator: '管理员', createdAt: '2026-05-10 10:00:00', updatedAt: '2026-05-25 16:00:00' },
]

const tasks = ref([...mockTasks]); const searchName = ref(''); const searchAlgorithm = ref<string[]>([]); const searchStatus = ref<string | undefined>(undefined); const selectedRowKeys = ref<string[]>([])
const statusMap: Record<string, { label: string; color: string }> = { active: { label: '执行中', color: 'green' }, paused: { label: '已暂停', color: 'orange' }, completed: { label: '已完成', color: 'default' } }

const filteredTasks = ref([...mockTasks])
const doSearch = () => { filteredTasks.value = mockTasks.filter(t => { if (searchName.value && !t.name.includes(searchName.value)) return false; if (searchStatus.value && t.status !== searchStatus.value) return false; if (searchAlgorithm.value.length && !searchAlgorithm.value.some(a => t.algorithmIds.includes(a))) return false; return true }) }
const doReset = () => { searchName.value = ''; searchAlgorithm.value = []; searchStatus.value = undefined; filteredTasks.value = [...mockTasks] }

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', ellipsis: true, align: 'center' as const },
  { title: '任务有效期', key: 'validPeriod', align: 'center' as const },
  { title: '关联抓拍计划', dataIndex: 'planName', key: 'planName', ellipsis: true, align: 'center' as const },
  { title: 'AI算法', key: 'algorithms', align: 'center' as const },
  { title: '自动提单', key: 'autoTicket', align: 'center' as const },
  { title: '状态', key: 'status', align: 'center' as const },
  { title: '创建人', dataIndex: 'creator', key: 'creator', align: 'center' as const },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', align: 'center' as const },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', align: 'center' as const },
  { title: '操作', key: 'action', align: 'center' as const },
]

const modalVisible = ref(false); const modalTitle = ref('新建AI巡检任务'); const editingId = ref<string | null>(null); const saving = ref(false)
const formName = ref(''); const formPlanId = ref<string | undefined>(undefined); const formValidRange = ref<any>(null)
const formAlgorithmIds = ref<string[]>([]); const formCycleDays = ref<number[]>([]); const formAutoTicket = ref(false); const formAssignee = ref<string[]>([])
const weekDays = [{ label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 }, { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 }, { label: '日', value: 7 }]
const toggleWeekDay = (d: number) => { const i = formCycleDays.value.indexOf(d); if (i > -1) formCycleDays.value.splice(i, 1); else formCycleDays.value.push(d) }
const algoOpts = mockAlgorithms.map(a => ({ label: a.name, value: a.id }))
const availablePlans = ref(mockPlans.filter(p => p.status === 'active'))
const planMaxDate = ref<string | undefined>(undefined); const planMinDate = ref<string | undefined>(undefined)
watch(formPlanId, (val) => { const p = mockPlans.find(x => x.id === val); planMinDate.value = p?.validFrom; planMaxDate.value = p?.validUntil })

const resetForm = () => { formName.value = ''; formPlanId.value = undefined; formValidRange.value = null; formAlgorithmIds.value = []; formCycleDays.value = []; formAutoTicket.value = false; formAssignee.value = [] }
const openAdd = () => { modalTitle.value = '新建AI巡检任务'; editingId.value = null; resetForm(); modalVisible.value = true }
const openEdit = (task: AIInspectionTask) => { if (task.status === 'completed') return; modalTitle.value = '编辑AI巡检任务'; editingId.value = task.id; formName.value = task.name; formPlanId.value = task.planId; formValidRange.value = null; formAlgorithmIds.value = [...task.algorithmIds]; formCycleDays.value = [...task.cycleDays]; formAutoTicket.value = task.autoCreateTicket; formAssignee.value = task.assigneeId ? [task.assigneeId] : []; modalVisible.value = true }

const handleSave = () => {
  if (!formName.value.trim()) { message.warning('请输入任务名称'); return }
  if (!formPlanId.value) { message.warning('请选择关联抓拍计划'); return }
  if (!formValidRange.value?.[0]) { message.warning('请选择任务有效期'); return }
  if (!formAlgorithmIds.value.length) { message.warning('请至少选择一个AI算法'); return }
  if (!formCycleDays.value.length) { message.warning('请至少选择一个执行日'); return }
  if (formAutoTicket.value && !formAssignee.value.length) { message.warning('开启自动提单时请选择问题指派人'); return }
  saving.value = true
  setTimeout(() => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const vf = formValidRange.value[0]?.format?.('YYYY-MM-DD') || String(formValidRange.value[0] || '');
    const vu = formValidRange.value[1]?.format?.('YYYY-MM-DD') || String(formValidRange.value[1] || '');
    const plan = mockPlans.find(p => p.id === formPlanId.value);
    const algoNames = formAlgorithmIds.value.map(id => mockAlgorithms.find(x => x.id === id)?.name || id);
    
    // ✅ 修复：formAssignee 是数组，先取第一个值避免 string[] 与 string 类型冲突
    const assigneeIdVal = formAssignee.value.length ? formAssignee.value[0] : null;
    const an = assigneeIdVal ? mockPersonnel.find((_, i) => `p${i + 1}` === assigneeIdVal) || assigneeIdVal : null;
    
    const data: AIInspectionTask = {
      id: editingId.value || String(Date.now()),
      taskNo: `AI${Date.now()}`, 
      name: formName.value.trim(),
      planId: formPlanId.value!,
      planName: plan?.name || '',
      validFrom: vf,
      validUntil: vu,
      algorithmIds: [...formAlgorithmIds.value],
      algorithmNames: algoNames,
      cycleDays: [...formCycleDays.value],
      autoCreateTicket: formAutoTicket.value,
      assigneeId: assigneeIdVal,
      assigneeName: an,
      status: 'active',
      creator: '当前用户',
      createdAt: editingId.value ? undefined! : now,
      updatedAt: now
    };
    
    if (editingId.value) {
      const idx = tasks.value.findIndex(t => t.id === editingId.value);
      if (idx > -1) {
        data.createdAt = tasks.value[idx].createdAt;
        data.status = tasks.value[idx].status;
        tasks.value[idx] = data
      }
      message.success('AI巡检任务更新成功')
    } else {
      tasks.value.unshift(data);
      message.success('AI巡检任务创建成功')
    }
    filteredTasks.value = [...tasks.value];
    modalVisible.value = false;
    saving.value = false
  }, 500)
}

const toggleStatus = (task: AIInspectionTask) => { if (task.status === 'completed') return; task.status = (task.status === 'active' ? 'paused' : 'active') as AIInspectionTask['status']; task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19); message.success(task.status === 'active' ? '任务已启用' : '任务已暂停') }
const handleDelete = (task: AIInspectionTask) => { if (task.status !== 'completed') return; Modal.confirm({ title: '确定删除该AI巡检任务吗？', icon: () => h(ExclamationCircleOutlined), content: '删除后不可恢复。', okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { tasks.value = tasks.value.filter(t => t.id !== task.id); filteredTasks.value = [...tasks.value]; message.success('AI巡检任务已删除') } }) }
const batchDelete = () => { if (!selectedRowKeys.value.length) { message.warning('请先选择要删除的任务'); return }; const cids = selectedRowKeys.value.filter(id => tasks.value.find(t => t.id === id)?.status === 'completed'); const nc = selectedRowKeys.value.filter(id => !cids.includes(id)); if (nc.length > 0) { message.error(`所选任务中有 ${nc.length} 个非"已完成"状态，仅已完成的任务支持删除，请重新选择`); return }; Modal.confirm({ title: '确定批量删除所选AI巡检任务吗？', icon: () => h(ExclamationCircleOutlined), content: `将删除 ${cids.length} 个已完成的任务，删除后不可恢复。`, okText: '确定', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { tasks.value = tasks.value.filter(t => !cids.includes(t.id)); filteredTasks.value = [...tasks.value]; selectedRowKeys.value = []; message.success(`已成功删除 ${cids.length} 个任务`) } }) }
const rowSelection = computed(() => ({ selectedRowKeys: selectedRowKeys.value, onChange: (keys: string[]) => { selectedRowKeys.value = keys } }))
</script>

<template>
  <div class="ai-task">
    <div class="page-toolbar">
      <div class="toolbar-row">
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
    </div>

    <a-table :columns="columns" :data-source="filteredTasks" :row-selection="rowSelection" row-key="id" size="middle" :pagination="{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10','20','50','100'] }">
      <template #headerCell="{ column }">
        <template v-if="column.key === 'status'">状态 <a-tooltip color="#fff" overlay-class-name="task-tip" :overlay-style="{ maxWidth:'360px' }"><template #title>执行中：任务正在执行中，基于AI算法自动巡检<br>已暂停：任务已暂停，不会执行巡检，可手动恢复<br>已完成：任务已超有效期，不再执行，可删除</template><span style="color:#bbb;font-size:11px;cursor:help;margin-left:2px">ⓘ</span></a-tooltip></template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'"><div class="task-name-cell"><span class="task-name-text">{{ record.name }}</span><span class="task-name-no">（{{ record.taskNo }}）</span></div></template>
        <template v-else-if="column.key === 'validPeriod'"><span>{{ record.validFrom }} ~ {{ record.validUntil }}</span></template>
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
        <template v-else-if="column.dataIndex === 'creator' || column.dataIndex === 'createdAt' || column.dataIndex === 'updatedAt' || column.dataIndex === 'planName'"><span class="col-center">{{ record[column.dataIndex] || '-' }}</span></template>
        <template v-else-if="column.dataIndex"><span>{{ record[column.dataIndex] || '-' }}</span></template>
      </template>
    </a-table>

    <a-modal v-model:open="modalVisible" :title="modalTitle" width="640px" :confirm-loading="saving" cancel-text="取消" ok-text="确定" @ok="handleSave" :body-style="{ padding: '24px 32px' }">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" :colon="false" class="task-form">
        <a-form-item label="任务名称" required><a-input v-model:value="formName" placeholder="请输入任务名称" :maxlength="50" style="width:100%" /></a-form-item>
        <a-form-item label="关联抓拍计划" required><a-select v-model:value="formPlanId" placeholder="请选择抓拍计划" style="width:100%" :options="availablePlans.map(p => ({ label: `${p.name}（${p.deviceCount}台设备）`, value: p.id }))" /></a-form-item>
        <a-form-item label="任务有效期" required><a-range-picker v-model:value="formValidRange" style="width:100%" :placeholder="['开始日期', '结束日期']"><template #suffixIcon><CalendarOutlined /></template></a-range-picker><div v-if="planMaxDate" style="color:#999;font-size:12px;margin-top:4px">抓拍计划有效期：{{ planMinDate }} ~ {{ planMaxDate }}，任务有效期需在此范围内</div></a-form-item>
        <a-form-item label="AI算法" required>
          <a-select v-model:value="formAlgorithmIds" mode="multiple" placeholder="请选择AI分析算法" style="width:100%" :options="algoOpts" :not-found-content="'暂无可用的AI算法，请前往 设备管理→智能服务商城 购买并绑定算法'" />
        </a-form-item>
        <a-form-item label="执行周期" required><div class="weekday-selector"><button v-for="d in weekDays" :key="d.value" type="button" class="wd-btn" :class="{ active: formCycleDays.includes(d.value) }" @click="toggleWeekDay(d.value)">{{ d.label }}</button></div></a-form-item>
        <a-form-item label="自动提单"><a-switch v-model:checked="formAutoTicket" /> <span style="margin-left:8px;color:#999;font-size:12px">{{ formAutoTicket ? '异常时自动生成整改单' : '异常时需人工处理' }}</span></a-form-item>
        <a-form-item v-if="formAutoTicket" label="问题指派" required><a-select v-model:value="formAssignee" mode="multiple" placeholder="选择问题指派人" style="width:100%" :options="mockPersonnel.map((p,i) => ({ label: p, value: `p${i+1}` }))" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.ai-task { padding: 0; }
.page-toolbar { margin-bottom: 16px; }
.toolbar-row { margin-bottom: 12px; }
.toolbar-row:last-child { margin-bottom: 0; }
.selected-count { color: #1677ff; font-size: 13px; margin-left: 8px; }
.task-name-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.task-name-text { font-size: 13px; color: #333; line-height: 1.4; }
.task-name-no { font-size: 11px; color: #999; line-height: 1.3; }
.algo-tags { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.col-center { display: flex; justify-content: center; }
:deep(.ant-table-wrapper) { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
:deep(.ant-table) { table-layout: fixed; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 500; color: #333; font-size: 13px; padding: 10px 12px; white-space: nowrap; }
:deep(.ant-table-tbody > tr > td) { padding: 8px 12px; font-size: 13px; color: #555; vertical-align: middle; }
:deep(.ant-table-tbody > tr:hover > td) { background: #f0f5ff !important; }
:deep(.ant-pagination) { padding: 12px 16px; }
.task-form :deep(.ant-form-item) { margin-bottom: 18px; }
.weekday-selector { display: flex; gap: 0; border: 1px solid #dcdfe6; border-radius: 6px; overflow: hidden; width: fit-content; }
.wd-btn { width: 40px; height: 34px; border: none; border-right: 1px solid #dcdfe6; background: #fff; color: #606266; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; outline: none; padding: 0; margin: 0; }
.wd-btn:last-child { border-right: none; }
.wd-btn:hover { background: #ecf5ff; color: #409EFF; }
.wd-btn.active { background: #409EFF; color: #fff; border-color: #409EFF; }
.wd-btn.active + .wd-btn { border-left-color: #409EFF; }
.task-form :deep(.ant-form-item-label > label) { font-size: 13px; color: #333; }
.task-form :deep(.ant-form-item-label > label::before) { color: #ff4d4f !important; }
:deep(.ant-modal-header) { padding: 18px 24px 16px; border-bottom: 1px solid #f0f0f0; }
:deep(.ant-modal-header .ant-modal-title) { font-size: 16px; font-weight: 600; }
:deep(.ant-modal-footer) { padding: 12px 24px; border-top: 1px solid #f0f0f0; }
</style>

<style>
.task-tip .ant-tooltip-inner { background: #fff !important; color: #666 !important; box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important; font-size: 10px; padding: 8px 12px; line-height: 1.8; }
.task-tip .ant-tooltip-arrow-content { background: #fff !important; }
</style>
