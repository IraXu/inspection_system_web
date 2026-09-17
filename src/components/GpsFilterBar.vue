<script setup lang="ts">
import { SearchOutlined, ReloadOutlined } from '@antdv-next/icons'

withDefaults(defineProps<{
  /** 控件尺寸：页面级查询栏用 default，地图浮层等紧凑场景用 small */
  size?: 'small' | 'default'
}>(), { size: 'default' })

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <div class="gfb">
    <div class="gfb-fields">
      <slot />
    </div>
    <span class="gfb-divider" />
    <div class="gfb-actions">
      <a-button type="primary" :size="size" @click="emit('search')">
        <template #icon><SearchOutlined /></template>查询
      </a-button>
      <a-button :size="size" @click="emit('reset')">
        <template #icon><ReloadOutlined /></template>重置
      </a-button>
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.gfb { display:flex; align-items:center; flex-wrap:wrap; gap:8px 10px; min-width:0; }
.gfb-fields { display:flex; align-items:center; flex-wrap:wrap; gap:8px 10px; min-width:0; }
.gfb-divider { width:1px; height:18px; background:#e8eef6; flex-shrink:0; }
.gfb-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
</style>
