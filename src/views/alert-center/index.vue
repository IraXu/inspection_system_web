<!--
 * @Author: AloofXu
 * @Date: 2026-06-09 18:42:24
 * @LastEditors: AloofXu
 * @LastEditTime: 2026-06-26 15:00:00
 * @FilePath: /web-prototype/src/views/alert-center/index.vue
-->
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, h } from 'vue'
import { message } from 'antdv-next'
import {
  SearchOutlined, DeleteOutlined, ReloadOutlined,
  ExclamationCircleOutlined,
  BankOutlined, ApartmentOutlined, ShopOutlined,
  EnvironmentOutlined, VideoCameraOutlined,
} from '@antdv-next/icons'
import dayjs, { type Dayjs } from 'dayjs'

// ==================== 组织设备树 ====================
interface TreeNode {
  key: string; title: string; count?: number
  children?: TreeNode[]; isDevice?: boolean
  nodeLevel?: 'root' | 'region' | 'city' | 'district' | 'store' | 'device'
}

const rawOrgTree: TreeNode[] = [
  {
    key: 'root', title: '鹤梦信息大中华区', count: 50, nodeLevel: 'root',
    children: [
      { key: 'huadong', title: '华东大区', count: 25, nodeLevel: 'region',
        children: [
          { key: 'nanjing', title: '南京市', count: 25, nodeLevel: 'city',
            children: [
              { key: 'jiangning-wanda', title: '江宁万达', count: 10, nodeLevel: 'district',
                children: [
                  { key: 'jn-store-a', title: 'xxx店铺a', count: 3, nodeLevel: 'store', children: [
                    { key: 'dev-jn-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-a3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                  { key: 'jn-store-b', title: 'xxx店铺b', count: 3, nodeLevel: 'store', children: [
                    { key: 'dev-jn-b1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-b2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-b3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                  { key: 'jn-store-c', title: 'xxx店铺c', count: 4, nodeLevel: 'store', children: [
                    { key: 'dev-jn-c1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-c2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-c3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-jn-c4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
              { key: 'gulou-wanda', title: '鼓楼万达', count: 5, nodeLevel: 'district',
                children: [
                  { key: 'gl-store-a', title: 'xxx店铺a', count: 2, nodeLevel: 'store', children: [
                    { key: 'dev-gl-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-gl-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                  { key: 'gl-store-b', title: 'xxx店铺b', count: 3, nodeLevel: 'store', children: [
                    { key: 'dev-gl-b1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-gl-b2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-gl-b3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
              { key: 'qiaobei', title: '桥北万象城', count: 10, nodeLevel: 'district',
                children: [
                  { key: 'qb-store-a', title: 'xxx店铺a', count: 5, nodeLevel: 'store', children: [
                    { key: 'dev-qb-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-a3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-a4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-a5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                  { key: 'qb-store-b', title: 'xxx店铺b', count: 5, nodeLevel: 'store', children: [
                    { key: 'dev-qb-b1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-b2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-b3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-b4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-qb-b5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
            ]
          },
        ]
      },
      { key: 'huanan', title: '华南大区', count: 5, nodeLevel: 'region',
        children: [
          { key: 'shenzhen', title: '深圳市', count: 5, nodeLevel: 'city',
            children: [
              { key: 'sz-futian', title: '福田商圈', count: 5, nodeLevel: 'district',
                children: [
                  { key: 'sz-store-a', title: 'xxx店铺a', count: 5, nodeLevel: 'store', children: [
                    { key: 'dev-sz-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-sz-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-sz-a3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-sz-a4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-sz-a5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
            ]
          },
        ]
      },
      { key: 'huabei', title: '华北大区', count: 20, nodeLevel: 'region',
        children: [
          { key: 'beijing', title: '北京市', count: 10, nodeLevel: 'city',
            children: [
              { key: 'bj-chaoyang', title: '朝阳商圈', count: 10, nodeLevel: 'district',
                children: [
                  { key: 'bj-store-a', title: 'xxx店铺a', count: 5, nodeLevel: 'store', children: [
                    { key: 'dev-bj-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-a3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-a4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-a5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                  { key: 'bj-store-b', title: 'xxx店铺b', count: 5, nodeLevel: 'store', children: [
                    { key: 'dev-bj-b1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-b2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-b3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-b4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-bj-b5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
            ]
          },
          { key: 'tianjin', title: '天津市', count: 10, nodeLevel: 'city',
            children: [
              { key: 'tj-nankai', title: '南开区', count: 10, nodeLevel: 'district',
                children: [
                  { key: 'tj-store-a', title: 'xxx店铺a', count: 10, nodeLevel: 'store', children: [
                    { key: 'dev-tj-a1', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a2', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a3', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a4', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a5', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a6', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a7', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a8', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a9', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                    { key: 'dev-tj-a10', title: '设备名称A', isDevice: true, nodeLevel: 'device' },
                  ]},
                ]
              },
            ]
          },
        ]
      },
    ]
  },
]

const nodeIconMap: Record<string, any> = { root: BankOutlined, region: ApartmentOutlined, city: EnvironmentOutlined, district: ShopOutlined, store: ShopOutlined, device: VideoCameraOutlined }

// 为树节点附加图标和计数徽章
const attachMeta = (nodes: TreeNode[]): any[] => nodes.map(n => {
  const icon = n.nodeLevel ? h(nodeIconMap[n.nodeLevel], { class: 'ac-tree-icon' }) : undefined
  const badge = n.count !== undefined ? h('span', { class: 'ac-tree-badge' }, n.count) : undefined
  return {
    ...n,
    title: h('span', { class: 'ac-tree-title-wrap' }, [icon, h('span', { class: 'ac-tree-label' }, n.title), badge].filter(Boolean)),
    children: n.children ? attachMeta(n.children) : undefined,
  }
})

const treeSearchText = ref('')
const selectedTreeNodeKeys = ref<string[]>([])
const expandedTreeKeys = ref<string[]>(['root'])

const filterTree = (nodes: TreeNode[], kw: string): TreeNode[] => {
  if (!kw) return nodes
  const r: TreeNode[] = []
  for (const n of nodes) {
    const m = n.title.includes(kw)
    let fc: TreeNode[] | undefined
    if (n.children) fc = filterTree(n.children, kw)
    if (m || (fc && fc.length > 0)) r.push({ ...n, children: fc && fc.length > 0 ? fc : n.children })
  }
  return r
}

const filteredTree = computed(() => attachMeta(filterTree(rawOrgTree, treeSearchText.value)))

const allKeys = (nodes: TreeNode[]): string[] => {
  const ks: string[] = []
  for (const n of nodes) { ks.push(n.key); if (n.children) ks.push(...allKeys(n.children)) }
  return ks
}

watch(treeSearchText, v => { expandedTreeKeys.value = v ? allKeys(filterTree(rawOrgTree, v)) : ['root'] })
const onTreeSelect = (ks: string[]) => { selectedTreeNodeKeys.value = ks; fetchAlertList() }

// ==================== 筛选条件 ====================
const filterForm = reactive({
  region: undefined as string | undefined,
  eventType: undefined as string | undefined,
  deviceName: '',
  license: '',
  alertDateRange: [] as [Dayjs, Dayjs] | [],
})

const initToday = () => { filterForm.alertDateRange = [dayjs(), dayjs()] }

const eventTypeOptions = [
  { value: 'person_appear', label: '有人出现' }, { value: 'area_intrusion', label: '区域入侵' },
  { value: 'fire_smoke', label: '烟火检测' }, { value: 'leave_post', label: '离岗检测' },
  { value: 'video_loss', label: '视频丢失' }, { value: 'lens_block', label: '镜头遮挡' },
  { value: 'blur_image', label: '画面模糊' }, { value: 'night_abnormal', label: '夜视异常' },
  { value: 'storage_shortage', label: '存储不足' }, { value: 'device_offline', label: '设备离线' },
  { value: 'temp_high', label: '温度过高' }, { value: 'motion_detect', label: '移动侦测' },
  { value: 'sound_abnormal', label: '声音异常' },
]

const regionOptions = [
  { value: 'huadong', label: '华东大区', children: [
    { value: 'nanjing', label: '南京市', children: [
      { value: 'jiangning-wanda', label: '江宁万达' }, { value: 'gulou-wanda', label: '鼓楼万达' }, { value: 'qiaobei', label: '桥北万象城' },
    ]},
  ]},
  { value: 'huanan', label: '华南大区', children: [
    { value: 'shenzhen', label: '深圳市', children: [{ value: 'sz-futian', label: '福田商圈' }] },
  ]},
  { value: 'huabei', label: '华北大区', children: [
    { value: 'beijing', label: '北京市', children: [{ value: 'bj-chaoyang', label: '朝阳商圈' }] },
    { value: 'tianjin', label: '天津市', children: [{ value: 'tj-nankai', label: '南开区' }] },
  ]},
]

const onSearch = () => fetchAlertList()
const onReset = () => {
  filterForm.region = undefined; filterForm.eventType = undefined
  filterForm.deviceName = ''; filterForm.license = ''
  initToday(); selectedTreeNodeKeys.value = []; fetchAlertList()
}

// ==================== 告警列表 ====================
interface AlertRecord {
  id: string; orgPath: string; eventType: string; deviceName: string
  license: string; alertTime: string; eventImage: string
}

const loading = ref(false)
const alertList = ref<AlertRecord[]>([])
const selectedRowKeys = ref<string[]>([])
const listPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const mockOrgPaths = ['华北/天津/南开', '华东/南京/江宁万达', '华东/南京/鼓楼万达', '华南/深圳/福田商圈', '华北/北京/朝阳商圈', '华东/南京/桥北万象城']
const mockEventTypes = ['有人出现', '区域入侵', '烟火检测', '离岗检测', '视频丢失', '镜头遮挡', '画面模糊']
const mockDeviceNames = ['摄像机A', '摄像机B', '摄像机C', '摄像机D', '摄像机E', '摄像机F']
const mockLicenses = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF', 'GGGG-HHHH-IIII', 'JJJJ-KKKK-LLLL', 'MMMM-NNNN-OOOO']

const allMockData: AlertRecord[] = (() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const list: AlertRecord[] = []
  const colors = ['e8f4fd/1677ff', 'fef3e2/fa8c16', 'eaf7e4/52c41a', 'fde8f0/eb2f96', 'e8edfb/2f54eb', 'f3e8fa/722ed1']
  for (let i = 0; i < 60; i++) {
    const secsFromMidnight = Math.floor((i / 59) * 86390) // spread evenly across 00:00:01 ~ 23:59:50
    const t = new Date(todayStart.getTime() + secsFromMidnight * 1000)
    list.push({
      id: `alert-${i + 1}`,
      orgPath: mockOrgPaths[i % mockOrgPaths.length],
      eventType: mockEventTypes[i % mockEventTypes.length],
      deviceName: mockDeviceNames[i % mockDeviceNames.length],
      license: mockLicenses[i % mockLicenses.length],
      alertTime: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
      eventImage: `https://placehold.co/160x120/${colors[i % colors.length]}?text=Event+${i + 1}`,
    })
  }
  return list
})()

const fetchAlertList = async () => {
  loading.value = true; await new Promise(r => setTimeout(r, 300))
  let filtered = [...allMockData]
  if (filterForm.region) {
    const label = getRegionLabel(filterForm.region)
    if (label) filtered = filtered.filter(item => item.orgPath.includes(label))
  }
  if (filterForm.eventType) {
    const el = eventTypeOptions.find(o => o.value === filterForm.eventType)?.label
    if (el) filtered = filtered.filter(item => item.eventType === el)
  }
  if (filterForm.deviceName) filtered = filtered.filter(item => item.deviceName.includes(filterForm.deviceName))
  if (filterForm.license) filtered = filtered.filter(item => item.license.toLowerCase().includes(filterForm.license.toLowerCase()))
  if (filterForm.alertDateRange && filterForm.alertDateRange.length === 2) {
    const [s, e] = filterForm.alertDateRange
    filtered = filtered.filter(item => item.alertTime >= s.format('YYYY-MM-DD') && item.alertTime <= e.format('YYYY-MM-DD 23:59:59'))
  }
  listPagination.total = filtered.length
  alertList.value = filtered.slice((listPagination.current - 1) * listPagination.pageSize, listPagination.current * listPagination.pageSize)
  selectedRowKeys.value = []; loading.value = false
}

const getRegionLabel = (key: string): string => {
  const map: Record<string, string> = {
    'huadong': '华东', 'huanan': '华南', 'huabei': '华北',
    'nanjing': '南京', 'shenzhen': '深圳', 'beijing': '北京', 'tianjin': '天津',
    'jiangning-wanda': '江宁万达', 'gulou-wanda': '鼓楼万达', 'qiaobei': '桥北万象城',
    'sz-futian': '福田商圈', 'bj-chaoyang': '朝阳商圈', 'tj-nankai': '南开',
  }
  return map[key] || ''
}

const onTableChange = (pag: { current: number; pageSize: number }) => {
  listPagination.current = pag.current; listPagination.pageSize = pag.pageSize; fetchAlertList()
}

// ==================== 删除 ====================
const deleteModalVisible = ref(false)
const deleteTargetId = ref<string>('')
const onSingleDelete = (r: AlertRecord) => { deleteTargetId.value = r.id; deleteModalVisible.value = true }
const onBatchDelete = () => {
  if (!selectedRowKeys.value.length) { message.warning('请选择要删除的告警'); return }
  deleteTargetId.value = ''; deleteModalVisible.value = true
}
const confirmDelete = () => {
  if (deleteTargetId.value) {
    const idx = allMockData.findIndex(i => i.id === deleteTargetId.value)
    if (idx !== -1) allMockData.splice(idx, 1)
    message.success('删除成功')
  } else {
    for (const k of selectedRowKeys.value) {
      const idx = allMockData.findIndex(i => i.id === k)
      if (idx !== -1) allMockData.splice(idx, 1)
    }
    message.success(`已删除 ${selectedRowKeys.value.length} 条告警`)
  }
  deleteModalVisible.value = false; deleteTargetId.value = ''; fetchAlertList()
}

// ==================== 表格 ====================
const columns = [
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', width: 190, ellipsis: true },
  { title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 100 },
  { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 110 },
  { title: 'License', dataIndex: 'license', key: 'license', width: 180, ellipsis: true },
  { title: '告警时间', dataIndex: 'alertTime', key: 'alertTime', width: 180 },
  { title: '事件抓图', key: 'eventImage', width: 110, align: 'center' as const },
  { title: '操作', key: 'action', width: 80, align: 'center' as const },
]

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (ks: string[]) => { selectedRowKeys.value = ks },
}))

onMounted(() => { initToday(); fetchAlertList() })
</script>

<template>
  <div class="ac-root">
    <!-- 左侧面板 -->
    <aside class="ac-panel">
      <div class="ac-panel-head">
        <span class="ac-panel-head-icon"><BankOutlined /></span>
        <span class="ac-panel-head-text">组织与设备</span>
      </div>
      <div class="ac-panel-search">
        <a-input v-model:value="treeSearchText" placeholder="搜索组织或设备..." allow-clear :bordered="false" class="ac-search-input">
          <template #prefix><SearchOutlined style="color:#94a3b8" /></template>
        </a-input>
      </div>
      <nav class="ac-panel-body">
        <a-tree
          :tree-data="filteredTree"
          :expanded-keys="expandedTreeKeys"
          :selected-keys="selectedTreeNodeKeys"
          @select="onTreeSelect"
          @update:expandedKeys="(ks: string[]) => expandedTreeKeys = ks"
          :field-names="{ children: 'children', title: 'title', key: 'key' }"
          block-node
          class="ac-tree"
          :show-line="false"
        />
      </nav>
    </aside>

    <!-- 右侧主区域 -->
    <section class="ac-body">
      <!-- 筛选区 -->
      <div class="ac-card ac-filter">
        <div class="ac-filter-row">
          <div class="ac-filter-item">
            <span class="ac-filter-label">所属区域</span>
            <a-cascader v-model:value="filterForm.region" :options="regionOptions" placeholder="请选择区域" allow-clear style="width:160px" changeOnSelect />
          </div>
          <div class="ac-filter-item">
            <span class="ac-filter-label">事件类型</span>
            <a-select v-model:value="filterForm.eventType" :options="eventTypeOptions" placeholder="请选择类型" allow-clear style="width:140px" />
          </div>
          <div class="ac-filter-item">
            <span class="ac-filter-label">设备名称</span>
            <a-input v-model:value="filterForm.deviceName" placeholder="请输入" allow-clear style="width:140px" />
          </div>
          <div class="ac-filter-item">
            <span class="ac-filter-label">License</span>
            <a-input v-model:value="filterForm.license" placeholder="请输入" allow-clear style="width:160px" />
          </div>
          <div class="ac-filter-item">
            <span class="ac-filter-label">告警时间</span>
            <a-range-picker v-model:value="filterForm.alertDateRange" format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']" style="width:240px" />
          </div>
          <div class="ac-filter-actions">
            <a-button type="primary" @click="onSearch"><SearchOutlined />查询</a-button>
            <a-button @click="onReset"><ReloadOutlined />重置</a-button>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="ac-bar">
        <a-button danger :disabled="!selectedRowKeys.length" @click="onBatchDelete" :icon="h(DeleteOutlined)">批量删除</a-button>
        <span v-if="selectedRowKeys.length" class="ac-bar-hint">已选 {{ selectedRowKeys.length }} 项</span>
      </div>

      <!-- 表格 -->
      <div class="ac-card ac-table-card">
        <a-table
          :columns="columns"
          :data-source="alertList"
          :loading="loading"
          :row-selection="rowSelection"
          :pagination="{
            current: listPagination.current,
            pageSize: listPagination.pageSize,
            total: listPagination.total,
            showTotal: (total: number) => `共 ${total} 条记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }"
          row-key="id"
          size="middle"
          :scroll="{ x: 1060 }"
          :locale="{ emptyText: '暂无告警数据' }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'eventImage'">
              <a-image
                :width="80" :height="60"
                :src="record.eventImage"
                :preview="{ mask: true }"
                class="ac-img-thumb"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Crect width='80' height='60' rx='6' fill='%23f1f5f9'/%3E%3Ctext x='40' y='34' text-anchor='middle' font-size='11' fill='%2394a3b8' font-family='system-ui'%3E加载失败%3C/text%3E%3C/svg%3E"
              />
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" danger size="small" @click="onSingleDelete(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </div>
    </section>

    <!-- 删除弹窗 -->
    <a-modal
      v-model:open="deleteModalVisible"
      :width="420"
      @ok="confirmDelete"
      @cancel="() => deleteModalVisible = false"
      ok-text="确认删除"
      cancel-text="取消"
      :ok-button-props="{ danger: true }"
      :closable="false"
    >
      <template #title>
        <div class="ac-modal-title">
          <span class="ac-modal-title-icon"><ExclamationCircleOutlined /></span>
          <span>确认删除所选告警消息？</span>
        </div>
      </template>
      <p class="ac-modal-desc">删除后将无法恢复该告警记录，确定要继续吗？</p>
    </a-modal>
  </div>
</template>

<style scoped>
/* ========== ROOT ========== */
.ac-root {
  display: flex;
  height: 100%;
  background: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ========== 左侧面板 ========== */
.ac-panel {
  width: 268px;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eef1f5;
}
.ac-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px 14px;
}
.ac-panel-head-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 15px;
}
.ac-panel-head-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
}
.ac-panel-search {
  padding: 0 12px 8px;
}
.ac-search-input {
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid transparent !important;
  transition: all .2s;
}
.ac-search-input:focus-within {
  background: #fff;
  border-color: #e2e8f0 !important;
  box-shadow: 0 0 0 2px rgba(59,130,246,.08);
}
.ac-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 16px;
}

/* 树 */
.ac-tree {
  font-size: 13px;
  background: transparent;
  color: #475569;
}
.ac-tree :deep(.ant-tree-treenode) {
  display: flex;
  align-items: center;
  padding: 1px 0;
  border-radius: 6px;
  margin-bottom: 1px;
}
.ac-tree :deep(.ant-tree-treenode:hover) {
  background: #f8fafc;
}
.ac-tree :deep(.ant-tree-node-selected) {
  background: #eff6ff !important;
}
.ac-tree :deep(.ant-tree-node-content-wrapper) {
  display: inline-flex !important;
  align-items: center;
  padding: 5px 8px;
  border-radius: 6px;
  transition: none;
  line-height: 1;
}
.ac-tree :deep(.ant-tree-node-content-wrapper:hover) {
  background: transparent !important;
}
.ac-tree :deep(.ant-tree-switcher) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 24px;
  line-height: 24px;
  color: #94a3b8;
  flex-shrink: 0;
}
.ac-tree :deep(.ant-tree-indent-unit) { width: 18px; }

/* 树节点内部元素 */
:deep(.ac-tree-icon) {
  font-size: 13px;
  color: #94a3b8;
  margin-right: 6px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
:deep(.ac-tree-label) {
  font-size: 13px;
  color: #334155;
  vertical-align: middle;
}
:deep(.ac-tree-badge) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  margin-left: 6px;
  border-radius: 9px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
}
:deep(.ant-tree-node-selected .ac-tree-badge) {
  background: #bfdbfe;
  color: #2563eb;
}
:deep(.ac-tree-title-wrap) {
  display: inline-flex !important;
  align-items: center;
  width: 100%;
  gap: 0;
}

/* ========== 右侧主区域 ========== */
.ac-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 24px;
  gap: 16px;
}

/* 卡片通用 */
.ac-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.02);
}

/* 筛选卡片 */
.ac-filter {
  padding: 14px 20px;
}
.ac-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.ac-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ac-filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}
.ac-filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* 工具栏 */
.ac-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ac-bar-hint {
  font-size: 13px;
  color: #94a3b8;
}

/* 表格卡片 */
.ac-table-card {
  flex: 1;
  overflow: hidden;
  padding: 0;
}
.ac-table-card :deep(.ant-table) {
  font-size: 13px;
  color: #334155;
}
.ac-table-card :deep(.ant-table-thead > tr > th) {
  background: #fafbfc;
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
  text-transform: none;
  letter-spacing: 0.02em;
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f5;
}
.ac-table-card :deep(.ant-table-tbody > tr > td) {
  padding: 12px 14px;
  border-bottom: 1px solid #f8fafc;
}
.ac-table-card :deep(.ant-table-tbody > tr:hover > td) {
  background: #fafcff !important;
}
.ac-table-card :deep(.ant-table-tbody > tr.ant-table-row-selected > td) {
  background: #f0f7ff;
}
.ac-table-card :deep(.ant-pagination) {
  margin: 16px 24px !important;
}

/* 缩略图 */
.ac-img-thumb {
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  transition: box-shadow .2s, transform .2s;
  border: 2px solid #f1f5f9;
}
.ac-img-thumb:hover {
  box-shadow: 0 2px 8px rgba(59,130,246,.15);
  transform: translateY(-1px);
  border-color: #93c5fd;
}
.ac-img-thumb :deep(.ant-image-mask) { border-radius: 6px; }
.ac-img-thumb :deep(.ant-image-img) { object-fit: cover; }

/* 弹窗 */
.ac-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.ac-modal-title-icon {
  font-size: 20px;
  color: #f59e0b;
}
.ac-modal-desc {
  margin: 0;
  padding-left: 30px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

/* 全局微调 */
:deep(.ant-btn) {
  border-radius: 8px;
  font-weight: 500;
  box-shadow: none;
}
:deep(.ant-btn-primary) {
  box-shadow: 0 1px 2px rgba(59,130,246,.2);
}
:deep(.ant-input), :deep(.ant-select-selector), :deep(.ant-picker), :deep(.ant-cascader) {
  border-radius: 8px !important;
}
</style>
