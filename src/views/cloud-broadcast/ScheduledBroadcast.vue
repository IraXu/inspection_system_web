<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import dayjs from 'dayjs'
import type { ScheduledBroadcastTask, TimeSlot } from '@/types'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ClockCircleOutlined, SoundOutlined,
} from '@antdv-next/icons'

// ========== 组织树 ==========
interface TreeNode { key: string; title: string; children?: TreeNode[] }
const regionTree: TreeNode[] = [
  { key: 'root', title: '鹤梦信息大中华区', children: [
    { key: 'huabei', title: '华北大区', children: [
      { key: 'beijing', title: '北京市', children: [
        { key: 'bj-cbd', title: 'CBD商圈', children: [
          { key: 'store-bj-1', title: 'xxx店铺a' }, { key: 'store-bj-2', title: 'xxx店铺b' },
        ]},
        { key: 'bj-zgc', title: '中关村商圈', children: [
          { key: 'store-bj-3', title: 'xxx店铺c' },
        ]},
      ]},
      { key: 'tianjin', title: '天津市', children: [
        { key: 'tj-bh', title: '滨海新区', children: [
          { key: 'store-tj-1', title: 'xxx店铺d' },
        ]},
      ]},
    ]},
    { key: 'huanan', title: '华南大区', children: [
      { key: 'guangzhou', title: '广州市', children: [
        { key: 'gz-th', title: '天河商圈', children: [
          { key: 'store-gz-1', title: 'xxx店铺e' },
        ]},
      ]},
    ]},
  ]},
]

// ========== 设备数据 ==========
interface DevItem { id:string; name:string; license:string; online:boolean; orgPath:string; regionPath:string[] }
const allDevices: DevItem[] = [
  { id:'d1',name:'1F入口摄像头-01',license:'LIC-BJ-20240001',online:true,orgPath:'华北大区 / 北京市 / CBD商圈',regionPath:['root','huabei','beijing','bj-cbd'] },
  { id:'d2',name:'1F入口摄像头-02',license:'LIC-BJ-20240002',online:true,orgPath:'华北大区 / 北京市 / CBD商圈',regionPath:['root','huabei','beijing','bj-cbd'] },
  { id:'d3',name:'2F大厅摄像头-01',license:'LIC-BJ-20240003',online:true,orgPath:'华北大区 / 北京市 / CBD商圈',regionPath:['root','huabei','beijing','bj-cbd'] },
  { id:'d4',name:'2F大厅摄像头-02',license:'LIC-BJ-20240004',online:false,orgPath:'华北大区 / 北京市 / CBD商圈',regionPath:['root','huabei','beijing','bj-cbd'] },
  { id:'d5',name:'3F走廊摄像头-01',license:'LIC-BJ-20240005',online:true,orgPath:'华北大区 / 北京市 / 中关村商圈',regionPath:['root','huabei','beijing','bj-zgc'] },
  { id:'d6',name:'3F走廊摄像头-02',license:'LIC-BJ-20240006',online:true,orgPath:'华北大区 / 北京市 / 中关村商圈',regionPath:['root','huabei','beijing','bj-zgc'] },
  { id:'d7',name:'B1停车场摄像头',license:'LIC-TJ-20240001',online:true,orgPath:'华北大区 / 天津市 / 滨海新区',regionPath:['root','huabei','tianjin','tj-bh'] },
  { id:'d8',name:'1F中庭摄像头',license:'LIC-TJ-20240002',online:false,orgPath:'华北大区 / 天津市 / 滨海新区',regionPath:['root','huabei','tianjin','tj-bh'] },
  { id:'d9',name:'1F入口摄像头',license:'LIC-GZ-20240001',online:true,orgPath:'华南大区 / 广州市 / 天河商圈',regionPath:['root','huanan','guangzhou','gz-th'] },
  { id:'d10',name:'2F专柜摄像头',license:'LIC-GZ-20240002',online:true,orgPath:'华南大区 / 广州市 / 天河商圈',regionPath:['root','huanan','guangzhou','gz-th'] },
  { id:'d11',name:'3F餐饮区摄像头',license:'LIC-GZ-20240003',online:true,orgPath:'华南大区 / 广州市 / 天河商圈',regionPath:['root','huanan','guangzhou','gz-th'] },
  { id:'d12',name:'1F大厅摄像头-A',license:'LIC-SH-20240001',online:true,orgPath:'华东大区 / 上海市 / 陆家嘴商圈',regionPath:['root','huadong','shanghai','sh-ljz'] },
  { id:'d13',name:'1F大厅摄像头-B',license:'LIC-SH-20240002',online:false,orgPath:'华东大区 / 上海市 / 陆家嘴商圈',regionPath:['root','huadong','shanghai','sh-ljz'] },
  { id:'d14',name:'2F专柜摄像头',license:'LIC-SH-20240003',online:true,orgPath:'华东大区 / 上海市 / 陆家嘴商圈',regionPath:['root','huadong','shanghai','sh-ljz'] },
  { id:'d15',name:'B2停车场摄像头',license:'LIC-SH-20240004',online:true,orgPath:'华东大区 / 上海市 / 陆家嘴商圈',regionPath:['root','huadong','shanghai','sh-ljz'] },
  { id:'d16',name:'1F入口摄像头-01',license:'LIC-CD-20240001',online:true,orgPath:'西南大区 / 成都市 / 春熙路商圈',regionPath:['root','xinan','chengdu','cd-chxl'] },
  { id:'d17',name:'1F入口摄像头-02',license:'LIC-CD-20240002',online:true,orgPath:'西南大区 / 成都市 / 春熙路商圈',regionPath:['root','xinan','chengdu','cd-chxl'] },
  { id:'d18',name:'2F中庭摄像头',license:'LIC-CD-20240003',online:false,orgPath:'西南大区 / 成都市 / 春熙路商圈',regionPath:['root','xinan','chengdu','cd-chxl'] },
]

// ========== 音频数据 ==========
interface AudioItem { id:string; name:string; categoryName:string; duration:number }
const allAudios: AudioItem[] = [
  { id:'a1',name:'开门迎宾-标准版',categoryName:'迎宾问候',duration:25 },
  { id:'a2',name:'促销活动-618大促',categoryName:'促销通知',duration:45 },
  { id:'a3',name:'安全提醒-消防通道',categoryName:'安全提醒',duration:18 },
  { id:'a4',name:'打烊提醒',categoryName:'迎宾问候',duration:15 },
  { id:'a5',name:'紧急疏散指引',categoryName:'安全提醒',duration:35 },
]

// ========== Mock 任务列表 ==========
const mockTasks: ScheduledBroadcastTask[] = [
  {
    id:'st1', name:'每日开门迎宾', dateRange:['2026-06-01','2026-12-31'],
    timeSlots:[{id:'ts1',time:'08:00'},{id:'ts2',time:'08:30'}],
    deviceIds:['d1','d2','d3','d5','d6','d9','d10'], deviceNames:['1F入口摄像头-01','1F入口摄像头-02','2F大厅摄像头-01','3F走廊摄像头-01','3F走廊摄像头-02','1F入口摄像头','2F专柜摄像头'],
    deviceCount:7, audioId:'a1', audioName:'开门迎宾-标准版', enabled:true,
    lastExecutedAt:'2026-06-16 08:00:02', updatedAt:'2026-06-15 16:30:00', lastOperator:'路飞', createdAt:'2026-06-01 10:00:00', creator:'路飞',
  },
  {
    id:'st2', name:'每日打烊提醒', dateRange:['2026-06-01','2026-12-31'],
    timeSlots:[{id:'ts3',time:'22:00'}],
    deviceIds:['d1','d2','d3','d4','d5','d6'], deviceNames:['1F入口摄像头-01','1F入口摄像头-02','2F大厅摄像头-01','2F大厅摄像头-02','3F走廊摄像头-01','3F走廊摄像头-02'],
    deviceCount:6, audioId:'a4', audioName:'打烊提醒', enabled:true,
    lastExecutedAt:'2026-06-15 22:00:01', updatedAt:'2026-06-14 09:15:00', lastOperator:'鸣人', createdAt:'2026-06-01 10:30:00', creator:'鸣人',
  },
  {
    id:'st3', name:'618大促整点播报', dateRange:['2026-06-15','2026-06-20'],
    timeSlots:[{id:'ts4',time:'10:00'},{id:'ts5',time:'12:00'},{id:'ts6',time:'14:00'},{id:'ts7',time:'16:00'},{id:'ts8',time:'18:00'}],
    deviceIds:['d1','d2','d3','d5','d6','d7','d9','d10'], deviceNames:['1F入口摄像头-01','1F入口摄像头-02','2F大厅摄像头-01','3F走廊摄像头-01','3F走廊摄像头-02','B1停车场摄像头','1F入口摄像头','2F专柜摄像头'],
    deviceCount:8, audioId:'a2', audioName:'促销活动-618大促', enabled:false,
    lastExecutedAt:undefined, updatedAt:'2026-06-14 15:00:00', lastOperator:'琦玉', createdAt:'2026-06-14 15:00:00', creator:'琦玉',
  },
]

const tasks = ref<ScheduledBroadcastTask[]>(JSON.parse(JSON.stringify(mockTasks)))
const searchName = ref('')

const filteredTasks = computed(() => {
  if (!searchName.value.trim()) return tasks.value
  return tasks.value.filter(t => t.name.includes(searchName.value.trim()))
})

const toggleEnabled = (t: ScheduledBroadcastTask) => {
  t.enabled = !t.enabled
  message.success(`任务已${t.enabled ? '启用' : '禁用'}`)
}

const handleDelete = (t: ScheduledBroadcastTask) => {
  tasks.value = tasks.value.filter(x => x.id !== t.id)
  message.success('任务已删除')
}

const formatDuration = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

// ========== 新建/编辑弹窗 ==========
const modalVisible = ref(false)
const modalMode = ref<'add'|'edit'>('add')
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  dateRange: null as any,
  timeSlots: [{ id: String(Date.now()), time: '' }] as TimeSlot[],
  selectedDeviceIds: [] as string[],
  audioId: null as string | null,
})

// 弹窗内 左树右表 选设备
const modalTreeKey = ref('')
const modalTreeExpanded = ref<string[]>(['root'])
const modalDevSearch = ref('')

const filteredDevicesForModal = computed(() => {
  let list = allDevices
  if (modalTreeKey.value && modalTreeKey.value !== 'root') {
    list = list.filter(d => d.regionPath.includes(modalTreeKey.value))
  }
  if (modalDevSearch.value.trim()) {
    const kw = modalDevSearch.value.trim().toLowerCase()
    list = list.filter(d => d.name.toLowerCase().includes(kw) || d.license.toLowerCase().includes(kw))
  }
  return list
})

const openAdd = () => {
  modalMode.value = 'add'; editingId.value = null
  form.name = ''; form.dateRange = null
  form.timeSlots = [{ id: String(Date.now()), time: '' }]
  form.selectedDeviceIds = []; form.audioId = null
  modalTreeKey.value = ''; modalDevSearch.value = ''
  modalVisible.value = true
}

const openEdit = (t: ScheduledBroadcastTask) => {
  modalMode.value = 'edit'; editingId.value = t.id
  form.name = t.name
  form.dateRange = [dayjs(t.dateRange[0]), dayjs(t.dateRange[1])] as any
  form.timeSlots = t.timeSlots.map(ts => ({ id: ts.id, time: ts.time }))
  form.selectedDeviceIds = [...t.deviceIds]; form.audioId = t.audioId
  modalTreeKey.value = ''; modalDevSearch.value = ''
  modalVisible.value = true
}

const addTimeSlot = () => {
  if (form.timeSlots.length >= 20) { message.warning('最多添加20个时间段'); return }
  form.timeSlots.push({ id: String(Date.now()), time: '' })
}
const removeTimeSlot = (idx: number) => { form.timeSlots.splice(idx, 1) }

const handleSave = () => {
  if (!form.name.trim()) { message.warning('请输入任务名称'); return }
  if (!form.dateRange) { message.warning('请选择日期范围'); return }
  if (form.timeSlots.every(ts => !ts.time)) { message.warning('请至少添加一个有效时间段'); return }
  if (form.selectedDeviceIds.length === 0) { message.warning('请选择至少一台目标设备'); return }
  if (!form.audioId) { message.warning('请选择播报音频'); return }

  const validSlots = form.timeSlots.filter(ts => ts.time)
  const devices = form.selectedDeviceIds.map(id => allDevices.find(d => d.id === id)!).filter(Boolean)
  const audio = allAudios.find(a => a.id === form.audioId)

  if (modalMode.value === 'edit' && editingId.value) {
    const t = tasks.value.find(x => x.id === editingId.value)
    if (t) {
      t.name = form.name
      t.dateRange = form.dateRange ? [form.dateRange[0].format('YYYY-MM-DD'), form.dateRange[1].format('YYYY-MM-DD')] : t.dateRange
      t.timeSlots = validSlots
      t.deviceIds = form.selectedDeviceIds; t.deviceNames = devices.map(d => d.name); t.deviceCount = devices.length
      t.audioId = form.audioId!; t.audioName = audio?.name || ''
      t.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      t.lastOperator = '当前用户'
    }
    message.success('任务编辑成功')
  } else {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    tasks.value.push({
      id: String(Date.now()), name: form.name,
      dateRange: form.dateRange ? [form.dateRange[0].format('YYYY-MM-DD'), form.dateRange[1].format('YYYY-MM-DD')] : ['',''],
      timeSlots: validSlots,
      deviceIds: form.selectedDeviceIds, deviceNames: devices.map(d => d.name), deviceCount: devices.length,
      audioId: form.audioId!, audioName: audio?.name || '',
      enabled: true, updatedAt: now, lastOperator: '当前用户', createdAt: now, creator: '当前用户',
    })
    message.success('任务创建成功')
  }
  modalVisible.value = false
}

// 生成时段选项（每30分钟）
const timeOptions = Array.from({length: 48}, (_, i) => {
  const h = String(Math.floor(i/2)).padStart(2,'0'), m = i%2===0?'00':'30'
  return `${h}:${m}`
})
</script>

<template>
  <div class="sb-page">
    <!-- 操作栏 -->
    <div class="tb">
      <a-space>
        <a-button type="primary" @click="openAdd"><PlusOutlined /> 新建任务</a-button>
        <a-input-search v-model:value="searchName" placeholder="搜索任务名称" style="width:220px" />
      </a-space>
    </div>

    <!-- 任务列表 -->
    <a-table
      :columns="[
        { title:'任务名称', dataIndex:'name', key:'name', width:140, ellipsis:true, align:'center' },
        { title:'日期范围', key:'dateRange', width:200, align:'center' },
        { title:'时间点', key:'timeSlots', width:185, align:'center' },
        { title:'设备数', dataIndex:'deviceCount', key:'deviceCount', width:55, align:'center' },
        { title:'音频', dataIndex:'audioName', key:'audioName', width:135, ellipsis:true, align:'center' },
        { title:'最近更新', dataIndex:'updatedAt', key:'updatedAt', width:145, align:'center' },
        { title:'操作人', dataIndex:'lastOperator', key:'lastOperator', width:65, align:'center' },
        { title:'启用', dataIndex:'enabled', key:'enabled', width:50, align:'center' },
        { title:'操作', key:'actions', width:105, fixed:'right', align:'center' },
      ]"
      :data-source="filteredTasks" row-key="id"
      :scroll="{ x: 1080 }"
      :pagination="{ pageSize:10, showSizeChanger:true, showTotal:(t:number)=>`共 ${t} 条` }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dateRange'">
          {{ record.dateRange[0] }} ~ {{ record.dateRange[1] }}
        </template>
        <template v-else-if="column.key === 'timeSlots'">
          <span v-if="record.timeSlots && record.timeSlots.length > 0" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
            <span
              v-for="ts in record.timeSlots" :key="ts.id"
              style="display:inline-flex;align-items:center;gap:3px;background:#e6f4ff;color:#1677ff;border:1px solid #91caff;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:500;white-space:nowrap"
            >
              <ClockCircleOutlined style="font-size:12px" />{{ ts.time }}
            </span>
          </span>
          <span v-else style="color:#ccc">—</span>
        </template>
        <template v-else-if="column.key === 'enabled'">
          <a-switch :checked="record.enabled" size="small" @change="toggleEnabled(record)" />
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button type="link" size="small" @click="openEdit(record)"><EditOutlined /> 编辑</a-button>
            <a-popconfirm title="是否删除此定时广播任务？删除后不可恢复" @confirm="handleDelete(record)" cancelText="取消" okText="确定">
              <a-button type="link" danger size="small"><DeleteOutlined /> 删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalMode === 'add' ? '新建定时广播任务' : '编辑定时广播任务'" width="950px" @ok="handleSave" :destroyOnHidden="true" cancelText="取消" okText="确定">
      <a-form :label-col="{ flex: '90px' }" :wrapper-col="{ flex: 'auto' }">
        <a-form-item label="任务名称" required>
          <a-input v-model:value="form.name" placeholder="例如：每日开门迎宾" :maxlength="50" show-count />
        </a-form-item>
        <a-form-item label="日期范围" required>
          <a-range-picker v-model:value="form.dateRange" style="width:100%" />
        </a-form-item>
        <a-form-item label="时间点" required>
          <div style="width:100%">
            <a-row :gutter="8" v-for="(ts,idx) in form.timeSlots" :key="ts.id" style="margin-bottom:6px">
              <a-col :span="6">
                <a-select v-model:value="ts.time" :options="timeOptions.map(t=>({value:t,label:t}))" placeholder="选择时间" style="width:100%" show-search />
              </a-col>
              <a-col :span="2">
                <a-button v-if="form.timeSlots.length > 1" type="link" danger size="small" @click="removeTimeSlot(idx)">移除</a-button>
              </a-col>
            </a-row>
            <a-button type="dashed" size="small" @click="addTimeSlot" :disabled="form.timeSlots.length >= 20"><PlusOutlined /> 添加时间点</a-button>
          </div>
        </a-form-item>
        <a-form-item label="目标设备" required>
          <a-row :gutter="12">
            <a-col :span="7">
              <div class="modal-tree-wrap">
                <a-tree
                  :tree-data="regionTree"
                  :expanded-keys="modalTreeExpanded"
                  :selected-keys="modalTreeKey ? [modalTreeKey] : []"
                  :field-names="{ children:'children', title:'title', key:'key' }"
                  show-line block-node
                  @select="(keys:any[])=>modalTreeKey=keys[0] || undefined"
                  @expand="(keys:any[])=>modalTreeExpanded=keys"
                />
              </div>
            </a-col>
            <a-col :span="17">
              <a-input-search v-model:value="modalDevSearch" placeholder="搜索设备名称/License" size="small" style="margin-bottom:8px;width:220px" />
              <a-tag color="blue" style="margin-left:8px;margin-bottom:8px">已选 {{ form.selectedDeviceIds.length }} 台</a-tag>
              <a-table
                :columns="[
                  { title:'设备名称', dataIndex:'name', key:'name', ellipsis:true },
                  { title:'License', dataIndex:'license', key:'license', width:150 },
                  { title:'状态', key:'status', width:60, align:'center' },
                ]"
                :data-source="filteredDevicesForModal"
                :row-selection="{ selectedRowKeys: form.selectedDeviceIds, onChange: (keys:any[])=>form.selectedDeviceIds=keys }"
                row-key="id" size="small"
                :pagination="{ pageSize:8, size:'small', showTotal:(t:number)=>`共 ${t} 台` }"
                :scroll="{ y:260 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <a-badge :status="record.online?'success':'default'" :text="record.online?'在线':'离线'" />
                  </template>
                </template>
              </a-table>
            </a-col>
          </a-row>
        </a-form-item>
        <a-form-item label="播报音频" required>
          <a-select
            v-model:value="form.audioId"
            placeholder="请选择播报音频"
            style="width:100%"
            :options="allAudios.map(a=>({value:a.id,label:`${a.name}（${a.categoryName} | ${formatDuration(a.duration)}）`}))"
            show-search
            :filter-option="(input:string, option:any)=>option.label.toLowerCase().includes(input.toLowerCase())"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.tb { margin-bottom:16px; }

.modal-tree-wrap {
  border:1px solid #f0f0f0; border-radius:6px; padding:6px; height:320px; overflow:auto;
}
.modal-tree-wrap :deep(.ant-tree-node-content-wrapper) {
  white-space: nowrap;
}
</style>
