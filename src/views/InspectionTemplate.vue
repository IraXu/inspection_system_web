<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@antdv-next/icons'
import type { InspectionCategory, InspectionItem, InspectionTemplate } from '@/types'

// ========== Mock 数据 ==========
const mockCategories: InspectionCategory[] = [
  { id: '1', name: '安全管理' },
  { id: '2', name: '环境卫生' },
  { id: '3', name: '行为规范' },
]

const mockAllItems: InspectionItem[] = [
  { id: '1', name: '地面整洁', categoryId: '2', categoryName: '环境卫生', enabled: true, linkedTemplate: true, description: '检查地面是否干净整洁，无杂物堆放', images: ['https://picsum.photos/100/75?1'] },
  { id: '2', name: '设备整洁', categoryId: '2', categoryName: '环境卫生', enabled: true, linkedTemplate: false, description: '检查设备表面是否清洁，无明显灰尘', images: [] },
  { id: '3', name: '灭火器是否过期', categoryId: '1', categoryName: '安全管理', enabled: true, linkedTemplate: true, description: '检查灭火器压力表是否在绿区', images: ['https://picsum.photos/100/75?2'] },
  { id: '4', name: '安全出口畅通', categoryId: '1', categoryName: '安全管理', enabled: false, linkedTemplate: false, description: '安全出口无堵塞，指示灯正常', images: [] },
  { id: '5', name: '消防栓可用', categoryId: '1', categoryName: '安全管理', enabled: true, linkedTemplate: true, description: '消防栓设备齐全，水带无破损', images: ['https://picsum.photos/100/75?3'] },
  { id: '6', name: '员工着装规范', categoryId: '3', categoryName: '行为规范', enabled: true, linkedTemplate: false, description: '员工是否穿戴工服工牌', images: [] },
]

const mockTemplates: InspectionTemplate[] = [
  { id: '1', name: '门店基础巡检', enabled: true, description: '适用于门店日常基础巡检场景', creator: '张三', createdAt: '2024-01-15 09:30:00', selectedCategoryIds: ['1', '2'], selectedItemIds: ['1', '3', '5'] },
  { id: '2', name: '明星店铺综合巡检', enabled: true, description: '高标准综合巡检，包含全部检查项', creator: '李四', createdAt: '2024-02-20 14:20:00', selectedCategoryIds: ['1', '2', '3'], selectedItemIds: ['1', '2', '3', '4', '5', '6'] },
  { id: '3', name: '陈列展示巡检', enabled: false, description: '针对商品陈列展示的专项巡检', creator: '王五', createdAt: '2024-03-10 10:00:00', selectedCategoryIds: ['3'], selectedItemIds: ['6'] },
]

// ========== 列表筛选 ==========
const templates = ref([...mockTemplates])
const searchName = ref('')
const activeSearchName = ref('')

const handleSearch = () => { activeSearchName.value = searchName.value }
const handleReset = () => { searchName.value = ''; activeSearchName.value = '' }

const filteredTemplates = computed(() => {
  if (!activeSearchName.value) return templates.value
  return templates.value.filter(t => t.name.includes(activeSearchName.value))
})

// ========== 启用状态切换 ==========
const toggleEnabled = (tmpl: InspectionTemplate) => {
  const newStatus = !tmpl.enabled
  const action = newStatus ? '启用' : '禁用'
  // 二次确认
  const modal = { confirm: () => {} }
  // 使用简单方式：直接切换
  tmpl.enabled = newStatus
  message.success(`模板已${action}`)
}

// ========== 删除 ==========
const handleDelete = (tmpl: InspectionTemplate) => {
  templates.value = templates.value.filter(t => t.id !== tmpl.id)
  message.success('模板已删除')
}

// ========== 抽屉（添加/编辑） ==========
const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const editingTemplateId = ref<string | null>(null)

const templateForm = reactive({ name: '', description: '' })
const selectedCatId = ref<string>(mockCategories[0]?.id || '')
const checkedItemIds = ref<string[]>([])

// ========== 详情弹窗 ==========
const detailVisible = ref(false)
const detailTemplate = ref<InspectionTemplate | null>(null)

const catSearchText = ref('')
const filteredCats = computed(() => {
  if (!catSearchText.value.trim()) return mockCategories
  return mockCategories.filter(c => c.name.includes(catSearchText.value))
})

// 当前分类下的巡检项（仅启用项，分页）
const currentCatItems = computed(() => {
  return mockAllItems.filter(i => i.categoryId === selectedCatId.value && i.enabled)
})
const itemPage = ref(1)
const itemPageSize = 10
const pagedItems = computed(() => {
  const start = (itemPage.value - 1) * itemPageSize
  return currentCatItems.value.slice(start, start + itemPageSize)
})

// 已选统计（基于所有mockAllItems中被勾选的）
const selectedStats = computed(() => {
  const catIds = new Set<string>()
  mockAllItems.filter(i => checkedItemIds.value.includes(i.id)).forEach(i => catIds.add(i.categoryId))
  return { categories: catIds.size, items: checkedItemIds.value.length }
})

const openAddDrawer = () => {
  drawerMode.value = 'add'
  editingTemplateId.value = null
  templateForm.name = ''; templateForm.description = ''
  selectedCatId.value = mockCategories[0]?.id || ''
  checkedItemIds.value = []; itemPage.value = 1
  drawerVisible.value = true
}

const openEditDrawer = (tmpl: InspectionTemplate) => {
  drawerMode.value = 'edit'
  editingTemplateId.value = tmpl.id
  templateForm.name = tmpl.name; templateForm.description = tmpl.description
  selectedCatId.value = tmpl.selectedCategoryIds[0] || mockCategories[0]?.id || ''
  checkedItemIds.value = [...tmpl.selectedItemIds]; itemPage.value = 1
  drawerVisible.value = true
}

const openDetailModal = (tmpl: InspectionTemplate) => {
  detailTemplate.value = tmpl
  detailVisible.value = true
}

const detailItems = computed(() => {
  if (!detailTemplate.value) return []
  return mockAllItems.filter(i => detailTemplate.value!.selectedItemIds.includes(i.id))
})

const handleDrawerSave = () => {
  if (!templateForm.name.trim()) { message.warning('请输入模板名称'); return }
  if (checkedItemIds.value.length === 0) { message.warning('请至少选择 1 个巡检项'); return }
  // 计算涉及到的巡检类
  const catIds = [...new Set(mockAllItems.filter(i => checkedItemIds.value.includes(i.id)).map(i => i.categoryId))]
  if (drawerMode.value === 'edit' && editingTemplateId.value) {
    const tmpl = templates.value.find(t => t.id === editingTemplateId.value)
    if (tmpl) {
      tmpl.name = templateForm.name; tmpl.description = templateForm.description
      tmpl.selectedCategoryIds = catIds; tmpl.selectedItemIds = [...checkedItemIds.value]
    }
    message.success('模板编辑成功')
  } else {
    templates.value.push({
      id: String(Date.now()), name: templateForm.name, enabled: true,
      description: templateForm.description, creator: '当前用户',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      selectedCategoryIds: catIds, selectedItemIds: [...checkedItemIds.value],
    })
    message.success('模板添加成功')
  }
  drawerVisible.value = false
}

// 选择分类时重置分页
const selectCat = (catId: string) => { selectedCatId.value = catId; itemPage.value = 1 }

// 获取某巡检类下所有启用项的ID
const getCatItemIds = (catId: string) => mockAllItems.filter(i => i.categoryId === catId && i.enabled).map(i => i.id)
const getCatChecked = (catId: string) => {
  const ids = getCatItemIds(catId)
  return ids.length > 0 && ids.every(id => checkedItemIds.value.includes(id))
}
const getCatIndeterminate = (catId: string) => {
  const ids = getCatItemIds(catId)
  const someChecked = ids.some(id => checkedItemIds.value.includes(id))
  return someChecked && !getCatChecked(catId)
}
const toggleCatAll = (catId: string, checked: boolean) => {
  const ids = getCatItemIds(catId)
  if (checked) {
    ids.forEach(id => { if (!checkedItemIds.value.includes(id)) checkedItemIds.value.push(id) })
  } else {
    checkedItemIds.value = checkedItemIds.value.filter(id => !ids.includes(id))
  }
}

const getCreatorName = (tmpl: InspectionTemplate) => tmpl.creator || '—'
const getCreatedAt = (tmpl: InspectionTemplate) => tmpl.createdAt || '—'

// 模板列表表格列
const columns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
  { title: '启用状态', key: 'enabled', width: 110 },
  { title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true },
  { title: '创建人', key: 'creator', width: 90 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 210 },
]
// 表格固定列
const tableScroll = { x: 970 }

// 抽屉右侧巡检项表格列
const drawerColumns = [
  { title: '', key: 'checkbox', width: 40 },
  { title: '巡检项名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '标准图', key: 'images', width: 70 },
  { title: '描述说明', dataIndex: 'description', key: 'description', ellipsis: true },
]

// 详情弹窗巡检项表格列
const detailTableColumns = [
  { title: '巡检项名称', dataIndex: 'name', key: 'name' },
  { title: '标准图', key: 'images', width: 80 },
  { title: '所属巡检类', dataIndex: 'categoryName', key: 'categoryName', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
]
</script>

<template>
  <div class="template-page">
    <!-- 筛选区 -->
    <div class="filter-grid">
      <a-input v-model:value="searchName" placeholder="模板名称" allow-clear @pressEnter="handleSearch" />
      <span class="btn-group"><a-button type="primary" @click="handleSearch"><SearchOutlined /> 查询</a-button><a-button @click="handleReset"><ReloadOutlined /> 重置</a-button></span>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <a-button type="primary" @click="openAddDrawer"><PlusOutlined /> 添加模板</a-button>
    </div>

    <!-- 模板表格 -->
    <a-table :columns="columns" :data-source="filteredTemplates" row-key="id" :scroll="tableScroll" :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: true, pageSizeOptions: ['10','20','50','100'] }" size="middle">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'enabled'">
          <a-switch :checked="record.enabled" size="small" checked-children="开" un-checked-children="关" @click="toggleEnabled(record)" />
        </template>
        <template v-else-if="column.key === 'creator'">{{ getCreatorName(record) }}</template>
        <template v-else-if="column.key === 'createdAt'">{{ getCreatedAt(record) }}</template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEditDrawer(record)"><EditOutlined /> 编辑</a-button>
            <a-button type="link" size="small" @click="openDetailModal(record)"><EyeOutlined /> 详情</a-button>
            <a-popconfirm title="确定删除该模板吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
              <a-button type="link" danger size="small"><DeleteOutlined /> 删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex"><span :style="{color: record[column.dataIndex] ? 'inherit' : '#ccc'}">{{ record[column.dataIndex] || '-' }}</span></template>
      </template>
    </a-table>

    <!-- 添加/编辑 抽屉 -->
    <a-drawer v-model:open="drawerVisible" :title="drawerMode === 'add' ? '添加巡检模板' : '编辑巡检模板'" size="large">
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="模板名称" required>
          <a-input v-model:value="templateForm.name" placeholder="请输入模板名称" />
        </a-form-item>
        <a-form-item label="模板描述">
          <a-textarea v-model:value="templateForm.description" :rows="2" placeholder="请输入模板描述" />
        </a-form-item>
      </a-form>

      <div class="config-area">
        <div class="config-header">
          <span class="config-title">巡检配置</span>
          <a-tag color="blue">已选 {{ selectedStats.categories }} 个巡检类，包含 {{ selectedStats.items }} 个巡检项</a-tag>
        </div>

        <a-row :gutter="16">
          <a-col :span="7">
            <div class="select-panel">
              <a-input v-model:value="catSearchText" placeholder="搜索巡检类" size="small" allow-clear style="margin-bottom: 8px;">
                <template #prefix><SearchOutlined /></template>
              </a-input>
              <div class="cat-list">
                <div
                  v-for="cat in filteredCats" :key="cat.id"
                  class="cat-item" :class="{ active: selectedCatId === cat.id }"
                >
                  <a-checkbox
                    :checked="getCatChecked(cat.id)"
                    :indeterminate="getCatIndeterminate(cat.id)"
                    @change="(e: any) => toggleCatAll(cat.id, e.target.checked)"
                    @click.stop
                  />
                  <span style="flex:1;cursor:pointer" @click="selectCat(cat.id)">{{ cat.name }}</span>
                </div>
              </div>
            </div>
          </a-col>

          <a-col :span="17">
            <div class="select-panel">
              <a-empty v-if="currentCatItems.length === 0" description="暂无巡检项" style="padding: 40px 0;" />
              <a-table
                v-else
                :columns="drawerColumns"
                :data-source="pagedItems"
                :pagination="{ current: itemPage, pageSize: itemPageSize, total: currentCatItems.length, size: 'small', showSizeChanger: true, pageSizeOptions: ['10','20','50'], showTotal: (t: number) => `${t} 项` }"
                row-key="id"
                size="small"
                @change="(pag: any) => itemPage = pag.current"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'checkbox'">
                    <a-checkbox :checked="checkedItemIds.includes(record.id)" @change="(e: any) => { if(e.target.checked) checkedItemIds.push(record.id); else checkedItemIds = checkedItemIds.filter(id => id !== record.id) }" />
                  </template>
                  <template v-if="column.key === 'images'">
                    <img v-if="record.images?.length" :src="record.images[0]" class="drawer-thumb" />
                    <span v-else style="color:#d9d9d9;">—</span>
                  </template>
                </template>
              </a-table>
            </div>
          </a-col>
        </a-row>
      </div>

      <template #footer>
        <a-space>
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" @click="handleDrawerSave">保存</a-button>
        </a-space>
      </template>
    </a-drawer>

    <!-- 详情弹窗 -->
    <a-modal v-model:open="detailVisible" title="模板详情" :footer="null" width="640px">
      <template v-if="detailTemplate">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="模板名称">{{ detailTemplate.name }}</a-descriptions-item>
          <a-descriptions-item label="启用状态">
            <a-tag :color="detailTemplate.enabled ? 'green' : 'default'">{{ detailTemplate.enabled ? '启用' : '禁用' }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailTemplate.creator }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ detailTemplate.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ detailTemplate.description || '—' }}</a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 16px; font-weight: 500;">包含巡检项（{{ detailItems.length }} 个）：</div>
        <a-table :columns="detailTableColumns" :data-source="detailItems" row-key="id" :pagination="false" size="small" style="margin-top: 8px;">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'images'">
              <img v-if="record.images?.length" :src="record.images[0]" style="width: 32px; height: 32px; object-fit: cover; border-radius: 3px;" />
              <span v-else style="color:#d9d9d9;">—</span>
            </template>
          </template>
        </a-table>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.template-page { padding: 0; }
.filter-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px 12px; margin-bottom:12px; align-items:center; }
.filter-grid .ant-btn { justify-self:start; }
.btn-group { display:flex; gap:8px; }
.filter-label { font-size: 13px; color: #666; }
.action-bar { margin-bottom: 16px; }

/* 巡检配置区 */
.config-area { margin-top: 16px; border: 1px solid #f0f0f0; border-radius: 6px; overflow: hidden; }
.config-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.config-title { font-weight: 600; font-size: 14px; }

/* 左右面板 */
.select-panel { min-height: 300px; max-height: 420px; overflow-y: auto; padding: 8px 12px; }
.panel-header { margin-bottom: 8px; }
.panel-title { font-weight: 500; font-size: 13px; }

.cat-list { display: flex; flex-direction: column; gap: 2px; }
.cat-item { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.2s; }
.cat-item:hover { background: #f5f5f5; }
.cat-item.active { background: #e6f4ff; color: #1677ff; font-weight: 500; }

/* 抽屉表格缩略图 */
.drawer-thumb { width: 32px; height: 32px; object-fit: cover; border-radius: 3px; border: 1px solid #f0f0f0; display: block; }
</style>
