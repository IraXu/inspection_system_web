<script setup lang="ts">
import { ref, computed } from 'vue'
import { message, Modal } from 'antdv-next'
import type { MediaAudio, AudioCategory } from '@/types'
import {
  UploadOutlined, AudioOutlined, ThunderboltOutlined, SoundOutlined,
  PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined,
  PlusOutlined, EditOutlined, FolderOutlined, CloudUploadOutlined,
} from '@antdv-next/icons'

// ========== Mock数据 ==========
const mockCategories: AudioCategory[] = [
  { id:'cat1', name:'迎宾问候', audioCount:2 },
  { id:'cat2', name:'促销通知', audioCount:1 },
  { id:'cat3', name:'安全提醒', audioCount:2 },
  { id:'cat4', name:'背景音乐', audioCount:0 },
]

const mockAudios: MediaAudio[] = [
  { id:'a1',name:'开门迎宾-标准版',categoryId:'cat1',categoryName:'迎宾问候',duration:25,fileSize:2048000,format:'mp3',bitrate:128,sampleRate:44100,source:'upload',url:'',referencedBy:['st1'],createdAt:'2026-06-01 10:00:00' },
  { id:'a2',name:'促销活动-618大促',categoryId:'cat2',categoryName:'促销通知',duration:45,fileSize:3686400,format:'mp3',bitrate:256,sampleRate:48000,source:'tts',url:'',referencedBy:['st3'],createdAt:'2026-06-10 14:30:00' },
  { id:'a3',name:'安全提醒-消防通道',categoryId:'cat3',categoryName:'安全提醒',duration:18,fileSize:1474560,format:'wav',bitrate:256,sampleRate:44100,source:'record',url:'',referencedBy:['er2'],createdAt:'2026-06-05 09:00:00' },
  { id:'a4',name:'打烊提醒',categoryId:'cat1',categoryName:'迎宾问候',duration:15,fileSize:1228800,format:'mp3',bitrate:128,sampleRate:44100,source:'tts',url:'',referencedBy:['st2'],createdAt:'2026-06-08 22:00:00' },
  { id:'a5',name:'紧急疏散指引',categoryId:'cat3',categoryName:'安全提醒',duration:35,fileSize:2867200,format:'mp3',bitrate:192,sampleRate:48000,source:'upload',url:'',referencedBy:['er1'],createdAt:'2026-06-02 08:00:00' },
  { id:'a6',name:'夏日促销-冰饮特惠',categoryId:'cat2',categoryName:'促销通知',duration:30,fileSize:2457600,format:'mp3',bitrate:192,sampleRate:44100,source:'tts',url:'',referencedBy:[],createdAt:'2026-06-12 16:00:00' },
]

const audios = ref([...mockAudios])
const categories = ref([...mockCategories])

// ========== 筛选 ==========
const selectedCat = ref('all')
const audioSearch = ref('')
const sourceFilter = ref('all')

const filteredAudios = computed(() => {
  let list = audios.value
  if (selectedCat.value !== 'all') list = list.filter(a => a.categoryId === selectedCat.value)
  if (audioSearch.value.trim()) list = list.filter(a => a.name.includes(audioSearch.value.trim()))
  if (sourceFilter.value !== 'all') list = list.filter(a => a.source === sourceFilter.value)
  return list
})

// ========== 分类管理 ==========
const catModalVisible = ref(false)
const catModalMode = ref<'add'|'edit'>('add')
const editingCatId = ref<string | null>(null)
const catFormName = ref('')

const openAddCat = () => {
  catModalMode.value = 'add'; editingCatId.value = null
  catFormName.value = ''; catModalVisible.value = true
}
const openEditCat = (cat: AudioCategory) => {
  catModalMode.value = 'edit'; editingCatId.value = cat.id
  catFormName.value = cat.name; catModalVisible.value = true
}
const handleDeleteCat = (cat: AudioCategory) => {
  if (cat.audioCount > 0 || audios.value.filter(a => a.categoryId === cat.id).length > 0) {
    message.error(`该分类下还有音频，请先移动或删除音频`)
    return
  }
  Modal.confirm({
    title: '删除分类',
    content: `确定删除分类「${cat.name}」吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      categories.value = categories.value.filter(c => c.id !== cat.id)
      message.success('分类已删除')
    },
  })
}
const handleSaveCat = () => {
  if (!catFormName.value.trim()) { message.warning('请输入分类名称'); return }
  if (catModalMode.value === 'edit' && editingCatId.value) {
    const cat = categories.value.find(c => c.id === editingCatId.value)
    if (cat) { cat.name = catFormName.value; audios.value.filter(a => a.categoryId === editingCatId.value).forEach(a => a.categoryName = catFormName.value) }
    message.success('分类编辑成功')
  } else {
    categories.value.push({ id: String(Date.now()), name: catFormName.value, audioCount: 0 })
    message.success('分类添加成功')
  }
  catModalVisible.value = false
}

// ========== 删除音频 ==========
const handleDeleteAudio = (audio: MediaAudio) => {
  if (audio.referencedBy.length > 0) {
    message.error(`该音频被${audio.referencedBy.length}个广播任务引用，无法删除！请先解除引用`)
    return
  }
  audios.value = audios.value.filter(a => a.id !== audio.id)
  // 更新分类计数
  const cat = categories.value.find(c => c.id === audio.categoryId)
  if (cat) cat.audioCount--
  message.success('音频已删除')
}

// ========== 上传弹窗 ==========
const uploadVisible = ref(false)
const uploadFileList = ref<any[]>([])
const uploadCatId = ref<string>('all')
const uploadAudioName = ref('')
const uploading = ref(false)

const openUpload = () => {
  uploadFileList.value = []; uploadCatId.value = 'all'
  uploadAudioName.value = ''
  uploadVisible.value = true
}

const handleUploadFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && !['mp3','wav','aac','flac'].includes(ext)) {
    message.error('不支持的文件格式，请上传 MP3/WAV/AAC/FLAC 格式')
    return false
  }
  if (file.size > 50 * 1024 * 1024) {
    message.error('文件大小超过限制（最大50MB）')
    return false
  }
  uploadFileList.value.push(file)
  return false // 阻止默认上传
}

const confirmUpload = () => {
  if (uploadFileList.value.length === 0) { message.warning('请选择音频文件'); return }
  uploading.value = true
  setTimeout(() => {
    const file = uploadFileList.value[0]
    const catId = uploadCatId.value !== 'all' ? uploadCatId.value : 'cat1'
    const cat = categories.value.find(c => c.id === catId)
    const name = uploadAudioName.value || file.name.replace(/\.[^.]+$/, '')
    audios.value.push({
      id: String(Date.now()), name,
      categoryId: catId, categoryName: cat?.name || '未分类',
      duration: 30, fileSize: file.size, format: file.name.split('.').pop() || 'mp3',
      source: 'upload', url: '', referencedBy: [],
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    })
    if (cat) cat.audioCount++
    uploading.value = false
    uploadVisible.value = false
    message.success(`音频「${name}」上传成功`)
  }, 1500)
}

// ========== 录音弹窗 ==========
const recordVisible = ref(false)
const isRecording = ref(false)
const isPaused = ref(false)
const recordSeconds = ref(0)
const recordCatId = ref('all')
const recordName = ref('')
const recordStep = ref<'record'|'save'>('record')
let recordTimer: ReturnType<typeof setInterval> | null = null

const openRecord = () => {
  recordStep.value = 'record'; recordSeconds.value = 0
  isRecording.value = false; isPaused.value = false
  recordCatId.value = 'all'; recordName.value = ''
  recordVisible.value = true
}

const startRecord = () => {
  isRecording.value = true; isPaused.value = false; recordSeconds.value = 0
  recordTimer = setInterval(() => {
    recordSeconds.value++
    if (recordSeconds.value >= 300) stopRecord()
  }, 1000)
}
const pauseRecord = () => { isPaused.value = true; if (recordTimer) clearInterval(recordTimer) }
const resumeRecord = () => {
  isPaused.value = false
  recordTimer = setInterval(() => {
    recordSeconds.value++
    if (recordSeconds.value >= 300) stopRecord()
  }, 1000)
}
const stopRecord = () => {
  isRecording.value = false; isPaused.value = false
  if (recordTimer) { clearInterval(recordTimer); recordTimer = null }
  recordStep.value = 'save'
}
const saveRecord = () => {
  if (!recordName.value.trim()) { message.warning('请输入录音名称'); return }
  const catId = recordCatId.value !== 'all' ? recordCatId.value : 'cat1'
  const cat = categories.value.find(c => c.id === catId)
  audios.value.push({
    id: String(Date.now()), name: recordName.value,
    categoryId: catId, categoryName: cat?.name || '未分类',
    duration: recordSeconds.value, fileSize: recordSeconds.value * 16000,
    format: 'wav', source: 'record', url: '', referencedBy: [],
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  })
  if (cat) cat.audioCount++
  recordVisible.value = false
  message.success(`录音「${recordName.value}」保存成功`)
}

// ========== TTS弹窗 ==========
const ttsVisible = ref(false)
const ttsText = ref('')
const ttsVoice = ref('female')
const ttsGenerating = ref(false)
const ttsCatId = ref('all')
const ttsName = ref('')
const ttsStep = ref<'input'|'preview'>('input')

const openTTS = () => {
  ttsStep.value = 'input'; ttsText.value = ''; ttsVoice.value = 'female'
  ttsCatId.value = 'all'; ttsName.value = ''
  ttsVisible.value = true
}

const generateTTS = () => {
  if (!ttsText.value.trim()) { message.warning('请输入要合成的文字内容'); return }
  ttsGenerating.value = true
  setTimeout(() => {
    ttsGenerating.value = false
    ttsStep.value = 'preview'
    if (!ttsName.value) ttsName.value = ttsText.value.slice(0, 30)
    message.success('语音合成完成，请试听确认')
  }, 1500)
}

const saveTTS = () => {
  if (!ttsName.value.trim()) { message.warning('请输入音频名称'); return }
  const catId = ttsCatId.value !== 'all' ? ttsCatId.value : 'cat2'
  const cat = categories.value.find(c => c.id === catId)
  audios.value.push({
    id: String(Date.now()), name: ttsName.value,
    categoryId: catId, categoryName: cat?.name || '未分类',
    duration: Math.ceil(ttsText.value.length / 4),
    fileSize: ttsText.value.length * 2000,
    format: 'mp3', source: 'tts', url: '', referencedBy: [],
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  })
  if (cat) cat.audioCount++
  ttsVisible.value = false
  message.success(`TTS音频「${ttsName.value}」保存成功`)
}

// ========== 音频试听 ==========
const playingAudioId = ref<string | null>(null)
const togglePlay = (audioId: string) => {
  playingAudioId.value = playingAudioId.value === audioId ? null : audioId
}

// ========== 工具函数 ==========
const formatDuration = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)}KB`
  return `${(bytes/(1024*1024)).toFixed(1)}MB`
}
const formatSeconds = (s: number) => `${Math.floor(s/60)}分${s%60}秒`
const sourceLabel = (s: string) => s === 'upload' ? '上传' : s === 'record' ? '录音' : 'TTS'
const sourceColor = (s: string) => s === 'upload' ? 'blue' : s === 'record' ? 'green' : 'purple'
</script>

<template>
  <div class="media-library">
    <a-row :gutter="16">
      <!-- 左侧分类 -->
      <a-col :span="6">
        <div class="panel-card">
          <div class="panel-title">
            <FolderOutlined /> 音频分类
            <a-button type="link" size="small" style="float:right;padding:0" @click="openAddCat"><PlusOutlined /></a-button>
          </div>
          <div class="cat-list">
            <div
              :class="['cat-item', { active: selectedCat === 'all' }]"
              @click="selectedCat = 'all'"
            >
              <span class="cat-name">全部音频</span>
              <span class="cat-tag">{{ audios.length }}</span>
            </div>
            <div class="cat-divider" />
            <div
              v-for="cat in categories" :key="cat.id"
              :class="['cat-item', { active: selectedCat === cat.id }]"
            >
              <span class="cat-click" @click="selectedCat = cat.id">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ audios.filter(a=>a.categoryId===cat.id).length }}</span>
              </span>
              <span class="cat-actions">
                <a-button type="link" size="small" @click.stop="openEditCat(cat)" title="编辑"><EditOutlined /></a-button>
                <a-button type="link" danger size="small" @click.stop="handleDeleteCat(cat)" title="删除"><DeleteOutlined /></a-button>
              </span>
            </div>
            <a-empty v-if="categories.length === 0" description="暂无分类" :image="false" style="padding:20px 0" />
          </div>
        </div>
      </a-col>

      <!-- 右侧音频列表 -->
      <a-col :span="18">
        <!-- 操作栏 -->
        <div class="toolbar">
          <a-space>
            <a-button type="primary" @click="openUpload"><UploadOutlined /> 上传音频</a-button>
            <a-button @click="openRecord"><AudioOutlined /> 在线录音</a-button>
            <a-button @click="openTTS"><ThunderboltOutlined /> TTS合成</a-button>
          </a-space>
          <a-space>
            <a-select v-model:value="sourceFilter" style="width:120px" :options="[
              {value:'all',label:'全部来源'},
              {value:'upload',label:'上传'},
              {value:'record',label:'录音'},
              {value:'tts',label:'TTS'},
            ]" />
            <a-input-search v-model:value="audioSearch" placeholder="搜索音频名称" style="width:200px" />
          </a-space>
        </div>

        <!-- 音频列表 -->
        <a-table :columns="[
          { title:'音频名称', dataIndex:'name', key:'name', width:200, align:'center' },
          { title:'分类', dataIndex:'categoryName', key:'categoryName', width:90, align:'center' },
          { title:'时长', dataIndex:'duration', key:'duration', width:65, align:'center' },
          { title:'大小', dataIndex:'fileSize', key:'fileSize', width:75, align:'center' },
          { title:'来源', dataIndex:'source', key:'source', width:65, align:'center' },
          { title:'引用', key:'refs', width:130, align:'center' },
          { title:'创建时间', dataIndex:'createdAt', key:'createdAt', width:155, align:'center' },
          { title:'操作', key:'actions', width:150, align:'center', fixed:'right' },
        ]" :data-source="filteredAudios" row-key="id" :scroll="{ x: 930 }" :pagination="{ pageSize:10, showSizeChanger:true, showTotal:(t:number)=>`共 ${t} 条` }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <SoundOutlined style="color:#1677ff;margin-right:6px" />{{ record.name }}
            </template>
            <template v-else-if="column.key === 'duration'">{{ formatDuration(record.duration) }}</template>
            <template v-else-if="column.key === 'fileSize'">{{ formatSize(record.fileSize) }}</template>
            <template v-else-if="column.key === 'source'">
              <a-tag :color="sourceColor(record.source)">{{ sourceLabel(record.source) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'refs'">
              <a-tag v-if="record.referencedBy.length > 0" color="blue">被 {{ record.referencedBy.length }} 个任务引用</a-tag>
              <span v-else style="color:#bbb;font-size:12px">未引用</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" size="small" @click="togglePlay(record.id)">
                  <PlayCircleOutlined v-if="playingAudioId !== record.id" />
                  <PauseCircleOutlined v-else />
                  {{ playingAudioId === record.id ? '暂停' : '试听' }}
                </a-button>
                <a-popconfirm
                  title="是否删除此音频？删除后不可恢复"
                  cancelText="取消" okText="确定"
                  :disabled="record.referencedBy.length > 0"
                  @confirm="handleDeleteAudio(record)"
                >
                  <a-button type="link" danger size="small" :disabled="record.referencedBy.length > 0">
                    <DeleteOutlined /> 删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-col>
    </a-row>

    <!-- 分类弹窗 -->
    <a-modal v-model:open="catModalVisible" :title="catModalMode==='add'?'新建分类':'编辑分类'" @ok="handleSaveCat" cancelText="取消" okText="确定">
      <a-input v-model:value="catFormName" placeholder="分类名称（如：促销通知）" :maxlength="20" show-count />
    </a-modal>

    <!-- 上传弹窗 -->
    <a-modal v-model:open="uploadVisible" title="上传音频" width="480px" @ok="confirmUpload" :confirmLoading="uploading" cancelText="取消" okText="确定">
      <a-upload-dragger
        :file-list="uploadFileList"
        :before-upload="handleUploadFile"
        accept=".mp3,.wav,.aac,.flac"
        :max-count="5"
      >
        <p class="upload-icon"><CloudUploadOutlined style="font-size:48px;color:#1677ff" /></p>
        <p>点击或拖拽音频文件到此区域上传</p>
        <p style="color:#999;font-size:12px">支持 MP3 / WAV / AAC / FLAC，单文件最大 50MB</p>
      </a-upload-dragger>
      <a-form style="margin-top:12px">
        <a-form-item label="音频名称">
          <a-input v-model:value="uploadAudioName" placeholder="可选，留空使用文件名" />
        </a-form-item>
        <a-form-item label="所属分类">
          <a-select v-model:value="uploadCatId" style="width:100%" :options="[{value:'all',label:'未分类'},...categories.map(c=>({value:c.id,label:c.name}))]" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 录音弹窗 -->
    <a-modal v-model:open="recordVisible" title="在线录音" width="420px" :footer="null" :maskClosable="false">
      <template v-if="recordStep === 'record'">
        <div style="text-align:center;padding:20px 0">
          <div class="record-timer">{{ formatSeconds(recordSeconds) }}</div>
          <p v-if="!isRecording" style="color:#999;margin:8px 0 20px">点击下方按钮开始录音</p>
          <p v-else-if="isPaused" style="color:#faad14;margin:8px 0 20px">录音已暂停</p>
          <p v-else style="color:#1677ff;margin:8px 0 20px">正在录音中...</p>
          <a-space size="middle">
            <a-button v-if="!isRecording" type="primary" size="large" @click="startRecord"><AudioOutlined /> 开始录音</a-button>
            <a-button v-if="isRecording && !isPaused" size="large" @click="pauseRecord"><PauseCircleOutlined /> 暂停</a-button>
            <a-button v-if="isPaused" type="primary" size="large" @click="resumeRecord"><AudioOutlined /> 继续</a-button>
            <a-button v-if="isRecording" danger size="large" @click="stopRecord"><DeleteOutlined /> 完成</a-button>
          </a-space>
          <div style="margin-top:24px;color:#999;font-size:12px">最长录制 300 秒，到时间自动停止</div>
        </div>
      </template>
      <template v-else>
        <a-form :label-col="{ flex: '80px' }">
          <a-form-item label="录音名称" required>
            <a-input v-model:value="recordName" placeholder="请输入录音名称" :maxlength="100" />
          </a-form-item>
          <a-form-item label="时长">{{ formatSeconds(recordSeconds) }}</a-form-item>
          <a-form-item label="所属分类">
            <a-select v-model:value="recordCatId" style="width:100%" :options="[{value:'all',label:'未分类'},...categories.map(c=>({value:c.id,label:c.name}))]" />
          </a-form-item>
        </a-form>
        <div style="text-align:right;margin-top:12px">
          <a-space>
            <a-button @click="recordStep='record'">返回重录</a-button>
            <a-button type="primary" @click="saveRecord">保存</a-button>
          </a-space>
        </div>
      </template>
    </a-modal>

    <!-- TTS弹窗 -->
    <a-modal v-model:open="ttsVisible" title="TTS文字转语音" width="520px" :footer="null" :confirmLoading="ttsGenerating">
      <template v-if="ttsStep === 'input'">
        <a-textarea v-model:value="ttsText" placeholder="请输入要合成的文字内容（最多500字）" :maxlength="500" :rows="4" show-count style="margin-bottom:12px" />
        <a-select v-model:value="ttsVoice" style="width:200px" :options="[
          {value:'female',label:'女声-标准'},
          {value:'male',label:'男声-标准'},
          {value:'female2',label:'女声-温柔'},
        ]" />
        <div style="text-align:right;margin-top:16px">
          <a-space>
            <a-button @click="ttsVisible = false">取消</a-button>
            <a-button type="primary" @click="generateTTS" :disabled="!ttsText.trim()" :loading="ttsGenerating"><ThunderboltOutlined /> 开始合成</a-button>
          </a-space>
        </div>
      </template>
      <template v-else>
        <a-result status="success" title="语音合成完成" sub-title="请试听确认后保存">
          <template #extra>
            <a-button @click="generateTTS">重新合成</a-button>
          </template>
        </a-result>
        <a-form style="margin-top:12px" :label-col="{ flex: '80px' }">
          <a-form-item label="音频名称" required>
            <a-input v-model:value="ttsName" :maxlength="100" />
          </a-form-item>
          <a-form-item label="所属分类">
            <a-select v-model:value="ttsCatId" style="width:100%" :options="[{value:'all',label:'未分类'},...categories.map(c=>({value:c.id,label:c.name}))]" />
          </a-form-item>
        </a-form>
        <div style="text-align:right;margin-top:12px">
          <a-space>
            <a-button @click="ttsStep='input'">返回编辑</a-button>
            <a-button type="primary" @click="saveTTS">保存</a-button>
          </a-space>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.media-library { }
.panel-card { background:#fff; border-radius:8px; padding:12px; height:100%; border:1px solid #f0f0f0; }
.panel-title { font-size:14px; font-weight:600; margin-bottom:8px; color:#333; }
.toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px; }
.upload-icon { margin-bottom:8px; }
.record-timer { font-size:48px; font-weight:700; color:#333; font-family:monospace; margin-bottom:4px; }
.cat-list { }
.cat-item {
  display:flex; align-items:center; justify-content:space-between;
  padding:9px 10px; border-radius:6px; transition:all .15s;
}
.cat-item:hover { background:#f5f5f5; }
.cat-item.active { background:#e6f4ff; }
.cat-item.active .cat-name { color:#1677ff; font-weight:500; }
.cat-click { display:flex; align-items:center; gap:4px; cursor:pointer; flex:1; min-width:0; }
.cat-name { font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cat-tag {
  background:#1677ff; color:#fff; font-size:11px; font-weight:600; flex-shrink:0;
  min-width:18px; height:18px; line-height:18px; text-align:center;
  border-radius:9px; padding:0 6px; margin-left:auto;
}
.cat-count { font-size:12px; color:#999; flex-shrink:0; }
.cat-count::before { content:'('; }
.cat-count::after { content:')'; }
.cat-actions { flex-shrink:0; margin-left:8px; display:flex; gap:0; }
</style>
