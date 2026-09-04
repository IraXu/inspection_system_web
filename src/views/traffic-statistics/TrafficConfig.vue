<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@antdv-next/icons'
import { useTrafficStore, scenarioTemplates } from '@/stores/traffic'
import type { CountingPoint } from '@/stores/traffic'

const trafficStore = useTrafficStore()

const columns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '计数模式', dataIndex: 'mode', key: 'mode', align: 'center' as const },
  { title: '目标分类', dataIndex: 'targetTypes', key: 'targetTypes' },
  { title: '在数阈值', dataIndex: 'insideThreshold', key: 'insideThreshold', align: 'right' as const },
  { title: '进入/小时阈值', dataIndex: 'enterThreshold', key: 'enterThreshold', align: 'right' as const },
  { title: '在线状态', dataIndex: 'online', key: 'online', align: 'center' as const },
  { title: '操作', key: 'action', align: 'center' as const },
]

const pointRows = computed(() =>
  trafficStore.points.map(p => ({
    ...p,
    insideThreshold: p.thresholds.inside,
    enterThreshold: p.thresholds.enterPerHour,
  })))

const targetTypeOptions = computed(() => trafficStore.allTargetTypes.map(t => ({ value: t, label: t })))

// ========== 新增 / 编辑弹窗 ==========
const modalVisible = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  name: '',
  orgPath: '',
  mode: 'area' as 'area' | 'line',
  targetTypes: [] as string[],
  inside: 100,
  enterPerHour: 200,
  online: true,
})

const openAdd = () => {
  editingId.value = null
  Object.assign(form, {
    name: '', orgPath: '', mode: 'area', targetTypes: [], inside: 100, enterPerHour: 200, online: true,
  })
  modalVisible.value = true
}

const openEdit = (p: CountingPoint) => {
  editingId.value = p.id
  Object.assign(form, {
    name: p.name,
    orgPath: p.orgPath,
    mode: p.mode,
    targetTypes: [...p.targetTypes],
    inside: p.thresholds.inside,
    enterPerHour: p.thresholds.enterPerHour,
    online: p.online,
  })
  modalVisible.value = true
}

const handleSave = () => {
  if (!form.name.trim() || !form.orgPath.trim()) {
    message.warning('请填写点位名称与所属组织路径')
    return
  }
  if (form.targetTypes.length === 0) {
    message.warning('请至少选择一个目标分类')
    return
  }
  const payload = {
    name: form.name.trim(),
    orgPath: form.orgPath.trim(),
    mode: form.mode,
    targetTypes: [...form.targetTypes],
    thresholds: { inside: form.inside, enterPerHour: form.enterPerHour },
    online: form.online,
  }
  if (editingId.value) {
    trafficStore.updatePoint(editingId.value, payload)
    message.success('已保存')
  } else {
    trafficStore.addPoint({ id: `cp-${Date.now()}`, ...payload })
    message.success('已新增点位')
  }
  modalVisible.value = false
}

const handleDelete = (id: string) => {
  trafficStore.removePoint(id)
  message.success('已删除')
}
</script>

<template>
  <div class="page-container">
    <a-row :gutter="[16, 16]">
      <!-- 计数点位管理 -->
      <a-col :span="24">
        <a-card>
          <template #title>计数点位管理</template>
          <template #extra>
            <a-button type="primary" size="small" @click="openAdd">
              <template #icon><PlusOutlined /></template>新增点位
            </a-button>
          </template>
          <a-table :columns="columns" :data-source="pointRows" :pagination="false" size="middle">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mode'">
                <a-tag :color="record.mode === 'line' ? 'geekblue' : 'purple'">
                  {{ record.mode === 'line' ? '跨线计数' : '区域计数' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'targetTypes'">
                <a-space :size="4" wrap>
                  <a-tag v-for="t in record.targetTypes" :key="t">{{ t }}</a-tag>
                </a-space>
              </template>
              <template v-else-if="column.key === 'online'">
                <a-tag :color="record.online ? 'green' : 'red'">
                  {{ record.online ? '在线' : '离线' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openEdit(record)">
                    <template #icon><EditOutlined /></template>编辑
                  </a-button>
                  <a-popconfirm title="确定删除该点位？" @confirm="handleDelete(record.id)">
                    <a-button type="link" size="small" danger>
                      <template #icon><DeleteOutlined /></template>删除
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 场景模板参考 -->
    <a-card title="场景模板参考" class="section-card">
      <a-table
        :columns="[
          { title: '场景', dataIndex: 'name', key: 'name' },
          { title: '统计对象', dataIndex: 'objectName', key: 'objectName' },
          { title: '计量单位', dataIndex: 'unit', key: 'unit' },
          { title: '目标分类', dataIndex: 'targetTypes', key: 'targetTypes' },
          { title: '在数阈值', dataIndex: 'inside', key: 'inside', align: 'right' },
          { title: '进入/小时阈值', dataIndex: 'enter', key: 'enter', align: 'right' },
        ]"
        :data-source="scenarioTemplates.map(s => ({ ...s, inside: s.thresholds.inside, enter: s.thresholds.enterPerHour }))"
        :pagination="false"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'targetTypes'">
            <a-space :size="4" wrap>
              <a-tag v-for="t in record.targetTypes" :key="t">{{ t }}</a-tag>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增 / 编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑计数点位' : '新增计数点位'" @ok="handleSave" :width="560">
      <a-form layout="vertical">
        <a-form-item label="点位名称" required>
          <a-input v-model:value="form.name" placeholder="如：主入口 / 中庭 / 停车场入口" />
        </a-form-item>
        <a-form-item label="所属组织路径" required>
          <a-input v-model:value="form.orgPath" placeholder="如：新加坡 / 中央区 / 乌节路 / 乌节路旗舰店" />
        </a-form-item>
        <a-form-item label="计数模式">
          <a-radio-group v-model:value="form.mode">
            <a-radio value="area">区域计数</a-radio>
            <a-radio value="line">跨线计数</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="目标分类" required>
          <a-select v-model:value="form.targetTypes" mode="multiple" :options="targetTypeOptions" placeholder="选择目标分类" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="在数阈值">
              <a-input-number v-model:value="form.inside" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="进入/小时阈值">
              <a-input-number v-model:value="form.enterPerHour" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="在线状态">
          <a-switch v-model:checked="form.online" checked-children="在线" un-checked-children="离线" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.page-container { padding: 8px; }
.section-card { margin-top: 16px; }
:deep(.ant-table) { table-layout: fixed; }
</style>
