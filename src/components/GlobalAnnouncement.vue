<script setup lang="ts">
import { ref } from 'vue'
import { SoundOutlined, CloseOutlined } from '@ant-design/icons-vue'

const visible = ref(true)

const beamTheme = {
  components: {
    BorderBeam: { lineWidth: 3 },
  },
}
</script>

<template>
  <Teleport to="body">
    <Transition name="announce-fade">
      <div v-if="visible" class="global-announce-wrapper">
        <a-config-provider :theme="beamTheme">
          <a-border-beam
            :color="[
              { color: '#7c3aed', percent: 0 },
              { color: '#06b6d4', percent: 57 },
              { color: '#67e8f9', percent: 100 },
            ]"
          >
          <a-card class="announce-card" :bordered="false" size="small">
            <template #title>
              <span class="announce-title">
                <SoundOutlined class="announce-title-icon" />
                WEB原型公告
              </span>
            </template>
            <template #extra>
              <a-button
                type="text"
                size="small"
                class="announce-close-btn"
                @click="visible = false"
              >
                <template #icon><CloseOutlined /></template>
              </a-button>
            </template>
            <div class="announce-body">
              <div class="announce-item">
                <span class="announce-dot">●</span>
                <span>原型部署至海外 Github Page 上，访问过慢请自行打开网络代理</span>
              </div>
              <div class="announce-item">
                <span class="announce-dot">●</span>
                <span>SPA的history更改为hash模式，现在原型页面刷新不会404了🎉</span>
              </div>
              <div class="announce-item">
                <span class="announce-dot">●</span>
                <span>更多页面持续更新中，有疑问可联系产品部徐志诚</span>
              </div>
            </div>
          </a-card>
        </a-border-beam>
        </a-config-provider>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.global-announce-wrapper {
  position: fixed;
  top: 0.5%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: 460px;
  max-width: calc(100vw - 40px);
}

.announce-card {
  position: relative;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.announce-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%);
  border-bottom: 1px solid #d6e4ff;
  min-height: 40px;
  padding: 0 16px;
}

.announce-card :deep(.ant-card-head-title) {
  padding: 10px 0;
}

.announce-card :deep(.ant-card-body) {
  padding: 14px 18px;
}

.announce-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
}

.announce-title-icon {
  font-size: 15px;
}

.announce-close-btn {
  color: #999;
  transition: color 0.2s;
}
.announce-close-btn:hover {
  color: #333;
}

.announce-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.announce-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #555;
  line-height: 1.7;
}

.announce-dot {
  flex-shrink: 0;
  color: #1677ff;
  font-size: 8px;
  line-height: 1.7;
  margin-top: 1px;
}

/* 入场/离场过渡 */
.announce-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.announce-fade-leave-active {
  transition: all 0.25s ease-in;
}
.announce-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.92);
}
.announce-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.96);
}
</style>
