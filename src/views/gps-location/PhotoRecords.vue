<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message, Modal } from 'antdv-next'
import {
  SearchOutlined, EnvironmentOutlined, DeleteOutlined,
  PictureOutlined, AimOutlined, DownloadOutlined,
  CameraOutlined, CalendarOutlined,
  DatabaseOutlined, HistoryOutlined, FullscreenOutlined,
} from '@antdv-next/icons'
import type { GpsPhotoRecord, Geofence } from '@/types'
import GpsMapCanvas from '@/components/GpsMapCanvas.vue'
import BatteryIcon from '@/components/BatteryIcon.vue'
import GpsFilterBar from '@/components/GpsFilterBar.vue'
import PhotoStoragePlanModal from '@/components/PhotoStoragePlanModal.vue'
import PhotoPurchaseRecordsDrawer from '@/components/PhotoPurchaseRecordsDrawer.vue'
import { useGpsStore } from '@/stores/gps'

const gpsStore = useGpsStore()

// ==================== 围栏归属（按坐标实时判定，可能同时命中多个围栏） ====================
const photoFences = computed(() => {
  const map: Record<string, Geofence[]> = {}
  for (const p of gpsStore.photos) {
    map[p.id] = gpsStore.fencesAtPoint({ lng: p.lng, lat: p.lat })
  }
  return map
})
const fencesOf = (p: GpsPhotoRecord) => photoFences.value[p.id] ?? []

// ==================== 查询条件 ====================
const filterDeviceId = ref<string>('')
const filterFenceId = ref<string>('')

/** 下拉选项（antdv-next 的 a-select 不转发默认插槽，必须用 :options） */
const deviceFilterOptions = computed(() =>
  gpsStore.devices.map(d => ({ value: d.id, label: d.name })))
const fenceFilterOptions = computed(() =>
  gpsStore.geofences.map(f => ({ value: f.id, label: f.name })))
const filterRange = ref<any>(null)
const keyword = ref('')

const activeDeviceId = ref('')
const activeFenceId = ref('')
const activeRange = ref<any>(null)
const activeKeyword = ref('')

const handleSearch = () => {
  activeDeviceId.value = filterDeviceId.value
  activeFenceId.value = filterFenceId.value
  activeRange.value = filterRange.value
  activeKeyword.value = keyword.value.trim()
  page.value = 1
}
const handleReset = () => {
  filterDeviceId.value = ''; filterFenceId.value = ''
  filterRange.value = null; keyword.value = ''
  activeDeviceId.value = ''; activeFenceId.value = ''
  activeRange.value = null; activeKeyword.value = ''
  page.value = 1
}

const filteredPhotos = computed(() => {
  let list = gpsStore.photos
  if (activeDeviceId.value) list = list.filter(p => p.deviceId === activeDeviceId.value)
  if (activeFenceId.value) list = list.filter(p => fencesOf(p).some(f => f.id === activeFenceId.value))
  if (activeKeyword.value) list = list.filter(p => p.deviceName.includes(activeKeyword.value))
  if (activeRange.value && activeRange.value.length === 2) {
    const [s, e] = activeRange.value
    const start = s.format('YYYY-MM-DD HH:mm:ss')
    const end = e.format('YYYY-MM-DD HH:mm:ss')
    list = list.filter(p => p.capturedAt >= start && p.capturedAt <= end)
  }
  return list
})

// ==================== 分页 ====================
/** 默认 20 条/页，仅提供「更大」档位，不支持调小 */
const page = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [20, 50, 100, 200]

const pagedPhotos = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredPhotos.value.slice(start, start + pageSize.value)
})

const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: filteredPhotos.value.length,
  showSizeChanger: true,
  pageSizeOptions,
  showTotal: (t: number) => `共 ${t} 条记录`,
  size: 'small' as const,
}))

const onPageChange = (p: number, ps: number) => {
  page.value = ps === pageSize.value ? p : 1
  pageSize.value = ps
}

/**
 * 栅格随每页数量自适应：单页条数越多，卡片略收紧，但始终保证照片可辨认。
 * 20 条 → 248px（大图看清现场）；200 条 → 172px（仍能看清画面主体）
 */
const gridMinWidth = computed(() =>
  pageSize.value <= 20 ? 248 : pageSize.value <= 50 ? 208 : pageSize.value <= 100 ? 188 : 172)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth.value}px, 1fr))`,
}))

/** 筛选结果变化时回到第一页 */
watch(filteredPhotos, () => {
  const maxPage = Math.max(1, Math.ceil(filteredPhotos.value.length / pageSize.value))
  if (page.value > maxPage) page.value = maxPage
})

// ==================== 拍摄点位地图（弹窗查看，保证有足够可视面积） ====================
const mapVisible = ref(false)
const mapScope = ref<'selected' | 'all'>('selected')
const mapPhotoId = ref<string | null>(null)
const mapCanvasRef = ref<InstanceType<typeof GpsMapCanvas> | null>(null)

const mapPhoto = computed(() =>
  gpsStore.photos.find(p => p.id === mapPhotoId.value) || null)

/** 弹窗内的点位：仅选中记录 / 全部查询结果 */
const mapMarkers = computed(() =>
  mapScope.value === 'all' ? filteredPhotos.value : (mapPhoto.value ? [mapPhoto.value] : []))

const mapDevices = computed(() => mapMarkers.value.map(p => ({
  id: p.id,
  name: p.deviceName,
  license: '',
  deviceType: 'GPS移动摄像机',
  deviceModel: '',
  firmwareVersion: '',
  orgPathLabel: p.orgPathLabel,
  status: 'online' as const,
  battery: p.battery,
  charging: false,
  network: 'cellular' as const,
  signal: 'strong' as const,
  carrier: '',
  lng: p.lng,
  lat: p.lat,
  lastReportAt: p.capturedAt,
  wearDetected: true,
  capabilities: { buttonCapture: false, sosButton: false, autoCapture: false, geofence: false, voiceCall: false },
  geofenceIds: [],
})))

const openMap = (p: GpsPhotoRecord) => {
  mapPhotoId.value = p.id
  mapScope.value = 'selected'
  mapVisible.value = true
}

const openMapAll = () => {
  mapPhotoId.value = null
  mapScope.value = 'all'
  mapVisible.value = true
}

/** 弹窗打开或切换范围后，把视野对准目标点位 */
const centerMap = () => {
  const target = mapScope.value === 'selected' ? mapPhoto.value : null
  if (!target) return
  mapCanvasRef.value?.centerOn({ lng: target.lng, lat: target.lat }, 4)
}
watch([mapVisible, mapScope, mapPhotoId], () => {
  if (mapVisible.value) setTimeout(centerMap, 60)
})

// ==================== 预览与删除 ====================
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')

const openPreview = (p: GpsPhotoRecord) => {
  previewUrl.value = p.imageUrl
  previewTitle.value = `${p.deviceName} · ${p.capturedAt}`
  previewVisible.value = true
}

const removePhoto = (p: GpsPhotoRecord) => {
  Modal.confirm({
    title: '确认删除该拍照记录？',
    content: '删除后照片及其携带的 GPS 定位信息将不可恢复，且占用的存储额度不会退回。',
    okText: '确认删除', okButtonProps: { danger: true }, cancelText: '取消',
    onOk: () => {
      gpsStore.removePhoto(p.id)
      message.success('记录已删除')
    },
  })
}

// ==================== 导出（调用浏览器下载） ====================
const exporting = ref(false)

/** 导出当前查询结果为 CSV，直接触发浏览器下载 */
const handleExport = () => {
  if (!filteredPhotos.value.length) { message.warning('当前查询结果为空，无可导出数据'); return }
  exporting.value = true
  try {
    const header = ['设备名称', '拍摄时间', '经度', '纬度', '定位精度(米)', '电量(%)', '所属围栏', '图片地址']
    const rows = filteredPhotos.value.map(p => [
      p.deviceName,
      p.capturedAt,
      String(p.lng),
      String(p.lat),
      String(p.accuracy),
      String(p.battery),
      fencesOf(p).map(f => f.name).join('、') || '不在已启用围栏内',
      p.imageUrl,
    ])
    // CSV 字段转义：双引号包裹并将内部双引号翻倍，避免逗号/换行破坏列结构
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    // 加 BOM 头，保证 Excel 打开中文不乱码
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `拍照上报记录_${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success(`已导出 ${filteredPhotos.value.length} 条记录`)
  } finally {
    exporting.value = false
  }
}

// ==================== 存储额度 ====================
const planVisible = ref(false)
const recordsVisible = ref(false)
</script>

<template>
  <div class="gp-page">
    <!-- ==================== 顶部：照片存储额度 ==================== -->
    <header class="gp-store" :class="{ danger: gpsStore.quotaExhausted }">
      <span class="gp-store-icon"><DatabaseOutlined /></span>
      <span class="gp-store-main">
        <span class="gp-store-label">照片存储额度</span>
        <b>{{ gpsStore.usedPhotoQuota }} / {{ gpsStore.totalPhotoQuota }}</b>
        <span class="gp-store-bar"><i :style="{ width: gpsStore.quotaPercent + '%' }" /></span>
        <em>额度用尽后停止接收上报的截图与信息</em>
      </span>

      <span v-if="gpsStore.quotaExhausted" class="gp-store-warn">
        <HistoryOutlined /> 额度已用尽，设备上报已被暂停接收
      </span>
      <span v-else-if="gpsStore.remainingPhotoQuota <= 10" class="gp-store-warn">
        <HistoryOutlined /> 剩余额度不足 {{ gpsStore.remainingPhotoQuota }} 张，建议及时购买
      </span>

      <a-button size="small" class="gp-store-btn" @click="recordsVisible = true">
        <template #icon><HistoryOutlined /></template>购买记录
      </a-button>
      <a-button size="small" :type="gpsStore.quotaExhausted ? 'primary' : 'default'" @click="planVisible = true">
        <template #icon><DatabaseOutlined /></template>购买资源包
      </a-button>
    </header>

    <!-- ==================== 查询条件 ==================== -->
    <header class="gp-bar">
      <GpsFilterBar @search="handleSearch" @reset="handleReset">
        <a-input v-model:value="keyword" placeholder="设备名称" style="width:180px" allow-clear @pressEnter="handleSearch">
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="filterDeviceId" placeholder="上报设备" style="width:200px" allow-clear show-search
          option-filter-prop="label"
          :options="deviceFilterOptions" />
        <a-select v-model:value="filterFenceId" placeholder="所属围栏" style="width:210px" allow-clear show-search
          option-filter-prop="label"
          :options="fenceFilterOptions" />
        <a-range-picker v-model:value="filterRange" show-time style="width:320px" :placeholder="['开始时间', '结束时间']" />

        <template #extra>
          <a-button @click="openMapAll">
            <template #icon><EnvironmentOutlined /></template>点位分布
          </a-button>
          <a-tooltip title="导出当前查询结果为 CSV，由浏览器直接下载">
            <a-button :loading="exporting" @click="handleExport">
              <template #icon><DownloadOutlined /></template>导出
            </a-button>
          </a-tooltip>
        </template>
      </GpsFilterBar>
    </header>

    <!-- ==================== 图片记录 ==================== -->
    <main class="gp-main">
      <section class="gp-records">
        <div class="gp-records-head">
          <span class="gp-card-title"><PictureOutlined /> 拍照上报记录 <b>{{ filteredPhotos.length }}</b></span>
          <span class="gp-card-sub">设备侧按键触发，照片均携带拍摄当时的 GPS 经纬度</span>
        </div>

        <div class="gp-records-body">
          <div class="gp-grid" :style="gridStyle">
            <div v-for="p in pagedPhotos" :key="p.id" class="gp-card">
              <div class="gp-shot" @click="openPreview(p)">
                <img :src="p.imageUrl" alt="抓拍照片" loading="lazy" />
                <span class="gp-shot-src"><CameraOutlined />按键拍照</span>
                <button class="gp-shot-map" title="在地图上查看拍摄位置" @click.stop="openMap(p)"><FullscreenOutlined /></button>
              </div>
              <div class="gp-info">
                <div class="gp-info-top">
                  <span class="gp-device">{{ p.deviceName }}</span>
                </div>
                <div class="gp-gps">
                  <AimOutlined /> {{ p.lng }}, {{ p.lat }}<span class="gp-acc">±{{ p.accuracy }}m</span>
                </div>
                <div class="gp-fence-row">
                  <template v-if="fencesOf(p).length">
                    <span
                      v-for="f in fencesOf(p).slice(0, 2)"
                      :key="f.id"
                      class="gp-fence-chip"
                      :class="'ft-' + f.type"
                    >{{ f.name }}</span>
                    <span v-if="fencesOf(p).length > 2" class="gp-fence-more">+{{ fencesOf(p).length - 2 }}</span>
                  </template>
                  <span v-else class="gp-fence-none">不在已启用围栏内</span>
                </div>
                <div class="gp-info-foot">
                  <span class="gp-time"><CalendarOutlined /> {{ p.capturedAt.slice(5, 16) }}</span>
                  <span class="gp-bat" :class="{ low: p.battery < 20 }">
                    <BatteryIcon :value="p.battery" :size="12" />{{ p.battery }}%
                  </span>
                  <a class="gp-del" title="删除记录" @click.stop="removePhoto(p)"><DeleteOutlined /></a>
                </div>
              </div>
            </div>
          </div>

          <a-empty v-if="!filteredPhotos.length" description="暂无拍照上报记录" />
        </div>

        <!-- 分页 -->
        <div v-if="filteredPhotos.length" class="gp-pager">
          <a-pagination v-bind="pagination" @change="onPageChange" />
        </div>
      </section>
    </main>

    <!-- ==================== 拍摄点位分布（大尺寸弹窗） ==================== -->
    <a-modal
      v-model:open="mapVisible"
      title="拍摄点位分布"
      :footer="null"
      :width="940"
      :destroy-on-hidden="true"
      :styles="{ body: { padding: '0 24px 20px' } }"
    >
      <div class="gp-map-head">
        <a-radio-group v-model:value="mapScope" size="small" button-style="solid">
          <a-radio-button value="selected" :disabled="!mapPhoto">仅选中记录</a-radio-button>
          <a-radio-button value="all">全部查询结果（{{ filteredPhotos.length }}）</a-radio-button>
        </a-radio-group>
        <span v-if="mapScope === 'selected' && mapPhoto" class="gp-map-meta">
          <b>{{ mapPhoto.deviceName }}</b>
          <span class="gp-dot">·</span>{{ mapPhoto.capturedAt.slice(5, 16) }}
          <span class="gp-dot">·</span>{{ mapPhoto.lng }}, {{ mapPhoto.lat }}（±{{ mapPhoto.accuracy }}m）
        </span>
        <span v-else class="gp-map-meta">共 {{ filteredPhotos.length }} 个点位，滚轮或按钮可放大查看</span>
      </div>
      <div class="gp-map-box">
        <GpsMapCanvas
          v-if="mapVisible"
          ref="mapCanvasRef"
          :devices="mapDevices"
          :geofences="gpsStore.geofences"
          :selected-device-id="mapScope === 'selected' ? mapPhotoId : null"
          :height="'100%'"
          class="gp-map"
        />
      </div>
    </a-modal>

    <!-- 照片预览 -->
    <a-modal v-model:open="previewVisible" :title="previewTitle" :footer="null" width="780px">
      <img :src="previewUrl" alt="抓拍照片" style="width:100%;border-radius:10px" />
    </a-modal>

    <!-- 存储资源包 -->
    <PhotoStoragePlanModal v-model:open="planVisible" />

    <!-- 购买记录 -->
    <PhotoPurchaseRecordsDrawer v-model:open="recordsVisible" />
  </div>
</template>

<style scoped>
.gp-page { display:flex; flex-direction:column; height:100%; background:#eef2f7; overflow:hidden; }

/* ==================== 顶部查询栏 ==================== */
.gp-bar { display:flex; align-items:center; padding:14px 20px; background:#fff; border-bottom:1px solid #e8eef6; flex-shrink:0; }

/* ==================== 主体 ==================== */
.gp-main { flex:1; display:flex; gap:12px; padding:12px 20px; overflow:hidden; min-height:0; }
.gp-records { flex:1; min-width:0; background:#fff; border:1px solid #e8eef6; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; }
.gp-records-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border-bottom:1px solid #f0f4f9; flex-shrink:0; }
.gp-card-title { font-size:13px; font-weight:600; color:#1f2937; display:inline-flex; align-items:center; gap:6px; }
.gp-card-title :deep(.anticon) { color:#1677ff; }
.gp-card-title b { color:#1677ff; }
.gp-card-sub { font-size:12px; color:#94a3b8; }
.gp-records-body { flex:1; min-height:0; overflow-y:auto; padding:16px; }

/* 图片画廊（列宽由 gridStyle 按每页条数动态控制） */
.gp-grid { display:grid; gap:14px; }
.gp-card { display:flex; flex-direction:column; border:1px solid #e8eef6; border-radius:11px; overflow:hidden; background:#fff; transition:all .18s; }
.gp-card:hover { border-color:#a8cdfd; box-shadow:0 6px 18px rgba(22,119,255,.12); transform:translateY(-1px); }
.gp-shot { position:relative; aspect-ratio:4 / 3; background:#f1f5f9; overflow:hidden; cursor:zoom-in; }
.gp-shot img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s; }
.gp-card:hover .gp-shot img { transform:scale(1.05); }
.gp-shot-src { position:absolute; left:6px; top:6px; display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:11px; color:#fff; font-size:10px; background:rgba(22,119,255,.94); box-shadow:0 2px 6px rgba(15,23,42,.18); }
.gp-shot-map { position:absolute; right:6px; bottom:6px; width:26px; height:26px; border:none; border-radius:8px; background:rgba(15,23,42,.58); color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0; transition:all .18s; backdrop-filter:blur(4px); }
.gp-card:hover .gp-shot-map { opacity:1; }
.gp-shot-map:hover { background:#1677ff; }

.gp-info { padding:10px 12px 11px; display:flex; flex-direction:column; gap:6px; }
.gp-info-top { display:flex; align-items:center; gap:6px; }
.gp-device { flex:1; font-size:13px; font-weight:600; color:#1f2937; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.gp-gps { font-size:11.5px; color:#1677ff; display:inline-flex; align-items:center; gap:4px; font-variant-numeric:tabular-nums; }
.gp-acc { color:#8fbcf5; margin-left:2px; }
.gp-fence-row { display:flex; align-items:center; gap:5px; flex-wrap:wrap; min-width:0; }
.gp-fence-chip { padding:1px 7px; border-radius:9px; font-size:10.5px; line-height:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
.gp-fence-chip.ft-safe { background:#eafaf0; color:#15803d; }
.gp-fence-chip.ft-danger { background:#fff1f0; color:#cf1322; }
.gp-fence-chip.ft-custom { background:#eaf3ff; color:#1677ff; }
.gp-fence-more { font-size:10.5px; color:#94a3b8; }
.gp-fence-none { font-size:10.5px; color:#a8b4c4; }
.gp-info-foot { display:flex; align-items:center; gap:8px; margin-top:1px; padding-top:8px; border-top:1px dashed #f0f4f9; font-size:11px; color:#94a3b8; }
.gp-time { display:inline-flex; align-items:center; gap:3px; }
.gp-bat { display:inline-flex; align-items:center; gap:3px; }
.gp-bat.low { color:#ff4d4f; font-weight:600; }
.gp-del { margin-left:auto; color:#c0c9d4; opacity:.45; transition:all .16s; }
.gp-del:hover { color:#ff4d4f; opacity:1; }

/* 分页 */
.gp-pager { display:flex; justify-content:flex-end; padding:10px 16px; border-top:1px solid #f0f4f9; flex-shrink:0; }

/* ==================== 点位分布弹窗 ==================== */
.gp-map-head { display:flex; align-items:center; gap:14px; flex-wrap:wrap; padding:4px 0 12px; }
.gp-map-meta { font-size:12px; color:#64748b; }
.gp-map-meta b { color:#1f2937; }
.gp-dot { color:#cbd5e1; margin:0 5px; }
.gp-map-box { width:100%; aspect-ratio:1000 / 620; }

/* ==================== 底部存储额度条 ==================== */
.gp-store { display:flex; align-items:center; gap:16px; row-gap:6px; flex-wrap:wrap; padding:9px 20px; background:#fff; border-bottom:1px solid #e8eef6; font-size:11.5px; color:#64748b; flex-shrink:0; }
.gp-store.danger { background:#fff7f6; border-bottom-color:#ffd6d3; }
.gp-store-icon { color:#1677ff; font-size:15px; display:flex; }
.gp-store.danger .gp-store-icon { color:#ff4d4f; }
.gp-store-main { flex:1; min-width:300px; display:flex; align-items:center; gap:9px; flex-wrap:wrap; line-height:1.6; }
.gp-store-label { color:#334155; font-weight:500; }
.gp-store-main b { color:#1f2937; font-size:12.5px; }
.gp-store.danger .gp-store-main b { color:#cf1322; }
.gp-store-main em { font-style:normal; color:#94a3b8; }
.gp-store-bar { width:120px; height:6px; border-radius:3px; background:#eef2f7; overflow:hidden; display:inline-block; }
.gp-store-bar i { display:block; height:100%; border-radius:3px; background:#1677ff; transition:width .3s; }
.gp-store.danger .gp-store-bar i { background:#ff4d4f; }
.gp-store-warn { display:inline-flex; align-items:center; gap:5px; color:#ea8c00; }
.gp-store-btn { margin-left:auto; }
</style>
