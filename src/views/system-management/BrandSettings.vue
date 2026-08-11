<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import { CameraOutlined, DeleteOutlined, CheckCircleFilled, UploadOutlined, CloseOutlined } from '@antdv-next/icons'
import type { UploadProps } from 'antdv-next'
import { useBrandStore } from '@/stores/brand'

const brandStore = useBrandStore()
const formState = reactive({ ...brandStore.settings })

const saving = ref(false)

// ========== 通用图片上传 ==========
function getBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

const IMG_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/webp', 'image/x-icon']

function makeUploadProps(target: keyof typeof formState): UploadProps {
  return {
    showUploadList: false,
    accept: '.png,.jpg,.jpeg,.svg,.gif,.webp,.ico',
    beforeUpload: async (file: File) => {
      if (!IMG_TYPES.includes(file.type)) {
        message.error('仅支持图片格式文件')
        return false
      }
      formState[target] = await getBase64(file)
      return false
    },
  }
}

const faviconUploadProps = makeUploadProps('favicon')
const loginLogoUploadProps = makeUploadProps('loginLogo')
const loginBgUploadProps = makeUploadProps('loginBackground')
const headerLogoUploadProps = makeUploadProps('headerLogo')

// ========== 保存 / 重置 ==========
const handleSave = () => {
  saving.value = true
  setTimeout(() => {
    brandStore.settings = { ...formState }
    brandStore.apply()
    saving.value = false
    message.success('品牌设置已保存并生效')
  }, 500)
}

const handleReset = () => {
  brandStore.reset()
  Object.assign(formState, brandStore.settings)
  message.success('已恢复默认品牌配置')
}

// ========== 预览辅助 ==========
const previewTitle = computed(() => formState.browserTitle || '智慧巡检管理系统')
const loginBgStyle = computed(() => formState.loginBackground
  ? { backgroundImage: `url(${formState.loginBackground})` }
  : { background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 60%, #172554 100%)' })
</script>

<template>
  <div class="brand-settings">
    <div class="bs-container">
      <!-- ========== Header ========== -->
      <div class="bs-header">
        <div class="bs-header-left">
          <h2 class="bs-title">品牌设置</h2>
          <p class="bs-subtitle">自定义当前企业的品牌元素，保存后即可全局生效</p>
        </div>
        <span class="bs-header-tag">
          <CheckCircleFilled class="bs-header-tag-icon" />
          实时预览
        </span>
      </div>

      <!-- ========== 分区 1：浏览器标签 ========== -->
      <div class="bs-row">
        <div class="bs-card bs-form-card">
          <div class="bs-card-head">
            <span class="bs-card-index">1</span>
            <div class="bs-card-title-box">
              <div class="bs-card-title">浏览器标签</div>
              <div class="bs-card-desc">显示在浏览器标签页上的标题与图标</div>
            </div>
          </div>

          <div class="bs-field">
            <div class="bs-label">浏览器主标签标题</div>
            <a-input v-model:value="formState.browserTitle" placeholder="请输入浏览器标签标题" :maxlength="50" allow-clear />
          </div>

          <div class="bs-field">
            <div class="bs-label">浏览器图标（favicon）</div>
            <a-upload v-bind="faviconUploadProps" :show-upload-list="false" class="bs-upload-block">
              <div class="bs-upload-item">
                <div class="bs-upload-thumb" :class="{ empty: !formState.favicon }">
                  <img v-if="formState.favicon" :src="formState.favicon" class="bs-upload-img" alt="favicon" />
                  <CameraOutlined v-else class="bs-upload-icon" />
                </div>
                <div class="bs-upload-meta">
                  <span class="bs-upload-action">
                    <UploadOutlined />
                    {{ formState.favicon ? '更换图片' : '上传图片' }}
                  </span>
                  <span class="bs-upload-hint">支持 PNG / JPG / SVG / ICO</span>
                  <span class="bs-upload-hint">建议尺寸 32x32 ~ 64x64 px</span>
                </div>
                <span
                  v-if="formState.favicon"
                  class="bs-upload-remove"
                  @click.stop="formState.favicon = ''"
                >
                  <CloseOutlined />
                </span>
              </div>
            </a-upload>
          </div>
        </div>

        <div class="bs-card bs-preview-card">
          <div class="bs-preview-label">预览效果</div>
          <div class="browser-preview">
            <div class="browser-top">
              <span class="browser-dot red"></span>
              <span class="browser-dot yellow"></span>
              <span class="browser-dot green"></span>
              <div class="browser-tab">
                <img v-if="formState.favicon" :src="formState.favicon" class="browser-tab-favicon" alt="favicon" />
                <span class="browser-tab-text">{{ previewTitle }}</span>
                <span class="browser-tab-close">×</span>
              </div>
            </div>
            <div class="browser-body">
              <div class="browser-nav"></div>
              <div class="browser-content">
                <div class="browser-block w60"></div>
                <div class="browser-block w40"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 分区 2：登录页 ========== -->
      <div class="bs-row">
        <div class="bs-card bs-form-card">
          <div class="bs-card-head">
            <span class="bs-card-index">2</span>
            <div class="bs-card-title-box">
              <div class="bs-card-title">登录页</div>
              <div class="bs-card-desc">登录页面展示的品牌元素与背景</div>
            </div>
          </div>

          <div class="bs-field">
            <div class="bs-label">登录页品牌元素</div>
            <div class="bs-upload-grid">
              <a-upload v-bind="loginLogoUploadProps" :show-upload-list="false" class="bs-upload-block">
                <div class="bs-upload-item">
                  <div class="bs-upload-thumb" :class="{ empty: !formState.loginLogo }">
                    <img v-if="formState.loginLogo" :src="formState.loginLogo" class="bs-upload-img" alt="登录页LOGO" />
                    <CameraOutlined v-else class="bs-upload-icon" />
                  </div>
                  <div class="bs-upload-meta">
                    <span class="bs-upload-action">
                      <UploadOutlined />
                      {{ formState.loginLogo ? '更换' : '上传' }}
                    </span>
                    <span class="bs-upload-hint">建议 256x256 px</span>
                  </div>
                  <span
                    v-if="formState.loginLogo"
                    class="bs-upload-remove"
                    @click.stop="formState.loginLogo = ''"
                  >
                    <CloseOutlined />
                  </span>
                </div>
              </a-upload>

              <a-upload v-bind="loginBgUploadProps" :show-upload-list="false" class="bs-upload-block">
                <div class="bs-upload-item">
                  <div class="bs-upload-thumb bs-upload-thumb-bg" :class="{ empty: !formState.loginBackground }">
                    <img v-if="formState.loginBackground" :src="formState.loginBackground" class="bs-upload-img" alt="登录页背景" />
                    <CameraOutlined v-else class="bs-upload-icon" />
                  </div>
                  <div class="bs-upload-meta">
                    <span class="bs-upload-action">
                      <UploadOutlined />
                      {{ formState.loginBackground ? '更换' : '上传' }}
                    </span>
                    <span class="bs-upload-hint">建议 1920x1080 px</span>
                  </div>
                  <span
                    v-if="formState.loginBackground"
                    class="bs-upload-remove"
                    @click.stop="formState.loginBackground = ''"
                  >
                    <CloseOutlined />
                  </span>
                </div>
              </a-upload>
            </div>
          </div>

          <div class="bs-field">
            <div class="bs-label">登录页品牌名称</div>
            <a-input v-model:value="formState.loginBrandName" placeholder="请输入品牌名称" :maxlength="30" allow-clear />
          </div>

          <div class="bs-field bs-field-last">
            <div class="bs-label">登录页品牌副标题</div>
            <a-input v-model:value="formState.loginSubtitle" placeholder="请输入副标题" :maxlength="50" allow-clear />
          </div>
        </div>

        <div class="bs-card bs-preview-card">
          <div class="bs-preview-label">预览效果</div>
          <div class="login-preview" :style="loginBgStyle">
            <div class="login-preview-overlay"></div>
            <div class="login-preview-brand">
              <img v-if="formState.loginLogo" :src="formState.loginLogo" class="login-preview-logo" alt="登录页LOGO" />
              <div v-else class="login-preview-logo-placeholder">
                <CameraOutlined class="login-preview-logo-icon" />
              </div>
              <div class="login-preview-brand-text">
                <div class="login-preview-brand-name">{{ formState.loginBrandName || '智慧巡检管理系统' }}</div>
                <div class="login-preview-brand-sub">{{ formState.loginSubtitle }}</div>
              </div>
            </div>
            <div class="login-preview-panel">
              <div class="login-preview-input"></div>
              <div class="login-preview-input"></div>
              <div class="login-preview-btn">登 录</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 分区 3：主界面 ========== -->
      <div class="bs-row">
        <div class="bs-card bs-form-card">
          <div class="bs-card-head">
            <span class="bs-card-index">3</span>
            <div class="bs-card-title-box">
              <div class="bs-card-title">主界面</div>
              <div class="bs-card-desc">系统主界面顶栏的品牌标识与名称</div>
            </div>
          </div>

          <div class="bs-field">
            <div class="bs-label">主界面 Header Logo</div>
            <a-upload v-bind="headerLogoUploadProps" :show-upload-list="false" class="bs-upload-block">
              <div class="bs-upload-item">
                <div class="bs-upload-thumb" :class="{ empty: !formState.headerLogo }">
                  <img v-if="formState.headerLogo" :src="formState.headerLogo" class="bs-upload-img" alt="Header Logo" />
                  <CameraOutlined v-else class="bs-upload-icon" />
                </div>
                <div class="bs-upload-meta">
                  <span class="bs-upload-action">
                    <UploadOutlined />
                    {{ formState.headerLogo ? '更换图片' : '上传图片' }}
                  </span>
                  <span class="bs-upload-hint">支持 PNG / JPG / SVG</span>
                  <span class="bs-upload-hint">建议尺寸 128x128 px</span>
                </div>
                <span
                  v-if="formState.headerLogo"
                  class="bs-upload-remove"
                  @click.stop="formState.headerLogo = ''"
                >
                  <CloseOutlined />
                </span>
              </div>
            </a-upload>
          </div>

          <div class="bs-field bs-field-last">
            <div class="bs-label">主界面标题</div>
            <a-input v-model:value="formState.headerTitle" placeholder="请输入主界面标题" :maxlength="50" allow-clear />
          </div>
        </div>

        <div class="bs-card bs-preview-card">
          <div class="bs-preview-label">预览效果</div>
          <div class="header-preview">
            <div class="header-preview-side">
              <div class="header-preview-side-item active"></div>
              <div class="header-preview-side-item"></div>
              <div class="header-preview-side-item"></div>
            </div>
            <div class="header-preview-top">
              <div class="header-preview-left">
                <img v-if="formState.headerLogo" :src="formState.headerLogo" class="header-preview-logo" alt="Header Logo" />
                <div v-else class="header-preview-logo-placeholder">
                  <CameraOutlined class="header-preview-logo-icon" />
                </div>
                <span class="header-preview-title">{{ formState.headerTitle || '智慧巡检管理系统' }}</span>
              </div>
              <div class="header-preview-top-right">
                <span class="header-preview-menu"></span>
                <span class="header-preview-menu short"></span>
                <div class="header-preview-avatar"></div>
              </div>
            </div>
            <div class="header-preview-body">
              <div class="header-preview-card">
                <div class="header-preview-card-head"></div>
                <div class="header-preview-card-line"></div>
                <div class="header-preview-card-line short"></div>
              </div>
              <div class="header-preview-card">
                <div class="header-preview-card-head"></div>
                <div class="header-preview-card-line"></div>
                <div class="header-preview-card-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 底部操作 ========== -->
      <div class="bs-actions">
        <a-button size="large" @click="handleReset">
          <template #icon><DeleteOutlined /></template>
          恢复默认
        </a-button>
        <a-button type="primary" size="large" :loading="saving" @click="handleSave">保存设置</a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面背景 ========== */
.brand-settings {
  min-height: 100%;
  background: #f5f7fa;
  padding: 16px 20px 28px;
}

.bs-container {
  max-width: 1180px;
  margin: 0 auto;
}

/* ========== Header ========== */
.bs-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.bs-title {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
}

.bs-subtitle {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.bs-header-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 2px;
}

.bs-header-tag-icon {
  font-size: 12px;
}

/* ========== 分区行：表单列 + 预览列 ========== */
.bs-row {
  display: grid;
  grid-template-columns: minmax(0, 11fr) minmax(0, 13fr);
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 1080px) {
  .bs-row {
    grid-template-columns: 1fr;
  }
}

/* ========== 卡片 ========== */
.bs-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px 22px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.bs-form-card,
.bs-preview-card {
  display: flex;
  flex-direction: column;
}

.bs-card-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f2f3f5;
}

.bs-card-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.bs-card-title-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bs-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.bs-card-desc {
  font-size: 12px;
  color: #a0a4ab;
}

/* ========== 表单 ========== */
.bs-field {
  position: relative;
  margin-bottom: 14px;
}

.bs-field-last {
  margin-bottom: 0;
}

.bs-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
  margin-bottom: 8px;
}

/* ========== 上传块：缩略图 + 操作区 ========== */
.bs-upload-block {
  display: block;
}

.bs-upload-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px;
  border: 1px dashed #d9d9d9;
  border-radius: 10px;
  background: #fafbfc;
  transition: all 0.2s;
  cursor: pointer;
}

.bs-upload-item:hover {
  border-color: #1677ff;
  background: #f0f5ff;
}

.bs-upload-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #eef0f3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.bs-upload-thumb-bg {
  width: 96px;
}

.bs-upload-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bs-upload-icon {
  font-size: 20px;
  color: #bfc4cc;
}

.bs-upload-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.bs-upload-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: #1677ff;
}

.bs-upload-hint {
  font-size: 11px;
  color: #a0a4ab;
}

.bs-upload-remove {
  position: absolute;
  top: -7px;
  right: -7px;
  z-index: 3;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: all 0.2s;
}

.bs-upload-remove:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
  transform: scale(1.08);
}

.bs-upload-remove:active {
  transform: scale(0.95);
}

.bs-upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* ========== 预览卡片 ========== */
.bs-preview-label {
  font-size: 12px;
  color: #8c9099;
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.bs-preview-label::before {
  content: '';
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: #1677ff;
}

/* ===== 浏览器标签预览 ===== */
.browser-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8ebef;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  min-height: 190px;
}

.browser-top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f6f8fa;
  border-bottom: 1px solid #e8ebef;
}

.browser-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.browser-dot.red { background: #ff5f57; }
.browser-dot.yellow { background: #febc2e; }
.browser-dot.green { background: #28c840; }

.browser-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
  padding: 5px 12px;
  background: #fff;
  border: 1px solid #e8ebef;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  min-width: 190px;
  max-width: 260px;
}

.browser-tab-favicon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.browser-tab-text {
  flex: 1;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-tab-close {
  font-size: 14px;
  color: #c0c4cc;
  line-height: 1;
  flex-shrink: 0;
}

.browser-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.browser-nav {
  height: 34px;
  margin: 12px 14px 0;
  border-radius: 6px;
  background: #eef1f5;
}

.browser-content {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px 14px 14px;
}

.browser-block {
  height: 74px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e8edf4, #f0f3f8);
}

.browser-block.w60 { flex: 0 0 60%; }
.browser-block.w40 { flex: 1; }

/* ===== 登录页预览 ===== */
.login-preview {
  position: relative;
  flex: 1;
  min-height: 320px;
  border-radius: 10px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.login-preview-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 16, 34, 0.55) 0%, rgba(10, 16, 34, 0.15) 50%, rgba(10, 16, 34, 0.4) 100%);
}

/* 左上角品牌区 */
.login-preview-brand {
  position: absolute;
  top: 24px;
  left: 26px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 70%;
}

.login-preview-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  flex-shrink: 0;
}

.login-preview-logo-placeholder {
  width: 42px;
  height: 42px;
  border: 1px dashed rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.login-preview-logo-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.login-preview-brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.login-preview-brand-name {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-preview-brand-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧登录表单 */
.login-preview-panel {
  position: absolute;
  top: 50%;
  right: 30px;
  transform: translateY(-50%);
  z-index: 1;
  width: 200px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 10px;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-preview-input {
  width: 100%;
  height: 30px;
  border: 1px solid #e8ebef;
  border-radius: 6px;
  background: #fafbfc;
  margin-bottom: 12px;
}

.login-preview-btn {
  width: 100%;
  height: 32px;
  border-radius: 6px;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

/* ===== 主界面 Header 预览 ===== */
.header-preview {
  flex: 1;
  display: grid;
  grid-template-columns: 44px 1fr;
  grid-template-rows: 46px 1fr;
  border: 1px solid #e8ebef;
  border-radius: 10px;
  overflow: hidden;
  min-height: 240px;
  background: #fff;
}

.header-preview-side {
  grid-row: 1 / 3;
  background: #f8f9fb;
  border-right: 1px solid #eef0f3;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.header-preview-side-item {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #e8ebef;
}

.header-preview-side-item.active {
  background: #d6e6ff;
}

.header-preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #f0f2f5;
  background: #fff;
}

.header-preview-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-preview-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-preview-logo-placeholder {
  width: 26px;
  height: 26px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  flex-shrink: 0;
}

.header-preview-logo-icon {
  font-size: 12px;
  color: #bbb;
}

.header-preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-preview-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-preview-menu {
  width: 34px;
  height: 10px;
  border-radius: 3px;
  background: #e8ebef;
}

.header-preview-menu.short {
  width: 22px;
}

.header-preview-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e6f4ff;
  margin-left: 4px;
}

.header-preview-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
  background: #f5f7fa;
}

.header-preview-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-preview-card-head {
  width: 40%;
  height: 10px;
  border-radius: 3px;
  background: #eef1f5;
  margin-bottom: 10px;
}

.header-preview-card-line {
  height: 8px;
  border-radius: 3px;
  background: #f0f2f5;
  margin-bottom: 8px;
}

.header-preview-card-line.short {
  width: 70%;
  margin-bottom: 0;
}

/* ========== 底部操作 ========== */
.bs-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 2px 4px 0;
}

.bs-actions .ant-btn {
  min-width: 110px;
  border-radius: 8px;
}
</style>
