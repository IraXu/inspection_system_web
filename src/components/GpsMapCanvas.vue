<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { GeoPoint, GpsDevice, Geofence, GpsTrailPoint } from '@/types'
import {
  GEOFENCE_TYPE_LABELS, GPS_MAP_VB,
  gpsToXY, xyToGps, smoothPath, roundedPolygonPath, pointAtRatio, isSelfIntersecting,
} from '@/stores/gps'
import {
  EnvironmentFilled, ZoomInOutlined, ZoomOutOutlined, AimOutlined,
  EditOutlined, DragOutlined, EnvironmentOutlined,
} from '@antdv-next/icons'
import SignalBars from '@/components/SignalBars.vue'
import BatteryIcon from '@/components/BatteryIcon.vue'

const VB_W = GPS_MAP_VB.w
const VB_H = GPS_MAP_VB.h

const props = withDefaults(defineProps<{
  devices?: GpsDevice[]
  geofences?: Geofence[]
  trails?: Record<string, GpsTrailPoint[]>
  /** view=浏览（可平移缩放） / draw=绘制围栏 */
  mode?: 'view' | 'draw'
  selectedDeviceId?: string | null
  /** 轨迹所属设备 */
  trailDeviceId?: string | null
  /** 轨迹播放进度（小数，段为单位；null 表示展示完整轨迹） */
  trailProgress?: number | null
  /** 播放时自动跟随视野 */
  autoFollow?: boolean
  showLabels?: boolean
  /** 展示地图地标名称 */
  showPoi?: boolean
  /** 展示内置图例（外部已提供图例时可关闭） */
  showLegend?: boolean
  height?: number | string
  draftPoints?: GeoPoint[]
}>(), {
  devices: () => [],
  geofences: () => [],
  trails: () => ({}),
  mode: 'view',
  selectedDeviceId: null,
  trailDeviceId: null,
  trailProgress: null,
  autoFollow: false,
  showLabels: true,
  showPoi: true,
  showLegend: true,
  height: 420,
  draftPoints: () => [],
})

const emit = defineEmits<{
  (e: 'deviceClick', device: GpsDevice): void
  (e: 'update:draftPoints', points: GeoPoint[]): void
}>()

const rootEl = ref<HTMLDivElement | null>(null)
const containerSize = ref({ w: 1000, h: 620 })

// ==========================================
// 视口：缩放 + 平移
// ==========================================
const MIN_ZOOM = 1
const MAX_ZOOM = 16

const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })

const transform = computed(() => `translate(${pan.value.x} ${pan.value.y}) scale(${zoom.value})`)

const clampPan = () => {
  const z = zoom.value
  pan.value.x = Math.min(0, Math.max(VB_W * (1 - z), pan.value.x))
  pan.value.y = Math.min(0, Math.max(VB_H * (1 - z), pan.value.y))
}

const contentToPercent = (c: { x: number; y: number }) => ({
  left: `${((c.x * zoom.value + pan.value.x) / VB_W) * 100}%`,
  top: `${((c.y * zoom.value + pan.value.y) / VB_H) * 100}%`,
})

const eventToContent = (e: MouseEvent) => {
  const rect = rootEl.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 }
  const vx = ((e.clientX - rect.left) / rect.width) * VB_W
  const vy = ((e.clientY - rect.top) / rect.height) * VB_H
  return { x: (vx - pan.value.x) / zoom.value, y: (vy - pan.value.y) / zoom.value }
}

const applyZoom = (next: number, anchorClient?: { x: number; y: number }) => {
  const rect = rootEl.value?.getBoundingClientRect()
  if (!rect) return
  const z1 = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
  if (z1 === zoom.value) return
  const z0 = zoom.value
  const ax = anchorClient ? anchorClient.x - rect.left : rect.width / 2
  const ay = anchorClient ? anchorClient.y - rect.top : rect.height / 2
  const vx = (ax / rect.width) * VB_W
  const vy = (ay / rect.height) * VB_H
  const cx = (vx - pan.value.x) / z0
  const cy = (vy - pan.value.y) / z0
  pan.value = { x: vx - cx * z1, y: vy - cy * z1 }
  zoom.value = z1
  clampPan()
}

const zoomBy = (factor: number) => applyZoom(zoom.value * factor)
const resetView = () => { zoom.value = 1; pan.value = { x: 0, y: 0 } }

/** 将某个经纬度居中显示（用于轨迹跟随） */
const centerOn = (p: GeoPoint, minZoom = 3) => {
  const z = Math.max(zoom.value, minZoom)
  const c = gpsToXY(p)
  zoom.value = z
  pan.value = { x: VB_W / 2 - c.x * z, y: VB_H / 2 - c.y * z }
  clampPan()
}

// ==========================================
// 交互状态
// ==========================================
const activeTool = ref<'pen' | 'pan'>('pen')
const isPanning = ref(false)
const panStart = ref({ clientX: 0, clientY: 0, panX: 0, panY: 0 })
const dragVertexIndex = ref<number | null>(null)
const cursor = ref<{ x: number; y: number } | null>(null)
const hoverVertexIndex = ref<number | null>(null)

const HIT_RADIUS_PX = 14
const hitRadius = computed(() => HIT_RADIUS_PX / zoom.value)

const draftXY = computed(() => props.draftPoints.map(p => gpsToXY(p)))

const hitVertex = (c: { x: number; y: number }) =>
  draftXY.value.findIndex(p => Math.hypot(p.x - c.x, p.y - c.y) <= hitRadius.value)

const cursorStyle = computed(() => {
  if (isPanning.value) return 'grabbing'
  if (props.mode === 'view' || activeTool.value === 'pan') return 'grab'
  if (dragVertexIndex.value !== null) return 'grabbing'
  if (hoverVertexIndex.value !== null) return 'move'
  return 'crosshair'
})

const canPan = computed(() => props.mode === 'view' || activeTool.value === 'pan')

const onMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    isPanning.value = true
    panStart.value = { clientX: e.clientX, clientY: e.clientY, panX: pan.value.x, panY: pan.value.y }
    return
  }
  if (e.button !== 0) return
  if (canPan.value) {
    isPanning.value = true
    panStart.value = { clientX: e.clientX, clientY: e.clientY, panX: pan.value.x, panY: pan.value.y }
    return
  }
  const c = eventToContent(e)
  const idx = hitVertex(c)
  if (idx >= 0) { dragVertexIndex.value = idx; return }
  emit('update:draftPoints', [...props.draftPoints, xyToGps(c.x, c.y)])
}

const onMouseMove = (e: MouseEvent) => {
  const rect = rootEl.value?.getBoundingClientRect()
  if (!rect) return
  if (isPanning.value) {
    pan.value = {
      x: panStart.value.panX + ((e.clientX - panStart.value.clientX) / rect.width) * VB_W,
      y: panStart.value.panY + ((e.clientY - panStart.value.clientY) / rect.height) * VB_H,
    }
    clampPan()
    return
  }
  const c = eventToContent(e)
  cursor.value = c
  if (props.mode === 'draw' && activeTool.value === 'pen') {
    hoverVertexIndex.value = hitVertex(c) >= 0 ? hitVertex(c) : null
  }
  if (dragVertexIndex.value !== null) {
    const next = [...props.draftPoints]
    next[dragVertexIndex.value] = xyToGps(c.x, c.y)
    emit('update:draftPoints', next)
  }
}

const onMouseUp = () => {
  isPanning.value = false
  dragVertexIndex.value = null
}

const onMouseLeave = () => {
  cursor.value = null
  hoverVertexIndex.value = null
  onMouseUp()
}

const onDeviceClick = (d: GpsDevice) => {
  if (canPan.value) emit('deviceClick', d)
}

// ==========================================
// 围栏
// ==========================================
const fenceColor = (type: Geofence['type']) =>
  type === 'safe' ? '#52c41a' : type === 'danger' ? '#ff4d4f' : '#1677ff'

const fencePoints = (f: Geofence) => f.points.map(gpsToXY)

/** 围栏改为圆角路径，避免生硬直角矩形 */
const fencePath = (f: Geofence) => roundedPolygonPath(fencePoints(f), 0.18)

const fenceCenter = (f: Geofence) => {
  const pts = f.points.map(gpsToXY)
  if (!pts.length) return { x: 0, y: 0 }
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  }
}

// ==========================================
// 轨迹：完整路线 + 已播放段 + 方向箭头 + 平滑移动点
// ==========================================
const trailList = computed(() => {
  const id = props.trailDeviceId
  if (!id) return [] as GpsTrailPoint[]
  return props.trails[id] ?? []
})

const trailXY = computed(() => trailList.value.map(gpsToXY))

/** 已播放比例 0~1（按累计长度，保证视觉匀速） */
const progressRatio = computed(() => {
  const max = Math.max(1, trailList.value.length - 1)
  if (props.trailProgress == null) return 1
  return Math.max(0, Math.min(props.trailProgress / max, 1))
})

/** 平滑曲线路径：完整路线与已走段 */
const fullTrailPath = computed(() =>
  trailXY.value.length >= 2 ? smoothPath(trailXY.value) : '')

const traveledXY = computed(() => {
  const pts = trailXY.value
  if (pts.length < 2) return [] as { x: number; y: number }[]
  const target = pointAtRatio(pts, progressRatio.value)
  if (!target) return []
  // 找出目标点落在第几段，截取该段之前的全部点 + 插值点
  const total = pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)), 0)
  let acc = progressRatio.value * total
  const out: { x: number; y: number }[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    if (acc >= seg) { out.push(pts[i]); acc -= seg }
    else { out.push(target); break }
  }
  if (out.length < 2) out.push(target)
  return out
})

const traveledPath = computed(() =>
  traveledXY.value.length >= 2 ? smoothPath(traveledXY.value) : '')

/** 进度小球位置（沿实际路径长度，与画面推进一致） */
const progressDot = computed(() => {
  if (props.trailProgress == null) return null
  return pointAtRatio(trailXY.value, progressRatio.value)
})

/** 方向箭头：按已走比例沿线均匀取样，箭头角度取路径切线 */
const trailArrows = computed(() => {
  const pts = trailXY.value
  if (pts.length < 2) return [] as { x: number; y: number; angle: number; traveled: boolean }[]
  const total = pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)), 0)
  // 每约 60 逻辑单位放一个箭头，控制在 3~7 个之间
  const count = Math.max(3, Math.min(7, Math.round(total / 60)))
  const arrows: { x: number; y: number; angle: number; traveled: boolean }[] = []
  for (let n = 1; n <= count; n++) {
    const r = (n / (count + 1)) * 1
    const cur = pointAtRatio(pts, r)
    const ahead = pointAtRatio(pts, Math.min(1, r + 0.02))
    const behind = pointAtRatio(pts, Math.max(0, r - 0.02))
    if (!cur || !ahead || !behind) continue
    arrows.push({
      x: cur.x,
      y: cur.y,
      angle: (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI,
      traveled: r <= progressRatio.value,
    })
  }
  return arrows
})

/** 平滑移动的设备位置（GPS 经纬度） */
const movingPos = computed(() => {
  if (!props.trailDeviceId || props.trailProgress == null) return null
  const p = progressDot.value
  return p ? xyToGps(p.x, p.y) : null
})

const movingDevice = computed(() =>
  props.devices.find(d => d.id === props.trailDeviceId) || null)

/** 播放中隐藏该设备的静态标记，改由平滑移动点承载 */
const staticDevices = computed(() =>
  props.devices.filter(d => !(d.id === props.trailDeviceId && props.trailProgress != null)))

/** 起点 / 终点 */
const trailStart = computed(() => trailXY.value[0] ?? null)
const trailEnd = computed(() => trailXY.value[trailXY.value.length - 1] ?? null)

// 自动跟随视野
watch(movingPos, (p) => {
  if (p && props.autoFollow) centerOn(p)
})

// ==========================================
// 绘制草稿
// 绘制态使用**直线**多边形：顶点严格落在折线拐点上，便于精细对位；
// 圆角仅用于最终已保存的围栏展示（避免视觉上"点不在线上"）
// ==========================================
const draftPolygon = computed(() =>
  props.draftPoints.length >= 3
    ? `M${draftXY.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`
    : '')
const draftPolyline = computed(() =>
  props.draftPoints.length >= 2
    ? `M${draftXY.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}`
    : '')

const previewLine = computed(() => {
  if (props.mode !== 'draw' || !cursor.value || !props.draftPoints.length) return null
  const last = draftXY.value[draftXY.value.length - 1]
  return { x1: last.x, y1: last.y, x2: cursor.value.x, y2: cursor.value.y }
})

const canClose = computed(() => {
  if (props.mode !== 'draw' || !cursor.value || props.draftPoints.length < 3) return false
  const first = draftXY.value[0]
  return Math.hypot(first.x - cursor.value.x, first.y - cursor.value.y) <= hitRadius.value * 1.6
})

/** 草稿多边形是否自相交（存在交叉边）：绘制态以红色描边提示 */
const draftCrossing = computed(() =>
  props.mode === 'draw' && props.draftPoints.length >= 4 && isSelfIntersecting(props.draftPoints))

// ==========================================
// 比例尺 & 地标
// ==========================================
const METERS_PER_UNIT = 3.4

const scaleBar = computed(() => {
  const pxPerUnit = (containerSize.value.w / VB_W) * zoom.value
  for (const m of [50, 100, 200, 500, 1000, 2000]) {
    const px = (m / METERS_PER_UNIT) * pxPerUnit
    if (px >= 72) return { label: m >= 1000 ? `${m / 1000} km` : `${m} m`, width: Math.round(px) }
  }
  return { label: '2 km', width: 120 }
})

const POIS = [
  { name: '3 号楼', lng: 118.7836, lat: 32.0472 },
  { name: '2 号楼', lng: 118.7862, lat: 32.0455 },
  { name: '户外花园', lng: 118.7884, lat: 32.0518 },
  { name: '东区走廊', lng: 118.7844, lat: 32.0530 },
  { name: '活动中心', lng: 118.7908, lat: 32.0475 },
  { name: '设备间', lng: 118.7986, lat: 32.0556 },
]

// ==========================================
// 生命周期
// ==========================================
let ro: ResizeObserver | null = null

const syncSize = () => {
  const rect = rootEl.value?.getBoundingClientRect()
  if (rect && rect.width && rect.height) containerSize.value = { w: rect.width, h: rect.height }
}

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  applyZoom(zoom.value * (e.deltaY < 0 ? 1.18 : 1 / 1.18), { x: e.clientX, y: e.clientY })
}

onMounted(() => {
  syncSize()
  if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
    ro = new ResizeObserver(syncSize)
    ro.observe(rootEl.value)
  }
  rootEl.value?.addEventListener('wheel', onWheel, { passive: false })
})

onBeforeUnmount(() => {
  ro?.disconnect()
  rootEl.value?.removeEventListener('wheel', onWheel)
})

const rootStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

defineExpose({ resetView, zoomBy, centerOn })
</script>

<template>
  <div
    ref="rootEl"
    class="gmc"
    :style="{ ...rootStyle, cursor: cursorStyle }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent
  >
    <!-- ============ 底图与矢量图层 ============ -->
    <svg class="gmc-svg" :viewBox="`0 0 ${VB_W} ${VB_H}`" preserveAspectRatio="none">
      <defs>
        <pattern id="gmc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" stroke="#e6edf6" stroke-width="1.2" />
        </pattern>
        <linearGradient id="gmc-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cfe4f7" />
          <stop offset="100%" stop-color="#bcd9f2" />
        </linearGradient>
      </defs>

      <g :transform="transform">
        <!-- 底 -->
        <rect x="0" y="0" :width="VB_W" :height="VB_H" fill="#f1f5fa" />
        <rect x="0" y="0" :width="VB_W" :height="VB_H" fill="url(#gmc-grid)" />

        <!-- 绿地 -->
        <g fill="#dcefd4">
          <rect x="40" y="46" width="250" height="150" rx="16" />
          <rect x="330" y="30" width="200" height="96" rx="14" />
          <rect x="620" y="370" width="330" height="200" rx="18" />
          <rect x="60" y="392" width="176" height="104" rx="14" />
        </g>
        <!-- 水系 -->
        <path d="M0 524 Q210 468 420 520 T1000 490 L1000 620 L0 620 Z" fill="url(#gmc-water)" />

        <!-- 建筑 -->
        <g fill="#e4eaf2" stroke="#d3dcea" stroke-width="1.5">
          <rect x="92" y="248" width="150" height="112" rx="10" />
          <rect x="272" y="238" width="118" height="132" rx="10" />
          <rect x="428" y="228" width="162" height="122" rx="10" />
          <rect x="636" y="116" width="142" height="152" rx="10" />
          <rect x="820" y="146" width="132" height="122" rx="10" />
          <rect x="330" y="398" width="140" height="102" rx="10" />
          <rect x="510" y="388" width="112" height="112" rx="10" />
          <rect x="700" y="326" width="150" height="42" rx="10" />
        </g>

        <!-- 道路 -->
        <g stroke="#ffffff" stroke-linecap="round">
          <line x1="0" y1="212" x2="1000" y2="212" stroke-width="26" />
          <line x1="0" y1="378" x2="1000" y2="378" stroke-width="22" />
          <line x1="248" y1="0" x2="248" y2="620" stroke-width="22" />
          <line x1="610" y1="0" x2="610" y2="620" stroke-width="24" />
          <line x1="800" y1="0" x2="800" y2="620" stroke-width="20" />
          <line x1="466" y1="0" x2="466" y2="620" stroke-width="16" />
        </g>
        <g stroke="#e9eff7" stroke-width="2.5" stroke-dasharray="14 12">
          <line x1="0" y1="212" x2="1000" y2="212" />
          <line x1="0" y1="378" x2="1000" y2="378" />
          <line x1="610" y1="0" x2="610" y2="620" />
        </g>

        <!-- 围栏：圆角路径 + 实线虚线等宽 -->
        <path
          v-for="f in geofences"
          :key="f.id"
          :d="fencePath(f)"
          :fill="fenceColor(f.type)"
          :fill-opacity="f.enabled ? 0.15 : 0.05"
          :stroke="fenceColor(f.type)"
          :stroke-width="2 / zoom"
          :stroke-dasharray="f.enabled ? '' : `${7 / zoom} ${6 / zoom}`"
          stroke-linejoin="round"
        />

        <!-- ============ 轨迹 ============ -->
        <g v-if="fullTrailPath">
          <!-- 未走路径：浅色虚线 -->
          <path
            :d="fullTrailPath"
            fill="none" stroke="#c3cfdd" :stroke-width="2 / zoom"
            :stroke-dasharray="`${5 / zoom} ${6 / zoom}`"
            stroke-linecap="round" stroke-linejoin="round"
          />
          <!-- 已走路径：柔光底 + 主线，形成推进感 -->
          <path
            v-if="traveledPath"
            :d="traveledPath"
            fill="none" stroke="#1677ff" :stroke-opacity="0.16"
            :stroke-width="9 / zoom" stroke-linecap="round" stroke-linejoin="round"
          />
          <path
            v-if="traveledPath"
            :d="traveledPath"
            fill="none" stroke="#1677ff" :stroke-width="2.6 / zoom"
            stroke-linecap="round" stroke-linejoin="round"
          />
          <!-- 方向箭头 -->
          <g v-for="(a, i) in trailArrows" :key="'ar-' + i" :transform="`translate(${a.x} ${a.y}) rotate(${a.angle})`">
            <polygon
              :points="`${-3.6 / zoom},${-3.4 / zoom} ${4.8 / zoom},0 ${-3.6 / zoom},${3.4 / zoom}`"
              :fill="a.traveled ? '#1677ff' : '#b3c0cf'"
            />
          </g>
          <!-- 起终点 -->
          <template v-if="trailStart && trailEnd">
            <circle :cx="trailStart.x" :cy="trailStart.y" :r="5.5 / zoom" fill="#fff" stroke="#16a34a" :stroke-width="2.6 / zoom" />
            <circle :cx="trailEnd.x" :cy="trailEnd.y" :r="5.5 / zoom" fill="#fff" stroke="#ff4d4f" :stroke-width="2.6 / zoom" />
          </template>
        </g>

        <!-- 绘制草稿：≥3 点画闭合区域，<3 点只画虚线折线（互斥，避免双重描边） -->
        <!-- 形状自相交时描边转为红色，提示需调整顶点顺序 -->
        <template v-if="draftPoints.length >= 3">
          <path
            v-if="draftPolygon"
            :d="draftPolygon"
            :fill="draftCrossing ? 'rgba(255,77,79,0.16)' : 'rgba(22,119,255,0.14)'"
            :stroke="draftCrossing ? '#ff4d4f' : '#1677ff'"
            :stroke-width="2 / zoom"
            stroke-linejoin="round"
          />
        </template>
        <path
          v-else-if="draftPolyline"
          :d="draftPolyline"
          fill="none" stroke="#1677ff" :stroke-width="1.8 / zoom"
          stroke-linecap="round"
          :stroke-dasharray="`${5 / zoom} ${5 / zoom}`"
        />
        <line
          v-if="previewLine"
          :x1="previewLine.x1" :y1="previewLine.y1" :x2="previewLine.x2" :y2="previewLine.y2"
          stroke="#1677ff" :stroke-width="2 / zoom" :stroke-dasharray="`${7 / zoom} ${5 / zoom}`"
        />
      </g>
    </svg>

    <!-- ============ DOM 覆盖层 ============ -->
    <div class="gmc-overlay">
      <!-- 地标名 -->
      <div
        v-for="poi in (showPoi ? POIS : [])"
        :key="poi.name"
        class="gmc-poi"
        :style="contentToPercent(gpsToXY(poi))"
      >{{ poi.name }}</div>

      <!-- 起终点文字 -->
      <template v-if="trailStart && trailEnd">
        <div class="gmc-trail-label start" :style="contentToPercent(trailStart)">起点</div>
        <div class="gmc-trail-label end" :style="contentToPercent(trailEnd)">终点</div>
      </template>

      <!-- 围栏名称 -->
      <div
        v-for="f in geofences"
        :key="'lb-' + f.id"
        class="gmc-fence-name"
        :style="{ ...contentToPercent(fenceCenter(f)), color: fenceColor(f.type), borderColor: fenceColor(f.type) }"
      >
        {{ f.name }}<span v-if="!f.enabled" class="gmc-fence-off">已停用</span>
      </div>

      <!-- 静态设备标记 -->
      <div
        v-for="d in staticDevices"
        :key="d.id"
        class="gmc-marker"
        :class="{
          'is-active': selectedDeviceId === d.id,
          'is-offline': d.status === 'offline',
          'is-sleep': d.status === 'sleep',
        }"
        :style="contentToPercent(gpsToXY(d))"
        @mousedown.stop
        @click.stop="onDeviceClick(d)"
      >
        <div class="gmc-pin">
          <div class="gmc-pin-body"><EnvironmentFilled /></div>
          <div class="gmc-pin-dot" />
        </div>
        <div v-if="showLabels" class="gmc-tag">
          <span class="gmc-tag-name">{{ d.name }}</span>
          <SignalBars :network="d.network" :level="d.signal" />
          <span class="gmc-tag-bat">
            <BatteryIcon :value="d.battery" :charging="d.charging" :size="12" />
            <i :class="{ low: d.battery < 20 }">{{ d.battery }}%</i>
          </span>
        </div>
      </div>

      <!-- 轨迹平滑移动点 -->
      <div
        v-if="movingPos"
        class="gmc-mover"
        :style="contentToPercent(gpsToXY(movingPos))"
      >
        <span class="gmc-mover-pulse" />
        <span class="gmc-mover-pulse delay" />
        <div class="gmc-mover-body"><EnvironmentFilled /></div>
        <div v-if="movingDevice && showLabels" class="gmc-mover-tag">
          <span class="gmc-mover-name">{{ movingDevice.name }}</span>
          <span class="gmc-mover-coord">{{ movingPos.lng }}, {{ movingPos.lat }}</span>
        </div>
      </div>

      <!-- 进度小球（沿路径长度推进，与曲线重合） -->
      <div
        v-if="progressDot"
        class="gmc-progress-dot"
        :style="contentToPercent(progressDot)"
      />

      <!-- 顶点手柄 -->
      <div
        v-for="(p, i) in draftPoints"
        :key="'v-' + i"
        class="gmc-vertex"
        :class="{ dragging: dragVertexIndex === i, hover: hoverVertexIndex === i, first: i === 0 }"
        :style="contentToPercent(gpsToXY(p))"
      >{{ i + 1 }}</div>
    </div>

    <!-- ============ 工具条 ============ -->
    <div class="gmc-zoom">
      <button class="gmc-zbtn" title="放大" @mousedown.stop @click.stop="zoomBy(1.35)"><ZoomInOutlined /></button>
      <span class="gmc-zval">{{ Math.round(zoom * 100) }}%</span>
      <button class="gmc-zbtn" title="缩小" @mousedown.stop @click.stop="zoomBy(1 / 1.35)"><ZoomOutOutlined /></button>
      <button class="gmc-zbtn" title="重置视图" @mousedown.stop @click.stop="resetView"><AimOutlined /></button>
    </div>

    <div v-if="mode === 'draw'" class="gmc-tools">
      <button
        class="gmc-tbtn" :class="{ active: activeTool === 'pen' }"
        title="画笔：点击落点，拖动顶点微调"
        @mousedown.stop @click.stop="activeTool = 'pen'"
      ><EditOutlined /> 画笔</button>
      <button
        class="gmc-tbtn" :class="{ active: activeTool === 'pan' }"
        title="抓手：拖拽平移地图"
        @mousedown.stop @click.stop="activeTool = 'pan'"
      ><DragOutlined /> 抓手</button>
      <span class="gmc-thint">滚轮缩放 · 放大后可精细取点</span>
    </div>

    <!-- ============ 图例 + 比例尺 ============ -->
    <div v-if="mode === 'view' && showLegend" class="gmc-legend">
      <span v-for="t in (['safe', 'danger', 'custom'] as const)" :key="t" class="gmc-lg-item">
        <i class="gmc-lg-dot" :style="{ background: fenceColor(t) }" />{{ GEOFENCE_TYPE_LABELS[t].label }}
      </span>
      <template v-if="fullTrailPath">
        <span class="gmc-lg-sep" />
        <span class="gmc-lg-item"><i class="gmc-lg-line done" />已走过</span>
        <span class="gmc-lg-item"><i class="gmc-lg-line left" />未走过</span>
      </template>
    </div>

    <div class="gmc-scale">
      <div class="gmc-scale-bar" :style="{ width: scaleBar.width + 'px' }" />
      <span class="gmc-scale-text">{{ scaleBar.label }}</span>
    </div>

    <!-- 坐标提示 -->
    <div v-if="mode === 'draw' && cursor" class="gmc-cursor-tip">
      <EnvironmentOutlined /> {{ xyToGps(cursor.x, cursor.y).lng }}, {{ xyToGps(cursor.x, cursor.y).lat }}
    </div>

    <div v-if="canClose" class="gmc-close-tip">回到起点可闭合围栏</div>

    <div v-if="draftCrossing" class="gmc-cross-tip">边界存在交叉，请调整顶点顺序</div>
  </div>
</template>

<style scoped>
.gmc { position:relative; width:100%; background:#f1f5fa; border-radius:12px; overflow:hidden; user-select:none; touch-action:none; }
.gmc-svg { position:absolute; inset:0; width:100%; height:100%; display:block; }
.gmc-overlay { position:absolute; inset:0; pointer-events:none; }

/* ===== 地标 ===== */
.gmc-poi { position:absolute; transform:translate(-50%,-50%); font-size:12px; color:#94a3b8; letter-spacing:.5px; white-space:nowrap; }

/* ===== 起终点 ===== */
.gmc-trail-label { position:absolute; transform:translate(-50%,-50%); margin-top:-20px; font-size:11px; font-weight:600; padding:1px 6px; border-radius:10px; background:#fff; box-shadow:0 2px 6px rgba(15,23,42,.14); white-space:nowrap; }
.gmc-trail-label.start { color:#16a34a; }
.gmc-trail-label.end { color:#ff4d4f; }

/* ===== 围栏名 ===== */
.gmc-fence-name { position:absolute; transform:translate(-50%,-50%); padding:2px 8px; background:rgba(255,255,255,.92); border:1px solid; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; box-shadow:0 2px 6px rgba(15,23,42,.08); }
.gmc-fence-off { margin-left:4px; font-weight:400; color:#9ca3af; }

/* ===== 设备标记 ===== */
.gmc-marker { position:absolute; transform:translate(-50%,-100%); pointer-events:auto; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
.gmc-pin { position:relative; display:flex; flex-direction:column; align-items:center; }
.gmc-pin-body { width:32px; height:32px; border-radius:50%; background:#fff; border:2px solid #1677ff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(22,119,255,.3); transition:all .18s; }
.gmc-pin-body :deep(.anticon) { font-size:16px; color:#1677ff; }
.gmc-pin-dot { width:3px; height:8px; margin-top:-1px; background:#1677ff; border-radius:0 0 3px 3px; opacity:.85; }
.gmc-marker.is-offline .gmc-pin-body { border-color:#9ca3af; }
.gmc-marker.is-offline .gmc-pin-body :deep(.anticon) { color:#9ca3af; }
.gmc-marker.is-offline .gmc-pin-dot { background:#9ca3af; }
.gmc-marker.is-sleep .gmc-pin-body { border-color:#fa8c16; }
.gmc-marker.is-sleep .gmc-pin-body :deep(.anticon) { color:#fa8c16; }
.gmc-marker.is-sleep .gmc-pin-dot { background:#fa8c16; }
.gmc-marker:hover .gmc-pin-body { transform:scale(1.12); }
.gmc-marker.is-active { z-index:5; }
.gmc-marker.is-active .gmc-pin-body { border-color:#1677ff; background:#1677ff; box-shadow:0 0 0 6px rgba(22,119,255,.18), 0 4px 14px rgba(22,119,255,.4); }
.gmc-marker.is-active .gmc-pin-body :deep(.anticon) { color:#fff; }

.gmc-tag { display:flex; align-items:center; gap:6px; margin-top:4px; padding:3px 9px; background:rgba(255,255,255,.96); border-radius:14px; box-shadow:0 2px 8px rgba(15,23,42,.12); white-space:nowrap; }
.gmc-tag-name { font-size:12px; color:#1f2937; font-weight:500; }
.gmc-tag-bat { display:inline-flex; align-items:center; gap:3px; }
.gmc-tag-bat i { font-size:11px; font-style:normal; color:#16a34a; }
.gmc-tag-bat i.low { color:#ff4d4f; font-weight:600; }

/* ===== 轨迹移动点 ===== */
.gmc-mover { position:absolute; transform:translate(-50%,-50%); z-index:6; display:flex; flex-direction:column; align-items:center; }
.gmc-mover-pulse { position:absolute; left:50%; top:50%; width:30px; height:30px; margin:-15px 0 0 -15px; border-radius:50%; background:rgba(22,119,255,.3); animation:gmc-pulse 2s ease-out infinite; }
.gmc-mover-pulse.delay { animation-delay:1s; }
@keyframes gmc-pulse { 0% { transform:scale(.6); opacity:.7; } 100% { transform:scale(2.2); opacity:0; } }
.gmc-mover-body { position:relative; width:26px; height:26px; border-radius:50%; background:#1677ff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 3px rgba(255,255,255,.9), 0 3px 12px rgba(22,119,255,.5); }
.gmc-mover-body :deep(.anticon) { font-size:13px; color:#fff; }
.gmc-mover-tag { display:flex; flex-direction:column; align-items:center; gap:1px; margin-top:7px; padding:4px 10px; background:rgba(255,255,255,.97); border:1px solid #cfe1fb; border-radius:10px; box-shadow:0 4px 14px rgba(15,23,42,.14); white-space:nowrap; }
.gmc-mover-name { font-size:12px; color:#1f2937; font-weight:600; }
.gmc-mover-coord { font-size:10.5px; color:#1677ff; font-variant-numeric:tabular-nums; }

/* 进度小球 */
.gmc-progress-dot { position:absolute; width:11px; height:11px; margin:-5.5px 0 0 -5.5px; border-radius:50%; background:#fff; border:2.5px solid #1677ff; box-shadow:0 2px 8px rgba(22,119,255,.5); z-index:5; }

/* ===== 顶点手柄 ===== */
.gmc-vertex { position:absolute; transform:translate(-50%,-50%); width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid #1677ff; color:#1677ff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; pointer-events:none; box-shadow:0 2px 6px rgba(15,23,42,.18); }
.gmc-vertex.first { border-style:dashed; }
.gmc-vertex.hover { box-shadow:0 0 0 6px rgba(22,119,255,.18); }
.gmc-vertex.dragging { background:#1677ff; color:#fff; box-shadow:0 0 0 8px rgba(22,119,255,.22); }

/* ===== 工具条 ===== */
.gmc-zoom { position:absolute; right:12px; top:12px; display:flex; align-items:center; gap:2px; padding:4px; background:rgba(255,255,255,.94); border-radius:10px; box-shadow:0 4px 14px rgba(15,23,42,.12); }
.gmc-zbtn { width:28px; height:28px; border:none; background:transparent; border-radius:6px; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; }
.gmc-zbtn:hover { background:#eff6ff; color:#1677ff; }
.gmc-zval { min-width:44px; text-align:center; font-size:12px; color:#64748b; }

.gmc-tools { position:absolute; left:12px; top:12px; display:flex; align-items:center; gap:6px; padding:5px 10px 5px 6px; background:rgba(255,255,255,.94); border-radius:10px; box-shadow:0 4px 14px rgba(15,23,42,.12); }
.gmc-tbtn { display:inline-flex; align-items:center; gap:4px; height:28px; padding:0 10px; border:none; background:transparent; border-radius:6px; color:#475569; font-size:12px; cursor:pointer; }
.gmc-tbtn:hover { background:#eff6ff; color:#1677ff; }
.gmc-tbtn.active { background:#1677ff; color:#fff; }
.gmc-thint { font-size:11px; color:#94a3b8; padding-left:4px; }

.gmc-legend { position:absolute; left:12px; bottom:12px; display:flex; align-items:center; gap:12px; padding:6px 12px; background:rgba(255,255,255,.94); border-radius:8px; font-size:12px; color:#475569; box-shadow:0 4px 14px rgba(15,23,42,.1); }
.gmc-lg-item { display:inline-flex; align-items:center; gap:5px; }
.gmc-lg-dot { width:10px; height:10px; border-radius:3px; }
.gmc-lg-sep { width:1px; height:14px; background:#e2e8f0; }
.gmc-lg-line { width:16px; height:3px; border-radius:2px; }
.gmc-lg-line.done { background:#1677ff; }
.gmc-lg-line.left { background:repeating-linear-gradient(90deg,#c7d2e0 0 4px,transparent 4px 7px); }

.gmc-scale { position:absolute; right:12px; bottom:12px; display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px 8px; background:rgba(255,255,255,.9); border-radius:8px; box-shadow:0 4px 14px rgba(15,23,42,.1); }
.gmc-scale-bar { height:7px; border:1.5px solid #64748b; border-top:none; }
.gmc-scale-text { font-size:11px; color:#64748b; }

.gmc-cursor-tip { position:absolute; right:12px; top:calc(12px + 40px); padding:4px 10px; background:rgba(15,23,42,.82); color:#fff; font-size:11.5px; border-radius:6px; display:inline-flex; align-items:center; gap:5px; }
.gmc-close-tip { position:absolute; left:50%; top:16px; transform:translateX(-50%); padding:5px 14px; background:rgba(22,119,255,.92); color:#fff; font-size:12px; border-radius:20px; box-shadow:0 4px 14px rgba(22,119,255,.3); }
.gmc-cross-tip { position:absolute; left:50%; top:52px; transform:translateX(-50%); padding:5px 14px; background:rgba(255,77,79,.94); color:#fff; font-size:12px; border-radius:20px; box-shadow:0 4px 14px rgba(255,77,79,.3); white-space:nowrap; }
</style>
