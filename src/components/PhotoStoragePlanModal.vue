<script setup lang="ts">
import { computed, ref, watch, onUnmounted, type Component } from 'vue'
import { message } from 'antdv-next'
import {
  PictureOutlined, ShoppingOutlined,
  InfoCircleFilled, ClockCircleOutlined,
  AlipayCircleOutlined, WechatFilled, GlobalOutlined,
} from '@antdv-next/icons'
import dayjs from 'dayjs'
import type { PhotoResourcePack } from '@/types'
import { useGpsStore } from '@/stores/gps'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const gpsStore = useGpsStore()

const open = computed({
  get: () => props.open,
  set: v => emit('update:open', v),
})

/** 单张均价（元/张） */
const unitPrice = (pack: PhotoResourcePack) => (pack.price / pack.photos)

/** 相对最高单价的折扣（%） */
const maxUnit = computed(() =>
  Math.max(...gpsStore.photoPacks.map(p => p.price / p.photos)))

// ==================== 支付方式（第一期：支付宝 / 微信 / PayPal） ====================
type PayMethod = 'alipay' | 'wechat' | 'paypal'
interface PayMethodOption {
  key: PayMethod
  label: string
  icon: Component
  color: string
}
const payMethods: PayMethodOption[] = [
  { key: 'alipay', label: '支付宝', icon: AlipayCircleOutlined, color: '#1677ff' },
  { key: 'wechat', label: '微信', icon: WechatFilled, color: '#07c160' },
  { key: 'paypal', label: 'PayPal', icon: GlobalOutlined, color: '#003087' },
]
const payMethod = ref<PayMethod>('alipay')
const currentPay = computed(() => payMethods.find(p => p.key === payMethod.value)!)
/** PayPal 走网页跳转，其余为扫码支付 */
const isRedirectPay = computed(() => payMethod.value === 'paypal')

// ==================== 支付弹窗 ====================
const payVisible = ref(false)
const pendingPack = ref<PhotoResourcePack | null>(null)
const payOrderNo = ref('')
const paying = ref(false)

const payMinute = ref(10)
const paySecond = ref(0)
let payTimer: ReturnType<typeof setInterval> | null = null
const payCountdown = computed(() =>
  `${String(payMinute.value).padStart(2, '0')}:${String(paySecond.value).padStart(2, '0')}`)

const stopPayTimer = () => {
  if (payTimer) { clearInterval(payTimer); payTimer = null }
}

const startPayTimer = () => {
  payMinute.value = 10
  paySecond.value = 0
  stopPayTimer()
  payTimer = setInterval(() => {
    if (paySecond.value > 0) {
      paySecond.value--
    } else if (payMinute.value > 0) {
      payMinute.value--
      paySecond.value = 59
    } else {
      stopPayTimer()
      payVisible.value = false
      message.info('支付已超时，请重新发起')
    }
  }, 1000)
}

/** 点「立即购买」：扫码方式生成二维码，PayPal 走跳转网页支付 */
const openPay = (pack: PhotoResourcePack) => {
  pendingPack.value = pack
  payOrderNo.value = `ORD${dayjs().format('YYYYMMDDHHmmss')}`
  payVisible.value = true
  if (isRedirectPay.value) stopPayTimer()
  else startPayTimer()
}

const closePay = () => {
  payVisible.value = false
  stopPayTimer()
}

/** 虚拟二维码占位：按订单号确定性生成，同一订单每次渲染保持一致 */
const fakeQrRects = computed(() => {
  const seed = payOrderNo.value || 'photo-pack-pay'
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const rand = () => { hash = (hash * 1103515245 + 12345) >>> 0; return (hash >> 16) & 1 }
  const N = 21
  const rects: { x: number; y: number; w: number; h: number }[] = []
  // 三个定位角（左上、右上、左下）
  const finder = (fx: number, fy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const border = x === 0 || x === 6 || y === 0 || y === 6
      const core = (x >= 2 && x <= 4) && (y >= 2 && y <= 4)
      if (border || core) rects.push({ x: fx + x, y: fy + y, w: 1, h: 1 })
    }
  }
  finder(0, 0)
  finder(N - 7, 0)
  finder(0, N - 7)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    if (!inFinder && rand()) rects.push({ x, y, w: 1, h: 1 })
  }
  return rects
})

/** 支付成功：额度立即到账 */
const settlePay = () => {
  const pack = pendingPack.value
  if (!pack || paying.value) return
  paying.value = true
  // 模拟支付异步，展示 loading 态
  setTimeout(() => {
    gpsStore.buyPhotoPack(pack.key, currentPay.value.label + '支付')
    message.success(`已购买 ${pack.photos.toLocaleString()} 张存储额度`)
    paying.value = false
    closePay()
    emit('update:open', false)
  }, 500)
}

// 主弹窗关闭时一并收起支付弹窗，避免残留
watch(open, v => { if (!v) closePay() })
onUnmounted(stopPayTimer)
</script>

<template>
  <a-modal
    v-model:open="open"
    title="存储资源包"
    :footer="null"
    :width="920"
    :styles="{ body: { padding: '0 24px 24px' } }"
  >
    <div class="pp-tip" :class="{ warn: gpsStore.quotaExhausted }">
      <InfoCircleFilled />
      <span v-if="gpsStore.quotaExhausted">
        <strong>存储额度已用尽</strong>，平台已停止接收设备上报的截图与信息。
        购买资源包后立即恢复接收，额度由企业下全部设备共享使用。
      </span>
      <span v-else>
        照片存储额度按企业统一计算，由企业下全部设备共享。
        额度用完后平台将停止接收截图与信息，如需继续使用请购买资源包。
      </span>
    </div>

    <!-- 额度总览 -->
    <div class="pp-quota">
      <div class="pp-quota-main">
        <div class="pp-quota-cell">
          <span class="pp-quota-k">已用额度</span>
          <span class="pp-quota-v" :class="{ danger: gpsStore.quotaPercent >= 90 }">
            {{ gpsStore.usedPhotoQuota.toLocaleString() }}
            <em>/ {{ gpsStore.totalPhotoQuota.toLocaleString() }} 张</em>
          </span>
        </div>
        <div class="pp-quota-side">
          <div class="pp-quota-mini">
            <span class="pp-quota-k">剩余</span>
            <span class="pp-quota-mv" :class="{ danger: gpsStore.remainingPhotoQuota === 0 }">
              {{ gpsStore.remainingPhotoQuota.toLocaleString() }} 张
            </span>
          </div>
          <div class="pp-quota-mini">
            <span class="pp-quota-k">已购资源包</span>
            <span class="pp-quota-mv">{{ gpsStore.purchasedPhotos.toLocaleString() }} 张</span>
          </div>
        </div>
      </div>
      <div class="pp-quota-bar">
        <i :style="{ width: gpsStore.quotaPercent + '%' }" :class="{ danger: gpsStore.quotaPercent >= 90 }" />
      </div>
    </div>

    <!-- 支付方式 -->
    <div class="pp-pay-row">
      <span class="pp-pay-label">支付方式</span>
      <div class="pp-pay-methods">
        <div
          v-for="pm in payMethods"
          :key="pm.key"
          class="pp-pay-method"
          :class="{ active: payMethod === pm.key }"
          @click="payMethod = pm.key"
        >
          <component :is="pm.icon" :style="{ color: pm.color }" />
          <span>{{ pm.label }}</span>
        </div>
      </div>
      <span class="pp-pay-note">{{ isRedirectPay ? 'PayPal 将跳转至网页完成支付' : '扫码支付，10 分钟内有效' }}</span>
    </div>

    <!-- 资源包 -->
    <div class="pp-grid">
      <div
        v-for="pack in gpsStore.photoPacks"
        :key="pack.key"
        class="pp-card"
        :class="{ rec: pack.recommended }"
      >
        <span v-if="pack.recommended" class="pp-badge">推荐</span>
        <h4 class="pp-name">{{ pack.name }}</h4>
        <div class="pp-photos">
          <PictureOutlined />
          <b>{{ pack.photos.toLocaleString() }}</b>
          <span>张</span>
        </div>
        <div class="pp-price">
          <span class="pp-cur">¥</span><b>{{ pack.price }}</b>
        </div>
        <div class="pp-unit">
          约 ¥{{ unitPrice(pack).toFixed(3) }} / 张
          <span v-if="unitPrice(pack) < maxUnit" class="pp-save">
            省 {{ Math.round((1 - unitPrice(pack) / maxUnit) * 100) }}%
          </span>
        </div>
        <p class="pp-desc">{{ pack.desc }}</p>
        <a-button block type="primary" @click="openPay(pack)">
          <template #icon><ShoppingOutlined /></template>立即购买
        </a-button>
      </div>
    </div>

    <p class="pp-foot">
      资源包为一次性购买，额度长期有效、不设过期时间，可跨设备与组织共享。
      如需更大额度或专属折扣，可联系商务获取机构定制报价。
    </p>
  </a-modal>

  <!-- ==================== 支付弹窗（独立于主弹窗，避免层叠遮挡） ==================== -->
  <a-modal
    v-model:open="payVisible"
    :footer="null"
    :width="380"
    :closable="false"
    :mask-closable="false"
    :destroy-on-hidden="true"
    centered
    class="pp-pay-modal"
  >
    <div class="pp-pay-box">
      <div class="pp-pay-head">
        <span class="pp-pay-title">{{ isRedirectPay ? '网页支付' : '扫码支付' }}</span>
        <span class="pp-pay-close" @click="closePay">
          <svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M512 471.6l202-202a28.6 28.6 0 0 1 40.4 40.4L552.4 512l202 202a28.6 28.6 0 0 1-40.4 40.4l-202-202-202 202A28.6 28.6 0 0 1 269.6 714l202-202-202-202a28.6 28.6 0 0 1 40.4-40.4z" fill="#c2c2c2"/></svg>
        </span>
      </div>

      <div class="pp-pay-amount">¥{{ (pendingPack?.price ?? 0).toLocaleString() }}</div>
      <div class="pp-pay-orderno">订单号：{{ payOrderNo }}</div>
      <div class="pp-pay-pack">
        {{ pendingPack?.name }} · {{ (pendingPack?.photos ?? 0).toLocaleString() }} 张存储额度
      </div>

      <!-- 扫码支付 -->
      <template v-if="!isRedirectPay">
        <div class="pp-pay-qr">
          <svg width="180" height="180" viewBox="0 0 21 21" role="img" aria-label="支付二维码（占位）">
            <rect width="21" height="21" fill="#ffffff" />
            <rect
              v-for="(r, i) in fakeQrRects"
              :key="i"
              :x="r.x" :y="r.y" :width="r.w" :height="r.h"
              :fill="currentPay.key === 'wechat' ? '#07c160' : '#1677ff'"
            />
          </svg>
        </div>
        <div class="pp-pay-tip">打开{{ currentPay.label }}扫一扫</div>
        <div class="pp-pay-expire">请在 10 分钟内完成支付</div>
        <div class="pp-pay-countdown"><ClockCircleOutlined /> {{ payCountdown }}</div>
      </template>

      <!-- PayPal 跳转网页支付 -->
      <template v-else>
        <div class="pp-pay-redirect">
          <GlobalOutlined class="pp-pay-redirect-icon" />
          <p>即将跳转到 <b>PayPal</b> 安全支付页面完成付款</p>
          <p class="pp-pay-redirect-sub">跳转后请在新页面确认订单金额，支付完成后额度将自动到账</p>
        </div>
      </template>

      <div class="pp-pay-footer">
        <a-button
          v-if="isRedirectPay"
          type="primary"
          size="middle"
          :loading="paying"
          @click="settlePay"
        >前往 PayPal 支付（演示）</a-button>
        <a-button
          v-else
          type="text"
          size="middle"
          class="pp-pay-demo"
          :loading="paying"
          @click="settlePay"
        >模拟扫码成功（演示）</a-button>
        <a-button size="middle" @click="closePay">取消</a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.pp-tip { display:flex; gap:8px; padding:11px 13px; background:#f0f7ff; border:1px solid #dbeafe; border-radius:10px; font-size:12px; line-height:1.7; color:#1d4ed8; }
.pp-tip.warn { background:#fff7e6; border-color:#ffe0a3; color:#c76a00; }
.pp-tip :deep(.anticon) { margin-top:3px; flex-shrink:0; }
.pp-tip strong { font-weight:600; }

.pp-quota { position:relative; padding:16px 18px 20px; margin-top:14px; background:#f8fafd; border-radius:11px; }
.pp-quota-main { display:flex; align-items:center; gap:28px; flex-wrap:wrap; }
.pp-quota-cell { display:flex; flex-direction:column; gap:5px; }
.pp-quota-k { font-size:11.5px; color:#94a3b8; }
.pp-quota-v { font-size:24px; font-weight:700; color:#1f2937; font-variant-numeric:tabular-nums; line-height:1.1; }
.pp-quota-v em { font-size:14px; font-weight:500; font-style:normal; color:#94a3b8; margin-left:2px; }
.pp-quota-v.danger { color:#ff4d4f; }
.pp-quota-side { display:flex; align-items:center; gap:28px; margin-left:auto; }
.pp-quota-mini { display:flex; flex-direction:column; gap:5px; }
.pp-quota-mv { font-size:14px; font-weight:600; color:#334155; font-variant-numeric:tabular-nums; }
.pp-quota-mv.danger { color:#ff4d4f; }
.pp-quota-bar { position:absolute; left:18px; right:18px; bottom:10px; height:5px; border-radius:3px; background:#e8eef6; overflow:hidden; }
.pp-quota-bar i { display:block; height:100%; border-radius:3px; background:#1677ff; transition:width .3s; }
.pp-quota-bar i.danger { background:#ff4d4f; }

/* 支付方式 */
.pp-pay-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:14px; }
.pp-pay-label { font-size:12.5px; color:#64748b; flex-shrink:0; }
.pp-pay-methods { display:flex; align-items:center; gap:9px; }
.pp-pay-method { display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border:1px solid #e2e8f0; border-radius:9px; background:#fff; font-size:12.5px; color:#475569; cursor:pointer; transition:all .16s; }
.pp-pay-method:hover { border-color:#91caff; }
.pp-pay-method.active { border-color:#1677ff; background:#e6f4ff; color:#1677ff; font-weight:500; }
.pp-pay-method :deep(.anticon) { font-size:16px; }
.pp-pay-note { margin-left:auto; font-size:11.5px; color:#b6c1cd; }

.pp-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; margin-top:14px; }
.pp-card { position:relative; display:flex; flex-direction:column; padding:16px 14px; border:1px solid #e8eef6; border-radius:12px; background:#fff; transition:all .18s; }
.pp-card:hover { border-color:#a8cdfd; box-shadow:0 6px 20px rgba(22,119,255,.1); }
.pp-card.rec { border-color:#a8cdfd; }
.pp-badge { position:absolute; right:0; top:0; padding:2px 10px; border-radius:0 12px 0 10px; background:#1677ff; color:#fff; font-size:10.5px; }

.pp-name { margin:0 0 10px; font-size:13px; font-weight:600; color:#1f2937; }
.pp-photos { display:flex; align-items:baseline; gap:3px; color:#1677ff; margin-bottom:8px; }
.pp-photos :deep(.anticon) { font-size:13px; margin-right:2px; }
.pp-photos b { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; }
.pp-photos span { font-size:12px; color:#8fbcf5; }

.pp-price { display:flex; align-items:baseline; gap:1px; color:#1f2937; }
.pp-cur { font-size:13px; }
.pp-price b { font-size:22px; font-weight:700; }
.pp-unit { display:flex; align-items:center; gap:5px; margin-top:4px; font-size:11px; color:#94a3b8; }
.pp-save { padding:0 5px; border-radius:8px; background:#eafaf0; color:#15803d; font-size:10px; }

.pp-desc { flex:1; margin:10px 0 12px; font-size:11px; line-height:1.65; color:#94a3b8; }

.pp-foot { margin:14px 0 0; font-size:11.5px; line-height:1.75; color:#94a3b8; }

/* ==================== 支付弹窗 ==================== */
.pp-pay-modal :deep(.ant-modal-content) { border-radius:12px; padding:24px 20px 20px; }
.pp-pay-box { display:flex; flex-direction:column; align-items:center; }
.pp-pay-head { width:100%; display:flex; align-items:center; justify-content:center; position:relative; }
.pp-pay-title { font-size:15px; font-weight:600; color:#1e293b; }
.pp-pay-close { position:absolute; right:0; top:0; display:inline-flex; cursor:pointer; padding:2px; }
.pp-pay-close:hover svg path { fill:#999; }
.pp-pay-amount { margin-top:16px; font-size:30px; font-weight:700; color:#ff7a45; line-height:1; }
.pp-pay-orderno { margin-top:8px; font-size:13px; color:#94a3b8; }
.pp-pay-pack { margin-top:6px; font-size:12.5px; color:#475569; }
.pp-pay-qr { margin-top:16px; }
.pp-pay-tip { margin-top:14px; font-size:15px; font-weight:500; color:#1e293b; }
.pp-pay-expire { margin-top:6px; font-size:12px; color:#94a3b8; }
.pp-pay-countdown { margin-top:10px; display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:999px; background:#fff7e6; color:#d46b08; font-size:13px; font-variant-numeric:tabular-nums; }

.pp-pay-redirect { margin-top:20px; display:flex; flex-direction:column; align-items:center; text-align:center; padding:0 6px; }
.pp-pay-redirect-icon { font-size:44px; color:#003087; }
.pp-pay-redirect p { margin:14px 0 0; font-size:13.5px; color:#1e293b; line-height:1.6; }
.pp-pay-redirect-sub { font-size:12px !important; color:#94a3b8 !important; }

.pp-pay-footer { margin-top:20px; width:100%; display:flex; align-items:center; justify-content:flex-end; gap:12px; }
.pp-pay-demo { color:#94a3b8; }
</style>
