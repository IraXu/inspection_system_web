<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { message, Modal } from 'antdv-next'
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, SearchOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@antdv-next/icons'
import type { InspectionCategory, InspectionItem } from '@/types'

// ========== Mock 数据 ==========
const mockCategories: InspectionCategory[] = [
  { id: '1', name: '安全管理' },
  { id: '2', name: '环境卫生' },
  { id: '3', name: '行为规范' },
]

const mockItems: InspectionItem[] = [
  { id: '1', name: '地面整洁', categoryId: '2', categoryName: '环境卫生', enabled: true, linkedTemplate: true, description: '检查地面是否干净整洁，无杂物堆放', images: ['https://picsum.photos/200/150?1'] },
  { id: '2', name: '设备整洁', categoryId: '2', categoryName: '环境卫生', enabled: true, linkedTemplate: false, description: '检查设备表面是否清洁，无明显灰尘', images: [] },
  { id: '3', name: '灭火器是否过期', categoryId: '1', categoryName: '安全管理', enabled: true, linkedTemplate: true, description: '检查灭火器压力表是否在绿区，是否在有效期内', images: ['https://picsum.photos/200/150?2'] },
  { id: '4', name: '安全出口畅通', categoryId: '1', categoryName: '安全管理', enabled: false, linkedTemplate: false, description: '安全出口无堵塞，指示灯正常', images: [] },
  { id: '5', name: '消防栓可用', categoryId: '1', categoryName: '安全管理', enabled: true, linkedTemplate: true, description: '消防栓设备齐全，水带无破损', images: ['https://picsum.photos/200/150?3'] },
  { id: '6', name: '员工着装规范', categoryId: '3', categoryName: '行为规范', enabled: true, linkedTemplate: false, description: '员工是否穿戴工服工牌', images: [] },
]

// ========== 左侧巡检类（默认选中第一个） ==========
const selectedCategoryId = ref<string>(mockCategories[0]?.id || '')
const categories = ref<InspectionCategory[]>([...mockCategories])
const allItems = ref<InspectionItem[]>([...mockItems])
const categorySearchText = ref('')

const filteredCategories = computed(() => {
  if (!categorySearchText.value.trim()) return categories.value
  return categories.value.filter(c => c.name.includes(categorySearchText.value))
})

const editingCategoryId = ref<string | null>(null)
const editingCategoryName = ref('')
const editCategoryVisible = ref(false)
const editCategoryTarget = ref<InspectionCategory | null>(null)

const addCategoryVisible = ref(false)
const newCategoryName = ref('')

// 自定义上下文菜单
const contextMenuCatId = ref<string | null>(null)
const toggleContextMenu = (catId: string) => {
  contextMenuCatId.value = contextMenuCatId.value === catId ? null : catId
}
const closeContextMenu = () => { contextMenuCatId.value = null }

const openAddCategory = () => { addCategoryVisible.value = true; newCategoryName.value = '' }
const confirmAddCategory = () => {
  if (!newCategoryName.value.trim()) return
  categories.value.push({ id: String(Date.now()), name: newCategoryName.value.trim() })
  addCategoryVisible.value = false; message.success('分类添加成功')
}
const startEditCategory = (cat: InspectionCategory) => {
  editCategoryTarget.value = cat
  editingCategoryName.value = cat.name
  editCategoryVisible.value = true
}
const confirmEditCategory = () => {
  const cat = editCategoryTarget.value
  if (cat && editingCategoryName.value.trim()) {
    cat.name = editingCategoryName.value.trim()
    allItems.value.forEach(item => { if (item.categoryId === cat.id) item.categoryName = cat.name })
    message.success('分类编辑成功')
  }
  editCategoryVisible.value = false
  editingCategoryName.value = ''
  editCategoryTarget.value = null
}
const openDeleteCategoryConfirm = (cat: InspectionCategory) => {
  Modal.confirm({
    title: '是否删除?',
    icon: () => h(ExclamationCircleOutlined),
    content: '此操作将永久删除所选巡检类，是否继续?',
    okText: '继续',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      const linked = allItems.value.filter(i => i.categoryId === cat.id && i.linkedTemplate)
      if (linked.length > 0) {
        message.error('所选巡检类关联了模板，无法删除！')
        return Promise.reject()
      }
      categories.value = categories.value.filter(c => c.id !== cat.id)
      allItems.value = allItems.value.filter(i => i.categoryId !== cat.id)
      if (selectedCategoryId.value === cat.id) selectedCategoryId.value = categories.value[0]?.id || ''
      message.success('分类已删除')
    },
  })
}

// ========== 右侧巡检项筛选（查询/重置模式） ==========
const searchName = ref('')
const searchEnabled = ref<string | undefined>(undefined)
const searchLinked = ref<string | undefined>(undefined)

const activeName = ref('')
const activeEnabled = ref<string | undefined>(undefined)
const activeLinked = ref<string | undefined>(undefined)

const handleSearch = () => { activeName.value = searchName.value; activeEnabled.value = searchEnabled.value; activeLinked.value = searchLinked.value }
const handleReset = () => {
  searchName.value = ''; searchEnabled.value = undefined; searchLinked.value = undefined
  activeName.value = ''; activeEnabled.value = undefined; activeLinked.value = undefined
}

const filteredItems = computed(() => {
  let items = allItems.value.filter(i => i.categoryId === selectedCategoryId.value)
  if (activeName.value) items = items.filter(i => i.name.includes(activeName.value))
  if (activeEnabled.value !== undefined) items = items.filter(i => i.enabled === (activeEnabled.value === 'enabled'))
  if (activeLinked.value !== undefined) items = items.filter(i => i.linkedTemplate === (activeLinked.value === 'linked'))
  return items
})

const categoryOptions = computed(() => categories.value.map(c => ({ value: c.id, label: c.name })))

const rowSelection = reactive({
  selectedRowKeys: [] as string[],
  onChange: (keys: string[]) => { rowSelection.selectedRowKeys = keys },
})

// ========== 巡检项操作 ==========
const modalVisible = ref(false)
const modalTitle = ref('添加巡检项')
const editingItemId = ref<string | null>(null)
const formData = reactive<Partial<InspectionItem>>({ name: '', categoryId: '', enabled: true, description: '', images: [] })

const previewVisible = ref(false)
const previewImage = ref('')

const openAddModal = () => {
  modalTitle.value = '添加巡检项'; editingItemId.value = null
  formData.name = ''; formData.categoryId = selectedCategoryId.value; formData.enabled = true; formData.description = ''; formData.images = []
  modalVisible.value = true
}
const openEditModal = (item: InspectionItem) => {
  modalTitle.value = '编辑巡检项'; editingItemId.value = item.id
  formData.name = item.name; formData.categoryId = item.categoryId; formData.enabled = item.enabled; formData.description = item.description; formData.images = [...item.images]
  modalVisible.value = true
}
const handleSubmitItem = () => {
  if (!formData.name?.trim()) { message.warning('请输入巡检项名称'); return }
  if ((formData.name?.length || 0) > 50) { message.warning('巡检项名称不能超过50字'); return }
  const cat = categories.value.find(c => c.id === formData.categoryId)
  if (editingItemId.value) {
    const item = allItems.value.find(i => i.id === editingItemId.value)
    if (item) { item.name = formData.name!; item.categoryId = formData.categoryId!; item.categoryName = cat?.name || ''; item.enabled = formData.enabled!; item.description = formData.description || '' }
    message.success('巡检项编辑成功')
  } else {
    allItems.value.push({ id: String(Date.now()), name: formData.name!, categoryId: formData.categoryId!, categoryName: cat?.name || '', enabled: formData.enabled!, linkedTemplate: false, description: formData.description || '', images: [] })
    message.success('巡检项添加成功')
  }
  modalVisible.value = false
}
const handleDeleteItem = (item: InspectionItem) => {
  if (item.linkedTemplate) { message.error('所选巡检项关联了模板，无法删除！'); return }
  allItems.value = allItems.value.filter(i => i.id !== item.id); message.success('巡检项已删除')
}
const handleBatchDelete = () => {
  if (rowSelection.selectedRowKeys.length === 0) { message.warning('请先选择巡检项'); return }
  const linked = allItems.value.filter(i => rowSelection.selectedRowKeys.includes(i.id) && i.linkedTemplate)
  if (linked.length > 0) { message.error('所选巡检项关联了模板，无法删除！'); return }
  allItems.value = allItems.value.filter(i => !rowSelection.selectedRowKeys.includes(i.id)); rowSelection.selectedRowKeys = []; message.success('批量删除成功')
}
const openPreview = (url: string) => { previewImage.value = url; previewVisible.value = true }

const columns = [
  { title: '巡检项名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
  { title: '是否关联模板', dataIndex: 'linkedTemplate', key: 'linkedTemplate', width: 120 },
  { title: '标准图', key: 'images', width: 100 },
  { title: '描述说明', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 140 },
]
</script>

<template>
  <div class="item-library">
    <div class="lib-layout">
      <!-- 左侧：巡检类面板 -->
      <div class="lib-left">
        <div class="category-panel">
          <div class="category-title">巡检类</div>
          <div class="category-header">
            <a-input v-model:value="categorySearchText" placeholder="搜索" size="small" allow-clear>
              <template #prefix><SearchOutlined /></template>
            </a-input>
            <a-button type="text" size="small" class="add-btn" @click="openAddCategory"><PlusOutlined /></a-button>
          </div>
          <div class="category-list">
            <div
              v-for="cat in filteredCategories" :key="cat.id"
              class="category-item" :class="{ active: selectedCategoryId === cat.id }"
              @click="selectedCategoryId = cat.id"
            >
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-more-wrap" @click.stop="toggleContextMenu(cat.id)">
                <MoreOutlined class="cat-more" />
                <div v-if="contextMenuCatId === cat.id" class="context-menu">
                  <div class="context-menu-item" @click.stop="startEditCategory(cat); closeContextMenu()">
                    <EditOutlined /> 编辑
                  </div>
                  <div class="context-menu-item danger" @click.stop="openDeleteCategoryConfirm(cat); closeContextMenu()">
                    <DeleteOutlined /> 删除
                  </div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：巡检项列表 -->
      <div class="lib-right">
        <!-- 筛选区 -->
        <div class="filter-grid">
          <a-input v-model:value="searchName" placeholder="巡检项名称" allow-clear @pressEnter="handleSearch" />
          <a-select v-model:value="searchEnabled" placeholder="启用状态" allow-clear :options="[{value:'enabled',label:'启用'},{value:'disabled',label:'禁用'}]" />
          <a-select v-model:value="searchLinked" placeholder="是否关联" allow-clear :options="[{value:'linked',label:'已关联'},{value:'unlinked',label:'未关联'}]" />
          <span class="btn-group"><a-button type="primary" @click="handleSearch"><SearchOutlined /> 查询</a-button><a-button @click="handleReset"><ReloadOutlined /> 重置</a-button></span>
        </div>

        <!-- 操作栏 -->
        <div class="action-bar">
          <a-button type="primary" @click="openAddModal"><PlusOutlined /> 添加巡检项</a-button>
          <a-button danger :disabled="rowSelection.selectedRowKeys.length === 0" @click="handleBatchDelete">批量删除</a-button>
        </div>

        <!-- 巡检项表格 -->
        <a-table :columns="columns" :data-source="filteredItems" :row-selection="rowSelection" row-key="id" :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: true, pageSizeOptions: ['10','20','50','100'] }" size="middle">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'enabled'">
              <a-tag :color="record.enabled ? 'green' : 'red'">{{ record.enabled ? '启用' : '禁用' }}</a-tag>
            </template>
            <template v-else-if="column.key === 'linkedTemplate'">
              <span>{{ record.linkedTemplate ? '已关联' : '未关联' }}</span>
            </template>
            <template v-else-if="column.key === 'images'">
              <template v-if="record.images && record.images.length > 0">
                <img :src="record.images[0]" class="thumb-img" @click="openPreview(record.images[0])" />
              </template>
              <span v-else class="img-placeholder">—</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
                <a-popconfirm title="是否删除？此操作将永久删除所选巡检项，是否继续？" ok-text="确定" cancel-text="取消" @confirm="handleDeleteItem(record)">
                  <a-button type="link" danger size="small">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
            <template v-else-if="column.dataIndex">
              <span :style="{color: record[column.dataIndex] ? 'inherit' : '#ccc'}">{{ record[column.dataIndex] || '-' }}</span>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 添加/编辑巡检项弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmitItem" width="560px">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="巡检项名称" required>
          <a-input v-model:value="formData.name" placeholder="请输入巡检项名称" :maxlength="50" show-count />
        </a-form-item>
        <a-form-item label="巡检类" required>
          <a-select v-model:value="formData.categoryId" :options="categoryOptions" style="width: 100%" />
        </a-form-item>
        <a-form-item label="启用状态" required>
          <a-radio-group v-model:value="formData.enabled">
            <a-radio :value="true">启用</a-radio>
            <a-radio :value="false">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="巡检项描述">
          <a-textarea v-model:value="formData.description" :rows="3" placeholder="请输入巡检项描述" />
        </a-form-item>
        <a-form-item label="巡检项标准">
          <a-upload list-type="picture-card" :max-count="3" :before-upload="() => false">
            <div><PlusOutlined /><div style="margin-top: 8px">上传</div></div>
          </a-upload>
          <div class="upload-tip">支持 jpg、jpeg、png 格式，20MB 以内；最多 3 张</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加巡检类弹窗 -->
    <a-modal v-model:open="addCategoryVisible" title="添加巡检类" cancel-text="取消" ok-text="确定" @ok="confirmAddCategory" width="420px">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="类名称" required><a-input v-model:value="newCategoryName" placeholder="请输入巡检类名称" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑巡检类弹窗 -->
    <a-modal v-model:open="editCategoryVisible" title="编辑巡检类" cancel-text="取消" ok-text="确定" @ok="confirmEditCategory" width="420px">
      <a-form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="类名称" required><a-input v-model:value="editingCategoryName" placeholder="请输入巡检类名称" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal v-model:open="previewVisible" :footer="null" title="标准图预览" width="560px">
      <img :src="previewImage" style="width: 100%;" />
    </a-modal>
  </div>
</template>

<style scoped>
.item-library { padding: 0; }
.lib-layout { display: flex; gap: 16px; align-items: flex-start; }
.lib-left { flex-shrink: 0; width: 280px; }
.lib-right { flex: 1; min-width: 0; }
.category-panel {
  background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  min-height: 400px; display: flex; flex-direction: column;
}
.category-title { padding: 14px 16px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; }
.category-header { display: flex; align-items: center; gap: 6px; padding: 10px 12px; }
.category-header :deep(.ant-input-affix-wrapper) { flex: 1; border-radius: 6px; }
.add-btn { color: #999 !important; font-size: 16px !important; }
.add-btn:hover { color: #1677ff !important; }
.category-list { flex: 1; padding: 0 0 8px 0; overflow-y: auto; }
.category-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; cursor: pointer; transition: all 0.2s;
  border-left: 3px solid transparent; font-size: 13px; color: #333;
}
.category-item:hover { background: #f5f7fa; }
.category-item.active { background: #e6f4ff; color: #1677ff; font-weight: 500; border-left-color: #1677ff; }
.cat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-more-wrap { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0; cursor: pointer; }
.cat-more { font-size: 16px; color: #bfbfbf; }
.category-item:hover .cat-more { color: #1677ff; }
.cat-more-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0; cursor: pointer; }
.context-menu { position: absolute; right: 0; top: 100%; z-index: 1050; background: #fff; border-radius: 6px; box-shadow: 0 3px 12px rgba(0,0,0,0.12); padding: 4px 0; min-width: 100px; }
.context-menu-item { padding: 6px 14px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #333; white-space: nowrap; }
.context-menu-item:hover { background: #f5f5f5; }
.context-menu-item.danger { color: #ff4d4f; }
.context-menu-item.danger:hover { background: #fff2f0; }
.filter-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px 12px; margin-bottom:12px; align-items:center; }
.filter-grid .ant-btn { justify-self:start; }
.btn-group { display:flex; gap:8px; }
.filter-label { font-size: 13px; color: #666; }
.action-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.thumb-img { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #f0f0f0; display: block; }
.img-placeholder { color: #d9d9d9; }
.upload-tip { color: #999; font-size: 12px; margin-top: 4px; }
</style>
