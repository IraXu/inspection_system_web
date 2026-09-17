<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** 电量 0~100 */
  value?: number
  charging?: boolean
  size?: number
}>(), { value: 100, charging: false, size: 15 })

/** 电池外壳内部可用宽度，按电量填充 */
const INNER_W = 11.4
const fillW = computed(() => Math.max(0, Math.min(1, props.value / 100)) * INNER_W)

/** 电量分档配色：<20 红，<50 橙，其余绿 */
const color = computed(() =>
  props.value < 20 ? '#ff4d4f' : props.value < 50 ? '#ea8c00' : '#16a34a')
</script>

<template>
  <span class="bi" :style="{ height: size + 'px' }">
    <svg :width="size * 1.55" :height="size" viewBox="0 0 26 16" fill="none">
      <!-- 电池外壳 -->
      <rect x="0.9" y="2.4" width="20.2" height="11.2" rx="3" :stroke="color" stroke-width="1.5" />
      <!-- 正极触点 -->
      <rect x="22.2" y="6" width="2.9" height="4" rx="1.2" :fill="color" />
      <!-- 电量填充 -->
      <rect x="3" :y="4.6" :width="fillW" height="6.8" rx="1.6" :fill="color" />
    </svg>
    <!-- 充电中的闪电角标 -->
    <svg v-if="charging" class="bi-bolt" :width="size * 0.75" :height="size * 0.9" viewBox="0 0 10 12">
      <path d="M6 0 L1 7 H4.2 L3.6 12 L9 5 H5.6 Z" fill="#1677ff" />
    </svg>
  </span>
</template>

<style scoped>
.bi { position:relative; display:inline-flex; align-items:center; justify-content:center; }
.bi-bolt { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); }
</style>
