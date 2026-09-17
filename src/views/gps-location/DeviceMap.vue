<script setup lang="ts">
import { ref, computed, h, onBeforeUnmount } from 'vue'
import { message } from 'antdv-next'
import {
  SearchOutlined, EnvironmentOutlined,
  BankOutlined, ApartmentOutlined, ShopOutlined,
  FieldTimeOutlined, WarningOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  ThunderboltOutlined, CloseOutlined, PauseCircleOutlined, PlayCircleOutlined,
  AimOutlined,
} from '@antdv-next/icons'
import type { GpsDevice } from '@/types'
import GpsMapCanvas from '@/components/GpsMapCanvas.vue'
import SignalBars from '@/components/SignalBars.vue'
import BatteryIcon from '@/components/BatteryIcon.vue'
import GpsFilterBar from '@/components/GpsFilterBar.vue'
import { useGpsStore, GPS_CAPABILITY_LABELS, GEOFENCE_TYPE_LABELS } from '@/stores/gps'

const gpsStore = useGpsStore()

// ==================== 组织树 ====================
interface TreeNode {
  key: string; title: string
  children?: TreeNode[]
  nodeLevel?: 'root' | 'site' | 'building' | 'group'
}

const rawOrgTree: TreeNode[] = [
  {
    key: 'root', title: '鹤梦养老', nodeLevel: 'root',
    children: [
      {
        key: 'nj', title: '江苏南京', nodeLevel: 'site',
        children: [
          {
            key: 'nj-xjk', title: '新街口照护中心', nodeLevel: 'site',
            children: [
              { key: 'nj-xjk-b3', title: '3号楼', nodeLevel: 'building' },
              { key: 'nj-xjk-b2', title: '2号楼', nodeLevel: 'building' },
              { key: 'nj-xjk-pub', title: '公共区域', nodeLevel: 'building' },
              { key: 'nj-xjk-team', title: '护理班组', nodeLevel: 'group' },
            ],
          },
          { key: 'nj-gl', title: '鼓楼照护站', nodeLevel: 'site' },
        ],
      },
    ],
  },
]

const nodeIconMap: Record<string, any> = {
  root: BankOutlined, site: EnvironmentOutlined, building: ApartmentOutlined, group: ShopOutlined,
}

const attachMeta = (nodes: TreeNode[]): any[] => nodes.map(n => {
  const icon = n.nodeLevel ? h(nodeIconMap[n.nodeLevel], { class: 'gl-tree-icon' }) : undefined
  return {
    ...n,
    title: h('span', { class: 'gl-tree-title-wrap' }, [icon, h('span', { class: 'gl-tree-label' }, n.title)].filter(Boolean)),
    children: n.children ? attachMeta(n.children) : undefined,
  }
})

const asideCollapsed = ref(false)
const treeSearchText = ref('')
const selectedOrgKeys = ref<string[]>(['root'])
const expandedKeys = ref<string[]>(['root', 'nj', 'nj-xjk'])

const matchOrg = (node: TreeNode, kw: string): boolean =>
  node.title.includes(kw) || (node.children ?? []).some(c => matchOrg(c, kw))

const filterTree = (nodes: TreeNode[], kw: string): TreeNode[] => {
  if (!kw) return nodes
  return nodes.filter(n => matchOrg(n, kw)).map(n => ({ ...n, children: n.children ? filterTree(n.children, kw) : undefined }))
}

const filteredTree = computed(() => attachMeta(filterTree(rawOrgTree, treeSearchText.value)))

const selectedOrgPathLabel = computed(() => {
  const key = selectedOrgKeys.value[0]
  const path: string[] = []
  const walk = (nodes: TreeNode[], trail: string[]) => {
    for (const n of nodes) {
      const next = [...trail, n.title]
      if (n.key === key) { path.push(...next); return true }
      if (n.children && walk(n.children, next)) return true
    }
    return false
  }
  walk(rawOrgTree, [])
  return path.join(' / ')
})

function orgPathTitle(key: string): string {
  let found = ''
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.key === key) { found = n.title; return }
      if (n.children) walk(n.children)
    }
  }
  walk(rawOrgTree)
  return found
}

// ==================== 筛选 ====================
const filterName = ref('')
const filterStatus = ref<string>('')
const filterBattery = ref<string>('')

/** 下拉选项（antdv-next 的 a-select 不转发默认插槽，必须用 :options） */
const statusOptions = [
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
  { value: 'sleep', label: '休眠中' },
]
const batteryOptions = [{ value: 'low', label: '低电量 <20%' }]
const activeName = ref('')
const activeStatus = ref('')
const activeBattery = ref('')

const handleSearch = () => {
  activeName.value = filterName.value
  activeStatus.value = filterStatus.value
  activeBattery.value = filterBattery.value
}
const handleReset = () => {
  filterName.value = ''; filterStatus.value = ''; filterBattery.value = ''
  activeName.value = ''; activeStatus.value = ''; activeBattery.value = ''
  selectedOrgKeys.value = ['root']
}

// ==================== 设备列表 ====================
const selectedDeviceId = ref<string | null>(null)
const trailDeviceId = ref<string | null>(null)
const trailPlaying = ref(false)
/** 播放进度（小数，段为单位），支持平滑插值 */
const trailProgress = ref(0)
const trailSpeed = ref(1)
const listCollapsed = ref(false)
let trailTimer: ReturnType<typeof setInterval> | null = null

const TRAIL_TICK_MS = 60

const filteredDevices = computed(() => {
  let list = gpsStore.devices
  const orgKey = selectedOrgKeys.value[0]
  if (orgKey && orgKey !== 'root') {
    const label = orgPathTitle(orgKey)
    if (label) list = list.filter(d => d.orgPathLabel.includes(label))
  }
  if (activeName.value) list = list.filter(d => d.name.includes(activeName.value))
  if (activeStatus.value) list = list.filter(d => d.status === activeStatus.value)
  if (activeBattery.value === 'low') list = list.filter(d => d.battery < 20)
  return list
})

const selectedDevice = computed(() =>
  gpsStore.devices.find(d => d.id === selectedDeviceId.value) || null)

const currentTrail = computed(() =>
  trailDeviceId.value ? gpsStore.trails[trailDeviceId.value] ?? [] : [])

const maxProgress = computed(() => Math.max(0, currentTrail.value.length - 1))

const trailDevice = computed(() =>
  gpsStore.devices.find(d => d.id === trailDeviceId.value) || null)

/** 当前播放到的时间点（按进度就近取标记点时间） */
const trailCurrentTime = computed(() => {
  const t = currentTrail.value
  if (!t.length) return '—'
  const idx = Math.round(trailProgress.value)
  return t[Math.min(idx, t.length - 1)]?.time ?? '—'
})

const startTrail = (device: GpsDevice) => {
  const t = gpsStore.trails[device.id]
  if (!t || t.length < 2) { message.warning('该设备今日暂无轨迹数据'); return }
  trailDeviceId.value = device.id
  selectedDeviceId.value = device.id
  trailProgress.value = 0
  trailPlaying.value = true
  scheduleTrailTick()
}

const scheduleTrailTick = () => {
  if (trailTimer) clearInterval(trailTimer)
  trailTimer = setInterval(() => {
    if (trailProgress.value >= maxProgress.value) { stopTrail(); return }
    // 每 tick 前进 0.5 段 × 倍速，形成平滑移动
    trailProgress.value = Math.min(maxProgress.value, +(trailProgress.value + 0.5 * trailSpeed.value).toFixed(3))
  }, TRAIL_TICK_MS)
}

const stopTrail = () => {
  trailPlaying.value = false
  if (trailTimer) { clearInterval(trailTimer); trailTimer = null }
}

const toggleTrail = () => {
  if (trailPlaying.value) { stopTrail(); return }
  if (trailProgress.value >= maxProgress.value) trailProgress.value = 0
  trailPlaying.value = true
  scheduleTrailTick()
}

const onProgressDrag = (v: number) => {
  stopTrail()
  trailProgress.value = v
}

const clearTrail = () => {
  stopTrail()
  trailDeviceId.value = null
  trailProgress.value = 0
}

const onDeviceClick = (d: GpsDevice) => { selectedDeviceId.value = d.id }

onBeforeUnmount(() => { if (trailTimer) clearInterval(trailTimer) })

// ==================== 统计 ====================
const stats = computed(() => ({
  total: gpsStore.devices.length,
  online: gpsStore.onlineDevices.length,
  lowBattery: gpsStore.lowBatteryDevices.length,
}))

const statusColor: Record<string, string> = { online: 'green', offline: 'red', sleep: 'orange' }
const statusLabel: Record<string, string> = { online: '在线', offline: '离线', sleep: '休眠中' }

const selectedFences = computed(() => {
  if (!selectedDevice.value) return []
  return gpsStore.geofences.filter(g => selectedDevice.value!.geofenceIds.includes(g.id))
})

/** 仅展示设备已支持的能力，避免出现「✕ 不支持」的噪音信息 */
const supportedCapabilities = computed(() => {
  if (!selectedDevice.value) return [] as string[]
  const cap = selectedDevice.value.capabilities
  return (Object.keys(GPS_CAPABILITY_LABELS) as (keyof typeof GPS_CAPABILITY_LABELS)[])
    .filter(k => cap[k])
    .map(k => GPS_CAPABILITY_LABELS[k])
})

/** 最新上报的 GPS 坐标文本 */
const latestGps = (d: GpsDevice) => `${d.lng}, ${d.lat}`

/** 围栏类型配色（与地图保持一致） */
const fenceColor = (type: 'safe' | 'danger' | 'custom') =>
  type === 'safe' ? '#52c41a' : type === 'danger' ? '#ff4d4f' : '#1677ff'
</script>

<template>
  <div class="gl-page">
    <!-- ==================== 左侧组织树 ==================== -->
    <aside class="gl-aside" :class="{ collapsed: asideCollapsed }">
      <div class="gl-aside-head">
        <span v-if="!asideCollapsed" class="gl-aside-title">组织架构</span>
        <button class="gl-icon-btn" :title="asideCollapsed ? '展开' : '收起'" @click="asideCollapsed = !asideCollapsed">
          <MenuUnfoldOutlined v-if="asideCollapsed" />
          <MenuFoldOutlined v-else />
        </button>
      </div>
      <template v-if="!asideCollapsed">
        <a-input v-model:value="treeSearchText" placeholder="搜索组织区域" class="gl-tree-search" allow-clear>
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <div class="gl-tree-wrap">
          <a-tree
            :tree-data="filteredTree"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedOrgKeys"
            :field-names="{ children: 'children', title: 'title', key: 'key' }"
            block-node
            class="gl-tree"
            @select="(ks: string[]) => selectedOrgKeys = ks.length ? ks : ['root']"
            @update:expandedKeys="(ks: string[]) => expandedKeys = ks"
          />
        </div>
      </template>
    </aside>

    <!-- ==================== 地图舞台 ==================== -->
    <main class="gl-stage">
      <GpsMapCanvas
        :devices="filteredDevices"
        :geofences="gpsStore.geofences"
        :trails="trailDeviceId ? { [trailDeviceId]: currentTrail } : {}"
        :selected-device-id="selectedDeviceId"
        :trail-device-id="trailDeviceId"
        :trail-progress="trailDeviceId ? trailProgress : null"
        :auto-follow="trailPlaying"
        :height="'100%'"
        :show-legend="false"
        class="gl-map"
        @device-click="onDeviceClick"
      />

      <!-- 顶部工具条（独立一行，不与右侧列表重叠） -->
      <div class="gl-float gl-toolbar">
        <div class="gl-stat-row">
          <div class="gl-stat">
            <span class="gl-stat-v">{{ stats.total }}</span>
            <span class="gl-stat-l">接入</span>
          </div>
          <div class="gl-stat">
            <span class="gl-stat-v c-green">{{ stats.online }}</span>
            <span class="gl-stat-l">在线</span>
          </div>
          <div class="gl-stat">
            <span class="gl-stat-v c-orange">{{ stats.lowBattery }}</span>
            <span class="gl-stat-l">低电量</span>
          </div>
          <span class="gl-stat-sep" />
          <span class="gl-scope">{{ selectedOrgPathLabel }}</span>
          <span v-if="gpsStore.lowBatteryDevices.length" class="gl-warn-chip">
            <WarningOutlined /> {{ gpsStore.lowBatteryDevices.length }} 台电量低于 20%
          </span>
        </div>

        <GpsFilterBar size="small" @search="handleSearch" @reset="handleReset">
          <a-input v-model:value="filterName" placeholder="设备名称" size="small" style="width:160px" allow-clear @pressEnter="handleSearch">
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-select v-model:value="filterStatus" placeholder="设备状态" size="small" style="width:130px" allow-clear :options="statusOptions" />
          <a-select v-model:value="filterBattery" placeholder="电量" size="small" style="width:140px" allow-clear :options="batteryOptions" />
        </GpsFilterBar>

        <!-- 图例（并入工具条，避免与浮层重叠） -->
        <div class="gl-legend-row">
          <span v-for="t in (['safe', 'danger', 'custom'] as const)" :key="t" class="gl-lg-item">
            <i class="gl-lg-dot" :style="{ background: fenceColor(t) }" />{{ GEOFENCE_TYPE_LABELS[t].label }}
          </span>
          <template v-if="trailDeviceId">
            <span class="gl-lg-sep" />
            <span class="gl-lg-item"><i class="gl-lg-line done" />已走过</span>
            <span class="gl-lg-item"><i class="gl-lg-line left" />未走过</span>
          </template>
        </div>
      </div>

      <!-- 轨迹回放条 -->
      <div v-if="trailDeviceId" class="gl-float gl-trail">
        <div class="gl-trail-left">
          <FieldTimeOutlined class="gl-trail-icon" />
          <div class="gl-trail-info">
            <span class="gl-trail-name">{{ trailDevice?.name }}</span>
            <span class="gl-trail-sub">{{ trailCurrentTime }} · 第 {{ Math.floor(trailProgress) + 1 }}/{{ currentTrail.length }} 个点</span>
          </div>
        </div>
        <button class="gl-trail-play" @click="toggleTrail">
          <PauseCircleOutlined v-if="trailPlaying" />
          <PlayCircleOutlined v-else />
        </button>
        <a-slider
          :value="trailProgress"
          :min="0"
          :max="maxProgress"
          :step="0.01"
          :tip-formatter="(v: number) => currentTrail[Math.round(v)]?.time ?? ''"
          class="gl-trail-slider"
          @change="onProgressDrag"
        />
        <a-select v-model:value="trailSpeed" size="small" style="width:88px" :options="[
          { value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 4, label: '4x' },
        ]" />
        <button class="gl-icon-btn" title="关闭轨迹" @click="clearTrail"><CloseOutlined /></button>
      </div>

      <!-- 设备列表（右侧，起始位置在工具条下方） -->
      <div class="gl-float gl-list" :class="{ collapsed: listCollapsed }">
        <div class="gl-list-head">
          <span v-if="!listCollapsed" class="gl-list-title">设备列表 <b>{{ filteredDevices.length }}</b></span>
          <button class="gl-icon-btn" :title="listCollapsed ? '展开列表' : '收起列表'" @click="listCollapsed = !listCollapsed">
            <MenuUnfoldOutlined v-if="listCollapsed" />
            <MenuFoldOutlined v-else />
          </button>
        </div>
        <div v-show="!listCollapsed" class="gl-list-body">
          <div
            v-for="d in filteredDevices"
            :key="d.id"
            class="gl-item"
            :class="{ active: selectedDeviceId === d.id }"
            @click="selectedDeviceId = d.id"
          >
            <div class="gl-item-row">
              <span class="gl-item-dot" :class="'s-' + d.status" />
              <span class="gl-item-name">{{ d.name }}</span>
              <a-tag :color="statusColor[d.status]" class="gl-mini-tag">{{ statusLabel[d.status] }}</a-tag>
            </div>
            <div class="gl-item-gps">
              <EnvironmentOutlined />
              <span class="gl-item-gps-val">{{ latestGps(d) }}</span>
              <span class="gl-item-gps-ago">{{ d.lastReportAt.slice(5, 16) }}</span>
            </div>
            <div class="gl-item-foot">
              <span class="gl-item-bat" :class="{ low: d.battery < 20 }">
                <BatteryIcon :value="d.battery" :charging="d.charging" :size="13" /> {{ d.battery }}%
              </span>
              <SignalBars :network="d.network" :level="d.signal" />
              <a v-if="(gpsStore.trails[d.id]?.length ?? 0) >= 2" class="gl-item-link" @click.stop="startTrail(d)">轨迹回放</a>
            </div>
          </div>
          <a-empty v-if="!filteredDevices.length" description="暂无设备" :image-style="{ height: '48px' }" />
        </div>
      </div>

      <!-- 选中设备详情（左下，不与列表重叠；有轨迹条时上移避免遮挡） -->
      <div v-if="selectedDevice" class="gl-float gl-detail" :class="{ 'raise': !!trailDeviceId }">
        <div class="gl-detail-head">
          <span class="gl-detail-name">{{ selectedDevice.name }}</span>
          <a-tag :color="statusColor[selectedDevice.status]" class="gl-mini-tag">{{ statusLabel[selectedDevice.status] }}</a-tag>
          <a-tag v-if="!selectedDevice.wearDetected" color="orange" class="gl-mini-tag">未佩戴</a-tag>
          <button class="gl-icon-btn gl-detail-close" @click="selectedDeviceId = null"><CloseOutlined /></button>
        </div>
        <div class="gl-detail-grid">
          <div class="gl-detail-cell">
            <span class="gl-detail-k">最新上报位置</span>
            <span class="gl-detail-v c-blue">{{ selectedDevice.lng }}, {{ selectedDevice.lat }}</span>
          </div>
          <div class="gl-detail-cell">
            <span class="gl-detail-k">上报时间</span>
            <span class="gl-detail-v">{{ selectedDevice.lastReportAt }}</span>
          </div>
          <div class="gl-detail-cell">
            <span class="gl-detail-k">电量</span>
            <span class="gl-detail-v gl-detail-bat">
              <BatteryIcon :value="selectedDevice.battery" :charging="selectedDevice.charging" :size="14" />
              <i :class="{ 'c-red': selectedDevice.battery < 20 }">{{ selectedDevice.battery }}%</i>
              <span v-if="selectedDevice.charging" class="gl-detail-charging">充电中</span>
            </span>
          </div>
          <div class="gl-detail-cell">
            <span class="gl-detail-k">网络</span>
            <span class="gl-detail-v gl-detail-net">
              <SignalBars :network="selectedDevice.network" :level="selectedDevice.signal" />
              <span class="gl-detail-carrier">{{ selectedDevice.carrier }}</span>
            </span>
          </div>
          <div class="gl-detail-cell">
            <span class="gl-detail-k">型号 / 固件</span>
            <span class="gl-detail-v">{{ selectedDevice.deviceModel }} · {{ selectedDevice.firmwareVersion }}</span>
          </div>
          <div class="gl-detail-cell">
            <span class="gl-detail-k">License</span>
            <span class="gl-detail-v">{{ selectedDevice.license }}</span>
          </div>
        </div>
        <div class="gl-detail-line">
          <span class="gl-detail-k">设备能力</span>
          <span v-if="supportedCapabilities.length" class="gl-chips">
            <a-tag v-for="label in supportedCapabilities" :key="label" color="blue" class="gl-mini-tag">{{ label }}</a-tag>
          </span>
          <span v-else class="gl-detail-empty">暂无上报能力</span>
        </div>
        <div class="gl-detail-line">
          <span class="gl-detail-k">绑定围栏</span>
          <span v-if="selectedFences.length" class="gl-chips">
            <a-tag v-for="f in selectedFences" :key="f.id" :color="f.enabled ? 'green' : 'default'" class="gl-mini-tag">{{ f.name }}</a-tag>
          </span>
          <span v-else class="gl-detail-empty">未绑定围栏</span>
        </div>
        <div class="gl-detail-actions">
          <a-button size="small" :disabled="(gpsStore.trails[selectedDevice.id]?.length ?? 0) < 2" @click="startTrail(selectedDevice)">
            <template #icon><AimOutlined /></template>轨迹回放
          </a-button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.gl-page { display:flex; height:100%; background:#eef2f7; overflow:hidden; }

/* ==================== 左侧树 ==================== */
.gl-aside { width:228px; flex-shrink:0; background:#fff; border-right:1px solid #e8eef6; display:flex; flex-direction:column; overflow:hidden; transition:width .2s; }
.gl-aside.collapsed { width:44px; }
.gl-aside-head { display:flex; align-items:center; justify-content:space-between; padding:10px 8px 10px 16px; border-bottom:1px solid #f0f4f9; }
.gl-aside.collapsed .gl-aside-head { padding:10px 0; justify-content:center; }
.gl-aside-title { font-size:13px; font-weight:600; color:#1f2937; }
.gl-icon-btn { width:26px; height:26px; border:none; background:transparent; border-radius:6px; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
.gl-icon-btn:hover { background:#eff6ff; color:#1677ff; }
.gl-tree-search { margin:10px 12px 6px; width:auto; }
.gl-tree-wrap { flex:1; overflow-y:auto; padding:0 6px 12px; }
.gl-tree :deep(.ant-tree-title) { font-size:13px; }
.gl-tree-title-wrap { display:inline-flex; align-items:center; gap:6px; }
.gl-tree-icon { color:#1677ff; font-size:13px; }

/* ==================== 地图舞台 ==================== */
.gl-stage { position:relative; flex:1; min-width:0; padding:10px; display:flex; }
.gl-map { flex:1; min-width:0; }
.gl-float { position:absolute; z-index:10; background:rgba(255,255,255,.96); backdrop-filter:blur(6px); border:1px solid #e6edf6; border-radius:12px; box-shadow:0 8px 24px rgba(15,23,42,.1); }

/* 顶部工具条：只占左侧，右侧给设备列表留出 300px */
.gl-toolbar { left:22px; top:22px; right:316px; padding:10px 14px; display:flex; flex-direction:column; gap:10px; }
.gl-stat-row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
.gl-stat { display:flex; flex-direction:column; }
.gl-stat-v { font-size:17px; font-weight:700; color:#1f2937; line-height:1.15; }
.gl-stat-l { font-size:11px; color:#94a3b8; }
.c-green { color:#16a34a !important; }
.c-orange { color:#ea8c00 !important; }
.c-blue { color:#1677ff !important; }
.c-red { color:#ff4d4f !important; font-weight:600; }
.gl-stat-sep { width:1px; height:24px; background:#e8eef6; }
.gl-scope { font-size:12px; color:#64748b; }

/* 图例行（工具条内） */
.gl-legend-row { display:flex; align-items:center; gap:14px; padding-top:9px; border-top:1px solid #f0f4f9; font-size:11.5px; color:#64748b; }
.gl-lg-item { display:inline-flex; align-items:center; gap:5px; }
.gl-lg-dot { width:10px; height:10px; border-radius:3px; }
.gl-lg-sep { width:1px; height:13px; background:#e2e8f0; }
.gl-lg-line { width:16px; height:3px; border-radius:2px; }
.gl-lg-line.done { background:#1677ff; }
.gl-lg-line.left { background:repeating-linear-gradient(90deg,#c7d2e0 0 4px,transparent 4px 7px); }
.gl-warn-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:#fff7e6; border:1px solid #ffe0a3; border-radius:20px; color:#c76a00; font-size:11.5px; }

/* 轨迹条：贴底部整条（左右留白一致），高度固定 */
.gl-trail { left:22px; right:22px; bottom:22px; padding:8px 16px; display:flex; align-items:center; gap:12px; }
.gl-trail-left { display:flex; align-items:center; gap:9px; flex-shrink:0; min-width:0; }
.gl-trail-icon { color:#1677ff; font-size:16px; flex-shrink:0; }
.gl-trail-info { display:flex; flex-direction:column; min-width:0; }
.gl-trail-name { font-size:12.5px; font-weight:600; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gl-trail-sub { font-size:11px; color:#94a3b8; white-space:nowrap; }
.gl-trail-play { width:32px; height:32px; flex-shrink:0; border:none; background:#1677ff; color:#fff; font-size:18px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; box-shadow:0 3px 10px rgba(22,119,255,.35); transition:all .18s; }
.gl-trail-play:hover { background:#0958d9; }
.gl-trail-slider { flex:1; margin:0 4px; min-width:120px; }

/* 设备列表：右侧，从工具条下方开始，避免与顶部控件重合 */
.gl-list { right:22px; top:22px; width:272px; max-height:calc(100% - 44px); display:flex; flex-direction:column; overflow:hidden; }
.gl-list.collapsed { width:auto; }
.gl-list-head { display:flex; align-items:center; justify-content:space-between; padding:9px 8px 9px 14px; border-bottom:1px solid #f0f4f9; }
.gl-list.collapsed .gl-list-head { border-bottom:none; padding:8px; }
.gl-list-title { font-size:13px; font-weight:600; color:#1f2937; }
.gl-list-title b { color:#1677ff; }
.gl-list-body { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:9px; }
/* 卡片化 + 明确间距，避免视觉上「连在一起」 */
.gl-item { padding:10px 12px; border:1px solid #eceff3; border-radius:10px; cursor:pointer; transition:all .18s; background:#fff; }
.gl-item:hover { border-color:#a8cdfd; background:#fafcff; }
.gl-item.active { border-color:#1677ff; background:#f4f9ff; box-shadow:0 2px 10px rgba(22,119,255,.1); }
.gl-item-row { display:flex; align-items:center; gap:6px; }
.gl-item-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; background:#16a34a; }
.gl-item-dot.s-offline { background:#ff4d4f; }
.gl-item-dot.s-sleep { background:#ea8c00; }
.gl-item-name { flex:1; font-size:12.5px; font-weight:600; color:#1f2937; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gl-mini-tag { font-size:10px; line-height:16px; margin:0; padding:0 5px; flex-shrink:0; }
.gl-item-gps { display:flex; align-items:center; gap:5px; margin-top:6px; font-size:11.5px; color:#1677ff; }
.gl-item-gps :deep(.anticon) { font-size:12px; flex-shrink:0; }
.gl-item-gps-val { font-weight:500; }
.gl-item-gps-ago { margin-left:auto; color:#b0bcc9; font-size:11px; flex-shrink:0; }
.gl-item-foot { display:flex; align-items:center; gap:9px; margin-top:7px; padding-top:7px; border-top:1px dashed #f0f4f9; font-size:11px; color:#64748b; }
.gl-item-bat { display:inline-flex; align-items:center; gap:2px; }
.gl-item-bat.low { color:#ff4d4f; font-weight:600; }
.gl-item-link { margin-left:auto; color:#1677ff; font-size:11px; }

/* 设备详情：左下；有轨迹条时整体上移到轨迹条之上 */
.gl-detail { left:22px; bottom:22px; width:min(450px, 40%); max-height:calc(100% - 160px); overflow-y:auto; padding:12px 14px; transition:bottom .2s; }
.gl-detail.raise { bottom:86px; max-height:calc(100% - 220px); }
.gl-detail-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.gl-detail-name { font-size:14px; font-weight:600; color:#1f2937; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gl-detail-close { margin-left:auto; }
.gl-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px 14px; }
.gl-detail-cell { display:flex; flex-direction:column; gap:2px; min-width:0; }
.gl-detail-k { font-size:11px; color:#94a3b8; }
.gl-detail-v { font-size:12px; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gl-detail-net { display:inline-flex; align-items:center; gap:6px; }
.gl-detail-bat { display:inline-flex; align-items:center; gap:5px; }
.gl-detail-charging { font-size:11px; color:#1677ff; }
.gl-detail-line { display:flex; align-items:flex-start; gap:8px; margin-top:9px; }
.gl-detail-line .gl-detail-k { flex-shrink:0; padding-top:3px; }
.gl-chips { display:flex; flex-wrap:wrap; gap:4px; }
.gl-detail-empty { font-size:11px; color:#c0c9d4; }
.gl-detail-actions { margin-top:10px; display:flex; justify-content:flex-end; }

/* 低电量提示 */
.gl-warn { left:22px; top:22px; margin-top:96px; padding:7px 13px; display:flex; align-items:center; gap:7px; background:rgba(255,247,230,.97); border-color:#ffe0a3; color:#c76a00; font-size:12px; }
</style>
