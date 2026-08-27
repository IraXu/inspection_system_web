<script setup lang="ts">
import { ref, computed } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@antdv-next/icons'
import type { TableColumnsType } from 'antdv-next'

// ==========================================
// 类型定义
// ==========================================
/** NVR 装维的子设备（通道）详情 */
interface NvrInstallChild {
  id: string
  name: string
  serialNo: string
  ip: string
  reportTime: string
}

/** 设备装维记录 */
interface InstallRecord {
  id: string
  name: string
  deviceType: string
  license: string
  orgPathLabel: string
  worker: string
  reportTime: string
  isNvr?: boolean
  /** NVR：该 NVR 下装维的子设备数量 */
  installCount?: number
  /** NVR：装维子设备详情 */
  subDevices?: NvrInstallChild[]
}

const workerColorMap: Record<string, string> = {
  赵师傅: 'blue',
  李师傅: 'cyan',
  王师傅: 'geekblue',
  张师傅: 'purple',
}

const workerOptions = ['赵师傅', '李师傅', '王师傅', '张师傅'].map(w => ({ label: w, value: w }))

// ==========================================
// Mock 装维记录数据（含 NVR 演示）
// ==========================================
const mockRecords: InstallRecord[] = [
  { id: 'r1', name: 'xxxx门口监控', deviceType: 'WIFI摄像机', license: 'adadad', orgPathLabel: '杭州/西湖区/xx/xx', worker: '赵师傅', reportTime: '2026-08-24 09:12:33' },
  { id: 'r2', name: 'xxxx工位监控', deviceType: 'WIFI摄像机', license: 'sfsfsfsf', orgPathLabel: '杭州/西湖区/xx/xx', worker: '赵师傅', reportTime: '2026-08-24 09:15:02' },
  { id: 'r3', name: 'cccc仓储监控', deviceType: 'WIFI摄像机', license: 'dhdhdgd', orgPathLabel: '杭州/西湖区/xx/xx', worker: '赵师傅', reportTime: '2026-08-24 10:03:47' },
  { id: 'r4', name: 'xxxx仓库监控', deviceType: '4G摄像机', license: 'etetetet', orgPathLabel: '杭州/西湖区/xx/xx', worker: '李师傅', reportTime: '2026-08-24 11:20:15' },
  { id: 'r5', name: 'xxxx门口监控', deviceType: '低功耗摄像头', license: 'et34tdgdg', orgPathLabel: '杭州/西湖区/xx/xx', worker: '李师傅', reportTime: '2026-08-24 14:51:09' },
  {
    id: 'r6', name: 'NVR-杭州机房', deviceType: 'NVR', license: 'NVR-HZ-0001', orgPathLabel: '杭州/西湖区/xx/xx', worker: '赵师傅', reportTime: '2026-08-24 15:30:44',
    isNvr: true, installCount: 5,
    subDevices: [
      { id: 'r6c1', name: '通道1-大门', serialNo: 'C20702456', ip: '192.168.1.64', reportTime: '2026-08-24 15:30:44' },
      { id: 'r6c2', name: '通道2-收银台', serialNo: 'C20702457', ip: '192.168.1.65', reportTime: '2026-08-24 15:30:44' },
      { id: 'r6c3', name: '通道3-库房', serialNo: 'C20702458', ip: '192.168.1.66', reportTime: '2026-08-24 15:31:02' },
      { id: 'r6c4', name: '通道4-后门', serialNo: 'GB28181-2231', ip: '192.168.1.67', reportTime: '2026-08-24 15:31:20' },
      { id: 'r6c5', name: '通道5-机房', serialNo: 'RTSP-5567-9A12', ip: '192.168.1.69', reportTime: '2026-08-24 15:31:35' },
    ],
  },
  {
    id: 'r7', name: 'NVR-苏州机房', deviceType: 'NVR', license: 'NVR-SZ-0002', orgPathLabel: '杭州/西湖区/xx/xx', worker: '李师傅', reportTime: '2026-08-24 16:02:18',
    isNvr: true, installCount: 3,
    subDevices: [
      { id: 'r7c1', name: '通道1-东门', serialNo: 'C20800112', ip: '192.168.1.64', reportTime: '2026-08-24 16:02:18' },
      { id: 'r7c2', name: '通道2-停车场', serialNo: 'RTSP-5567-9A12', ip: '192.168.1.65', reportTime: '2026-08-24 16:02:30' },
      { id: 'r7c3', name: '通道3-大厅', serialNo: 'C20800113', ip: '192.168.1.66', reportTime: '2026-08-24 16:02:45' },
    ],
  },
  { id: 'r8', name: 'xxxx大厅监控', deviceType: 'WIFI摄像机', license: 'l7k2m9x1', orgPathLabel: '杭州/滨江区/xx/xx', worker: '李师傅', reportTime: '2026-08-24 16:10:22' },
  { id: 'r9', name: 'xxxx走廊监控', deviceType: '4G摄像机', license: 'p3q8r5s2', orgPathLabel: '杭州/滨江区/xx/xx', worker: '王师傅', reportTime: '2026-08-24 16:22:47' },
  { id: 'r10', name: 'xxxx库房监控', deviceType: '低功耗摄像头', license: 'a6b4c7d9', orgPathLabel: '杭州/余杭区/xx/xx', worker: '王师傅', reportTime: '2026-08-24 16:35:01' },
  { id: 'r11', name: 'xxxx出入口监控', deviceType: 'AI摄像机', license: 'm2n8v4w6', orgPathLabel: '杭州/余杭区/xx/xx', worker: '赵师傅', reportTime: '2026-08-24 16:48:33' },
  { id: 'r12', name: 'xxxx停车场监控', deviceType: 'WIFI摄像机', license: 'k9j1h3g5', orgPathLabel: '上海/浦东新区/xx/xx', worker: '张师傅', reportTime: '2026-08-25 09:05:18' },
  { id: 'r13', name: 'xxxx电梯监控', deviceType: '4G摄像机', license: 'f7d3s6a8', orgPathLabel: '上海/浦东新区/xx/xx', worker: '赵师傅', reportTime: '2026-08-25 09:18:42' },
  { id: 'r14', name: 'xxxx楼梯间监控', deviceType: '低功耗摄像头', license: 'q5w8e1r4', orgPathLabel: '上海/静安区/xx/xx', worker: '李师傅', reportTime: '2026-08-25 09:32:07' },
  { id: 'r15', name: 'xxxx前台监控', deviceType: 'AI摄像机', license: 'z3x6c9v2', orgPathLabel: '上海/静安区/xx/xx', worker: '王师傅', reportTime: '2026-08-25 09:45:51' },
  { id: 'r16', name: 'xxxx会议室监控', deviceType: 'WIFI摄像机', license: 'b8n2m5k9', orgPathLabel: '杭州/西湖区/xx/xx', worker: '张师傅', reportTime: '2026-08-25 10:01:26' },
  { id: 'r17', name: 'xxxx茶水间监控', deviceType: '4G摄像机', license: 'v4c7x1z6', orgPathLabel: '杭州/西湖区/xx/xx', worker: '李师傅', reportTime: '2026-08-25 10:15:39' },
  { id: 'r18', name: 'xxxx消防通道监控', deviceType: '低功耗摄像头', license: 'h6j9k2l5', orgPathLabel: '杭州/拱墅区/xx/xx', worker: '赵师傅', reportTime: '2026-08-25 10:28:54' },
  { id: 'r19', name: 'xxxx天台监控', deviceType: 'AI摄像机', license: 't5r8y1u4', orgPathLabel: '杭州/拱墅区/xx/xx', worker: '张师傅', reportTime: '2026-08-25 10:42:11' },
  { id: 'r20', name: 'xxxx外围监控', deviceType: 'WIFI摄像机', license: 'g3h6j9k2', orgPathLabel: '上海/徐汇区/xx/xx', worker: '王师傅', reportTime: '2026-08-25 11:03:28' },
  { id: 'r21', name: 'xxxx机房监控', deviceType: '4G摄像机', license: 's7d2f8g5', orgPathLabel: '上海/徐汇区/xx/xx', worker: '张师傅', reportTime: '2026-08-25 11:17:45' },
  { id: 'r22', name: 'xxxx配电间监控', deviceType: 'AI摄像机', license: 'e4r7t9y1', orgPathLabel: '上海/长宁区/xx/xx', worker: '李师傅', reportTime: '2026-08-25 11:30:02' },
  {
    id: 'r23', name: 'NVR-南京机房', deviceType: 'NVR', license: 'NVR-NJ-0003', orgPathLabel: '江苏/南京/江宁区/xx/xx', worker: '王师傅', reportTime: '2026-08-25 11:45:16',
    isNvr: true, installCount: 0,
    subDevices: [],
  },
]

// ==========================================
// 筛选
// ==========================================
interface FilterForm {
  name: string
  license: string
  worker: string
  reportRange: [string, string] | null
}

const filters = ref<FilterForm>({ name: '', license: '', worker: '', reportRange: null })
const activeFilters = ref<FilterForm>({ name: '', license: '', worker: '', reportRange: null })

const handleSearch = () => {
  activeFilters.value = { ...filters.value }
  pagination.value.current = 1
}
const handleReset = () => {
  filters.value = { name: '', license: '', worker: '', reportRange: null }
  activeFilters.value = { ...filters.value }
  pagination.value.current = 1
}

const filteredRecords = computed(() => {
  let list = mockRecords
  const af = activeFilters.value
  if (af.name.trim()) list = list.filter(r => r.name.includes(af.name.trim()))
  if (af.license.trim()) list = list.filter(r => r.license.includes(af.license.trim()))
  if (af.worker.trim()) list = list.filter(r => r.worker.includes(af.worker.trim()))
  if (af.reportRange) {
    const [start, end] = af.reportRange
    const s = start ? new Date(start).getTime() : -Infinity
    // 结束日取到当天 23:59:59，避免当天记录被过滤
    const e = end ? new Date(end).getTime() + 86399999 : Infinity
    list = list.filter(r => {
      const t = new Date(r.reportTime).getTime()
      return t >= s && t <= e
    })
  }
  return list
})

// ==========================================
// 分页
// ==========================================
const pagination = ref({ current: 1, pageSize: 10 })

const tablePagination = computed(() => ({
  current: pagination.value.current,
  pageSize: pagination.value.pageSize,
  total: filteredRecords.value.length,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (t: number) => `共 ${t} 条`,
}))

const onTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.value.current = pag.current || 1
  pagination.value.pageSize = pag.pageSize || 10
}

// ==========================================
// 表格列
// ==========================================
const columns: TableColumnsType = [
  { title: '序号', key: 'index', width: 64 },
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 130 },
  { title: '设备License', dataIndex: 'license', key: 'license', width: 150, ellipsis: true },
  { title: '装配组织路径', dataIndex: 'orgPathLabel', key: 'orgPathLabel', width: 240, ellipsis: true },
  { title: '装配人员', dataIndex: 'worker', key: 'worker', width: 110 },
  { title: '上报时间', dataIndex: 'reportTime', key: 'reportTime', width: 180 },
]

// ==========================================
// NVR 子设备详情
// ==========================================
const detailVisible = ref(false)
const detailRecord = ref<InstallRecord | null>(null)
const openDetail = (record: InstallRecord) => {
  detailRecord.value = record
  detailVisible.value = true
}

const childColumns: TableColumnsType = [
  { title: '序号', key: 'index', width: 64 },
  { title: '设备名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: 'SN', dataIndex: 'serialNo', key: 'serialNo', width: 150 },
  { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
  { title: '上报时间', dataIndex: 'reportTime', key: 'reportTime', width: 170 },
]
</script>

<template>
  <div class="ir-page">
    <!-- ==================== 顶部筛选区 ==================== -->
    <div class="ir-filter">
      <div class="ir-filter-field">
        <span class="ir-filter-label">设备名称</span>
        <a-input v-model:value="filters.name" placeholder="请输入" allow-clear @pressEnter="handleSearch" />
      </div>
      <div class="ir-filter-field">
        <span class="ir-filter-label">License</span>
        <a-input v-model:value="filters.license" placeholder="请输入" allow-clear @pressEnter="handleSearch" />
      </div>
      <div class="ir-filter-field">
        <span class="ir-filter-label">装配人员</span>
        <a-select v-model:value="filters.worker" placeholder="全部" allow-clear :options="workerOptions" style="width:180px" />
      </div>
      <div class="ir-filter-field">
        <span class="ir-filter-label">上报时间</span>
        <a-range-picker v-model:value="filters.reportRange" @change="handleSearch" />
      </div>
      <a-space :size="12">
        <a-button type="primary" @click="handleSearch"><template #icon><SearchOutlined /></template>查询</a-button>
        <a-button @click="handleReset"><template #icon><ReloadOutlined /></template>重置</a-button>
      </a-space>
    </div>

    <!-- ==================== 装维记录列表 ==================== -->
    <div class="ir-table-wrap">
      <a-table
        :columns="columns"
        :data-source="filteredRecords"
        :row-key="(r: InstallRecord) => r.id"
        :pagination="tablePagination"
        :scroll="{ x: 1060 }"
        size="middle"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.key === 'name'">
            <span>{{ record.name }}</span>
          </template>
          <template v-else-if="column.key === 'deviceType'">
            <template v-if="record.isNvr">
              <span>NVR（<a class="ir-nvr-link" @click="openDetail(record)">{{ record.installCount }}</a>）</span>
            </template>
            <span v-else>{{ record.deviceType }}</span>
          </template>
          <template v-else-if="column.key === 'worker'">
            <a-tag :color="workerColorMap[record.worker] || 'blue'" style="margin:0">{{ record.worker }}</a-tag>
          </template>
        </template>
      </a-table>
    </div>

    <!-- ==================== NVR 子设备详情弹窗 ==================== -->
    <a-modal v-model:open="detailVisible" :title="detailRecord ? `${detailRecord.name} 子设备详情` : ''" width="760px" :footer="null" @cancel="detailVisible = false">
      <template v-if="detailRecord">
        <div class="ir-detail-summary">
          <div class="ir-detail-item">
            <span class="ir-detail-label">设备名称</span>
            <span class="ir-detail-value">{{ detailRecord.name }}</span>
          </div>
          <div class="ir-detail-item">
            <span class="ir-detail-label">设备License</span>
            <span class="ir-detail-value">{{ detailRecord.license }}</span>
          </div>
          <div class="ir-detail-item">
            <span class="ir-detail-label">装维子设备</span>
            <span class="ir-detail-value ir-detail-count">{{ detailRecord.installCount }} 台</span>
          </div>
          <div class="ir-detail-item">
            <span class="ir-detail-label">上报时间</span>
            <span class="ir-detail-value">{{ detailRecord.reportTime }}</span>
          </div>
        </div>

        <a-empty v-if="!detailRecord.subDevices?.length" description="暂无子设备" />
        <a-table
          v-else
          :columns="childColumns"
          :data-source="detailRecord.subDevices"
          :row-key="(r: NvrInstallChild) => r.id"
          :pagination="false"
          size="small"
          :scroll="{ x: 560 }"
        >
          <template #bodyCell="{ column, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          </template>
        </a-table>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.ir-page { display:flex; flex-direction:column; height:100%; background:#f5f7fa; }

/* 顶部筛选区 */
.ir-filter { display:flex; align-items:center; flex-wrap:wrap; gap:16px; padding:16px 24px; background:#fff; border-bottom:1px solid #f0f0f0; }
.ir-filter-field { display:flex; align-items:center; gap:8px; }
.ir-filter-label { font-size:13px; color:#333; white-space:nowrap; }
.ir-filter-field :deep(.ant-input), .ir-filter-field :deep(.ant-picker) { width:180px; }

/* 列表区 */
.ir-table-wrap { flex:1; overflow-y:auto; padding:16px 24px; background:#fff; }
.ir-table-wrap :deep(.ant-table) { font-size:13px; }
.ir-table-wrap :deep(.ant-table-thead > tr > th) { background:#fafafa; font-weight:600; white-space:nowrap; }
.ir-nvr-link { color:#1677ff; cursor:pointer; }

/* NVR 子设备详情弹窗 */
.ir-detail-summary { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; padding:12px 16px; margin-bottom:16px; background:#fafbfc; border:1px solid #f0f0f0; border-radius:6px; }
.ir-detail-item { display:flex; flex-direction:column; gap:4px; min-width:0; }
.ir-detail-label { font-size:12px; color:#999; }
.ir-detail-value { font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ir-detail-count { color:#1677ff; font-weight:600; }
</style>
