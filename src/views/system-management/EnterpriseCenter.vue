<script setup lang="ts">
import { ref, reactive, shallowRef, markRaw, computed } from 'vue'
import { message } from 'antdv-next'
import {
  CameraOutlined, EnvironmentOutlined, InboxOutlined, CopyOutlined,
  ShopOutlined, BuildOutlined, ApartmentOutlined,
  ToolOutlined, BookOutlined, ProjectOutlined, PlusOutlined,
  CheckCircleFilled, ReloadOutlined, SaveOutlined,
  FileTextOutlined, ContactsOutlined, AppstoreOutlined, BankOutlined,
} from '@antdv-next/icons'
import type { UploadProps } from 'antdv-next'
import { useEnterpriseStore } from '@/stores/enterprise'

// ========== 企业码 ==========
const enterpriseCode = ref('xxxx12345xxx')

const copyCode = () => {
  navigator.clipboard?.writeText(enterpriseCode.value).then(() => {
    message.success('企业码已复制')
  }).catch(() => {
    message.info('复制失败，请手动复制')
  })
}

// ========== 表单数据 ==========
const formState = reactive({
  name: '南京Dream信息技术有限公司',
  scale: '201-500人',
  industryL1: '智慧商贸',
  industryL2: '零售连锁',
  description: 'Dream信息技术有限公司成立于2018年，是一家专注于智慧零售解决方案的高新技术企业。公司致力于为连锁门店提供智能化巡检、远程视频管理、云广播等一站式数字化运营服务，已累计服务超过5000家门店，覆盖全国30个省市自治区。',
  creditCode: '91320102MA1WXXXXXX',
  legalPerson: '张明远',
  registeredAddress: '南京市玄武区珠江路88号新世界中心A座18层',
  contactPerson: '李建国',
  contactTitle: '行政总监',
  contactPhone: '13951888888',
})

// 初始值快照，用于「重置」
const initialFormState = { ...formState }

// 名片副标题（行业 · 规模）
const heroSubtitle = computed(() =>
  [formState.industryL1, formState.industryL2, formState.scale].filter(Boolean).join(' · ')
)

// ========== 公司规模选项 ==========
const scaleOptions = [
  { label: '1-50人', value: '1-50人' },
  { label: '51-200人', value: '51-200人' },
  { label: '201-500人', value: '201-500人' },
  { label: '501-1000人', value: '501-1000人' },
  { label: '1000人以上', value: '1000人以上' },
]

// ========== 所属行业（一级/二级联动） ==========
interface IndustryOption {
  value: string
  label: string
  children: { value: string; label: string }[]
}

const industryTree: IndustryOption[] = [
  { value: '智慧建筑', label: '智慧建筑', children: [
    { value: '智慧工地', label: '智慧工地' },
    { value: '智慧社区', label: '智慧社区' },
    { value: '智慧物业', label: '智慧物业' },
    { value: '酒店公寓', label: '酒店公寓' },
  ]},
  { value: '智慧商贸', label: '智慧商贸', children: [
    { value: '商超便利', label: '商超便利' },
    { value: '零售连锁', label: '零售连锁' },
    { value: '餐饮生鲜', label: '餐饮生鲜' },
    { value: '快递物流', label: '快递物流' },
    { value: '报警值守', label: '报警值守' },
    { value: '娱乐服务', label: '娱乐服务' },
    { value: '医药连锁', label: '医药连锁' },
  ]},
  { value: '智慧农业', label: '智慧农业', children: [
    { value: '智慧农业', label: '智慧农业' },
  ]},
  { value: '运营商', label: '运营商', children: [
    { value: '运营商', label: '运营商' },
  ]},
  { value: '其它', label: '其它', children: [
    { value: '其它', label: '其它' },
  ]},
]

const industryL1Options = computed(() => industryTree.map(i => ({ value: i.value, label: i.label })))

const industryL2Options = computed(() => {
  const found = industryTree.find(i => i.value === formState.industryL1)
  return found ? found.children : []
})

const onIndustryL1Change = () => {
  const children = industryL2Options.value
  if (children.length > 0) {
    formState.industryL2 = children[0].value
  }
}

const industryFilter = (input: string, option: any) =>
  option.label.toLowerCase().includes(input.toLowerCase())

// ========== 应用场景 ==========
interface ScenarioItem {
  key: string
  label: string
  icon: any
}

const scenarios = shallowRef<ScenarioItem[]>([
  { key: 'store', label: '门店', icon: markRaw(ShopOutlined) },
  { key: 'factory', label: '厂区', icon: markRaw(BuildOutlined) },
  { key: 'district', label: '园区', icon: markRaw(ApartmentOutlined) },
  { key: 'site', label: '站点', icon: markRaw(EnvironmentOutlined) },
  { key: 'warehouse', label: '仓库', icon: markRaw(InboxOutlined) },
  { key: 'construction', label: '工地', icon: markRaw(ToolOutlined) },
  { key: 'school', label: '学校', icon: markRaw(BookOutlined) },
  { key: 'project', label: '项目', icon: markRaw(ProjectOutlined) },
])

const selectedScenario = ref<string | null>('store')

const selectScenario = (key: string) => {
  selectedScenario.value = selectedScenario.value === key ? null : key
}

// ========== 上传 ==========
const logoFileList = ref<any[]>([
  { uid: '-1', name: 'company-logo.png', status: 'done', url: 'https://picsum.photos/200/200?random=1' },
])
const licenseFileList = ref<any[]>([
  { uid: '-2', name: 'business-license.jpg', status: 'done', url: 'https://picsum.photos/400/300?random=2' },
])

// 名片实时展示当前 Logo
const logoPreview = computed(() => logoFileList.value[0]?.url || '')

const logoUploadProps: UploadProps = {
  action: '#',
  listType: 'picture-card',
  maxCount: 1,
  accept: 'image/jpeg,image/png',
  beforeUpload: (file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isImage) {
      message.error('只能上传 JPG/PNG 格式图片')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过2MB')
      return false
    }
    return false
  },
}

const licenseUploadProps: UploadProps = {
  action: '#',
  listType: 'picture-card',
  maxCount: 1,
  accept: 'image/jpeg,image/png',
  beforeUpload: (file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isImage) {
      message.error('只能上传 JPG/PNG 格式图片')
      return false
    }
    return false
  },
}

// ========== 保存 / 重置 ==========
const enterpriseStore = useEnterpriseStore()

const saving = ref(false)
const handleSave = () => {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    // 保存当前企业的应用场景配置，数据大屏据此自动匹配展示场景
    enterpriseStore.save('ent-default', {
      scenarioKey: (selectedScenario.value || 'store') as any,
    })
    message.success('企业信息保存成功')
  }, 800)
}

const handleReset = () => {
  Object.assign(formState, initialFormState)
  selectedScenario.value = 'store'
  message.info('已重置为初始内容')
}
</script>
<template>
  <div class="ec-page">
    <div class="ec-container">
      <!-- ========== 企业名片横幅 ========== -->
      <div class="ec-card ec-banner">
        <div class="ec-banner-main">
          <div class="ec-banner-logo">
            <img v-if="logoPreview" :src="logoPreview" alt="企业Logo" />
            <ShopOutlined v-else class="ec-banner-logo-fallback" />
          </div>
          <div class="ec-banner-info">
            <div class="ec-banner-name">{{ formState.name }}</div>
            <div class="ec-banner-desc">{{ heroSubtitle }}</div>
          </div>
        </div>
        <div class="ec-banner-code">
          <span class="ec-code-key">企业码</span>
          <span class="ec-code-val">{{ enterpriseCode }}</span>
          <a-button type="text" size="small" class="ec-copy-btn" @click="copyCode">
            <template #icon><CopyOutlined /></template>
          </a-button>
        </div>
      </div>

      <!-- ========== 基本信息 ========== -->
      <section class="ec-card ec-section">
        <div class="section-head">
          <span class="section-icon"><FileTextOutlined /></span>
          <div class="section-head-text">
            <h3 class="section-title">基本信息</h3>
            <p class="section-subtitle">企业名称、规模与所属行业</p>
          </div>
        </div>

        <a-form :model="formState" layout="vertical" class="ec-form">
          <!-- Logo区域 -->
          <a-form-item label="企业Logo">
            <div class="logo-area">
              <a-upload v-model:file-list="logoFileList" v-bind="logoUploadProps">
                <div v-if="logoFileList.length === 0" class="logo-upload-dashed">
                  <CameraOutlined class="logo-camera-icon" />
                </div>
              </a-upload>
              <div class="logo-hints">
                <p class="logo-hint-title">支持 JPG, PNG 格式</p>
                <p class="logo-hint-sub">建议尺寸 512x512px，文件大小不超过 2MB</p>
              </div>
            </div>
          </a-form-item>

          <a-row :gutter="24">
            <a-col :xs="24" :sm="12">
              <a-form-item label="企业名称">
                <a-input v-model:value="formState.name" disabled />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="公司规模">
                <a-select v-model:value="formState.scale" :options="scaleOptions" placeholder="请选择公司规模" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :xs="24" :sm="12">
              <a-form-item label="一级行业">
                <a-select
                  v-model:value="formState.industryL1"
                  :options="industryL1Options"
                  placeholder="请选择一级行业"
                  :filter-option="industryFilter"
                  show-search
                  @change="onIndustryL1Change"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="二级行业">
                <a-select
                  v-model:value="formState.industryL2"
                  :options="industryL2Options"
                  placeholder="请选择二级行业"
                  :filter-option="industryFilter"
                  show-search
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="公司简介">
                <a-textarea
                  v-model:value="formState.description"
                  placeholder="请输入公司简介"
                  :rows="3"
                  :maxlength="500"
                  show-count
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </section>

      <!-- ========== 工商信息 ========== -->
      <section class="ec-card ec-section">
        <div class="section-head">
          <span class="section-icon"><BankOutlined /></span>
          <div class="section-head-text">
            <h3 class="section-title">工商信息</h3>
            <p class="section-subtitle">证照与工商注册信息</p>
          </div>
        </div>

        <a-form :model="formState" layout="vertical" class="ec-form">
          <a-row :gutter="24">
            <a-col :xs="24" :sm="12">
              <a-form-item label="统一社会信用代码">
                <a-input v-model:value="formState.creditCode" disabled placeholder="—" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="法定代表人">
                <a-input v-model:value="formState.legalPerson" disabled placeholder="—" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="注册地址">
                <a-input v-model:value="formState.registeredAddress" disabled placeholder="—">
                  <template #prefix>
                    <EnvironmentOutlined style="color:#bfbfbf" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="企业营业执照">
                <a-upload v-model:file-list="licenseFileList" v-bind="licenseUploadProps">
                  <div v-if="licenseFileList.length < 1" class="license-upload-btn">
                    <PlusOutlined />
                    <div class="license-upload-text">上传营业执照</div>
                  </div>
                </a-upload>
                <div class="field-hint">支持 JPG、PNG 格式，仅限上传一张</div>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </section>

      <!-- ========== 联系人信息 ========== -->
      <section class="ec-card ec-section">
        <div class="section-head">
          <span class="section-icon"><ContactsOutlined /></span>
          <div class="section-head-text">
            <h3 class="section-title">联系人信息</h3>
            <p class="section-subtitle">企业主要对接人</p>
          </div>
        </div>

        <a-form :model="formState" layout="vertical" class="ec-form">
          <a-row :gutter="24">
            <a-col :xs="24" :sm="12">
              <a-form-item label="联系人">
                <a-input v-model:value="formState.contactPerson" placeholder="请输入姓名" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="联系人职务">
                <a-input v-model:value="formState.contactTitle" placeholder="如：行政总监" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="联系人电话">
                <a-input v-model:value="formState.contactPhone" placeholder="11位手机号码" :maxlength="11" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </section>

      <!-- ========== 应用场景 ========== -->
      <section class="ec-card ec-section">
        <div class="section-head">
          <span class="section-icon"><AppstoreOutlined /></span>
          <div class="section-head-text">
            <h3 class="section-title">应用场景</h3>
            <p class="section-subtitle">请选择贵公司主要部署或涉及的场景类型</p>
          </div>
        </div>

        <div class="scenario-grid">
          <div
            v-for="item in scenarios"
            :key="item.key"
            class="scenario-card"
            :class="{ selected: selectedScenario === item.key }"
            @click="selectScenario(item.key)"
          >
            <span v-if="selectedScenario === item.key" class="scenario-check">
              <CheckCircleFilled />
            </span>
            <component :is="item.icon" class="scenario-icon" />
            <span class="scenario-label">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <!-- ========== 底部操作栏 ========== -->
      <div class="ec-footer">
        <a-button size="large" @click="handleReset">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
        <a-button type="primary" size="large" :loading="saving" @click="handleSave">
          <template #icon><SaveOutlined /></template>
          保存
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 主题变量 ========== */
.ec-page {
  --ec-primary: #1677ff;
  --ec-primary-hover: #4096ff;
  --ec-primary-soft: #e6f4ff;
  --ec-primary-softer: #f0f5ff;
  --ec-border: #e8e8e8;
  --ec-border-hover: #91caff;
  --ec-text: #1a1a1a;
  --ec-text-2: #555;
  --ec-text-3: #999;
  --ec-text-4: #bbb;
  --ec-radius: 10px;
  --ec-radius-sm: 8px;
  --ec-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.ec-page {
  min-height: 100%;
  padding: 12px 20px 24px;
}

.ec-container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ========== 通用卡片 ========== */
.ec-card {
  background: #fff;
  border-radius: var(--ec-radius);
  box-shadow: var(--ec-shadow);
}

/* ========== 企业名片横幅 ========== */
.ec-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 20px;
}

.ec-banner-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.ec-banner-logo {
  width: 48px;
  height: 48px;
  border-radius: var(--ec-radius-sm);
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--ec-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ec-banner-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ec-banner-logo-fallback {
  font-size: 22px;
  color: var(--ec-primary);
}

.ec-banner-info {
  min-width: 0;
}

.ec-banner-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ec-text);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ec-banner-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ec-text-3);
}

.ec-banner-code {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fafafa;
  border: 1px solid var(--ec-border);
  border-radius: 999px;
  flex-shrink: 0;
}

.ec-code-key {
  font-size: 12px;
  color: var(--ec-text-3);
}

.ec-code-val {
  font-size: 13px;
  color: var(--ec-text-2);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}

.ec-copy-btn {
  padding: 0 2px;
  color: var(--ec-primary);
}

/* ========== 分区标题 ========== */
.section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--ec-radius-sm);
  background: var(--ec-primary-soft);
  color: var(--ec-primary);
  font-size: 16px;
  flex-shrink: 0;
}

.section-head-text {
  min-width: 0;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ec-text);
  line-height: 1.4;
}

.section-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--ec-text-3);
}

/* ========== 表单 ========== */
.ec-form {
  padding: 14px 20px 16px;
}

.ec-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.ec-form :deep(.ant-form-item-label > label) {
  font-size: 13px;
  color: var(--ec-text-2);
  font-weight: 500;
}

.ec-form :deep(.ant-input),
.ec-form :deep(.ant-input-affix-wrapper),
.ec-form :deep(.ant-select .ant-select-selector) {
  border-color: var(--ec-border);
  border-radius: var(--ec-radius-sm);
}

.ec-form :deep(.ant-input:hover),
.ec-form :deep(.ant-input-affix-wrapper:hover),
.ec-form :deep(.ant-select:hover .ant-select-selector) {
  border-color: var(--ec-border-hover);
}

.ec-form :deep(.ant-input:focus),
.ec-form :deep(.ant-input-affix-wrapper-focused),
.ec-form :deep(.ant-select-focused .ant-select-selector) {
  border-color: var(--ec-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.ec-form :deep(.ant-input-disabled),
.ec-form :deep(.ant-select-disabled .ant-select-selector) {
  color: var(--ec-text-3);
  background: #fafafa;
  cursor: not-allowed;
}

/* ========== Logo区域 ========== */
.logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-upload-dashed {
  width: 88px;
  height: 88px;
  border: 1px dashed #d9d9d9;
  border-radius: var(--ec-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.logo-upload-dashed:hover {
  border-color: var(--ec-primary);
}

.logo-camera-icon {
  font-size: 24px;
  color: var(--ec-text-4);
}

.logo-hints {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo-hint-title {
  margin: 0;
  font-size: 13px;
  color: var(--ec-text-2);
}

.logo-hint-sub {
  margin: 0;
  font-size: 12px;
  color: var(--ec-text-4);
}

/* ========== 营业执照上传区域 ========== */
.license-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
}

.license-upload-text {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ec-text-3);
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ec-text-4);
}

/* ========== 应用场景 ========== */
.scenario-grid {
  padding: 14px 20px 18px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.scenario-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 88px;
  border: 1px solid var(--ec-border);
  border-radius: var(--ec-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  user-select: none;
  overflow: hidden;
}

.scenario-card:hover {
  border-color: var(--ec-border-hover);
  background: var(--ec-primary-softer);
}

.scenario-card.selected {
  border-color: var(--ec-primary);
  background: var(--ec-primary-soft);
}

.scenario-check {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 18px;
  line-height: 1;
  color: var(--ec-primary);
  background: #fff;
  border-radius: 50%;
}

.scenario-icon {
  font-size: 24px;
  color: var(--ec-text-3);
  transition: color 0.2s;
}

.scenario-card:hover .scenario-icon {
  color: var(--ec-primary);
}

.scenario-card.selected .scenario-icon {
  color: var(--ec-primary);
}

.scenario-label {
  font-size: 13px;
  color: var(--ec-text-2);
  font-weight: 500;
}

.scenario-card.selected .scenario-label {
  color: var(--ec-primary);
}

/* ========== 底部操作栏 ========== */
.ec-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid var(--ec-border);
  border-radius: var(--ec-radius);
  box-shadow: 0 -4px 16px rgba(16, 24, 40, 0.06);
}

.ec-footer .ant-btn {
  min-width: 112px;
  border-radius: var(--ec-radius-sm);
}

.ec-footer :deep(.ant-btn-primary) {
  background: var(--ec-primary);
  border: none;
}

.ec-footer :deep(.ant-btn-primary:hover) {
  background: var(--ec-primary-hover);
}

/* ========== 响应式 ========== */
@media (max-width: 576px) {
  .ec-page {
    padding: 8px 8px 16px;
  }

  .ec-banner {
    padding: 12px 16px;
  }

  .section-head {
    padding: 12px 16px 10px;
  }

  .ec-form {
    padding: 12px 16px 14px;
  }

  .scenario-grid {
    padding: 12px 16px 14px;
  }
}
</style>
