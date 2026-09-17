import { defineStore } from 'pinia'
import type {
  GpsDevice, Geofence, GpsPhotoRecord, GpsTrailPoint, GeoPoint,
  PhotoResourcePack, PhotoQuotaOrder,
} from '@/types'

// ==========================================
// 模拟图片
// ==========================================
const img = (prompt: string, size = 'landscape_4_3') =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

// ==========================================
// 地理计算工具
// ==========================================
/** 模拟地图可视范围（南京市新街口一带） */
export const GPS_MAP_BOUNDS = { minLng: 118.7700, maxLng: 118.8060, minLat: 32.0380, maxLat: 32.0620 }

/** 地图逻辑坐标系尺寸：所有几何按此表达，容器任意尺寸线性映射 */
export const GPS_MAP_VB = { w: 1000, h: 620 }

/** 经纬度 → 地图逻辑坐标 */
export function gpsToXY(p: { lng: number; lat: number }) {
  const { minLng, maxLng, minLat, maxLat } = GPS_MAP_BOUNDS
  return {
    x: ((p.lng - minLng) / (maxLng - minLng)) * GPS_MAP_VB.w,
    y: ((maxLat - p.lat) / (maxLat - minLat)) * GPS_MAP_VB.h,
  }
}

/** 地图逻辑坐标 → 经纬度 */
export function xyToGps(x: number, y: number) {
  const { minLng, maxLng, minLat, maxLat } = GPS_MAP_BOUNDS
  return {
    lng: +(minLng + (x / GPS_MAP_VB.w) * (maxLng - minLng)).toFixed(6),
    lat: +(maxLat - (y / GPS_MAP_VB.h) * (maxLat - minLat)).toFixed(6),
  }
}

/**
 * 将折线转成平滑曲线路径（Catmull-Rom → 三次贝塞尔），
 * 用于让轨迹呈现自然弧线而非生硬折线。
 */
export function smoothPath(pts: { x: number; y: number }[], tension = 0.4) {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2
    d += `C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

/**
 * 将多边形顶点转为圆角路径（各拐角以二次贝塞尔倒角），
 * 避免电子围栏呈现为生硬的直角矩形。
 */
export function roundedPolygonPath(pts: { x: number; y: number }[], radiusRatio = 0.16) {
  const n = pts.length
  if (n < 3) return ''
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const l1 = Math.hypot(prev.x - cur.x, prev.y - cur.y)
    const l2 = Math.hypot(next.x - cur.x, next.y - cur.y)
    const r = Math.min(l1, l2) * radiusRatio
    const p1 = { x: cur.x + ((prev.x - cur.x) / (l1 || 1)) * r, y: cur.y + ((prev.y - cur.y) / (l1 || 1)) * r }
    const p2 = { x: cur.x + ((next.x - cur.x) / (l2 || 1)) * r, y: cur.y + ((next.y - cur.y) / (l2 || 1)) * r }
    out.push(`${i === 0 ? 'M' : 'L'}${p1.x.toFixed(1)},${p1.y.toFixed(1)}Q${cur.x.toFixed(1)},${cur.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`)
  }
  return out.join('') + 'Z'
}

/** 沿折线按累计长度取指定比例位置（用于轨迹渐进绘制） */
export function pointAtRatio(pts: { x: number; y: number }[], ratio: number) {
  if (!pts.length) return null
  if (pts.length === 1) return { ...pts[0] }
  const total = pts.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)), 0)
  if (total === 0) return { ...pts[0] }
  let target = Math.max(0, Math.min(ratio, 1)) * total
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    if (target <= seg) {
      const t = seg === 0 ? 0 : target / seg
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      }
    }
    target -= seg
  }
  return { ...pts[pts.length - 1] }
}

/** 判断坐标是否落在围栏多边形内（射线法） */
export function isPointInPolygon(point: { lng: number; lat: number }, polygon: { lng: number; lat: number }[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat
    const xj = polygon[j].lng, yj = polygon[j].lat
    const intersect = (yi > point.lat) !== (yj > point.lat)
      && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * 判断多边形是否自相交（非相邻边相交）。
 * 自相交的围栏会导致点在多边形内判定出现歧义，需在保存前拦截。
 */
export function isSelfIntersecting(polygon: { lng: number; lat: number }[]) {
  const n = polygon.length
  if (n < 4) return false
  const d = (p: { lng: number; lat: number }, q: { lng: number; lat: number }, r: { lng: number; lat: number }) =>
    (q.lng - p.lng) * (r.lat - p.lat) - (q.lat - p.lat) * (r.lng - p.lng)
  const onSeg = (p: { lng: number; lat: number }, q: { lng: number; lat: number }, r: { lng: number; lat: number }) =>
    Math.min(p.lng, q.lng) <= r.lng && r.lng <= Math.max(p.lng, q.lng) &&
    Math.min(p.lat, q.lat) <= r.lat && r.lat <= Math.max(p.lat, q.lat)
  const segIntersect = (
    a1: { lng: number; lat: number }, a2: { lng: number; lat: number },
    b1: { lng: number; lat: number }, b2: { lng: number; lat: number },
  ) => {
    const d1 = d(b1, b2, a1)
    const d2 = d(b1, b2, a2)
    const d3 = d(a1, a2, b1)
    const d4 = d(a1, a2, b2)
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
    if (d1 === 0 && onSeg(b1, b2, a1)) return true
    if (d2 === 0 && onSeg(b1, b2, a2)) return true
    if (d3 === 0 && onSeg(a1, a2, b1)) return true
    if (d4 === 0 && onSeg(a1, a2, b2)) return true
    return false
  }
  for (let i = 0; i < n; i++) {
    const a1 = polygon[i]
    const a2 = polygon[(i + 1) % n]
    for (let j = i + 1; j < n; j++) {
      // 跳过相邻边与首尾相接的边
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue
      const b1 = polygon[j]
      const b2 = polygon[(j + 1) % n]
      if (segIntersect(a1, a2, b1, b2)) return true
    }
  }
  return false
}

/** 围栏多边形面积（平方米，近似计算，用于展示围栏覆盖面积） */
export function polygonAreaSqMeters(polygon: { lng: number; lat: number }[]) {
  if (polygon.length < 3) return 0
  const latRef = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length
  const mx = 111320 * Math.cos((latRef * Math.PI) / 180)
  const my = 110540
  const xy = polygon.map(p => ({ x: p.lng * mx, y: p.lat * my }))
  let area = 0
  for (let i = 0, j = xy.length - 1; i < xy.length; j = i++) {
    area += xy[j].x * xy[i].y - xy[i].x * xy[j].y
  }
  return Math.abs(area / 2)
}

/** HH:mm → 分钟数 */
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 分钟数 → HH:mm */
const fromMinutes = (v: number) => {
  const m = Math.round(v)
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * 将少量关键路径点细分为密集轨迹点，并加入轻微自然摆动，
 * 模拟真人行走时的左右偏移，避免轨迹呈现为生硬的折线。
 */
function densify(
  waypoints: { lng: number; lat: number; time: string }[],
  stepsPerSeg = 10,
) {
  const out: GpsTrailPoint[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i]
    const b = waypoints[i + 1]
    const ta = toMinutes(a.time)
    const tb = toMinutes(b.time)
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg
      // 正弦扰动：段中偏移最大、端点归零，保证连续平滑
      const wobble = Math.sin(t * Math.PI) * 0.00013 * (i % 2 === 0 ? 1 : -1)
      out.push({
        lng: +(a.lng + (b.lng - a.lng) * t + wobble).toFixed(6),
        lat: +(a.lat + (b.lat - a.lat) * t + wobble * 0.55).toFixed(6),
        time: fromMinutes(ta + (tb - ta) * t),
      })
    }
  }
  const last = waypoints[waypoints.length - 1]
  out.push({ lng: last.lng, lat: last.lat, time: last.time })
  return out
}

// ==========================================
// GPS 可移动摄像机（Mock）
// ==========================================
const initDevices: GpsDevice[] = [
  {
    id: 'g1', name: '随身看护机-张爷爷', license: 'GPS-2026-P001', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-P100 随身看护机', firmwareVersion: 'v2.1.4',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    status: 'online', battery: 78, charging: false, network: 'wifi', signal: 'strong', carrier: 'HM-ElderCare-3F',
    lng: 118.7852, lat: 32.0494,
    lastReportAt: '2026-09-14 09:42:18', wearDetected: true,
    capabilities: { buttonCapture: true, sosButton: true, autoCapture: true, geofence: true, voiceCall: true },
    geofenceIds: ['gf1', 'gf3'],
  },
  {
    id: 'g2', name: '随身看护机-李奶奶', license: 'GPS-2026-P002', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-P100 随身看护机', firmwareVersion: 'v2.1.4',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/305房',
    status: 'online', battery: 46, charging: false, network: 'cellular', signal: 'medium', carrier: '中国联通',
    lng: 118.7876, lat: 32.0512,
    lastReportAt: '2026-09-14 09:41:02', wearDetected: true,
    // 该设备不支持设备侧按键拍照，仅支持定时上报（能力差异）
    capabilities: { buttonCapture: false, sosButton: false, autoCapture: true, geofence: true, voiceCall: false },
    geofenceIds: ['gf1'],
  },
  {
    id: 'g3', name: '随身看护机-王爷爷', license: 'GPS-2026-P003', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-P200 康养版', firmwareVersion: 'v2.2.0',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    status: 'online', battery: 92, charging: true, network: 'wifi', signal: 'strong', carrier: 'HM-ElderCare-2F',
    lng: 118.7831, lat: 32.0487,
    lastReportAt: '2026-09-14 09:43:35', wearDetected: true,
    capabilities: { buttonCapture: true, sosButton: true, autoCapture: true, geofence: true, voiceCall: true },
    geofenceIds: ['gf1', 'gf2'],
  },
  {
    id: 'g4', name: '随身看护机-赵奶奶', license: 'GPS-2026-P004', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-P200 康养版', firmwareVersion: 'v2.2.0',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    status: 'sleep', battery: 23, charging: true, network: 'cellular', signal: 'medium', carrier: '中国移动',
    lng: 118.7895, lat: 32.0466,
    lastReportAt: '2026-09-14 09:38:50', wearDetected: false,
    capabilities: { buttonCapture: true, sosButton: true, autoCapture: true, geofence: true, voiceCall: true },
    geofenceIds: ['gf1'],
  },
  {
    id: 'g5', name: '移动布控球-东区走廊', license: 'GPS-2026-M005', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-M300 移动布控球', firmwareVersion: 'v3.0.2',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/公共区域',
    status: 'online', battery: 100, charging: true, network: 'wifi', signal: 'strong', carrier: 'HM-ElderCare-Pub',
    lng: 118.7844, lat: 32.0523,
    lastReportAt: '2026-09-14 09:43:02', wearDetected: false,
    capabilities: { buttonCapture: false, sosButton: false, autoCapture: true, geofence: true, voiceCall: false },
    geofenceIds: ['gf2'],
  },
  {
    id: 'g6', name: '巡查记录仪-护理员A', license: 'GPS-2026-W006', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-W400 巡查记录仪', firmwareVersion: 'v1.8.6',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    status: 'online', battery: 64, charging: false, network: 'cellular', signal: 'weak', carrier: '中国联通',
    lng: 118.7912, lat: 32.0560,
    lastReportAt: '2026-09-14 09:40:11', wearDetected: true,
    capabilities: { buttonCapture: true, sosButton: false, autoCapture: true, geofence: true, voiceCall: true },
    geofenceIds: ['gf1'],
  },
  {
    id: 'g7', name: '随车记录仪-接送车01', license: 'GPS-2026-V007', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-V500 车载记录仪', firmwareVersion: 'v2.0.9',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/后勤车队',
    status: 'offline', battery: 8, charging: false, network: 'cellular', signal: 'weak', carrier: '中国移动',
    lng: 118.7798, lat: 32.0425,
    lastReportAt: '2026-09-14 08:12:44', wearDetected: false,
    capabilities: { buttonCapture: true, sosButton: false, autoCapture: false, geofence: true, voiceCall: false },
    geofenceIds: [],
  },
  {
    id: 'g8', name: '随身看护机-周爷爷', license: 'GPS-2026-P008', deviceType: 'GPS移动摄像机',
    deviceModel: 'HM-P100 随身看护机', firmwareVersion: 'v2.1.4',
    orgPathLabel: '鹤梦养老/江苏南京/鼓楼照护站/1号楼/105房',
    status: 'online', battery: 55, charging: false, network: 'wifi', signal: 'medium', carrier: 'GL-Care-WiFi',
    lng: 118.7975, lat: 32.0442,
    lastReportAt: '2026-09-14 09:42:47', wearDetected: true,
    capabilities: { buttonCapture: false, sosButton: true, autoCapture: true, geofence: true, voiceCall: false },
    geofenceIds: ['gf4'],
  },
]

// ==========================================
// 电子围栏（Mock）
// ==========================================
const initGeofences: Geofence[] = [
  {
    id: 'gf1', name: '照护中心安全活动区', type: 'safe',
    deviceIds: ['g1', 'g2', 'g3', 'g4', 'g6'],
    // 贴合楼栋与围墙的实际边界，刻意保留不规则转折
    points: [
      { lng: 118.7792, lat: 32.0546 },
      { lng: 118.7858, lat: 32.0558 },
      { lng: 118.7912, lat: 32.0549 },
      { lng: 118.7936, lat: 32.0512 },
      { lng: 118.7928, lat: 32.0466 },
      { lng: 118.7884, lat: 32.0441 },
      { lng: 118.7826, lat: 32.0448 },
      { lng: 118.7790, lat: 32.0489 },
    ],
    enabled: true,
    rule: { enter: false, exit: true, timeStart: '00:00', timeEnd: '23:59', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    remark: '老人离开该区域即触发走失风险告警，并推送至护理主管与家属',
    createdAt: '2026-07-12 10:20:00',
  },
  {
    id: 'gf2', name: '高风险区域（配电/设备间）', type: 'danger',
    deviceIds: ['g3', 'g5'],
    points: [
      { lng: 118.7952, lat: 32.0588 },
      { lng: 118.8006, lat: 32.0592 },
      { lng: 118.8024, lat: 32.0568 },
      { lng: 118.8020, lat: 32.0536 },
      { lng: 118.7988, lat: 32.0522 },
      { lng: 118.7956, lat: 32.0544 },
    ],
    enabled: true,
    rule: { enter: true, exit: false, timeStart: '00:00', timeEnd: '23:59', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    remark: '老人或移动布控球进入该区域触发闯入告警',
    createdAt: '2026-07-18 15:36:00',
  },
  {
    id: 'gf3', name: '户外花园围栏', type: 'custom',
    deviceIds: ['g1'],
    points: [
      { lng: 118.7834, lat: 32.0546 },
      { lng: 118.7888, lat: 32.0542 },
      { lng: 118.7906, lat: 32.0518 },
      { lng: 118.7886, lat: 32.0496 },
      { lng: 118.7842, lat: 32.0504 },
      { lng: 118.7828, lat: 32.0524 },
    ],
    enabled: true,
    rule: { enter: true, exit: true, timeStart: '06:00', timeEnd: '20:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    remark: '自定义管控范围，仅在 06:00~20:00 对进出该区域的行为告警',
    createdAt: '2026-08-02 09:05:00',
  },
  {
    id: 'gf4', name: '鼓楼照护站安全区', type: 'safe',
    deviceIds: ['g8'],
    points: [
      { lng: 118.7938, lat: 32.0478 },
      { lng: 118.7998, lat: 32.0472 },
      { lng: 118.8032, lat: 32.0446 },
      { lng: 118.8012, lat: 32.0406 },
      { lng: 118.7962, lat: 32.0398 },
      { lng: 118.7936, lat: 32.0432 },
    ],
    enabled: false,
    rule: { enter: false, exit: true, timeStart: '06:00', timeEnd: '22:00', weekdays: [1, 2, 3, 4, 5] },
    remark: '暂未启用（待站点围栏校准后开启）',
    createdAt: '2026-08-20 11:40:00',
  },
]

// ==========================================
// 定位轨迹（Mock，按设备；由关键路径点细分为密集平滑轨迹）
// ==========================================
const trailWaypoints: Record<string, GpsTrailPoint[]> = {
  g1: [
    { lng: 118.7852, lat: 32.0494, time: '07:30' },
    { lng: 118.7864, lat: 32.0503, time: '08:05' },
    { lng: 118.7878, lat: 32.0509, time: '08:35' },
    { lng: 118.7868, lat: 32.0520, time: '09:05' },
    { lng: 118.7850, lat: 32.0512, time: '09:25' },
    { lng: 118.7852, lat: 32.0494, time: '09:42' },
  ],
  g2: [
    { lng: 118.7866, lat: 32.0500, time: '07:40' },
    { lng: 118.7876, lat: 32.0507, time: '08:20' },
    { lng: 118.7882, lat: 32.0516, time: '08:55' },
    { lng: 118.7874, lat: 32.0519, time: '09:20' },
    { lng: 118.7876, lat: 32.0512, time: '09:41' },
  ],
  g3: [
    { lng: 118.7825, lat: 32.0478, time: '07:20' },
    { lng: 118.7838, lat: 32.0484, time: '07:55' },
    { lng: 118.7852, lat: 32.0493, time: '08:30' },
    { lng: 118.7842, lat: 32.0498, time: '09:10' },
    { lng: 118.7831, lat: 32.0487, time: '09:43' },
  ],
  g5: [
    { lng: 118.7839, lat: 32.0516, time: '08:00' },
    { lng: 118.7847, lat: 32.0522, time: '08:25' },
    { lng: 118.7852, lat: 32.0528, time: '08:55' },
    { lng: 118.7844, lat: 32.0523, time: '09:43' },
  ],
  g6: [
    { lng: 118.7848, lat: 32.0495, time: '07:50' },
    { lng: 118.7866, lat: 32.0512, time: '08:25' },
    { lng: 118.7888, lat: 32.0534, time: '09:00' },
    { lng: 118.7904, lat: 32.0553, time: '09:25' },
    { lng: 118.7912, lat: 32.0560, time: '09:40' },
  ],
}

const initTrails: Record<string, GpsTrailPoint[]> = Object.fromEntries(
  Object.entries(trailWaypoints).map(([id, wps]) => [id, densify(wps)]),
)

// ==========================================
// 照片存储：企业级额度 + 按张购买的资源包
// ==========================================
/** 每个企业免费提供的额度（张）：额度用完后停止接收该企业全部设备上报的截图与信息 */
export const FREE_PHOTO_QUOTA = 30

/** 当前操作人（购买记录中记为购买人） */
export const CURRENT_OPERATOR = '🫏建成'

/**
 * 单张照片全生命周期成本预算（基于腾讯云 COS 中国大陆地域公开刊例价）
 * 照片不做过期清理，需按 5 年留存口径核算：
 *  - 存储容量：标准存储 0.118 元/GB/月
 *      单张 240KB ÷ 1024 ÷ 1024 ≈ 0.000229 GB → × 0.118 × 60 个月 ≈ 0.001622 元
 *  - 上传写请求：标准存储写请求 0.01 元/万次 → 1 ÷ 10000 × 0.01 ≈ 0.000001 元
 *  - 查看下行流量：外网下行 0.5 元/GB → 0.000229 × 0.5 × 3 次 ≈ 0.000343 元
 *  合计约 0.001966 元，取 0.002 元/张作为成本口径
 * 定价约束：资源包单价不得低于 0.004 元/张（即成本的 2 倍），以确保利润率 ≥ 100%
 */
export const PHOTO_UNIT_COST = 0.002

/** 照片资源包（按张数购买，面向机构客户，单价均远高于 100% 利润率下限） */
const initPacks: PhotoResourcePack[] = [
  {
    key: 'p1k', name: '体验包', photos: 1000, price: 29, recommended: false,
    desc: '适合单设备试用与小规模验证，约可覆盖 1~2 个月的按键抓拍量',
  },
  {
    key: 'p5k', name: '标准包', photos: 5000, price: 129, recommended: true,
    desc: '适合中小型机构，约可覆盖 10~20 台设备一年的抓拍量',
  },
  {
    key: 'p20k', name: '专业包', photos: 20000, price: 399, recommended: false,
    desc: '适合中型机构多设备长期留存，单价更优',
  },
  {
    key: 'p100k', name: '机构包', photos: 100000, price: 1599, recommended: false,
    desc: '适合连锁机构集中采购，可跨设备与组织共享额度，单价最优',
  },
]

/** 距今天数 */
function daysSince(time: string): number {
  const t = new Date(time.replace(/-/g, '/')).getTime()
  return Math.max(0, Math.floor((Date.now() - t) / 86400000))
}

/** 生成 N 天前的时间字符串（HH:mm:ss 沿用传入值） */
function daysAgoTime(days: number, clock: string): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${clock}`
}

/** 补齐容量字段（mock 数据只需维护业务字段与"几天前"） */
function withStorage(
  records: (Omit<GpsPhotoRecord, 'sizeKB' | 'capturedAt'> & {
    daysAgo: number
    clock: string
  })[],
): GpsPhotoRecord[] {
  return records.map(r => {
    const { daysAgo, clock, ...rest } = r
    return {
      ...rest,
      capturedAt: daysAgoTime(daysAgo, clock),
      sizeKB: 232,
    }
  })
}

// ==========================================
// 按键拍照上报记录（Mock）
// 第一期仅支持设备侧按键拍照，照片均携带拍摄当时的 GPS；
// 平台只接收设备上报的经纬度，不采集逆地理编码后的地点名称；
// 与围栏的关系在读取时按坐标实时判定（同一坐标可同时落在多个围栏内）
// ==========================================
const initPhotos: GpsPhotoRecord[] = withStorage([
  {
    id: 'ph01', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 0, clock: '08:12:30',
    lng: 118.7836, lat: 32.0486, accuracy: 8, battery: 95,
    imageUrl: img('elderly person lying on corridor floor, indoor nursing home hallway, wide angle CCTV style photo, clear daylight, realistic'),
  },
  {
    id: 'ph02', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 0, clock: '09:10:22',
    lng: 118.7896, lat: 32.0542, accuracy: 12, battery: 66,
    imageUrl: img('nursing home nurse inspection record photo, outdoor green belt area beside building, handheld device perspective, daylight, realistic'),
  },
  {
    id: 'ph03', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 0, clock: '09:40:11',
    lng: 118.7912, lat: 32.0560, accuracy: 21, battery: 64,
    imageUrl: img('parking lot boundary outside nursing home fence, empty outdoor area at daytime, handheld camera photo, realistic'),
  },
  {
    id: 'ph04', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 1, clock: '08:00:00',
    lng: 118.7852, lat: 32.0494, accuracy: 6, battery: 82,
    imageUrl: img('elderly man sitting in nursing home room bed, morning light, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph05', deviceId: 'g4', deviceName: '随身看护机-赵奶奶',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    daysAgo: 1, clock: '14:32:05',
    lng: 118.7895, lat: 32.0466, accuracy: 5, battery: 28,
    imageUrl: img('elderly woman resting in nursing home room, afternoon sunlight, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph06', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 2, clock: '16:22:05',
    lng: 118.7861, lat: 32.0501, accuracy: 7, battery: 88,
    imageUrl: img('nursing home activity room with elderly people sitting around table, afternoon, handheld wearable camera photo, realistic'),
  },
  {
    id: 'ph07', deviceId: 'g7', deviceName: '随车记录仪-接送车01',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/后勤车队',
    daysAgo: 2, clock: '10:05:40',
    lng: 118.7798, lat: 32.0425, accuracy: 14, battery: 35,
    imageUrl: img('nursing home shuttle bus interior, empty seats, daylight through windows, handheld camera photo, realistic'),
  },
  {
    id: 'ph08', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 3, clock: '07:45:18',
    lng: 118.7831, lat: 32.0487, accuracy: 6, battery: 90,
    imageUrl: img('elderly man having breakfast in nursing home dining room, morning, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph09', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 3, clock: '11:20:33',
    lng: 118.7856, lat: 32.0521, accuracy: 9, battery: 62,
    imageUrl: img('nursing home corridor inspection, nurse station in background, handheld device photo, realistic'),
  },
  {
    id: 'ph10', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 4, clock: '15:08:50',
    lng: 118.7876, lat: 32.0512, accuracy: 9, battery: 80,
    imageUrl: img('elderly man walking in nursing home garden, morning, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph11', deviceId: 'g4', deviceName: '随身看护机-赵奶奶',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    daysAgo: 4, clock: '19:30:12',
    lng: 118.7895, lat: 32.0466, accuracy: 5, battery: 26,
    imageUrl: img('elderly woman getting out of bed at night in nursing home room, dim night lighting, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph12', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 5, clock: '09:12:44',
    lng: 118.7838, lat: 32.0490, accuracy: 7, battery: 85,
    imageUrl: img('nursing home physiotherapy room, elderly person exercising with therapist, daylight, handheld camera photo, realistic'),
  },
  {
    id: 'ph13', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 5, clock: '13:55:02',
    lng: 118.7904, lat: 32.0553, accuracy: 16, battery: 58,
    imageUrl: img('nursing home north green belt outside building, empty outdoor path, handheld camera photo, realistic'),
  },
  {
    id: 'ph14', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 6, clock: '08:30:17',
    lng: 118.7852, lat: 32.0494, accuracy: 6, battery: 76,
    imageUrl: img('elderly man reading newspaper in nursing home room, morning light, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph15', deviceId: 'g7', deviceName: '随车记录仪-接送车01',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/后勤车队',
    daysAgo: 6, clock: '17:40:26',
    lng: 118.7801, lat: 32.0428, accuracy: 13, battery: 30,
    imageUrl: img('nursing home shuttle bus parked at entrance, evening, handheld camera photo, realistic'),
  },
  {
    id: 'ph16', deviceId: 'g4', deviceName: '随身看护机-赵奶奶',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    daysAgo: 7, clock: '10:15:38',
    lng: 118.7892, lat: 32.0463, accuracy: 5, battery: 40,
    imageUrl: img('elderly woman in nursing home activity room with other residents, daytime, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph17', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 8, clock: '12:00:00',
    lng: 118.7825, lat: 32.0478, accuracy: 6, battery: 74,
    imageUrl: img('elderly person having lunch in nursing home dining hall, food trays, midday, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph18', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 9, clock: '08:22:51',
    lng: 118.7848, lat: 32.0495, accuracy: 10, battery: 70,
    imageUrl: img('nursing home morning shift handover at nurse station, handheld device photo, realistic'),
  },
  {
    id: 'ph19', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 11, clock: '14:05:09',
    lng: 118.7866, lat: 32.0512, accuracy: 8, battery: 68,
    imageUrl: img('elderly man chatting with caregiver in nursing home lounge, afternoon, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph20', deviceId: 'g4', deviceName: '随身看护机-赵奶奶',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    daysAgo: 14, clock: '09:48:33',
    lng: 118.7891, lat: 32.0468, accuracy: 5, battery: 52,
    imageUrl: img('elderly woman doing rehabilitation exercise in nursing home, daytime, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph21', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 18, clock: '16:30:27',
    lng: 118.7834, lat: 32.0489, accuracy: 7, battery: 63,
    imageUrl: img('nursing home recreation room, elderly people playing chess, afternoon light, handheld camera photo, realistic'),
  },
  {
    id: 'ph22', deviceId: 'g6', deviceName: '巡查记录仪-护理员A',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/护理班组',
    daysAgo: 22, clock: '11:12:16',
    lng: 118.7888, lat: 32.0534, accuracy: 12, battery: 55,
    imageUrl: img('nursing home equipment room inspection, maintenance check, handheld device photo, realistic'),
  },
  {
    id: 'ph23', deviceId: 'g1', deviceName: '随身看护机-张爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/3号楼/302房',
    daysAgo: 26, clock: '07:55:41',
    lng: 118.7852, lat: 32.0494, accuracy: 6, battery: 71,
    imageUrl: img('elderly man doing morning stretch beside nursing home window, daylight, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph24', deviceId: 'g7', deviceName: '随车记录仪-接送车01',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/后勤车队',
    daysAgo: 31, clock: '08:20:05',
    lng: 118.7803, lat: 32.0431, accuracy: 15, battery: 44,
    imageUrl: img('nursing home shuttle bus departing parking lot, morning, handheld camera photo, realistic'),
  },
  {
    id: 'ph25', deviceId: 'g4', deviceName: '随身看护机-赵奶奶',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/208房',
    daysAgo: 38, clock: '20:14:52',
    lng: 118.7895, lat: 32.0466, accuracy: 5, battery: 33,
    imageUrl: img('elderly woman watching television in nursing home room, evening, wearable camera snapshot, realistic'),
  },
  {
    id: 'ph26', deviceId: 'g3', deviceName: '随身看护机-王爷爷',
    orgPathLabel: '鹤梦养老/江苏南京/新街口照护中心/2号楼/201房',
    daysAgo: 45, clock: '10:36:19',
    lng: 118.7831, lat: 32.0487, accuracy: 6, battery: 59,
    imageUrl: img('elderly man receiving medical checkup in nursing home clinic room, daytime, wearable camera snapshot, realistic'),
  },
])

/** 围栏类型显示 */
export const GEOFENCE_TYPE_LABELS: Record<Geofence['type'], { label: string; color: string; desc: string }> = {
  safe: { label: '安全区', color: 'green', desc: '离开该区域触发走失风险告警' },
  danger: { label: '危险区', color: 'red', desc: '进入该区域触发闯入告警' },
  custom: { label: '自定义区域', color: 'blue', desc: '触发规则自行勾选，适用于任意管控范围' },
}

/** 设备能力显示 */
export const GPS_CAPABILITY_LABELS: Record<keyof GpsDevice['capabilities'], string> = {
  buttonCapture: '设备侧按键拍照',
  sosButton: 'SOS 一键求助',
  autoCapture: '定时/事件自动上报',
  geofence: '电子围栏',
  voiceCall: '双向语音对讲',
}

/** 联网方式显示名 */
export const GPS_NETWORK_LABELS: Record<GpsDevice['network'], string> = {
  wifi: 'WiFi',
  cellular: '移动网络',
}

// ==========================================
// Store
// ==========================================
export const useGpsStore = defineStore('gps', {
  state: () => ({
    devices: [...initDevices] as GpsDevice[],
    geofences: [...initGeofences] as Geofence[],
    photos: [...initPhotos] as GpsPhotoRecord[],
    trails: JSON.parse(JSON.stringify(initTrails)) as Record<string, GpsTrailPoint[]>,
    /** 可购买的照片资源包 */
    photoPacks: [...initPacks] as PhotoResourcePack[],
    /** 已购买的资源包订单 */
    photoOrders: [] as PhotoQuotaOrder[],
  }),

  getters: {
    /** 支持设备侧按键拍照的设备 */
    buttonCapableDevices: (state) => state.devices.filter(d => d.capabilities.buttonCapture),
    /** 在线设备 */
    onlineDevices: (state) => state.devices.filter(d => d.status === 'online'),
    /** 低电量设备（<20%） */
    lowBatteryDevices: (state) => state.devices.filter(d => d.battery < 20),
    /** 已启用围栏 */
    enabledGeofences: (state) => state.geofences.filter(g => g.enabled),
    deviceOptions: (state) => state.devices.map(d => ({ value: d.id, label: d.name })),

    // ==================== 围栏归属（按坐标实时判定） ====================
    /**
     * 某坐标点所属的围栏列表。
     * 同一坐标可能同时落在多个围栏内（围栏交叉/嵌套），因此返回的是列表而非单一状态。
     */
    fencesAtPoint: (state) => (point: GeoPoint) =>
      state.geofences.filter(f => f.enabled && isPointInPolygon(point, f.points)),

    // ==================== 照片存储额度（企业级，全设备共享） ====================
    /** 购买资源包累计获得的张数 */
    purchasedPhotos: (state) =>
      state.photoOrders.reduce((s, o) => s + o.photos, 0),
    /** 企业可用总张数（初始额度 + 已购资源包） */
    totalPhotoQuota: (state): number =>
      FREE_PHOTO_QUOTA + state.photoOrders.reduce((s, o) => s + o.photos, 0),
    /** 已使用张数 */
    usedPhotoQuota: (state): number => state.photos.length,
    /** 剩余可用张数 */
    remainingPhotoQuota(): number {
      return Math.max(0, this.totalPhotoQuota - this.usedPhotoQuota)
    },
    /** 额度是否已用尽（用尽后停止接收上报） */
    quotaExhausted(): boolean {
      return this.remainingPhotoQuota <= 0
    },
    /** 额度使用比例（%） */
    quotaPercent(): number {
      if (!this.totalPhotoQuota) return 100
      return Math.min(100, Math.round((this.usedPhotoQuota / this.totalPhotoQuota) * 100))
    },
    /** 照片累计占用容量（MB） */
    photoTotalMB: (state) =>
      +(state.photos.reduce((s, p) => s + p.sizeKB, 0) / 1024).toFixed(2),
  },

  actions: {
    addGeofence(fence: Geofence) {
      this.geofences.unshift(fence)
      // 同步围栏与设备的多对多关系
      for (const id of fence.deviceIds) {
        const dev = this.devices.find(d => d.id === id)
        if (dev && !dev.geofenceIds.includes(fence.id)) dev.geofenceIds.push(fence.id)
      }
    },
    updateGeofence(id: string, patch: Partial<Geofence>) {
      const idx = this.geofences.findIndex(g => g.id === id)
      if (idx < 0) return
      const prev = this.geofences[idx]
      const next = { ...prev, ...patch }
      // 设备绑定关系变化时同步更新设备侧
      if (patch.deviceIds) {
        for (const dev of this.devices) {
          const had = prev.deviceIds.includes(dev.id)
          const has = patch.deviceIds.includes(dev.id)
          if (had && !has) dev.geofenceIds = dev.geofenceIds.filter(gid => gid !== id)
          if (!had && has && !dev.geofenceIds.includes(id)) dev.geofenceIds.push(id)
        }
      }
      this.geofences[idx] = next
    },
    removeGeofence(id: string) {
      this.geofences = this.geofences.filter(g => g.id !== id)
      for (const dev of this.devices) dev.geofenceIds = dev.geofenceIds.filter(gid => gid !== id)
    },
    toggleGeofence(id: string, enabled: boolean) {
      const g = this.geofences.find(x => x.id === id)
      if (g) g.enabled = enabled
    },
    addPhoto(record: GpsPhotoRecord) {
      this.photos.unshift(record)
    },
    removePhoto(id: string) {
      this.photos = this.photos.filter(p => p.id !== id)
    },
    updateDevice(id: string, patch: Partial<GpsDevice>) {
      const d = this.devices.find(x => x.id === id)
      if (d) Object.assign(d, patch)
    },
    /** 购买照片资源包，额度立即到账，并留下一条购买记录 */
    buyPhotoPack(key: string, payMethod = '支付宝') {
      const pack = this.photoPacks.find(p => p.key === key)
      if (!pack) return
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
      this.photoOrders.unshift({
        id: `po${d.getTime()}`,
        orderNo: `ORD${stamp}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`,
        buyer: CURRENT_OPERATOR,
        payTime: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
        payMethod,
        serviceName: `存储资源包 · ${pack.name}（${pack.photos.toLocaleString()} 张）`,
        amount: pack.price,
        photos: pack.photos,
      })
    },
    /** 新增照片上报记录；额度用尽时拒绝接收（返回 false） */
    receivePhoto(record: GpsPhotoRecord): boolean {
      if (this.remainingPhotoQuota <= 0) return false
      this.photos.unshift(record)
      return true
    },
  },
})
