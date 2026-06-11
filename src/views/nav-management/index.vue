<script setup lang="ts">
import { ref, computed } from 'vue'
import { message, Modal } from 'antdv-next'
import * as Icons from '@antdv-next/icons'
import { PlusOutlined } from '@antdv-next/icons'
import type { NavItem } from '@/types'

// ========== 全量图标库（从 @antdv-next/icons 自动提取） ==========
const iconOptions = computed(() => {
  const exclude = ['default', 'createFromIconfontCN', 'IconProvider', 'getTwoToneColor', 'setTwoToneColor']
  return Object.entries(Icons)
    .filter(([name]) => !exclude.includes(name) && (typeof Icons[name as keyof typeof Icons] === 'object' || typeof Icons[name as keyof typeof Icons] === 'function'))
    .map(([name, comp]) => ({
      value: name,
      label: name.replace(/(Outlined|Filled|TwoTone)$/, ''),
      icon: comp,
    }))
})

const iconMap = computed(() => {
  const m: Record<string, any> = {}
  iconOptions.value.forEach(o => { m[o.value] = o.icon })
  return m
})
const getIcon = (name: string) => iconMap.value[name]
const getIconLabel = (name: string) => iconOptions.value.find(o => o.value === name)?.label || name

// ========== 模拟导航数据 ==========
const mockNavData: NavItem[] = [
  { id:'n1', parentId:null, label:'工作台', icon:'FundFilled', routePath:'/workbench', sortOrder:1, visible:true, description:'系统首页工作台', openMode:'inner', permission:'workbench:view', navType:'dir' },
  { id:'n2', parentId:null, label:'视频广场', icon:'VideoCameraFilled', routePath:'/video-square', sortOrder:2, visible:true, description:'实时视频监控广场', openMode:'inner', permission:'video:view', navType:'dir' },
  { id:'n21', parentId:'n2', label:'实时视频', icon:'', routePath:'/video-square?tab=live', sortOrder:1, visible:true, description:'实时视频监控画面', openMode:'inner', permission:'video:live', navType:'action' },
  { id:'n22', parentId:'n2', label:'视频回放', icon:'', routePath:'/video-square?tab=playback', sortOrder:2, visible:true, description:'历史视频回放查看', openMode:'inner', permission:'video:playback', navType:'action' },
  { id:'n23', parentId:'n2', label:'点位地图', icon:'', routePath:'/video-square?tab=map', sortOrder:3, visible:true, description:'设备点位地图展示', openMode:'inner', permission:'video:map', navType:'action' },
  { id:'n3', parentId:null, label:'告警中心', icon:'AlertFilled', routePath:'/alert-center', sortOrder:3, visible:true, description:'告警事件集中处理', openMode:'inner', permission:'alert:view', navType:'dir' },
  { id:'n4', parentId:null, label:'设备管理', icon:'CloudServerOutlined', routePath:'/device/management', sortOrder:4, visible:true, description:'设备信息管理与配置', openMode:'inner', permission:'device:view', navType:'dir' },
  { id:'n5', parentId:null, label:'智慧巡检', icon:'SlackOutlined', routePath:'', sortOrder:5, visible:true, description:'巡检业务核心模块', openMode:'inner', permission:'inspection:view', navType:'dir' },
  { id:'n51', parentId:'n5', label:'巡检模板', icon:'', routePath:'/inspection/templates', sortOrder:1, visible:true, description:'管理巡检模板与基础问题库', openMode:'inner', permission:'inspection:template', navType:'menu' },
  { id:'n52', parentId:'n5', label:'巡检计划', icon:'', routePath:'/inspection/plan-config', sortOrder:2, visible:true, description:'配置巡检计划与任务清单', openMode:'inner', permission:'inspection:plan', navType:'menu' },
  { id:'n53', parentId:'n5', label:'日常巡检', icon:'', routePath:'', sortOrder:3, visible:true, description:'日常巡检执行入口', openMode:'inner', permission:'inspection:daily', navType:'dir' },
  { id:'n531', parentId:'n53', label:'在线巡检', icon:'', routePath:'/inspection/online', sortOrder:1, visible:true, description:'基于任务的在线巡检执行', openMode:'inner', permission:'inspection:online', navType:'menu' },
  { id:'n532', parentId:'n53', label:'视频点检', icon:'', routePath:'/inspection/spot-check', sortOrder:2, visible:true, description:'自由发起视频点检', openMode:'inner', permission:'inspection:spot', navType:'menu' },
  { id:'n533', parentId:'n53', label:'视频点检记录', icon:'', routePath:'/inspection/spot-check-records', sortOrder:3, visible:true, description:'查看历史视频点检记录', openMode:'inner', permission:'inspection:records', navType:'menu' },
  { id:'n54', parentId:'n5', label:'AI巡检', icon:'', routePath:'', sortOrder:4, visible:true, description:'AI智能巡检分析', openMode:'inner', permission:'inspection:ai', navType:'dir' },
  { id:'n541', parentId:'n54', label:'AI巡检任务', icon:'', routePath:'/inspection/ai/tasks', sortOrder:1, visible:true, description:'配置并执行AI巡检任务', openMode:'inner', permission:'inspection:ai:task', navType:'menu' },
  { id:'n542', parentId:'n54', label:'AI分析结果', icon:'', routePath:'/inspection/ai/results', sortOrder:2, visible:true, description:'查看AI巡检分析结果', openMode:'inner', permission:'inspection:ai:result', navType:'menu' },
  { id:'n6', parentId:'n5', label:'待办事项', icon:'', routePath:'/inspection/todos', sortOrder:5, visible:true, description:'待执行/整改/审核事项', openMode:'inner', permission:'todo:view', navType:'menu' },
  { id:'n7', parentId:null, label:'系统管理', icon:'DeploymentUnitOutlined', routePath:'', sortOrder:6, visible:true, description:'系统配置与管理', openMode:'inner', permission:'system:view', navType:'dir' },
  { id:'n71', parentId:null, label:'导航管理', icon:'UnorderedListOutlined', routePath:'/system/nav-management', sortOrder:7, visible:true, description:'配置平台导航菜单结构', openMode:'inner', permission:'system:nav', navType:'dir' },
]

// ========== 构建树（用于 a-table 的 children 展开） ==========
const buildTree = (items: NavItem[], parentId: string | null = null): any[] => {
  return items
    .filter(i => i.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(i => {
      const children = buildTree(items, i.id)
      return children.length > 0 ? { ...i, children } : { ...i }
    })
}

const tableData = computed(() => buildTree(mockNavData))

// ========== 表格列 ==========
const columns = [
  { title: '导航名称', key: 'label', width: 180, align: 'left' as const },
  { title: '类型', key: 'navType', width: 80, align: 'center' as const },
  { title: '图标', key: 'icon', width: 60, align: 'center' as const },
  { title: '路由路径', key: 'routePath', width: 170, align: 'left' as const, ellipsis: true },
  { title: '打开方式', key: 'openMode', width: 75, align: 'center' as const },
  { title: '权限标识', key: 'permission', width: 145, align: 'left' as const, ellipsis: true },
  { title: '描述', key: 'description', width: 160, align: 'left' as const, ellipsis: true },
  { title: '排序', key: 'sortOrder', width: 55, align: 'center' as const },
  { title: '可见', key: 'visible', width: 55, align: 'center' as const },
  { title: '操作', key: 'actions', width: 190, align: 'center' as const, fixed: 'right' as const },
]

// ========== 弹窗 ==========
const modalVisible = ref(false)
const modalTitle = ref('新增导航')
const editingItem = ref<NavItem | null>(null)
const iconSearch = ref('')
const filteredIcons = computed(() => {
  if (!iconSearch.value.trim()) return iconOptions.value
  const kw = iconSearch.value.trim().toLowerCase()
  return iconOptions.value.filter(o => o.label.toLowerCase().includes(kw) || o.value.toLowerCase().includes(kw))
})
const formData = ref({
  id: '',
  parentId: null as string | null,
  label: '',
  icon: '',
  routePath: '',
  sortOrder: 1,
  visible: true,
  description: '',
  openMode: 'inner' as 'inner' | 'blank',
  permission: '',
  navType: 'menu' as 'dir' | 'menu' | 'action' | 'url',
})

const parentOptions = computed(() => [
  { label: '顶级导航（一级菜单）', value: null },
  ...mockNavData.filter(i => !i.routePath || i.routePath === '').map(i => ({
    label: i.label, value: i.id,
  })),
])

const openAdd = (parentId: string | null = null) => {
  modalTitle.value = '新增导航'
  editingItem.value = null
  formData.value = {
    id: `n${Date.now()}`, parentId, label: '', icon: '', routePath: '',
    sortOrder: 1, visible: true, description: '', openMode: 'inner', permission: '', navType: 'menu',
  }
  modalVisible.value = true
}

const openEdit = (item: NavItem) => {
  modalTitle.value = '编辑导航'
  editingItem.value = item
  formData.value = { ...item }
  modalVisible.value = true
}

const handleDelete = (item: NavItem) => {
  const hasChildren = mockNavData.some(i => i.parentId === item.id)
  Modal.confirm({
    title: '删除确认',
    content: hasChildren ? `"${item.label}" 及其所有子导航将被级联删除，确定继续？` : `确定删除 "${item.label}"？`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => message.success(`已删除 "${item.label}"`),
  })
}

const handleSubmit = () => {
  if (!formData.value.label.trim()) { message.warning('请输入导航名称'); return }
  message.success(editingItem.value ? `已更新 "${formData.value.label}"` : `已新增 "${formData.value.label}"`)
  modalVisible.value = false
}

const toggleVisible = (item: NavItem) => {
  item.visible = !item.visible
}

const navTypeMap: Record<string, { label: string; color: string }> = {
  dir: { label: '目录', color: 'blue' },
  menu: { label: '菜单', color: 'green' },
  action: { label: '按钮', color: 'orange' },
  url: { label: 'URL', color: 'purple' },
}
const navTypeLabel = (t: string) => navTypeMap[t]?.label || t
const navTypeColor = (t: string) => navTypeMap[t]?.color || 'default'

const onNavTypeChange = () => {
  if (formData.value.navType === 'url') formData.value.openMode = 'blank'
}
</script>

<template>
  <div class="nm-page">
    <div class="nm-card">
      <div class="nm-toolbar">
        <a-button type="primary" @click="openAdd(null)">
          <template #icon><PlusOutlined /></template>
          新增主导航
        </a-button>
        <span class="nm-tip">配置平台左侧导航菜单结构，仅超级管理员可操作，请谨慎修改</span>
      </div>
      <a-table
        :columns="columns"
        :data-source="tableData"
        row-key="id"
        :pagination="false"
        :default-expand-all-rows="true"
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'label'">
            {{ record.label }}
          </template>
          <template v-else-if="column.key === 'icon'">
            <span v-if="getIcon(record.icon)" class="nm-icon-cell">
              <component :is="getIcon(record.icon)" />
            </span>
            <span v-else class="nm-no-icon">—</span>
          </template>
          <template v-else-if="column.key === 'navType'">
            <a-tag :color="navTypeColor(record.navType)">{{ navTypeLabel(record.navType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'routePath'">
            <code v-if="record.routePath" class="nm-route">{{ record.routePath }}</code>
            <span v-else class="nm-text-muted">—</span>
          </template>
          <template v-else-if="column.key === 'openMode'">
            <a-tag :color="record.openMode === 'blank' ? 'blue' : 'default'">
              {{ record.openMode === 'blank' ? '新窗口' : '内嵌' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'permission'">
            <code v-if="record.permission" class="nm-perm">{{ record.permission }}</code>
            <span v-else class="nm-text-muted">公开</span>
          </template>
          <template v-else-if="column.key === 'description'">
            <span class="nm-desc-text" :title="record.description">{{ record.description || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'sortOrder'">
            {{ record.sortOrder }}
          </template>
          <template v-else-if="column.key === 'visible'">
            <a-switch :checked="record.visible" size="small" @change="toggleVisible(record)" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a @click="openAdd(record.id)">添加子级</a>
            <a-divider type="vertical" />
            <a @click="openEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a class="nm-action-del" @click="handleDelete(record)">删除</a>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" @cancel="iconSearch = ''" width="480px" cancel-text="取消" ok-text="确定">
      <a-form layout="vertical" class="nm-form">
        <a-form-item label="父导航">
          <a-select v-model:value="formData.parentId" :options="parentOptions" placeholder="顶级导航" />
        </a-form-item>
        <a-form-item label="导航类型" required>
          <a-select v-model:value="formData.navType" :options="[{label:'目录',value:'dir'},{label:'菜单',value:'menu'},{label:'按钮/操作',value:'action'},{label:'URL',value:'url'}]" @change="onNavTypeChange" />
        </a-form-item>
        <a-form-item label="导航名称" required>
          <a-input v-model:value="formData.label" placeholder="如：工作台" />
        </a-form-item>
        <a-form-item label="排序号">
          <a-input-number v-model:value="formData.sortOrder" :min="1" placeholder="越小越靠前" />
        </a-form-item>
        <a-form-item v-if="formData.navType === 'url'" label="链接地址" required>
          <a-input v-model:value="formData.routePath" placeholder="https://..." />
        </a-form-item>
        <a-form-item v-else label="路由路径">
          <a-input v-model:value="formData.routePath" :placeholder="formData.navType === 'dir' ? '可选，如 /workbench' : '/xxx'" />
        </a-form-item>
        <a-form-item label="导航图标">
          <div class="nm-icon-pick-row">
            <a-popover trigger="click" placement="bottomLeft" overlay-class-name="nm-icon-popover" @open-change="(open:boolean) => { if(!open) iconSearch = '' }">
              <template #content>
                <div class="nm-icon-search">
                  <a-input v-model:value="iconSearch" placeholder="搜索图标..." size="small" allow-clear />
                </div>
                <div class="nm-icon-grid">
                  <div v-for="opt in filteredIcons" :key="opt.value" class="nm-icon-item" :class="{ selected: formData.icon === opt.value }" @click="formData.icon = opt.value" :title="opt.value">
                    <component :is="opt.icon" class="nm-icon-preview" />
                  </div>
                  <div v-if="filteredIcons.length === 0" class="nm-icon-empty">无匹配图标</div>
                </div>
              </template>
              <div class="nm-icon-box">
                <component v-if="formData.icon && iconMap[formData.icon]" :is="iconMap[formData.icon]" class="nm-icon-box-icon" />
                <PlusOutlined v-else class="nm-icon-box-plus" />
              </div>
            </a-popover>
            <span v-if="formData.icon" class="nm-icon-name-text">{{ formData.icon }}</span>
            <a-button v-if="formData.icon" size="small" type="link" danger @click="formData.icon = ''">清除</a-button>
          </div>
        </a-form-item>
        <a-form-item v-if="formData.navType !== 'dir' || formData.routePath" label="打开方式">
          <a-select v-model:value="formData.openMode" :options="[{label:'内嵌',value:'inner'},{label:'新窗口',value:'blank'}]" :disabled="formData.navType === 'url'" />
        </a-form-item>
        <a-form-item label="权限标识">
          <a-input v-model:value="formData.permission" placeholder="workbench:view（留空公开）" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="简要描述导航用途" :rows="2" />
        </a-form-item>
        <a-form-item label="可见性">
          <a-switch v-model:checked="formData.visible" checked-children="显示" un-checked-children="隐藏" />
          <span class="nm-form-hint">关闭后所有用户不可见此菜单</span>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.nm-page { height: 100%; background: #fff; padding: 24px; overflow: hidden; display: flex; flex-direction: column; }
.nm-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.nm-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-shrink: 0; }
.nm-tip { font-size: 13px; color: #fa8c16; }
.nm-icon-cell { font-size: 16px; color: #1677ff; }
.nm-no-icon { color: #ccc; }
.nm-route { padding: 1px 6px; background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 3px; font-size: 12px; color: #666; }
.nm-perm { padding: 1px 6px; background: #fff7e6; border: 1px solid #ffd591; border-radius: 3px; font-size: 11px; color: #d46b08; }
.nm-text-muted { color: #ccc; font-size: 12px; }
.nm-desc-text { display: inline-block; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #888; font-size: 12px; }
.nm-action-del { color: #ff4d4f; }
.nm-form-hint { color: #999; font-size: 12px; margin-left: 10px; }

.nm-icon-box { width: 42px; height: 42px; border: 1px dashed #d9d9d9; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; background: #fafafa; }
.nm-icon-box:hover { border-color: #1890ff; border-style: solid; background: #f0f5ff; }
.nm-icon-box-icon { font-size: 22px; color: #1677ff; }
.nm-icon-box-plus { font-size: 18px; color: #bbb; }
.nm-icon-pick-row { display: flex; align-items: center; gap: 8px; }
.nm-icon-name-text { font-size: 12px; color: #888; font-family: monospace; }
.nm-icon-search { padding: 4px 8px 6px; border-bottom: 1px solid #f0f0f0; }
.nm-icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-height: 240px; overflow-y: auto; padding: 4px; }
.nm-icon-item { display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; aspect-ratio: 1; }
.nm-icon-item:hover { background: #f0f5ff; border-color: #bae7ff; }
.nm-icon-item.selected { background: #e6f7ff; border-color: #1890ff; }
.nm-icon-preview { font-size: 18px; color: #1677ff; }
.nm-icon-item.selected .nm-icon-preview { color: #096dd9; }
.nm-icon-empty { grid-column: 1 / -1; text-align: center; padding: 24px; color: #bbb; font-size: 13px; }

.nm-form :deep(.ant-form-item) { margin-bottom: 20px; }
.nm-form :deep(.ant-form-item-label) { padding-bottom: 2px; }
.nm-form :deep(.ant-form-item-label > label) { font-size: 13px; color: #555; }
</style>

<style>
.nm-form .ant-select,
.nm-form .ant-input-number,
.nm-form .ant-input,
.nm-form .ant-input-affix-wrapper,
.nm-form textarea.ant-input { width: 100% !important; }
.nm-icon-popover .ant-popover-inner-content { padding: 4px; }
.nm-icon-popover { max-width: 340px; }
</style>
