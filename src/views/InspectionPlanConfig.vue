<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { message, Modal } from 'antdv-next'
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined, QuestionCircleOutlined } from '@antdv-next/icons'
import type { InspectionPlan, StorePersonnelTemplate } from '@/types'

// ========== Mock ==========
const mockPlans: InspectionPlan[] = [
  { id: '1', name: '计划A-每日门店巡检', status: 'in_progress', inspectionMode: 'online', description: '每日线上巡检计划', cycleMode: 'cycle', cycleType: 'daily', executionTime: '08:00', validUntil: '2026-12-31', duration: '8小时', storesPersonnelTemplates: [{ key: '1', storeId: 's1', storeName: '门店A', personnelIds: ['p1'], personnelNames: ['张三'], templateId: 't1', templateName: '门店基础巡检' }], creator: '管理员', createdAt: '2026-01-15 09:00:00', updatedAt: '2026-05-20 10:00:00' },
  { id: '2', name: '计划B-每周综合巡检', status: 'in_progress', inspectionMode: 'offline', description: '每周线下综合巡检', cycleMode: 'cycle', cycleType: 'weekly', cycleDays: [1,3,5], executionTime: '09:00', validUntil: '2026-12-31', duration: '4小时', storesPersonnelTemplates: [{ key: '1', storeId: 's2', storeName: '门店B', personnelIds: ['p2'], personnelNames: ['李四'], templateId: 't2', templateName: '明星店铺综合巡检' }], creator: '管理员', createdAt: '2026-02-01 14:00:00', updatedAt: '2026-05-18 16:00:00' },
  { id: '3', name: '计划C-每月安全巡检', status: 'not_started', inspectionMode: 'online', description: '', cycleMode: 'cycle', cycleType: 'monthly', cycleDays: [1,15], executionTime: '07:00', validUntil: '2026-12-31', duration: '6小时', storesPersonnelTemplates: [{ key: '1', storeId: 's3', storeName: '门店C', personnelIds: ['p3'], personnelNames: ['王五'], templateId: 't1', templateName: '门店基础巡检' }], creator: '管理员', createdAt: '2026-03-10 11:00:00', updatedAt: '2026-05-10 09:00:00' },
  { id: '4', name: '计划D-单次专项检查', status: 'ended', inspectionMode: 'offline', description: '已结束的单次检查', cycleMode: 'once', executionTime: '2026-01-15 10:00', duration: '4小时', storesPersonnelTemplates: [{ key: '1', storeId: 's1', storeName: '门店A', personnelIds: ['p1','p4'], personnelNames: ['张三','赵六'], templateId: 't2', templateName: '明星店铺综合巡检' }], creator: '管理员', createdAt: '2026-01-01 08:00:00', updatedAt: '2026-02-01 08:00:00' },
  { id: '5', name: '计划E-每周陈列巡检', status: 'in_progress', inspectionMode: 'online', description: '', cycleMode: 'cycle', cycleType: 'weekly', cycleDays: [2,4], executionTime: '08:30', validUntil: '2026-12-31', duration: '3小时', storesPersonnelTemplates: [{ key: '1', storeId: 's4', storeName: '门店D', personnelIds: ['p2'], personnelNames: ['李四'], templateId: 't3', templateName: '陈列展示巡检' }], creator: '管理员', createdAt: '2026-04-01 10:00:00', updatedAt: '2026-05-22 14:00:00' },
  { id: '6', name: '计划F-月末全面巡检', status: 'not_started', inspectionMode: 'offline', description: '', cycleMode: 'cycle', cycleType: 'monthly', cycleDays: [28], executionTime: '09:00', validUntil: '2026-12-31', duration: '8小时', storesPersonnelTemplates: [{ key: '1', storeId: 's5', storeName: '门店E', personnelIds: ['p3','p5'], personnelNames: ['王五','孙七'], templateId: 't1', templateName: '门店基础巡检' }], creator: '管理员', createdAt: '2026-05-01 09:00:00', updatedAt: '2026-05-25 09:00:00' },
]
const mockStores = ['门店A','门店B','门店C','门店D','门店E']
const mockPersonnel = ['张三','李四','王五','赵六','孙七']
const mockTemplates = ['门店基础巡检','明星店铺综合巡检','陈列展示巡检']

// ========== 列表 ==========
const plans = ref([...mockPlans])
const statusMap: Record<string,{label:string;color:string}> = { not_started:{label:'未开始',color:'processing'}, in_progress:{label:'进行中',color:'success'}, ended:{label:'已结束',color:'error'} }
const statusDescriptions = [
  { key: 'not_started', label: '未开始', desc: '当前时间早于首次任务生成时间' },
  { key: 'in_progress', label: '进行中', desc: '当前时间在计划周期内，循环任务正常生成中或单次任务待执行' },
  { key: 'ended', label: '已结束', desc: '超过计划周期结束时间且所有任务终态，不再生成新任务' },
]
const cycleLabel: Record<string,string> = { once:'单次', daily:'每日', weekly:'每周', monthly:'每月' }
const modeLabel: Record<string,string> = { online:'在线巡检', offline:'线下巡检' }

const columns = [
  { title:'计划名称', dataIndex:'name', key:'name', width:200, ellipsis:true },
  { title:'状态', key:'status', width:90 },
  { title:'循环方式', key:'cycle', width:90 },
  { title:'巡检方式', key:'mode', width:100 },
  { title:'创建时间', dataIndex:'createdAt', key:'createdAt', width:170 },
  { title:'更新时间', dataIndex:'updatedAt', key:'updatedAt', width:170 },
  { title:'创建人', dataIndex:'creator', key:'creator', width:90 },
  { title:'操作', key:'action', width:200 },
]

// ========== 抽屉 ==========
const drawerVisible = ref(false)
const drawerMode = ref<'add'|'edit'>('add')
const editingPlanId = ref<string|null>(null)

// 2.1
const formName = ref('')
const formMode = ref<'online'|'offline'>('online')
const formDesc = ref('')
// 2.2
const formCycleMode = ref<'once'|'cycle'>('cycle')
const formOnceGenDate = ref(''); const formOnceGenTime = ref('')
const formOnceValidRange = ref<any>(null); const formOnceDuration = ref<number|null>(null)
const formCycleType = ref<'daily'|'weekly'|'monthly'>('daily'); const formCycleTime = ref('')
const formCycleWeekDays = ref<number[]>([]); const formCycleMonthDays = ref<number[]>([])
const formCycleValidRange = ref<any>(null); const formCycleDuration = ref<number|null>(null)
// 2.3
const formStoreRows = ref<{key:string;store:string;personnel:string[];template:string}[]>([{key:'1',store:'',personnel:[],template:''}])
// 2.4
const formAssignee = ref<string[]>([])
const formReviewer = ref<string[]>([])

const weekOpts = [{label:'周一',value:1},{label:'周二',value:2},{label:'周三',value:3},{label:'周四',value:4},{label:'周五',value:5},{label:'周六',value:6},{label:'周日',value:7}]
const monthOpts = Array.from({length:31},(_,i)=>({label:`${i+1}号`,value:i+1}))

const addRow = () => formStoreRows.value.push({key:String(Date.now()),store:'',personnel:[],template:''})
const delRow = (k:string) => { if(formStoreRows.value.length<=1){message.warning('至少保留一条配置记录');return}; formStoreRows.value=formStoreRows.value.filter(r=>r.key!==k) }

const resetForm = () => {
  formName.value='';formMode.value='online';formDesc.value=''
  formCycleMode.value='once'
  formOnceGenDate.value='';formOnceGenTime.value='';formOnceValidRange.value=null;formOnceDuration.value=null
  formCycleType.value='daily';formCycleTime.value='';formCycleWeekDays.value=[];formCycleMonthDays.value=[]
  formCycleValidRange.value=null;formCycleDuration.value=null
  formStoreRows.value=[{key:'1',store:'',personnel:[],template:''}]
  formAssignee.value=[]
  formReviewer.value=[]
}

const openAddDrawer = () => { drawerMode.value='add';editingPlanId.value=null;resetForm();drawerVisible.value=true }
const openEditDrawer = (plan:InspectionPlan) => {
  drawerMode.value='edit';editingPlanId.value=plan.id;resetForm()
  formName.value=plan.name;formMode.value=plan.inspectionMode;formDesc.value=plan.description||''
  formCycleMode.value=plan.cycleMode
  if(plan.cycleMode==='once'){ formOnceDuration.value=plan.duration?parseInt(plan.duration):null }
  else { formCycleType.value=plan.cycleType||'daily';formCycleTime.value=plan.executionTime||'';formCycleWeekDays.value=plan.cycleType==='weekly'?(plan.cycleDays||[]):[];formCycleMonthDays.value=plan.cycleType==='monthly'?(plan.cycleDays||[]):[];formCycleDuration.value=plan.duration?parseInt(plan.duration):null }
  formStoreRows.value=plan.storesPersonnelTemplates.map(s=>({key:s.key,store:s.storeName,personnel:[...s.personnelNames],template:s.templateName}))
  if(!formStoreRows.value.length) formStoreRows.value=[{key:'1',store:'',personnel:[],template:''}]
  formAssignee.value=plan.assigneeNames||[]
  formReviewer.value=plan.reviewerNames||[]
  drawerVisible.value=true
}

const handleSave = () => {
  if(!formName.value.trim()){message.warning('请输入计划名称');return}
  if(formStoreRows.value.some(r=>!r.store||!r.personnel.length||!r.template)){message.warning('每条配置记录的门店、巡检人、巡检模板均为必填');return}
  if(formCycleMode.value==='once'){
    if(!formOnceGenDate.value||!formOnceGenTime.value){message.warning('请选择任务生成时间');return}
    if(!formOnceDuration.value||formOnceDuration.value<=0){message.warning('请输入有效的执行时限');return}
  }else{
    if(!formCycleTime.value){message.warning('请选择具体时间');return}
    if(formCycleType.value==='weekly'&&!formCycleWeekDays.value.length){message.warning('请至少勾选一个执行日');return}
    if(formCycleType.value==='monthly'&&!formCycleMonthDays.value.length){message.warning('请至少勾选一个执行日');return}
    if(!formCycleValidRange.value){message.warning('请选择计划周期');return}
    if(!formCycleDuration.value||formCycleDuration.value<=0){message.warning('请输入有效的执行时限');return}
  }
  if(!formAssignee.value.length){message.warning('请选择问题指派人');return}
  if(!formReviewer.value.length){message.warning('请选择问题审核人');return}
  const now = new Date().toISOString().replace('T',' ').slice(0,19)
  const spt:StorePersonnelTemplate[]=formStoreRows.value.map(r=>({key:r.key,storeId:r.store,storeName:r.store,personnelIds:r.personnel,personnelNames:r.personnel,templateId:r.template,templateName:r.template}))
  const data:any={name:formName.value,inspectionMode:formMode.value,description:formDesc.value,cycleMode:formCycleMode.value,storesPersonnelTemplates:spt,assigneeIds:formAssignee.value,assigneeNames:formAssignee.value,reviewerIds:formReviewer.value,reviewerNames:formReviewer.value,updatedAt:now}
  if(formCycleMode.value==='once'){ data.executionTime=`${formOnceGenDate.value} ${formOnceGenTime.value}`;data.duration=`${formOnceDuration.value}小时` }
  else { data.cycleType=formCycleType.value;data.executionTime=formCycleTime.value;data.validUntil=formCycleValidRange.value?.[1]||'';data.duration=`${formCycleDuration.value}小时`;if(formCycleType.value==='weekly')data.cycleDays=formCycleWeekDays.value;if(formCycleType.value==='monthly')data.cycleDays=formCycleMonthDays.value }
  if(drawerMode.value==='edit'&&editingPlanId.value){const p=plans.value.find(x=>x.id===editingPlanId.value);if(p){Object.assign(p,data);message.success('巡检计划更新成功')}}
  else {plans.value.unshift({id:String(Date.now()),status:'not_started',creator:'当前用户',createdAt:now,...data} as InspectionPlan);message.success('巡检计划创建成功')}
  drawerVisible.value=false
}

// ========== 详情 ==========
const detailVisible=ref(false);const detailPlan=ref<InspectionPlan|null>(null)
const openDetail=(p:InspectionPlan)=>{detailPlan.value=p;detailVisible.value=true}

const weekDayNames = ['','周一','周二','周三','周四','周五','周六','周日']
const formatCycleDays = (plan: InspectionPlan) => {
  if (plan.cycleMode !== 'cycle' || !plan.cycleDays?.length) return ''
  if (plan.cycleType === 'weekly') return plan.cycleDays.map(d => weekDayNames[d]).join('、')
  if (plan.cycleType === 'monthly') return plan.cycleDays.map(d => `${d}号`).join('、')
  return ''
}

// ========== 删除 ==========
const getDeleteContent = (plan: InspectionPlan) => {
  if (plan.status === 'not_started') return '该计划尚未开始，删除后配置将被移除。'
  if (plan.status === 'in_progress') return '该计划正在执行中，已执行的巡检任务将永久保留，仅待执行任务会被清理。'
  return '该计划已结束，删除后配置将被移除，历史任务数据永久保留。'
}
const handleDelete=(plan:InspectionPlan)=>{Modal.confirm({title:'是否删除该巡检计划？',icon:()=>h(ExclamationCircleOutlined),content:getDeleteContent(plan),okText:'继续',cancelText:'取消',okButtonProps:{danger:true},onOk:()=>{plans.value=plans.value.filter(p=>p.id!==plan.id);message.success('巡检计划已删除')}})}
</script>

<template>
  <div class="plan-config">
    <div class="page-header"><a-button type="primary" @click="openAddDrawer"><PlusOutlined /> 新增计划</a-button></div>
    <a-table :columns="columns" :data-source="plans" row-key="id" :scroll="{x:1110}" :pagination="{pageSize:10,showTotal:(t:number)=>`共 ${t} 条`,showSizeChanger:true,pageSizeOptions:['10','20','50','100']}" size="middle">
      <template #headerCell="{column}">
        <template v-if="column.key==='status'">
          状态
          <a-popover title="计划状态说明" placement="bottom">
            <template #content>
              <div v-for="s in statusDescriptions" :key="s.key" style="margin-bottom:6px">
                <a-tag :color="statusMap[s.key]?.color" style="margin-right:6px">{{s.label}}</a-tag>{{s.desc}}
              </div>
            </template>
            <QuestionCircleOutlined style="color:#999;cursor:pointer;margin-left:4px;font-size:13px" />
          </a-popover>
        </template>
      </template>
      <template #bodyCell="{column,record}">
        <template v-if="column.key==='status'"><a-tag :color="statusMap[record.status]?.color">{{statusMap[record.status]?.label}}</a-tag></template>
        <template v-else-if="column.key==='cycle'">{{record.cycleMode==='once'?'单次':`循环/${cycleLabel[record.cycleType]}`||'-'}}</template>
        <template v-else-if="column.key==='mode'">{{modeLabel[record.inspectionMode]}}</template>
        <template v-else-if="column.key==='action'"><a-space><a-button type="link" size="small" @click="openEditDrawer(record)">编辑</a-button><a-button type="link" size="small" @click="openDetail(record)">详情</a-button><a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button></a-space></template>
        <template v-else-if="column.dataIndex"><span :style="{color: record[column.dataIndex] ? 'inherit' : '#ccc'}">{{ record[column.dataIndex] || '-' }}</span></template>
      </template>
    </a-table>

    <a-drawer v-model:open="drawerVisible" :title="drawerMode==='add'?'新增巡检计划':'编辑巡检计划'" size="large" :styles="{body:{paddingBottom:'80px'}}">
      <a-form :label-col="{span:5}" :wrapper-col="{span:17}">
        <!-- 基础信息 -->
        <a-form-item label="计划名称" required><a-input v-model:value="formName" placeholder="请输入计划名称" /></a-form-item>
        <a-form-item label="巡检方式" required>
          <a-radio-group v-model:value="formMode"><a-radio value="online">在线巡检</a-radio><a-radio value="offline">线下巡检</a-radio></a-radio-group>
        </a-form-item>
        <a-form-item label="计划说明"><a-textarea v-model:value="formDesc" :rows="3" placeholder="请输入计划说明" /></a-form-item>

        <!-- 循环方式 -->
        <a-form-item label="循环方式" required>
          <a-segmented v-model:value="formCycleMode" :options="[{label:'单次任务',value:'once'},{label:'循环任务',value:'cycle'}]" />
        </a-form-item>

        <!-- 单次任务 -->
        <template v-if="formCycleMode==='once'">
          <a-form-item label="任务生成时间" required>
            <a-space><a-date-picker v-model:value="formOnceGenDate" placeholder="选择日期" style="width:160px" /><a-time-picker v-model:value="formOnceGenTime" format="HH:mm" placeholder="选择时间" style="width:140px" /></a-space>
          </a-form-item>
          <a-form-item label="执行时限" required>
            <a-input-number v-model:value="formOnceDuration" :min="1" :max="720" style="width:120px" placeholder="小时数" /><span style="margin-left:8px;color:#666">小时</span>
            <div style="color:#999;font-size:12px;margin-top:4px">任务截止时间 = 生成时间 + 执行时限。巡检人需在截止时间前完成</div>
          </a-form-item>
        </template>

        <!-- 循环任务 -->
        <template v-if="formCycleMode==='cycle'">
          <a-form-item label="任务生成时间" required>
            <div style="margin-bottom:12px">
              <a-radio-group v-model:value="formCycleType" button-style="solid" size="small">
                <a-radio-button value="daily">每日</a-radio-button>
                <a-radio-button value="weekly">每周</a-radio-button>
                <a-radio-button value="monthly">每月</a-radio-button>
              </a-radio-group>
            </div>
            <!-- 每周：shaded panel -->
            <div v-if="formCycleType==='weekly'" class="cycle-panel">
              <a-checkbox-group v-model:value="formCycleWeekDays" :options="weekOpts" />
            </div>
            <!-- 每月：shaded panel -->
            <div v-if="formCycleType==='monthly'" class="cycle-panel">
              <a-checkbox-group v-model:value="formCycleMonthDays" :options="monthOpts" />
            </div>
            <a-time-picker v-model:value="formCycleTime" format="HH:mm" placeholder="选择时间" style="width:140px;margin-top:8px" />
          </a-form-item>
          <a-form-item label="计划周期" required><a-range-picker v-model:value="formCycleValidRange" style="width:320px" /></a-form-item>
          <a-form-item label="执行时限" required>
            <a-input-number v-model:value="formCycleDuration" :min="1" :max="720" style="width:120px" placeholder="小时数" /><span style="margin-left:8px;color:#666">小时</span>
            <div style="color:#999;font-size:12px;margin-top:4px">每条任务的截止时间 = 该期生成时间 + 执行时限。巡检人需在截止时间前完成</div>
          </a-form-item>
        </template>

        <!-- 巡检对象配置 -->
        <a-form-item label="巡检门店" required>
          <div class="store-table">
            <div class="st-head"><span class="sc">门店</span><span class="pc">巡检人</span><span class="tc">巡检模板</span><span class="ac">操作</span></div>
            <div v-for="r in formStoreRows" :key="r.key" class="st-row">
              <a-select v-model:value="r.store" placeholder="选择门店" style="width:100%" :options="mockStores.map(s=>({value:s,label:s}))" />
              <a-select v-model:value="r.personnel" mode="multiple" placeholder="选择巡检人" style="width:100%" :options="mockPersonnel.map(p=>({value:p,label:p}))" />
              <a-select v-model:value="r.template" placeholder="选择巡检模板" style="width:100%" :options="mockTemplates.map(t=>({value:t,label:t}))" />
              <a-button type="text" danger @click="delRow(r.key)"><DeleteOutlined /></a-button>
            </div>
            <div class="st-add" @click="addRow"><PlusOutlined /> 添加</div>
          </div>
        </a-form-item>

        <!-- 问题指派 -->
        <a-form-item label="问题指派" required>
          <a-select v-model:value="formAssignee" mode="multiple" placeholder="选择问题指派人" style="width:100%" :options="mockPersonnel.map(p=>({value:p,label:p}))" />
          <div style="color:#999;font-size:12px;margin-top:4px">巡检发现不合格项时，生成的整改工单默认指派给以上人员</div>
        </a-form-item>

        <!-- 问题审核指派 -->
        <a-form-item label="问题审核指派" required>
          <a-select v-model:value="formReviewer" mode="multiple" placeholder="选择问题审核人" style="width:100%" :options="mockPersonnel.map(p=>({value:p,label:p}))" />
          <div style="color:#999;font-size:12px;margin-top:4px">整改完成后，问题将指派给以上人员进行审核确认</div>
        </a-form-item>
      </a-form>
      <template #footer><a-space style="float:right"><a-button @click="drawerVisible=false">取消</a-button><a-button type="primary" @click="handleSave">保存</a-button></a-space></template>
    </a-drawer>

    <a-modal v-model:open="detailVisible" title="巡检计划详情" :footer="null" width="600px">
      <template v-if="detailPlan">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="计划名称" :span="2">{{detailPlan.name}}</a-descriptions-item>
          <a-descriptions-item label="状态"><a-tag :color="statusMap[detailPlan.status]?.color">{{statusMap[detailPlan.status]?.label}}</a-tag></a-descriptions-item>
          <a-descriptions-item label="巡检方式">{{modeLabel[detailPlan.inspectionMode]}}</a-descriptions-item>
          <a-descriptions-item label="循环方式">{{detailPlan.cycleMode==='once'?'单次':`循环/${cycleLabel[detailPlan.cycleType!]}`}}</a-descriptions-item>
          <a-descriptions-item label="执行日">{{ formatCycleDays(detailPlan) || '-' }}</a-descriptions-item>
          <a-descriptions-item label="任务生成时间">{{detailPlan.executionTime||'-'}}</a-descriptions-item>
          <a-descriptions-item label="计划周期">{{detailPlan.validUntil||'-'}}</a-descriptions-item>
          <a-descriptions-item label="执行时限">{{detailPlan.duration||'-'}}</a-descriptions-item>
          <a-descriptions-item label="计划说明" :span="2">{{detailPlan.description||'-'}}</a-descriptions-item>
          <a-descriptions-item label="问题指派人" :span="2">{{detailPlan.assigneeNames?.join('、')||'-'}}</a-descriptions-item>
          <a-descriptions-item label="审核指派人" :span="2">{{detailPlan.reviewerNames?.join('、')||'-'}}</a-descriptions-item>
          <a-descriptions-item label="巡检门店配置" :span="2">
            <template v-if="detailPlan.storesPersonnelTemplates?.length">
              <a-tag v-for="s in detailPlan.storesPersonnelTemplates" :key="s.key" style="margin:2px">{{s.storeName}} / {{s.personnelNames.join('、')}} / {{s.templateName}}</a-tag>
            </template>
            <span v-else>-</span>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.plan-config{padding:0}.page-header{margin-bottom:16px}
.store-table{border:1px solid #f0f0f0;border-radius:6px;overflow:hidden}
.st-head{display:flex;align-items:center;padding:10px 12px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-weight:500;font-size:13px;color:#333}
.st-row{display:flex;align-items:center;padding:8px 12px;gap:8px;border-bottom:1px solid #f0f0f0}
.sc,.pc,.tc{flex:1}.ac{width:48px;text-align:center}
.st-row>*{flex:1}.st-row>button{flex:0 0 32px}
.st-add{padding:10px 12px;color:#1677ff;cursor:pointer;border-top:1px dashed #d9d9d9;font-size:13px;display:flex;align-items:center;justify-content:center;gap:4px}
.st-add:hover{background:#f0f5ff}
.cycle-panel{background:#f6f8fa;border-radius:6px;padding:12px 16px;margin-bottom:8px}
</style>
