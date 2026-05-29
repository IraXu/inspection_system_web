<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'antdv-next'
import { ArrowLeftOutlined, PictureOutlined, FileSearchOutlined, FullscreenOutlined, FullscreenExitOutlined, DownOutlined, LeftOutlined, RightOutlined, VideoCameraOutlined } from '@antdv-next/icons'

const route = useRoute()
const router = useRouter()
const taskId = route.query.taskId as string || 'T200-P111-xxxxxxxxA'
const taskName = 'xxxxxxxxxx巡检任务'

// ========== 摄像头（含在线状态模拟） ==========
interface Camera { name:string; online:boolean }
const cameras: Camera[] = [
  { name:'xxx门店大门监控', online:true },
  { name:'xxx门店货架监控1', online:true },
  { name:'xxx门店货架监控2', online:true },
  { name:'xxx门店仓库监控', online:false },
  { name:'xxx门店收银监控', online:true },
]
const activeCamera = ref(-1) // 默认无设备选中
const cameraScroll = ref(0)

// ========== 视频网格：4个格子，每个可绑定一个摄像头 ==========
interface GridCell { cameraIdx: number | null; status: 'empty' | 'connecting' | 'connected' }
const selectedCellIdx = ref<number | null>(null)

// 某摄像头是否正在某个格子播放
const isCameraPlaying = (idx: number) => gridCells.some(c => c.status === 'connected' && c.cameraIdx === idx)
// 找到某摄像头正在播放的格子索引
const findCameraCell = (idx: number) => gridCells.findIndex(c => c.status === 'connected' && c.cameraIdx === idx)

// 单击摄像头 → 仅关联高亮（该设备在可见格子中播放才有效）
const clickCamera = (idx: number) => {
  if (!cameras[idx].online) return
  const vis = visibleCells.value
  const cellIdx = vis.findIndex(c => c.status === 'connected' && c.cameraIdx === idx)
  if (cellIdx !== -1) {
    selectedCellIdx.value = cellIdx
    activeCamera.value = idx
  }
}

// 双击摄像头 → 智能分配播放（仅在当前可见格子范围内操作）
const dblClickCamera = (idx: number) => {
  if (!cameras[idx].online) { message.warning('该摄像头离线，无法连接'); return }
  const vis = visibleCells.value
  // 1) 已在某个可见格子播放 → 定位到该格子
  const existIdx = vis.findIndex(c => c.status === 'connected' && c.cameraIdx === idx)
  if (existIdx !== -1) {
    selectedCellIdx.value = existIdx
    activeCamera.value = idx
    return
  }
  // 2) 在当前可见范围内找第一个空格子
  const emptyIdx = vis.findIndex(c => c.status === 'empty')
  if (emptyIdx !== -1) {
    connectCamera(emptyIdx, idx)
    return
  }
  // 3) 无空格子 → 替换最后一个可见格子
  const lastIdx = visibleCount.value - 1
  connectCamera(lastIdx, idx)
}

// 单击格子 → 选中并关联高亮对应设备芯片
const clickCell = (cellIdx: number) => {
  const cell = gridCells[cellIdx]
  if (cell.status === 'connected' && cell.cameraIdx !== null) {
    selectedCellIdx.value = cellIdx
    activeCamera.value = cell.cameraIdx
  }
}

// 断开格子连接
const disconnectCell = (cellIdx: number) => {
  const camIdx = gridCells[cellIdx].cameraIdx
  gridCells[cellIdx] = { cameraIdx:null, status:'empty' }
  selectedCellIdx.value = null
  // 如果断开的是当前选中设备，切换到下一个已连接设备，否则清除选中
  if (camIdx !== null && activeCamera.value === camIdx) {
    const nextCell = gridCells.findIndex(c => c.status === 'connected')
    if (nextCell !== -1 && gridCells[nextCell].cameraIdx !== null) {
      activeCamera.value = gridCells[nextCell].cameraIdx!
      selectedCellIdx.value = nextCell
    } else {
      activeCamera.value = -1 // 无连接设备时清除高亮
    }
  }
}

// 连接摄像头到格子
const connectCamera = (cellIdx: number, camIdx: number) => {
  gridCells[cellIdx] = { cameraIdx:camIdx, status:'connecting' }
  // 模拟连接延迟
  setTimeout(() => {
    if (gridCells[cellIdx].cameraIdx === camIdx) {
      gridCells[cellIdx].status = 'connected'
      activeCamera.value = camIdx
      selectedCellIdx.value = cellIdx
    }
  }, 800)
}

// 全部分配（一键将前N个在线摄像头分配到空格子）
const autoAssignAll = () => {
  const onlineCams = cameras.map((c, i) => c.online ? i : -1).filter(i => i >= 0)
  let ci = 0
  for (let i = 0; i < 4 && ci < onlineCams.length; i++) {
    if (gridCells[i].status === 'empty') {
      connectCamera(i, onlineCams[ci++])
    }
  }
}
const perView = 4

const scrollLeft = () => { if (cameraScroll.value > 0) cameraScroll.value-- }
const scrollRight = () => { if (cameraScroll.value + perView < cameras.length) cameraScroll.value++ }
const visibleCameras = () => cameras.slice(cameraScroll.value, cameraScroll.value + perView)
const showLeft = () => cameraScroll.value > 0
const showRight = () => cameraScroll.value + perView < cameras.length
const camDropdownOpen = ref(false)
const jumpToCamera = (idx: number) => { cameraScroll.value = Math.max(0, Math.min(idx, cameras.length - perView)); dblClickCamera(idx); camDropdownOpen.value = false }

// ========== 分屏 + 全屏 ==========
const splitMode = ref(4) // 默认2×2
const splitMenuOpen = ref(false)
const splitOptions = [
  { value:1, label:'1×1', cols:1, rows:1, pv:'pv-1' },
  { value:4, label:'2×2', cols:2, rows:2, pv:'pv-4' },
  { value:9, label:'3×3', cols:3, rows:3, pv:'pv-9' },
  { value:6, label:'1+5', cols:3, rows:3, template:'1+5', pv:'pv-6' },
  { value:8, label:'1+7', cols:4, rows:3, template:'1+7', pv:'pv-8' },
  { value:7, label:'3+4', cols:3, rows:3, template:'3+4', pv:'pv-7' },
  { value:12, label:'3×4', cols:3, rows:4, pv:'pv-12' },
  { value:16, label:'4×4', cols:4, rows:4, pv:'pv-16' },
]
const previewCellCount = (opt: typeof splitOptions[number]) => Math.min(opt.value, 16)
const currentSplit = computed(() => splitOptions.find(o => o.value === splitMode.value)!)
const videoRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const handleFsChange = () => { isFullscreen.value = !!document.fullscreenElement }
onMounted(() => { document.addEventListener('fullscreenchange', handleFsChange) })
onUnmounted(() => { document.removeEventListener('fullscreenchange', handleFsChange) })
const goFullscreen = () => {
  if (isFullscreen.value) {
    document.exitFullscreen()
  } else {
    videoRef.value?.requestFullscreen()
  }
}
const getPopupContainer = () => videoRef.value || document.body

// 切换分屏 → 清除所有播放状态
watch(splitMode, () => {
  gridCells.forEach((c, i) => { gridCells[i] = { cameraIdx: null, status: 'empty' } })
  selectedCellIdx.value = null
})

// ========== 视频网格：根据分屏模式动态生成格子 ==========
const gridCells = reactive<GridCell[]>(Array.from({length:16}, () => ({ cameraIdx:null, status:'empty' })))
// 可见格子数
const visibleCount = computed(() => {
  const m = splitMode.value
  if (m === 6) return 6; if (m === 8) return 8; if (m === 7) return 7
  return m
})
const visibleCells = computed(() => gridCells.slice(0, visibleCount.value))

// 当前选中的摄像头是否在线且已连接
const currentCameraOnline = computed(() => {
  if (selectedCellIdx.value === null) return false
  const cell = gridCells[selectedCellIdx.value]
  if (cell.status !== 'connected' || cell.cameraIdx === null) return false
  return cameras[cell.cameraIdx]?.online ?? false
})

// ========== 检查项 ==========
const storeName = '21世纪太阳城xxx商铺'
const templateName = 'xxxx模板A'
const categories = ['环境卫生', '行为规范']
const activeCategory = ref('0')

const inspectionItems = reactive([
  { itemId:'i1',categoryName:'环境卫生',itemName:'地面是否整洁',problemDesc:'',standard:'地面无污渍、无杂物、无水渍，保持光洁。每日至少清洁2次，高峰期需增加清洁频次。地面材质为瓷砖的需注意防滑处理。',screenshots:[],result:'pass',images:['img1','img2'] },
  { itemId:'i2',categoryName:'环境卫生',itemName:'设备是否整洁',problemDesc:'',standard:'设备表面无灰尘、无油污，定期清洁保养。每周进行一次深度清洁，每月进行一次设备维护检查。',screenshots:[],result:'pass',images:[] },
  { itemId:'i3',categoryName:'行为规范',itemName:'上班是否手机',problemDesc:'',standard:'工作期间禁止使用手机进行非工作活动。如需接听紧急电话，须到指定区域进行，时长不超过3分钟。',screenshots:[],result:'pass',images:['img1'] },
])

const filteredItems = () => inspectionItems.filter(i => i.categoryName === categories[Number(activeCategory.value)])

const screenshotCount = reactive<Record<string, number>>({})
const takeScreenshot = (itemId: string) => {
  if (!currentCameraOnline.value) { message.warning('当前摄像头未连接，无法截图'); return }
  if ((screenshotCount[itemId] || 0) >= 5) { message.warning('已达上限'); return }
  screenshotCount[itemId] = (screenshotCount[itemId] || 0) + 1
  message.success(`已截图 ${screenshotCount[itemId]}/5（${cameras[activeCamera.value].name}）`)
}

// ========== 离开确认 ==========
const hasUnsavedData = computed(() => inspectionItems.some(i => i.problemDesc.trim() || (screenshotCount[i.itemId] || 0) > 0 || i.result === 'fail'))
const handleBack = () => {
  if (hasUnsavedData.value) {
    Modal.confirm({ title:'检查结果尚未提交', content:'确定要离开吗？已填写的内容将不会保存。', okText:'确定离开', cancelText:'继续检查', onOk:() => router.back() })
  } else {
    router.back()
  }
}

// 联动：输入问题→自动选不合格
const onProblemInput = (item: any) => {
  if (item.problemDesc.trim()) item.result = 'fail'
}
// 联动：结果改合格→清除截图
const onResultChange = (item: any) => {
  if (item.result === 'pass') {
    if ((screenshotCount[item.itemId] || 0) > 0) {
      message.info('合格项无需截图，已清除')
      screenshotCount[item.itemId] = 0
    }
  }
}

// ========== 查看标准 ==========
const stdVisible = ref(false)
const stdItem = ref<any>(null)
const viewStandard = (item: any) => {
  stdItem.value = item
  stdVisible.value = true
}

const submitting = ref(false)
const submitInspection = () => {
  const allJudged = inspectionItems.every(i => i.result === 'pass' || i.result === 'fail')
  if (!allJudged) { message.warning('请完成所有检查项的判定'); return }
  const failItems = inspectionItems.filter(i => i.result === 'fail')
  if (failItems.some(i => (screenshotCount[i.itemId] || 0) === 0)) { message.warning('不合格项请截图上报'); return }
  // 仅提交不合格项的截图，合格项的截图不上传
  submitting.value = true
  setTimeout(() => { submitting.value = false; message.success('巡检提交成功'); router.back() }, 1000)
}
</script>

<template>
  <div class="exe-page">
    <!-- 顶部 -->
    <div class="exe-header">
      <ArrowLeftOutlined class="exe-back" @click="handleBack" />
      <span class="exe-header-label">在线巡检</span>
      <span class="exe-header-divider">|</span>
      <span class="exe-header-task">{{ taskName }}</span>
      <span class="exe-header-id">{{ taskId }}</span>
    </div>

    <!-- 主体 -->
    <div class="exe-body">
      <!-- 左侧视频区 -->
      <div class="exe-video" ref="videoRef">
        <div class="exe-cam-tabs">
          <!-- 左箭头 -->
          <span class="exe-cam-arrow" :class="{ disabled: !showLeft() }" @click="showLeft() && scrollLeft()"><LeftOutlined /></span>
          <!-- 摄像头芯片 -->
          <span v-for="(cam, i) in visibleCameras()" :key="i" class="exe-cam-chip"
            :class="{ active: (cameraScroll + i) === activeCamera, offline: !cam.online, linked: isCameraPlaying(cameraScroll + i) && selectedCellIdx === findCameraCell(cameraScroll + i) }"
            @click="clickCamera(cameraScroll + i)"
            @dblclick="dblClickCamera(cameraScroll + i)">
            <span class="exe-cam-dot" :class="{ on: cam.online, off: !cam.online }"></span>
            <VideoCameraOutlined class="exe-cam-chip-icon" />
            <span class="exe-cam-chip-name">{{ cam.name }}</span>
          </span>
          <!-- 右箭头 -->
          <span class="exe-cam-arrow" :class="{ disabled: !showRight() }" @click="showRight() && scrollRight()"><RightOutlined /></span>
          <!-- 全部摄像头下拉 -->
          <a-popover trigger="click" placement="bottomRight" v-model:open="camDropdownOpen" overlay-class-name="cam-drop-popover">
            <span class="exe-cam-more">
              全部 <DownOutlined style="font-size:10px" />
            </span>
            <template #content>
              <div class="cam-drop-list">
                <div v-for="(cam, idx) in cameras" :key="idx" class="cam-drop-item"
                  :class="{ active: idx === activeCamera, off: !cam.online }"
                  @click="jumpToCamera(idx)">
                  <span class="exe-cam-dot" :class="{ on: cam.online, off: !cam.online }"></span>
                  <VideoCameraOutlined style="font-size:12px" />
                  <span class="cam-drop-name">{{ cam.name }}</span>
                </div>
              </div>
            </template>
          </a-popover>
        </div>
        <div class="exe-grid" :class="`g-${splitMode}`">
          <div v-for="(cell, ci) in visibleCells" :key="ci" class="exe-cell"
            :class="{ selected: selectedCellIdx === ci, connecting: cell.status === 'connecting', connected: cell.status === 'connected', 'cam-offline': cell.status === 'connected' && cell.cameraIdx !== null && !cameras[cell.cameraIdx]?.online }"
            @click="clickCell(ci)">
            <template v-if="cell.status === 'empty'">
              <span class="exe-cell-empty">请添加设备</span>
            </template>
            <template v-else-if="cell.status === 'connecting'">
              <a-spin size="small" />
              <span class="exe-cell-text">连接中...</span>
            </template>
            <template v-else-if="cell.cameraIdx !== null && !cameras[cell.cameraIdx]?.online">
              <div class="exe-cell-video offline-bg">
                <div class="exe-cell-overlay">
                  <span class="exe-cell-offline-msg">设备已离线</span>
                  <span class="exe-cell-name">{{ cameras[cell.cameraIdx]?.name }}</span>
                </div>
              </div>
              <span class="exe-cell-close" @click.stop="disconnectCell(ci)" title="断开连接">
                <span class="exe-cell-close-icon">×</span>
              </span>
            </template>
            <template v-else>
              <div class="exe-cell-video">
                <div class="exe-cell-scanline"></div>
                <div class="exe-cell-overlay">
                  <span class="exe-cell-rec">● REC</span>
                  <span class="exe-cell-name">{{ cameras[cell.cameraIdx!]?.name }}</span>
                </div>
              </div>
              <span class="exe-cell-close" @click.stop="disconnectCell(ci)" title="断开连接">
                <span class="exe-cell-close-icon">×</span>
              </span>
            </template>
          </div>
        </div>
        <div class="exe-video-ctrl">
          <a-popover trigger="click" placement="bottom" v-model:open="splitMenuOpen" overlay-class-name="split-popover" :get-popup-container="getPopupContainer" :mouse-enter-delay="0" :mouse-leave-delay="0">
            <a-button size="small">
              <template #icon>
                <span class="split-btn-pv" :class="currentSplit.pv">
                  <span v-for="i in previewCellCount(currentSplit)" :key="i" class="split-btn-pv-cell"></span>
                </span>
              </template>
              {{ currentSplit.label }}
              <DownOutlined style="font-size:10px;margin-left:4px" />
            </a-button>
            <template #content>
              <div class="split-menu">
                <div v-for="opt in splitOptions" :key="opt.value" class="split-card"
                  :class="{ active: splitMode === opt.value }"
                  @click="splitMode = opt.value; splitMenuOpen = false">
                  <div class="split-pv" :class="opt.pv">
                    <span v-for="i in previewCellCount(opt)" :key="i" class="split-pv-cell"></span>
                  </div>
                  <span class="split-card-label">{{ opt.label }}</span>
                </div>
              </div>
            </template>
          </a-popover>
          <a-button size="small" @click="goFullscreen" style="margin-left:8px">
            <template #icon><FullscreenExitOutlined v-if="isFullscreen" /><FullscreenOutlined v-else /></template>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </a-button>
        </div>
      </div>

      <!-- 右侧检查面板 -->
      <div class="exe-panel">
        <div class="exe-store">{{ storeName }}</div>
        <a-select :value="templateName" disabled style="width:100%" size="large">
          <a-select-option :value="templateName">{{ templateName }}</a-select-option>
        </a-select>

        <a-tabs v-model:activeKey="activeCategory" size="small" class="exe-cats">
          <a-tab-pane v-for="(cat, i) in categories" :key="String(i)" :tab="cat" />
        </a-tabs>

        <div class="exe-items">
          <div v-for="item in filteredItems()" :key="item.itemId" class="exe-item">
            <div class="exe-item-title">{{ item.itemName }}</div>
            <a-textarea v-model:value="item.problemDesc" placeholder="如有问题请输入" :rows="2" :maxlength="200" @change="onProblemInput(item)" />
            <div class="exe-item-ops">
              <a-button size="small" class="exe-op-btn" @click="viewStandard(item)"><FileSearchOutlined /> 查看标准</a-button>
              <a-button size="small" class="exe-op-btn" :disabled="!currentCameraOnline" @click="takeScreenshot(item.itemId)">
                <PictureOutlined /> 截图上报
                <span v-if="screenshotCount[item.itemId]" class="exe-sc-badge">{{ screenshotCount[item.itemId] }}/5</span>
              </a-button>
            </div>
            <div class="exe-item-result">
              <span class="exe-result-label">结果：</span>
              <a-radio-group v-model:value="item.result" @change="onResultChange(item)">
                <a-radio value="pass">合格</a-radio>
                <a-radio value="fail">不合格</a-radio>
              </a-radio-group>
            </div>
          </div>
        </div>

        <a-button type="primary" block size="large" :loading="submitting" @click="submitInspection">完成巡检</a-button>
      </div>
    </div>

    <!-- 查看标准 Drawer -->
    <a-drawer v-model:open="stdVisible" title="查看标准" placement="right" :size="400" v-if="stdItem">
      <div class="std-section">
        <div class="std-label">巡检项</div>
        <div class="std-value">{{ stdItem.itemName }}</div>
      </div>
      <div class="std-section">
        <div class="std-label">标准描述</div>
        <div class="std-value">{{ stdItem.standard }}</div>
      </div>
      <div class="std-section" v-if="stdItem.images && stdItem.images.length > 0">
        <div class="std-label">标准图</div>
        <div class="std-imgs">
          <div v-for="(img, i) in stdItem.images" :key="i" class="std-img">标准图{{ Number(i)+1 }}</div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.exe-page { display: flex; flex-direction: column; height: 100%; background: #f5f7fa; }
.exe-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: #fff; border-bottom: 1px solid #e8e8e8; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.exe-back { font-size: 22px; cursor: pointer; color: #555; transition: color .2s; line-height: 1; }
.exe-back:hover { color: #1890ff; }
.exe-header-label { font-size: 16px; font-weight: 600; color: #333; letter-spacing: 0.5px; line-height: 1; }
.exe-header-divider { color: #d9d9d9; font-size: 18px; font-weight: 300; line-height: 1; }
.exe-header-task {
  font-size: 15px; font-weight: 600; line-height: 1.4;
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #096dd9;
  padding: 4px 14px;
  border-radius: 4px;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.exe-header-id {
  font-size: 14px; font-weight: 500; line-height: 1.4;
  font-family: 'SF Mono','Monaco','Menlo',monospace;
  background: #f5f5f5;
  color: #595959;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  letter-spacing: 0.3px;
}
.exe-body { display: flex; flex: 1; overflow: hidden; }

/* 视频区 */
.exe-video { flex: 1; display: flex; flex-direction: column; padding: 12px; min-width: 0; }
/* 摄像头芯片栏 */
.exe-cam-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 4px 0;
  flex-wrap: nowrap;
  overflow: hidden;
}
.exe-cam-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  transition: all .2s;
  flex-shrink: 0;
}
.exe-cam-arrow:hover { color: #1890ff; border-color: #1890ff; background: #e6f7ff; box-shadow: 0 0 6px rgba(24,144,255,.25); }
.exe-cam-arrow.disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
/* 摄像头芯片 */
.exe-cam-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
  color: #555;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  transition: all .2s;
  flex-shrink: 0;
  user-select: none;
}
.exe-cam-chip:hover { border-color: #bae7ff; background: #f6fbff; }
.exe-cam-chip.active {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  border-color: #1890ff;
  color: #096dd9;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(24,144,255,.2);
}
/* 关联高亮：设备与播放格子联动选中 */
.exe-cam-chip.linked {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,.25), 0 1px 4px rgba(24,144,255,.2);
}
.exe-cam-chip.offline { background: #f5f5f5; border-color: #e0e0e0; color: #bbb; }
.exe-cam-chip.offline .exe-cam-chip-icon,
.exe-cam-chip.offline .exe-cam-chip-name { opacity: 0.45; }
.exe-cam-chip.offline .exe-cam-dot { opacity: 1; } /* 状态点不受置灰影响 */
.exe-cam-chip.offline:hover { background: #f0f0f0; color: #999; }
.exe-cam-chip.offline:hover .exe-cam-chip-icon,
.exe-cam-chip.offline:hover .exe-cam-chip-name { opacity: 0.65; }
/* 状态点 */
.exe-cam-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9d9d9;
  flex-shrink: 0;
  display: inline-block;
}
.exe-cam-dot.on { background: #52c41a; box-shadow: 0 0 4px rgba(82,196,26,.5); }
.exe-cam-dot.off { background: #ff4d4f; box-shadow: 0 0 4px rgba(255,77,79,.4); }
.exe-cam-chip.active .exe-cam-dot.on { box-shadow: 0 0 6px rgba(82,196,26,.7); }
/* 芯片内图标和文字 */
.exe-cam-chip-icon { font-size: 13px; flex-shrink: 0; }
.exe-cam-chip-name { overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
/* 徽章 */
.exe-cam-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
  line-height: 1.4;
  flex-shrink: 0;
}
.exe-cam-badge.off { background: #fff1f0; color: #ff4d4f; }
/* 全部按钮 */
.exe-cam-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  background: #fafafa;
  border: 1.5px dashed #d9d9d9;
  transition: all .2s;
  flex-shrink: 0;
  white-space: nowrap;
}
.exe-cam-more:hover { border-color: #1890ff; color: #1890ff; background: #e6f7ff; }
/* 下拉列表 */
.cam-drop-list { display: flex; flex-direction: column; min-width: 220px; max-height: 260px; overflow-y: auto; padding: 4px; }
.cam-drop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  transition: background .15s;
}
.cam-drop-item:hover { background: #f0f5ff; }
.cam-drop-item.active { background: #e6f7ff; color: #1890ff; font-weight: 600; }
.cam-drop-item.off { opacity: 0.5; }
.cam-drop-item.off .exe-cam-dot { opacity: 1; }
.cam-drop-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.exe-grid { flex: 1; display: grid; gap: 3px; }
/* 简单布局：直接用行列数 */
.exe-grid.g-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.exe-grid.g-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.exe-grid.g-9 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
.exe-grid.g-12 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr; }
.exe-grid.g-16 { grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr; }
/* 1+5：左上大(2×2) + 右2 + 底3 */
.exe-grid.g-6 {
  grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas: 'a a b' 'a a c' 'd e f';
}
/* 1+7：4列×4行，左大(3col×3row) + 右3小 + 底4 */
.exe-grid.g-8 {
  grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr;
  grid-template-areas: 'a a a b' 'a a a c' 'a a a d' 'e f g h';
}
/* 3+4：左2大(上下) + 右上1大 + 右下4小(2×2) */
.exe-grid.g-7 {
  grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr;
  grid-template-areas: 'a a c c' 'a a c c' 'b b d e' 'b b f g';
}
/* 区域分配 */
.exe-grid.g-6 .exe-cell:nth-child(1) { grid-area: a; }
.exe-grid.g-8 .exe-cell:nth-child(1) { grid-area: a; }
.exe-grid.g-7 .exe-cell:nth-child(1) { grid-area: a; }
.exe-grid.g-7 .exe-cell:nth-child(2) { grid-area: b; }
.exe-grid.g-7 .exe-cell:nth-child(3) { grid-area: c; }
.exe-cell { background: #1a1a2e; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px; border-radius: 4px; position: relative; cursor: pointer; border: 2px solid transparent; transition: all .25s; overflow: hidden; }
.exe-cell:hover { border-color: #444; }
.exe-cell.selected { border-color: #1890ff; box-shadow: inset 0 0 30px rgba(24,144,255,.08); }
.exe-cell.connecting { color: #1890ff; flex-direction: column; gap: 8px; }
.exe-cell.connected { border-color: #52c41a; }
/* 播放中离线 */
.exe-cell.cam-offline { border-color: #ff4d4f; }
.exe-cell.cam-offline .exe-cell-video.offline-bg { background: radial-gradient(ellipse at 30% 40%, #2a1a1a 0%, #110d0d 60%, #0e0a0a 100%); }
.exe-cell-offline-msg {
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.exe-cell-empty { color: #555; font-size: 13px; }
/* 视频模拟 */
.exe-cell-video {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 40%, #1e2a3a 0%, #0d1117 60%, #0a0e14 100%);
  display: flex;
  align-items: flex-end;
}
.exe-cell-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.008) 2px, rgba(255,255,255,.008) 4px);
  animation: scanMove 4s linear infinite;
  pointer-events: none;
}
@keyframes scanMove { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }
.exe-cell-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px 10px;
  background: linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%);
  pointer-events: none;
}
.exe-cell-rec {
  color: #ff4d4f;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  animation: recBlink 1s step-end infinite;
  margin-bottom: 2px;
}
@keyframes recBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.exe-cell-name { font-size: 12px; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* 关闭按钮 */
.exe-cell-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: 0;
  transition: opacity .2s;
}
.exe-cell:hover .exe-cell-close { opacity: 1; }
.exe-cell-close-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,.6);
  color: rgba(255,255,255,.7);
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  transition: all .2s;
}
.exe-cell-close:hover .exe-cell-close-icon { background: #ff4d4f; color: #fff; }
.exe-video-ctrl { display: flex; align-items: center; justify-content: center; padding: 10px 0 0; }

/* 分屏按钮迷你预览 */
.split-btn-pv {
  display: inline-grid;
  width: 16px;
  height: 16px;
  gap: 1px;
  vertical-align: middle;
}
.split-btn-pv-cell {
  background: #bbb;
  border-radius: 1px;
  min-width: 0;
  min-height: 0;
}

/* 分屏下拉 - 可视化网格选择器 */
.split-menu {
  display: grid;
  grid-template-columns: repeat(4, 72px);
  gap: 6px;
  padding: 8px;
}
.split-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all .2s;
}
.split-card:hover { background: #f0f5ff; border-color: #d6e4ff; }
.split-card.active { background: #e6f7ff; border-color: #1890ff; }
.split-pv {
  display: grid;
  width: 48px;
  height: 48px;
  gap: 2px;
}
.split-pv-cell {
  background: #d9d9d9;
  border-radius: 2px;
  min-width: 0;
  min-height: 0;
}
.split-card.active .split-pv-cell { background: #91d5ff; }
/* 简单网格 */
.split-pv.pv-1 { grid-template-columns:1fr; grid-template-rows:1fr; }
.split-pv.pv-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.split-pv.pv-9 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; }
.split-pv.pv-12 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.split-pv.pv-16 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
/* 1+5：左大+右2+底3 */
.split-pv.pv-6 {
  grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr;
  grid-template-areas:'a a b' 'a a c' 'd e f';
}
.split-pv.pv-6 .split-pv-cell:nth-child(1) { grid-area:a; }
.split-pv.pv-6 .split-pv-cell:nth-child(2) { grid-area:b; }
.split-pv.pv-6 .split-pv-cell:nth-child(3) { grid-area:c; }
.split-pv.pv-6 .split-pv-cell:nth-child(4) { grid-area:d; }
.split-pv.pv-6 .split-pv-cell:nth-child(5) { grid-area:e; }
.split-pv.pv-6 .split-pv-cell:nth-child(6) { grid-area:f; }
/* 1+7：左大+右3+底4 */
.split-pv.pv-8 {
  grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr;
  grid-template-areas:'a a a b' 'a a a c' 'a a a d' 'e f g h';
}
.split-pv.pv-8 .split-pv-cell:nth-child(1) { grid-area:a; }
.split-pv.pv-8 .split-pv-cell:nth-child(2) { grid-area:b; }
.split-pv.pv-8 .split-pv-cell:nth-child(3) { grid-area:c; }
.split-pv.pv-8 .split-pv-cell:nth-child(4) { grid-area:d; }
.split-pv.pv-8 .split-pv-cell:nth-child(5) { grid-area:e; }
.split-pv.pv-8 .split-pv-cell:nth-child(6) { grid-area:f; }
.split-pv.pv-8 .split-pv-cell:nth-child(7) { grid-area:g; }
.split-pv.pv-8 .split-pv-cell:nth-child(8) { grid-area:h; }
/* 3+4：左上大+左下大+右上大+右下4小 */
.split-pv.pv-7 {
  grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr;
  grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g';
}
.split-pv.pv-7 .split-pv-cell:nth-child(1) { grid-area:a; }
.split-pv.pv-7 .split-pv-cell:nth-child(2) { grid-area:b; }
.split-pv.pv-7 .split-pv-cell:nth-child(3) { grid-area:c; }
.split-pv.pv-7 .split-pv-cell:nth-child(4) { grid-area:d; }
.split-pv.pv-7 .split-pv-cell:nth-child(5) { grid-area:e; }
.split-pv.pv-7 .split-pv-cell:nth-child(6) { grid-area:f; }
.split-pv.pv-7 .split-pv-cell:nth-child(7) { grid-area:g; }
/* 按钮迷你预览：布局与面板一致 */
.split-btn-pv.pv-1 { grid-template-columns:1fr; grid-template-rows:1fr; }
.split-btn-pv.pv-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.split-btn-pv.pv-9 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; }
.split-btn-pv.pv-12 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.split-btn-pv.pv-16 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.split-btn-pv.pv-6 {
  grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr;
  grid-template-areas:'a a b' 'a a c' 'd e f';
}
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(1) { grid-area:a; }
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(2) { grid-area:b; }
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(3) { grid-area:c; }
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(4) { grid-area:d; }
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(5) { grid-area:e; }
.split-btn-pv.pv-6 .split-btn-pv-cell:nth-child(6) { grid-area:f; }
.split-btn-pv.pv-8 {
  grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr;
  grid-template-areas:'a a a b' 'a a a c' 'a a a d' 'e f g h';
}
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(1) { grid-area:a; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(2) { grid-area:b; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(3) { grid-area:c; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(4) { grid-area:d; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(5) { grid-area:e; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(6) { grid-area:f; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(7) { grid-area:g; }
.split-btn-pv.pv-8 .split-btn-pv-cell:nth-child(8) { grid-area:h; }
.split-btn-pv.pv-7 {
  grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr;
  grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g';
}
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(1) { grid-area:a; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(2) { grid-area:b; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(3) { grid-area:c; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(4) { grid-area:d; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(5) { grid-area:e; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(6) { grid-area:f; }
.split-btn-pv.pv-7 .split-btn-pv-cell:nth-child(7) { grid-area:g; }
.split-card-label {
  font-size: 12px;
  color: #666;
  line-height: 1;
  white-space: nowrap;
}
.split-card.active .split-card-label { color: #1890ff; font-weight: 600; }

/* 检查面板 */
.exe-panel { width: 400px; flex-shrink: 0; padding: 20px; overflow-y: auto; background: #fff; border-left: 1px solid #e8e8e8; }
.exe-store { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 14px; }
.exe-cats { margin-top: 12px; margin-bottom: 12px; }
.exe-cats :deep(.ant-tabs-nav) { margin-bottom: 0; }
.exe-items { margin-bottom: 16px; }
.exe-item { background: #fff; border: 1px solid #f0f0f0; border-radius: 6px; padding: 14px; margin-bottom: 12px; }
.exe-item-title { font-size: 14px; color: #333; margin-bottom: 8px; }
.exe-item-title::before { content: '巡检项：'; color: #999; font-weight: 400; }
.exe-item-ops { display: flex; gap: 8px; margin: 10px 0; }
.exe-op-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; border-radius: 4px; }
.exe-sc-badge { color: #52c41a; font-weight: 500; margin-left: 2px; }
.exe-item-result { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px solid #f5f5f5; }
.exe-result-label { font-size: 13px; color: #999; }

/* 查看标准 Drawer */
.std-section { margin-bottom: 20px; }
.std-label { font-size: 13px; color: #999; margin-bottom: 6px; }
.std-value { font-size: 14px; color: #333; line-height: 1.8; }
.std-imgs { display: flex; gap: 8px; }
.std-img { width: 100px; height: 100px; border: 1px solid #e8e8e8; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px; background: #fafafa; }
</style>

<style>
.split-popover .ant-popover-inner { padding: 0 !important; }
.split-popover .ant-popover-inner-content { padding: 0 !important; }
.cam-drop-popover .ant-popover-inner { padding: 4px !important; }
.cam-drop-popover .ant-popover-inner-content { padding: 0 !important; }
</style>
