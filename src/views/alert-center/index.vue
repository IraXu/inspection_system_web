<!--
 * @Author: AloofXu
 * @Date: 2026-06-09 18:42:24
 * @LastEditors: null
 * @LastEditTime: 2026-06-09 18:50:02
 * @FilePath: /web-prototype/src/views/alert-center/index.vue
-->
<script setup lang="ts">
</script>

<template>
  <div class="uc-page">
    <a-result
      status="info"
      title="告警中心"
      sub-title="该模块web原型正在建设中，可先查看 Axure 原型"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" href="http://rp.wzxn.top/xzc/inspection_system/index.html?id=1osjab&p=%E5%91%8A%E8%AD%A6%E4%B8%AD%E5%BF%83&g=1" target="_blank">查看 Axure 原型</a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.uc-page { display:flex; align-items:center; justify-content:center; min-height:100%; background:#fff; padding:48px; }
</style>
