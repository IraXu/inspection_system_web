<script setup lang="ts">
import { computed } from 'vue'
import { WifiOutlined } from '@antdv-next/icons'
import type { GpsNetworkType } from '@/types'

const props = withDefaults(defineProps<{
  /** 联网方式：wifi 只显示图标，cellular 显示信号强度柱 */
  network?: GpsNetworkType
  level?: 'strong' | 'medium' | 'weak'
  /** dark 用于深色底 */
  theme?: 'light' | 'dark'
}>(), { network: 'cellular', level: 'strong', theme: 'light' })

const isWifi = computed(() => props.network === 'wifi')

/** 共 4 格，按强度点亮 */
const activeBars = computed(() => ({ strong: 4, medium: 3, weak: 1 }[props.level]))

const levelText = computed(() =>
  props.level === 'strong' ? '信号强' : props.level === 'medium' ? '信号中' : '信号弱')

const title = computed(() => (isWifi.value ? 'WiFi 接入' : `移动网络 · ${levelText.value}`))
</script>

<template>
  <span class="sb" :class="[`sb-${theme}`]" :title="title">
    <!-- WiFi：仅图标，不体现强度 -->
    <WifiOutlined v-if="isWifi" class="sb-wifi" />
    <!-- 移动网络：信号强度柱 -->
    <span v-else class="sb-bars" :class="`lv-${level}`">
      <i
        v-for="n in 4"
        :key="n"
        class="sb-bar"
        :class="{ on: n <= activeBars }"
        :style="{ height: `${4 + n * 3}px` }"
      />
    </span>
  </span>
</template>

<style scoped>
.sb { display:inline-flex; align-items:flex-end; justify-content:center; height:16px; }
.sb-wifi { font-size:14px; color:#1677ff; line-height:1; }
.sb-bars { display:inline-flex; align-items:flex-end; gap:1.5px; height:16px; }
.sb-bar { width:2.5px; border-radius:1px; background:#d6dee8; transition:background .2s; }
.lv-strong .sb-bar.on { background:#16a34a; }
.lv-medium .sb-bar.on { background:#ea8c00; }
.lv-weak .sb-bar.on { background:#ff4d4f; }
/* 深色底 */
.sb-dark .sb-wifi { color:#fff; }
.sb-dark .sb-bar { background:rgba(255,255,255,.35); }
.sb-dark .sb-bar.on { background:#fff; }
</style>
