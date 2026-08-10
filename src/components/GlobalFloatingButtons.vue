<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { QrcodeOutlined, ReadOutlined, CustomerServiceOutlined, AndroidOutlined, AppleOutlined, WindowsOutlined, WechatOutlined } from '@ant-design/icons-vue'

const route = useRoute()
// 首页（工作台）常驻显示，其他页面向右隐藏仅漏出一半
const isHome = computed(() => route.path === '/' || route.path === '/workbench')

const MANUAL_URL = ''
const openManual = () => {
  if (MANUAL_URL) window.open(MANUAL_URL, '_blank', 'noopener')
}

// Windows 客户端下载地址，替换为实际下载链接即可
const WINDOWS_DOWNLOAD_URL = ''
const downloadWindows = () => {
  if (WINDOWS_DOWNLOAD_URL) window.open(WINDOWS_DOWNLOAD_URL, '_blank', 'noopener')
}

interface QRItem {
  key: string
  label: string
  icon: any
  type: 'qr' | 'download' // qr: 展示二维码, download: 展示下载按钮
}
const qrItems: QRItem[] = [
  { key: 'wechat', label: '装维小程序', icon: WechatOutlined, type: 'qr' },
  { key: 'android', label: '安卓 App', icon: AndroidOutlined, type: 'qr' },
  { key: 'ios', label: 'iOS App', icon: AppleOutlined, type: 'qr' },
  { key: 'windows', label: 'Windows 端', icon: WindowsOutlined, type: 'download' },
]
const activeKey = ref(qrItems[0].key)
const activeItem = computed(() => qrItems.find(i => i.key === activeKey.value)!)

const qrOpen = ref(false)
const qrBtnRef = ref<HTMLElement | null>(null)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

const showQR = () => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  showTimer = setTimeout(() => { qrOpen.value = true }, 150)
}
const hideQR = () => {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
  hideTimer = setTimeout(() => { qrOpen.value = false }, 250)
}

const qrCardStyle = reactive({ top: '0px', right: '0px' })
const updatePosition = () => {
  if (!qrBtnRef.value) return
  const rect = qrBtnRef.value.getBoundingClientRect()
  qrCardStyle.top = `${rect.top + rect.height / 2}px`
  qrCardStyle.right = `${window.innerWidth - rect.left + 20}px`
}

const onQRMouseEnter = (e: MouseEvent) => {
  qrBtnRef.value = e.currentTarget as HTMLElement
  updatePosition()
  showQR()
}

onMounted(() => {
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})
onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <a-float-button-group
    trigger="click"
    shape="square"
    :class="{ 'float-btn-hidden': !isHome }"
    :style="{ insetInlineEnd: '24px', bottom: '120px' }"
  >
    <template #icon>
      <CustomerServiceOutlined />
    </template>

    <a-float-button @mouseenter="onQRMouseEnter" @mouseleave="hideQR">
      <template #icon><QrcodeOutlined /></template>
    </a-float-button>

    <a-float-button @click="openManual">
      <template #icon><ReadOutlined /></template>
    </a-float-button>
  </a-float-button-group>

  <!-- 二维码卡片 -->
  <Teleport to="body">
    <Transition name="qr-card-fade">
      <div
        v-if="qrOpen"
        class="qr-card-wrapper"
        :style="{ top: qrCardStyle.top, right: qrCardStyle.right }"
        @mouseenter="showQR"
        @mouseleave="hideQR"
      >
        <div class="qr-card">
          <!-- 当前端名称 -->
          <div class="qr-heading">{{ activeItem.label }}</div>

          <!-- 二维码 / 下载按钮 -->
          <div class="qr-core">
            <template v-if="activeItem.type === 'qr'">
              <div class="qr-core-inner">
                <component :is="activeItem.icon" class="qr-core-icon" />
              </div>
            </template>
            <template v-else>
              <a class="qr-download" @click="downloadWindows">
                <div class="qr-core-inner qr-core-download">
                  <WindowsOutlined class="qr-core-windows" />
                  <span class="qr-download-text">点击下载</span>
                </div>
              </a>
            </template>
          </div>

          <!-- 提示 -->
          <p class="qr-tip">
            <template v-if="activeItem.type === 'qr'">
              <template v-if="activeItem.key === 'wechat'">打开微信扫一扫</template>
              <template v-else>打开{{ activeItem.label }}扫一扫</template>
            </template>
            <template v-else>适用于 Windows 7 及以上系统</template>
          </p>

          <!-- 端切换指示器 -->
          <div class="qr-dots">
            <div
              v-for="item in qrItems"
              :key="item.key"
              class="qr-dot"
              :class="{ active: item.key === activeKey }"
              @click="activeKey = item.key"
            >
              <component :is="item.icon" class="qr-dot-icon" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* ====== 非首页：向右隐藏，仅漏出一半 ====== */
.float-btn-hidden {
  transition: transform 0.3s ease;
}
.float-btn-hidden:not(:hover) {
  transform: translateX(calc(100% - 12px));
  opacity: 0.65;
}
.float-btn-hidden:hover {
  transform: translateX(0);
  opacity: 1;
}

/* ====== 二维码卡片 ====== */
.qr-card-wrapper {
  position: fixed;
  z-index: 1100;
  transform: translateY(-50%);
  pointer-events: auto;
}

.qr-card {
  width: 220px;
  padding: 24px 20px 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 6px 24px rgba(0, 0, 0, 0.08),
    0 16px 48px rgba(0, 0, 0, 0.06);
}

/* 标题 */
.qr-heading {
  font-size: 16px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  letter-spacing: -0.2px;
}

/* 二维码 / 下载区 */
.qr-core {
  display: flex;
  justify-content: center;
  margin: 18px 0;
}
.qr-core-inner {
  width: 164px;
  height: 164px;
  border-radius: 16px;
  background: #f5f6f8;
  border: 1px solid #eceef1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
}
.qr-core-icon {
  font-size: 72px;
  color: #c8cdd4;
}
.qr-download {
  display: block;
  cursor: pointer;
  text-decoration: none;
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.qr-download:hover .qr-core-download {
  transform: scale(1.03);
  border-color: #91caff;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.15);
}
.qr-download:active .qr-core-download {
  transform: scale(0.98);
}
.qr-core-download {
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.qr-core-windows {
  font-size: 56px;
  color: #1677ff;
}
.qr-download-text {
  font-size: 13px;
  font-weight: 600;
  color: #1677ff;
}

/* 提示文字 */
.qr-tip {
  margin: 0 0 18px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
}

/* 端切换 */
.qr-dots {
  display: flex;
  justify-content: center;
  gap: 14px;
  padding: 8px 0 0;
  border-top: 1px solid #f0f0f0;
}
.qr-dot {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #bfbfbf;
  cursor: pointer;
  transition: all 0.2s ease;
}
.qr-dot:hover {
  color: #1677ff;
  background: #f0f5ff;
}
.qr-dot.active {
  color: #1677ff;
  background: #e6f4ff;
}
.qr-dot-icon {
  font-size: 20px;
}

/* 卡片过渡 */
.qr-card-fade-enter-active {
  transition: opacity 0.18s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.qr-card-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.qr-card-fade-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(8px) scale(0.94);
}
.qr-card-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(4px) scale(0.96);
}
</style>
