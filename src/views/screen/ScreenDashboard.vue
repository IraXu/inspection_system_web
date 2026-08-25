<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftOutlined, WarningFilled, RightOutlined, VideoCameraOutlined,
  CheckCircleFilled, ExclamationCircleFilled, SoundOutlined, BellFilled,
  PlusOutlined, CloseOutlined, SearchOutlined,
} from '@antdv-next/icons'
import { useEnterpriseStore } from '@/stores/enterprise'

const router = useRouter()

// ============================================================
// 应用场景：读取当前企业的应用场景配置，进入大屏即匹配对应场景
// ============================================================
const enterpriseStore = useEnterpriseStore()

interface FirstMetric { label: string; value: number; unit: string; extra: string }

interface ScreenScenario {
  key: string
  name: string
  subName: string
  first: FirstMetric
  overview: string
  category: string
  region: string
}

const scenarios: ScreenScenario[] = [
  { key: 'store', name: '门店', subName: '连锁门店运营', first: { label: '门店总数', value: 128, unit: '家', extra: '覆盖 12 个区域' }, overview: '门店运营概览', category: '问题类型分布', region: '区域巡检排行' },
  { key: 'factory', name: '厂区', subName: '厂区生产安全', first: { label: '产线数量', value: 46, unit: '条', extra: '覆盖 8 个车间' }, overview: '厂区安全概览', category: '隐患类型分布', region: '车间巡检排行' },
  { key: 'district', name: '园区', subName: '园区综合管理', first: { label: '园区数量', value: 32, unit: '个', extra: '覆盖 6 个城市' }, overview: '园区运营概览', category: '问题类型分布', region: '园区巡检排行' },
  { key: 'site', name: '站点', subName: '站点运营管理', first: { label: '站点数量', value: 96, unit: '个', extra: '覆盖 9 个区域' }, overview: '站点运营概览', category: '问题类型分布', region: '站点巡检排行' },
  { key: 'warehouse', name: '仓库', subName: '仓储物流管理', first: { label: '仓库数量', value: 54, unit: '个', extra: '覆盖 7 个园区' }, overview: '仓储运营概览', category: '问题类型分布', region: '仓库巡检排行' },
  { key: 'construction', name: '工地', subName: '工地安全监管', first: { label: '在建工地', value: 28, unit: '个', extra: '覆盖 5 个城市' }, overview: '工地安全概览', category: '隐患类型分布', region: '工地巡检排行' },
  { key: 'school', name: '学校', subName: '校园安全管理', first: { label: '校区数量', value: 40, unit: '个', extra: '覆盖 3 个城市' }, overview: '校园安全概览', category: '问题类型分布', region: '校区巡检排行' },
  { key: 'project', name: '项目', subName: '项目运营管理', first: { label: '项目数量', value: 67, unit: '个', extra: '覆盖 10 个区域' }, overview: '项目运营概览', category: '问题类型分布', region: '项目巡检排行' },
]

const scenarioKey = computed(() => enterpriseStore.screenScenarioKey)
const activeScenario = computed(() => scenarios.find(s => s.key === scenarioKey.value) ?? scenarios[0])

// ============================================================
// 模块配置（大屏可自定义展示哪些模块）
// ============================================================
interface ScreenModule { key: string; label: string; title: string; desc: string; enabled: boolean }

function buildModules(c: ScreenScenario): ScreenModule[] {
  return [
    { key: 'overview', label: '核心指标', title: c.overview, desc: '关键经营指标总览', enabled: true },
    { key: 'device-status', label: '设备状态', title: '设备状态分布', desc: '在线 / 休眠 / 离线', enabled: true },
    { key: 'chart-trend', label: '巡检趋势', title: '巡检完成率趋势', desc: '近7日完成率走势', enabled: true },
    { key: 'chart-category', label: '问题分布', title: c.category, desc: '各类问题占比', enabled: true },
    { key: 'video-wall', label: '视频墙', title: '实时视频墙', desc: '多分屏实时画面', enabled: true },
    { key: 'alarm-roll', label: '实时告警', title: '实时告警', desc: '最新告警滚动', enabled: true },
    { key: 'broadcast-status', label: '云广播', title: '云广播执行', desc: '广播执行状态统计', enabled: true },
    { key: 'chart-region', label: '区域排行', title: c.region, desc: '各区域执行率 TOP', enabled: true },
    { key: 'task-list', label: '任务清单', title: '巡检任务清单', desc: '待执行 / 执行中任务', enabled: true },
  ]
}

const modules = computed<ScreenModule[]>(() => buildModules(activeScenario.value))
const hasModule = (key: string) => modules.value.some(m => m.key === key && m.enabled)
const moduleTitle = (key: string) => modules.value.find(m => m.key === key)?.title ?? ''

const toggleModule = (key: string) => {
  const m = modules.value.find(x => x.key === key)
  if (m) m.enabled = !m.enabled
}

const configOpen = ref(false)

// ============================================================
// 浏览器全屏：进入大屏即自动全屏
// ============================================================
const enterFullscreen = () => {
  if (document.fullscreenElement) return
  document.documentElement.requestFullscreen().catch(() => {})
}
const exitFullscreen = () => {
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}) }
}

// ============================================================
// 顶部时钟
// ============================================================
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | null = null
const dateStr = computed(() => now.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }))
const timeStr = computed(() => now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))

// ============================================================
// 核心指标
// ============================================================
const overview = reactive({
  devices: 140, deviceOnline: 128, deviceSleep: 5, deviceOff: 7, onlineRate: 91.4,
  planTotal: 86, planDone: 62, planRate: 72.1,
  alertToday: 23,
  aiImages: 1612, aiProblems: 13, aiPassRate: 99.2,
  spotTotal: 33, spotPass: 29, spotRate: 87.9,
})

interface MetricCard { key: string; label: string; value: number; unit: string; extra: string; color: string; target?: string }

const metricCards = computed<MetricCard[]>(() => {
  const f = activeScenario.value.first
  return [
    { key: 'first', label: f.label, value: f.value, unit: f.unit, extra: f.extra, color: '#3b82f6', target: '/inspection/online' },
    { key: 'devices', label: '设备在线率', value: overview.onlineRate, unit: '%', extra: `在线 ${overview.deviceOnline}/${overview.devices} 台`, color: '#22c55e', target: '/device/management' },
    { key: 'inspection', label: '巡检完成率', value: overview.planRate, unit: '%', extra: `${overview.planDone}/${overview.planTotal} 项任务`, color: '#f59e0b', target: '/inspection/task-list' },
    { key: 'alert', label: '今日告警', value: overview.alertToday, unit: '条', extra: '实时告警', color: '#ef4444', target: '/alert-center' },
    { key: 'ai', label: 'AI 分析合格率', value: overview.aiPassRate, unit: '%', extra: `图片 ${overview.aiImages} · 问题 ${overview.aiProblems}`, color: '#8b5cf6', target: '/inspection/ai/results' },
    { key: 'spot', label: '视频点检合格率', value: overview.spotRate, unit: '%', extra: `${overview.spotPass}/${overview.spotTotal} 项检查`, color: '#06b6d4', target: '/inspection/spot-check-records' },
  ]
})

const goTarget = (url?: string) => { if (url) router.push(url) }

// ============================================================
// 设备状态分布
// ============================================================
const deviceStatus = computed(() => [
  { label: '在线', value: overview.deviceOnline, color: '#22c55e' },
  { label: '休眠', value: overview.deviceSleep, color: '#f59e0b' },
  { label: '离线', value: overview.deviceOff, color: '#ef4444' },
])

// ============================================================
// 巡检完成率趋势（近7日，柱状图）
// ============================================================
const trendData = [
  { day: '08-13', rate: 68 },
  { day: '08-14', rate: 75 },
  { day: '08-15', rate: 71 },
  { day: '08-16', rate: 84 },
  { day: '08-17', rate: 80 },
  { day: '08-18', rate: 88 },
  { day: '08-19', rate: 72 },
]
const trendAvg = computed(() => Math.round(trendData.reduce((s, d) => s + d.rate, 0) / trendData.length))

// ============================================================
// 问题类型分布
// ============================================================
const categoryData = [
  { name: '卫生问题', value: 86, color: '#3b82f6' },
  { name: '安全隐患', value: 64, color: '#f59e0b' },
  { name: '设备故障', value: 41, color: '#ef4444' },
  { name: '商品陈列', value: 32, color: '#22c55e' },
  { name: '服务质量', value: 24, color: '#8b5cf6' },
]
const maxCategory = Math.max(...categoryData.map(d => d.value))

// ============================================================
// 区域巡检排行
// ============================================================
const regionData = [
  { name: '华东一区', rate: 96, status: 'good' },
  { name: '华东二区', rate: 89, status: 'good' },
  { name: '华南大区', rate: 82, status: 'normal' },
  { name: '华北大区', rate: 74, status: 'normal' },
  { name: '西南大区', rate: 66, status: 'warn' },
  { name: '西北大区', rate: 58, status: 'warn' },
]

// ============================================================
// 实时视频墙（支持分屏 + 设备选择）
// ============================================================
interface WallCam {
  id: string
  name: string
  store: string
  status: 'online' | 'offline'
  thumb: string
  nvrName?: string   // 属于某个 NVR 的通道时，标记所属 NVR 名称
}

const camThumbs = ['#0d1f3d', '#14263d', '#0a1f33', '#102b45', '#0d2540', '#12304a', '#0b2138', '#142a44']
const camNames = ['大门出入口', '收银台全景', '仓库入口', '货架巡查', '后门通道', '停车场出入口', '大堂全景', '机房监控', '电梯口']
const camStores = ['华东一区·南京新街口店', '华东二区·上海徐汇店', '华南大区·深圳福田店', '华北大区·北京朝阳店', '西南大区·成都春熙店', '华中大区·武汉光谷店']

const wallCams = ref<WallCam[]>([
  ...camNames.map((n, i) => ({
    id: 'cam-' + String(i + 1).padStart(3, '0'),
    name: n,
    store: camStores[i % camStores.length],
    status: (i === 5 ? 'offline' : 'online') as WallCam['status'],
    thumb: camThumbs[i % camThumbs.length],
  })),
  // NVR 通道：NVR 本身作为树中的容器节点，通道才是可播放的最小单元
  { id: 'cam-nvr-001', name: '通道1-大门', store: '华东一区·南京新街口店', nvrName: 'NVR-南京新街口机房', status: 'online', thumb: camThumbs[2] },
  { id: 'cam-nvr-002', name: '通道2-收银台', store: '华东一区·南京新街口店', nvrName: 'NVR-南京新街口机房', status: 'online', thumb: camThumbs[3] },
  { id: 'cam-nvr-003', name: '通道3-库房', store: '华东一区·南京新街口店', nvrName: 'NVR-南京新街口机房', status: 'offline', thumb: camThumbs[4] },
  { id: 'cam-nvr-004', name: '通道1-东门', store: '华南大区·深圳福田店', nvrName: 'NVR-深圳福田机房', status: 'online', thumb: camThumbs[5] },
  { id: 'cam-nvr-005', name: '通道2-停车场', store: '华南大区·深圳福田店', nvrName: 'NVR-深圳福田机房', status: 'online', thumb: camThumbs[6] },
])
const onlineCams = computed(() => wallCams.value.filter(c => c.status === 'online'))
const getCamById = (id: string | null) => wallCams.value.find(c => c.id === id) ?? null

// 分屏（复用视频广场分屏模式）
type SplitMode = 1 | 4 | 6 | 7 | 8 | 9 | 12 | 16
interface SplitOption { value: SplitMode; label: string; pv: string }
const splitMode = ref<SplitMode>(4)
const splitOptions: SplitOption[] = [
  { value: 1, label: '1×1', pv: 'pv-1' },
  { value: 4, label: '2×2', pv: 'pv-4' },
  { value: 9, label: '3×3', pv: 'pv-9' },
  { value: 6, label: '1+5', pv: 'pv-6' },
  { value: 8, label: '1+7', pv: 'pv-8' },
  { value: 7, label: '3+4', pv: 'pv-7' },
  { value: 12, label: '3×4', pv: 'pv-12' },
  { value: 16, label: '4×4', pv: 'pv-16' },
]
const currentSplit = computed(() => splitOptions.find(o => o.value === splitMode.value)!)
const previewCellCount = (opt: SplitOption) => Math.min(opt.value, 16)
const visibleCount = computed(() => {
  const m = splitMode.value
  if (m === 6) return 6
  if (m === 8) return 8
  if (m === 7) return 7
  return m
})
const splitMenuOpen = ref(false)

interface WallCell { deviceId: string | null }
const cells = ref<WallCell[]>(Array.from({ length: 16 }, () => ({ deviceId: null })))
const visibleCells = computed(() => cells.value.slice(0, visibleCount.value))
const selectedCellIdx = ref<number | null>(null)

const wallCellTime = ref('')
let wallTimer: ReturnType<typeof setInterval> | null = null

const changeSplit = (v: SplitMode) => {
  splitMode.value = v
  for (let i = 0; i < 16; i++) cells.value[i] = { deviceId: null }
  selectedCellIdx.value = null
  stopPatrol()
  patrolPositions.value = new Array(visibleCount.value).fill(false)
  if (patrolPositions.value.length > 0) patrolPositions.value[0] = true
  autoFill()
}

const autoFill = () => {
  const online = onlineCams.value
  for (let i = 0; i < Math.min(visibleCount.value, online.length); i++) {
    cells.value[i] = { deviceId: online[i].id }
  }
}

const clickCell = (idx: number) => {
  selectedCellIdx.value = idx
  // 空格子：引导通过视频轮巡添加设备
  if (!cells.value[idx].deviceId) {
    patrolModalOpen.value = true
  }
}

const removeCell = (idx: number) => {
  cells.value[idx].deviceId = null
  // 若该格为轮巡位置，取消其轮巡资格
  if (patrolPositions.value[idx]) {
    patrolPositions.value[idx] = false
  }
  // 轮巡运行中且已无有效轮巡位置时，自动停止轮巡
  if (patrolRunning.value && activePatrolPositions.value.length === 0) {
    stopPatrol()
  }
  if (selectedCellIdx.value === idx) selectedCellIdx.value = null
}

// 视频轮巡（复用视频广场轮巡逻辑：位置 + 设备 + 时长）
const patrolModalOpen = ref(false)
const patrolEnabled = ref(true)
const patrolDuration = ref(15)
const patrolRunning = ref(false)
const patrolOffset = ref(0)
let patrolTimer: ReturnType<typeof setInterval> | null = null
const patrolPositions = ref<boolean[]>([true, false, false, false])
const patrolCheckedDeviceIds = ref<string[]>([])

const activePatrolPositions = computed(() =>
  patrolPositions.value.map((on, i) => (on ? i : -1)).filter(i => i >= 0)
)

const togglePatrolPosition = (idx: number) => {
  const v = [...patrolPositions.value]
  v[idx] = !v[idx]
  patrolPositions.value = v
}

// 轮巡设备选择树（复用视频广场组织树勾选交互）
interface PatrolTreeNode {
  key: string
  title: string
  children?: PatrolTreeNode[]
  isDevice?: boolean
  deviceId?: string
  isNvr?: boolean
}

const patrolTreeSearch = ref('')

const patrolDeviceTree = computed<PatrolTreeNode[]>(() => {
  const regions = new Map<string, PatrolTreeNode>()
  const getRegion = (region: string): PatrolTreeNode => {
    if (!regions.has(region)) {
      regions.set(region, { key: 'region-' + region, title: region, children: [] })
    }
    return regions.get(region)!
  }
  // NVR 节点缓存：region::nvrName -> 节点
  const nvrMap = new Map<string, PatrolTreeNode>()

  onlineCams.value.forEach((cam) => {
    const region = cam.store.split('·')[0] || '其他'
    const regionNode = getRegion(region)
    if (cam.nvrName) {
      const nvrKey = region + '::' + cam.nvrName
      if (!nvrMap.has(nvrKey)) {
        const node: PatrolTreeNode = { key: 'nvr-' + nvrKey, title: cam.nvrName, isNvr: true, children: [] }
        nvrMap.set(nvrKey, node)
        regionNode.children!.push(node)
      }
      nvrMap.get(nvrKey)!.children!.push({
        key: cam.id,
        title: cam.name,
        isDevice: true,
        deviceId: cam.id,
      })
    } else {
      regionNode.children!.push({
        key: cam.id,
        title: cam.name,
        isDevice: true,
        deviceId: cam.id,
      })
    }
  })
  return Array.from(regions.values())
})

const filteredPatrolTree = computed<PatrolTreeNode[]>(() => {
  const kw = patrolTreeSearch.value.trim()
  if (!kw) return patrolDeviceTree.value
  const filter = (nodes: PatrolTreeNode[]): PatrolTreeNode[] => {
    const result: PatrolTreeNode[] = []
    for (const n of nodes) {
      if (n.isDevice) {
        if (n.title.includes(kw)) result.push(n)
      } else if (n.children) {
        const filtered = filter(n.children)
        if (n.title.includes(kw) || filtered.length > 0) {
          result.push({ ...n, children: n.title.includes(kw) ? n.children : filtered })
        }
      }
    }
    return result
  }
  return filter(patrolDeviceTree.value)
})

const collectDeviceIds = (node: PatrolTreeNode): string[] => {
  if (node.isDevice && node.deviceId) return [node.deviceId]
  if (node.children) return node.children.flatMap(collectDeviceIds)
  return []
}
const getNodeDeviceIds = (key: string): string[] => {
  const find = (nodes: PatrolTreeNode[]): PatrolTreeNode | null => {
    for (const n of nodes) {
      if (n.key === key) return n
      if (n.children) { const r = find(n.children); if (r) return r }
    }
    return null
  }
  const node = find(patrolDeviceTree.value)
  return node ? collectDeviceIds(node) : []
}

const onPatrolTreeCheck = (checkedKeys: any) => {
  const keys = Array.isArray(checkedKeys) ? checkedKeys : (checkedKeys?.checked || [])
  const allChecked = new Set<string>()
  for (const key of keys) {
    getNodeDeviceIds(key).forEach(id => allChecked.add(id))
  }
  patrolCheckedDeviceIds.value = Array.from(allChecked)
}

const patrolTreeCheckedKeys = computed(() => {
  const deviceKeys = new Set(patrolCheckedDeviceIds.value)
  const result: string[] = []
  const walk = (nodes: PatrolTreeNode[]) => {
    for (const n of nodes) {
      if (n.isDevice && n.deviceId && deviceKeys.has(n.deviceId)) result.push(n.key)
      if (n.children) walk(n.children)
    }
  }
  walk(patrolDeviceTree.value)
  return result
})

const confirmPatrol = () => {
  if (!patrolEnabled.value) { stopPatrol(); patrolModalOpen.value = false; return }
  if (activePatrolPositions.value.length === 0) return
  if (patrolCheckedDeviceIds.value.length === 0) return
  startPatrol()
  patrolModalOpen.value = false
}

const startPatrol = () => {
  stopPatrol()
  patrolRunning.value = true
  patrolOffset.value = 0
  applyPatrolFrame()
  patrolTimer = setInterval(() => {
    patrolOffset.value++
    applyPatrolFrame()
  }, patrolDuration.value * 1000)
}

const stopPatrol = () => {
  patrolRunning.value = false
  if (patrolTimer) { clearInterval(patrolTimer); patrolTimer = null }
}

const applyPatrolFrame = () => {
  const positions = activePatrolPositions.value
  const ids = patrolCheckedDeviceIds.value
  if (positions.length === 0 || ids.length === 0) { stopPatrol(); return }
  for (let i = 0; i < positions.length; i++) {
    const cellIdx = positions[i]
    const deviceId = ids[(patrolOffset.value + i) % ids.length]
    cells.value[cellIdx] = { deviceId }
  }
}

const isPatrolCell = (idx: number) => patrolRunning.value && patrolPositions.value[idx] === true

// ============================================================
// 实时告警
// ============================================================
interface AlarmItem {
  id: string
  type: string
  device: string
  location: string
  time: string
  thumb: string
  isNew: boolean
}

const alarmTypes = ['移动侦测', '区域入侵', '画面模糊', '设备离线', '温度过高', '声音异常', '镜头遮挡', '视频丢失']
const alarmLocations = [
  '华东一区·南京新街口店', '华东二区·上海徐汇店', '华南大区·深圳福田店',
  '华北大区·北京朝阳店', '西南大区·成都春熙店', '华中大区·武汉光谷店',
]
const alarms = ref<AlarmItem[]>([])
let alarmTimer: ReturnType<typeof setInterval> | null = null

const buildAlarm = (isNew = false): AlarmItem => ({
  id: 'alarm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
  device: '摄像头-CAM-' + String(Math.floor(Math.random() * 900) + 100),
  location: alarmLocations[Math.floor(Math.random() * alarmLocations.length)],
  thumb: camThumbs[Math.floor(Math.random() * camThumbs.length)],
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  isNew,
})

const seedAlarms = (count: number) => {
  const n = new Date()
  const list: AlarmItem[] = []
  for (let i = 0; i < count; i++) {
    const a = buildAlarm()
    a.time = new Date(n.getTime() - (count - i) * 90 * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    list.push(a)
  }
  alarms.value = list
}

const simulateAlarm = () => {
  const a = buildAlarm(true)
  alarms.value = [a, ...alarms.value.slice(0, 5)]
  setTimeout(() => {
    const idx = alarms.value.findIndex(x => x.id === a.id)
    if (idx !== -1) alarms.value[idx] = { ...alarms.value[idx], isNew: false }
  }, 3000)
}

// ============================================================
// 云广播执行状态
// ============================================================
const broadcast = reactive({
  total: 33, success: 27, fail: 4,
  types: [
    { label: '实时广播', value: 3, color: '#3b82f6' },
    { label: '定时广播', value: 1, color: '#22c55e' },
    { label: '事件广播', value: 2, color: '#f59e0b' },
  ],
})
const broadcastMax = Math.max(...broadcast.types.map(t => t.value))

// ============================================================
// 待办统计
// ============================================================
const todoStats = reactive({ pending: 356, rectify: 24, review: 24 })

// ============================================================
// 巡检任务清单
// ============================================================
type TaskStatus = 'pending' | 'executing' | 'done'
interface TaskItem {
  id: string
  name: string
  store: string
  method: 'online' | 'video' | 'ai'
  status: TaskStatus
  time: string
  isNew?: boolean
}

const tasks = ref<TaskItem[]>([])
let taskTimer: ReturnType<typeof setInterval> | null = null

const taskNames = ['门店日常巡检', '收银区专项点检', '消防设施巡检', '仓库安全巡检', '陈列规范巡检', '设备运行巡检']
const taskStores = ['南京新街口店', '上海徐汇店', '深圳福田店', '北京朝阳店', '成都春熙店', '武汉光谷店']
const taskMethods: TaskItem['method'][] = ['online', 'video', 'ai']
const taskStatuses: TaskStatus[] = ['pending', 'executing', 'done']
const taskStatusLabel: Record<TaskStatus, string> = { pending: '待执行', executing: '执行中', done: '已完成' }

const buildTask = (isNew = false): TaskItem => ({
  id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
  name: taskNames[Math.floor(Math.random() * taskNames.length)],
  store: taskStores[Math.floor(Math.random() * taskStores.length)],
  method: taskMethods[Math.floor(Math.random() * taskMethods.length)],
  status: taskStatuses[Math.floor(Math.random() * 2)],
  time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  isNew,
})
const methodLabel: Record<TaskItem['method'], string> = { online: '在线巡检', video: '视频点检', ai: 'AI巡检' }

const seedTasks = (count: number) => {
  const n = new Date()
  const list: TaskItem[] = []
  for (let i = 0; i < count; i++) {
    const t = buildTask()
    t.time = new Date(n.getTime() - (count - i) * 3 * 60 * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    list.unshift(t)
  }
  tasks.value = list
}
const simulateTask = () => { tasks.value = [buildTask(true), ...tasks.value.slice(0, 7)] }

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  enterFullscreen()
  autoFill()
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
  seedAlarms(6)
  seedTasks(8)
  wallTimer = setInterval(() => { wallCellTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false }) }, 1000)
  alarmTimer = setInterval(simulateAlarm, 8000)
  taskTimer = setInterval(simulateTask, 5000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (wallTimer) clearInterval(wallTimer)
  if (alarmTimer) clearInterval(alarmTimer)
  if (taskTimer) clearInterval(taskTimer)
  stopPatrol()
  exitFullscreen()
})

const exitScreen = () => {
  exitFullscreen()
  router.push('/workbench')
}
</script>

<template>
  <div class="ds-screen">
    <!-- 顶部标题栏 -->
    <header class="ds-header">
      <div class="ds-header-left">
        <span class="ds-date">{{ dateStr }}</span>
        <span class="ds-divider">|</span>
        <span class="ds-time">{{ timeStr }}</span>
      </div>
      <div class="ds-header-center">
        <h1 class="ds-title">智能数据大屏</h1>
      </div>
      <div class="ds-header-right">
        <div class="ds-scenario-badge">
          <span class="ds-scenario-dot"></span>
          <span>{{ activeScenario.name }}</span>
        </div>
        <a-tooltip v-if="false" title="按场景自定义大屏展示模块">
          <span class="ds-header-btn" @click="configOpen = true">模块配置</span>
        </a-tooltip>
        <a-tooltip title="退出大屏并返回工作台">
          <span class="ds-header-btn ds-header-btn-exit" @click="exitScreen"><ArrowLeftOutlined /> 退出大屏</span>
        </a-tooltip>
      </div>
    </header>

    <!-- 核心指标横条 -->
    <section v-if="hasModule('overview')" class="ds-overview">
      <div v-for="m in metricCards" :key="m.key" class="ds-metric" :class="{ clickable: !!m.target }" @click="goTarget(m.target)">
        <span class="ds-metric-dot" :style="{ background: m.color }"></span>
        <div class="ds-metric-info">
          <span class="ds-metric-label">{{ m.label }}</span>
          <span class="ds-metric-extra">{{ m.extra }}</span>
        </div>
        <div class="ds-metric-value" :style="{ color: m.color }">
          <span class="ds-metric-num">{{ m.unit === '%' ? m.value.toFixed(1) : m.value }}</span>
          <span class="ds-metric-unit">{{ m.unit }}</span>
        </div>
      </div>
    </section>

    <!-- 主体：左 / 中 / 右 -->
    <div class="ds-body">
      <!-- 左侧栏 -->
      <div class="ds-left">
        <section v-if="hasModule('device-status')" class="ds-panel ds-device-status">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('device-status') }}</span>
          </header>
          <div class="ds-panel-body ds-device">
            <div class="ds-device-ring" :style="{ background: 'conic-gradient(#22c55e 0% ' + overview.onlineRate + '%, rgba(148,163,184,0.25) ' + overview.onlineRate + '% 100%)' }">
              <div class="ds-device-ring-inner">
                <span class="ds-device-ring-num">{{ overview.onlineRate }}%</span>
                <span class="ds-device-ring-label">在线率</span>
              </div>
            </div>
            <div class="ds-device-list">
              <div v-for="s in deviceStatus" :key="s.label" class="ds-device-item">
                <span class="ds-device-dot" :style="{ background: s.color }"></span>
                <span class="ds-device-name">{{ s.label }}</span>
                <span class="ds-device-num" :style="{ color: s.color }">{{ s.value }}</span>
              </div>
              <div class="ds-device-total">共 {{ overview.devices }} 台设备</div>
            </div>
          </div>
        </section>

        <section v-if="hasModule('chart-trend')" class="ds-panel ds-flex">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('chart-trend') }}</span>
          </header>
          <div class="ds-panel-body ds-trend">
            <div class="ds-trend-bars">
              <div v-for="d in trendData" :key="d.day" class="ds-bar-col">
                <span class="ds-bar-val">{{ d.rate }}%</span>
                <div class="ds-bar-area">
                  <div class="ds-bar" :style="{ height: d.rate + '%' }"></div>
                </div>
                <span class="ds-bar-day">{{ d.day.slice(5) }}</span>
              </div>
            </div>
            <div class="ds-trend-foot">
              <span class="ds-legend"><i class="ds-dot" style="background:#38bdf8"></i>巡检完成率</span>
              <span class="ds-trend-rate">近7日平均 <b>{{ trendAvg }}%</b></span>
            </div>
          </div>
        </section>

        <section v-if="hasModule('chart-category')" class="ds-panel ds-flex">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('chart-category') }}</span>
          </header>
          <div class="ds-panel-body ds-cat">
            <div v-for="c in categoryData" :key="c.name" class="ds-cat-row">
              <span class="ds-cat-name">{{ c.name }}</span>
              <div class="ds-cat-track"><div class="ds-cat-fill" :style="{ width: (c.value / maxCategory * 100) + '%', background: c.color }"></div></div>
              <span class="ds-cat-value">{{ c.value }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 中间栏：实时视频墙 -->
      <section v-if="hasModule('video-wall')" class="ds-panel ds-center">
        <header class="ds-panel-head">
          <span class="ds-panel-title">{{ moduleTitle('video-wall') }}<span class="ds-live-dot"></span></span>
          <div class="ds-video-toolbar">
            <a-popover v-model:open="splitMenuOpen" trigger="click" placement="bottomRight" overlay-class-name="ds-split-popover">
              <span class="ds-split-trigger">
                <span class="ds-split-pv" :class="currentSplit.pv">
                  <span v-for="i in previewCellCount(currentSplit)" :key="i" class="ds-split-pv-cell"></span>
                </span>
                <span class="ds-split-trigger-label">{{ currentSplit.label }}</span>
              </span>
              <template #content>
                <div class="ds-split-menu">
                  <div v-for="opt in splitOptions" :key="opt.value" class="ds-split-card" :class="{ active: splitMode === opt.value }" @click="changeSplit(opt.value); splitMenuOpen = false">
                    <div class="ds-split-pv" :class="opt.pv">
                      <span v-for="i in previewCellCount(opt)" :key="i" class="ds-split-pv-cell"></span>
                    </div>
                    <span class="ds-split-card-label">{{ opt.label }}</span>
                  </div>
                </div>
              </template>
            </a-popover>
            <span class="ds-video-add" :class="{ on: patrolRunning }" @click="patrolModalOpen = true"><PlusOutlined /> 添加设备</span>
          </div>
        </header>
        <div class="ds-panel-body ds-video-body">
          <div class="ds-video-grid" :class="'split-' + splitMode">
            <div v-for="(cell, idx) in visibleCells" :key="idx" class="ds-video-cell" :class="{ selected: selectedCellIdx === idx, patrol: isPatrolCell(idx) }" @click="clickCell(idx)">
              <span v-if="isPatrolCell(idx)" class="ds-patrol-badge"><SoundOutlined /> 轮巡中</span>
              <template v-if="cell.deviceId">
                <div class="ds-mock-video" :style="{ background: 'linear-gradient(135deg, ' + (getCamById(cell.deviceId)?.thumb || '#0d1f3d') + ', #060d1f 75%)' }">
                  <div class="ds-mock-scan"></div>
                  <span class="ds-mock-ico">📹</span>
                  <div class="ds-video-osd">
                    <span>{{ getCamById(cell.deviceId)?.name }}</span>
                    <span class="ds-video-osd-time">{{ wallCellTime }}</span>
                  </div>
                  <span class="ds-cell-close" @click.stop="removeCell(idx)"><CloseOutlined /></span>
                </div>
              </template>
              <template v-else>
                <div class="ds-cell-empty"><PlusOutlined /><span>添加设备</span></div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧栏 -->
      <div class="ds-right">
        <section v-if="hasModule('alarm-roll')" class="ds-panel ds-flex">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('alarm-roll') }}<span class="ds-live-dot ds-live-dot-red"></span></span>
            <span class="ds-panel-more" @click="router.push('/alert-center')">更多 <RightOutlined /></span>
          </header>
          <div class="ds-panel-body ds-alarms">
            <div v-for="a in alarms" :key="a.id" class="ds-alarm" :class="{ flash: a.isNew }">
              <div class="ds-alarm-thumb" :style="{ background: 'linear-gradient(135deg, ' + a.thumb + ', #060d1f 75%)' }">
                <div class="ds-alarm-thumb-scan"></div>
                <VideoCameraOutlined class="ds-alarm-thumb-cam" />
                <span class="ds-alarm-thumb-alert"><WarningFilled /></span>
              </div>
              <div class="ds-alarm-body">
                <div class="ds-alarm-line1">
                  <span class="ds-alarm-type">{{ a.type }}</span>
                  <span class="ds-alarm-time">{{ a.time }}</span>
                </div>
                <div class="ds-alarm-line2">{{ a.device }}</div>
                <div class="ds-alarm-line3"><BellFilled /> {{ a.location }}</div>
              </div>
            </div>
            <a-empty v-if="alarms.length === 0" description="暂无告警" style="color:#7aa2f7" />
          </div>
        </section>

        <section v-if="hasModule('broadcast-status')" class="ds-panel ds-broadcast-panel">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('broadcast-status') }}</span>
            <span class="ds-panel-more" @click="router.push('/cloud-broadcast/records')">更多 <RightOutlined /></span>
          </header>
          <div class="ds-panel-body ds-broadcast">
            <div class="ds-broadcast-nums">
              <div class="ds-broadcast-num"><span class="ds-broadcast-num-v" style="color:#22c55e">{{ broadcast.success }}</span><span class="ds-broadcast-num-l">成功</span></div>
              <div class="ds-broadcast-num"><span class="ds-broadcast-num-v" style="color:#ef4444">{{ broadcast.fail }}</span><span class="ds-broadcast-num-l">失败</span></div>
              <div class="ds-broadcast-num"><span class="ds-broadcast-num-v">{{ broadcast.total }}</span><span class="ds-broadcast-num-l">目标设备</span></div>
            </div>
            <div class="ds-broadcast-types">
              <div v-for="t in broadcast.types" :key="t.label" class="ds-broadcast-type">
                <span class="ds-broadcast-type-name">{{ t.label }}</span>
                <div class="ds-broadcast-type-track"><div class="ds-broadcast-type-fill" :style="{ width: (t.value / broadcastMax * 100) + '%', background: t.color }"></div></div>
                <span class="ds-broadcast-type-val">{{ t.value }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="hasModule('chart-region')" class="ds-panel ds-flex">
          <header class="ds-panel-head">
            <span class="ds-panel-title">{{ moduleTitle('chart-region') }}</span>
          </header>
          <div class="ds-panel-body ds-region">
            <div v-for="(r, i) in regionData" :key="r.name" class="ds-region-row">
              <span class="ds-region-rank">{{ i + 1 }}</span>
              <span class="ds-region-name">{{ r.name }}</span>
              <div class="ds-region-track"><div class="ds-region-fill" :class="r.status" :style="{ width: r.rate + '%' }"></div></div>
              <span class="ds-region-rate" :class="r.status">{{ r.rate }}%</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 底部：巡检任务清单 + 待办统计 -->
    <section v-if="hasModule('task-list')" class="ds-panel ds-bottom">
      <header class="ds-panel-head">
        <span class="ds-panel-title">{{ moduleTitle('task-list') }}</span>
        <div class="ds-task-summary">
          <span class="ds-task-summary-item"><i class="ds-dot" style="background:#3b82f6"></i>待执行 <b>{{ todoStats.pending }}</b></span>
          <span class="ds-task-summary-item"><i class="ds-dot" style="background:#f59e0b"></i>待整改 <b>{{ todoStats.rectify }}</b></span>
          <span class="ds-task-summary-item"><i class="ds-dot" style="background:#8b5cf6"></i>待审核 <b>{{ todoStats.review }}</b></span>
          <span class="ds-task-summary-sep"></span>
          <span class="ds-task-summary-item"><i class="ds-dot" style="background:#22c55e"></i>执行中 <b>{{ tasks.filter(t => t.status === 'executing').length }}</b></span>
          <span class="ds-panel-more" @click="router.push('/inspection/task-list')">更多 <RightOutlined /></span>
        </div>
      </header>
      <div class="ds-panel-body ds-tasks">
        <div v-for="t in tasks" :key="t.id" class="ds-task" :class="{ flash: t.isNew }">
          <span class="ds-task-status" :class="t.status">
            <ExclamationCircleFilled v-if="t.status === 'pending'" />
            <SoundOutlined v-else-if="t.status === 'executing'" />
            <CheckCircleFilled v-else />
            {{ taskStatusLabel[t.status] }}
          </span>
          <span class="ds-task-name">{{ t.name }}</span>
          <span class="ds-task-method" :class="t.method">{{ methodLabel[t.method] }}</span>
          <span class="ds-task-store">{{ t.store }}</span>
          <span class="ds-task-time">{{ t.time }}</span>
        </div>
        <a-empty v-if="tasks.length === 0" description="暂无巡检任务" style="color:#7aa2f7" />
      </div>
    </section>

    <!-- 添加设备（复用视频广场轮巡逻辑） -->
    <div v-if="patrolModalOpen" class="ds-picker-mask" @click.self="patrolModalOpen = false">
      <div class="ds-picker ds-patrol-modal">
        <header class="ds-picker-head">
          <span>添加设备</span>
          <CloseOutlined class="ds-picker-close" @click="patrolModalOpen = false" />
        </header>
        <div class="ds-patrol-body">
          <div class="ds-patrol-row">
            <span class="ds-patrol-label">轮巡开关</span>
            <a-switch v-model:checked="patrolEnabled" size="small" />
          </div>
          <div class="ds-patrol-row">
            <span class="ds-patrol-label">切换时间</span>
            <a-input-number v-model:value="patrolDuration" :min="5" :max="300" :step="5" size="small" style="width:90px" />
            <span class="ds-patrol-unit">秒</span>
          </div>
          <div class="ds-patrol-row">
            <span class="ds-patrol-label">轮巡位置</span>
            <div class="ds-patrol-grid" :class="'pg-' + splitMode">
              <div v-for="(on, i) in patrolPositions" :key="i" class="ds-patrol-cell" :class="{ on }" @click="togglePatrolPosition(i)">
                <CheckCircleFilled v-if="on" />
              </div>
            </div>
          </div>
          <div class="ds-patrol-row ds-patrol-row-device">
            <span class="ds-patrol-label">轮巡设备</span>
            <div class="ds-patrol-tree-wrap">
              <a-input v-model:value="patrolTreeSearch" placeholder="搜索区域/设备..." size="small" allow-clear class="ds-patrol-tree-search">
                <template #prefix><SearchOutlined /></template>
              </a-input>
              <a-tree
                v-if="filteredPatrolTree.length > 0"
                :tree-data="filteredPatrolTree"
                checkable
                :checked-keys="patrolTreeCheckedKeys"
                default-expand-all
                @check="onPatrolTreeCheck"
                class="ds-patrol-tree"
              />
              <a-empty v-else description="未找到匹配的设备" :image-style="{ height: '30px' }" />
            </div>
          </div>
        </div>
        <div class="ds-patrol-footer">
          <span class="ds-patrol-count">已选 {{ patrolCheckedDeviceIds.length }} 台设备</span>
          <a-button size="small" @click="patrolModalOpen = false">取消</a-button>
          <a-button size="small" type="primary" @click="confirmPatrol">启动轮巡</a-button>
        </div>
      </div>
    </div>

    <!-- 模块配置抽屉 -->
    <a-drawer :open="configOpen" title="大屏模块配置" placement="right" size="default" @close="configOpen = false">
      <div class="ds-config">
        <p class="ds-config-desc">按企业应用场景勾选需要展示的模块，保存后大屏即时生效。</p>
        <div v-for="m in modules" :key="m.key" class="ds-config-item">
          <div class="ds-config-info">
            <span class="ds-config-name">{{ m.title }}</span>
            <span class="ds-config-desc2">{{ m.desc }}</span>
          </div>
          <a-switch :checked="m.enabled" @change="() => toggleModule(m.key)" size="small" />
        </div>
        <a-alert type="info" message="布局将随启用的模块自适应调整" banner class="ds-config-alert" />
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.ds-screen {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% -20%, rgba(37, 99, 235, 0.28) 0%, rgba(5, 11, 26, 0) 55%),
    radial-gradient(ellipse at 100% 100%, rgba(30, 64, 175, 0.2) 0%, transparent 50%),
    linear-gradient(180deg, #0a1428 0%, #050b1a 100%);
  display: flex;
  flex-direction: column;
  padding: 14px 18px 18px;
  box-sizing: border-box;
  overflow: hidden;
  color: #d6e4ff;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 顶部标题栏 ===== */
.ds-header {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 0 8px;
  margin-bottom: 12px;
}
.ds-header::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent);
}
.ds-header-left { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #8fb4e8; }
.ds-header-center { position: absolute; left: 50%; transform: translateX(-50%); }
.ds-header-right { display: flex; align-items: center; gap: 12px; }
.ds-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 6px;
  background: linear-gradient(180deg, #f0f6ff, #7ab2ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
}
.ds-divider { color: #2d4a86; }
.ds-time { font-size: 20px; font-weight: 600; color: #dfe9ff; font-variant-numeric: tabular-nums; }

.ds-scenario-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #dbe7ff;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(37, 99, 235, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.32);
  backdrop-filter: blur(6px);
}
.ds-scenario-dot { width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee; animation: ds-blink 1.6s infinite; }

.ds-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #8fb4e8;
  cursor: pointer;
  padding: 6px 14px;
  border: 1px solid rgba(64, 128, 255, 0.28);
  border-radius: 8px;
  transition: all .2s;
  background: rgba(23, 42, 90, 0.3);
}
.ds-header-btn:hover { color: #fff; border-color: #3b82f6; background: rgba(37, 99, 235, 0.3); box-shadow: 0 0 12px rgba(59, 130, 246, 0.25); }
.ds-header-btn-exit { color: #fca5a5; border-color: rgba(239, 68, 68, 0.35); }
.ds-header-btn-exit:hover { color: #fff; border-color: #ef4444; background: rgba(239, 68, 68, 0.3); box-shadow: 0 0 12px rgba(239, 68, 68, 0.25); }

/* ===== 核心指标横条 ===== */
.ds-overview { flex: none; display: flex; gap: 12px; margin-bottom: 12px; }
.ds-metric {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(160deg, rgba(23, 42, 90, 0.5), rgba(13, 26, 56, 0.5));
  border: 1px solid rgba(64, 128, 255, 0.16);
  border-radius: 10px;
  backdrop-filter: blur(6px);
  cursor: default;
  transition: all .2s;
}
.ds-metric.clickable { cursor: pointer; }
.ds-metric.clickable:hover { border-color: rgba(96, 165, 250, 0.5); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35); }
.ds-metric-dot { width: 5px; height: 40px; border-radius: 3px; flex: none; box-shadow: 0 0 8px currentColor; }
.ds-metric-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.ds-metric-label { font-size: 13px; color: #8fb4e8; white-space: nowrap; }
.ds-metric-extra { font-size: 11px; color: #5f86d0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-metric-value { display: flex; align-items: baseline; gap: 4px; flex: none; }
.ds-metric-num { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; text-shadow: 0 0 16px currentColor; }
.ds-metric-unit { font-size: 12px; color: #7aa2f7; }

/* ===== 主体布局 ===== */
.ds-body { flex: 1; min-height: 0; display: flex; gap: 12px; }
.ds-left { width: 24%; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.ds-right { width: 24%; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.ds-center { flex: 1; min-width: 0; }

/* ===== 底部任务清单 ===== */
.ds-bottom { flex: none; height: 128px; margin-top: 12px; }

/* ===== 面板通用 ===== */
.ds-panel {
  background: linear-gradient(160deg, rgba(18, 34, 70, 0.5), rgba(10, 20, 44, 0.5));
  border: 1px solid rgba(64, 128, 255, 0.16);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  backdrop-filter: blur(6px);
  transition: border-color .2s;
}
.ds-panel:hover { border-color: rgba(96, 165, 250, 0.4); }
.ds-flex { flex: 1; }
.ds-panel-head {
  height: 38px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.16), rgba(37, 99, 235, 0.02));
  border-bottom: 1px solid rgba(64, 128, 255, 0.18);
}
.ds-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #dbe7ff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ds-panel-title::before {
  content: '';
  width: 4px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #22d3ee);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}
.ds-panel-more { font-size: 12px; color: #5f86d0; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
.ds-panel-more:hover { color: #7ab2ff; }
.ds-panel-body { flex: 1; min-height: 0; padding: 10px 12px; display: flex; flex-direction: column; }

/* ===== 设备状态 ===== */
.ds-device-status { flex: none; height: 164px; }
.ds-device { flex-direction: row; align-items: center; gap: 16px; }
.ds-device-ring {
  width: 96px; height: 96px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center; position: relative;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.2) inset;
}
.ds-device-ring-inner {
  width: 70px; height: 70px; border-radius: 50%;
  background: #0b1830;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.ds-device-ring-num { font-size: 20px; font-weight: 700; color: #4ade80; line-height: 1; }
.ds-device-ring-label { font-size: 11px; color: #7aa2f7; margin-top: 3px; }
.ds-device-list { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.ds-device-item { display: flex; align-items: center; gap: 8px; }
.ds-device-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.ds-device-name { font-size: 13px; color: #9dbdf5; }
.ds-device-num { font-size: 15px; font-weight: 700; margin-left: auto; }
.ds-device-total { font-size: 11px; color: #5f86d0; border-top: 1px solid rgba(64, 128, 255, 0.15); padding-top: 6px; }

/* ===== 巡检趋势（柱状图） ===== */
.ds-trend { gap: 0; }
.ds-trend-bars { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: 6px; padding-top: 4px; }
.ds-bar-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ds-bar-val { text-align: center; font-size: 11px; color: #9dbdf5; margin-bottom: 4px; flex: none; font-variant-numeric: tabular-nums; }
.ds-bar-area {
  flex: 1; min-height: 0; position: relative;
  display: flex; align-items: flex-end; justify-content: center;
  background-image: linear-gradient(to top, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
  background-size: 100% 25%;
}
.ds-bar {
  width: 62%; max-width: 34px;
  background: linear-gradient(180deg, #22d3ee, #2563eb);
  border-radius: 4px 4px 0 0;
  position: relative; min-height: 2px;
  transition: height .5s;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}
.ds-bar-day { text-align: center; font-size: 11px; color: #5f86d0; padding-top: 6px; flex: none; }
.ds-trend-foot {
  flex: none; display: flex; justify-content: space-between; align-items: center;
  padding-top: 8px; margin-top: 6px; border-top: 1px solid rgba(64, 128, 255, 0.15);
  font-size: 12px; color: #7aa2f7;
}
.ds-trend-rate b { color: #22d3ee; font-size: 14px; }
.ds-legend { display: inline-flex; align-items: center; gap: 6px; }
.ds-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* ===== 问题分布 ===== */
.ds-cat { gap: 10px; justify-content: center; }
.ds-cat-row { display: flex; align-items: center; gap: 10px; }
.ds-cat-name { width: 60px; font-size: 13px; color: #9dbdf5; flex: none; }
.ds-cat-track { flex: 1; height: 12px; background: rgba(23, 42, 90, 0.6); border-radius: 6px; overflow: hidden; }
.ds-cat-fill { height: 100%; border-radius: 6px; transition: width .6s; box-shadow: 0 0 8px currentColor; }
.ds-cat-value { width: 30px; text-align: right; font-size: 13px; font-weight: 600; color: #dbe7ff; flex: none; }

/* ===== 区域排行 ===== */
.ds-region { gap: 8px; justify-content: center; }
.ds-region-row { display: flex; align-items: center; gap: 8px; }
.ds-region-rank { width: 18px; height: 18px; border-radius: 4px; background: rgba(37, 99, 235, 0.3); color: #7ab2ff; font-size: 11px; display: flex; align-items: center; justify-content: center; flex: none; }
.ds-region-name { width: 72px; font-size: 13px; color: #9dbdf5; flex: none; }
.ds-region-track { flex: 1; height: 10px; background: rgba(23, 42, 90, 0.6); border-radius: 5px; overflow: hidden; }
.ds-region-fill { height: 100%; border-radius: 5px; transition: width .6s; }
.ds-region-fill.good { background: linear-gradient(90deg, #22c55e, #4ade80); }
.ds-region-fill.normal { background: linear-gradient(90deg, #2563eb, #38bdf8); }
.ds-region-fill.warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.ds-region-rate { width: 44px; text-align: right; font-size: 13px; font-weight: 600; flex: none; }
.ds-region-rate.good { color: #4ade80; }
.ds-region-rate.normal { color: #38bdf8; }
.ds-region-rate.warn { color: #fbbf24; }

/* ===== 实时视频墙 ===== */
.ds-video-toolbar { display: flex; align-items: center; gap: 10px; }
.ds-video-add {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: #7ab2ff; cursor: pointer; padding: 3px 10px;
  border: 1px dashed rgba(96, 165, 250, 0.4); border-radius: 6px; transition: all .2s;
}
.ds-video-add:hover { color: #fff; border-color: #38bdf8; background: rgba(37, 99, 235, 0.2); }
.ds-video-add.on { color: #22d3ee; border-color: #22d3ee; background: rgba(34, 211, 238, 0.15); }

.ds-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; animation: ds-blink 1.2s infinite; }
.ds-live-dot-red { background: #ef4444; }
@keyframes ds-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }

.ds-video-body { flex-direction: column; gap: 8px; padding: 8px; }
.ds-video-grid { flex: 1; min-height: 0; display: grid; gap: 8px; }
.ds-video-grid.split-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.ds-video-grid.split-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.ds-video-grid.split-9 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
.ds-video-grid.split-12 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: repeat(4, 1fr); }
.ds-video-grid.split-16 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); }
.ds-video-grid.split-6 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; grid-template-areas: 'a a b' 'a a c' 'd e f'; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(1)) { grid-area: a; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(2)) { grid-area: b; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(3)) { grid-area: c; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(4)) { grid-area: d; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(5)) { grid-area: e; }
.ds-video-grid.split-6 :deep(.ds-video-cell:nth-child(6)) { grid-area: f; }
.ds-video-grid.split-8 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); grid-template-areas: 'a a a b' 'a a a c' 'a a a d' 'e f g h'; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(1)) { grid-area: a; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(2)) { grid-area: b; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(3)) { grid-area: c; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(4)) { grid-area: d; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(5)) { grid-area: e; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(6)) { grid-area: f; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(7)) { grid-area: g; }
.ds-video-grid.split-8 :deep(.ds-video-cell:nth-child(8)) { grid-area: h; }
.ds-video-grid.split-7 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); grid-template-areas: 'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(1)) { grid-area: a; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(2)) { grid-area: b; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(3)) { grid-area: c; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(4)) { grid-area: d; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(5)) { grid-area: e; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(6)) { grid-area: f; }
.ds-video-grid.split-7 :deep(.ds-video-cell:nth-child(7)) { grid-area: g; }
.ds-patrol-badge {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; color: #22d3ee; padding: 1px 6px; border-radius: 4px;
  background: rgba(34, 211, 238, 0.18); border: 1px solid rgba(34, 211, 238, 0.4);
}
.ds-video-cell {
  border-radius: 6px; overflow: hidden; cursor: pointer; position: relative;
  background: #0a1428; border: 1px solid rgba(64, 128, 255, 0.15); transition: all .2s;
}
.ds-video-cell:hover { border-color: #38bdf8; }
.ds-video-cell.selected { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
.ds-video-cell.patrol { border-color: #22d3ee; box-shadow: 0 0 12px rgba(34, 211, 238, 0.5); }
.ds-mock-video { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.ds-mock-scan { position: absolute; left: 0; right: 0; height: 50px; background: linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.08), transparent); animation: ds-scan 3s linear infinite; }
@keyframes ds-scan { 0% { top: -50px; } 100% { top: 100%; } }
.ds-mock-ico { font-size: 30px; opacity: .5; }
.ds-video-osd { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; align-items: center; padding: 3px 8px; font-size: 11px; color: rgba(214, 228, 255, 0.85); background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.55)); }
.ds-video-osd-time { font-variant-numeric: tabular-nums; }
.ds-cell-close { position: absolute; top: 6px; right: 6px; width: 20px; height: 20px; border-radius: 4px; background: rgba(0, 0, 0, 0.5); color: #fca5a5; display: flex; align-items: center; justify-content: center; font-size: 11px; opacity: 0; transition: opacity .2s; }
.ds-video-cell:hover .ds-cell-close { opacity: 1; }
.ds-cell-empty {
  width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; color: #5f86d0; font-size: 12px; background: rgba(10, 20, 44, 0.4);
}
.ds-cell-empty .anticon { font-size: 22px; }

/* ===== 弹窗通用 ===== */
.ds-picker-mask {
  position: fixed; inset: 0; z-index: 1002;
  background: rgba(3, 8, 20, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.ds-picker {
  width: 460px; max-height: 70vh;
  background: linear-gradient(160deg, #12223f, #0a1830);
  border: 1px solid rgba(96, 165, 250, 0.4); border-radius: 12px;
  overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.ds-picker-head {
  height: 48px; flex: none; display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; font-size: 15px; font-weight: 600; color: #dbe7ff;
  border-bottom: 1px solid rgba(64, 128, 255, 0.2);
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.16), transparent);
}
.ds-picker-close { cursor: pointer; color: #8fb4e8; font-size: 14px; }
.ds-picker-close:hover { color: #fff; }

/* ===== 视频轮巡设置弹窗 ===== */
.ds-patrol-modal { width: 500px; }
.ds-patrol-body { padding: 8px 16px; display: flex; flex-direction: column; }
.ds-patrol-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(64, 128, 255, 0.12); }
.ds-patrol-label { width: 72px; flex: none; font-size: 13px; color: #8fb4e8; }
.ds-patrol-unit { font-size: 12px; color: #7aa2f7; }
.ds-patrol-grid { display: grid; gap: 4px; }
.ds-patrol-grid.pg-1 { grid-template-columns: repeat(1, 28px); grid-template-rows: 28px; }
.ds-patrol-grid.pg-4 { grid-template-columns: repeat(2, 28px); grid-template-rows: repeat(2, 28px); }
.ds-patrol-grid.pg-9 { grid-template-columns: repeat(3, 28px); grid-template-rows: repeat(3, 28px); }
.ds-patrol-grid.pg-12 { grid-template-columns: repeat(3, 28px); grid-template-rows: repeat(4, 28px); }
.ds-patrol-grid.pg-16 { grid-template-columns: repeat(4, 28px); grid-template-rows: repeat(4, 28px); }
.ds-patrol-grid.pg-6 { grid-template-columns: repeat(3, 28px); grid-template-rows: repeat(3, 28px); grid-template-areas: 'a a b' 'a a c' 'd e f'; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(1) { grid-area: a; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(2) { grid-area: b; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(3) { grid-area: c; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(4) { grid-area: d; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(5) { grid-area: e; }
.ds-patrol-grid.pg-6 .ds-patrol-cell:nth-child(6) { grid-area: f; }
.ds-patrol-grid.pg-8 { grid-template-columns: repeat(4, 28px); grid-template-rows: repeat(4, 28px); grid-template-areas: 'a a a b' 'a a a c' 'a a a d' 'e f g h'; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(1) { grid-area: a; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(2) { grid-area: b; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(3) { grid-area: c; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(4) { grid-area: d; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(5) { grid-area: e; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(6) { grid-area: f; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(7) { grid-area: g; }
.ds-patrol-grid.pg-8 .ds-patrol-cell:nth-child(8) { grid-area: h; }
.ds-patrol-grid.pg-7 { grid-template-columns: repeat(4, 28px); grid-template-rows: repeat(4, 28px); grid-template-areas: 'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(1) { grid-area: a; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(2) { grid-area: b; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(3) { grid-area: c; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(4) { grid-area: d; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(5) { grid-area: e; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(6) { grid-area: f; }
.ds-patrol-grid.pg-7 .ds-patrol-cell:nth-child(7) { grid-area: g; }
.ds-patrol-cell {
  border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 12px; color: #7ab2ff;
  transition: all .15s; background: rgba(23, 42, 90, 0.35);
}
.ds-patrol-cell:hover { border-color: #3b82f6; }
.ds-patrol-cell.on { background: rgba(37, 99, 235, 0.35); border-color: #3b82f6; color: #7ab2ff; }
.ds-patrol-row-device { align-items: flex-start; }
.ds-patrol-tree-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ds-patrol-tree-search { margin-bottom: 6px; }
.ds-patrol-tree { max-height: 220px; overflow-y: auto; background: transparent; }
.ds-patrol-tree :deep(.ant-tree-node-content-wrapper) { color: #dbe7ff; }
.ds-patrol-tree :deep(.ant-tree-node-content-wrapper:hover) { background: rgba(37, 99, 235, 0.15); }
.ds-patrol-tree :deep(.ant-tree-title) { color: #dbe7ff; }
.ds-patrol-tree :deep(.ant-tree-checkbox-inner) { background: rgba(23, 42, 90, 0.5); border-color: rgba(96, 165, 250, 0.4); }
.ds-patrol-tree :deep(.ant-tree-checkbox-checked .ant-tree-checkbox-inner) { background: #2563eb; border-color: #2563eb; }
.ds-patrol-tree :deep(.ant-tree-switcher) { color: #7aa2f7; }
.ds-patrol-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 16px; border-top: 1px solid rgba(64, 128, 255, 0.2);
}
.ds-patrol-count { margin-right: auto; font-size: 12px; color: #7aa2f7; }

/* ===== 实时告警 ===== */
.ds-alarms { gap: 8px; overflow: hidden; }
.ds-alarm { display: flex; align-items: flex-start; gap: 10px; padding: 7px 9px; border-radius: 6px; background: rgba(23, 42, 90, 0.35); border: 1px solid rgba(64, 128, 255, 0.1); flex: none; }
.ds-alarm.flash { animation: ds-flash 1.2s ease-out; border-color: rgba(239, 68, 68, 0.5); }
@keyframes ds-flash {
  0% { background: rgba(239, 68, 68, 0.35); transform: translateX(4px); }
  100% { background: rgba(23, 42, 90, 0.35); transform: translateX(0); }
}
.ds-alarm-thumb {
  width: 60px; height: 44px; flex: none; border-radius: 5px; overflow: hidden;
  position: relative; display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);
}
.ds-alarm-thumb-scan {
  position: absolute; left: 0; right: 0; height: 18px;
  background: linear-gradient(180deg, transparent, rgba(239, 68, 68, 0.12), transparent);
  animation: ds-alarm-scan 2.5s linear infinite;
}
@keyframes ds-alarm-scan { 0% { top: -18px; } 100% { top: 100%; } }
.ds-alarm-thumb-cam { font-size: 16px; color: rgba(214, 228, 255, 0.55); }
.ds-alarm-thumb-alert {
  position: absolute; top: 3px; right: 3px; width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff;
  background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.7);
  animation: ds-alarm-blink 1.2s infinite;
}
@keyframes ds-alarm-blink { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
.ds-alarm-body { flex: 1; min-width: 0; }
.ds-alarm-line1 { display: flex; align-items: center; gap: 8px; }
.ds-alarm-type { font-size: 13px; font-weight: 600; color: #fca5a5; }
.ds-alarm-time { font-size: 11px; color: #5f86d0; margin-left: auto; flex: none; }
.ds-alarm-line2 { font-size: 12px; color: #dbe7ff; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-alarm-line3 { font-size: 11px; color: #7aa2f7; margin-top: 2px; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 云广播执行 ===== */
.ds-broadcast-panel { flex: none; height: 164px; }
.ds-broadcast { gap: 10px; }
.ds-broadcast-nums { display: flex; gap: 10px; flex: none; }
.ds-broadcast-num {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px; background: rgba(23, 42, 90, 0.35); border-radius: 6px;
}
.ds-broadcast-num-v { font-size: 22px; font-weight: 700; }
.ds-broadcast-num-l { font-size: 11px; color: #7aa2f7; }
.ds-broadcast-types { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.ds-broadcast-type { display: flex; align-items: center; gap: 8px; }
.ds-broadcast-type-name { width: 64px; font-size: 12px; color: #9dbdf5; flex: none; }
.ds-broadcast-type-track { flex: 1; height: 8px; background: rgba(23, 42, 90, 0.6); border-radius: 4px; overflow: hidden; }
.ds-broadcast-type-fill { height: 100%; border-radius: 4px; transition: width .6s; }
.ds-broadcast-type-val { width: 20px; text-align: right; font-size: 13px; font-weight: 600; color: #dbe7ff; flex: none; }

/* ===== 巡检任务清单 ===== */
.ds-task-summary { display: flex; align-items: center; gap: 14px; }
.ds-task-summary-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #7aa2f7; }
.ds-task-summary-item b { font-size: 14px; color: #dbe7ff; }
.ds-task-summary-sep { width: 1px; height: 16px; background: rgba(64, 128, 255, 0.2); }
.ds-tasks { flex-direction: row; flex-wrap: wrap; gap: 8px; overflow: hidden; }
.ds-task { flex: 1 1 calc(25% - 8px); min-width: 0; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; background: rgba(23, 42, 90, 0.35); font-size: 12px; }
.ds-task.flash { animation: ds-flash 1.2s ease-out; }
.ds-task-status { flex: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 1px 8px; border-radius: 3px; }
.ds-task-status.pending { color: #60a5fa; background: rgba(59, 130, 246, 0.15); }
.ds-task-status.executing { color: #fbbf24; background: rgba(245, 158, 11, 0.15); }
.ds-task-status.done { color: #4ade80; background: rgba(34, 197, 94, 0.15); }
.ds-task-name { color: #dbe7ff; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-task-method { flex: none; font-size: 11px; padding: 0 6px; border-radius: 3px; border: 1px solid rgba(96, 165, 250, 0.3); color: #9dbdf5; }
.ds-task-method.ai { color: #c084fc; border-color: rgba(192, 132, 252, 0.35); }
.ds-task-method.video { color: #22d3ee; border-color: rgba(34, 211, 238, 0.35); }
.ds-task-store { color: #7aa2f7; margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-task-time { color: #5f86d0; font-variant-numeric: tabular-nums; flex: none; }

/* ===== 模块配置 ===== */
.ds-config-desc { font-size: 13px; color: #999; margin-bottom: 12px; }
.ds-config-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.ds-config-info { display: flex; flex-direction: column; gap: 2px; }
.ds-config-name { font-size: 14px; font-weight: 500; color: #333; }
.ds-config-desc2 { font-size: 12px; color: #999; }
.ds-config-alert { margin-top: 12px; }
</style>

<style>
/* ===== 分屏切换 Popover（深色，teleport 到 body，非 scoped） ===== */
.ds-split-trigger {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: #8fb4e8; cursor: pointer; padding: 3px 10px;
  border: 1px solid rgba(64, 128, 255, 0.25); border-radius: 6px;
  background: rgba(23, 42, 90, 0.5); transition: all .2s;
}
.ds-split-trigger:hover { color: #fff; border-color: #3b82f6; }
.ds-split-trigger-label { font-size: 12px; }
.ds-split-pv { display: inline-grid; gap: 1px; }
.ds-split-trigger .ds-split-pv { width: 16px; height: 16px; }
.ds-split-menu .ds-split-pv { width: 48px; height: 48px; gap: 2px; }
.ds-split-pv-cell { background: #8fb4e8; border-radius: 1px; min-width: 0; min-height: 0; }
.ds-split-menu .ds-split-pv-cell { background: #3a4f7a; border-radius: 2px; }
.ds-split-card.active .ds-split-pv-cell { background: #38bdf8; }

.ds-split-popover .ant-popover-inner {
  background: #12223f !important;
  border: 1px solid rgba(96, 165, 250, 0.4) !important;
  border-radius: 8px !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
}
.ds-split-popover .ant-popover-arrow { display: none; }
.ds-split-menu { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 6px; min-width: 244px; }
.ds-split-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 6px; cursor: pointer; transition: background .15s; }
.ds-split-card:hover { background: rgba(37, 99, 235, 0.15); }
.ds-split-card.active { background: rgba(37, 99, 235, 0.3); }
.ds-split-card-label { font-size: 11px; color: #8fb4e8; }
.ds-split-card.active .ds-split-card-label { color: #7ab2ff; font-weight: 500; }

/* 分屏预览布局 */
.ds-split-pv.pv-1 { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.ds-split-pv.pv-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.ds-split-pv.pv-9 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
.ds-split-pv.pv-12 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: repeat(4, 1fr); }
.ds-split-pv.pv-16 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); }
.ds-split-pv.pv-6 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; grid-template-areas: 'a a b' 'a a c' 'd e f'; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(1) { grid-area: a; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(2) { grid-area: b; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(3) { grid-area: c; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(4) { grid-area: d; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(5) { grid-area: e; }
.ds-split-pv.pv-6 .ds-split-pv-cell:nth-child(6) { grid-area: f; }
.ds-split-pv.pv-8 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); grid-template-areas: 'a a a b' 'a a a c' 'a a a d' 'e f g h'; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(1) { grid-area: a; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(2) { grid-area: b; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(3) { grid-area: c; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(4) { grid-area: d; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(5) { grid-area: e; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(6) { grid-area: f; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(7) { grid-area: g; }
.ds-split-pv.pv-8 .ds-split-pv-cell:nth-child(8) { grid-area: h; }
.ds-split-pv.pv-7 { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); grid-template-areas: 'a a c c' 'a a c c' 'b b d e' 'b b f g'; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(1) { grid-area: a; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(2) { grid-area: b; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(3) { grid-area: c; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(4) { grid-area: d; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(5) { grid-area: e; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(6) { grid-area: f; }
.ds-split-pv.pv-7 .ds-split-pv-cell:nth-child(7) { grid-area: g; }
</style>
