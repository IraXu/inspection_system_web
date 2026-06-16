<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import type { BroadcastRecord, BroadcastType, BroadcastStatus } from '@/types'
import {
  SearchOutlined, ReloadOutlined, EyeOutlined,
  CheckCircleFilled, CloseCircleFilled, MinusCircleFilled,
  ExclamationCircleOutlined, StopOutlined, ClockCircleOutlined,
  SyncOutlined, DownloadOutlined, SoundOutlined,
} from '@antdv-next/icons'

// ========== Mock数据 ==========
const mockRecords: BroadcastRecord[] = [
  {
    id:'r1', broadcastType:'realtime', broadcastTypeLabel:'实时广播', initiator:'路飞',
    targetDeviceCount:6, successCount:6, failCount:0, audioName:'实时喊话 (0:25)',
    status:'completed', startedAt:'2026-06-16 14:30:00', endedAt:'2026-06-16 14:30:28',
    deviceResults:[
      { deviceId:'d1',deviceName:'1F入口摄像头-01',status:'success',startedAt:'14:30:00',endedAt:'14:30:25' },
      { deviceId:'d2',deviceName:'1F入口摄像头-02',status:'success',startedAt:'14:30:01',endedAt:'14:30:26' },
      { deviceId:'d3',deviceName:'2F大厅摄像头-01',status:'success',startedAt:'14:30:00',endedAt:'14:30:25' },
      { deviceId:'d5',deviceName:'3F走廊摄像头-01',status:'success',startedAt:'14:30:01',endedAt:'14:30:26' },
      { deviceId:'d6',deviceName:'3F走廊摄像头-02',status:'success',startedAt:'14:30:00',endedAt:'14:30:25' },
      { deviceId:'d9',deviceName:'1F入口摄像头',status:'success',startedAt:'14:30:01',endedAt:'14:30:26' },
    ],
  },
  {
    id:'r2', broadcastType:'scheduled', broadcastTypeLabel:'定时广播', initiator:'系统-定时任务',
    targetDeviceCount:7, successCount:5, failCount:2, audioName:'开门迎宾-标准版',
    status:'partial_failed', startedAt:'2026-06-16 08:00:00', endedAt:'2026-06-16 08:00:27',
    deviceResults:[
      { deviceId:'d1',deviceName:'1F入口摄像头-01',status:'success',startedAt:'08:00:00',endedAt:'08:00:25' },
      { deviceId:'d2',deviceName:'1F入口摄像头-02',status:'success',startedAt:'08:00:00',endedAt:'08:00:25' },
      { deviceId:'d3',deviceName:'2F大厅摄像头-01',status:'success',startedAt:'08:00:00',endedAt:'08:00:25' },
      { deviceId:'d4',deviceName:'2F大厅摄像头-02',status:'failed',reason:'设备离线' },
      { deviceId:'d5',deviceName:'3F走廊摄像头-01',status:'success',startedAt:'08:00:00',endedAt:'08:00:25' },
      { deviceId:'d8',deviceName:'1F中庭摄像头',status:'failed',reason:'设备离线' },
      { deviceId:'d9',deviceName:'1F入口摄像头',status:'success',startedAt:'08:00:01',endedAt:'08:00:26' },
    ],
  },
  {
    id:'r3', broadcastType:'event', broadcastTypeLabel:'事件广播', initiator:'消防告警触发',
    targetDeviceCount:10, successCount:10, failCount:0, audioName:'紧急疏散指引',
    status:'completed', startedAt:'2026-06-15 14:23:05', endedAt:'2026-06-15 14:23:37',
    deviceResults: Array.from({length:10}, (_, i) => ({ deviceId:`d${i+1}`,deviceName:`设备-${i+1}`,status:'success' as const })),
  },
  {
    id:'r4', broadcastType:'realtime', broadcastTypeLabel:'实时广播', initiator:'佐助',
    targetDeviceCount:3, successCount:3, failCount:0, audioName:'促销活动-618大促',
    status:'completed', startedAt:'2026-06-15 10:00:00', endedAt:'2026-06-15 10:00:46',
    deviceResults: [
      { deviceId:'d7',deviceName:'B1停车场摄像头',status:'success' },
      { deviceId:'d9',deviceName:'1F入口摄像头',status:'success' },
      { deviceId:'d10',deviceName:'2F专柜摄像头',status:'success' },
    ],
  },
  {
    id:'r5', broadcastType:'event', broadcastTypeLabel:'事件广播', initiator:'AI违规闯入触发',
    targetDeviceCount:5, successCount:3, failCount:2, audioName:'安全提醒-消防通道',
    status:'partial_failed', startedAt:'2026-06-14 09:15:32', endedAt:'2026-06-14 09:15:50',
    deviceResults:[
      { deviceId:'d1',deviceName:'1F入口摄像头-01',status:'success' },
      { deviceId:'d2',deviceName:'1F入口摄像头-02',status:'success' },
      { deviceId:'d3',deviceName:'2F大厅摄像头-01',status:'success' },
      { deviceId:'d5',deviceName:'3F走廊摄像头-01',status:'failed',reason:'网络超时' },
      { deviceId:'d6',deviceName:'3F走廊摄像头-02',status:'failed',reason:'设备正忙' },
    ],
  },
  {
    id:'r6', broadcastType:'realtime', broadcastTypeLabel:'实时广播', initiator:'路飞',
    targetDeviceCount:2, successCount:0, failCount:0, audioName:'实时喊话',
    status:'cancelled', startedAt:'2026-06-14 08:05:00',
    deviceResults:[
      { deviceId:'d1',deviceName:'1F入口摄像头-01',status:'failed',reason:'用户手动停止' },
      { deviceId:'d2',deviceName:'1F入口摄像头-02',status:'failed',reason:'用户手动停止' },
    ],
  },
]

// ========== 筛选 ==========
const filterType = ref<string>('all')
const filterStatus = ref<string>('all')
const dateRange = ref<[string, string] | null>(null)
const searchInitiator = ref('')
const searchAudio = ref('')

const filteredRecords = computed(() => {
  let list = mockRecords
  if (filterType.value !== 'all') list = list.filter(r => r.broadcastType === filterType.value)
  if (filterStatus.value !== 'all') list = list.filter(r => r.status === filterStatus.value)
  if (searchInitiator.value.trim()) {
    const kw = searchInitiator.value.trim().toLowerCase()
    list = list.filter(r => r.initiator.toLowerCase().includes(kw))
  }
  if (searchAudio.value.trim()) {
    const kw = searchAudio.value.trim().toLowerCase()
    list = list.filter(r => r.audioName.toLowerCase().includes(kw))
  }
  return list
})

const handleReset = () => {
  filterType.value = 'all'; filterStatus.value = 'all'
  dateRange.value = null; searchInitiator.value = ''; searchAudio.value = ''
}

// ========== 详情抽屉 ==========
const detailVisible = ref(false)
const detailRecord = ref<BroadcastRecord | null>(null)

const openDetail = (record: BroadcastRecord) => {
  detailRecord.value = record
  detailVisible.value = true
}

// ========== 失败重试 ==========
const retryFailed = (record: BroadcastRecord) => {
  const failedDevices = record.deviceResults.filter(r => r.status === 'failed')
  failedDevices.forEach(r => { r.status = 'success'; delete r.reason })
  record.successCount += record.failCount
  record.failCount = 0
  record.status = 'completed'
  message.success(`已重试 ${failedDevices.length} 台设备，全部成功`)
}

// ========== 导出 ==========
const handleExport = () => {
  message.success('导出成功，请查看下载列表')
}

const statusColor = (status: BroadcastStatus) => {
  const map: Record<string, string> = {
    completed:'green', partial_failed:'orange', failed:'red',
    interrupted:'default', cancelled:'default', queued:'blue', executing:'processing',
  }
  return map[status] || 'default'
}
const statusLabel = (status: BroadcastStatus) => {
  const map: Record<string, string> = {
    completed:'已完成', partial_failed:'部分失败', failed:'全部失败',
    interrupted:'已中断', cancelled:'已取消', queued:'排队中', executing:'执行中',
  }
  return map[status] || status
}
</script>

<template>
  <div class="broadcast-records">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-space wrap>
        <a-select v-model:value="filterType" style="width:150px" :options="[
          {value:'all',label:'全部类型'},
          {value:'realtime',label:'实时广播'},
          {value:'scheduled',label:'定时广播'},
          {value:'event',label:'事件广播'},
        ]" />
        <a-select v-model:value="filterStatus" style="width:150px" :options="[
          {value:'all',label:'全部状态'},
          {value:'completed',label:'已完成'},
          {value:'partial_failed',label:'部分失败'},
          {value:'failed',label:'全部失败'},
          {value:'interrupted',label:'已中断'},
          {value:'cancelled',label:'已取消'},
        ]" />
        <a-range-picker v-model:value="dateRange" style="width:250px" />
        <a-input v-model:value="searchInitiator" placeholder="发起人/触发源" style="width:150px" allow-clear />
        <a-input v-model:value="searchAudio" placeholder="音频名称" style="width:150px" allow-clear />
        <a-button @click="handleReset"><ReloadOutlined /> 重置</a-button>
        <a-button @click="handleExport"><DownloadOutlined /> 导出</a-button>
      </a-space>
    </div>

    <!-- 记录列表 -->
    <a-table :columns="[
      { title:'广播类型', dataIndex:'broadcastTypeLabel', key:'broadcastTypeLabel', width:100, align:'center' },
      { title:'发起人/触发源', dataIndex:'initiator', key:'initiator', width:150, align:'center', ellipsis:true },
      { title:'成功/失败/总数', key:'devices', width:130, align:'center' },
      { title:'播报音频', dataIndex:'audioName', key:'audioName', width:170, align:'center', ellipsis:true },
      { title:'开始时间', dataIndex:'startedAt', key:'startedAt', width:170, align:'center' },
      { title:'状态', dataIndex:'status', key:'status', width:100, align:'center' },
      { title:'操作', key:'actions', width:150, align:'center', fixed:'right' },
    ]" :data-source="filteredRecords" row-key="id" :scroll="{ x: 970 }" :pagination="{ pageSize:10, showSizeChanger:true, showTotal:(t:number)=>`共 ${t} 条` }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'broadcastTypeLabel'">
          <a-tag :color="record.broadcastType === 'event' ? 'red' : record.broadcastType === 'realtime' ? 'blue' : 'green'">
            {{ record.broadcastTypeLabel }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'devices'">
          <span style="color:#52c41a;font-weight:500">{{ record.successCount }}</span>
          <span style="color:#ccc;margin:0 4px">/</span>
          <span :style="{ color: record.failCount > 0 ? '#ff4d4f' : '#ccc', fontWeight: record.failCount > 0 ? 500 : 400 }">{{ record.failCount }}</span>
          <span style="color:#ccc;margin:0 4px">/</span>
          <span style="color:#666">{{ record.targetDeviceCount }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-badge :status="statusColor(record.status) as any" :text="statusLabel(record.status)" />
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button type="link" size="small" @click="openDetail(record)"><EyeOutlined /> 详情</a-button>
            <a-button
              v-if="record.status === 'partial_failed' || record.status === 'failed'"
              type="link" size="small"
              @click="retryFailed(record)"
            ><ReloadOutlined /> 重试</a-button>

          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="广播记录详情"
      placement="right"
      :width="600"
    >
      <template v-if="detailRecord">
        <a-descriptions :column="1" bordered size="small" style="margin-bottom:16px" :label-style="{ width:'110px', whiteSpace:'nowrap', fontWeight:500 }" :content-style="{ whiteSpace:'nowrap' }">
          <a-descriptions-item label="广播类型">
            <a-tag :color="detailRecord.broadcastType === 'event' ? 'red' : detailRecord.broadcastType === 'realtime' ? 'blue' : 'green'">
              {{ detailRecord.broadcastTypeLabel }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="执行状态">
            <a-badge :status="statusColor(detailRecord.status) as any" :text="statusLabel(detailRecord.status)" />
          </a-descriptions-item>
          <a-descriptions-item label="发起人/触发源">{{ detailRecord.initiator || '—' }}</a-descriptions-item>
          <a-descriptions-item label="播报音频"><SoundOutlined /> {{ detailRecord.audioName || '—' }}</a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ detailRecord.startedAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="结束时间">{{ detailRecord.endedAt || '—' }}</a-descriptions-item>
          <a-descriptions-item label="目标设备数">{{ detailRecord.targetDeviceCount || 0 }}</a-descriptions-item>
          <a-descriptions-item label="成功 / 失败">
            <span style="color:#52c41a;font-weight:500">{{ detailRecord.successCount }}</span>
            <span style="color:#ccc;margin:0 6px">/</span>
            <span :style="{ color: detailRecord.failCount > 0 ? '#ff4d4f' : '#ccc', fontWeight: detailRecord.failCount > 0 ? 500 : 400 }">{{ detailRecord.failCount || 0 }}</span>
          </a-descriptions-item>
        </a-descriptions>

        <h4 style="margin:16px 0 10px;font-size:14px">设备执行明细</h4>
        <a-table
          :columns="[
            { title:'设备名称', dataIndex:'deviceName', key:'deviceName', ellipsis:true, width:180 },
            { title:'状态', dataIndex:'status', key:'status', width:70, align:'center' },
            { title:'原因', dataIndex:'reason', key:'reason', width:120, ellipsis:true },
            { title:'开始', dataIndex:'startedAt', key:'startedAt', width:85, align:'center' },
            { title:'结束', dataIndex:'endedAt', key:'endedAt', width:85, align:'center' },
          ]"
          :data-source="detailRecord.deviceResults"
          row-key="deviceId"
          size="small"
          :pagination="false"
          :scroll="{ y: 360 }"
        >
          <template #bodyCell="{ column, record: dr }">
            <template v-if="column.key === 'status'">
              <a-tag v-if="dr.status === 'success'" color="success">成功</a-tag>
              <a-tag v-else color="error">失败</a-tag>
            </template>
            <template v-else-if="column.key === 'reason'">
              <span v-if="dr.reason" style="color:#ff4d4f">{{ dr.reason }}</span>
              <span v-else style="color:#ccc">—</span>
            </template>
            <template v-else-if="column.key === 'startedAt'">
              {{ dr.startedAt || '—' }}
            </template>
            <template v-else-if="column.key === 'endedAt'">
              {{ dr.endedAt || '—' }}
            </template>
          </template>
        </a-table>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
.broadcast-records { }
.filter-bar { margin-bottom:16px; padding:12px 16px; background:#fafafa; border-radius:8px; border:1px solid #f0f0f0; }
</style>
