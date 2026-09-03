<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'antdv-next'
import type { TableColumnsType } from 'antdv-next'
import {
  CloudServerOutlined, BulbOutlined, SafetyOutlined,
  VideoCameraOutlined, HddOutlined,
  AlipayCircleOutlined, WechatOutlined, QrcodeOutlined,
  CheckCircleFilled, ClockCircleOutlined,
  InfoCircleOutlined,
} from '@antdv-next/icons'

const router = useRouter()

// ==========================================
// 类型定义
// ==========================================
type ServiceCategory = 'cloud_record' | 'ai_algorithm' | 'security'

interface ServicePackage {
  id: string
  name: string
  category: ServiceCategory
  unit: '月' | '年'              // 计价周期
  price: number                  // 单价（元/台/路）
  originalPrice?: number         // 原价（用于"省x%"标签）
  tag?: 'hot' | 'useful'         // 热门 / 实用
  hasDetail?: boolean            // 是否提供"查看详情"
  serviceType: string            // 服务类型
  nvrSupported: boolean          // 是否支持 NVR 录制路数（仅云存储与录制生效）
  nvrRoads?: number              // 后台套餐配置的 NVR录制路数（云存储套餐，取到后仅作展示）
  features: string[]             // 功能卖点
  detail?: string                // 详情描述
}

interface CatalogDevice {
  id: string
  name: string
  license: string
  type: 'camera' | 'nvr'
  channelCount: number           // NVR 通道总数（摄像机为 1）
  regionKey: string              // 所属区域节点 key
  orgPath: string                // 组织路径
}

interface RegionNode { key: string; title: string; children?: RegionNode[] }

// ==========================================
// 分类 Tab
// ==========================================
const tab = ref<ServiceCategory>('cloud_record')
const tabs = [
  { key: 'cloud_record' as ServiceCategory, label: '云存储与录制', icon: CloudServerOutlined },
  { key: 'ai_algorithm' as ServiceCategory, label: 'AI智能算法', icon: BulbOutlined },
  { key: 'security' as ServiceCategory, label: '安全预警', icon: SafetyOutlined },
]

// ==========================================
// 套餐数据
// ==========================================
const packages: ServicePackage[] = [
  // ---- 云存储与录制（支持 NVR）----
  { id: 'c1', name: '7天云存储-基础版', category: 'cloud_record', unit: '月', price: 99, hasDetail: true, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 5, detail: '提供7天循环云存储，事件触发录像，手机端随时回放，适合单店/小规模场景。', features: ['7天视频循环存储', '事件录像回放', '手机端随时查看', '异常事件抓拍'] },
  { id: 'c2', name: '7天云存储-年付', category: 'cloud_record', unit: '年', price: 899, originalPrice: 1099, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 5, features: ['7天视频循环存储', '事件录像回放', '手机端随时查看', '年付更省心'] },
  { id: 'c3', name: '30天云存储-标准版', category: 'cloud_record', unit: '月', price: 199, tag: 'hot', hasDetail: true, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 8, detail: '30天超长存储，全天不间断录像，云端摘要回看，支持高清视频留存。', features: ['30天视频循环存储', '全天不间断录像', '云端摘要回看', '高清视频存储'] },
  { id: 'c4', name: '30天云存储-年付', category: 'cloud_record', unit: '年', price: 1699, originalPrice: 1999, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 8, features: ['30天视频循环存储', '全天不间断录像', '高清视频存储', '年付更省心'] },
  { id: 'c5', name: '全天录像套餐-旗舰版', category: 'cloud_record', unit: '月', price: 399, tag: 'useful', hasDetail: true, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 10, detail: '全天不间断录像，多路同时预览，AI事件标记定位，智能检索快速回放。', features: ['全天不间断录像', '6路同时预览', 'AI事件标记定位', '智能检索回放'] },
  { id: 'c6', name: '云存储扩容包-年付', category: 'cloud_record', unit: '年', price: 599, originalPrice: 719, serviceType: '云存储与录制', nvrSupported: true, nvrRoads: 8, features: ['存储空间扩容', '历史录像留存', '不限回放次数', '年付更省心'] },

  // ---- AI智能算法 ----
  { id: 'a1', name: '人脸识别-基础版', category: 'ai_algorithm', unit: '月', price: 99, hasDetail: true, serviceType: 'AI智能算法', nvrSupported: false, detail: '面向中小门店的人脸识别方案，支持500人人脸库与陌生人预警。', features: ['500人人脸库', '陌生人预警', '出入记录'] },
  { id: 'a2', name: '人脸识别-标准版', category: 'ai_algorithm', unit: '月', price: 199, tag: 'hot', serviceType: 'AI智能算法', nvrSupported: false, features: ['5000人人脸库', '陌生人预警', '出入记录'] },
  { id: 'a3', name: '人脸识别-旗舰版', category: 'ai_algorithm', unit: '月', price: 399, serviceType: 'AI智能算法', nvrSupported: false, features: ['万人人脸库', '陌生人预警', '出入记录+报表'] },
  { id: 'a4', name: '人脸识别-年付标准', category: 'ai_algorithm', unit: '年', price: 1999, originalPrice: 2388, serviceType: 'AI智能算法', nvrSupported: false, features: ['5000人人脸库', '陌生人预警', '出入记录'] },
  { id: 'a5', name: '车牌识别-基础版', category: 'ai_algorithm', unit: '月', price: 88, serviceType: 'AI智能算法', nvrSupported: false, features: ['车牌识别', '白名单放行', '出入记录'] },
  { id: 'a6', name: '车牌识别-标准版', category: 'ai_algorithm', unit: '月', price: 168, tag: 'useful', serviceType: 'AI智能算法', nvrSupported: false, features: ['车牌识别', '黑白名单', '违停检测'] },
  { id: 'a7', name: '车牌识别-年付基础', category: 'ai_algorithm', unit: '年', price: 888, originalPrice: 1056, hasDetail: true, serviceType: 'AI智能算法', nvrSupported: false, detail: '基础车牌识别方案，支持白名单放行与出入记录留存。', features: ['车牌识别', '白名单放行', '出入记录'] },
  { id: 'a8', name: '车牌识别-年付标准', category: 'ai_algorithm', unit: '年', price: 1688, originalPrice: 2016, serviceType: 'AI智能算法', nvrSupported: false, features: ['车牌识别', '黑白名单', '违停检测'] },
  { id: 'a9', name: '行为分析-基础版', category: 'ai_algorithm', unit: '月', price: 128, serviceType: 'AI智能算法', nvrSupported: false, features: ['跌倒检测', '聚集检测', '实时预警'] },
  { id: 'a10', name: '行为分析-旗舰版', category: 'ai_algorithm', unit: '月', price: 458, hasDetail: true, serviceType: 'AI智能算法', nvrSupported: false, detail: '全行为检测方案，含周界/烟火联动报警，覆盖多类异常行为。', features: ['全行为检测', '周界/烟火', '联动报警'] },
  { id: 'a11', name: '行为分析-年付标准', category: 'ai_algorithm', unit: '年', price: 2588, originalPrice: 3096, serviceType: 'AI智能算法', nvrSupported: false, features: ['跌倒/打架/聚集', '周界入侵', '烟火检测'] },
  { id: 'a12', name: '人员离岗检测 - 年付', category: 'ai_algorithm', unit: '年', price: 350, serviceType: 'AI智能算法', nvrSupported: false, features: ['离岗检测', '实时告警', '多区域布防'] },

  // ---- 安全预警 ----
  { id: 's1', name: '消防占道预警-月付', category: 'security', unit: '月', price: 128, serviceType: '安全预警', nvrSupported: false, features: ['消防通道占用识别', '实时告警推送', '事件留证'] },
  { id: 's2', name: '区域入侵预警-年付', category: 'security', unit: '年', price: 999, originalPrice: 1199, hasDetail: true, serviceType: '安全预警', nvrSupported: false, detail: '周界/重点区域入侵识别，支持声光联动与完整告警记录。', features: ['周界入侵识别', '声光联动', '告警记录'] },
  { id: 's3', name: '离岗/睡岗预警-月付', category: 'security', unit: '月', price: 88, serviceType: '安全预警', nvrSupported: false, features: ['离岗检测', '睡岗检测', '多次告警'] },
  { id: 's4', name: '烟火检测预警-年付', category: 'security', unit: '年', price: 1299, originalPrice: 1549, tag: 'hot', serviceType: '安全预警', nvrSupported: false, features: ['烟火识别', '实时告警', '定位上报'] },
  { id: 's5', name: '跌倒检测预警-月付', category: 'security', unit: '月', price: 108, tag: 'useful', serviceType: '安全预警', nvrSupported: false, features: ['跌倒识别', '即时通知', '录像关联'] },
]

const currentPackages = computed(() => packages.filter(p => p.category === tab.value))

// ==========================================
// 价格 / 折扣辅助
// ==========================================
const fmtMoney = (n: number, digits = 2) => n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const discountPct = (p: ServicePackage) => p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0
const unitLabel = (p: ServicePackage) => p.unit === '年' ? '/年/台' : '/月/台'

// ==========================================
// 套餐详情弹窗
// ==========================================
const detailVisible = ref(false)
const detailPkg = ref<ServicePackage | null>(null)
const openDetail = (p: ServicePackage) => { detailPkg.value = p; detailVisible.value = true }

// ==========================================
// 服务开通抽屉
// ==========================================
const orderVisible = ref(false)
const currentPkg = ref<ServicePackage | null>(null)
const payMethod = ref<'alipay' | 'wechat'>('alipay')

// 区域树
const regionTree: RegionNode[] = [
  { key: 'root', title: '深圳鹤梦信息', children: [
    { key: 'r1', title: '区域一' },
    { key: 'r2', title: '区域二' },
    { key: 'r3', title: '区域三', children: [{ key: 'r3a', title: '下级区域一' }] },
  ]},
]
const selRegion = ref('root')
const expandedKeys = ref<string[]>(['root', 'r3'])

// 可选设备（含 NVR）
const catalogDevices: CatalogDevice[] = [
  { id: 'd1', name: '设备a', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r1', orgPath: '深圳鹤梦信息 / 区域一' },
  { id: 'd2', name: '设备b', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r1', orgPath: '深圳鹤梦信息 / 区域一' },
  { id: 'd3', name: '设备c', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r1', orgPath: '深圳鹤梦信息 / 区域一' },
  { id: 'd4', name: 'NVR-深圳机房', license: 'NVR-SZ-0001', type: 'nvr', channelCount: 10, regionKey: 'r2', orgPath: '深圳鹤梦信息 / 区域二' },
  { id: 'd5', name: '设备d', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r2', orgPath: '深圳鹤梦信息 / 区域二' },
  { id: 'd6', name: '设备e', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r2', orgPath: '深圳鹤梦信息 / 区域二' },
  { id: 'd7', name: '设备f', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r3', orgPath: '深圳鹤梦信息 / 区域三' },
  { id: 'd8', name: '设备g', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r3', orgPath: '深圳鹤梦信息 / 区域三' },
  { id: 'd9', name: 'NVR-福田分拣', license: 'NVR-FT-0002', type: 'nvr', channelCount: 8, regionKey: 'r3a', orgPath: '深圳鹤梦信息 / 区域三 / 下级区域一' },
  { id: 'd10', name: '设备h', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r3a', orgPath: '深圳鹤梦信息 / 区域三 / 下级区域一' },
  { id: 'd11', name: '设备i', license: 'qazwsxed', type: 'camera', channelCount: 1, regionKey: 'r3a', orgPath: '深圳鹤梦信息 / 区域三 / 下级区域一' },
]

const devSearch = ref('')
const selIds = ref<string[]>([])

// 打开服务开通抽屉
const openOrder = (p: ServicePackage) => {
  currentPkg.value = p
  selRegion.value = 'root'
  selIds.value = []
  devSearch.value = ''
  payMethod.value = 'alipay'
  orderVisible.value = true
}

// 区域筛选 + 搜索
const filteredDevices = computed(() => {
  let list = catalogDevices
  if (selRegion.value && selRegion.value !== 'root') list = list.filter(d => d.regionKey === selRegion.value)
  if (devSearch.value.trim()) {
    const kw = devSearch.value.trim().toLowerCase()
    list = list.filter(d => d.name.toLowerCase().includes(kw) || d.license.toLowerCase().includes(kw))
  }
  return list
})

// 设备选择
const onDeviceSelect = (keys: any[]) => {
  selIds.value = keys as string[]
}

// 套餐配置的 NVR录制路数（取自后台套餐配置，仅作提示展示）
const nvrRoads = computed(() => currentPkg.value?.nvrRoads ?? 0)

// 已选中的 NVR 设备
const selectedNvrs = computed(() => catalogDevices.filter(d => d.type === 'nvr' && selIds.value.includes(d.id)))
const showNvrTip = computed(() => currentPkg.value?.category === 'cloud_record' && nvrRoads.value > 0 && selectedNvrs.value.length > 0)

// 设备数量：按所选设备台数计（套餐价格已按 NVR 路数算好）
const totalUnits = computed(() => selIds.value.length)

const currentPkgProperties = computed(() => currentPkg.value || ({} as ServicePackage))
const serviceCycle = computed(() => currentPkgProperties.value.unit === '年' ? '1年' : '1个月')
const unitPriceLabel = computed(() => currentPkg.value ? `¥${fmtMoney(currentPkg.value.price)}` : '—')
const totalAmount = computed(() => (currentPkg.value?.price || 0) * totalUnits.value)

// ========== 扫码支付弹窗 ==========
const payVisible = ref(false)
const payOrderNo = ref('')
const payCountdown = ref(0)              // 剩余支付秒数
let payTimer: ReturnType<typeof setInterval> | null = null
const payMethodName = computed(() => payMethod.value === 'alipay' ? '支付宝' : '微信')
const payCountdownText = computed(() => {
  const min = Math.floor(payCountdown.value / 60)
  const sec = String(payCountdown.value % 60).padStart(2, '0')
  return `${String(min).padStart(2, '0')}:${sec}`
})

// 生成订单号（ORD + 日期 + 随机）
const genOrderNo = () => {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  return `ORD${ymd}${rand}`
}

// 确认支付：生成订单 → 打开扫码支付弹窗
const confirmPay = () => {
  if (selIds.value.length === 0) { message.warning('请至少选择一台设备'); return }
  if (!payMethod.value) { message.warning('请选择支付方式'); return }
  payOrderNo.value = genOrderNo()
  payCountdown.value = 600               // 600 秒 = 10 分钟
  payVisible.value = true
  // 模拟后台生成支付二维码成功
  payTimer = setInterval(() => {
    if (payCountdown.value > 0) payCountdown.value--
  }, 1000)
  // 模拟轮询检测到支付成功（3 秒后自动到账，亦可通过"模拟支付成功"触发）
  window.setTimeout(() => onPaySuccess(), 3000)
}

// 取消支付
const cancelPay = () => {
  if (payTimer) { clearInterval(payTimer); payTimer = null }
  payVisible.value = false
  message.info('已取消支付')
}

// 模拟扫码回调支付成功
const onPaySuccess = () => {
  if (payTimer) { clearInterval(payTimer); payTimer = null }
  payVisible.value = false
  successOrderNo.value = payOrderNo.value
  successAmount.value = totalAmount.value
  successDeviceCount.value = totalUnits.value
  successVisible.value = true
}

// ========== 支付成功弹窗 ==========
const successVisible = ref(false)
const successOrderNo = ref('')
const successAmount = ref(0)
const successDeviceCount = ref(0)

// 查看记录：关闭成功弹窗，跳转至 设备管理 > 服务开通记录
const goRecords = () => {
  successVisible.value = false
  orderVisible.value = false
  router.push('/device/service-records')
}

// 继续购买：关闭成功弹窗，服务商城页面刷新
const goContinue = () => {
  successVisible.value = false
  orderVisible.value = false
  // 刷新服务商城（重新加载页面）
  window.location.reload()
}

onUnmounted(() => {
  if (payTimer) { clearInterval(payTimer); payTimer = null }
})

const deviceColumns: TableColumnsType = [
  { title: '设备名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: 'License', dataIndex: 'license', key: 'license', width: 150 },
  { title: '类型', key: 'type', width: 120, align: 'center' },
]
</script>

<template>
  <div class="sm-page">
    <!-- ==================== 顶部分类Tab ==================== -->
    <div class="sm-tabs">
      <div
        v-for="t in tabs"
        :key="t.key"
        :class="['sm-tab', { active: tab === t.key }]"
        @click="tab = t.key"
      >
        <component :is="t.icon" class="sm-tab-icon" />
        <span>{{ t.label }}</span>
      </div>
    </div>

    <!-- ==================== 套餐卡片网格 ==================== -->
    <div class="sm-grid">
      <div v-for="p in currentPackages" :key="p.id" class="sm-card" @click="openOrder(p)">
        <div class="sm-card-hd">
          <span class="sm-name">
            {{ p.name }}
            <span v-if="p.tag === 'hot'" class="sm-tag sm-tag-hot">热门</span>
            <span v-else-if="p.tag === 'useful'" class="sm-tag sm-tag-useful">实用</span>
          </span>
          <a
            v-if="p.hasDetail"
            class="sm-detail-link"
            @click.stop="openDetail(p)"
          >查看详情 <span class="sm-detail-arrow">›</span></a>
        </div>

        <div class="sm-price-row">
          <span class="sm-price-currency">¥</span>
          <span class="sm-price-num">{{ fmtMoney(p.price) }}</span>
          <span class="sm-price-unit">{{ unitLabel(p) }}</span>
          <template v-if="p.originalPrice">
            <span class="sm-tag sm-tag-discount">省{{ discountPct(p) }}%</span>
            <span class="sm-original-price">¥{{ fmtMoney(p.originalPrice) }}</span>
          </template>
        </div>

        <ul class="sm-features">
          <li v-for="f in p.features" :key="f"><span class="sm-check">✓</span>{{ f }}</li>
        </ul>

        <div class="sm-card-foot">
          <a-button type="primary" size="small" class="sm-open-btn" @click.stop="openOrder(p)">开通</a-button>
        </div>
      </div>
    </div>

    <!-- ==================== 套餐详情弹窗 ==================== -->
    <a-modal v-model:open="detailVisible" :title="detailPkg?.name" :footer="null" width="520px">
      <template v-if="detailPkg">
        <div class="sm-detail">
          <div class="sm-detail-price">
            <span class="sm-price-currency">¥</span>
            <span class="sm-price-num">{{ fmtMoney(detailPkg.price) }}</span>
            <span class="sm-price-unit">{{ unitLabel(detailPkg) }}</span>
            <template v-if="detailPkg.originalPrice"><span class="sm-original-price">¥{{ fmtMoney(detailPkg.originalPrice) }}</span></template>
          </div>
          <p class="sm-detail-desc">{{ detailPkg.detail || '该套餐提供多种能力，可按需开通后生效。' }}</p>
          <div class="sm-detail-feat-title">包含功能</div>
          <ul class="sm-detail-feats">
            <li v-for="f in detailPkg.features" :key="f"><span class="sm-check">✓</span>{{ f }}</li>
          </ul>
        </div>
      </template>
    </a-modal>

    <!-- ==================== 服务开通抽屉（不是弹窗） ==================== -->
    <a-drawer
      v-model:open="orderVisible"
      :title="currentPkg ? `服务开通：${currentPkg.name}` : '服务开通'"
      :size="1000"
      :maskClosable="false"
      :destroyOnClose="false"
    >
      <!-- 选择设备 -->
      <div class="od-section">
        <div class="od-section-title">选择设备</div>
        <div class="od-device">
          <!-- 组织区域树 -->
          <div class="od-tree">
            <a-input-search v-model:value="devSearch" placeholder="搜索设备名称 / License" allow-clear style="margin-bottom:12px" />
            <a-tree
              :tree-data="regionTree"
              :expanded-keys="expandedKeys"
              :selected-keys="[selRegion]"
              :field-names="{ children: 'children', title: 'title', key: 'key' }"
              show-line
              block-node
              @select="(keys: any[]) => selRegion = keys[0] || ''"
              @expand="(keys: any[]) => expandedKeys = keys"
            />
          </div>
          <!-- 设备表格 -->
          <div class="od-table">
            <a-table
              :columns="deviceColumns"
              :data-source="filteredDevices"
              :row-selection="{ selectedRowKeys: selIds, onChange: onDeviceSelect }"
              row-key="id"
              size="middle"
              :pagination="{ pageSize: 5, showTotal: (t: number) => `共 ${t} 台设备` }"
              :scroll="{ y: 300 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span style="font-weight:500">{{ record.name }}</span>
                </template>
                <template v-else-if="column.key === 'license'">
                  <code style="font-size:12px;color:#666;background:#f5f5f5;padding:1px 6px;border-radius:3px">{{ record.license }}</code>
                </template>
                <template v-else-if="column.key === 'type'">
                  <a-tag v-if="record.type === 'nvr'" color="purple" style="margin:0"><HddOutlined /> NVR · {{ record.channelCount }}路</a-tag>
                  <a-tag v-else color="cyan" style="margin:0"><VideoCameraOutlined /> 摄像机</a-tag>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>

      <!-- NVR 录制提示（套餐后台配置，仅作提示） -->
      <div v-if="showNvrTip" class="od-section">
        <div class="od-nvr-note">
          <InfoCircleOutlined /> 本套餐对 NVR 设备最多生效 <b>{{ nvrRoads }}</b> 路云存储录制，开通后按通道序号顺序生效（例如套餐配置 5 路、NVR 共 10 路，则仅生效通道1~通道5）。
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="od-section">
        <div class="od-section-title">订单信息</div>
        <div class="od-order">
          <div class="od-order-row"><span class="od-order-label">服务类型</span><span class="od-order-value">{{ currentPkgProperties.serviceType }}</span></div>
          <div class="od-order-row"><span class="od-order-label">服务名称</span><span class="od-order-value">{{ currentPkgProperties.name }}</span></div>
          <div class="od-order-row"><span class="od-order-label">服务周期</span><span class="od-order-value">{{ serviceCycle }}</span></div>
          <div class="od-order-row"><span class="od-order-label">单价</span><span class="od-order-value">{{ unitPriceLabel }}</span></div>
          <div class="od-order-row">
            <span class="od-order-label">设备数量</span>
            <span class="od-order-value">× {{ totalUnits }} 台</span>
          </div>
          <div class="od-order-divider"></div>
          <div class="od-order-row od-order-total">
            <span class="od-order-label">合计金额</span>
            <span class="od-order-amount">¥ {{ fmtMoney(totalAmount, 0) }}</span>
          </div>
        </div>
      </div>

      <!-- 选择支付方式 -->
      <div class="od-section">
        <div class="od-section-title">选择支付方式</div>
        <div class="od-pay">
          <div :class="['od-pay-item', { active: payMethod === 'alipay' }]" @click="payMethod = 'alipay'">
            <AlipayCircleOutlined class="od-pay-icon" style="color:#1677ff" />
            <span>支付宝</span>
          </div>
          <div :class="['od-pay-item', { active: payMethod === 'wechat' }]" @click="payMethod = 'wechat'">
            <WechatOutlined class="od-pay-icon" style="color:#07c160" />
            <span>微信</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="od-footer">
          <span class="od-footer-total">合计：<b>¥ {{ fmtMoney(totalAmount, 0) }}</b></span>
          <a-button type="primary" size="large" @click="confirmPay">确认支付</a-button>
        </div>
      </template>
    </a-drawer>

    <!-- ==================== 扫码支付弹窗 ==================== -->
    <a-modal
      v-model:open="payVisible"
      :title="null"
      :footer="null"
      width="460px"
      :maskClosable="false"
      :closable="false"
      centered
    >
      <div class="pay-m">
        <div class="pay-m-hd">
          <span class="pay-m-title">扫码支付</span>
          <span class="pay-m-close" @click="cancelPay">✕</span>
        </div>
        <div class="pay-m-amount">¥ {{ fmtMoney(totalAmount, 0) }}</div>
        <div class="pay-m-order">订单号：{{ payOrderNo }}</div>
        <div class="pay-m-qr">
          <QrcodeOutlined class="pay-m-qr-icon" />
        </div>
        <div class="pay-m-tip">打开{{ payMethodName }}扫一扫</div>
        <div class="pay-m-deadline">
          <span>请在10分钟内完成支付</span>
          <span class="pay-m-countdown"><ClockCircleOutlined /> {{ payCountdownText }}</span>
        </div>
        <div class="pay-m-actions">
          <a-button @click="cancelPay">取消</a-button>
        </div>
      </div>
    </a-modal>

    <!-- ==================== 支付成功弹窗 ==================== -->
    <a-modal
      v-model:open="successVisible"
      :title="null"
      :footer="null"
      width="440px"
      :maskClosable="false"
      centered
    >
      <div class="ok-m">
        <div class="ok-m-icon"><CheckCircleFilled /></div>
        <div class="ok-m-title">支付成功！</div>
        <div class="ok-m-subtitle">智能服务已为您开通</div>
        <div class="ok-m-summary">
          <div class="ok-m-row"><span class="ok-m-label">订单编号</span><span class="ok-m-value">{{ successOrderNo }}</span></div>
          <div class="ok-m-row"><span class="ok-m-label">支付金额</span><span class="ok-m-value ok-m-amount">¥{{ fmtMoney(successAmount, 2) }}</span></div>
          <div class="ok-m-row"><span class="ok-m-label">开通设备</span><span class="ok-m-value">{{ successDeviceCount }}台</span></div>
        </div>
        <div class="ok-m-actions">
          <a-button class="ok-m-btn" @click="goRecords">查看记录</a-button>
          <a-button class="ok-m-btn ok-m-btn-primary" type="primary" @click="goContinue">继续购买</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.sm-page {
  height: 100%;
  background: #f5f7fa;
  padding: 20px 24px 24px;
  overflow-y: auto;
}

/* ===== 分类Tab（胶囊分段样式） ===== */
.sm-tabs {
  display: inline-flex;
  gap: 6px;
  background: #eef1f5;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}
.sm-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 22px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}
.sm-tab-icon { font-size: 15px; }
.sm-tab:hover { color: #1677ff; }
.sm-tab.active {
  background: #fff;
  color: #1677ff;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ===== 套餐卡片网格 ===== */
.sm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 16px;
}
.sm-card {
  position: relative;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 10px;
  padding: 18px 20px 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}
.sm-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.sm-card-hd {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.sm-name {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sm-detail-link {
  font-size: 14px;
  color: #1677ff;
  white-space: nowrap;
  flex-shrink: 0;
}
.sm-detail-arrow { font-size: 16px; }

.sm-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 16px;
}
.sm-tag-hot { color: #fa8c16; background: #fff2e8; }
.sm-tag-useful { color: #52c41a; background: #f6ffed; }
.sm-tag-discount { color: #fa541c; background: #fff1e8; margin-left: 6px; }

.sm-price-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 14px;
}
.sm-price-currency { color: #fa541c; font-size: 15px; font-weight: 600; }
.sm-price-num { color: #fa541c; font-size: 24px; font-weight: 700; }
.sm-price-unit { color: #999; font-size: 12px; margin-left: 2px; }
.sm-original-price { color: #bbb; font-size: 12px; text-decoration: line-through; margin-left: 4px; }

.sm-features {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  flex: 1;
}
.sm-features li {
  font-size: 13px;
  color: #555;
  line-height: 24px;
}
.sm-check { color: #52c41a; font-weight: 700; margin-right: 6px; }

.sm-card-foot {
  display: flex;
  justify-content: flex-end;
}
.sm-open-btn {
  min-width: 84px;
  border-radius: 6px;
}

/* ===== 抽屉公共 ===== */
.od-section {
  margin-bottom: 24px;
}
.od-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #222;
  margin-bottom: 14px;
}
.od-section-hint {
  font-size: 12px;
  font-weight: 400;
  color: #999;
  margin-left: 10px;
}

/* 选择设备 */
.od-device {
  display: flex;
  gap: 16px;
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 14px;
}
.od-tree {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  height: 340px;
  overflow-y: auto;
}
.od-table { flex: 1; min-width: 0; }
.od-table :deep(.ant-table-thead > tr > th) { background: #fafafa; }

/* NVR 录制提示 */
.od-nvr-note {
  padding: 10px 14px;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 6px;
  font-size: 12px;
  color: #ad6800;
  line-height: 20px;
}

/* 订单信息 */
.od-order { background: #fafbfc; border: 1px solid #f0f0f0; border-radius: 8px; padding: 6px 16px; }
.od-order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}
.od-order-label { color: #888; }
.od-order-value { color: #333; }
.od-order-divider { height: 1px; background: #eef0f3; margin: 6px 0; }
.od-order-total { padding-top: 10px; }
.od-order-amount { color: #fa541c; font-size: 24px; font-weight: 700; }

/* 支付方式 */
.od-pay { display: flex; gap: 16px; }
.od-pay-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 220px;
  padding: 12px 16px;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}
.od-pay-icon { font-size: 22px; }
.od-pay-item.active { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12); color: #1677ff; }

/* 抽屉底部 */
.od-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  width: 100%;
}
.od-footer-total { font-size: 14px; color: #333; }
.od-footer-total b { color: #fa541c; font-size: 20px; font-weight: 700; }

/* 详情弹窗 */
.sm-detail-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  background: #fafbfc;
  border-radius: 8px;
  padding: 14px 16px;
}
.sm-detail-desc { color: #666; font-size: 14px; line-height: 24px; margin: 14px 0; }
.sm-detail-feat-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
.sm-detail-feats { list-style: none; margin: 0; padding: 0; }
.sm-detail-feats li { font-size: 13px; color: #555; line-height: 26px; }

/* ===== 扫码支付弹窗 ===== */
.pay-m { text-align: center; padding-bottom: 8px; }
.pay-m-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.pay-m-title { font-size: 18px; font-weight: 600; color: #222; }
.pay-m-close { cursor: pointer; color: #999; font-size: 16px; line-height: 1; }
.pay-m-close:hover { color: #333; }
.pay-m-amount { color: #fa541c; font-size: 32px; font-weight: 700; line-height: 1; }
.pay-m-order { color: #999; font-size: 13px; margin-top: 8px; }
.pay-m-qr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  margin: 24px auto 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
}
.pay-m-qr-icon { font-size: 150px; color: #1677ff; }
.pay-m-tip { font-size: 15px; color: #333; margin-bottom: 6px; }
.pay-m-deadline { font-size: 12px; color: #999; margin-bottom: 24px; }
.pay-m-countdown { color: #ff4d4f; margin-left: 8px; }
.pay-m-actions { display: flex; justify-content: flex-end; }

/* ===== 支付成功弹窗 ===== */
.ok-m { text-align: center; padding: 4px 0 8px; }
.ok-m-icon { color: #52c41a; font-size: 56px; margin-bottom: 14px; }
.ok-m-title { font-size: 22px; font-weight: 700; color: #222; }
.ok-m-subtitle { font-size: 14px; color: #666; margin-top: 6px; margin-bottom: 24px; }
.ok-m-summary {
  background: #fafbfc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 6px 20px;
  margin-bottom: 24px;
  text-align: left;
}
.ok-m-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
}
.ok-m-label { color: #888; }
.ok-m-value { color: #333; }
.ok-m-amount { color: #fa541c; font-weight: 600; }
.ok-m-actions { display: flex; gap: 12px; justify-content: center; }
.ok-m-btn { flex: 1; height: 40px; }
.ok-m-btn-primary { background: #1677ff; }
</style>
