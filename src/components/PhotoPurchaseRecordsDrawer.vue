<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TableColumnsType } from 'antdv-next'
import { SearchOutlined, ReloadOutlined } from '@antdv-next/icons'
import { useGpsStore } from '@/stores/gps'
import type { PhotoQuotaOrder } from '@/types'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const gpsStore = useGpsStore()

const keyword = ref('')
const payMethodFilter = ref<string>('')

/** 支付方式选项，取自实际记录，避免出现没有数据的筛选项 */
const payMethodOptions = computed(() => {
  const set = new Set(gpsStore.photoOrders.map(o => o.payMethod))
  return [...set].map(m => ({ value: m, label: m }))
})

const filteredOrders = computed(() => {
  let list = gpsStore.photoOrders
  const kw = keyword.value.trim()
  if (kw) {
    list = list.filter(o =>
      o.orderNo.includes(kw)
      || o.buyer.includes(kw)
      || o.serviceName.includes(kw))
  }
  if (payMethodFilter.value) list = list.filter(o => o.payMethod === payMethodFilter.value)
  return list
})

/** 当前筛选结果的支付金额合计 */
const totalAmount = computed(() =>
  filteredOrders.value.reduce((s, o) => s + o.amount, 0))

// ==================== 分页 ====================
const pagination = ref({ current: 1, pageSize: 10 })

const tablePagination = computed(() => ({
  current: pagination.value.current,
  pageSize: pagination.value.pageSize,
  total: filteredOrders.value.length,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (t: number) => `共 ${t} 条`,
}))

/** 条件变化后回到第一页，避免停留在越界页码上 */
watch([filteredOrders, () => pagination.value.pageSize], () => {
  const max = Math.max(1, Math.ceil(filteredOrders.value.length / pagination.value.pageSize))
  if (pagination.value.current > max) pagination.value.current = 1
})

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  if (pag.pageSize && pag.pageSize !== pagination.value.pageSize) {
    pagination.value.pageSize = pag.pageSize
    pagination.value.current = 1
    return
  }
  pagination.value.current = pag.current || 1
}

const resetFilters = () => {
  keyword.value = ''
  payMethodFilter.value = ''
  pagination.value.current = 1
}

const methodColor = (m: string) => {
  if (m.startsWith('支付宝')) return 'blue'
  if (m.startsWith('微信')) return 'green'
  if (m.startsWith('PayPal')) return 'geekblue'
  return 'default'
}

// ==================== 表格列 ====================
const columns: TableColumnsType = [
  { title: '序号', key: 'index', width: 64 },
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 190 },
  { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 230, ellipsis: true },
  { title: '购买人', dataIndex: 'buyer', key: 'buyer', width: 100 },
  { title: '支付方式', dataIndex: 'payMethod', key: 'payMethod', width: 110 },
  { title: '支付金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right' },
  { title: '支付时间', dataIndex: 'payTime', key: 'payTime', width: 170 },
]
</script>

<template>
  <a-drawer
    :open="open"
    title="购买记录"
    :size="980"
    @close="emit('update:open', false)"
  >
    <template #extra>
      <span class="pr-total">
        共 {{ filteredOrders.length }} 笔 · 合计 ¥{{ totalAmount.toLocaleString() }}
      </span>
    </template>

    <!-- 筛选 -->
    <div class="pr-filter">
      <a-input
        v-model:value="keyword"
        placeholder="订单号 / 购买人 / 服务名称"
        allow-clear
        style="width:260px"
        @pressEnter="pagination.current = 1"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select
        v-model:value="payMethodFilter"
        placeholder="支付方式"
        allow-clear
        style="width:150px"
        :options="payMethodOptions"
      />
      <a-button @click="resetFilters">
        <template #icon><ReloadOutlined /></template>重置
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="filteredOrders"
      :row-key="(r: PhotoQuotaOrder) => r.id"
      :pagination="tablePagination"
      :scroll="{ x: 974 }"
      size="middle"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'payMethod'">
          <a-tag :color="methodColor(record.payMethod)" style="margin:0">{{ record.payMethod }}</a-tag>
        </template>
        <template v-else-if="column.key === 'amount'">
          <span class="pr-amount">¥{{ record.amount.toLocaleString() }}</span>
        </template>
      </template>
    </a-table>
  </a-drawer>
</template>

<style scoped>
.pr-total { font-size:12.5px; color:#64748b; }

.pr-filter { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }

.pr-amount { font-weight:600; color:#ff7a45; font-variant-numeric:tabular-nums; }
</style>
