<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const moduleTitle = computed(() => (route.meta.title as string) || '该模块')
</script>

<template>
  <div class="uc-page">
    <a-result
      status="info"
      :title="moduleTitle"
      sub-title="该模块web原型正在建设中，可先查看 Axure 原型"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" href="http://rp.wzxn.top/xzc/inspection_system/index.html?id=6lv6vc&p=%E7%B3%BB%E7%BB%9F%E7%AE%A1%E7%90%86%E2%9C%85&g=1" target="_blank">查看 Axure 原型</a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.uc-page { display:flex; align-items:center; justify-content:center; min-height:100%; background:#fff; padding:48px; }
</style>
