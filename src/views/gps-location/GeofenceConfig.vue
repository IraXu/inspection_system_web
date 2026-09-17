<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message, Modal } from 'antdv-next'
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  EnvironmentOutlined, InfoCircleOutlined, RightOutlined,
  UndoOutlined, RedoOutlined, BorderOuterOutlined,
  FullscreenOutlined, CompressOutlined, CheckOutlined, MinusCircleOutlined,
  WarningOutlined,
} from '@antdv-next/icons'
import type { Geofence, GeoPoint, GeofenceType, GeofenceRule, GpsDevice } from '@/types'
import GpsMapCanvas from '@/components/GpsMapCanvas.vue'
import BatteryIcon from '@/components/BatteryIcon.vue'
import GpsFilterBar from '@/components/GpsFilterBar.vue'
import {
  useGpsStore, GEOFENCE_TYPE_LABELS, isPointInPolygon, polygonAreaSqMeters, isSelfIntersecting,
} from '@/stores/gps'

const gpsStore = useGpsStore()
const route = useRoute()

// ==================== 列表筛选 ====================
const filterName = ref('')
const filterType = ref<string>('')
const filterEnabled = ref<string>('')
const activeName = ref('')
const activeType = ref('')
const activeEnabled = ref('')

const handleSearch = () => {
  activeName.value = filterName.value
  activeType.value = filterType.value
  activeEnabled.value = filterEnabled.value
}
const handleReset = () => {
  filterName.value = ''; filterType.value = ''; filterEnabled.value = ''
  activeName.value = ''; activeType.value = ''; activeEnabled.value = ''
}

const filteredFences = computed(() => {
  let list = gpsStore.geofences
  if (activeName.value) list = list.filter(f => f.name.includes(activeName.value))
  if (activeType.value) list = list.filter(f => f.type === activeType.value)
  if (activeEnabled.value) list = list.filter(f => f.enabled === (activeEnabled.value === 'on'))
  return list
})

const focusedFenceId = ref<string | null>(null)
const focusedFence = computed(() =>
  gpsStore.geofences.find(f => f.id === focusedFenceId.value) || null)

/** 地图仅高亮展示聚焦围栏，避免围栏过多互相遮挡 */
const mapGeofences = computed(() =>
  focusedFence.value ? [focusedFence.value] : gpsStore.geofences)

const fenceArea = (f: Geofence) => {
  const m2 = polygonAreaSqMeters(f.points)
  return m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} 万㎡` : `${Math.round(m2)} ㎡`
}

/** 生效日期 + 时段的文字回显，列表与表单共用同一套口径 */
function formatSchedule(rule: Pick<GeofenceRule, 'weekdays' | 'timeStart' | 'timeEnd'>) {
  const days = [...rule.weekdays].sort((a, b) => a - b)
  const week = days.length === 0
    ? '未设置'
    : days.length === 7
      ? '每天'
      : days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))
        ? '工作日'
        : `周${days.map(d => weekdayOptions[d - 1]?.label.slice(1) ?? d).join('、')}`
  const time = rule.timeStart === '00:00' && rule.timeEnd === '23:59'
    ? '全天'
    : `${rule.timeStart}~${rule.timeEnd}`
  return `${week} ${time}`
}

function formatRule(rule: GeofenceRule) {
  const parts: string[] = []
  if (rule.enter) parts.push('进入触发')
  if (rule.exit) parts.push('离开触发')
  if (!parts.length) parts.push('仅统计')
  return `${parts.join(' + ')} · ${formatSchedule(rule)}`
}

const fenceRuleText = (f: Geofence) => formatRule(f.rule)

/** 聚焦围栏内的设备实况 */
const fenceDevices = computed(() => {
  if (!focusedFence.value) return []
  const f = focusedFence.value
  return gpsStore.devices
    .filter(d => f.deviceIds.includes(d.id))
    .map(d => ({ ...d, inside: isPointInPolygon({ lng: d.lng, lat: d.lat }, f.points) }))
})

const fenceStat = computed(() => {
  const rows = fenceDevices.value
  return { total: rows.length, inside: rows.filter(r => r.inside).length, outside: rows.filter(r => !r.inside).length }
})

// ==================== 绑定设备明细：量大时用抽屉承载 ====================
/** 信息条内最多预览的设备数，超出走「查看全部」 */
const PREVIEW_LIMIT = 6
const previewDevices = computed(() => fenceDevices.value.slice(0, PREVIEW_LIMIT))
const hiddenDeviceCount = computed(() => Math.max(0, fenceDevices.value.length - PREVIEW_LIMIT))

const deviceDrawerVisible = ref(false)
const drawerSearchText = ref('')
const deviceStatusFilter = ref<string>('')
const devicePage = reactive({ current: 1, pageSize: 20 })

/** 抽屉内的筛选结果 */
const drawerDevices = computed(() => {
  let list = fenceDevices.value
  const kw = drawerSearchText.value.trim()
  if (kw) list = list.filter(d => d.name.includes(kw) || d.license.includes(kw))
  if (deviceStatusFilter.value === 'inside') list = list.filter(d => d.inside)
  if (deviceStatusFilter.value === 'outside') list = list.filter(d => !d.inside)
  return list
})

const pagedDrawerDevices = computed(() => {
  const start = (devicePage.current - 1) * devicePage.pageSize
  return drawerDevices.value.slice(start, start + devicePage.pageSize)
})

const openDeviceDrawer = () => {
  drawerSearchText.value = ''
  deviceStatusFilter.value = ''
  devicePage.current = 1
  deviceDrawerVisible.value = true
}

/** 筛选变化后回到第一页 */
watch([drawerSearchText, deviceStatusFilter], () => { devicePage.current = 1 })

const deviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
  { title: 'License', dataIndex: 'license', key: 'license', width: 150 },
  { title: '位置判定', key: 'inside', width: 100 },
  { title: '最新上报位置（GPS）', key: 'gps', width: 220 },
  { title: '上报时间', dataIndex: 'lastReportAt', key: 'lastReportAt', width: 160 },
  { title: '电量', key: 'battery', width: 90 },
]

const drawerStatusColor: Record<string, string> = { online: 'green', offline: 'red', sleep: 'orange' }
const drawerStatusLabel: Record<string, string> = { online: '在线', offline: '离线', sleep: '休眠中' }

const toggleEnabled = (f: Geofence, val: boolean) => {
  gpsStore.toggleGeofence(f.id, val)
  message.success(`${f.name} 已${val ? '启用' : '停用'}`)
}

const removeFence = (f: Geofence) => {
  Modal.confirm({
    title: `确认删除围栏「${f.name}」？`,
    content: '删除后该围栏的进出告警规则将同时失效，设备绑定关系会被解除。',
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk: () => {
      gpsStore.removeGeofence(f.id)
      if (focusedFenceId.value === f.id) focusedFenceId.value = null
      message.success('围栏已删除')
    },
  })
}

// ==================== 绘制编辑器（全屏） ====================
const editorVisible = ref(false)
const editorFullscreen = ref(true)
const formMode = ref<'add' | 'edit'>('add')
const editId = ref<string | null>(null)

interface FenceForm {
  name: string
  type: GeofenceType
  deviceIds: string[]
  enabled: boolean
  remark: string
  rule: { enter: boolean; exit: boolean; timeStart: string; timeEnd: string; weekdays: number[] }
}

/** 安全区/危险区有固定语义，切换时纠正为对应的触发规则；自定义区域交由用户勾选 */
const normalizeRuleByType = (t: GeofenceType, rule: FenceForm['rule']): FenceForm['rule'] => {
  if (t === 'safe') return { ...rule, enter: false, exit: true }
  if (t === 'danger') return { ...rule, enter: true, exit: false }
  return { ...rule }
}

const emptyForm = (): FenceForm => ({
  name: '', type: 'safe', deviceIds: [], enabled: true, remark: '',
  rule: { enter: false, exit: true, timeStart: '00:00', timeEnd: '23:59', weekdays: [1, 2, 3, 4, 5, 6, 7] },
})

const fenceForm = reactive<FenceForm>(emptyForm())
const draftPoints = ref<GeoPoint[]>([])
/** 顶点历史栈，支持撤销/重做 */
const history = ref<GeoPoint[][]>([])
const redoStack = ref<GeoPoint[][]>([])

const pushHistory = () => {
  history.value.push(draftPoints.value.map(p => ({ ...p })))
  if (history.value.length > 60) history.value.shift()
  redoStack.value = []
}

const setDraft = (pts: GeoPoint[], record = true) => {
  if (record) pushHistory()
  draftPoints.value = pts
}

const undo = () => {
  if (!history.value.length) return
  redoStack.value.push(draftPoints.value.map(p => ({ ...p })))
  draftPoints.value = history.value.pop()!
}

const redo = () => {
  if (!redoStack.value.length) return
  history.value.push(draftPoints.value.map(p => ({ ...p })))
  draftPoints.value = redoStack.value.pop()!
}

const clearPoints = () => {
  if (!draftPoints.value.length) return
  setDraft([])
  message.info('已清空围栏顶点')
}

const undoLastPoint = () => {
  if (!draftPoints.value.length) return
  setDraft(draftPoints.value.slice(0, -1))
}

const draftArea = computed(() => polygonAreaSqMeters(draftPoints.value))

/** 草稿边界是否自相交（存在交叉边） */
const draftCrossing = computed(() =>
  draftPoints.value.length >= 4 && isSelfIntersecting(draftPoints.value))

/** 顶点数不足/未勾选触发规则时给出明确原因，避免"确认按钮点了没反应" */
const canSubmit = computed(() =>
  !!fenceForm.name.trim() && draftPoints.value.length >= 3
  && !draftCrossing.value && fenceForm.deviceIds.length > 0
  && fenceForm.rule.weekdays.length > 0
  && (fenceForm.type !== 'custom' || fenceForm.rule.enter || fenceForm.rule.exit))

const submitHint = computed(() => {
  if (!fenceForm.name.trim()) return '请填写围栏名称'
  if (draftPoints.value.length < 3) return `还需在地图上放置 ${3 - draftPoints.value.length} 个顶点（至少 3 个）`
  if (draftCrossing.value) return '围栏边界存在交叉，请调整顶点顺序后再保存'
  if (!fenceForm.deviceIds.length) return '请至少绑定一台设备'
  if (!fenceForm.rule.weekdays.length) return '请至少选择一个生效日期'
  if (fenceForm.type === 'custom' && !fenceForm.rule.enter && !fenceForm.rule.exit) {
    return '自定义区域请至少勾选一个触发规则（进入 / 离开）'
  }
  return ''
})

const showAdd = () => {
  Object.assign(fenceForm, emptyForm())
  draftPoints.value = []
  history.value = []
  redoStack.value = []
  formMode.value = 'add'
  editId.value = null
  editorVisible.value = true
}

const showEdit = (f: Geofence) => {
  Object.assign(fenceForm, {
    name: f.name,
    type: f.type,
    deviceIds: [...f.deviceIds],
    enabled: f.enabled,
    remark: f.remark,
    rule: { ...f.rule, weekdays: [...f.rule.weekdays] },
  })
  draftPoints.value = f.points.map(p => ({ ...p }))
  history.value = []
  redoStack.value = []
  formMode.value = 'edit'
  editId.value = f.id
  editorVisible.value = true
}

/** 地图顶点变更（新增/拖动），整体记入历史 */
const onDraftChange = (pts: GeoPoint[]) => {
  const grew = pts.length > draftPoints.value.length
  if (grew) pushHistory()
  draftPoints.value = pts
}

/** 顶点表格中的经纬度可直接编辑 */
const updatePoint = (idx: number, key: 'lng' | 'lat', val: string) => {
  const num = Number(val)
  if (Number.isNaN(num)) return
  const next = draftPoints.value.map(p => ({ ...p }))
  next[idx][key] = num
  draftPoints.value = next
}

const removePoint = (idx: number) => {
  setDraft(draftPoints.value.filter((_, i) => i !== idx))
}

const handleSubmit = () => {
  if (!canSubmit.value) { message.warning(submitHint.value); return }
  const dup = gpsStore.geofences.some(f => f.name === fenceForm.name.trim() && f.id !== editId.value)
  if (dup) { message.warning('围栏名称已存在，请修改'); return }

  const payload: Geofence = {
    id: editId.value ?? `gf${Date.now()}`,
    name: fenceForm.name.trim(),
    type: fenceForm.type,
    deviceIds: [...fenceForm.deviceIds],
    points: draftPoints.value.map(p => ({ ...p })),
    enabled: fenceForm.enabled,
    rule: { ...fenceForm.rule, weekdays: [...fenceForm.rule.weekdays] },
    remark: fenceForm.remark.trim(),
    createdAt: editId.value
      ? (gpsStore.geofences.find(f => f.id === editId.value)?.createdAt ?? '')
      : new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
  }

  if (formMode.value === 'add') {
    gpsStore.addGeofence(payload)
    message.success('围栏创建成功，已下发至绑定设备')
  } else {
    gpsStore.updateGeofence(payload.id, payload)
    message.success('围栏更新成功')
  }
  focusedFenceId.value = payload.id
  editorVisible.value = false
}

// ==================== 选项 ====================
const typeOptions = (Object.keys(GEOFENCE_TYPE_LABELS) as GeofenceType[]).map(k => ({
  value: k,
  label: GEOFENCE_TYPE_LABELS[k].label,
  desc: GEOFENCE_TYPE_LABELS[k].desc,
  color: k === 'safe' ? '#52c41a' : k === 'danger' ? '#ff4d4f' : '#1677ff',
}))
const typeSelectOptions = typeOptions.map(t => ({ value: t.value, label: t.label }))
const enabledOptions = [
  { value: 'on', label: '已启用' },
  { value: 'off', label: '已停用' },
]
const weekdayOptions = [
  { value: 1, label: '周一' }, { value: 2, label: '周二' }, { value: 3, label: '周三' },
  { value: 4, label: '周四' }, { value: 5, label: '周五' }, { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

/** 支持电子围栏能力的设备数（用于表单提示） */
const geofenceCapableCount = computed(() =>
  gpsStore.devices.filter(d => d.capabilities.geofence).length)

/** 设备树节点（组织架构 → 设备） */
interface DeviceTreeNode {
  title: string
  value: string
  key: string
  disabled?: boolean
  children?: DeviceTreeNode[]
}

/**
 * 按设备的 orgPathLabel 还原组织架构树，叶子节点为设备本身。
 * 组织节点仅用于分类与批量勾选，设备 id 才是最终绑定值。
 */
const deviceTreeData = computed(() => {
  const roots: DeviceTreeNode[] = []
  const nodeMap = new Map<string, DeviceTreeNode>()

  gpsStore.devices.forEach(d => {
    const parts = d.orgPathLabel.split('/').filter(Boolean)
    let parentPath = ''
    let siblings = roots
    parts.forEach(part => {
      const path = parentPath ? `${parentPath}/${part}` : part
      let node = nodeMap.get(path)
      if (!node) {
        node = { title: part, value: `org:${path}`, key: `org:${path}`, children: [] }
        nodeMap.set(path, node)
        siblings.push(node)
      }
      parentPath = path
      siblings = node.children!
    })
    siblings.push({
      title: d.name,
      value: d.id,
      key: d.id,
      disabled: !d.capabilities.geofence,
    })
  })

  return roots
})

/** 勾选组织节点时会带出组织 key，这里只保留真正的设备 id */
const onDeviceTreeChange = (vals: unknown) => {
  const ids = new Set(gpsStore.devices.map(d => d.id))
  fenceForm.deviceIds = (vals as string[]).filter(v => ids.has(v))
}

// ==================== 生效日期 ====================
/** 周一~周日全选即为「每天」，无需单独的「每天」开关 */

const toggleWeekday = (d: number) => {
  const days = fenceForm.rule.weekdays
  const idx = days.indexOf(d)
  if (idx >= 0) days.splice(idx, 1)
  else days.push(d)
  fenceForm.rule.weekdays = [...days].sort((a, b) => a - b)
}

/** 生效规则的文字回显，帮助用户确认配置结果 */
const ruleTextHint = computed(() =>
  fenceForm.rule.weekdays.length
    ? `生效范围：${formatSchedule(fenceForm.rule)}`
    : '未选择生效日期，该围栏不会触发')

// 切换围栏类型时自动纠正触发规则（安全区=离开/危险区=进入）
watch(() => fenceForm.type, (t) => {
  fenceForm.rule = normalizeRuleByType(t, fenceForm.rule)
})

// 从设备管理跳转时定位其绑定围栏
onMounted(() => {
  const license = String(route.query.license || '')
  if (!license) return
  const device = gpsStore.devices.find(d => d.license === license)
  if (!device) return
  const target = gpsStore.geofences.find(g => device.geofenceIds.includes(g.id))
  if (target) {
    focusedFenceId.value = target.id
    message.info(`已定位到设备「${device.name}」绑定的围栏：${target.name}`)
  } else {
    message.info(`设备「${device.name}」暂未绑定围栏，可新建围栏后绑定该设备`)
  }
})
</script>

<template>
  <div class="gf-page">
    <!-- ==================== 顶部工具栏 ==================== -->
    <header class="gf-bar">
      <div class="gf-bar-left">
        <h3 class="gf-bar-title"><BorderOuterOutlined /> 电子围栏</h3>
        <span class="gf-bar-sub">共 {{ gpsStore.geofences.length }} 个围栏，其中 {{ gpsStore.enabledGeofences.length }} 个已启用</span>
      </div>
      <a-button type="primary" @click="showAdd"><template #icon><PlusOutlined /></template>新建围栏</a-button>
    </header>

    <div class="gf-filter">
      <GpsFilterBar @search="handleSearch" @reset="handleReset">
        <a-input v-model:value="filterName" placeholder="围栏名称" style="width:200px" allow-clear @pressEnter="handleSearch">
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="filterType" placeholder="围栏类型" style="width:160px" allow-clear :options="typeSelectOptions" />
        <a-select v-model:value="filterEnabled" placeholder="启用状态" style="width:150px" allow-clear :options="enabledOptions" />
      </GpsFilterBar>
    </div>

    <!-- ==================== 主体：地图 + 右侧围栏列表 ==================== -->
    <div class="gf-main">
      <!-- 地图区 -->
      <section class="gf-map-card">
        <div class="gf-card-head">
          <span class="gf-card-title"><EnvironmentOutlined /> 围栏地图</span>
          <span class="gf-card-sub">
            {{ focusedFence ? `聚焦：${focusedFence.name}` : '点击右侧围栏可在图上聚焦查看' }}
          </span>
        </div>
        <GpsMapCanvas
          :devices="gpsStore.devices"
          :geofences="mapGeofences"
          :selected-device-id="null"
          :height="'100%'"
          class="gf-map"
        />
        <!-- 聚焦围栏信息条 -->
        <div v-if="focusedFence" class="gf-map-info">
          <div class="gf-info-head">
            <span class="gf-info-name">{{ focusedFence.name }}</span>
            <a-tag :color="GEOFENCE_TYPE_LABELS[focusedFence.type].color" class="gf-mini-tag">
              {{ GEOFENCE_TYPE_LABELS[focusedFence.type].label }}
            </a-tag>
            <a-tag :color="focusedFence.enabled ? 'green' : 'default'" class="gf-mini-tag">
              {{ focusedFence.enabled ? '已启用' : '已停用' }}
            </a-tag>
            <button class="gf-info-close" @click="focusedFenceId = null">收起</button>
          </div>
          <div class="gf-info-meta">
            <span>{{ GEOFENCE_TYPE_LABELS[focusedFence.type].desc }}</span>
            <span class="gf-dot">·</span>
            <span>覆盖 {{ fenceArea(focusedFence) }}</span>
            <span class="gf-dot">·</span>
            <span>{{ fenceRuleText(focusedFence) }}</span>
          </div>
          <div class="gf-info-stat">
            <button v-if="fenceStat.total" class="gf-stat-chip gf-stat-link" @click="openDeviceDrawer">
              绑定设备 <b>{{ fenceStat.total }}</b>
              <RightOutlined class="gf-chip-arrow" />
            </button>
            <span v-else class="gf-stat-chip">
              绑定设备 <b>0</b>
            </span>
            <span class="gf-stat-chip ok">
              围栏内 <b>{{ fenceStat.inside }}</b>
            </span>
            <span class="gf-stat-chip warn">
              围栏外 <b>{{ fenceStat.outside }}</b>
            </span>
          </div>
          <!-- 设备预览：最多 6 个，避免绑定大量设备时信息条被撑爆 -->
          <div v-if="previewDevices.length" class="gf-dev-chips">
            <a-tag
              v-for="d in previewDevices" :key="d.id"
              :color="d.inside ? 'green' : 'orange'"
              class="gf-mini-tag"
            >{{ d.name }}{{ d.inside ? '' : '（区外）' }}</a-tag>
            <button v-if="hiddenDeviceCount" class="gf-more-pill" @click="openDeviceDrawer">
              +{{ hiddenDeviceCount }}
            </button>
          </div>
          <div v-if="focusedFence.remark" class="gf-info-remark">{{ focusedFence.remark }}</div>
        </div>
      </section>

      <!-- 围栏列表区（卡片式） -->
      <aside class="gf-list-card">
        <div class="gf-card-head">
          <span class="gf-card-title">围栏列表 <b>{{ filteredFences.length }}</b></span>
        </div>
        <div class="gf-list-body">
          <div
            v-for="f in filteredFences"
            :key="f.id"
            class="gf-item"
            :class="{ active: focusedFenceId === f.id }"
            @click="focusedFenceId = f.id"
          >
            <div class="gf-item-head">
              <span
                class="gf-item-dot"
                :style="{ background: f.type === 'safe' ? '#52c41a' : f.type === 'danger' ? '#ff4d4f' : '#1677ff' }"
              />
              <span class="gf-item-name">{{ f.name }}</span>
              <span class="gf-item-switch" @click.stop>
                <a-switch :checked="f.enabled" size="small" @change="(v: boolean) => toggleEnabled(f, v)" />
              </span>
            </div>
            <div class="gf-item-tags">
              <a-tag :color="GEOFENCE_TYPE_LABELS[f.type].color" class="gf-mini-tag">
                {{ GEOFENCE_TYPE_LABELS[f.type].label }}
              </a-tag>
              <a-tag class="gf-mini-tag">{{ f.deviceIds.length }} 台设备</a-tag>
              <a-tag class="gf-mini-tag">{{ fenceArea(f) }}</a-tag>
            </div>
            <div class="gf-item-rule">{{ fenceRuleText(f) }}</div>
            <div class="gf-item-remark">{{ f.remark || '—' }}</div>
            <div class="gf-item-foot">
              <span class="gf-item-vertex">{{ f.points.length }} 个顶点</span>
              <a class="gf-link" @click.stop="showEdit(f)"><EditOutlined /> 编辑围栏</a>
              <a class="gf-link-danger" @click.stop="removeFence(f)"><DeleteOutlined /> 删除</a>
            </div>
          </div>
          <a-empty v-if="!filteredFences.length" description="暂无围栏" :image-style="{ height: '48px' }" />
        </div>
        <div class="gf-list-tip">
          <InfoCircleOutlined />
          <span>安全区在「离开」时告警（防走失），危险区在「进入」时告警（防闯入），自定义区域可自行勾选触发规则。</span>
        </div>
      </aside>
    </div>

    <!-- ==================== 围栏编辑器（全屏精细绘制） ==================== -->
    <a-modal
      v-model:open="editorVisible"
      :footer="null"
      :closable="false"
      :width="editorFullscreen ? '100vw' : 1180"
      :wrap-class-name="editorFullscreen ? 'gf-editor-fullscreen' : 'gf-editor-window'"
      :style="editorFullscreen ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : { top: '40px' }"
      :destroy-on-hidden="true"
    >
      <div class="gfe" :class="{ full: editorFullscreen }">
        <!-- 编辑器头部 -->
        <div class="gfe-head">
          <div class="gfe-head-left">
            <span class="gfe-title">{{ formMode === 'add' ? '新建电子围栏' : '编辑电子围栏' }}</span>
            <span class="gfe-step">
              在地图上绘制围栏边界 —— 当前
              <b :class="{ bad: draftPoints.length < 3 }">{{ draftPoints.length }}</b> 个顶点
            </span>
          </div>
          <div class="gfe-head-right">
            <button class="gfe-icon-btn" :title="editorFullscreen ? '退出全屏' : '全屏绘制'" @click="editorFullscreen = !editorFullscreen">
              <CompressOutlined v-if="editorFullscreen" />
              <FullscreenOutlined v-else />
            </button>
            <button class="gfe-icon-btn" title="关闭" @click="editorVisible = false">✕</button>
          </div>
        </div>

        <!-- 编辑器主体：地图 + 表单 -->
        <div class="gfe-body" :class="{ full: editorFullscreen }">
          <!-- 左：绘制区 -->
          <div class="gfe-canvas-col">
            <div class="gfe-canvas-tools">
              <div class="gfe-tool-group">
                <a-button size="small" :disabled="!draftPoints.length" @click="undoLastPoint">
                  <template #icon><MinusCircleOutlined /></template>退一个点
                </a-button>
                <a-button size="small" :disabled="!history.length" @click="undo">
                  <template #icon><UndoOutlined /></template>撤销
                </a-button>
                <a-button size="small" :disabled="!redoStack.length" @click="redo">
                  <template #icon><RedoOutlined /></template>重做
                </a-button>
                <a-button size="small" danger :disabled="!draftPoints.length" @click="clearPoints">清空</a-button>
              </div>
            </div>

            <GpsMapCanvas
              mode="draw"
              :devices="fenceForm.deviceIds.length ? gpsStore.devices.filter(d => fenceForm.deviceIds.includes(d.id)) : gpsStore.devices"
              :geofences="[]"
              :draft-points="draftPoints"
              :height="editorFullscreen ? '100%' : 480"
              :show-poi="true"
              class="gfe-map"
              @update:draft-points="onDraftChange"
            />

            <!-- 顶点坐标精调表 -->
            <div class="gfe-vertex-panel">
              <div class="gfe-vertex-head">
                <span class="gfe-vertex-title">顶点坐标（可精确输入）</span>
                <span class="gfe-vertex-area">
                  <template v-if="draftArea > 0">
                    覆盖面积 {{ draftArea >= 10000 ? (draftArea / 10000).toFixed(2) + ' 万㎡' : Math.round(draftArea) + ' ㎡' }}
                  </template>
                  <template v-else>放置 ≥ 3 个顶点后自动计算面积</template>
                </span>
              </div>
              <div v-if="draftPoints.length" class="gfe-vertex-list">
                <div v-for="(p, i) in draftPoints" :key="i" class="gfe-vertex-row">
                  <span class="gfe-vertex-no" :class="{ first: i === 0 }">{{ i + 1 }}</span>
                  <a-input :value="p.lng" size="small" style="width:132px" @change="(e: any) => updatePoint(i, 'lng', e.target.value)" />
                  <a-input :value="p.lat" size="small" style="width:126px" @change="(e: any) => updatePoint(i, 'lat', e.target.value)" />
                  <a-button size="small" type="text" danger @click="removePoint(i)"><DeleteOutlined /></a-button>
                </div>
              </div>
              <a-empty v-else description="尚未放置顶点" :image-style="{ height: '36px' }" />
            </div>
          </div>

          <!-- 右：属性表单 -->
          <div class="gfe-form-col" :class="{ full: editorFullscreen }">
            <a-form layout="vertical" class="gfe-form">
              <a-form-item label="围栏名称" required>
                <a-input v-model:value="fenceForm.name" placeholder="请输入围栏名称（30字以内）" :maxlength="30" />
              </a-form-item>

              <a-form-item label="围栏类型" required>
                <div class="gfe-types">
                  <div
                    v-for="t in typeOptions"
                    :key="t.value"
                    class="gfe-type"
                    :class="{ active: fenceForm.type === t.value }"
                    :style="fenceForm.type === t.value ? { borderColor: t.color, background: t.color + '12' } : {}"
                    @click="fenceForm.type = t.value"
                  >
                    <span class="gfe-type-dot" :style="{ background: t.color }" />
                    <div class="gfe-type-text">
                      <span class="gfe-type-name">{{ t.label }}</span>
                      <span class="gfe-type-desc">{{ t.desc }}</span>
                    </div>
                    <CheckOutlined v-if="fenceForm.type === t.value" :style="{ color: t.color }" />
                  </div>
                </div>
              </a-form-item>

              <a-form-item label="绑定设备" required>
                <a-tree-select
                  :value="fenceForm.deviceIds"
                  :tree-data="deviceTreeData"
                  :field-names="{ label: 'title', value: 'value', children: 'children' }"
                  tree-checkable
                  multiple
                  show-search
                  tree-node-filter-prop="title"
                  show-checked-strategy="SHOW_CHILD"
                  :max-tag-count="3"
                  tree-default-expand-all
                  placeholder="按组织架构选择需要应用该围栏的设备"
                  style="width:100%"
                  @change="onDeviceTreeChange"
                />
                <div class="gfe-hint">
                  共 {{ gpsStore.devices.length }} 台设备，其中
                  {{ geofenceCapableCount }} 台支持电子围栏；可勾选组织节点批量绑定，不支持围栏的设备已置灰
                </div>
              </a-form-item>

              <a-form-item label="触发规则">
                <div class="gfe-rule-row">
                  <a-checkbox v-model:checked="fenceForm.rule.enter" :disabled="fenceForm.type === 'safe'">进入触发</a-checkbox>
                  <a-checkbox v-model:checked="fenceForm.rule.exit" :disabled="fenceForm.type === 'danger'">离开触发</a-checkbox>
                </div>
                <div class="gfe-hint">
                  {{ fenceForm.type === 'safe' ? '安全区固定在「离开」时告警，防止老人走失'
                    : fenceForm.type === 'danger' ? '危险区固定在「进入」时告警，防止误入风险区域'
                    : '自定义区域可自行勾选「进入」「离开」，两者可同时生效' }}
                </div>
              </a-form-item>

              <a-form-item label="生效时间段">
                <div class="gfe-time-row">
                  <a-time-picker v-model:value="fenceForm.rule.timeStart" value-format="HH:mm" format="HH:mm" size="small" :input-read-only="true" style="width:96px" />
                  <span class="gfe-time-sep">至</span>
                  <a-time-picker v-model:value="fenceForm.rule.timeEnd" value-format="HH:mm" format="HH:mm" size="small" :input-read-only="true" style="width:96px" />
                </div>

                <div class="gfe-week-label">生效日期</div>
                <div class="gfe-week-pills">
                  <button
                    v-for="d in weekdayOptions"
                    :key="d.value"
                    type="button"
                    class="gfe-pill"
                    :class="{ on: fenceForm.rule.weekdays.includes(d.value) }"
                    @click="toggleWeekday(d.value)"
                  >{{ d.label.slice(1) }}</button>
                </div>
                <div class="gfe-hint">{{ ruleTextHint }}</div>
              </a-form-item>

              <a-form-item label="备注说明">
                <a-textarea v-model:value="fenceForm.remark" :rows="4" placeholder="说明该围栏的用途，便于其他管理员理解" :maxlength="120" show-count />
              </a-form-item>

              <a-form-item label="启用状态">
                <a-switch v-model:checked="fenceForm.enabled" checked-children="启用" un-checked-children="停用" />
                <span class="gfe-hint gfe-hint-inline">停用后围栏保留配置但不产生告警</span>
              </a-form-item>

              <div v-if="fenceForm.type === 'danger'" class="gfe-alert">
                <WarningOutlined />
                <span>危险区围栏建议仅绑定成人看护类设备，避免误告警干扰家属。</span>
              </div>
            </a-form>
          </div>
        </div>

        <!-- 编辑器底部 -->
        <div class="gfe-foot">
          <span class="gfe-foot-hint" :class="{ warn: !!submitHint }">
            <InfoCircleOutlined v-if="submitHint" />
            <CheckOutlined v-else />
            {{ submitHint || '信息完整，可以保存并下发至绑定设备' }}
          </span>
          <a-space>
            <a-button @click="editorVisible = false">取消</a-button>
            <a-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
              {{ formMode === 'add' ? '创建并下发' : '保存修改' }}
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
    <!-- ==================== 绑定设备明细抽屉（设备量大时的完整视图） ==================== -->
    <a-drawer
      v-model:open="deviceDrawerVisible"
      :title="`${focusedFence?.name ?? ''} · 绑定设备（${fenceStat.total}）`"
      :size="920"
      :destroy-on-hidden="true"
    >
      <div class="gfd-toolbar-row">
        <a-space :size="12" wrap>
          <a-input v-model:value="drawerSearchText" placeholder="搜索设备名称 / License" style="width:240px" allow-clear>
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-radio-group v-model:value="deviceStatusFilter" option-type="button" button-style="solid" size="small">
            <a-radio-button value="">全部</a-radio-button>
            <a-radio-button value="inside">围栏内</a-radio-button>
            <a-radio-button value="outside">围栏外</a-radio-button>
          </a-radio-group>
        </a-space>
        <span class="gfd-count">共 {{ drawerDevices.length }} 台</span>
      </div>

      <a-table
        :columns="deviceColumns"
        :data-source="pagedDrawerDevices"
        :row-key="(r: GpsDevice & { inside: boolean }) => r.id"
        :pagination="false"
        :scroll="{ x: 900 }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <span class="gfd-dev-name">{{ record.name }}</span>
            <a-tag :color="drawerStatusColor[record.status]" class="gf-mini-tag gfd-status-tag">
              {{ drawerStatusLabel[record.status] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'inside'">
            <a-tag :color="record.inside ? 'green' : 'orange'">{{ record.inside ? '围栏内' : '围栏外' }}</a-tag>
          </template>
          <template v-if="column.key === 'gps'">
            <span class="gfd-gps">{{ record.lng }}, {{ record.lat }}</span>
          </template>
          <template v-if="column.key === 'battery'">
            <span class="gfd-bat" :class="{ 'gfd-low': record.battery < 20 }">
              <BatteryIcon :value="record.battery" :charging="record.charging" :size="13" />{{ record.battery }}%
            </span>
          </template>
        </template>
      </a-table>

      <div class="gfd-pagination">
        <a-pagination
          v-model:current="devicePage.current"
          v-model:pageSize="devicePage.pageSize"
          :total="drawerDevices.length"
          :show-size-changer="true"
          :page-size-options="['20', '50', '100']"
          :show-total="(t: number) => `共 ${t} 台设备`"
        />
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.gf-page { display:flex; flex-direction:column; height:100%; background:#eef2f7; overflow:hidden; }

/* ==================== 顶部工具栏 ==================== */
.gf-bar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:14px 20px 12px; background:#fff; border-bottom:1px solid #e8eef6; flex-shrink:0; }
.gf-bar-left { display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
.gf-bar-title { margin:0; font-size:15px; font-weight:600; color:#1f2937; display:inline-flex; align-items:center; gap:7px; }
.gf-bar-title :deep(.anticon) { color:#1677ff; }
.gf-bar-sub { font-size:12px; color:#94a3b8; }
.gf-filter { padding:12px 20px; background:#fff; border-bottom:1px solid #e8eef6; flex-shrink:0; }

/* ==================== 主体 ==================== */
.gf-main { flex:1; display:flex; gap:12px; padding:12px 20px; overflow:hidden; }
.gf-map-card { position:relative; flex:1; min-width:0; background:#fff; border:1px solid #e8eef6; border-radius:12px; padding:10px 12px 12px; display:flex; flex-direction:column; overflow:hidden; }
.gf-card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:8px; }
.gf-card-title { font-size:13px; font-weight:600; color:#1f2937; display:inline-flex; align-items:center; gap:6px; }
.gf-card-title :deep(.anticon) { color:#1677ff; }
.gf-card-title b { color:#1677ff; }
.gf-card-sub { font-size:12px; color:#94a3b8; }
.gf-map { flex:1; min-height:0; }

.gf-map-info { position:absolute; left:22px; bottom:22px; width:min(560px, 62%); padding:12px 14px; background:rgba(255,255,255,.97); backdrop-filter:blur(6px); border:1px solid #e6edf6; border-radius:12px; box-shadow:0 8px 24px rgba(15,23,42,.12); }
.gf-info-head { display:flex; align-items:center; gap:8px; }
.gf-info-name { font-size:14px; font-weight:600; color:#1f2937; }
.gf-info-close { margin-left:auto; border:none; background:transparent; color:#94a3b8; font-size:12px; cursor:pointer; }
.gf-info-close:hover { color:#1677ff; }
.gf-mini-tag { font-size:10px; line-height:16px; margin:0; padding:0 5px; }
.gf-info-meta { margin-top:6px; font-size:12px; color:#64748b; display:flex; flex-wrap:wrap; gap:6px; }
.gf-dot { color:#cbd5e1; }
.gf-info-stat { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:8px; }
.gf-stat-chip { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#475569; background:#f1f5f9; border:none; border-radius:6px; padding:3px 9px; font-family:inherit; line-height:1.4; }
.gf-stat-chip b { color:#1f2937; font-size:12px; font-weight:600; }
.gf-stat-chip.ok { background:#eafaf0; color:#15803d; }
.gf-stat-chip.ok b { color:#15803d; }
.gf-stat-chip.warn { background:#fff5e8; color:#c2410c; }
.gf-stat-chip.warn b { color:#c2410c; }
/* 可点击的统计胶囊：hover 时才显出箭头与描边，保持极简 */
.gf-stat-link { cursor:pointer; background:#eef4fd; color:#1d4ed8; transition:all .18s; }
.gf-stat-link b { color:#1677ff; }
.gf-stat-link:hover { background:#e0edff; box-shadow:inset 0 0 0 1px #a8cdfd; }
.gf-chip-arrow { font-size:9px; color:#1677ff; opacity:.45; transform:translateX(-1px); transition:all .18s; }
.gf-stat-link:hover .gf-chip-arrow { opacity:1; transform:translateX(1px); }
.gf-dev-chips { display:flex; flex-wrap:wrap; align-items:center; gap:4px; margin-top:8px; }
/* 溢出计数：与标签同高的极简圆形按钮 */
.gf-more-pill { display:inline-flex; align-items:center; justify-content:center; height:20px; min-width:20px; padding:0 7px; border:1px dashed #a8cdfd; border-radius:10px; background:#f7fbff; color:#1677ff; font-size:11px; font-family:inherit; cursor:pointer; transition:all .18s; }
.gf-more-pill:hover { background:#e0edff; border-style:solid; }

/* 绑定设备抽屉 */
.gfd-toolbar-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
.gfd-count { font-size:12px; color:#8c8c8c; }
.gfd-dev-name { font-size:13px; color:#1f2937; font-weight:500; }
.gfd-status-tag { margin-left:6px; }
.gfd-gps { font-size:12px; color:#1677ff; font-variant-numeric:tabular-nums; }
.gfd-low { color:#ff4d4f; font-weight:600; }
.gfd-bat { display:inline-flex; align-items:center; gap:4px; }
.gfd-pagination { display:flex; justify-content:flex-end; margin-top:14px; }
.gf-info-remark { margin-top:8px; padding-top:8px; border-top:1px dashed #e8eef6; font-size:12px; color:#94a3b8; }

/* ==================== 围栏列表 ==================== */
.gf-list-card { width:352px; flex-shrink:0; background:#fff; border:1px solid #e8eef6; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; }
.gf-list-card .gf-card-head { padding:12px 14px 10px; border-bottom:1px solid #f0f4f9; margin-bottom:0; }
.gf-list-body { flex:1; overflow-y:auto; padding:10px; }
.gf-item { padding:11px 12px; border:1px solid #eceff3; border-radius:10px; margin-bottom:8px; cursor:pointer; transition:all .18s; }
.gf-item:hover { border-color:#a8cdfd; background:#fafcff; }
.gf-item.active { border-color:#1677ff; background:#f4f9ff; box-shadow:0 2px 10px rgba(22,119,255,.1); }
.gf-item-head { display:flex; align-items:center; gap:8px; }
.gf-item-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
.gf-item-name { flex:1; font-size:13px; font-weight:600; color:#1f2937; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gf-item-switch { display:inline-flex; flex-shrink:0; }
.gf-item-tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:7px; }
.gf-item-rule { margin-top:7px; font-size:11.5px; color:#1677ff; }
.gf-item-remark { margin-top:3px; font-size:11px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gf-item-foot { display:flex; align-items:center; gap:12px; margin-top:9px; padding-top:8px; border-top:1px dashed #f0f4f9; font-size:12px; }
.gf-item-vertex { color:#94a3b8; margin-right:auto; font-size:11px; }
.gf-link { color:#1677ff; }
.gf-link-danger { color:#ff4d4f; }
.gf-list-tip { display:flex; align-items:flex-start; gap:6px; padding:10px 14px; background:#f0f7ff; border-top:1px solid #dbeafe; color:#1d4ed8; font-size:11.5px; line-height:1.6; }

/* ==================== 编辑器 ==================== */
.gfe { display:flex; flex-direction:column; height:calc(100vh - 130px); }
.gfe.full { height:100vh; }
.gfe-head { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 20px; border-bottom:1px solid #e8eef6; flex-shrink:0; }
.gfe-head-left { display:flex; align-items:baseline; gap:14px; }
.gfe-title { font-size:16px; font-weight:600; color:#1f2937; }
.gfe-step { font-size:12.5px; color:#64748b; }
.gfe-step b { color:#1677ff; font-size:14px; }
.gfe-step b.bad { color:#fa8c16; }
.gfe-head-right { display:flex; align-items:center; gap:6px; }
.gfe-icon-btn { width:30px; height:30px; border:none; background:transparent; border-radius:8px; color:#64748b; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
.gfe-icon-btn:hover { background:#eff6ff; color:#1677ff; }

.gfe-body { flex:1; display:flex; gap:14px; padding:14px 20px; overflow:hidden; }
.gfe-canvas-col { flex:1; min-width:0; display:flex; flex-direction:column; gap:10px; overflow:hidden; }
.gfe-canvas-tools { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; padding:8px 12px; background:#f7f9fc; border:1px solid #e8eef6; border-radius:10px; flex-shrink:0; }
.gfe-tool-group { display:flex; align-items:center; gap:8px; }
.gfe-map { flex:1; min-height:0; }

.gfe-vertex-panel { flex-shrink:0; max-height:170px; display:flex; flex-direction:column; background:#f7f9fc; border:1px solid #e8eef6; border-radius:10px; padding:9px 12px; overflow:hidden; }
.gfe-vertex-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:7px; }
.gfe-vertex-title { font-size:12.5px; font-weight:600; color:#334155; }
.gfe-vertex-area { font-size:12px; color:#1677ff; font-weight:500; }
.gfe-vertex-list { overflow-y:auto; display:flex; flex-wrap:wrap; gap:7px; }
.gfe-vertex-row { display:flex; align-items:center; gap:6px; background:#fff; border:1px solid #e8eef6; border-radius:8px; padding:3px 6px; }
.gfe-vertex-no { width:20px; height:20px; border-radius:50%; background:#1677ff; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.gfe-vertex-no.first { background:#fff; color:#1677ff; border:1.5px dashed #1677ff; }

.gfe-form-col { width:352px; flex-shrink:0; overflow-y:auto; }
.gfe-form-col.full { width:392px; }
.gfe-form :deep(.ant-form-item) { margin-bottom:14px; }
.gfe-form :deep(.ant-form-item-label > label) { font-size:13px; }
.gfe-types { display:flex; flex-direction:column; gap:7px; }
.gfe-type { display:flex; align-items:flex-start; gap:9px; padding:8px 10px; border:1px solid #e8e8e8; border-radius:8px; cursor:pointer; transition:all .18s; }
.gfe-type:hover { border-color:#a8cdfd; }
.gfe-type-dot { width:9px; height:9px; border-radius:50%; margin-top:5px; flex-shrink:0; }
.gfe-type-text { display:flex; flex-direction:column; gap:2px; flex:1; }
.gfe-type-name { font-size:13px; font-weight:600; color:#1f2937; }
.gfe-type-desc { font-size:11px; color:#94a3b8; line-height:1.45; }
.gfe-hint { font-size:11px; color:#b6c1cd; margin-top:4px; line-height:1.5; }
.gfe-hint-inline { margin-left:10px; }
.gfe-rule-row { display:flex; align-items:center; gap:18px; }
.gfe-time-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.gfe-time-sep { color:#cbd5e1; }
.gfe-week-label { margin-top:10px; font-size:12px; color:#64748b; }

/* 星期选择：胶囊按钮，选中态填充主色，比原生复选框更易点选 */
.gfe-week-pills { display:flex; gap:6px; margin-top:7px; }
.gfe-pill { flex:1; min-width:0; height:30px; padding:0; border:1px solid #dde5ef; border-radius:8px; background:#fff; color:#64748b; font-size:12px; cursor:pointer; transition:all .16s; }
.gfe-pill:hover { border-color:#a8cdfd; color:#1677ff; }
.gfe-pill.on { border-color:#1677ff; background:#1677ff; color:#fff; font-weight:600; box-shadow:0 2px 6px rgba(22,119,255,.24); }
.gfe-alert { display:flex; align-items:flex-start; gap:7px; padding:9px 11px; background:#fff7e6; border:1px solid #ffe0a3; border-radius:8px; color:#c76a00; font-size:11.5px; line-height:1.55; }

.gfe-foot { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 20px; border-top:1px solid #e8eef6; background:#fafbfd; flex-shrink:0; }
.gfe-foot-hint { display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:#16a34a; }
.gfe-foot-hint.warn { color:#fa8c16; }
</style>

<style>
/* 全屏绘制：Modal 铺满视口且去掉默认留白 */
.gf-editor-fullscreen .ant-modal { top:0 !important; max-width:100vw !important; padding-bottom:0 !important; margin:0 !important; }
.gf-editor-fullscreen .ant-modal-content { border-radius:0 !important; height:100vh; display:flex; flex-direction:column; }
.gf-editor-fullscreen .ant-modal-body { flex:1; min-height:0; padding:0 !important; }
.gf-editor-window .ant-modal-body { padding:0 !important; }
</style>
