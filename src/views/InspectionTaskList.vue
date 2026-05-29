<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import { SearchOutlined, ReloadOutlined } from '@antdv-next/icons'
import type { InspectionTask } from '@/types'

// ========== Mock ==========
const mockTasks: InspectionTask[] = [
  { id:'1',taskNo:'RW-20260526-001',executionTime:'2026-05-26 08:00',storeName:'门店A',plannedPersonnel:'张三',planCreator:'管理员',templateName:'门店基础巡检',inspectionMode:'在线巡检',relatedPlan:'计划A-每日门店巡检',planStatus:'进行中',pushTime:'2026-05-26 07:00',pushStatus:'已推送',executionStatus:'executed',validUntil:'2026-05-26 16:00',actualPersonnel:'张三',inspectionNo:'XJ-20260526-001',inspectionTime:'2026-05-26 08:30',issueStatus:'已完成',issueCount:0,resolvedIssueCount:0 },
  { id:'2',taskNo:'RW-20260526-002',executionTime:'2026-05-26 08:00',storeName:'门店B',plannedPersonnel:'李四',planCreator:'管理员',templateName:'门店基础巡检',inspectionMode:'在线巡检',relatedPlan:'计划A-每日门店巡检',planStatus:'进行中',pushTime:'2026-05-26 07:00',pushStatus:'已推送',executionStatus:'executing',validUntil:'2026-05-26 16:00',actualPersonnel:'李四',inspectionNo:'',inspectionTime:'',issueStatus:'待整改',issueCount:2,resolvedIssueCount:0 },
  { id:'3',taskNo:'RW-20260526-003',executionTime:'2026-05-26 09:00',storeName:'门店C',plannedPersonnel:'王五',planCreator:'管理员',templateName:'明星店铺综合巡检',inspectionMode:'线下巡检',relatedPlan:'计划B-每周综合巡检',planStatus:'进行中',pushTime:'2026-05-26 08:00',pushStatus:'已推送',executionStatus:'pending',validUntil:'2026-05-26 13:00',actualPersonnel:'',inspectionNo:'',inspectionTime:'',issueStatus:'无',issueCount:0,resolvedIssueCount:0 },
  { id:'4',taskNo:'RW-20260526-004',executionTime:'2026-05-26 10:00',storeName:'门店D',plannedPersonnel:'赵六',planCreator:'管理员',templateName:'陈列展示巡检',inspectionMode:'在线巡检',relatedPlan:'计划E-每周陈列巡检',planStatus:'进行中',pushTime:'',pushStatus:'待推送',executionStatus:'pending',validUntil:'2026-05-26 13:00',actualPersonnel:'',inspectionNo:'',inspectionTime:'',issueStatus:'无',issueCount:0,resolvedIssueCount:0 },
  { id:'5',taskNo:'RW-20260525-001',executionTime:'2026-05-25 08:00',storeName:'门店A',plannedPersonnel:'张三',planCreator:'管理员',templateName:'门店基础巡检',inspectionMode:'在线巡检',relatedPlan:'计划A-每日门店巡检',planStatus:'已结束',pushTime:'2026-05-25 07:00',pushStatus:'已推送',executionStatus:'executed',validUntil:'2026-05-25 16:00',actualPersonnel:'张三',inspectionNo:'XJ-20260525-001',inspectionTime:'2026-05-25 08:10',issueStatus:'已完成',issueCount:1,resolvedIssueCount:1 },
  { id:'6',taskNo:'RW-20260525-002',executionTime:'2026-05-25 09:00',storeName:'门店B',plannedPersonnel:'李四',planCreator:'管理员',templateName:'明星店铺综合巡检',inspectionMode:'线下巡检',relatedPlan:'计划B-每周综合巡检',planStatus:'已结束',pushTime:'2026-05-25 08:00',pushStatus:'已推送',executionStatus:'executed',validUntil:'2026-05-25 13:00',actualPersonnel:'赵六',inspectionNo:'XJ-20260525-002',inspectionTime:'2026-05-25 09:20',issueStatus:'待审核',issueCount:3,resolvedIssueCount:2 },
  { id:'7',taskNo:'RW-20260527-001',executionTime:'2026-05-27 08:00',storeName:'门店E',plannedPersonnel:'孙七',planCreator:'管理员',templateName:'门店基础巡检',inspectionMode:'在线巡检',relatedPlan:'计划C-每月安全巡检',planStatus:'未开始',pushTime:'',pushStatus:'待推送',executionStatus:'pending',validUntil:'2026-05-27 14:00',actualPersonnel:'',inspectionNo:'',inspectionTime:'',issueStatus:'无',issueCount:0,resolvedIssueCount:0 },
]
const tasks = ref<InspectionTask[]>([...mockTasks])

// ========== 状态映射 ==========
const planStatusMap: Record<string,{label:string;color:string}> = { 未开始:{label:'未开始',color:'processing'}, 进行中:{label:'进行中',color:'success'}, 已结束:{label:'已结束',color:'error'} }
const pushStatusMap: Record<string,{label:string;color:string}> = { 待推送:{label:'待推送',color:'default'}, 已推送:{label:'已推送',color:'success'} }
const execStatusMap: Record<string,{label:string;color:string}> = { pending:{label:'待执行',color:'default'}, executing:{label:'进行中',color:'processing'}, executed:{label:'已执行',color:'success'} }
const issueStatusMap: Record<string,{label:string;color:string}> = { 无:{label:'无',color:'default'}, 待整改:{label:'待整改',color:'warning'}, 待审核:{label:'待审核',color:'processing'}, 已完成:{label:'已完成',color:'success'} }

// ========== 筛选 ==========
const searchStore = ref<string|undefined>(undefined)
const searchMode = ref<string|undefined>(undefined)
const searchPersonnel = ref<string|undefined>(undefined)
const searchTemplate = ref<string|undefined>(undefined)
const searchPlan = ref<string|undefined>(undefined)
const searchPushStatus = ref<string|undefined>(undefined)
const searchEvalNo = ref('')
const searchTaskNo = ref('')
const searchExecStatus = ref<string|undefined>(undefined)

const activeFilters = ref<any>({})
const getFilters = () => ({
  store:searchStore.value, mode:searchMode.value, personnel:searchPersonnel.value,
  template:searchTemplate.value, plan:searchPlan.value, pushStatus:searchPushStatus.value,
  execStatus:searchExecStatus.value, taskNo:searchTaskNo.value,
})
const handleSearch = () => { activeFilters.value = getFilters() }
const handleReset = () => {
  searchStore.value=undefined;searchMode.value=undefined;searchPersonnel.value=undefined
  searchTemplate.value=undefined;searchPlan.value=undefined;searchPushStatus.value=undefined
  searchTaskNo.value='';searchEvalNo.value=''
  searchExecStatus.value=undefined
  activeFilters.value=getFilters()
}

const storeOpts = ['门店A','门店B','门店C','门店D','门店E'].map(s=>({value:s,label:s}))
const modeOpts = ['在线巡检','线下巡检'].map(s=>({value:s,label:s}))
const personOpts = ['张三','李四','王五','赵六','孙七'].map(s=>({value:s,label:s}))
const tmplOpts = ['门店基础巡检','明星店铺综合巡检','陈列展示巡检'].map(s=>({value:s,label:s}))
const planOpts = ['计划A-每日门店巡检','计划B-每周综合巡检','计划C-每月安全巡检','计划D-单次专项检查','计划E-每周陈列巡检'].map(s=>({value:s,label:s}))
const pushOpts = ['待推送','已推送'].map(s=>({value:s,label:s}))

const filteredTasks = computed(() => {
  let list = tasks.value; const f = activeFilters.value
  if(f.store) list=list.filter(t=>t.storeName===f.store)
  if(f.mode) list=list.filter(t=>t.inspectionMode===f.mode)
  if(f.personnel) list=list.filter(t=>t.plannedPersonnel.includes(f.personnel!))
  if(f.template) list=list.filter(t=>t.templateName===f.template)
  if(f.plan) list=list.filter(t=>t.relatedPlan===f.plan)
  if(f.pushStatus) list=list.filter(t=>t.pushStatus===f.pushStatus)
  if(f.taskNo) list=list.filter(t=>t.taskNo.includes(f.taskNo!))
  if(f.evalNo) list=list.filter(t=>t.inspectionNo.includes(f.evalNo!))
  return list
})

// ========== 表格 ==========
const rowSelection = reactive({
  selectedRowKeys: [] as string[],
  onChange: (ks: string[]) => { rowSelection.selectedRowKeys = ks },
})
const columns = [
  { title:'任务编号',dataIndex:'taskNo',key:'taskNo',width:170 },
  { title:'任务执行时间',dataIndex:'executionTime',key:'executionTime',width:170 },
  { title:'巡检门店',dataIndex:'storeName',key:'storeName',width:100 },
  { title:'计划巡检人',dataIndex:'plannedPersonnel',key:'plannedPersonnel',width:110 },
  { title:'计划创建人',dataIndex:'planCreator',key:'planCreator',width:100 },
  { title:'巡检模版',dataIndex:'templateName',key:'templateName',width:140,ellipsis:true },
  { title:'巡检方式',dataIndex:'inspectionMode',key:'inspectionMode',width:100 },
  { title:'关联计划',dataIndex:'relatedPlan',key:'relatedPlan',width:180,ellipsis:true },
  { title:'计划状态',key:'planStatus',width:90 },
  { title:'任务推送时间',dataIndex:'pushTime',key:'pushTime',width:170 },
  { title:'推送状态',key:'pushStatus',width:90 },
  { title:'任务执行状态',key:'executionStatus',width:110 },
  { title:'任务有效期',dataIndex:'validUntil',key:'validUntil',width:170 },
  { title:'实际巡检人',dataIndex:'actualPersonnel',key:'actualPersonnel',width:110 },
  { title:'巡检编号',dataIndex:'inspectionNo',key:'inspectionNo',width:170 },
  { title:'巡检时间',dataIndex:'inspectionTime',key:'inspectionTime',width:170 },
  { title:'问题单状态',key:'issueStatus',width:100 },
  { title:'需整改问题数',dataIndex:'issueCount',key:'issueCount',width:120 },
  { title:'整改完成问题数',dataIndex:'resolvedIssueCount',key:'resolvedIssueCount',width:140 },
  { title:'操作',key:'action',width:80,fixed:'right' },
]
const taskScroll = { x: columns.reduce((s,c)=>s+(c.width as number||120),0) }

const handleDeleteTask = (task:InspectionTask) => {
  if(task.executionStatus!=='pending'){message.error('该任务已执行/已完成，无法删除');return}
  tasks.value=tasks.value.filter(t=>t.id!==task.id);message.success('任务已删除')
}
const handleBatchDelete = () => {
  if(!rowSelection.selectedRowKeys.length){message.warning('请先选择任务');return}
  const sel=tasks.value.filter(t=>rowSelection.selectedRowKeys.includes(t.id))
  if(sel.some(t=>t.executionStatus!=='pending')){message.error('所选任务中包含已执行的任务，无法批量删除');return}
  tasks.value=tasks.value.filter(t=>!rowSelection.selectedRowKeys.includes(t.id))
  rowSelection.selectedRowKeys=[];message.success('批量删除成功')
}
</script>

<template>
  <div class="task-list">
    <!-- 筛选区 -->
    <div class="filter-grid">
      <a-select v-model:value="searchStore" placeholder="巡检门店" allow-clear :options="storeOpts" />
      <a-select v-model:value="searchMode" placeholder="巡检方式" allow-clear :options="modeOpts" />
      <a-select v-model:value="searchPersonnel" placeholder="计划巡检人" allow-clear :options="personOpts" />
      <a-select v-model:value="searchTemplate" placeholder="巡检模板" allow-clear :options="tmplOpts" />
      <a-select v-model:value="searchPlan" placeholder="关联计划" allow-clear :options="planOpts" />
      <a-select v-model:value="searchPushStatus" placeholder="推送状态" allow-clear :options="pushOpts" />
      <a-input v-model:value="searchTaskNo" placeholder="任务编号" allow-clear @pressEnter="handleSearch" />
      <a-input v-model:value="searchEvalNo" placeholder="考评编号" allow-clear @pressEnter="handleSearch" />
      <span class="btn-group"><a-button type="primary" @click="handleSearch"><SearchOutlined />查询</a-button><a-button @click="handleReset"><ReloadOutlined />重置</a-button></span>
    </div>

    <div class="action-bar">
      <a-button danger :disabled="!rowSelection.selectedRowKeys.length" @click="handleBatchDelete">批量删除</a-button>
    </div>

    <a-table :columns="columns" :data-source="filteredTasks" :row-selection="rowSelection" row-key="id" :scroll="taskScroll" :pagination="{pageSize:10,showTotal:(t:number)=>`共 ${t} 条`,showSizeChanger:true,pageSizeOptions:['10','20','50','100']}" size="middle">
      <template #bodyCell="{column,record}">
        <template v-if="column.key==='planStatus'">
          <a-tag :color="planStatusMap[record.planStatus]?.color">{{record.planStatus}}</a-tag>
        </template>
        <template v-else-if="column.key==='pushStatus'">
          <a-tag :color="pushStatusMap[record.pushStatus]?.color">{{record.pushStatus}}</a-tag>
        </template>
        <template v-else-if="column.key==='executionStatus'">
          <a-tag :color="execStatusMap[record.executionStatus]?.color">{{execStatusMap[record.executionStatus]?.label}}</a-tag>
        </template>
        <template v-else-if="column.key==='issueStatus'">
          <a-tag :color="issueStatusMap[record.issueStatus]?.color">{{record.issueStatus}}</a-tag>
        </template>
        <template v-else-if="column.key==='action'">
          <a-button type="link" danger size="small" @click="handleDeleteTask(record)">删除</a-button>
        </template>
        <template v-else-if="column.dataIndex">
          <span :style="{color: record[column.dataIndex] ? 'inherit' : '#ccc'}">{{ record[column.dataIndex] || '-' }}</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.task-list{padding:0}
.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px 12px;margin-bottom:12px;align-items:center}
.filter-grid .ant-btn{justify-self:start}
.btn-group{display:flex;gap:8px}
.action-bar{margin-bottom:12px}
</style>
