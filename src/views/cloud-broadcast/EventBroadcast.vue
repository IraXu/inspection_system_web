<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import type { EventBroadcastRule, EventType } from '@/types'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  SoundOutlined,
} from '@antdv-next/icons'

// ========== Mock数据 ==========
const mockRules: EventBroadcastRule[] = [
  {
    id:'er1', name:'消防告警→全区域疏散', eventType:'alarm', eventTypeLabel:'告警事件',
    deviceIds:['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10'],
    deviceNames:['1F入口摄像头-01','1F入口摄像头-02','2F大厅摄像头-01','2F大厅摄像头-02','3F走廊摄像头-01','3F走廊摄像头-02','B1停车场摄像头','1F中庭摄像头','1F入口摄像头','2F专柜摄像头'],
    deviceCount:10, audioId:'a5', audioName:'紧急疏散指引', enabled:true,
    createdAt:'2026-06-05 09:00:00', creator:'安全管理员',
  },
  {
    id:'er2', name:'AI违规闯入→警告驱离', eventType:'ai_event', eventTypeLabel:'AI事件',
    deviceIds:['d1','d2','d3','d5','d6'],
    deviceNames:['1F入口摄像头-01','1F入口摄像头-02','2F大厅摄像头-01','3F走廊摄像头-01','3F走廊摄像头-02'],
    deviceCount:5, audioId:'a3', audioName:'安全提醒-消防通道', enabled:true,
    createdAt:'2026-06-08 14:00:00', creator:'安全管理员',
  },
  {
    id:'er3', name:'设备离线→通知运维', eventType:'device_event', eventTypeLabel:'设备事件',
    deviceIds:['d1','d2'],
    deviceNames:['1F入口摄像头-01','1F入口摄像头-02'],
    deviceCount:2, audioId:'a1', audioName:'开门迎宾-标准版', enabled:false,
    createdAt:'2026-06-10 10:00:00', creator:'安全管理员',
  },
]
const rules = ref([...mockRules])
const searchName = ref('')

const filteredRules = computed(() => {
  if (!searchName.value.trim()) return rules.value
  return rules.value.filter(r => r.name.includes(searchName.value.trim()))
})

// ========== 事件类型（取自当前企业已添加设备支持的事件类型） ==========
const eventTypeOptions = [
  { value:'alarm', label:'消防告警' },
  { value:'smoke', label:'烟感告警' },
  { value:'intrusion', label:'入侵检测' },
  { value:'ai_event', label:'AI违规行为' },
  { value:'device_event', label:'设备离线/故障' },
  { value:'temp', label:'温度异常' },
  { value:'manual', label:'手动触发' },
]

// ========== 组织树 ==========
interface TreeNode { key: string; title: string; children?: TreeNode[] }
const regionTree: TreeNode[] = [
  { key: 'root', title: '鹤梦信息大中华区', children: [
    { key: 'huabei', title: '华北大区', children: [
      { key: 'beijing', title: '北京市', children: [
        { key: 'bj-cbd', title: 'CBD商圈' }, { key: 'bj-zgc', title: '中关村商圈' },
      ]},
      { key: 'tianjin', title: '天津市', children: [{ key: 'tj-bh', title: '滨海新区' }] },
    ]},
    { key: 'huanan', title: '华南大区', children: [
      { key: 'guangzhou', title: '广州市', children: [{ key: 'gz-th', title: '天河商圈' }] },
    ]},
    { key: 'huadong', title: '华东大区', children: [
      { key: 'shanghai', title: '上海市', children: [{ key: 'sh-ljz', title: '陆家嘴商圈' }] },
    ]},
    { key: 'xinan', title: '西南大区', children: [
      { key: 'chengdu', title: '成都市', children: [{ key: 'cd-chxl', title: '春熙路商圈' }] },
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
interface AudioItem { id:string; name:string; cat:string; dur:number }
const allAudios: AudioItem[] = [
  { id:'a1',name:'开门迎宾-标准版',cat:'迎宾问候',dur:25 },
  { id:'a3',name:'安全提醒-消防通道',cat:'安全提醒',dur:18 },
  { id:'a5',name:'紧急疏散指引',cat:'安全提醒',dur:35 },
]

// ========== 弹窗：新建/编辑规则 ==========
const modalVisible = ref(false)
const modalMode = ref<'add'|'edit'>('add')
const editingId = ref<string | null>(null)
const ruleForm = reactive({
  name: '',
  eventType: 'alarm' as EventType,
  selectedDeviceIds: [] as string[],
  audioId: null as string | null,
})

// 设备选择：左树+右表
const modalTreeKey = ref('')
const modalTreeExpanded = ref<string[]>(['root'])
const modalDevSearch = ref('')
const filteredDevicesForModal = computed(() => {
  let list = allDevices
  if (modalTreeKey.value && modalTreeKey.value !== 'root') list = list.filter(d => d.regionPath.includes(modalTreeKey.value))
  if (modalDevSearch.value.trim()) {
    const kw = modalDevSearch.value.trim().toLowerCase()
    list = list.filter(d => d.name.toLowerCase().includes(kw) || d.license.toLowerCase().includes(kw))
  }
  return list
})

const openAdd = () => {
  modalMode.value = 'add'; editingId.value = null
  ruleForm.name = ''; ruleForm.eventType = 'alarm'
  ruleForm.selectedDeviceIds = []; ruleForm.audioId = null
  modalTreeKey.value = ''; modalDevSearch.value = ''
  modalVisible.value = true
}
const openEdit = (r: EventBroadcastRule) => {
  modalMode.value = 'edit'; editingId.value = r.id
  ruleForm.name = r.name; ruleForm.eventType = r.eventType
  ruleForm.selectedDeviceIds = [...r.deviceIds]; ruleForm.audioId = r.audioId
  modalTreeKey.value = ''; modalDevSearch.value = ''
  modalVisible.value = true
}
const handleDelete = (r: EventBroadcastRule) => {
  rules.value = rules.value.filter(x => x.id !== r.id)
  message.success('规则已删除')
}
const toggleEnabled = (r: EventBroadcastRule) => {
  r.enabled = !r.enabled
  message.success(`规则已${r.enabled ? '启用' : '禁用'}`)
}

const handleSave = () => {
  if (!ruleForm.name.trim()) { message.warning('请输入规则名称'); return }
  if (!ruleForm.eventType) { message.warning('请选择事件类型'); return }
  if (ruleForm.selectedDeviceIds.length === 0) { message.warning('请选择至少一台目标设备'); return }
  if (!ruleForm.audioId) { message.warning('请选择播报音频'); return }

  const audio = allAudios.find(a => a.id === ruleForm.audioId)
  const devices = ruleForm.selectedDeviceIds.map(id => allDevices.find(d => d.id === id)!).filter(Boolean)
  const etLabel = eventTypeOptions.find(e => e.value === ruleForm.eventType)!.label

  if (modalMode.value === 'edit' && editingId.value) {
    const r = rules.value.find(x => x.id === editingId.value)
    if (r) {
      r.name = ruleForm.name; r.eventType = ruleForm.eventType; r.eventTypeLabel = etLabel
      r.deviceIds = ruleForm.selectedDeviceIds; r.deviceNames = devices.map(d => d.name); r.deviceCount = devices.length
      r.audioId = ruleForm.audioId!; r.audioName = audio?.name || ''
    }
    message.success('规则编辑成功')
  } else {
    rules.value.push({
      id: String(Date.now()), name: ruleForm.name,
      eventType: ruleForm.eventType, eventTypeLabel: etLabel,
      deviceIds: ruleForm.selectedDeviceIds, deviceNames: devices.map(d => d.name), deviceCount: devices.length,
      audioId: ruleForm.audioId!, audioName: audio?.name || '',
      enabled: true, createdAt: new Date().toISOString(), creator: '当前用户',
    })
    message.success('规则创建成功')
  }
  modalVisible.value = false
}

const formatDuration = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

// 事件类型标签颜色映射
const eventColor = (t: string) => {
  const m: Record<string,string> = { alarm:'red', smoke:'volcano', intrusion:'magenta', ai_event:'purple', device_event:'orange', temp:'gold', manual:'blue' }
  return m[t] || 'default'
}
</script>

<template>
  <div class="event-broadcast">
    <div class="toolbar">
      <a-space>
        <a-button type="primary" @click="openAdd"><PlusOutlined /> 新建规则</a-button>
        <a-input-search v-model:value="searchName" placeholder="搜索规则名称" style="width:240px" />
      </a-space>
    </div>

    <a-table :columns="[
      { title:'规则名称', dataIndex:'name', key:'name', width:220, align:'center', ellipsis:true },
      { title:'事件类型', dataIndex:'eventTypeLabel', key:'eventTypeLabel', width:110, align:'center' },
      { title:'目标设备数', dataIndex:'deviceCount', key:'deviceCount', width:90, align:'center' },
      { title:'播报音频', dataIndex:'audioName', key:'audioName', width:160, align:'center', ellipsis:true },
      { title:'创建时间', dataIndex:'createdAt', key:'createdAt', width:160, align:'center' },
      { title:'创建人', dataIndex:'creator', key:'creator', width:90, align:'center' },
      { title:'启用', dataIndex:'enabled', key:'enabled', width:60, align:'center' },
      { title:'操作', key:'actions', width:130, align:'center', fixed:'right' },
    ]" :data-source="filteredRules" row-key="id" :scroll="{ x: 1020 }" :pagination="{ pageSize:10, showSizeChanger:true, showTotal:(t:number)=>`共 ${t} 条` }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'eventTypeLabel'">
          <a-tag :color="eventColor(record.eventType)">{{ record.eventTypeLabel }}</a-tag>
        </template>
        <template v-else-if="column.key === 'enabled'">
          <a-switch :checked="record.enabled" size="small" @change="toggleEnabled(record)" />
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button type="link" size="small" @click="openEdit(record)"><EditOutlined /> 编辑</a-button>
            <a-popconfirm title="是否删除此事件广播规则？删除后对应的自动触发将失效" @confirm="handleDelete(record)" cancelText="取消" okText="确定">
              <a-button type="link" danger size="small"><DeleteOutlined /> 删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新建/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalMode==='add'?'新建事件广播规则':'编辑事件广播规则'" width="950px" @ok="handleSave" :destroyOnHidden="true" cancelText="取消" okText="确定">
      <a-form :label-col="{ flex: '90px' }" :wrapper-col="{ flex: 'auto' }">
        <a-form-item label="规则名称" required>
          <a-input v-model:value="ruleForm.name" placeholder="例如：消防告警→全区域疏散" :maxlength="50" show-count />
        </a-form-item>
        <a-form-item label="事件类型" required>
          <a-select v-model:value="ruleForm.eventType" :options="eventTypeOptions" style="width:200px" />
        </a-form-item>
        <a-form-item label="目标设备" required>
          <a-row :gutter="12">
            <a-col :span="7">
              <div class="ev-modal-tree-wrap">
                <a-tree
                  :tree-data="regionTree"
                  :expanded-keys="modalTreeExpanded"
                  :selected-keys="modalTreeKey ? [modalTreeKey] : []"
                  :field-names="{ children:'children', title:'title', key:'key' }"
                  show-line block-node
                  @select="(keys:any[])=>modalTreeKey=keys[0]||''"
                  @expand="(keys:any[])=>modalTreeExpanded=keys"
                />
              </div>
            </a-col>
            <a-col :span="17">
              <a-input-search v-model:value="modalDevSearch" placeholder="搜索设备名称/License" size="small" style="margin-bottom:8px;width:220px" />
              <a-tag color="blue" style="margin-left:8px;margin-bottom:8px">已选 {{ ruleForm.selectedDeviceIds.length }} 台</a-tag>
              <a-table
                :columns="[
                  { title:'设备名称', dataIndex:'name', key:'name', ellipsis:true },
                  { title:'License', dataIndex:'license', key:'license', width:150 },
                  { title:'状态', key:'status', width:60, align:'center' },
                ]"
                :data-source="filteredDevicesForModal"
                :row-selection="{ selectedRowKeys: ruleForm.selectedDeviceIds, onChange: (keys:any[])=>ruleForm.selectedDeviceIds=keys }"
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
            v-model:value="ruleForm.audioId"
            placeholder="请选择播报音频"
            style="width:100%"
            :options="allAudios.map(a=>({value:a.id,label:`${a.name}（${a.cat} | ${formatDuration(a.dur)}）`}))"
            show-search
            :filter-option="(input:string, option:any)=>option.label.toLowerCase().includes(input.toLowerCase())"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.event-broadcast { padding:0; }
.toolbar { margin-bottom:16px; }

.ev-modal-tree-wrap {
  border:1px solid #f0f0f0; border-radius:6px; padding:6px; height:320px; overflow:auto;
}
.ev-modal-tree-wrap :deep(.ant-tree-node-content-wrapper) {
  white-space: nowrap;
}
</style>
