<script setup lang="ts">
import { ref, reactive, shallowRef, markRaw, computed } from 'vue'
import { message } from 'antdv-next'
import {
  CameraOutlined, EnvironmentOutlined, InboxOutlined, CopyOutlined,
  ShopOutlined, BuildOutlined, ApartmentOutlined,
  ToolOutlined, BookOutlined, ProjectOutlined, PlusOutlined,
} from '@antdv-next/icons'
import type { UploadProps } from 'antdv-next'

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

// ========== 保存 ==========
const saving = ref(false)
const handleSave = () => {
  saving.value = true
  setTimeout(() => {
    saving.value = false
    message.success('企业信息保存成功')
  }, 800)
}
</script>
<template>
  <div class="enterprise-center">
    <div class="ec-container">
    <!-- ========== Header ========== -->
    <div class="ec-header">
      <h2 class="ec-title">基础信息</h2>
      <div class="ec-code-area">
        <span class="ec-code-bar"></span>
        <span class="ec-code-label">企业码：</span>
        <span class="ec-code-value">{{ enterpriseCode }}</span>
        <a-button type="link" size="small" class="ec-copy-btn" @click="copyCode">
          <template #icon><CopyOutlined /></template>
        </a-button>
      </div>
    </div>

    <!-- ========== Card 1: 基础信息 ========== -->
    <div class="ec-card">
      <a-form :model="formState" layout="vertical" class="ec-form">

        <!-- Logo区域 -->
        <a-form-item label="企业Logo">
          <div class="logo-area">
            <a-upload
              v-model:file-list="logoFileList"
              v-bind="logoUploadProps"
            >
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

        <!-- Row 1: 企业名称 + 公司规模 -->
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="企业名称">
              <a-input v-model:value="formState.name" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="公司规模">
              <a-select
                v-model:value="formState.scale"
                :options="scaleOptions"
                placeholder="请选择公司规模"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 2: 所属行业（一级/二级联动） -->
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="所属行业">
              <a-space style="width:100%">
                <a-select
                  v-model:value="formState.industryL1"
                  :options="industryL1Options"
                  placeholder="请选择一级行业"
                  :filter-option="industryFilter"
                  show-search
                  style="flex:1"
                  @change="onIndustryL1Change"
                />
                <a-select
                  v-model:value="formState.industryL2"
                  :options="industryL2Options"
                  placeholder="请选择二级行业"
                  :filter-option="industryFilter"
                  show-search
                  style="flex:1"
                />
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 3: 公司简介 -->
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

        <!-- Row 4: 统一社会信用代码 + 法定代表人 -->
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="统一社会信用代码">
              <a-input v-model:value="formState.creditCode" disabled placeholder="—" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="法定代表人">
              <a-input v-model:value="formState.legalPerson" disabled placeholder="—" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 5: 注册地址 -->
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

        <!-- Row 6: 企业营业执照 -->
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="企业营业执照">
              <a-upload
                v-model:file-list="licenseFileList"
                v-bind="licenseUploadProps"
              >
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
    </div>

    <!-- ========== Card 2: 联系人信息 ========== -->
    <div class="ec-card">
      <div class="card-title">联系人信息</div>
      <a-form :model="formState" layout="vertical" class="ec-form">

        <!-- Row 1: 联系人 + 联系人职务 -->
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="联系人">
              <a-input v-model:value="formState.contactPerson" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系人职务">
              <a-input v-model:value="formState.contactTitle" placeholder="如：行政总监" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 2: 联系人电话 -->
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="联系人电话">
              <a-input v-model:value="formState.contactPhone" placeholder="11位手机号码" :maxlength="11" />
            </a-form-item>
          </a-col>
        </a-row>

      </a-form>
    </div>

    <!-- ========== Card 3: 应用场景 ========== -->
    <div class="ec-card">
      <div class="card-title">应用场景</div>
      <p class="card-subtitle">请选择贵公司主要部署或涉及的场景类型</p>
      <div class="scenario-grid">
        <div
          v-for="item in scenarios"
          :key="item.key"
          class="scenario-card"
          :class="{ selected: selectedScenario === item.key }"
          @click="selectScenario(item.key)"
        >
          <component :is="item.icon" class="scenario-icon" />
          <span class="scenario-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- ========== Footer ========== -->
    <div class="ec-footer">
      <a-button type="primary" size="large" :loading="saving" @click="handleSave">
        保存
      </a-button>
    </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 全局背景 ========== */
.enterprise-center {
  min-height: 100%;
  background: #f5f7fa;
  padding: 20px 24px 32px;
}

.ec-container {
  max-width: 800px;
  margin: 0 auto;
}

/* ========== Header ========== */
.ec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ec-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.ec-code-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ec-code-bar {
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  margin-right: 4px;
}

.ec-code-label {
  font-size: 13px;
  color: #888;
}

.ec-code-value {
  font-size: 14px;
  color: #555;
  font-family: 'SF Mono', 'Menlo', monospace;
}

.ec-copy-btn {
  padding: 0 4px;
}

/* ========== 卡片 ========== */
.ec-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0 0 20px 0;
}

/* ========== 表单 ========== */
.ec-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.ec-form :deep(.ant-form-item-label > label) {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.ec-form :deep(.ant-input),
.ec-form :deep(.ant-input-affix-wrapper) {
  border-color: #e8e8e8;
}

.ec-form :deep(.ant-input:hover),
.ec-form :deep(.ant-input-affix-wrapper:hover) {
  border-color: #91caff;
}

.ec-form :deep(.ant-input-disabled),
.ec-form :deep(.ant-select-disabled .ant-select-selector) {
  color: #999;
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
  width: 96px;
  height: 96px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.logo-upload-dashed:hover {
  border-color: #1677ff;
}

.logo-camera-icon {
  font-size: 24px;
  color: #bbb;
}

.logo-hints {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo-hint-title {
  margin: 0;
  font-size: 13px;
  color: #555;
}

.logo-hint-sub {
  margin: 0;
  font-size: 12px;
  color: #bbb;
}

/* ========== 营业执照上传区域 ========== */
.license-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
}

.license-upload-text {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #bbb;
}

/* ========== 应用场景 ========== */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.scenario-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 96px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  user-select: none;
}

.scenario-card:hover {
  border-color: #91caff;
  background: #f0f5ff;
}

.scenario-card.selected {
  border-color: #1677ff;
  background: #e6f4ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.scenario-icon {
  font-size: 26px;
  color: #999;
  transition: color 0.2s;
}

.scenario-card:hover .scenario-icon {
  color: #1677ff;
}

.scenario-card.selected .scenario-icon {
  color: #1677ff;
}

.scenario-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.scenario-card.selected .scenario-label {
  color: #1677ff;
}

/* ========== Footer ========== */
.ec-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.ec-footer .ant-btn {
  min-width: 120px;
  border-radius: 6px;
}
</style>
