<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@antdv-next/icons'
import { useEnergyStore } from '@/stores/energy'
import type { OperationLog } from '@/stores/energy'

const energyStore = useEnergyStore()

// ========== 筛选状态（点击查询才生效） ==========
const actionFilter = ref<string | undefined>(undefined)
const keyword = ref('')
const activeAction = ref<string | undefined>(undefined)
const activeKeyword = ref('')

const actionMap: Record<OperationLog['action'], string> = {
  POWER_OFF: '断电',
  POWER_ON: '启用',
}
const resultMap: Record<OperationLog['result'], { text: string; color: string }> = {
  SUCCESS: { text: '成功', color: 'green' },
  FAILED: { text: '失败', color: 'red' },
  TIMEOUT: { text: '超时', color: 'orange' },
}

// TODO: 对接后端 API — 查询操作日志 GET /api/energy/operation-logs
const dataSource = computed<OperationLog[]>(() => {
  return energyStore.logs.filter(log => {
    const actionOk = !activeAction.value || log.action === activeAction.value
    const kw = activeKeyword.value.trim()
    const kwOk = !kw || log.orgPath.includes(kw) || log.meterName.includes(kw) || log.operator.includes(kw)
    return actionOk && kwOk
  })
})

const actionOptions = [
  { value: 'POWER_OFF', label: '断电' },
  { value: 'POWER_ON', label: '启用' },
]

const handleSearch = () => {
  activeAction.value = actionFilter.value
  activeKeyword.value = keyword.value
}
const handleReset = () => {
  actionFilter.value = undefined
  keyword.value = ''
  activeAction.value = undefined
  activeKeyword.value = ''
}

const columns = [
  { title: '操作时间', dataIndex: 'time', key: 'time' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '电表', dataIndex: 'meterName', key: 'meterName' },
  { title: '操作类型', dataIndex: 'action', key: 'action' },
  { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
  { title: '结果', dataIndex: 'result', key: 'result' },
]

const pagination = reactive({ current: 1, pageSize: 10 })

const pagedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return dataSource.value.slice(start, start + pagination.pageSize)
})
</script>

<template>
  <div class="page-container">
    <a-card>
      <div class="toolbar">
        <a-space wrap>
          <a-select v-model:value="actionFilter" placeholder="操作类型" allow-clear style="width: 140px" :options="actionOptions" />
          <a-input-search
            v-model:value="keyword"
            placeholder="搜索门店/电表/操作人"
            style="width: 240px"
            allow-clear
          />
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined /> 查询
          </a-button>
          <a-button @click="handleReset">
            <ReloadOutlined /> 重置
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-tag :color="record.action === 'POWER_OFF' ? 'red' : 'blue'">
              {{ actionMap[record.action as OperationLog['action']] }}
            </a-tag>
          </template>
          <template v-if="column.key === 'result'">
            <a-tag :color="resultMap[record.result as OperationLog['result']].color">
              {{ resultMap[record.result as OperationLog['result']].text }}
            </a-tag>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无操作日志" />
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="dataSource.length"
          show-size-changer
          :page-size-options="['10','20','50','100']"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.page-container {
  padding: 8px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
:deep(.ant-table) {
  table-layout: fixed;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
