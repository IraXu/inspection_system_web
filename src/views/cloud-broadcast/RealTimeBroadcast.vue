<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'antdv-next'
import {
  AudioOutlined, SoundOutlined, SearchOutlined,
  PlayCircleOutlined, StopOutlined, ThunderboltOutlined,
  SyncOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  CheckCircleFilled, CloseCircleFilled,
  FolderOpenOutlined, CustomerServiceOutlined, EditOutlined,
} from '@antdv-next/icons'

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
const selRegion = ref('')
const expandedKeys = ref<string[]>(['root'])

// ========== 设备数据 ==========
interface DevItem { id:string; name:string; license:string; online:boolean; playing:boolean; regionPath:string[]; orgPath:string }
const allDevices: DevItem[] = [
  { id:'d1',name:'1F入口摄像头-01',license:'LIC-BJ-20240001',online:true,playing:false,regionPath:['root','huabei','beijing','bj-cbd'],orgPath:'华北大区 / 北京市 / CBD商圈' },
  { id:'d2',name:'1F入口摄像头-02',license:'LIC-BJ-20240002',online:true,playing:false,regionPath:['root','huabei','beijing','bj-cbd'],orgPath:'华北大区 / 北京市 / CBD商圈' },
  { id:'d3',name:'2F大厅摄像头-01',license:'LIC-BJ-20240003',online:true,playing:true,regionPath:['root','huabei','beijing','bj-cbd'],orgPath:'华北大区 / 北京市 / CBD商圈' },
  { id:'d4',name:'2F大厅摄像头-02',license:'LIC-BJ-20240004',online:false,playing:false,regionPath:['root','huabei','beijing','bj-cbd'],orgPath:'华北大区 / 北京市 / CBD商圈' },
  { id:'d5',name:'3F走廊摄像头-01',license:'LIC-BJ-20240005',online:true,playing:false,regionPath:['root','huabei','beijing','bj-zgc'],orgPath:'华北大区 / 北京市 / 中关村商圈' },
  { id:'d6',name:'3F走廊摄像头-02',license:'LIC-BJ-20240006',online:true,playing:false,regionPath:['root','huabei','beijing','bj-zgc'],orgPath:'华北大区 / 北京市 / 中关村商圈' },
  { id:'d7',name:'B1停车场摄像头',license:'LIC-TJ-20240001',online:true,playing:false,regionPath:['root','huabei','tianjin','tj-bh'],orgPath:'华北大区 / 天津市 / 滨海新区' },
  { id:'d8',name:'1F中庭摄像头',license:'LIC-TJ-20240002',online:false,playing:false,regionPath:['root','huabei','tianjin','tj-bh'],orgPath:'华北大区 / 天津市 / 滨海新区' },
  { id:'d9',name:'1F入口摄像头',license:'LIC-GZ-20240001',online:true,playing:false,regionPath:['root','huanan','guangzhou','gz-th'],orgPath:'华南大区 / 广州市 / 天河商圈' },
  { id:'d10',name:'2F专柜摄像头',license:'LIC-GZ-20240002',online:true,playing:false,regionPath:['root','huanan','guangzhou','gz-th'],orgPath:'华南大区 / 广州市 / 天河商圈' },
  { id:'d11',name:'3F餐饮区摄像头',license:'LIC-GZ-20240003',online:true,playing:false,regionPath:['root','huanan','guangzhou','gz-th'],orgPath:'华南大区 / 广州市 / 天河商圈' },
  { id:'d12',name:'1F大厅摄像头-A',license:'LIC-SH-20240001',online:true,playing:false,regionPath:['root','huadong','shanghai','sh-ljz'],orgPath:'华东大区 / 上海市 / 陆家嘴商圈' },
  { id:'d13',name:'1F大厅摄像头-B',license:'LIC-SH-20240002',online:false,playing:false,regionPath:['root','huadong','shanghai','sh-ljz'],orgPath:'华东大区 / 上海市 / 陆家嘴商圈' },
  { id:'d14',name:'2F专柜摄像头',license:'LIC-SH-20240003',online:true,playing:false,regionPath:['root','huadong','shanghai','sh-ljz'],orgPath:'华东大区 / 上海市 / 陆家嘴商圈' },
  { id:'d15',name:'B2停车场摄像头',license:'LIC-SH-20240004',online:true,playing:false,regionPath:['root','huadong','shanghai','sh-ljz'],orgPath:'华东大区 / 上海市 / 陆家嘴商圈' },
  { id:'d16',name:'1F入口摄像头-01',license:'LIC-CD-20240001',online:true,playing:false,regionPath:['root','xinan','chengdu','cd-chxl'],orgPath:'西南大区 / 成都市 / 春熙路商圈' },
  { id:'d17',name:'1F入口摄像头-02',license:'LIC-CD-20240002',online:true,playing:false,regionPath:['root','xinan','chengdu','cd-chxl'],orgPath:'西南大区 / 成都市 / 春熙路商圈' },
  { id:'d18',name:'2F中庭摄像头',license:'LIC-CD-20240003',online:false,playing:false,regionPath:['root','xinan','chengdu','cd-chxl'],orgPath:'西南大区 / 成都市 / 春熙路商圈' },
]

const devSearch = ref('')
const filteredDevices = computed(() => {
  let list = allDevices
  if (selRegion.value && selRegion.value !== 'root') list = list.filter(d => d.regionPath.includes(selRegion.value))
  if (devSearch.value.trim()) {
    const kw = devSearch.value.trim().toLowerCase()
    list = list.filter(d => d.name.toLowerCase().includes(kw) || d.license.toLowerCase().includes(kw) || d.orgPath.includes(kw))
  }
  return list
})

const selIds = ref<string[]>([])

// ========== 音频 ==========
interface AudioItem { id:string; name:string; cat:string; dur:number; size:number; src:string }
const mockAudios: AudioItem[] = [
  { id:'a1',name:'开门迎宾-标准版',cat:'迎宾问候',dur:25,size:2.0,src:'upload' },
  { id:'a2',name:'促销活动-618大促',cat:'促销通知',dur:45,size:3.5,src:'tts' },
  { id:'a3',name:'安全提醒-消防通道',cat:'安全提醒',dur:18,size:1.4,src:'record' },
  { id:'a4',name:'打烊提醒',cat:'迎宾问候',dur:15,size:1.2,src:'tts' },
  { id:'a5',name:'紧急疏散指引',cat:'安全提醒',dur:35,size:2.7,src:'upload' },
]
const audioMode = ref<'lib'|'ptt'|'tts'>('lib')  // 当前选择的音频方式
const audioSelectId = ref<string | null>(null)    // 媒体库下拉选中的音频
const selAudioName = ref('')
const fmtDur = (s:number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

// 媒体库下拉选择变更
const onAudioSelectChange = (val: string) => {
  audioSelectId.value = val
  const a = mockAudios.find(x => x.id === val)
  if (a) { selAudioName.value = a.name; audioMode.value = 'lib' }
}

// 下拉选项（computed确保响应式）
const audioSelectOpts = computed(() => mockAudios.map(a => ({
  value: a.id,
  label: `${a.name}  [${a.cat}]  ${fmtDur(a.dur)}  ${srcLabel(a.src)}`,
})))

// ===== PTT 喊话弹窗 =====
const pttVisible = ref(false)
const pttRecording = ref(false)
const pttPaused = ref(false)
const pttSec = ref(0)
let pttTimer: ReturnType<typeof setInterval> | null = null
const openPTT = () => { pttSec.value = 0; pttRecording.value = false; pttPaused.value = false; pttVisible.value = true }
const startPTT = () => {
  pttRecording.value = true; pttPaused.value = false; pttSec.value = 0
  pttTimer = setInterval(() => { pttSec.value++; if (pttSec.value >= 60) finishPTT() }, 1000)
}
const pausePTT = () => { pttPaused.value = true; if (pttTimer) clearInterval(pttTimer) }
const resumePTT = () => { pttPaused.value = false; pttTimer = setInterval(() => { pttSec.value++; if (pttSec.value >= 60) finishPTT() }, 1000) }
const finishPTT = () => {
  pttRecording.value = false; pttPaused.value = false
  if (pttTimer) { clearInterval(pttTimer); pttTimer = null }
  selAudioName.value = `实时喊话 (${fmtDur(pttSec.value)})`
  audioMode.value = 'ptt'
  pttVisible.value = false
  message.success('喊话录制完成，已设为当前播报内容')
}
const cancelPTT = () => { pttRecording.value = false; if (pttTimer) clearInterval(pttTimer); pttVisible.value = false }

// ===== TTS 弹窗 =====
const ttsVisible = ref(false)
const ttsText = ref('')
const ttsVoice = ref('female')
const ttsPreview = ref(false)
const openTTS = () => { ttsText.value = ''; ttsVoice.value = 'female'; ttsPreview.value = false; ttsVisible.value = true }
const doTTS = () => {
  if (!ttsText.value.trim()) { message.warning('请输入播报文字'); return }
  ttsPreview.value = true
  message.success('语音合成完成，请确认后使用')
}
const confirmTTS = () => {
  selAudioName.value = `TTS: ${ttsText.value.slice(0, 20)}${ttsText.value.length > 20 ? '...' : ''}`
  audioMode.value = 'tts'
  ttsVisible.value = false
  message.success('TTS语音已设为当前播报内容')
}
const closeStatus = () => { results.value = []; showStatus.value = false }

// ========== 广播控制 ==========
const broadcasting = ref(false)
const results = ref<{deviceId:string;deviceName:string;status:'success'|'failed';reason?:string}[]>([])
const stats = computed(() => ({
  total: results.value.length,
  success: results.value.filter(r => r.status === 'success').length,
  failed: results.value.filter(r => r.status === 'failed').length,
}))
const showStatus = ref(false)

const startBC = () => {
  if (selIds.value.length === 0) { message.warning('请至少选择一台目标设备'); return }
  if (!selAudioName.value) { message.warning('请先准备播报内容（从媒体库选择、录音或TTS合成）'); return }
  const off = allDevices.filter(d => selIds.value.includes(d.id) && !d.online)
  if (off.length > 0) message.warning(`已选中 ${off.length} 台离线设备，广播可能无法触达`)

  broadcasting.value = true; showStatus.value = true
  results.value = selIds.value.map(id => {
    const d = allDevices.find(dd => dd.id === id)!
    return { deviceId: id, deviceName: d.name, status: 'success' as const }
  })
  let done = 0
  const iv = setInterval(() => {
    const r = results.value[done]
    if (r && !allDevices.find(d => d.id === r.deviceId)?.online) { r.status = 'failed'; r.reason = '设备离线' }
    done++
    if (done >= results.value.length) {
      clearInterval(iv); broadcasting.value = false
      const f = results.value.filter(r => r.status === 'failed').length
      message[f > 0 ? 'warning' : 'success'](f > 0 ? `广播完成：成功 ${stats.value.success} 台，失败 ${f} 台` : '广播全部完成')
    }
  }, 600)
}
const stopBC = () => { broadcasting.value = false; message.info('广播已停止') }
const retryFailed = () => {
  results.value.filter(r => r.status === 'failed').forEach(r => { r.status = 'success'; delete r.reason })
  message.success('失败设备重试成功')
}

const srcLabel = (s: string) => s === 'upload' ? '上传' : s === 'record' ? '录音' : 'TTS'
</script>

<template>
  <div class="rt-root">
    <a-row :gutter="16" style="height:100%">
      <!-- 左侧：组织区域树 -->
      <a-col :span="5">
        <div class="tree-panel">
          <div class="tree-title">组织区域</div>
          <a-tree
            :tree-data="regionTree" :expanded-keys="expandedKeys" :selected-keys="[selRegion]"
            :field-names="{ children:'children', title:'title', key:'key' }"
            show-line block-node
            @select="(keys: any[]) => selRegion = keys[0] || ''"
            @expand="(keys: any[]) => expandedKeys = keys"
          />
        </div>
      </a-col>

      <!-- 右侧主区域 -->
      <a-col :span="19" class="right-col">
        <!-- 设备表格 -->
        <div class="content-area">
          <div class="content-hd">
            <span class="content-tt">选择目标设备</span>
            <a-space>
              <a-input-search v-model:value="devSearch" placeholder="搜索设备名称 / License / 区域" style="width:280px" size="small" />
              <a-tag color="blue">已选 {{ selIds.length }} 台</a-tag>
            </a-space>
          </div>
          <a-table
            :columns="[
              { title:'设备名称', dataIndex:'name', key:'name', width:'25%', ellipsis:true },
              { title:'License', dataIndex:'license', key:'license', width:'22%' },
              { title:'组织区域', dataIndex:'orgPath', key:'orgPath', width:'30%', ellipsis:true },
              { title:'状态', key:'status', width:'20%', align:'center' },
            ]"
            :data-source="filteredDevices"
            :row-selection="{ selectedRowKeys: selIds, onChange: (keys: any[]) => selIds = keys }"
            row-key="id" size="middle"
            :pagination="{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10','20','50'], showTotal: (t:number) => `共 ${t} 台设备` }"
            :scroll="{ y: 'calc(100vh - 420px)' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <span style="font-weight:500">{{ record.name }}</span>
              </template>
              <template v-else-if="column.key === 'license'">
                <code style="font-size:12px;color:#666;background:#f5f5f5;padding:1px 6px;border-radius:3px">{{ record.license }}</code>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-badge v-if="record.playing" status="processing" text="播放中" />
                <a-badge v-else-if="record.online" status="success" text="在线" />
                <a-badge v-else status="default" text="离线" />
              </template>
            </template>
          </a-table>
        </div>

        <!-- 底部固定区 -->
        <div class="bottom-bar">
          <!-- 播报方式选择 + 内容 -->
          <div class="audio-section">
            <span class="audio-label">播报方式</span>
            <a-segmented v-model:value="audioMode" :options="[
              { value:'lib', label:'媒体库' },
              { value:'ptt', label:'在线喊话' },
              { value:'tts', label:'TTS合成' },
            ]" size="small" style="margin-right:12px" />
            <!-- 媒体库下拉 -->
            <a-select
              v-if="audioMode === 'lib'"
              v-model:value="audioSelectId"
              placeholder="选择音频文件"
              style="width:400px"
              show-search
              :options="audioSelectOpts"
              @change="onAudioSelectChange"
            />
            <!-- PTT -->
            <a-button v-if="audioMode === 'ptt'" @click="openPTT"><AudioOutlined /> 开始喊话</a-button>
            <!-- TTS -->
            <a-button v-if="audioMode === 'tts'" @click="openTTS"><EditOutlined /> 输入文字合成</a-button>
            <!-- 已选内容标识 -->
            <a-tag v-if="selAudioName" color="green" closable @close="selAudioName='';audioSelectId=null" style="margin-left:12px;font-size:13px">
              <SoundOutlined /> [{{ audioMode==='lib'?'媒体库':audioMode==='ptt'?'喊话':'TTS' }}] {{ selAudioName }}
            </a-tag>
            <span v-else style="color:#999;font-size:12px;margin-left:8px">请选择播报方式并准备内容</span>
          </div>

          <!-- 控制按钮 -->
          <div class="ctrl-section">
            <a-space size="large">
              <a-button type="primary" size="large" :disabled="broadcasting" @click="startBC"><PlayCircleOutlined /> 开始广播</a-button>
              <a-button danger size="large" :disabled="!broadcasting" @click="stopBC"><StopOutlined /> 停止广播</a-button>
            </a-space>
          </div>

          <!-- 广播状态（可关闭） -->
          <div class="status-section" v-if="results.length > 0">
            <div class="status-hd">
              <div style="cursor:pointer;flex:1" @click="showStatus = !showStatus">
                <a-space>
                  <DownOutlined v-if="!showStatus" /><UpOutlined v-else />
                  <span style="font-weight:600">执行状态</span>
                  <a-tag v-if="broadcasting" color="processing"><SyncOutlined spin /> 播放中</a-tag>
                  <a-tag v-else-if="stats.failed > 0" color="warning">部分失败</a-tag>
                  <a-tag v-else color="success">全部完成</a-tag>
                </a-space>
              </div>
              <a-space size="large">
                <span>共 {{ stats.total }} 台</span>
                <span style="color:#52c41a">✓ {{ stats.success }}</span>
                <span v-if="stats.failed > 0" style="color:#ff4d4f">✗ {{ stats.failed }}</span>
                <a-button v-if="!broadcasting" type="link" size="small" @click="closeStatus"><CloseCircleFilled /> 关闭</a-button>
              </a-space>
            </div>
            <div v-if="showStatus" style="margin-top:8px">
              <div v-for="r in results" :key="r.deviceId" class="status-row">
                <span style="flex:1">{{ r.deviceName }}</span>
                <a-tag v-if="r.status === 'success'" color="success">成功</a-tag>
                <a-tag v-else color="error">失败</a-tag>
                <span v-if="r.reason" style="color:#ff4d4f;font-size:12px;margin-left:8px">{{ r.reason }}</span>
              </div>
              <a-button v-if="stats.failed > 0 && !broadcasting" type="primary" danger size="small" style="margin-top:8px" @click="retryFailed"><ReloadOutlined /> 重试失败设备</a-button>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- ====== PTT 喊话弹窗 ====== -->
    <a-modal v-model:open="pttVisible" title="在线喊话" width="420px" :footer="null" :maskClosable="false">
      <div style="text-align:center;padding:20px 0">
        <div class="ptt-timer">{{ fmtDur(pttSec) }}</div>
        <div style="color:#999;margin-top:4px;margin-bottom:20px">
          <template v-if="!pttRecording">点击下方按钮开始录音</template>
          <template v-else-if="pttPaused">录音已暂停</template>
          <template v-else>正在录音中...</template>
        </div>
        <a-space size="large">
          <a-button v-if="!pttRecording" type="primary" shape="circle" size="large" @click="startPTT">
            <template #icon><AudioOutlined style="font-size:24px" /></template>
          </a-button>
          <a-button v-if="pttRecording && !pttPaused" shape="circle" size="large" @click="pausePTT">
            <template #icon><StopOutlined style="font-size:24px" /></template>
          </a-button>
          <a-button v-if="pttPaused" type="primary" shape="circle" size="large" @click="resumePTT">
            <template #icon><AudioOutlined style="font-size:24px" /></template>
          </a-button>
        </a-space>
        <div style="margin-top:24px">
          <a-space>
            <a-button v-if="pttRecording" type="primary" @click="finishPTT" :disabled="pttSec === 0">完成并使用</a-button>
            <a-button @click="cancelPTT">取消</a-button>
          </a-space>
        </div>
        <div style="color:#999;font-size:12px;margin-top:12px">最长录制 60 秒，到时间自动停止</div>
      </div>
    </a-modal>

    <!-- ====== TTS 弹窗 ====== -->
    <a-modal v-model:open="ttsVisible" title="TTS 文字转语音" width="520px" :footer="null">
      <!-- 输入阶段 -->
      <template v-if="!ttsPreview">
        <a-textarea v-model:value="ttsText" placeholder="请输入要合成的文字内容（最多500字）" :maxlength="500" :rows="4" show-count />
        <div style="margin-top:12px;display:flex;align-items:center;gap:8px">
          <span style="color:#666;white-space:nowrap">音色：</span>
          <a-select v-model:value="ttsVoice" style="width:180px" :options="[
            {value:'female',label:'女声-标准'},
            {value:'male',label:'男声-标准'},
            {value:'female2',label:'女声-温柔'},
          ]" />
        </div>
        <div style="text-align:right;margin-top:16px">
          <a-space>
            <a-button @click="ttsVisible = false">取消</a-button>
            <a-button type="primary" @click="doTTS" :disabled="!ttsText.trim()"><ThunderboltOutlined /> 开始合成</a-button>
          </a-space>
        </div>
      </template>
      <!-- 预览阶段 -->
      <template v-else>
        <a-result status="success" title="语音合成完成" sub-title="请确认播报内容后使用">
          <template #extra>
            <a-space>
              <a-button @click="ttsPreview = false">重新编辑</a-button>
              <a-button type="primary" @click="confirmTTS"><CheckCircleFilled /> 确认使用</a-button>
            </a-space>
          </template>
        </a-result>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.rt-root { height: calc(100vh - 112px); overflow: hidden; }
.tree-panel { background: #fff; border-radius: 8px; padding: 12px; height: 100%; overflow-y: auto; border: 1px solid #f0f0f0; }
.tree-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #333; }
.right-col { display: flex; flex-direction: column; height: 100%; gap: 12px; }

/* 设备卡片区 */
.content-area { flex: 1; background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 12px; display: flex; flex-direction: column; overflow: hidden; }
.content-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-shrink: 0; }
.content-tt { font-size: 14px; font-weight: 600; }

/* 底部固定区 */
.bottom-bar { flex-shrink: 0; background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 12px 16px; }
.audio-section { display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px; }
.audio-label { font-size: 13px; font-weight: 600; color: #555; white-space: nowrap; }
.ctrl-section { display: flex; justify-content: flex-end; }

/* 状态区 */
.status-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.status-hd { display: flex; justify-content: space-between; align-items: center; user-select: none; }
.status-row { display: flex; align-items: center; padding: 5px 0; border-bottom: 1px solid #fafafa; font-size: 13px; }

/* PTT */
.ptt-timer { font-size: 48px; font-weight: 700; font-family: monospace; color: #333; }
</style>
