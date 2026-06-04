<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, h } from 'vue'
import { message } from 'antdv-next'
import {
  VideoCameraOutlined, AudioOutlined, AudioMutedOutlined,
  PlayCircleOutlined, PauseCircleOutlined, FullscreenOutlined, FullscreenExitOutlined,
  CameraOutlined, SearchOutlined, EnvironmentOutlined,
  BulbOutlined, SwapOutlined, ExpandOutlined,
  HistoryOutlined, SettingOutlined,
  CaretUpOutlined, CaretDownOutlined, CaretLeftOutlined, CaretRightOutlined,
  PlusOutlined, MinusOutlined, CloseOutlined, CheckOutlined,
  PlayCircleFilled, DownloadOutlined,
  SoundOutlined, VideoCameraFilled,
  ReloadOutlined, CaretRightOutlined as CaretRight,
  LeftOutlined, RightOutlined, StarOutlined, EditOutlined,
  GlobalOutlined, SyncOutlined, UnorderedListOutlined,
} from '@antdv-next/icons'

// ========== Tab 状态 ==========
type TabKey = 'live' | 'playback' | 'map'
const activeTab = ref<TabKey>('live')

// ========== 区域树（含设备叶子节点） ==========
interface TreeNode {
  key: string; title: string; count?: number; children?: TreeNode[]
  isDevice?: boolean; online?: boolean; deviceId?: string
}

const rawRegionTree: TreeNode[] = [
  {
    key: 'root', title: '鹤梦信息大中华区', count: 50,
    children: [
      { key: 'huabei', title: '华北大区', count: 20,
        children: [
          { key: 'beijing', title: '北京市', count: 12,
            children: [
              { key: 'bj-cbd', title: 'CBD商圈', count: 7,
                children: [
                  { key: 'bj-cbd-s1', title: 'xxx店铺a', count: 3,
                    children: [
                      { key: 'd-bj-1', title: '设备名称A', isDevice:true, online:true, deviceId:'d-bj-1' },
                      { key: 'd-bj-2', title: '设备名称B', isDevice:true, online:true, deviceId:'d-bj-2' },
                      { key: 'd-bj-3', title: '设备名称C', isDevice:true, online:false, deviceId:'d-bj-3' },
                    ]
                  },
                  { key: 'bj-cbd-s2', title: 'xxx店铺b', count: 4,
                    children: [
                      { key: 'd-bj-4', title: '设备名称D', isDevice:true, online:true, deviceId:'d-bj-4' },
                      { key: 'd-bj-5', title: '设备名称E', isDevice:true, online:true, deviceId:'d-bj-5' },
                      { key: 'd-bj-6', title: '设备名称F', isDevice:true, online:true, deviceId:'d-bj-6' },
                      { key: 'd-bj-7', title: '设备名称G', isDevice:true, online:false, deviceId:'d-bj-7' },
                    ]
                  },
                ]
              },
              { key: 'bj-zgc', title: '中关村商圈', count: 5,
                children: [
                  { key: 'bj-zgc-s1', title: 'xxx店铺c', count: 5,
                    children: [
                      { key: 'd-bj-8', title: '设备名称H', isDevice:true, online:true, deviceId:'d-bj-8' },
                      { key: 'd-bj-9', title: '设备名称I', isDevice:true, online:true, deviceId:'d-bj-9' },
                      { key: 'd-bj-10', title: '设备名称J', isDevice:true, online:true, deviceId:'d-bj-10' },
                      { key: 'd-bj-11', title: '设备名称K', isDevice:true, online:false, deviceId:'d-bj-11' },
                      { key: 'd-bj-12', title: '设备名称L', isDevice:true, online:true, deviceId:'d-bj-12' },
                    ]
                  },
                ]
              },
            ]
          },
          { key: 'tianjin', title: '天津市', count: 8,
            children: [
              { key: 'tj-bh', title: '滨海新区', count: 8,
                children: [
                  { key: 'tj-bh-s1', title: 'xxx店铺d', count: 4,
                    children: [
                      { key: 'd-tj-1', title: '设备名称A', isDevice:true, online:true, deviceId:'d-tj-1' },
                      { key: 'd-tj-2', title: '设备名称B', isDevice:true, online:true, deviceId:'d-tj-2' },
                      { key: 'd-tj-3', title: '设备名称C', isDevice:true, online:false, deviceId:'d-tj-3' },
                      { key: 'd-tj-4', title: '设备名称D', isDevice:true, online:true, deviceId:'d-tj-4' },
                    ]
                  },
                  { key: 'tj-bh-s2', title: 'xxx店铺e', count: 4,
                    children: [
                      { key: 'd-tj-5', title: '设备名称E', isDevice:true, online:true, deviceId:'d-tj-5' },
                      { key: 'd-tj-6', title: '设备名称F', isDevice:true, online:true, deviceId:'d-tj-6' },
                      { key: 'd-tj-7', title: '设备名称G', isDevice:true, online:true, deviceId:'d-tj-7' },
                      { key: 'd-tj-8', title: '设备名称H', isDevice:true, online:false, deviceId:'d-tj-8' },
                    ]
                  },
                ]
              },
            ]
          },
        ]
      },
      { key: 'huanan', title: '华南大区', count: 5,
        children: [
          { key: 'guangzhou', title: '广州市', count: 5,
            children: [
              { key: 'gz-th', title: '天河商圈', count: 5,
                children: [
                  { key: 'gz-th-s1', title: 'xxx店铺a', count: 3,
                    children: [
                      { key: 'd-gz-1', title: '设备名称A', isDevice:true, online:true, deviceId:'d-gz-1' },
                      { key: 'd-gz-2', title: '设备名称B', isDevice:true, online:true, deviceId:'d-gz-2' },
                      { key: 'd-gz-3', title: '设备名称C', isDevice:true, online:false, deviceId:'d-gz-3' },
                    ]
                  },
                  { key: 'gz-th-s2', title: 'xxx店铺b', count: 2,
                    children: [
                      { key: 'd-gz-4', title: '设备名称D', isDevice:true, online:true, deviceId:'d-gz-4' },
                      { key: 'd-gz-5', title: '设备名称E', isDevice:true, online:true, deviceId:'d-gz-5' },
                    ]
                  },
                ]
              },
            ]
          },
        ]
      },
      { key: 'huadong', title: '华东大区', count: 25,
        children: [
          { key: 'nanjing', title: '南京市', count: 25,
            children: [
              { key: 'nj-qb', title: '桥北万象城', count: 10,
                children: [
                  { key: 'nj-qb-s1', title: 'xxx店铺a', count: 5,
                    children: [
                      { key: 'd-nj-1', title: '设备名称A', isDevice:true, online:true, deviceId:'d-nj-1' },
                      { key: 'd-nj-2', title: '设备名称B', isDevice:true, online:true, deviceId:'d-nj-2' },
                      { key: 'd-nj-3', title: '设备名称C', isDevice:true, online:false, deviceId:'d-nj-3' },
                      { key: 'd-nj-4', title: '设备名称D', isDevice:true, online:true, deviceId:'d-nj-4' },
                      { key: 'd-nj-5', title: '设备名称E', isDevice:true, online:true, deviceId:'d-nj-5' },
                    ]
                  },
                  { key: 'nj-qb-s2', title: 'xxx店铺b', count: 5,
                    children: [
                      { key: 'd-nj-6', title: '设备名称F', isDevice:true, online:true, deviceId:'d-nj-6' },
                      { key: 'd-nj-7', title: '设备名称G', isDevice:true, online:true, deviceId:'d-nj-7' },
                      { key: 'd-nj-8', title: '设备名称H', isDevice:true, online:true, deviceId:'d-nj-8' },
                      { key: 'd-nj-9', title: '设备名称I', isDevice:true, online:false, deviceId:'d-nj-9' },
                      { key: 'd-nj-10', title: '设备名称J', isDevice:true, online:true, deviceId:'d-nj-10' },
                    ]
                  },
                ]
              },
              { key: 'nj-gl', title: '鼓楼万达', count: 5,
                children: [
                  { key: 'nj-gl-s1', title: 'xxx店铺c', count: 5,
                    children: [
                      { key: 'd-nj-11', title: '设备名称K', isDevice:true, online:true, deviceId:'d-nj-11' },
                      { key: 'd-nj-12', title: '设备名称L', isDevice:true, online:true, deviceId:'d-nj-12' },
                      { key: 'd-nj-13', title: '设备名称M', isDevice:true, online:false, deviceId:'d-nj-13' },
                      { key: 'd-nj-14', title: '设备名称N', isDevice:true, online:true, deviceId:'d-nj-14' },
                      { key: 'd-nj-15', title: '设备名称O', isDevice:true, online:true, deviceId:'d-nj-15' },
                    ]
                  },
                ]
              },
              { key: 'nj-jn', title: '江宁万达', count: 10,
                children: [
                  { key: 'nj-jn-s1', title: 'xxx店铺d', count: 3,
                    children: [
                      { key: 'd-nj-16', title: '设备名称A', isDevice:true, online:true, deviceId:'d-nj-16' },
                      { key: 'd-nj-17', title: '设备名称B', isDevice:true, online:true, deviceId:'d-nj-17' },
                      { key: 'd-nj-18', title: '设备名称C', isDevice:true, online:false, deviceId:'d-nj-18' },
                    ]
                  },
                  { key: 'nj-jn-s2', title: 'xxx店铺e', count: 3,
                    children: [
                      { key: 'd-nj-19', title: '设备名称D', isDevice:true, online:true, deviceId:'d-nj-19' },
                      { key: 'd-nj-20', title: '设备名称E', isDevice:true, online:true, deviceId:'d-nj-20' },
                      { key: 'd-nj-21', title: '设备名称F', isDevice:true, online:true, deviceId:'d-nj-21' },
                    ]
                  },
                  { key: 'nj-jn-s3', title: 'xxx店铺f', count: 4,
                    children: [
                      { key: 'd-nj-22', title: '设备名称A', isDevice:true, online:true, deviceId:'d-nj-22' },
                      { key: 'd-nj-23', title: '设备名称B', isDevice:true, online:true, deviceId:'d-nj-23' },
                      { key: 'd-nj-24', title: '设备名称C', isDevice:true, online:false, deviceId:'d-nj-24' },
                      { key: 'd-nj-25', title: '设备名称D', isDevice:true, online:true, deviceId:'d-nj-25' },
                    ]
                  },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
]

// title 加 count 后缀（不做 emoji 处理，由 titleRender 统一渲染）
const attachCountSuffix = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => ({
  ...n,
  title: n.count !== undefined ? `${n.title}(${n.count})` : n.title,
  children: n.children ? attachCountSuffix(n.children) : undefined,
}))
const regionTree = computed(() => attachCountSuffix(rawRegionTree))

// 自定义树节点渲染：设备节点前加状态圆点，后加播放/轮巡状态图标
const titleRender = (nodeData: any) => {
  if (nodeData.isDevice) {
    const deviceId = nodeData.deviceId as string
    // 回放模式下：仅显示回放中状态，不显示直播播放状态
    const isPlaybackDevice = activeTab.value === 'playback' && playbackDevice.value?.id === deviceId
    const isPlaying = activeTab.value !== 'playback' && gridCells.some(c => c.deviceId === deviceId && c.status === 'connected')
    const isPatrolling = activeTab.value !== 'playback' && patrolRunning && patrolCheckedDeviceIds.value.includes(deviceId)
    return h('span', { class: 'vs-tree-device', 'data-device-id': deviceId, draggable: 'true' }, [
      h('span', { class: ['vs-tree-dot', nodeData.online ? 'online' : ''] }),
      h('span', { class: 'vs-tree-device-name' }, nodeData.title),
      isPatrolling ? h('span', { class: 'vs-tree-status vs-tree-patrol', title: '轮巡中' }, [
        h(ReloadOutlined, { class: 'vs-tree-patrol-icon' }),
      ]) :
      isPlaybackDevice ? h('span', { class: 'vs-tree-status vs-tree-replaying', title: '回放中' }, [
        h(HistoryOutlined, { class: 'vs-tree-replay-icon' }),
      ]) :
      isPlaying ? h('span', { class: 'vs-tree-status vs-tree-playing', title: '播放中' }, [
        h(CaretRight, { class: 'vs-tree-play-icon' }),
      ]) : null,
    ])
  }
  return nodeData.title
}

// ========== 侧边栏折叠 ==========
const sidebarCollapsed = ref(false)
const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }

// ========== 设备详情 ==========
interface Device {
  id: string; name: string; online: boolean
  capabilities: { ptz: boolean; intercom: boolean; light: boolean }
  streamType: 'main' | 'sub'; snapshot: string
}

const allDevicesMap = computed(() => {
  const map: Record<string, Device> = {}
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.isDevice && n.deviceId) {
        const hash = n.deviceId.split('').reduce((a,c)=>a+c.charCodeAt(0),0)
        map[n.deviceId] = {
          id: n.deviceId, name: n.title, online: n.online ?? false,
          capabilities: { ptz: hash%3===0, intercom: hash%3===1, light: hash%3===2 },
          streamType: 'main', snapshot: '📹',
        }
      }
      if (n.children) walk(n.children)
    }
  }
  walk(rawRegionTree)
  return map
})
const getDeviceById = (id: string): Device | undefined => allDevicesMap.value[id]

// ========== 左侧树面板 ==========
const selectedKey = ref<string>('huanan')
const expandedKeys = ref<string[]>(['root', 'huadong', 'nanjing', 'nj-jn', 'nj-jn-s3'])
const searchText = ref('')

const onTreeSelect = (keys: string[], info: any) => {
  if (keys.length > 0 && info?.node?.isDevice) {
    // 单击设备仅选中高亮，不添加到播放区
    selectedKey.value = keys[0]
    // 取消视频格选中
    selectedCellIdx.value = null
    // 回放模式下：单击设备即加载回放画面
    if (activeTab.value === 'playback') {
      const dev = getDeviceById(info.node.deviceId)
      if (dev) selectPlaybackDevice(dev)
    }
    return
  }
  if (keys.length > 0) {
    selectedKey.value = keys[0]
    // 选中区域节点时取消视频格选中
    selectedCellIdx.value = null
  }
}

const onTreeDblClick = (_e: Event, node: any) => {
  if (node?.isDevice) {
    const dev = getDeviceById(node.deviceId)
    if (dev) {
      const targetIdx = selectedCellIdx.value !== null ? selectedCellIdx.value : -1
      addDeviceToGrid(dev, targetIdx)
    }
  }
}

// 通过事件委托捕获树中设备节点的双击
const onTreeWrapperDblClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const deviceEl = target.closest('.vs-tree-device') as HTMLElement | null
  if (!deviceEl) return
  const deviceId = deviceEl.getAttribute('data-device-id')
  if (!deviceId) return
  const dev = getDeviceById(deviceId)
  if (!dev || !dev.online) { message.warning('该设备当前离线，无法播放'); return }
  const targetIdx = selectedCellIdx.value !== null ? selectedCellIdx.value : -1
  addDeviceToGrid(dev, targetIdx)
}

// ========== 拖拽支持 ==========
const dragDeviceId = ref<string | null>(null)
const onTreeDragStart = (e: DragEvent) => {
  const target = e.target as HTMLElement
  const deviceEl = target.closest('.vs-tree-device')
  if (!deviceEl) { e.preventDefault(); return }
  // 从 data-device-id 属性读取设备 ID
  const deviceId = deviceEl.getAttribute('data-device-id')
  if (!deviceId) { e.preventDefault(); return }
  const dev = getDeviceById(deviceId)
  if (!dev || !dev.online) { e.preventDefault(); return }
  dragDeviceId.value = deviceId
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', deviceId)
}
const onCellDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
}
const onCellDrop = (e: DragEvent, cellIdx: number) => {
  e.preventDefault()
  const deviceId = e.dataTransfer?.getData('text/plain')
  if (!deviceId) return
  const dev = getDeviceById(deviceId)
  if (dev) addDeviceToGrid(dev, cellIdx)
  dragDeviceId.value = null
}

// ========== 树节点选中联动 ==========
// 点击视频格：任意格均可选中（空格/连接中/已连接），已连接格联动树高亮
const clickCell = (idx:number) => {
  selectedCellIdx.value = idx
  // 已连接格：联动树选中对应设备节点
  if (gridCells[idx].status==='connected') {
    const deviceId = gridCells[idx].deviceId
    if (deviceId) {
      const findDeviceKey = (nodes: TreeNode[]): string | null => {
        for (const n of nodes) {
          if (n.deviceId === deviceId) return n.key
          if (n.children) {
            const r = findDeviceKey(n.children)
            if (r) return r
          }
        }
        return null
      }
      const key = findDeviceKey(rawRegionTree)
      if (key) {
        selectedKey.value = key
        const expandParents = (nodes: TreeNode[], target: string, parents: string[]): string[] | null => {
          for (const n of nodes) {
            if (n.key === target) return parents
            if (n.children) {
              const r = expandParents(n.children, target, [...parents, n.key])
              if (r) return r
            }
          }
          return null
        }
        const parents = expandParents(rawRegionTree, key, [])
        if (parents) {
          expandedKeys.value = [...new Set([...expandedKeys.value, ...parents])]
        }
      }
    }
  }
}

// ========== 播放区（支持多分屏，参考在线巡检） ==========
interface GridCell {
  deviceId: string | null; deviceName: string; status: 'empty'|'connecting'|'connected'|'error'
  paused: boolean; muted: boolean; flipped: boolean; streamType: 'main'|'sub'
  isRecording: boolean; recordDuration: number
}

const splitMode = ref(4)
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
const visibleCount = computed(() => {
  const m = splitMode.value
  if (m === 6) return 6; if (m === 8) return 8; if (m === 7) return 7
  return m
})

const gridCells = reactive<GridCell[]>(
  Array.from({length:16}, () => ({
    deviceId:null, deviceName:'', status:'empty' as const,
    paused:false, muted:true, flipped:false, streamType:'main' as const,
    isRecording:false, recordDuration:0,
  }))
)
const visibleCells = computed(() => gridCells.slice(0, visibleCount.value))

const selectedCellIdx = ref<number|null>(null)
const selectedCell = computed(() => selectedCellIdx.value!==null ? visibleCells.value[selectedCellIdx.value] : null)
const selectedDevice = computed(() => selectedCell.value?.deviceId ? getDeviceById(selectedCell.value.deviceId) : null)
const hasSelection = computed(() => selectedCell.value?.status==='connected')
const canPTZ = computed(() => selectedDevice.value?.capabilities.ptz ?? false)
const canIntercom = computed(() => selectedDevice.value?.capabilities.intercom ?? false)
const canLight = computed(() => selectedDevice.value?.capabilities.light ?? false)

const addDeviceToGrid = (device: Device, preferredIdx: number = -1) => {
  if (!device.online) { message.warning('该设备当前离线，无法播放'); return }
  const vis = visibleCells.value
  const existIdx = vis.findIndex(c => c.deviceId===device.id && (c.status==='connected' || c.status==='connecting'))
  if (existIdx!==-1) { selectedCellIdx.value=existIdx; return }
  // 优先使用指定位置（拖拽/点击选中格），否则找空格，最后替换最后一个
  let targetIdx = preferredIdx
  if (targetIdx < 0 || vis[targetIdx]?.status !== 'empty') {
    targetIdx = vis.findIndex(c => c.status==='empty')
  }
  if (targetIdx < 0) targetIdx = visibleCount.value-1
  gridCells[targetIdx] = { deviceId:device.id, deviceName:device.name, status:'connecting', paused:false, muted:true, flipped:false, streamType:device.streamType, isRecording:false, recordDuration:0 }
  setTimeout(() => { if (gridCells[targetIdx].deviceId===device.id) { gridCells[targetIdx].status='connected'; selectedCellIdx.value=targetIdx } }, 600)
}

const closeCell = (idx:number) => {
  gridCells[idx] = { deviceId:null, deviceName:'', status:'empty', paused:false, muted:true, flipped:false, streamType:'main', isRecording:false, recordDuration:0 }
  if (selectedCellIdx.value===idx) selectedCellIdx.value=null
}

// 分屏切换时重置
watch(splitMode, () => {
  for (let i=0; i<16; i++) { gridCells[i] = { deviceId:null, deviceName:'', status:'empty', paused:false, muted:true, flipped:false, streamType:'main', isRecording:false, recordDuration:0 } }
  selectedCellIdx.value = null
})

// ========== 播放控制 ==========
const togglePlay = () => { if (selectedCellIdx.value!==null) gridCells[selectedCellIdx.value].paused=!gridCells[selectedCellIdx.value].paused }
const toggleMute = () => { if (selectedCellIdx.value!==null) gridCells[selectedCellIdx.value].muted=!gridCells[selectedCellIdx.value].muted }
const toggleStreamType = () => {
  if (selectedCellIdx.value===null) return
  const c = gridCells[selectedCellIdx.value]; c.streamType = c.streamType==='main'?'sub':'main'
  message.info(`已切换至${c.streamType==='main'?'主码流 FHD':'子码流 HD'}`)
}

const ptzPanelOpen = ref(false)
const ptzSpeed = ref(5)
const ptzZoom = ref(1)
const ptzOpticalZoom = ref(10)
const togglePTZ = () => { if (!canPTZ.value) { message.info('当前设备不支持云台控制'); return } ptzPanelOpen.value=!ptzPanelOpen.value }

// 收藏点位管理
interface PtzPreset { id: number; name: string }
const ptzPresets = ref<PtzPreset[]>([
  { id: 1, name: '大门全景' },
  { id: 2, name: '收银区域' },
  { id: 3, name: '仓库入口' },
  { id: 4, name: '后门通道' },
])
const ptzEditingPresetId = ref<number | null>(null)
const ptzEditingName = ref('')
const ptzNextId = ref(5)

const startRenamePreset = (preset: PtzPreset) => {
  ptzEditingPresetId.value = preset.id
  ptzEditingName.value = preset.name
  nextTick(() => {
    const input = document.querySelector('.vs-ptz-rename-input input') as HTMLInputElement
    if (input) { input.focus(); input.select() }
  })
}
const confirmRenamePreset = () => {
  if (ptzEditingPresetId.value !== null && ptzEditingName.value.trim()) {
    const preset = ptzPresets.value.find(p => p.id === ptzEditingPresetId.value)
    if (preset) preset.name = ptzEditingName.value.trim()
  }
  ptzEditingPresetId.value = null
  ptzEditingName.value = ''
}
const cancelRenamePreset = () => { ptzEditingPresetId.value = null; ptzEditingName.value = '' }
const addPreset = () => {
  if (ptzPresets.value.length >= 8) { message.warning('最多添加 8 个收藏点位'); return }
  ptzPresets.value.push({ id: ptzNextId.value++, name: `点位${ptzPresets.value.length + 1}` })
}
const deletePreset = (id: number) => {
  ptzPresets.value = ptzPresets.value.filter(p => p.id !== id)
}
const ptzDirection = (dir:string) => message.info(`云台${dir}...`)

const isIntercoming = ref(false)
const toggleIntercom = () => { if (!canIntercom.value) { message.info('当前设备不支持语音对讲'); return } isIntercoming.value=!isIntercoming.value; message.info(isIntercoming.value?'对讲已开启（按住说话）':'对讲已结束') }

const lightPanelOpen = ref(false)
const lightMode = ref('auto')
const toggleLight = () => { if (!canLight.value) { message.info('当前设备不支持灯光控制'); return } lightPanelOpen.value=!lightPanelOpen.value }
const setLightMode = (mode:string) => { lightMode.value=mode; lightPanelOpen.value=false; const labels:Record<string,string>={auto:'自动',on:'常亮',off:'常灭',ir:'红外'}; message.success(`灯光模式：${labels[mode]||mode}`) }

const toggleFlip = () => { if (selectedCellIdx.value!==null) gridCells[selectedCellIdx.value].flipped=!gridCells[selectedCellIdx.value].flipped }
const eZoomMode = ref(false)
const toggleEZoom = () => { if (selectedCellIdx.value===null) return; eZoomMode.value=!eZoomMode.value; if (eZoomMode.value) message.info('电子放大模式已开启，ESC退出') }
const exitEZoom = () => { eZoomMode.value=false }

let recordTimer: ReturnType<typeof setInterval> | null = null
const toggleRecord = () => {
  if (selectedCellIdx.value===null) return
  const c = gridCells[selectedCellIdx.value]
  if (c.isRecording) { c.isRecording=false; if (recordTimer) { clearInterval(recordTimer); recordTimer=null } c.recordDuration=0; message.success('录像已保存至本地') }
  else { c.isRecording=true; c.recordDuration=0; recordTimer=setInterval(() => { if (gridCells[selectedCellIdx.value!]?.isRecording) gridCells[selectedCellIdx.value!].recordDuration++ },1000); message.info('开始录像...') }
}

const takeScreenshot = () => { if (selectedCellIdx.value!==null) message.success(`截图已保存（${selectedDevice.value?.name||'未知设备'}）`) }

const replayMode = ref(false)
const toggleReplay = () => { if (selectedCellIdx.value===null) return; replayMode.value=!replayMode.value; if (replayMode.value) message.info('实时回看：30秒前') }
const exitReplay = () => { replayMode.value=false }

const isFullscreen = ref(false)
const videoAreaRef = ref<HTMLElement|null>(null)
const handleFsChange = () => { isFullscreen.value = !!document.fullscreenElement }
onMounted(() => document.addEventListener('fullscreenchange', handleFsChange))
onUnmounted(() => document.removeEventListener('fullscreenchange', handleFsChange))
const goFullscreen = () => { if (isFullscreen.value) document.exitFullscreen(); else videoAreaRef.value?.requestFullscreen() }
const onKeyDown = (e:KeyboardEvent) => { if (e.key==='Escape') { if (eZoomMode.value) exitEZoom(); if (replayMode.value) exitReplay(); if (timeRangeMenuOpen.value) timeRangeMenuOpen.value = false } }
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
const onClickOutside = (e: MouseEvent) => {
  if (timeRangeMenuOpen.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.vs-pbr-dropdown-wrap')) timeRangeMenuOpen.value = false
  }
  if (downloadMenuOpen.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.vs-pbb-download-wrap')) downloadMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

// ========== 视频轮巡 ==========
const patrolModalOpen = ref(false)
const patrolEnabled = ref(true)
const patrolDuration = ref(15)
const patrolRunning = ref(false)
const patrolOffset = ref(0)
let patrolTimer: ReturnType<typeof setInterval> | null = null

// 轮巡位置选择：动态匹配当前分屏的格子数
const patrolPositions = ref<boolean[]>([true, false, false, false])
watch(splitMode, () => {
  // 切换分屏时停止轮巡并重置位置选择
  stopPatrol()
  patrolPositions.value = new Array(visibleCount.value).fill(false)
  if (patrolPositions.value.length > 0) patrolPositions.value[0] = true
})
const togglePatrolPosition = (idx:number) => { const v=[...patrolPositions.value]; v[idx]=!v[idx]; patrolPositions.value=v }

// 获取选中的轮巡位置索引列表
const activePatrolPositions = computed(() => {
  return patrolPositions.value
    .map((enabled, idx) => enabled ? idx : -1)
    .filter(idx => idx >= 0)
})

// 轮巡设备选择（树形勾选）
const patrolDeviceSelectOpen = ref(false)
const patrolCheckedDeviceIds = ref<string[]>([])
const patrolDeviceCount = computed(() => patrolCheckedDeviceIds.value.length)

// 设备选择树：只保留有在线设备的节点，设备叶子节点可勾选
const patrolDeviceTree = computed(() => {
  const filterOnline = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []
    for (const n of nodes) {
      if (n.isDevice) {
        if (n.online && n.deviceId) result.push({ ...n, title: n.title })
      } else if (n.children) {
        const filtered = filterOnline(n.children)
        if (filtered.length > 0) {
          result.push({ ...n, title: n.title, children: filtered })
        }
      }
    }
    return result
  }
  return filterOnline(rawRegionTree)
})

// 搜索过滤后的设备选择树
const patrolTreeSearch = ref('')
const filteredPatrolTree = computed(() => {
  const kw = patrolTreeSearch.value.trim().toLowerCase()
  if (!kw) return patrolDeviceTree.value
  const filter = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []
    for (const n of nodes) {
      const titleMatch = n.title.toLowerCase().includes(kw)
      if (n.isDevice) {
        if (titleMatch) result.push({ ...n, title: n.title })
      } else if (n.children) {
        const filteredChildren = filter(n.children)
        if (titleMatch || filteredChildren.length > 0) {
          result.push({ ...n, title: n.title, children: titleMatch ? n.children : filteredChildren })
        }
      }
    }
    return result
  }
  return filter(patrolDeviceTree.value)
})

// 递归收集节点下所有设备的 deviceId
const collectDeviceIds = (node: any): string[] => {
  if (node.isDevice && node.deviceId) return [node.deviceId]
  if (node.children) return node.children.flatMap((c: any) => collectDeviceIds(c))
  return []
}
const getNodeDeviceIds = (key: string): string[] => {
  const find = (nodes: any[]): any => {
    for (const n of nodes) {
      if (n.key === key) return n
      if (n.children) { const r = find(n.children); if (r) return r }
    }
    return null
  }
  const node = find(patrolDeviceTree.value)
  return node ? collectDeviceIds(node) : []
}

// 同步 patrolCheckedDeviceIds（仅设备节点 key → deviceId）
const onPatrolTreeCheck = (checkedKeys: any, info: any) => {
  const allChecked = new Set<string>()
  // 处理勾选的节点
  for (const key of (checkedKeys || checkedKeys.checked || [])) {
    const ids = getNodeDeviceIds(key)
    ids.forEach(id => allChecked.add(id))
  }
  patrolCheckedDeviceIds.value = Array.from(allChecked)
}

// 根据已选 deviceId 反推树节点的 checkedKeys
const patrolTreeCheckedKeys = computed(() => {
  const deviceKeys = new Set(patrolCheckedDeviceIds.value)
  const result: string[] = []
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.isDevice && n.deviceId && deviceKeys.has(n.deviceId)) {
        result.push(n.key)
      }
      if (n.children) walk(n.children)
    }
  }
  walk(patrolDeviceTree.value)
  return result
})

// 轮巡位置网格的 CSS 类
const patrolGridClass = computed(() => `vpm-grid-${splitMode.value}`)

const confirmPatrol = () => {
  if (!patrolEnabled.value) { stopPatrol(); patrolModalOpen.value = false; return }
  const positions = activePatrolPositions.value
  if (positions.length === 0) { message.warning('请至少选择一个轮巡位置'); return }
  if (patrolCheckedDeviceIds.value.length === 0) { message.warning('请至少选择一台设备加入轮巡'); return }
  startPatrol()
  patrolModalOpen.value = false
}

const startPatrol = () => {
  stopPatrol() // 先停止旧轮巡
  patrolRunning.value = true
  patrolOffset.value = 0
  applyPatrolFrame() // 立即填充第一帧
  patrolTimer = setInterval(() => {
    patrolOffset.value++
    applyPatrolFrame()
  }, patrolDuration.value * 1000)
  message.success('视频轮巡已启动')
}

const stopPatrol = () => {
  patrolRunning.value = false
  if (patrolTimer) { clearInterval(patrolTimer); patrolTimer = null }
}

/** 根据当前 patrolOffset 和选中位置/设备，填充播放区 */
const applyPatrolFrame = () => {
  const positions = activePatrolPositions.value
  const deviceIds = patrolCheckedDeviceIds.value
  if (positions.length === 0 || deviceIds.length === 0) { stopPatrol(); return }

  for (let i = 0; i < positions.length; i++) {
    const cellIdx = positions[i]
    // 循环索引：从 patrolOffset + i 开始，对设备数取模
    const deviceIdx = (patrolOffset.value + i) % deviceIds.length
    const deviceId = deviceIds[deviceIdx]
    const device = getDeviceById(deviceId)
    if (device) {
      // 直接替换该格内容（不检查已有连接）
      gridCells[cellIdx] = {
        deviceId: device.id, deviceName: device.name,
        status: 'connecting', paused: false, muted: true, flipped: false,
        streamType: device.streamType, isRecording: false, recordDuration: 0,
      }
      setTimeout(() => {
        if (gridCells[cellIdx].deviceId === deviceId) {
          gridCells[cellIdx].status = 'connected'
        }
      }, 500)
    }
  }
}

// 判断某个 cell 是否处于轮巡中
const isPatrolCell = (idx: number) => patrolRunning.value && patrolPositions.value[idx] === true

// ========== 视频回放 ==========
const playbackDate = ref(new Date().toISOString().split('T')[0])
const playbackDevice = ref<Device|null>(null)
const playbackSpeed = ref(1)
const playbackPlaying = ref(false)
const playbackMuted = ref(true)
const playbackCurrentTime = ref('14:32:15')
const playbackDownloadStart = ref('14:00')
const playbackDownloadEnd = ref('15:00')
const playbackTimeRangeIdx = ref(3) // 0:1h 1:6h 2:12h 3:24h
const playbackTimeRanges = ['1h','6h','12h','24h']
const playbackRangeStartHour = ref(0)
const playbackStrategyVisible = ref(false)
const playbackSkipNormal = ref(false)
const playbackNormalSpeed = ref(8)
const playbackEventSpeed = ref(8)
const selectPlaybackDevice = (device:Device) => { playbackDevice.value=device; playbackPlaying.value=false; playbackRangeStartHour.value=0 }
const togglePlayback = () => { playbackPlaying.value=!playbackPlaying.value }
const setPlaybackSpeed = (s:number) => { playbackSpeed.value=s; message.info(`播放倍速：${s}x`) }
const skipBackward30s = () => { message.info('快退 30 秒') }
const skipForward30s = () => { message.info('快进 30 秒') }
const cyclePlaybackTimeRange = () => {
  playbackTimeRangeIdx.value = (playbackTimeRangeIdx.value + 1) % playbackTimeRanges.length
  playbackRangeStartHour.value = 0
}
const selectPlaybackTimeRange = (idx: number) => {
  playbackTimeRangeIdx.value = idx
  playbackRangeStartHour.value = 0
  timeRangeMenuOpen.value = false
}
const timeRangeMenuOpen = ref(false)
const toggleTimeRangeMenu = () => { timeRangeMenuOpen.value = !timeRangeMenuOpen.value }
const prevPlaybackTimeRange = () => {
  const label = playbackTimeRanges[playbackTimeRangeIdx.value]
  const hours = parseInt(label)
  playbackRangeStartHour.value = Math.max(0, playbackRangeStartHour.value - Math.max(1, Math.floor(hours / 2)))
}
const nextPlaybackTimeRange = () => {
  const label = playbackTimeRanges[playbackTimeRangeIdx.value]
  const hours = parseInt(label)
  const maxStart = 24 - hours
  playbackRangeStartHour.value = Math.min(maxStart, playbackRangeStartHour.value + Math.max(1, Math.floor(hours / 2)))
}
// ========== 下载任务管理 ==========
const downloadTaskCount = ref(1)
interface DownloadTask { id:number; name:string; progress:number; total:number; elapsed:string; speed:string; status:string }
const downloadTasks = ref<DownloadTask[]>([{ id:1, name:'hudsaiudahidwah', progress:8.44, total:560, elapsed:'00:00:04', speed:'3.0MB/s', status:'downloading' }])
const downloadMenuOpen = ref(false)
const timeDownloadVisible = ref(false)
const eventDownloadVisible = ref(false)
const downloadDetailVisible = ref(false)
const downloadTimeStart = ref('14:00')
const downloadTimeEnd = ref('15:00')
const downloadSavePath = ref('Download')
const downloadDateStart = ref('2026-06-04')
const downloadDateEnd = ref('2026-06-04')
interface EventDownloadItem { id:number; time:string; duration:string; size:string; selected:boolean }
const eventDownloadItems = ref<EventDownloadItem[]>([
  { id:1, time:'2022-08-22 14:24:08', duration:'1分20秒', size:'1GB', selected:true },
  { id:2, time:'2022-08-22 15:30:12', duration:'0分45秒', size:'680MB', selected:false },
  { id:3, time:'2022-08-22 16:10:05', duration:'2分10秒', size:'1.5GB', selected:true },
  { id:4, time:'2022-08-22 17:00:00', duration:'3分00秒', size:'2.1GB', selected:false },
])
const openTimeDownload = () => { timeDownloadVisible.value = true; downloadMenuOpen.value = false }
const openEventDownload = () => { eventDownloadVisible.value = true; downloadMenuOpen.value = false }
const openDownloadDetail = () => { downloadDetailVisible.value = true; downloadMenuOpen.value = false }
const toggleEventSelect = (item:EventDownloadItem) => { item.selected = !item.selected }
const confirmTimeDownload = () => {
  timeDownloadVisible.value = false
  downloadTaskCount.value++
  downloadTasks.value.push({ id:Date.now(), name:`录像_${downloadTimeStart.value}-${downloadTimeEnd.value}`, progress:0, total:Math.floor(Math.random()*500)+100, elapsed:'00:00:00', speed:'0MB/s', status:'downloading' })
  message.success('时间段下载任务已添加')
}
const confirmEventDownload = () => {
  eventDownloadVisible.value = false
  const count = eventDownloadItems.value.filter(i => i.selected).length
  if (count > 0) {
    downloadTaskCount.value += count
    message.success(`${count} 个事件已加入下载队列`)
  }
}
const confirmPlaybackStrategy = () => {
  playbackStrategyVisible.value = false
  message.success('播放策略已保存')
}
const playbackTimeRangeLabel = computed(() => playbackTimeRanges[playbackTimeRangeIdx.value])

// ========== 自定义日历 ==========
const displayYear = ref(new Date().getFullYear())
const displayMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedDay = ref(new Date().getDate())
const hoveredDay = ref<string | null>(null)
const datePickerOpen = ref(false)

// 按设备的录像标记 mock 数据：deviceId → { dateKey → regular/event/both }
const deviceRecordingMap: Record<string, Record<string, 'regular'|'event'|'both'>> = {
  'd-nj-1': { '2026-05-28': 'regular', '2026-05-30': 'event', '2026-06-02': 'regular', '2026-06-03': 'event', '2026-06-04': 'both' },
  'd-nj-2': { '2026-06-01': 'regular', '2026-06-02': 'event', '2026-06-04': 'regular' },
  'd-nj-4': { '2026-05-30': 'both', '2026-06-03': 'regular' },
  'd-nj-16': { '2026-06-01': 'event', '2026-06-02': 'regular', '2026-06-04': 'event' },
  'd-nj-22': { '2026-05-29': 'regular', '2026-06-01': 'both', '2026-06-03': 'regular' },
}

const selectedDateKey = computed(() => {
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}-${String(selectedDay.value).padStart(2,'0')}`
})
const todayDateKey = computed(() => new Date().toISOString().split('T')[0])

const getRecordingStatus = (dateKey: string) => {
  if (!playbackDevice.value) return null
  const deviceData = deviceRecordingMap[playbackDevice.value.id]
  return deviceData?.[dateKey] || null
}

interface CalendarDay { year:number; month:number; day:number; isCurrentMonth:boolean; dateKey:string; recording:'regular'|'event'|'both'|null }

const calendarDays = computed<CalendarDay[]>(() => {
  const deviceId = playbackDevice.value?.id
  const recordings = deviceId ? (deviceRecordingMap[deviceId] || {}) : {} as Record<string,'regular'|'event'|'both'>
  const year = displayYear.value
  const month = displayMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: CalendarDay[] = []
  // 上月填充
  const prevLast = new Date(year, month - 1, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevLast - i
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    const dk = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ year:y, month:m, day:d, isCurrentMonth:false, dateKey:dk, recording:recordings[dk]||null })
  }
  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ year, month, day:d, isCurrentMonth:true, dateKey:dk, recording:recordings[dk]||null })
  }
  // 下月填充至42格
  let nextM = month === 12 ? 1 : month + 1
  let nextY = month === 12 ? year + 1 : year
  for (let d = 1; days.length < 42; d++) {
    const dk = `${nextY}-${String(nextM).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ year:nextY, month:nextM, day:d, isCurrentMonth:false, dateKey:dk, recording:recordings[dk]||null })
  }
  return days
})

const selectDay = (day: { year:number; month:number; day:number; isCurrentMonth:boolean; dateKey:string }) => {
  if (day.dateKey > todayDateKey.value) return // 未来日期不可选
  if (!day.isCurrentMonth) { displayYear.value = day.year; displayMonth.value = day.month }
  selectedYear.value = day.year
  selectedMonth.value = day.month
  selectedDay.value = day.day
  playbackDate.value = day.dateKey
  datePickerOpen.value = false
}
const prevMonth = () => { if (displayMonth.value===1) { displayMonth.value=12; displayYear.value-- } else displayMonth.value-- }
const nextMonth = () => { if (displayMonth.value===12) { displayMonth.value=1; displayYear.value++ } else displayMonth.value++ }
const prevYear = () => { displayYear.value-- }
const nextYear = () => { displayYear.value++ }
// 时间轴刻度：根据当前时间范围动态生成
const playbackTimeRangeHours = computed(() => {
  const label = playbackTimeRanges[playbackTimeRangeIdx.value]
  const hours = parseInt(label)
  let start = playbackRangeStartHour.value
  const maxStart = 24 - hours
  if (start > maxStart) start = maxStart
  if (start < 0) start = 0
  return Array.from({length: hours + 1}, (_, i) => start + i)
})
// 录像片段：仅选中设备后才显示蓝色色块
const recordingSegments = computed(() => {
  if (!playbackDevice.value) return []
  return [{start:0.25,end:0.35},{start:0.4,end:0.6},{start:0.7,end:0.9}]
})

// ========== 点位地图 ==========
// 地图模式
const mapMode = ref<'store' | 'device'>('store')

// 门店/设备 Mock 数据
interface MapDevice { id: string; name: string; online: boolean; deviceId: string; area: string; type: string; lat: number; lng: number; lastEvent: string | null }
interface MapStore { id: string; name: string; deviceCount: number; lat: number; lng: number; devices: MapDevice[] }
const mapStores: MapStore[] = [
  { id:'s1', name:'桥北万象城', deviceCount:5, lat:32.06, lng:118.73,
    devices:[
      { id:'d1', name:'开发组监控02', online:true, deviceId:'289383891jshkjhs', area:'XX园区', type:'低功耗摄像机', lat:32.062, lng:118.732, lastEvent:'2024-07-29 18:00:24' },
      { id:'d2', name:'大门入口监控', online:true, deviceId:'120000101081cd816', area:'XX园区', type:'高清球机', lat:32.061, lng:118.731, lastEvent:null },
      { id:'d3', name:'仓库监控A', online:true, deviceId:'C107024ravDr59Bg', area:'XX园区', type:'低功耗摄像机', lat:32.063, lng:118.733, lastEvent:'2024-07-23 18:00:00' },
      { id:'d4', name:'收银台监控', online:false, deviceId:'367382921abc123', area:'XX园区', type:'高清枪机', lat:32.060, lng:118.730, lastEvent:null },
      { id:'d5', name:'后门监控', online:true, deviceId:'987654321xyz', area:'XX园区', type:'低功耗摄像机', lat:32.064, lng:118.734, lastEvent:'2024-07-28 09:15:33' },
    ]
  },
  { id:'s2', name:'鼓楼万达', deviceCount:3, lat:32.05, lng:118.78,
    devices:[
      { id:'d6', name:'正门监控', online:true, deviceId:'111222333aaa', area:'YY园区', type:'高清球机', lat:32.051, lng:118.781, lastEvent:null },
      { id:'d7', name:'停车场监控', online:true, deviceId:'444555666bbb', area:'YY园区', type:'低功耗摄像机', lat:32.052, lng:118.782, lastEvent:'2024-07-27 14:22:10' },
      { id:'d8', name:'电梯口监控', online:false, deviceId:'777888999ccc', area:'YY园区', type:'高清枪机', lat:32.050, lng:118.780, lastEvent:null },
    ]
  },
  { id:'s3', name:'江宁万达', deviceCount:4, lat:31.95, lng:118.82,
    devices:[
      { id:'d9', name:'中庭监控', online:true, deviceId:'aaa111222ddd', area:'ZZ园区', type:'高清球机', lat:31.951, lng:118.821, lastEvent:'2024-07-29 10:00:05' },
      { id:'d10', name:'消防通道监控', online:true, deviceId:'bbb333444eee', area:'ZZ园区', type:'低功耗摄像机', lat:31.952, lng:118.822, lastEvent:null },
      { id:'d11', name:'货梯监控', online:false, deviceId:'ccc555666fff', area:'ZZ园区', type:'高清枪机', lat:31.950, lng:118.820, lastEvent:null },
      { id:'d12', name:'外围监控', online:true, deviceId:'ddd777888ggg', area:'ZZ园区', type:'低功耗摄像机', lat:31.953, lng:118.823, lastEvent:'2024-07-26 16:45:00' },
    ]
  },
]

// 地图交互状态
const selectedStore = ref<MapStore | null>(null)
const selectedMapDevice = ref<MapDevice | null>(null)
const drawerVisible = ref(false)
const infoWindowDevice = ref<MapDevice | null>(null)
const editCoordVisible = ref(false)
const editingDevice = ref<MapDevice | null>(null)
const mapPickerVisible = ref(false)
const liveVideoVisible = ref(false)
const liveVideoDevice = ref<MapDevice | null>(null)
const editLng = ref('')
const editLat = ref('')
const pickerLng = ref('')
const pickerLat = ref('')
const pickerSearchText = ref('')

// 打开门店抽屉
const openStoreDrawer = (store: MapStore) => { selectedStore.value = store; drawerVisible.value = true; infoWindowDevice.value = null }
// 设备定位下点击设备 → InfoWindow
const openDeviceInfo = (device: MapDevice) => { infoWindowDevice.value = device; drawerVisible.value = false }
// 实时视频
const openLiveVideo = (device: MapDevice) => { liveVideoDevice.value = device; liveVideoVisible.value = true }
// 修改坐标
const openEditCoord = (device: MapDevice) => { editingDevice.value = device; editLng.value = device.lng.toString(); editLat.value = device.lat.toString(); editCoordVisible.value = true }
// 地图选点
const openMapPicker = () => { pickerLng.value = editLng.value; pickerLat.value = editLat.value; mapPickerVisible.value = true }
const confirmMapPicker = () => { editLng.value = pickerLng.value; editLat.value = pickerLat.value; mapPickerVisible.value = false }
const onPickerMapClick = () => { pickerLng.value = (118.7 + Math.random()*0.1).toFixed(7); pickerLat.value = (31.9 + Math.random()*0.15).toFixed(7) }
const confirmEditCoord = () => { editCoordVisible.value = false; message.success('坐标修改成功') }

// 聚合标记位置（根据门店坐标映射到占位地图百分比）
const getStoreMarkerStyle = (store: MapStore) => ({ top:`${20+((store.lat-31.9)*300)%60}%`, left:`${15+((store.lng-118.7)*400)%70}%` })
const getDeviceMarkerStyle = (device: MapDevice) => ({ top:`${20+((device.lat-31.9)*300)%60}%`, left:`${15+((device.lng-118.7)*400)%70}%` })
const allMapDevices = computed(() => mapStores.flatMap(s => s.devices))

const formatRecordTime = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
const getDrawerContainer = () => videoAreaRef.value || document.body

// 树刷新 key（播放/轮巡状态变化时驱动 titleRender 重渲染）
const treeRefreshKey = ref(0)
const gridStateSnapshot = computed(() => gridCells.map(c => `${c.deviceId}:${c.status}`).join('|'))
const patrolStateSnapshot = computed(() => `${patrolRunning.value}:${patrolCheckedDeviceIds.value.join(',')}`)
watch([gridStateSnapshot, patrolStateSnapshot, playbackDevice], () => { treeRefreshKey.value++ })

// 取消视频格选中时同步取消树节点选中
watch(selectedCellIdx, (val) => {
  if (val === null) selectedKey.value = ''
})
</script>

<template>
  <div class="vs-page" :class="{ 'vs-fullscreen': isFullscreen }" ref="videoAreaRef">
    <div class="vs-body">
      <!-- ==================== 左侧侧边栏 ==================== -->
      <div v-if="!isFullscreen" class="vs-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div v-if="!sidebarCollapsed" class="vs-sidebar-inner">
        <div class="vs-sidebar-header">
          <span class="vs-sidebar-title">组织与设备</span>
          <div class="vs-sidebar-tabs">
            <a-tooltip title="实时视频"><div class="vs-sb-tab" :class="{active:activeTab==='live'}" @click="activeTab='live'"><VideoCameraOutlined /></div></a-tooltip>
            <a-tooltip title="视频回放"><div class="vs-sb-tab" :class="{active:activeTab==='playback'}" @click="activeTab='playback'"><HistoryOutlined /></div></a-tooltip>
            <a-tooltip title="点位地图"><div class="vs-sb-tab" :class="{active:activeTab==='map'}" @click="activeTab='map'"><EnvironmentOutlined /></div></a-tooltip>
          </div>
        </div>
        <a-input v-model:value="searchText" placeholder="搜索" size="small" class="vs-search">
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <div class="vs-tree-wrap" @dragstart="onTreeDragStart" @dblclick="onTreeWrapperDblClick">
          <a-tree
            :key="treeRefreshKey"
            :tree-data="regionTree"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedKey ? [selectedKey] : []"
            :title-render="titleRender"
            @select="onTreeSelect"
            @dblclick="onTreeDblClick"
            @update:expandedKeys="(ks: string[]) => expandedKeys = ks"
            :field-names="{ children:'children', title:'title', key:'key' }"
            block-node class="vs-tree"
          />
        </div>
        <div v-if="activeTab==='playback'" class="vs-sidebar-date">
          <div class="vs-cdp-input" @click="datePickerOpen=!datePickerOpen">
            <span>{{ selectedDateKey }}</span>
            <HistoryOutlined class="vs-cdp-input-icon" />
          </div>
          <div v-if="datePickerOpen" class="vs-cdp-popup">
            <!-- 导航栏 -->
            <div class="vs-cdp-nav">
              <span class="vs-cdp-nav-btn" @click="prevYear">&#171;</span>
              <span class="vs-cdp-nav-btn" @click="prevMonth">&#8249;</span>
              <span class="vs-cdp-nav-title">{{ displayYear }}年 {{ displayMonth }}月</span>
              <span class="vs-cdp-nav-btn" @click="nextMonth">&#8250;</span>
              <span class="vs-cdp-nav-btn" @click="nextYear">&#187;</span>
            </div>
            <!-- 星期标题 -->
            <div class="vs-cdp-weekdays">
              <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
            </div>
            <!-- 日期网格 -->
            <div class="vs-cdp-grid">
              <div v-for="day in calendarDays" :key="day.dateKey" class="vs-cdp-cell"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'future': day.dateKey > todayDateKey,
                  'selected': day.dateKey === selectedDateKey,
                  'has-regular': day.dateKey <= todayDateKey && day.recording === 'regular',
                  'has-event': day.dateKey <= todayDateKey && (day.recording === 'event' || day.recording === 'both'),
                }"
                @click="selectDay(day)"
                @mouseenter="hoveredDay = day.dateKey"
                @mouseleave="hoveredDay = null"
              >
                <span class="vs-cdp-day-num">{{ day.day }}</span>
                <span class="vs-cdp-marker"
                  :class="{
                    'regular': day.recording === 'regular',
                    'event': day.recording === 'event',
                    'both': day.recording === 'both',
                    'on-selected': day.dateKey === selectedDateKey,
                    'hidden': !day.recording || day.dateKey > todayDateKey,
                  }">▲</span>
              </div>
            </div>
          </div>
        </div>
        </div>
        <!-- 折叠/展开把手 -->
        <div class="vs-sidebar-toggle" @click="toggleSidebar" :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'">
          <component :is="sidebarCollapsed ? RightOutlined : LeftOutlined" class="vs-sidebar-toggle-icon" />
        </div>
      </div>

      <!-- ==================== 右侧内容区 ==================== -->
      <div class="vs-content">

        <!-- ========== 实时画面 ========== -->
        <template v-if="activeTab==='live'">
          <div class="vs-video-grid" :class="[`vs-grid-${splitMode}`, { 'vs-ezoom': eZoomMode }]">
            <div v-for="(cell,idx) in visibleCells" :key="idx" class="vs-cell"
              :class="{ selected:selectedCellIdx===idx && cell.status==='connected', 'cell-selected':selectedCellIdx===idx && cell.status!=='connected', connecting:cell.status==='connecting', connected:cell.status==='connected', error:cell.status==='error', empty:cell.status==='empty', 'patrol-active':isPatrolCell(idx), 'drag-over': dragDeviceId !== null }"
              @click="clickCell(idx)"
              @dragover="onCellDragOver"
              @drop="(e: DragEvent) => onCellDrop(e, idx)">
              <!-- 轮巡浮动标签 -->
              <div v-if="isPatrolCell(idx)" class="vs-patrol-badge">
                <span class="vs-patrol-badge-dot"></span>
                <span class="vs-patrol-badge-text">轮巡中</span>
                <CloseOutlined class="vs-patrol-badge-close" @click.stop="stopPatrol" title="停止轮巡" />
              </div>
              <div v-if="cell.status==='empty'" class="vs-cell-placeholder"><span>请添加设备</span></div>
              <div v-if="cell.status==='connecting'" class="vs-cell-loading"><a-spin description="连接中..." /></div>
              <div v-if="cell.status==='connected'" class="vs-cell-video">
                <div class="vs-mock-video" :class="{flipped:cell.flipped}">
                  <div class="vs-mock-video-bg"><span class="vs-mock-icon">📹</span><div class="vs-mock-scanline"></div></div>
                  <div class="vs-cell-osd"><span class="vs-cell-osd-name">{{ cell.deviceName }}</span><span class="vs-cell-osd-time">{{ new Date().toLocaleTimeString('zh-CN',{hour12:false}) }}</span><span class="vs-cell-osd-stream">{{ cell.streamType==='main'?'FHD':'HD' }}</span></div>
                  <div v-if="cell.paused" class="vs-cell-pause-overlay"><PauseCircleOutlined /><span>已暂停</span></div>
                  <div v-if="cell.isRecording" class="vs-cell-record-indicator"><span class="vs-rec-dot"></span>REC {{ formatRecordTime(cell.recordDuration) }}</div>
                  <div v-if="cell.muted" class="vs-cell-mute-indicator"><AudioMutedOutlined /></div>
                  <div class="vs-cell-close" @click.stop="closeCell(idx)"><CloseOutlined /></div>
                </div>
              </div>
              <div v-if="cell.status==='error'" class="vs-cell-error"><span>加载失败</span></div>
            </div>
          </div>

          <!-- 底部工具栏 -->
          <div class="vs-toolbar" :class="{'vs-toolbar-fs':isFullscreen}">
            <div class="vs-toolbar-center">
              <a-tooltip title="播放/暂停"><div class="vs-tool-icon" :class="{disabled:!hasSelection}" @click="togglePlay"><component :is="selectedCell?.paused?PlayCircleFilled:PauseCircleOutlined" /></div></a-tooltip>
              <a-tooltip title="静音"><div class="vs-tool-icon" :class="{disabled:!hasSelection}" @click="toggleMute"><component :is="selectedCell?.muted?AudioMutedOutlined:AudioOutlined" /></div></a-tooltip>
              <a-tooltip :title="`码流切换（当前：${selectedCell?.streamType==='main'?'主码流':'子码流'}）`"><div class="vs-tool-icon" :class="{disabled:!hasSelection}" @click="toggleStreamType"><span class="vs-stream-label">{{ selectedCell?.streamType==='main'?'FHD':'HD' }}</span></div></a-tooltip>
              <a-tooltip :title="canPTZ?'云台控制':'不支持PTZ'"><div class="vs-tool-icon" :class="{disabled:!canPTZ,active:ptzPanelOpen}" @click="togglePTZ"><span class="vs-stream-label">PTZ</span></div></a-tooltip>
              <a-tooltip :title="canIntercom?'语音对讲':'不支持对讲'"><div class="vs-tool-icon" :class="{disabled:!canIntercom,active:isIntercoming}" @click="toggleIntercom"><SoundOutlined /></div></a-tooltip>
              <a-tooltip :title="canLight?'灯光模式':'不支持灯光'"><div class="vs-tool-icon" :class="{disabled:!canLight,active:lightPanelOpen}" @click="toggleLight"><BulbOutlined /></div></a-tooltip>
              <a-tooltip title="画面翻转"><div class="vs-tool-icon" :class="{disabled:!hasSelection}" @click="toggleFlip"><SwapOutlined /></div></a-tooltip>
              <a-popover v-model:open="splitMenuOpen" trigger="click" placement="top" overlay-class-name="vs-split-popover">
                <div class="vs-tool-icon">
                  <span class="vs-split-btn-pv" :class="currentSplit.pv">
                    <span v-for="i in previewCellCount(currentSplit)" :key="i" class="vs-split-btn-pv-cell"></span>
                  </span>
                </div>
                <template #content>
                  <div class="vs-split-menu">
                    <div v-for="opt in splitOptions" :key="opt.value" class="vs-split-card"
                      :class="{ active: splitMode === opt.value }"
                      @click="splitMode = opt.value; splitMenuOpen = false">
                      <div class="vs-split-pv" :class="opt.pv">
                        <span v-for="i in previewCellCount(opt)" :key="i" class="vs-split-pv-cell"></span>
                      </div>
                      <span class="vs-split-card-label">{{ opt.label }}</span>
                    </div>
                  </div>
                </template>
              </a-popover>
              <a-tooltip title="电子放大"><div class="vs-tool-icon" :class="{disabled:!hasSelection,active:eZoomMode}" @click="toggleEZoom"><ExpandOutlined /></div></a-tooltip>
              <a-tooltip :title="selectedCell?.isRecording?'停止录像':'本地录像'"><div class="vs-tool-icon" :class="{disabled:!hasSelection,recording:selectedCell?.isRecording}" @click="toggleRecord"><VideoCameraFilled /></div></a-tooltip>
              <a-tooltip title="截图"><div class="vs-tool-icon" :class="{disabled:!hasSelection}" @click="takeScreenshot"><CameraOutlined /></div></a-tooltip>
              <a-tooltip title="实时回看"><div class="vs-tool-icon" :class="{disabled:!hasSelection,active:replayMode}" @click="toggleReplay"><HistoryOutlined /></div></a-tooltip>
              <a-tooltip :title="isFullscreen?'退出全屏':'全屏'"><div class="vs-tool-icon" @click="goFullscreen"><component :is="isFullscreen?FullscreenExitOutlined:FullscreenOutlined" /></div></a-tooltip>
            </div>
            <div class="vs-toolbar-right">
              <div class="vs-patrol-combo" @click="patrolModalOpen=true">
                <span class="vs-patrol-text">视频轮巡</span>
                <span class="vs-patrol-sep"></span>
                <SettingOutlined class="vs-patrol-icon" />
              </div>
            </div>
          </div>

          <!-- PTZ 控制抽屉（左侧） -->
          <a-drawer
            :open="ptzPanelOpen && hasSelection"
            title="云台控制"
            placement="left"
            :width="340"
            :closable="true"
            @close="ptzPanelOpen = false"
            :get-container="getDrawerContainer"
          >
            <div class="vs-ptz-drawer">
              <!-- 方向控制盘 -->
              <div class="vs-ptz-joystick">
                <div class="vs-ptz-ring">
                  <div class="vs-ptz-ring-btn ring-n" @mousedown="ptzDirection('上')"><CaretUpOutlined /></div>
                  <div class="vs-ptz-ring-btn ring-ne" @mousedown="ptzDirection('右上')"></div>
                  <div class="vs-ptz-ring-btn ring-e" @mousedown="ptzDirection('右')"><CaretRightOutlined /></div>
                  <div class="vs-ptz-ring-btn ring-se" @mousedown="ptzDirection('右下')"></div>
                  <div class="vs-ptz-ring-btn ring-s" @mousedown="ptzDirection('下')"><CaretDownOutlined /></div>
                  <div class="vs-ptz-ring-btn ring-sw" @mousedown="ptzDirection('左下')"></div>
                  <div class="vs-ptz-ring-btn ring-w" @mousedown="ptzDirection('左')"><CaretLeftOutlined /></div>
                  <div class="vs-ptz-ring-btn ring-nw" @mousedown="ptzDirection('左上')"></div>
                  <div class="vs-ptz-core" @click="ptzDirection('自动')">
                    <ReloadOutlined />
                  </div>
                </div>
              </div>

              <!-- 灵敏度 -->
              <div class="vs-ptz-section">
                <div class="vs-ptz-section-head">
                  <span class="vs-ptz-section-label">灵敏度</span>
                  <span class="vs-ptz-section-val">{{ ptzSpeed }}</span>
                </div>
                <a-slider v-model:value="ptzSpeed" :min="1" :max="10" :step="1" :tip-formatter="(v:number) => `${v}`" />
              </div>

              <!-- 变倍 -->
              <div class="vs-ptz-section">
                <div class="vs-ptz-section-label">变倍</div>
                <div class="vs-ptz-zoom-bar">
                  <div class="vs-ptz-zoom-btn" @click="ptzDirection('变焦缩小')"><MinusOutlined /></div>
                  <div class="vs-ptz-zoom-track">
                    <div class="vs-ptz-zoom-fill" :style="{ width: (ptzZoom / 30 * 100) + '%' }"></div>
                  </div>
                  <span class="vs-ptz-zoom-read">{{ ptzZoom }}X</span>
                  <div class="vs-ptz-zoom-btn" @click="ptzDirection('变焦放大')"><PlusOutlined /></div>
                </div>
              </div>

              <!-- 光学变倍（动态） -->
              <div v-if="selectedDevice?.capabilities.light" class="vs-ptz-section">
                <div class="vs-ptz-section-head">
                  <span class="vs-ptz-section-label">光学变倍</span>
                  <span class="vs-ptz-section-val">{{ ptzOpticalZoom }}X</span>
                </div>
                <a-slider v-model:value="ptzOpticalZoom" :min="1" :max="30" :step="1" :tip-formatter="(v:number) => `${v}X`" />
              </div>

              <!-- 收藏点位 -->
              <div v-if="selectedDevice?.capabilities.ptz" class="vs-ptz-section">
                <div class="vs-ptz-section-head">
                  <div class="vs-ptz-section-label">
                    <StarOutlined class="vs-ptz-star" />
                    <span>收藏点位</span>
                  </div>
                  <a-button size="small" type="link" @click="addPreset" v-if="ptzPresets.length < 8">+ 添加</a-button>
                </div>
                <div class="vs-ptz-presets">
                  <div v-for="preset in ptzPresets" :key="preset.id" class="vs-ptz-preset"
                    @click="ptzEditingPresetId !== preset.id && ptzDirection(`预置位${preset.name}`)">
                    <!-- 删除按钮 -->
                    <div class="vs-ptz-preset-del" @click.stop="deletePreset(preset.id)" title="删除"><CloseOutlined /></div>
                    <!-- 缩略图（模拟实时画面截图） -->
                    <div class="vs-ptz-preset-thumb">
                      <div class="vs-ptz-thumb-scene">
                        <div class="vs-ptz-thumb-grid"></div>
                        <div class="vs-ptz-thumb-tag">LIVE</div>
                      </div>
                    </div>
                    <!-- 名称 / 编辑 -->
                    <div class="vs-ptz-preset-name-row" @click.stop>
                      <template v-if="ptzEditingPresetId === preset.id">
                        <a-input
                          v-model:value="ptzEditingName"
                          size="small"
                          class="vs-ptz-rename-input"
                          @pressEnter="confirmRenamePreset"
                          @blur="confirmRenamePreset"
                          @keydown.escape="cancelRenamePreset"
                          :maxlength="10"
                        />
                      </template>
                      <template v-else>
                        <span class="vs-ptz-preset-label" @click.stop="startRenamePreset(preset)" :title="'点击编辑名称'">{{ preset.name }}</span>
                        <EditOutlined class="vs-ptz-preset-edit" @click.stop="startRenamePreset(preset)" title="编辑名称" />
                      </template>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </a-drawer>

          <!-- 灯光面板 -->
          <div v-if="lightPanelOpen && hasSelection" class="vs-light-panel">
            <div class="vs-light-title">灯光模式</div>
            <div class="vs-light-option" :class="{active:lightMode==='auto'}" @click="setLightMode('auto')">☀️ 自动</div>
            <div class="vs-light-option" :class="{active:lightMode==='on'}" @click="setLightMode('on')">💡 常亮</div>
            <div class="vs-light-option" :class="{active:lightMode==='off'}" @click="setLightMode('off')">🌑 常灭</div>
            <div class="vs-light-option" :class="{active:lightMode==='ir'}" @click="setLightMode('ir')">🔴 红外</div>
          </div>
        </template>

        <!-- ========== 视频回放 ========== -->
        <template v-if="activeTab==='playback'">
          <div class="vs-playback-area">
            <!-- 视频画面区（单画面） -->
            <div v-if="!playbackDevice" class="vs-playback-empty">
              <div class="vs-playback-empty-placeholder"><span>请添加设备</span></div>
            </div>
            <div v-else class="vs-playback-video-wrap">
              <div class="vs-playback-video">
                <div class="vs-mock-video">
                  <div class="vs-mock-video-bg">
                    <span class="vs-mock-icon">📼</span>
                    <div class="vs-mock-scanline"></div>
                  </div>
                  <div class="vs-cell-osd">
                    <span class="vs-cell-osd-name">{{ playbackDevice.name }}</span>
                    <span class="vs-cell-osd-time">{{ playbackCurrentTime }}</span>
                    <span class="vs-cell-osd-stream">回放</span>
                  </div>
                  <div v-if="!playbackPlaying" class="vs-cell-pause-overlay"><PauseCircleOutlined /><span>已暂停</span></div>
                  <div v-if="playbackMuted" class="vs-cell-mute-indicator"><AudioMutedOutlined /></div>
                  <div class="vs-cell-close vs-cell-close-visible" @click.stop="playbackDevice=null"><CloseOutlined /></div>
                </div>
              </div>
            </div>

            <!-- 底部控制栏-上层：时间轴区域（始终显示） -->
            <div class="vs-playback-bar-top">
              <div class="vs-pbt-scale" :style="{ paddingRight: '90px' }">
                <span v-for="h in playbackTimeRangeHours" :key="'ts'+h" class="vs-pbt-tick">{{ h }}</span>
              </div>
              <div class="vs-pbt-track" :style="{ marginRight: '90px' }">
                <div v-for="(seg,si) in recordingSegments" :key="'seg'+si" class="vs-pbt-seg" :style="{left:`${seg.start*100}%`,width:`${(seg.end-seg.start)*100}%`}"></div>
                <div v-if="playbackDevice" class="vs-pbt-cursor" style="left:45%"></div>
              </div>
              <div class="vs-pbt-range">
                <span class="vs-pbr-btn" @click="prevPlaybackTimeRange"><LeftOutlined /></span>
                <span class="vs-pbr-btn" @click="nextPlaybackTimeRange"><RightOutlined /></span>
                <div class="vs-pbr-dropdown-wrap">
                  <span class="vs-pbr-dropdown" @click="toggleTimeRangeMenu">{{ playbackTimeRangeLabel }} <CaretDownOutlined /></span>
                  <div v-if="timeRangeMenuOpen" class="vs-pbr-menu">
                    <div v-for="(r, i) in playbackTimeRanges" :key="r" class="vs-pbr-menu-item" :class="{active: i === playbackTimeRangeIdx}" @click="selectPlaybackTimeRange(i)">{{ r }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部控制栏-下层：功能按钮区域（始终显示） -->
            <div class="vs-playback-bar-bottom">
              <!-- 左侧：图例与筛选 -->
              <div class="vs-pbb-left">
                <span class="vs-pbb-legend"><span class="vs-pbb-legend-dot normal"></span>常规录像</span>
                <span class="vs-pbb-legend"><span class="vs-pbb-legend-dot event"></span>事件录像</span>
                <span class="vs-pbb-filter">全部事件 <CaretUpOutlined /></span>
              </div>
              <!-- 中间：播放控制组 -->
              <div class="vs-pbb-center">
                <a-tooltip :title="playbackPlaying?'暂停':'播放'"><div class="vs-pbb-btn" @click="togglePlayback">
                  <component :is="playbackPlaying ? PauseCircleOutlined : PlayCircleFilled" />
                </div></a-tooltip>
                <a-tooltip :title="playbackMuted?'取消静音':'静音'"><div class="vs-pbb-btn" :class="{active:!playbackMuted}" @click="playbackMuted=!playbackMuted">
                  <component :is="playbackMuted ? AudioMutedOutlined : SoundOutlined" />
                </div></a-tooltip>
                <a-tooltip title="快退30秒"><div class="vs-pbb-btn" @click="skipBackward30s"><CaretLeftOutlined /></div></a-tooltip>
                <a-tooltip title="快进30秒"><div class="vs-pbb-btn" @click="skipForward30s"><CaretRightOutlined /></div></a-tooltip>
                <a-dropdown :trigger="['click']">
                  <div class="vs-pbb-btn vs-pbb-speed">x{{ playbackSpeed }}</div>
                  <template #overlay>
                    <div class="vs-split-menu"><div v-for="s in [0.5,1,2,4,8]" :key="s" class="vs-split-item" :class="{active:playbackSpeed===s}" @click="setPlaybackSpeed(s)">{{ s }}x</div></div>
                  </template>
                </a-dropdown>
                <div class="vs-pbb-download-wrap">
                  <a-badge :count="downloadTaskCount" color="#ff4d4f" :offset="[-2,2]" :overflow-count="99">
                    <div class="vs-pbb-btn" @click="downloadMenuOpen=!downloadMenuOpen"><DownloadOutlined /></div>
                  </a-badge>
                  <div v-if="downloadMenuOpen" class="vs-download-menu">
                    <div class="vs-dm-item" @click="openTimeDownload"><HistoryOutlined /> 时间段下载</div>
                    <div class="vs-dm-item" @click="openEventDownload"><VideoCameraOutlined /> 事件下载</div>
                    <div class="vs-dm-item" @click="openDownloadDetail"><UnorderedListOutlined /> 下载详情</div>
                  </div>
                </div>
                <a-tooltip title="全屏"><div class="vs-pbb-btn" @click="goFullscreen"><ExpandOutlined /></div></a-tooltip>
              </div>
              <!-- 右侧：播放策略 -->
              <div class="vs-pbb-right">
                <a-tooltip title="播放策略"><div class="vs-pbb-btn" @click="playbackStrategyVisible=true"><SettingOutlined /></div></a-tooltip>
              </div>
            </div>

            <!-- 播放策略 Modal -->
            <a-modal v-model:open="playbackStrategyVisible" title="播放策略" :width="440" :footer="null">
              <div class="vs-playback-strategy">
                <div class="vs-ps-row">
                  <span class="vs-ps-label">跳过常规录像：</span>
                  <a-switch v-model:checked="playbackSkipNormal" />
                </div>
                <div class="vs-ps-row">
                  <span class="vs-ps-label">常规录像播放速度：</span>
                  <div class="vs-ps-slider-wrap">
                    <a-slider v-model:value="playbackNormalSpeed" :min="1" :max="16" :step="1" class="vs-ps-slider" />
                    <span class="vs-ps-slider-val">x{{ playbackNormalSpeed }}</span>
                  </div>
                </div>
                <div class="vs-ps-row">
                  <span class="vs-ps-label">事件录像播放速度：</span>
                  <div class="vs-ps-slider-wrap">
                    <a-slider v-model:value="playbackEventSpeed" :min="1" :max="16" :step="1" class="vs-ps-slider" />
                    <span class="vs-ps-slider-val">x{{ playbackEventSpeed }}</span>
                  </div>
                </div>
                <div class="vs-ps-footer">
                  <a-button @click="playbackStrategyVisible=false">取消</a-button>
                  <a-button type="primary" @click="confirmPlaybackStrategy">确认</a-button>
                </div>
              </div>
            </a-modal>

            <!-- 时间段下载 Modal -->
            <a-modal v-model:open="timeDownloadVisible" title="视频下载" :width="460" :footer="null">
              <div class="vs-download-dialog">
                <div class="vs-dd-row">
                  <span class="vs-dd-label">时间：</span>
                  <a-date-picker v-model:value="downloadDateStart" size="small" style="width:130px" value-format="YYYY-MM-DD" />
                  <span style="margin:0 6px;color:#999;">—</span>
                  <a-date-picker v-model:value="downloadDateEnd" size="small" style="width:130px" value-format="YYYY-MM-DD" />
                </div>
                <div class="vs-dd-row">
                  <span class="vs-dd-label">保存到：</span>
                  <span class="vs-dd-path">{{ downloadSavePath }}</span>
                </div>
                <div class="vs-dd-footer">
                  <a-button @click="timeDownloadVisible=false">取消</a-button>
                  <a-button type="primary" @click="confirmTimeDownload">确认</a-button>
                </div>
              </div>
            </a-modal>

            <!-- 事件下载 Modal -->
            <a-modal v-model:open="eventDownloadVisible" title="事件下载" :width="540" :footer="null">
              <div class="vs-download-dialog">
                <div class="vs-ed-grid">
                  <div v-for="item in eventDownloadItems" :key="item.id" class="vs-ed-card"
                    :class="{selected:item.selected}" @click="toggleEventSelect(item)">
                    <div class="vs-ed-thumb">
                      <div class="vs-ed-thumb-bg">📼</div>
                      <div v-if="item.selected" class="vs-ed-check"><CheckOutlined /></div>
                    </div>
                    <div class="vs-ed-info">
                      <div class="vs-ed-time">{{ item.time }}</div>
                      <div class="vs-ed-meta">{{ item.duration }} / {{ item.size }}</div>
                    </div>
                  </div>
                </div>
                <div class="vs-dd-row">
                  <span class="vs-dd-label">保存到：</span>
                  <span class="vs-dd-path">{{ downloadSavePath }}</span>
                </div>
                <div class="vs-dd-footer">
                  <a-button @click="eventDownloadVisible=false">取消</a-button>
                  <a-button type="primary" @click="confirmEventDownload">确认</a-button>
                </div>
              </div>
            </a-modal>

            <!-- 下载详情 Modal -->
            <a-modal v-model:open="downloadDetailVisible" title="下载详情" :width="460" :footer="null">
              <div class="vs-download-detail">
                <div v-for="task in downloadTasks" :key="task.id" class="vs-dtask-card">
                  <div class="vs-dtask-name">{{ task.name }}</div>
                  <div class="vs-dtask-progress-bar">
                    <div class="vs-dtask-progress-fill" :style="{width:(task.progress/task.total*100)+'%'}"></div>
                  </div>
                  <div class="vs-dtask-row">
                    <span>{{ task.progress }}MB/{{ task.total }}MB</span>
                    <span>耗时 {{ task.elapsed }}</span>
                    <span>{{ task.speed }}</span>
                  </div>
                  <div class="vs-dtask-actions">
                    <a-button size="small" danger>取消</a-button>
                  </div>
                </div>
                <a-empty v-if="downloadTasks.length===0" description="暂无下载任务" />
              </div>
            </a-modal>
          </div>
        </template>

        <!-- ========== 点位地图 ========== -->
        <template v-if="activeTab==='map'">
          <div class="vs-map-page">
            <!-- 地图占位 -->
            <div class="vs-map-container">
              <div class="vs-mock-map-bg">
                <div class="vs-mock-map-grid"></div>
                <div class="vs-mock-map-roads">
                  <div class="vs-mock-road" style="top:30%;left:0;width:100%;height:3px"></div>
                  <div class="vs-mock-road" style="top:55%;left:0;width:100%;height:3px"></div>
                  <div class="vs-mock-road" style="left:25%;top:0;width:3px;height:100%"></div>
                  <div class="vs-mock-road" style="left:65%;top:0;width:3px;height:100%"></div>
                </div>
                <div class="vs-mock-map-labels">
                  <span style="top:22%;left:22%">桥北</span>
                  <span style="top:48%;left:60%">鼓楼</span>
                  <span style="top:45%;left:32%">江宁</span>
                </div>

                <!-- 门店定位：聚合标记 -->
                <template v-if="mapMode==='store'">
                  <div v-for="store in mapStores" :key="store.id" class="vs-map-store-marker" :style="getStoreMarkerStyle(store)" @click="openStoreDrawer(store)">
                    <div class="vs-map-store-circle">{{ store.deviceCount }}</div>
                    <div class="vs-map-store-label">{{ store.name }}</div>
                  </div>
                </template>

                <!-- 设备定位：分散设备标记 -->
                <template v-if="mapMode==='device'">
                  <div v-for="device in allMapDevices" :key="device.id" class="vs-map-device-marker" :style="getDeviceMarkerStyle(device)" @click="openDeviceInfo(device)">
                    <EnvironmentOutlined class="vs-map-device-icon" :class="{online:device.online}" />
                    <div class="vs-map-device-label">{{ device.name }}</div>
                  </div>
                </template>

                <!-- 地图控件 -->
                <div class="vs-map-controls">
                  <div class="vs-map-compass"><span>N</span></div>
                  <div class="vs-map-zoom"><div class="vs-map-ctrl-btn"><PlusOutlined /></div><div class="vs-map-ctrl-btn"><MinusOutlined /></div></div>
                </div>
              </div>
            </div>

            <!-- 浮动 Tab 栏 -->
            <div class="vs-map-tabs">
              <div class="vs-map-tab" :class="{active:mapMode==='store'}" @click="mapMode='store'; drawerVisible=false; infoWindowDevice=null">门店定位</div>
              <div class="vs-map-tab" :class="{active:mapMode==='device'}" @click="mapMode='device'; drawerVisible=false; infoWindowDevice=null">设备定位</div>
            </div>

            <!-- 设备 InfoWindow -->
            <div v-if="infoWindowDevice && mapMode==='device'" class="vs-map-infowindow" :style="getDeviceMarkerStyle(infoWindowDevice)">
              <div class="vs-miw-content">
                <div class="vs-miw-head">
                  <span class="vs-miw-name">{{ infoWindowDevice.name }}</span>
                  <CloseOutlined class="vs-miw-close" @click="infoWindowDevice=null" />
                </div>
                <div class="vs-miw-row">设备License：{{ infoWindowDevice.deviceId }}</div>
                <div class="vs-miw-row">所属区域：{{ infoWindowDevice.area }}</div>
                <div class="vs-miw-row">设备类型：{{ infoWindowDevice.type }}</div>
                <div class="vs-miw-row">坐标：（{{ infoWindowDevice.lat }}°N，{{ infoWindowDevice.lng }}°E）</div>
                <div class="vs-miw-row">最近事件：<span :class="{event:infoWindowDevice.lastEvent}">{{ infoWindowDevice.lastEvent || '-' }}</span></div>
                <div class="vs-miw-btns">
                  <div class="vs-miw-btn" @click="openEditCoord(infoWindowDevice)">修改坐标</div>
                  <div class="vs-miw-btn primary" @click="openLiveVideo(infoWindowDevice)">实时视频</div>
                </div>
              </div>
              <div class="vs-miw-arrow"></div>
            </div>
          </div>

          <!-- 右侧 Drawer：门店设备列表 -->
          <a-drawer :open="drawerVisible && mapMode==='store'" placement="right" :width="400" :closable="false" :get-container="getDrawerContainer" class="vs-store-drawer">
            <div class="vs-sd-header">
              <span class="vs-sd-title">共 {{ selectedStore?.deviceCount || 0 }} 台设备</span>
              <CloseOutlined class="vs-sd-close" @click="drawerVisible=false" />
            </div>
            <div class="vs-sd-list">
              <div v-for="device in selectedStore?.devices || []" :key="device.id" class="vs-sd-card">
                <div class="vs-sdc-head">
                  <span class="vs-sdc-name">{{ device.name }}</span>
                  <span class="vs-sdc-status-badge" :class="device.online?'online':'offline'">
                    <span class="vs-sdc-status-dot"></span>{{ device.online ? '在线' : '离线' }}
                  </span>
                </div>
                <div class="vs-sdc-body">
                  <div class="vs-sdc-row"><span class="vs-sdc-row-label">设备License</span><span class="vs-sdc-row-value">{{ device.deviceId }}</span></div>
                  <div class="vs-sdc-row"><span class="vs-sdc-row-label">所属区域</span><span class="vs-sdc-row-value">{{ device.area }}</span></div>
                  <div class="vs-sdc-row"><span class="vs-sdc-row-label">设备类型</span><span class="vs-sdc-row-value">{{ device.type }}</span></div>
                  <div class="vs-sdc-row"><span class="vs-sdc-row-label">坐标</span><span class="vs-sdc-row-value">{{ device.lat }}°N，{{ device.lng }}°E</span></div>
                  <div class="vs-sdc-row"><span class="vs-sdc-row-label">最近事件</span><span class="vs-sdc-row-value" :class="{event:device.lastEvent}">{{ device.lastEvent || '-' }}</span></div>
                </div>
                <div class="vs-sdc-btns">
                  <div class="vs-sdc-btn" @click="openEditCoord(device)">修改坐标</div>
                  <div class="vs-sdc-btn primary" @click="openLiveVideo(device)">实时视频</div>
                </div>
              </div>
            </div>
          </a-drawer>
        </template>

      </div>
    </div>

    <!-- ==================== 修改坐标弹窗 ==================== -->
    <a-modal v-model:open="editCoordVisible" title="修改坐标" :width="480" :footer="null">
      <div class="vs-editcoord">
        <div class="vs-ec-row"><span class="vs-ec-label"><span class="vs-ec-required">*</span>设备名称</span><a-input :value="editingDevice?.name" disabled class="vs-ec-input" /></div>
        <div class="vs-ec-row"><span class="vs-ec-label"><span class="vs-ec-required">*</span>设备License</span><a-input :value="editingDevice?.deviceId" disabled class="vs-ec-input" /></div>
        <div class="vs-ec-row"><span class="vs-ec-label"><span class="vs-ec-required">*</span>经度</span><a-input v-model:value="editLng" class="vs-ec-input" /></div>
        <div class="vs-ec-row"><span class="vs-ec-label"><span class="vs-ec-required">*</span>纬度</span><a-input v-model:value="editLat" class="vs-ec-input" /></div>
        <div class="vs-ec-row"><span class="vs-ec-label"></span><span class="vs-ec-link" @click="openMapPicker"><EnvironmentOutlined /> 地图选点</span></div>
        <div class="vs-ec-footer"><a-button @click="editCoordVisible=false">取消</a-button><a-button type="primary" class="vs-ec-confirm" @click="confirmEditCoord">确定</a-button></div>
      </div>
    </a-modal>

    <!-- ==================== 地图选点弹窗 ==================== -->
    <a-modal v-model:open="mapPickerVisible" title="地图选点" :width="640" :footer="null">
      <div class="vs-mappicker">
        <div class="vs-mp-toolbar">
          <span class="vs-mp-label">位置查询：</span><a-input v-model:value="pickerSearchText" size="small" style="width:160px" placeholder="搜索位置" /><a-button size="small" type="primary"><SearchOutlined /></a-button>
          <span style="flex:1"></span>
          <span class="vs-mp-label">坐标：</span><span class="vs-mp-coord">经度{{ pickerLng }}°,纬度{{ pickerLat }}°</span>
        </div>
        <div class="vs-mp-map" @click="onPickerMapClick">
          <div class="vs-mock-map-bg" style="height:300px">
            <div class="vs-mock-map-grid"></div>
            <div class="vs-mp-marker" :style="{top:'50%',left:'50%'}">
              <EnvironmentOutlined style="color:#1890ff;font-size:28px" />
            </div>
          </div>
        </div>
        <div class="vs-ec-footer"><a-button @click="mapPickerVisible=false">取消</a-button><a-button type="primary" class="vs-ec-confirm" @click="confirmMapPicker">确定</a-button></div>
      </div>
    </a-modal>

    <!-- ==================== 实时视频对话框 ==================== -->
    <a-modal v-model:open="liveVideoVisible" :width="900" :footer="null" wrap-class-name="vs-livevideo-modal" :get-container="getDrawerContainer">
      <div class="vs-lv-dialog">
        <div class="vs-lv-header">
          <div><span class="vs-lv-name">{{ liveVideoDevice?.name }}</span><span class="vs-lv-time">2024/07/23 18:45:02</span></div>
          <CloseOutlined class="vs-lv-close" @click="liveVideoVisible=false" />
        </div>
        <div class="vs-lv-video">
          <div class="vs-lv-placeholder">📹</div>
          <div class="vs-lv-ptz">
            <div class="vs-lv-ptz-ring">
              <div class="vs-lv-ptz-arrow up"></div>
              <div class="vs-lv-ptz-arrow right"></div>
              <div class="vs-lv-ptz-arrow down"></div>
              <div class="vs-lv-ptz-arrow left"></div>
              <div class="vs-lv-ptz-center"></div>
            </div>
          </div>
          <div class="vs-lv-toolbar">
            <CameraOutlined /><VideoCameraOutlined /><AudioOutlined /><span style="font-size:11px">高清</span><ExpandOutlined />
          </div>
        </div>
        <div class="vs-lv-footer">
          <span>设备License：{{ liveVideoDevice?.deviceId }}</span>
          <span>设备名称：{{ liveVideoDevice?.name }}</span>
          <span>所在区域：{{ liveVideoDevice?.area }}</span>
        </div>
      </div>
    </a-modal>

    <!-- ==================== 轮巡设置 Modal ==================== -->
    <a-modal v-model:open="patrolModalOpen" title="轮巡设置" :width="480" :footer="null" :get-container="getDrawerContainer">
      <div class="vs-patrol-modal">
        <div class="vpm-row">
          <span class="vpm-label">视频轮巡开关：</span>
          <a-switch v-model:checked="patrolEnabled" />
          <span class="vpm-hint">开启后，首页播放视频将根据设置内容循环播放视频。</span>
        </div>
        <div class="vpm-row">
          <span class="vpm-label">轮巡切换时间：</span>
          <a-input-number v-model:value="patrolDuration" :min="5" :max="300" :step="5" size="small" style="width:90px" />
          <span style="margin-left:6px;font-size:13px;">秒</span>
          <span class="vpm-hint">根据设置时间，自动切换通报下一台设备。</span>
        </div>
        <div class="vpm-row">
          <span class="vpm-label">轮巡位置选择：</span>
          <div class="vpm-grid" :class="patrolGridClass">
            <div v-for="(checked,i) in patrolPositions" :key="i" class="vpm-cell" :class="{active:checked}" @click="togglePatrolPosition(i)">
              <CheckOutlined v-if="checked" class="vpm-check" />
            </div>
          </div>
          <span class="vpm-hint">用于选择启用轮巡的位置。</span>
        </div>
        <div class="vpm-row">
          <span class="vpm-label">轮巡设备选择：</span>
          <a-popover v-model:open="patrolDeviceSelectOpen" trigger="click" placement="bottomLeft" :width="320">
            <a-button size="small" type="dashed" class="vpm-device-btn" @click="patrolDeviceSelectOpen=!patrolDeviceSelectOpen">
              <span :style="{ color: patrolDeviceCount > 0 ? '#1677ff' : '#999' }">{{ patrolDeviceCount > 0 ? patrolDeviceCount + '台设备' : '从组织树中选择' }}</span>
            </a-button>
            <template #content>
              <div class="vpm-device-tree-wrap">
                <a-input v-model:value="patrolTreeSearch" placeholder="搜索区域/设备..." size="small" allow-clear class="vpm-device-search">
                  <template #prefix><SearchOutlined /></template>
                </a-input>
                <a-tree
                  v-if="filteredPatrolTree.length > 0"
                  :tree-data="filteredPatrolTree"
                  checkable
                  :checked-keys="patrolTreeCheckedKeys"
                  :default-expanded-keys="['root']"
                  :field-names="{ children:'children', title:'title', key:'key' }"
                  :title-render="(node: any) => node.isDevice ? h('span',{class:'vs-tree-device'},[h('span',{class:['vs-tree-dot','online']}),h('span',{class:'vs-tree-device-name'},node.title)]) : node.title"
                  @check="onPatrolTreeCheck"
                  class="vpm-device-tree"
                />
                <a-empty v-else description="未找到匹配的组织或设备" :image-style="{height:'30px'}" />
              </div>
            </template>
          </a-popover>
        </div>
        <div class="vpm-footer">
          <a-button @click="patrolModalOpen=false">取消</a-button>
          <a-button type="primary" @click="confirmPatrol">确认</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
/* ========== 整体布局 ========== */
.vs-page { display:flex; flex-direction:column; height:100%; background:#f0f2f5; }
.vs-fullscreen { position:fixed; inset:0; z-index:1000; background:#000; }
.vs-body { display:flex; flex:1; overflow:hidden; }

/* ========== 左侧侧边栏（300px，可折叠） ========== */
.vs-sidebar { width:300px; flex-shrink:0; background:#fff; border-right:1px solid #f0f0f0; display:flex; flex-direction:column; position:relative; transition:width .25s ease; overflow:visible; }
.vs-sidebar.collapsed { width:0; border-right-color:transparent; }
.vs-sidebar-inner { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.vs-sidebar.collapsed .vs-sidebar-inner { opacity:0; visibility:hidden; }
.vs-sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; }
.vs-sidebar-title { font-size:14px; font-weight:600; color:#1a1a1a; }
.vs-sidebar-tabs { display:flex; gap:4px; }
.vs-sb-tab { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:6px; cursor:pointer; color:#999; font-size:15px; transition:all .15s; }
.vs-sb-tab:hover { color:#1677ff; background:#f0f5ff; }
.vs-sb-tab.active { color:#1677ff; background:#e6f4ff; }

/* 折叠把手 — 悬浮在侧边栏右边缘，半透明精致胶囊 */
.vs-sidebar-toggle { position:absolute; left:290px; top:50%; transform:translate(-50%,-50%); width:20px; height:44px; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; z-index:10; border-radius:22px; background:rgba(255,255,255,0.75); backdrop-filter:blur(4px); border:1px solid rgba(0,0,0,0.06); box-shadow:0 1px 6px rgba(0,0,0,0.04); transition:all .3s cubic-bezier(.4,0,.2,1); }
.vs-sidebar.collapsed .vs-sidebar-toggle { left:6px; }
.vs-sidebar-toggle:hover { width:22px; height:48px; transform:translate(-50%,-50%); background:rgba(255,255,255,0.95); border-color:rgba(22,119,255,0.15); box-shadow:0 2px 10px rgba(22,119,255,0.1); }
.vs-sidebar.collapsed .vs-sidebar-toggle:hover { transform:translate(-50%,-50%); }
.vs-sidebar-toggle-icon { font-size:11px; color:#b0b0b0; transition:all .3s cubic-bezier(.4,0,.2,1); }
.vs-sidebar-toggle:hover .vs-sidebar-toggle-icon { color:#1677ff; }

.vs-search { margin:4px 12px 8px; width:auto; }

.vs-tree-wrap { flex:1; overflow-y:auto; padding:0 8px 8px; }
.vs-sidebar-date { padding:0 12px 12px; margin-top:24px; position:relative; }

/* 自定义日历 */
.vs-cdp-input { display:flex; align-items:center; justify-content:space-between; gap:8px; height:36px; padding:0 10px; border:1px solid #d9d9d9; border-radius:6px; cursor:pointer; font-size:13px; color:#333; background:#fff; transition:border-color .15s; }
.vs-cdp-input:hover { border-color:#1677ff; }
.vs-cdp-input-icon { color:#999; font-size:14px; flex-shrink:0; }
.vs-cdp-input-icon { color:#999; font-size:14px; }
.vs-cdp-popup { position:absolute; bottom:100%; left:12px; right:12px; margin-bottom:4px; background:#fff; border-radius:8px; box-shadow:0 6px 16px rgba(0,0,0,0.12); padding:16px; z-index:100; }
.vs-cdp-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.vs-cdp-nav-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#999; font-size:16px; border-radius:4px; user-select:none; transition:color .15s,background .15s; }
.vs-cdp-nav-btn:hover { color:#333; background:#f5f5f5; }
.vs-cdp-nav-title { font-size:16px; font-weight:600; color:#333; }
.vs-cdp-weekdays { display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-size:13px; color:#999; padding-bottom:8px; border-bottom:1px solid #e8e8e8; margin-bottom:8px; }
.vs-cdp-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px 0; }
.vs-cdp-cell { display:flex; flex-direction:column; align-items:center; justify-content:center; height:40px; cursor:pointer; border-radius:4px; user-select:none; transition:background .15s; position:relative; }
.vs-cdp-cell.other-month .vs-cdp-day-num { color:#ccc; }
.vs-cdp-cell.other-month { cursor:default; }
.vs-cdp-cell.future { cursor:default; }
.vs-cdp-cell.future .vs-cdp-day-num { color:#ccc; }
.vs-cdp-day-num { font-size:13px; color:#333; line-height:1.2; }
.vs-cdp-marker { font-size:8px; line-height:1; margin-top:1px; visibility:visible; }
.vs-cdp-marker.hidden { visibility:hidden; }
.vs-cdp-marker.regular { color:#1890ff; }
.vs-cdp-marker.event { color:#fa8c16; }
.vs-cdp-marker.both { color:#fa8c16; }
.vs-cdp-marker.on-selected { color:#fff; }
.vs-cdp-cell:hover { background:#e6f7ff; }
.vs-cdp-cell.has-event:hover { background:#fff2f0; }
.vs-cdp-cell.selected { background:#1890ff; }
.vs-cdp-cell.selected .vs-cdp-day-num { color:#fff; }
.vs-cdp-cell.selected:hover { background:#1890ff; }
.vs-cdp-cell.other-month:hover { background:transparent; }
.vs-tree :deep(.ant-tree-node-content-wrapper) { font-size:12px; color:#333; }
.vs-tree :deep(.ant-tree-node-selected) { background:#e6f7ff!important; }
.vs-tree :deep(.ant-tree-treenode) { padding:1px 0; }
.vs-tree-wrap :deep(.vs-tree-device) { display:inline-flex; align-items:center; gap:6px; cursor:grab; }
.vs-tree-wrap :deep(.vs-tree-device:active) { cursor:grabbing; }
.vs-tree-wrap :deep(.vs-tree-dot) { width:6px; height:6px; border-radius:50%; background:#d9d9d9; flex-shrink:0; }
.vs-tree-wrap :deep(.vs-tree-dot.online) { background:#52c41a; }
.vs-tree-wrap :deep(.vs-tree-device-name) { font-size:12px; color:#555; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.vs-tree-wrap :deep(.vs-tree-status) { font-size:11px; flex-shrink:0; display:inline-flex; align-items:center; }
.vs-tree-wrap :deep(.vs-tree-playing) { color:#1677ff; }
.vs-tree-wrap :deep(.vs-tree-patrol) { color:#fa8c16; }
.vs-tree-wrap :deep(.vs-tree-patrol-icon) { font-size:12px; animation:patrol-pulse 1.5s ease-in-out infinite; }
.vs-tree-wrap :deep(.vs-tree-play-icon) { font-size:10px; }
.vs-tree-wrap :deep(.vs-tree-replaying) { color:#1677ff; }
.vs-tree-wrap :deep(.vs-tree-replay-icon) { font-size:12px; }

/* ========== 中央内容区 ========== */
.vs-content { flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; }

/* ========== 轮巡浮动标签 ========== */
.vs-patrol-badge { position:absolute; top:8px; right:8px; display:flex; align-items:center; gap:5px; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); border-radius:14px; padding:3px 10px; z-index:10; border:1px solid rgba(250,140,22,0.4); }
.vs-patrol-badge-dot { width:6px; height:6px; border-radius:50%; background:#fa8c16; animation:patrol-pulse 1.5s ease-in-out infinite; flex-shrink:0; }
@keyframes patrol-pulse { 0%,100%{opacity:1;box-shadow:0 0 4px #fa8c16} 50%{opacity:0.4;box-shadow:0 0 1px #fa8c16} }
.vs-patrol-badge-text { font-size:11px; color:#fa8c16; font-weight:500; line-height:1; }
.vs-patrol-badge-close { font-size:12px; color:rgba(255,255,255,0.6); cursor:pointer; transition:color .15s; }
.vs-patrol-badge-close:hover { color:#ff4d4f; }
.vs-cell.drag-over { border-color:#1677ff!important; border-style:dashed; background:rgba(22,119,255,0.06); }
.vs-cell.patrol-active { border-color:#fa8c16!important; box-shadow:0 0 10px rgba(250,140,22,0.35); }

/* ========== 多分屏视频网格 ========== */
.vs-video-grid { flex:1; display:grid; gap:0; background:#404040; }
.vs-grid-1 { grid-template-columns:1fr; grid-template-rows:1fr; }
.vs-grid-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.vs-grid-9 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; }
.vs-grid-6 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; grid-template-areas:'a a b' 'a a c' 'd e f'; }
.vs-grid-6 :deep(.vs-cell:nth-child(1)) { grid-area:a; }
.vs-grid-8 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; grid-template-areas:'a a a b' 'a a a c' 'a a a d' 'e f g h'; }
.vs-grid-8 :deep(.vs-cell:nth-child(1)) { grid-area:a; }
.vs-grid-7 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.vs-grid-7 :deep(.vs-cell:nth-child(1)) { grid-area:a; }
.vs-grid-7 :deep(.vs-cell:nth-child(2)) { grid-area:b; }
.vs-grid-7 :deep(.vs-cell:nth-child(3)) { grid-area:c; }
.vs-grid-7 :deep(.vs-cell:nth-child(4)) { grid-area:d; }
.vs-grid-7 :deep(.vs-cell:nth-child(5)) { grid-area:e; }
.vs-grid-7 :deep(.vs-cell:nth-child(6)) { grid-area:f; }
.vs-grid-7 :deep(.vs-cell:nth-child(7)) { grid-area:g; }
.vs-grid-12 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-grid-16 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-cell { position:relative; border:1px solid #555; overflow:hidden; cursor:pointer; background:#333; }
.vs-cell.selected { border-color:#1677ff!important; box-shadow:inset 0 0 0 2px #1677ff; }
.vs-cell.cell-selected { border-color:#91caff!important; border-style:dashed; background:rgba(22,119,255,0.04); }
.vs-cell.patrol-active { border-color:#fa8c16!important; }

.vs-cell-placeholder { display:flex; align-items:center; justify-content:center; height:100%; color:rgba(255,255,255,0.5); font-size:14px; user-select:none; }
.vs-cell-loading { display:flex; align-items:center; justify-content:center; height:100%; }
.vs-cell-loading :deep(.ant-spin-text) { color:rgba(255,255,255,0.6); font-size:12px; }

.vs-cell-video { width:100%; height:100%; }
.vs-mock-video { width:100%; height:100%; position:relative; overflow:hidden; }
.vs-mock-video.flipped { transform:rotate(180deg); }
.vs-mock-video-bg { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a1a3e,#2a1a4e,#1a2a3e); }
.vs-mock-icon { font-size:42px; opacity:0.5; }
.vs-mock-scanline { position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(90deg,transparent,rgba(22,119,255,0.3),transparent); animation:scan 3s linear infinite; }
@keyframes scan { from{top:0} to{top:100%} }
.vs-mock-replay-bg { background:linear-gradient(135deg,#2e1a1a,#3e1a2a,#2e2a1a); }
.vs-mock-replay-text { color:rgba(255,255,255,0.7); font-size:13px; margin-top:8px; }
.vs-mock-replay-time { color:rgba(255,255,255,0.4); font-size:11px; margin-top:4px; }

.vs-cell-osd { position:absolute; top:4px; left:4px; right:4px; display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.8); background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:2px; pointer-events:none; }
.vs-cell-osd-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.vs-cell-osd-time { flex-shrink:0; margin-left:8px; }
.vs-cell-osd-stream { flex-shrink:0; margin-left:6px; color:#91caff; }
.vs-cell-pause-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); color:#fff; gap:8px; font-size:20px; }
.vs-cell-record-indicator { position:absolute; top:24px; right:4px; display:flex; align-items:center; gap:4px; background:rgba(255,0,0,0.7); color:#fff; font-size:10px; padding:1px 6px; border-radius:2px; }
.vs-rec-dot { width:6px; height:6px; border-radius:50%; background:#f00; animation:blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
.vs-cell-mute-indicator { position:absolute; bottom:24px; right:4px; color:rgba(255,255,255,0.6); font-size:14px; }
.vs-cell-close { position:absolute; top:4px; right:4px; width:20px; height:20px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); color:rgba(255,255,255,0.6); border-radius:50%; font-size:10px; opacity:0; transition:opacity .15s; z-index:6; }
.vs-cell-close-visible { opacity:1; }
.vs-cell:hover .vs-cell-close { opacity:1; }
.vs-cell-close:hover { background:rgba(255,0,0,0.7); color:#fff; }
.vs-cell-error { display:flex; align-items:center; justify-content:center; height:100%; color:rgba(255,255,255,0.6); font-size:12px; }

/* ========== 底部工具栏 ========== */
.vs-toolbar { display:flex; align-items:center; justify-content:space-between; height:56px; padding:0 20px; background:#fff; border-top:1px solid #f0f0f0; flex-shrink:0; }
.vs-toolbar-fs { position:fixed; bottom:0; left:0; right:0; background:rgba(30,30,30,0.95); border-top:1px solid rgba(255,255,255,0.1); z-index:1001; }
.vs-toolbar-fs .vs-tool-icon { color:rgba(255,255,255,0.7); border-color:rgba(255,255,255,0.2); }
.vs-toolbar-fs .vs-tool-icon:hover { color:#fff; background:rgba(255,255,255,0.1); }
.vs-toolbar-center { display:flex; align-items:center; gap:8px; flex:1; justify-content:center; }
.vs-tool-icon { width:36px; height:36px; border-radius:50%; border:1px solid #d9d9d9; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#666; font-size:16px; transition:all .15s; user-select:none; flex-shrink:0; }
.vs-tool-icon:hover { color:#1677ff; border-color:#1677ff; background:#f0f5ff; }
.vs-tool-icon.active { color:#1677ff; border-color:#1677ff; background:#e6f4ff; }
.vs-tool-icon.disabled { color:#c0c4cc; border-color:#eee; cursor:not-allowed; }
.vs-tool-icon.disabled:hover { background:transparent; }
.vs-tool-icon.recording { color:#ff4d4f; border-color:#ff4d4f; animation:blink 1s infinite; }
.vs-tool-label { font-size:11px; font-weight:600; }
.vs-stream-label { font-size:11px; font-weight:700; letter-spacing:-0.5px; }
.vs-rec-icon { font-size:13px; }
.vs-toolbar-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.vs-patrol-combo { display:inline-flex; align-items:center; gap:0; border:1px solid #1677ff; border-radius:4px; cursor:pointer; user-select:none; transition:all .15s; height:34px; overflow:hidden; }
.vs-patrol-combo:hover { background:#e6f7ff; }
.vs-patrol-text { font-size:12px; color:#1677ff; padding:0 10px; line-height:34px; }
.vs-patrol-sep { width:1px; height:18px; background:#1677ff; flex-shrink:0; }
.vs-patrol-icon { font-size:14px; color:#1677ff; padding:0 8px; }

/* ========== PTZ 抽屉 ========== */
.vs-ptz-drawer { display:flex; flex-direction:column; gap:24px; padding:8px 0; }

/* 圆形方向摇杆 */
.vs-ptz-joystick { display:flex; justify-content:center; padding:12px 0; }
.vs-ptz-ring { position:relative; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle at center,#f8f9fb 30%,#eef1f6 100%); border:2px solid #e0e4ea; box-shadow:0 4px 20px rgba(0,0,0,0.06),inset 0 2px 8px rgba(0,0,0,0.03); }
.vs-ptz-ring-btn { position:absolute; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#7a8599; font-size:17px; background:#fff; border:1px solid #e8ecf0; transition:color .2s,background .2s,border-color .2s,box-shadow .2s,transform .2s; user-select:none; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
.vs-ptz-ring-btn:hover { color:#1677ff; background:#f0f5ff; border-color:#91caff; box-shadow:0 4px 12px rgba(22,119,255,0.15); transform:scale(1.12); z-index:2; }
.vs-ptz-ring-btn:active { background:#d6e8ff; transform:scale(0.94); }
.ring-n { top:4px; left:50%; margin-left:-19px; }
.ring-s { bottom:4px; left:50%; margin-left:-19px; }
.ring-w { left:4px; top:50%; margin-top:-19px; }
.ring-e { right:4px; top:50%; margin-top:-19px; }
.ring-ne { top:18px; right:18px; }
.ring-nw { top:18px; left:18px; }
.ring-se { bottom:18px; right:18px; }
.ring-sw { bottom:18px; left:18px; }
.ring-ne::after, .ring-nw::after, .ring-se::after, .ring-sw::after { content:''; width:4px; height:4px; border-radius:50%; background:#c0c8d4; transition:background .2s; }
.ring-ne:hover::after, .ring-nw:hover::after, .ring-se:hover::after, .ring-sw:hover::after { background:#1677ff; }
.vs-ptz-core { position:absolute; left:50%; top:50%; width:56px; height:56px; margin-left:-28px; margin-top:-28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#1677ff; font-size:20px; background:linear-gradient(135deg,#e6f4ff,#d6e8ff); border:2px solid #91caff; box-shadow:0 2px 10px rgba(22,119,255,0.15); transition:transform .2s,box-shadow .2s; }
.vs-ptz-core:hover { transform:scale(1.08); box-shadow:0 4px 16px rgba(22,119,255,0.25); }
.vs-ptz-core:active { transform:scale(0.95); }

.vs-ptz-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.vs-ptz-section-label { font-size:13px; font-weight:500; color:#333; display:flex; align-items:center; gap:6px; }
.vs-ptz-section-val { font-size:13px; font-weight:600; color:#1677ff; }
.vs-ptz-star { color:#fa8c16; font-size:15px; }
.vs-ptz-zoom-bar { display:flex; align-items:center; gap:10px; }
.vs-ptz-zoom-btn { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#666; font-size:14px; background:#f5f7fa; border:1px solid #e8e8e8; transition:all .15s; user-select:none; }
.vs-ptz-zoom-btn:hover { color:#1677ff; background:#e6f4ff; border-color:#91caff; }
.vs-ptz-zoom-btn:active { transform:scale(0.95); }
.vs-ptz-zoom-track { flex:1; height:6px; border-radius:3px; background:#e8ecf0; overflow:hidden; }
.vs-ptz-zoom-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#69b1ff,#1677ff); transition:width .25s ease; }
.vs-ptz-zoom-read { font-size:15px; font-weight:700; color:#333; min-width:36px; text-align:center; }
.vs-ptz-presets { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.vs-ptz-preset { position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 8px 12px; border-radius:10px; background:#fafbfc; border:1px solid #f0f0f0; cursor:pointer; transition:all .2s; }
.vs-ptz-preset:hover { border-color:#91caff; background:#f0f5ff; box-shadow:0 2px 8px rgba(22,119,255,0.08); transform:translateY(-2px); }
.vs-ptz-preset-del { position:absolute; top:4px; right:4px; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#ccc; font-size:9px; transition:all .15s; opacity:0; }
.vs-ptz-preset:hover .vs-ptz-preset-del { opacity:1; }
.vs-ptz-preset-del:hover { color:#ff4d4f; background:rgba(255,77,79,0.08); }
.vs-ptz-preset-thumb { width:48px; height:48px; border-radius:6px; overflow:hidden; flex-shrink:0; position:relative; }
.vs-ptz-thumb-scene { width:100%; height:100%; background:linear-gradient(135deg,#1a1f2e 0%,#1e2840 40%,#243050 100%); position:relative; display:flex; align-items:center; justify-content:center; }
.vs-ptz-thumb-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px); background-size:12px 12px; }
.vs-ptz-thumb-tag { position:absolute; top:3px; right:3px; font-size:7px; font-weight:700; color:#ff4d4f; letter-spacing:0.5px; background:rgba(0,0,0,0.4); padding:1px 3px; border-radius:2px; line-height:1; }
.vs-ptz-preset-name-row { width:100%; display:flex; justify-content:center; min-height:22px; }
.vs-ptz-preset-label { font-size:12px; color:#555; font-weight:500; cursor:pointer; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; user-select:none; }
.vs-ptz-preset-label:hover { color:#1677ff; }
.vs-ptz-preset-edit { font-size:11px; color:#ccc; cursor:pointer; flex-shrink:0; opacity:0; transition:opacity .15s; }
.vs-ptz-preset:hover .vs-ptz-preset-edit { opacity:1; }
.vs-ptz-preset-edit:hover { color:#1677ff; }
.vs-ptz-rename-input { width:100%; }
.vs-ptz-rename-input :deep(.ant-input) { font-size:11px; text-align:center; padding:2px 4px; height:22px; }

/* ========== 灯光面板 ========== */
.vs-light-panel { position:absolute; bottom:60px; left:50%; transform:translateX(-50%); background:rgba(30,30,30,0.92); border-radius:10px; padding:10px 14px; z-index:100; backdrop-filter:blur(10px); min-width:100px; }
.vs-light-title { color:rgba(255,255,255,0.7); font-size:11px; text-align:center; margin-bottom:6px; }
.vs-light-option { padding:5px 10px; border-radius:4px; cursor:pointer; color:rgba(255,255,255,0.6); font-size:12px; transition:all .15s; }
.vs-light-option:hover { background:rgba(255,255,255,0.1); }
.vs-light-option.active { color:#fa8c16; background:rgba(250,140,22,0.2); }

/* ========== 分屏按钮预览图标 ========== */
.vs-split-btn-pv { display:inline-grid; width:18px; height:18px; gap:1px; }
.vs-split-btn-pv-cell { background:#bbb; border-radius:1px; min-width:0; min-height:0; }
/* ========== 分屏选择 Popover ========== */
.vs-split-menu { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; padding:4px; min-width:240px; }
.vs-split-card { display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:6px; cursor:pointer; transition:background .15s; }
.vs-split-card:hover { background:#f5f7fa; }
.vs-split-card.active { background:#e6f4ff; }
.vs-split-pv { display:grid; width:48px; height:48px; gap:2px; }
.vs-split-pv-cell { background:#d9d9d9; border-radius:2px; min-width:0; min-height:0; }
.vs-split-card.active .vs-split-pv-cell { background:#91d5ff; }
.vs-split-card-label { font-size:11px; color:#666; }
.vs-split-card.active .vs-split-card-label { color:#1677ff; font-weight:500; }

.vs-split-pv.pv-1 { grid-template-columns:1fr; grid-template-rows:1fr; }
.vs-split-pv.pv-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.vs-split-pv.pv-9 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; }
.vs-split-pv.pv-12 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-split-pv.pv-16 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-split-pv.pv-6 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; grid-template-areas:'a a b' 'a a c' 'd e f'; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(3) { grid-area:c; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(4) { grid-area:d; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(5) { grid-area:e; }
.vs-split-pv.pv-6 .vs-split-pv-cell:nth-child(6) { grid-area:f; }
.vs-split-pv.pv-8 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; grid-template-areas:'a a a b' 'a a a c' 'd e f g'; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(3) { grid-area:c; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(4) { grid-area:d; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(5) { grid-area:e; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(6) { grid-area:f; }
.vs-split-pv.pv-8 .vs-split-pv-cell:nth-child(7) { grid-area:g; }
.vs-split-pv.pv-7 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.vs-split-pv.pv-7 .vs-split-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-pv.pv-7 .vs-split-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-pv.pv-7 .vs-split-pv-cell:nth-child(3) { grid-area:c; }

.vs-split-btn-pv.pv-1 { grid-template-columns:1fr; grid-template-rows:1fr; }
.vs-split-btn-pv.pv-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
.vs-split-btn-pv.pv-9 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; }
.vs-split-btn-pv.pv-12 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-split-btn-pv.pv-16 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; }
.vs-split-btn-pv.pv-6 { grid-template-columns:1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; grid-template-areas:'a a b' 'a a c' 'd e f'; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(3) { grid-area:c; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(4) { grid-area:d; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(5) { grid-area:e; }
.vs-split-btn-pv.pv-6 .vs-split-btn-pv-cell:nth-child(6) { grid-area:f; }
.vs-split-btn-pv.pv-8 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr; grid-template-areas:'a a a b' 'a a a c' 'd e f g'; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(3) { grid-area:c; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(4) { grid-area:d; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(5) { grid-area:e; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(6) { grid-area:f; }
.vs-split-btn-pv.pv-8 .vs-split-btn-pv-cell:nth-child(7) { grid-area:g; }
.vs-split-btn-pv.pv-7 { grid-template-columns:1fr 1fr 1fr 1fr; grid-template-rows:1fr 1fr 1fr 1fr; grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.vs-split-btn-pv.pv-7 .vs-split-btn-pv-cell:nth-child(1) { grid-area:a; }
.vs-split-btn-pv.pv-7 .vs-split-btn-pv-cell:nth-child(2) { grid-area:b; }
.vs-split-btn-pv.pv-7 .vs-split-btn-pv-cell:nth-child(3) { grid-area:c; }

/* ========== 视频回放 ========== */
.vs-playback-area { display:flex; flex-direction:column; height:100%; background:#404040; }
.vs-playback-empty { display:flex; align-items:center; justify-content:center; height:100%; }
.vs-playback-empty-placeholder { color:rgba(255,255,255,0.5); font-size:14px; user-select:none; }
.vs-playback-video-wrap { flex:1; display:flex; align-items:center; justify-content:center; padding:8px; }
.vs-playback-video { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.vs-playback-video .vs-mock-video { width:100%; height:100%; max-width:100%; position:relative; overflow:hidden; }
.vs-playback-video .vs-mock-video-bg { width:100%; height:100%; background:linear-gradient(135deg,#1a1a3e,#2a1a4e,#1a2a3e); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
.vs-playback-video .vs-mock-icon { font-size:48px; opacity:0.5; }
.vs-playback-video .vs-mock-scanline { position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.02)2px,rgba(255,255,255,0.02)4px); pointer-events:none; }
.vs-playback-video .vs-cell-osd { position:absolute; top:0; left:0; right:0; display:flex; gap:16px; padding:6px 12px; background:linear-gradient(to bottom,rgba(0,0,0,0.5),transparent); color:rgba(255,255,255,0.85); font-size:12px; z-index:5; }
.vs-playback-video .vs-cell-osd-name { font-weight:500; }
.vs-playback-video .vs-cell-osd-time { color:rgba(255,255,255,0.6); }
.vs-playback-video .vs-cell-osd-stream { margin-left:auto; color:#1677ff; font-size:11px; }
.vs-playback-video .vs-cell-pause-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); color:#fff; font-size:13px; gap:6px; z-index:5; }
.vs-playback-video .vs-cell-mute-indicator { position:absolute; bottom:10px; right:10px; color:rgba(255,255,255,0.5); font-size:16px; z-index:5; }

/* 底部控制栏-上层：时间轴 */
.vs-playback-bar-top { background:#fff; padding:10px 16px 0; position:relative; border-bottom:1px solid #f0f0f0; }
.vs-pbt-scale { display:flex; justify-content:space-between; padding:0 8px; }
.vs-pbt-tick { font-size:10px; color:#bbb; width:20px; text-align:center; }
.vs-pbt-track { position:relative; height:5px; background:#f0f0f0; border-radius:3px; margin:4px 0 8px; cursor:pointer; }
.vs-pbt-seg { position:absolute; top:0; height:100%; background:rgba(22,119,255,0.5); border-radius:3px; }
.vs-pbt-cursor { position:absolute; top:-3px; width:2px; height:11px; background:#ff4d4f; border-radius:1px; z-index:2; }
.vs-pbt-range { position:absolute; top:10px; right:16px; display:flex; align-items:center; gap:4px; }
.vs-pbr-btn { width:20px; height:20px; display:flex; align-items:center; justify-content:center; color:#999; font-size:10px; cursor:pointer; border-radius:3px; transition:all .15s; }
.vs-pbr-btn:hover { color:#1677ff; background:#f0f5ff; }


/* 底部控制栏-下层：功能按钮 */
.vs-playback-bar-bottom { display:flex; align-items:center; justify-content:space-between; padding:8px 16px; background:#fff; border-top:1px solid #f0f0f0; }
.vs-pbb-left { display:flex; align-items:center; gap:12px; flex:1; }
.vs-pbb-right { display:flex; align-items:center; flex:1; justify-content:flex-end; }
.vs-pbb-center { display:flex; align-items:center; gap:6px; flex:0 0 auto; }
.vs-pbb-legend { font-size:11px; color:#888; display:flex; align-items:center; gap:5px; cursor:pointer; }
.vs-pbb-legend:hover { color:#333; }
.vs-pbb-legend-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
.vs-pbb-legend-dot.normal { background:#1677ff; }
.vs-pbb-legend-dot.event { background:#fa8c16; }
.vs-pbb-filter { font-size:11px; color:#888; cursor:pointer; display:flex; align-items:center; gap:2px; }
.vs-pbb-filter:hover { color:#333; }

.vs-pbb-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:1px solid #d9d9d9; color:#666; font-size:14px; cursor:pointer; transition:all .15s; background:#fff; }
.vs-pbb-btn:hover { color:#1677ff; border-color:#1677ff; background:#f0f5ff; }
.vs-pbb-btn.active { color:#1677ff; border-color:#1677ff; background:#e6f4ff; }
.vs-pbb-speed { font-size:11px; font-weight:600; }

/* 时间范围下拉菜单 */
.vs-pbr-dropdown { display:inline-flex; align-items:center; gap:2px; font-size:12px; color:#666; cursor:pointer; user-select:none; }
.vs-pbr-dropdown:hover { color:#1677ff; }
.vs-pbr-dropdown-wrap { position:relative; }
.vs-pbr-menu { position:absolute; bottom:100%; right:0; margin-bottom:4px; background:#fff; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.12); padding:4px; min-width:60px; z-index:50; }
.vs-pbr-menu-item { padding:6px 14px; border-radius:4px; cursor:pointer; font-size:13px; color:#333; transition:all .15s; text-align:center; }
.vs-pbr-menu-item:hover { background:#f0f5ff; color:#1677ff; }
.vs-pbr-menu-item.active { background:#e6f4ff; color:#1677ff; font-weight:600; }

/* 播放策略弹窗 */
.vs-playback-strategy { display:flex; flex-direction:column; gap:0; }
.vs-ps-row { display:flex; align-items:center; padding:14px 0; border-bottom:1px solid #f0f0f0; }
.vs-ps-row:last-of-type { border-bottom:none; }
.vs-ps-label { font-size:13px; color:#333; flex-shrink:0; width:130px; }
.vs-ps-slider-wrap { flex:1; display:flex; align-items:center; gap:12px; }
.vs-ps-slider { flex:1; }
.vs-ps-slider-val { font-size:13px; font-weight:600; color:#1677ff; min-width:28px; text-align:right; }
.vs-ps-footer { display:flex; justify-content:flex-end; gap:8px; padding-top:14px; border-top:1px solid #f0f0f0; margin-top:4px; }

/* 下载菜单 */
.vs-pbb-download-wrap { position:relative; }
.vs-download-menu { position:absolute; bottom:100%; right:0; margin-bottom:4px; background:#fff; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.12); padding:4px; min-width:140px; z-index:50; }
.vs-dm-item { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:13px; color:#333; transition:all .15s; }
.vs-dm-item:hover { background:#f0f5ff; color:#1677ff; }

/* 下载弹窗通用 */
.vs-download-dialog { display:flex; flex-direction:column; gap:0; }
.vs-dd-row { display:flex; align-items:center; padding:14px 0; border-bottom:1px solid #f0f0f0; }
.vs-dd-label { font-size:13px; color:#333; flex-shrink:0; width:60px; }
.vs-dd-path { font-size:13px; color:#1677ff; }
.vs-dd-footer { display:flex; justify-content:flex-end; gap:8px; padding-top:14px; }

/* 事件下载网格 */
.vs-ed-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding-bottom:14px; max-height:300px; overflow-y:auto; }
.vs-ed-card { border:1px solid #e8e8e8; border-radius:6px; padding:6px; cursor:pointer; transition:all .15s; }
.vs-ed-card:hover { border-color:#91caff; }
.vs-ed-card.selected { border-color:#1677ff; background:#e6f4ff; }
.vs-ed-thumb { position:relative; height:56px; border-radius:4px; overflow:hidden; margin-bottom:6px; }
.vs-ed-thumb-bg { width:100%; height:100%; background:#1a1a2e; display:flex; align-items:center; justify-content:center; font-size:22px; }
.vs-ed-check { position:absolute; top:2px; right:2px; width:16px; height:16px; background:#1677ff; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; }
.vs-ed-time { font-size:11px; color:#333; margin-bottom:2px; }
.vs-ed-meta { font-size:10px; color:#999; }

/* 下载详情 */
.vs-dtask-card { border:1px solid #f0f0f0; border-radius:8px; padding:12px; margin-bottom:10px; }
.vs-dtask-name { font-size:13px; color:#333; margin-bottom:8px; word-break:break-all; }
.vs-dtask-progress-bar { height:6px; background:#f0f0f0; border-radius:3px; overflow:hidden; margin-bottom:8px; }
.vs-dtask-progress-fill { height:100%; background:linear-gradient(90deg,#1677ff,#69b1ff); border-radius:3px; transition:width .3s; }
.vs-dtask-row { display:flex; justify-content:space-between; font-size:11px; color:#999; margin-bottom:8px; }
.vs-dtask-actions { display:flex; justify-content:flex-end; }

/* ========== 点位地图 ========== */
.vs-map-page { flex:1; position:relative; overflow:hidden; }
.vs-map-container { width:100%; height:100%; position:relative; }
.vs-mock-map-bg { width:100%; height:100%; position:relative; overflow:hidden; background:#e8f0e8; }
.vs-mock-map-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(0,0,0,0.05)1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.05)1px,transparent 1px); background-size:40px 40px; }
.vs-mock-map-roads { position:absolute; inset:0; }
.vs-mock-road { position:absolute; background:#fff; box-shadow:0 0 2px rgba(0,0,0,0.1); }
.vs-mock-map-labels { position:absolute; inset:0; pointer-events:none; }
.vs-mock-map-labels span { position:absolute; font-size:12px; color:#999; font-weight:500; }

/* 浮动 Tab */
.vs-map-tabs { position:absolute; top:16px; left:16px; display:flex; gap:0; background:#fff; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.1); overflow:hidden; z-index:20; }
.vs-map-tab { padding:9px 22px; font-size:13px; cursor:pointer; color:#666; background:#fff; border:none; transition:all .15s; user-select:none; }
.vs-map-tab:first-child { border-right:1px solid #f0f0f0; }
.vs-map-tab.active { background:#1677ff; color:#fff; }

/* 聚合门店标记 */
.vs-map-store-marker { position:absolute; display:flex; flex-direction:column; align-items:center; cursor:pointer; z-index:10; transform:translate(-50%,-50%); }
.vs-map-store-circle { width:40px; height:40px; border-radius:50%; background:#1890ff; color:#fff; font-size:16px; font-weight:600; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(24,144,255,0.4); transition:transform .15s; }
.vs-map-store-marker:hover .vs-map-store-circle { transform:scale(1.15); }
.vs-map-store-label { margin-top:4px; font-size:11px; color:#333; background:rgba(255,255,255,0.9); padding:2px 6px; border-radius:3px; white-space:nowrap; }

/* 设备定位标记 */
.vs-map-device-marker { position:absolute; display:flex; flex-direction:column; align-items:center; cursor:pointer; z-index:10; transform:translate(-50%,-50%); }
.vs-map-device-icon { font-size:24px; color:#1890ff; transition:transform .15s; }
.vs-map-device-icon.online { color:#1890ff; }
.vs-map-device-marker:hover .vs-map-device-icon { transform:scale(1.2); }
.vs-map-device-label { margin-top:2px; font-size:10px; color:#333; background:rgba(255,255,255,0.9); padding:2px 6px; border-radius:3px; white-space:nowrap; }

/* 地图控件 */
.vs-map-controls { position:absolute; right:12px; bottom:12px; display:flex; flex-direction:column; align-items:center; gap:8px; z-index:20; }
.vs-map-compass { width:36px; height:36px; border-radius:50%; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#333; }
.vs-map-zoom { display:flex; flex-direction:column; gap:2px; }
.vs-map-ctrl-btn { width:32px; height:32px; background:#fff; border-radius:4px; box-shadow:0 2px 6px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; color:#555; transition:background .15s; }
.vs-map-ctrl-btn:hover { background:#f5f5f5; }

/* InfoWindow */
.vs-map-infowindow { position:absolute; z-index:30; transform:translate(-50%,-130%); }
.vs-miw-arrow { width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:8px solid rgba(0,0,0,0.75); margin:0 auto; }
.vs-miw-content { background:rgba(0,0,0,0.75); border-radius:8px; padding:16px; color:#fff; font-size:12px; width:280px; }
.vs-miw-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.vs-miw-close { color:rgba(255,255,255,0.6); font-size:14px; cursor:pointer; }
.vs-miw-close:hover { color:#fff; }
.vs-miw-name { font-size:16px; font-weight:600; }
.vs-miw-row { margin-bottom:6px; color:rgba(255,255,255,0.8); }
.vs-miw-row .event { color:#ff4d4f; }
.vs-miw-btns { display:flex; gap:8px; margin-top:10px; }
.vs-miw-btn { flex:1; padding:6px 0; text-align:center; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:4px; cursor:pointer; font-size:12px; transition:all .15s; }
.vs-miw-btn:hover { background:rgba(255,255,255,0.25); }
.vs-miw-btn.primary { background:#1677ff; border-color:#1677ff; }
.vs-miw-btn.primary:hover { background:#4096ff; border-color:#4096ff; }

/* 右侧 Drawer */
.vs-store-drawer :deep(.ant-drawer-body) { padding:0; }
.vs-sd-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #f0f0f0; }
.vs-sd-title { font-size:15px; font-weight:600; color:#1a1a1a; }
.vs-sd-close { font-size:18px; color:#bbb; cursor:pointer; transition:color .15s; }
.vs-sd-close:hover { color:#333; }
.vs-sd-list { padding:20px; overflow-y:auto; max-height:calc(100vh - 60px); display:flex; flex-direction:column; gap:16px; }
.vs-sd-card { border-radius:12px; padding:0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.06); overflow:hidden; transition:box-shadow .2s; }
.vs-sd-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); }
.vs-sdc-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px 12px; }
.vs-sdc-name { font-size:15px; font-weight:600; color:#1a1a1a; }
.vs-sdc-status-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:3px 8px; border-radius:10px; }
.vs-sdc-status-badge.online { background:#f0f5ff; color:#1677ff; }
.vs-sdc-status-badge.offline { background:#f5f5f5; color:#999; }
.vs-sdc-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.vs-sdc-status-badge.online .vs-sdc-status-dot { background:#1677ff; }
.vs-sdc-status-badge.offline .vs-sdc-status-dot { background:#ccc; }
.vs-sdc-body { padding:0 20px 16px; }
.vs-sdc-row { font-size:13px; color:#555; margin-bottom:8px; display:flex; align-items:baseline; }
.vs-sdc-row-label { color:#999; width:80px; flex-shrink:0; font-size:12px; }
.vs-sdc-row-value { color:#333; word-break:break-all; }
.vs-sdc-row .event { color:#ff4d4f; font-weight:500; }
.vs-sdc-btns { display:flex; gap:0; border-top:1px solid #f5f5f5; }
.vs-sdc-btn { flex:1; padding:12px 0; text-align:center; cursor:pointer; font-size:13px; color:#666; background:#fafafa; transition:all .15s; border:none; }
.vs-sdc-btn:first-child { border-right:1px solid #f0f0f0; }
.vs-sdc-btn:hover { background:#f0f5ff; color:#1677ff; }
.vs-sdc-btn.primary { color:#1677ff; font-weight:500; }
.vs-sdc-btn.primary:hover { background:#1677ff; color:#fff; }

/* 修改坐标弹窗 */
.vs-editcoord { display:flex; flex-direction:column; gap:0; }
.vs-ec-row { display:flex; align-items:center; margin-bottom:14px; }
.vs-ec-label { font-size:13px; color:#333; width:90px; flex-shrink:0; }
.vs-ec-required { color:#ff4d4f; margin-right:2px; }
.vs-ec-input { flex:1; }
.vs-ec-input.ant-input-disabled { background:#f5f5f5; color:#333; }
.vs-ec-link { color:#1890ff; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:4px; }
.vs-ec-link:hover { text-decoration:underline; }
.vs-ec-footer { display:flex; justify-content:flex-end; gap:8px; padding-top:14px; border-top:1px solid #f0f0f0; margin-top:4px; }

/* 地图选点 */
.vs-mp-toolbar { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.vs-mp-label { font-size:13px; color:#333; }
.vs-mp-coord { font-size:13px; color:#666; }
.vs-mp-map { border:1px solid #e8e8e8; border-radius:4px; overflow:hidden; cursor:crosshair; margin-bottom:14px; }
.vs-mp-marker { position:absolute; transform:translate(-50%,-100%); pointer-events:none; }

/* 实时视频对话框 */
.vs-livevideo-modal :deep(.ant-modal-content) { background:#000; }
.vs-livevideo-modal :deep(.ant-modal-body) { padding:0; }
.vs-lv-dialog { display:flex; flex-direction:column; }
.vs-lv-header { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; }
.vs-lv-name { color:#fff; font-size:18px; margin-right:16px; }
.vs-lv-time { color:rgba(255,255,255,0.6); font-size:13px; }
.vs-lv-close { color:#fff; font-size:24px; cursor:pointer; }
.vs-lv-video { height:420px; display:flex; align-items:center; justify-content:center; position:relative; background:#111; }
.vs-lv-placeholder { font-size:80px; opacity:0.3; }
.vs-lv-ptz { position:absolute; left:30px; top:50%; transform:translateY(-50%); }
.vs-lv-ptz-ring { position:relative; width:100px; height:100px; border-radius:50%; background:rgba(255,255,255,0.15); }
.vs-lv-ptz-arrow { position:absolute; width:0; height:0; }
.vs-lv-ptz-arrow.up { top:8px; left:50%; transform:translateX(-50%); border-left:8px solid transparent; border-right:8px solid transparent; border-bottom:10px solid rgba(255,255,255,0.6); }
.vs-lv-ptz-arrow.down { bottom:8px; left:50%; transform:translateX(-50%); border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid rgba(255,255,255,0.6); }
.vs-lv-ptz-arrow.left { left:8px; top:50%; transform:translateY(-50%); border-top:8px solid transparent; border-bottom:8px solid transparent; border-right:10px solid rgba(255,255,255,0.6); }
.vs-lv-ptz-arrow.right { right:8px; top:50%; transform:translateY(-50%); border-top:8px solid transparent; border-bottom:8px solid transparent; border-left:10px solid rgba(255,255,255,0.6); }
.vs-lv-ptz-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.4); }
.vs-lv-toolbar { position:absolute; right:20px; bottom:20px; display:flex; align-items:center; gap:12px; color:rgba(255,255,255,0.7); font-size:18px; }
.vs-lv-toolbar > * { cursor:pointer; }
.vs-lv-footer { display:flex; gap:32px; padding:10px 20px; background:rgba(0,0,0,0.9); color:#fff; font-size:14px; }

/* ========== 轮巡Modal ========== */
.vs-patrol-modal { display:flex; flex-direction:column; gap:0; }
.vpm-row { display:flex; flex-wrap:wrap; align-items:flex-start; padding:14px 0; border-bottom:1px solid #f5f5f5; }
.vpm-label { font-size:13px; font-weight:500; color:#333; width:110px; flex-shrink:0; line-height:28px; }
.vpm-hint { width:100%; margin-top:4px; font-size:11px; color:#999; margin-left:0; }
.vpm-grid { display:grid; gap:3px; }
.vpm-grid-1 { grid-template-columns:32px; grid-template-rows:32px; width:36px; }
.vpm-grid-4 { grid-template-columns:32px 32px; grid-template-rows:32px 32px; width:72px; }
.vpm-grid-9 { grid-template-columns:32px 32px 32px; grid-template-rows:32px 32px 32px; width:108px; }
.vpm-grid-6 { grid-template-columns:32px 32px 32px; grid-template-rows:32px 32px 32px; width:108px; grid-template-areas:'a a b' 'a a c' 'd e f'; }
.vpm-grid-6 .vpm-cell:nth-child(1) { grid-area:a; }
.vpm-grid-8 { grid-template-columns:32px 32px 32px 32px; grid-template-rows:32px 32px 32px 32px; width:144px; grid-template-areas:'a a a b' 'a a a c' 'a a a d' 'e f g h'; }
.vpm-grid-8 .vpm-cell:nth-child(1) { grid-area:a; }
.vpm-grid-7 { grid-template-columns:32px 32px 32px 32px; grid-template-rows:32px 32px 32px 32px; width:144px; grid-template-areas:'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.vpm-grid-7 .vpm-cell:nth-child(1) { grid-area:a; }
.vpm-grid-7 .vpm-cell:nth-child(2) { grid-area:b; }
.vpm-grid-7 .vpm-cell:nth-child(3) { grid-area:c; }
.vpm-grid-7 .vpm-cell:nth-child(4) { grid-area:d; }
.vpm-grid-7 .vpm-cell:nth-child(5) { grid-area:e; }
.vpm-grid-7 .vpm-cell:nth-child(6) { grid-area:f; }
.vpm-grid-7 .vpm-cell:nth-child(7) { grid-area:g; }
.vpm-grid-12 { grid-template-columns:32px 32px 32px; grid-template-rows:32px 32px 32px 32px; width:108px; }
.vpm-grid-16 { grid-template-columns:32px 32px 32px 32px; grid-template-rows:32px 32px 32px 32px; width:144px; }
.vpm-cell { border:1px solid #d9d9d9; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.vpm-cell:hover { border-color:#1677ff; }
.vpm-cell.active { background:#e6f4ff; border-color:#1677ff; }
.vpm-check { color:#1677ff; font-size:12px; }
.vpm-footer { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; padding-top:12px; }

/* ========== 轮巡设备选择（树形+搜索） ========== */
.vpm-device-tree-wrap { display:flex; flex-direction:column; }
.vpm-device-search { margin-bottom:6px; }
.vpm-device-tree { max-height:280px; overflow-y:auto; }
.vpm-device-tree :deep(.ant-tree-node-content-wrapper) { font-size:12px; color:#333; }
.vpm-device-tree :deep(.vs-tree-device) { display:inline-flex; align-items:center; gap:6px; }
.vpm-device-tree :deep(.vs-tree-dot) { width:6px; height:6px; border-radius:50%; background:#52c41a; flex-shrink:0; }
.vpm-device-tree :deep(.vs-tree-dot.online) { background:#52c41a; }
.vpm-device-tree :deep(.vs-tree-device-name) { font-size:12px; color:#555; }
</style>
