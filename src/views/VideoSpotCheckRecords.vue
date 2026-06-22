<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { SearchOutlined, ShopOutlined, PictureOutlined, FileSearchOutlined, BankOutlined, ApartmentOutlined, CheckCircleFilled, CloseCircleFilled, CameraOutlined, RightOutlined, ClockCircleOutlined, WarningOutlined } from '@antdv-next/icons'
import { message } from 'antdv-next'
import dayjs, { type Dayjs } from 'dayjs'
import type { SpotCheckRecord, RecordDetail } from '@/types'

const router = useRouter()
const route = useRoute()

// ========== 区域树（全部门店统计）==========
const rawRegionTree = [
  {
    key: 'root', title: '鹤梦信息大中华区', nodeType: 'enterprise',
    children: [
      { key: 'huabei', title: '华北大区', nodeType: 'organization',
        children: [
          { key: 'nj', title: '南京市', nodeType: 'organization',
            children: [
              { key: 'qb', title: '桥北万象城', nodeType: 'store' },
              { key: 'xl', title: '新街口商圈', nodeType: 'store' },
              { key: 'gl', title: '鼓楼万达', nodeType: 'store' },
              { key: 'ln', title: '辽宁万达', nodeType: 'store' },
            ]
          },
        ]
      },
      { key: 'huanan', title: '华南大区', nodeType: 'organization',
        children: [
          { key: 'gz', title: '广州市', nodeType: 'organization',
            children: [
              { key: 'th', title: '天河商圈', nodeType: 'store' },
            ]
          },
        ]
      },
      { key: 'huadong', title: '华东大区', nodeType: 'organization',
        children: [
          { key: 'sh', title: '上海市', nodeType: 'organization',
            children: [
              { key: 'lujz', title: '陆家嘴商圈', nodeType: 'store' },
              { key: 'xh', title: '徐汇商圈', nodeType: 'store' },
            ]
          },
        ]
      },
    ],
  },
]

// ========== 模拟记录数据 ==========
const mockRecords: SpotCheckRecord[] = [
  {
    id:'r1',inspectionNo:'SP-20260610-001',storeId:'s1',storeName:'21世纪太阳城xxx商铺',regionPath:['root','huabei','nj','qb'],
    templateId:'t1',templateName:'日常巡检标准模板A',method:'spot',executor:'张三',
    executedAt:'2026-06-10 14:30',totalItems:5,qualifiedCount:5,unqualifiedCount:0,
    screenshotCount:3,issueId:null,issueStatus:'none',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'设备表面无灰尘',standardImages:[],screenshots:[] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r2',inspectionNo:'SP-20260610-002',storeId:'s2',storeName:'xxx万达苏宁--xxx旗舰门店',regionPath:['root','huabei','nj','qb'],
    templateId:'t2',templateName:'日常巡检标准模板B',method:'spot',executor:'李四',
    executedAt:'2026-06-10 10:00',totalItems:5,qualifiedCount:4,unqualifiedCount:1,
    screenshotCount:2,issueId:'ISSUE-20260610-001',issueStatus:'pending',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'fail',problemDesc:'设备表面有明显灰尘',standard:'设备表面无灰尘',standardImages:['std1','std2'],screenshots:['s4','s5'] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r3',inspectionNo:'SP-20260609-001',storeId:'s5',storeName:'xxxxx城xxx店铺',regionPath:['root','huabei','nj','gl'],
    templateId:'t1',templateName:'日常巡检标准模板A',method:'spot',executor:'王五',
    executedAt:'2026-06-09 16:45',totalItems:5,qualifiedCount:3,unqualifiedCount:2,
    screenshotCount:4,issueId:'ISSUE-20260609-001',issueStatus:'rectifying',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'fail',problemDesc:'地面有垃圾',standard:'地面无杂物、无污渍、无水渍',standardImages:['std3'],screenshots:['s6','s7'] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'fail',problemDesc:'收银台设备脏污',standard:'设备表面无灰尘',standardImages:[],screenshots:['s8','s9'] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r4',inspectionNo:'SP-20260608-001',storeId:'s6',storeName:'xxxxxxx城xx店铺',regionPath:['root','huadong','sh','lujz'],
    templateId:'t3',templateName:'高端门店巡检标准',method:'spot',executor:'赵六',
    executedAt:'2026-06-08 11:20',totalItems:3,qualifiedCount:3,unqualifiedCount:0,
    screenshotCount:1,issueId:null,issueStatus:'none',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'设备表面无灰尘',standardImages:[],screenshots:[] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r5',inspectionNo:'SP-20260607-001',storeId:'s10',storeName:'xxxxx城xxx店铺',regionPath:['root','huanan','gz','th'],
    templateId:'t1',templateName:'日常巡检标准模板A',method:'spot',executor:'张三',
    executedAt:'2026-06-07 09:15',totalItems:5,qualifiedCount:5,unqualifiedCount:0,
    screenshotCount:2,issueId:null,issueStatus:'none',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'设备表面无灰尘',standardImages:[],screenshots:[] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r6',inspectionNo:'SP-20260607-002',storeId:'s11',storeName:'xxxxxxx城xx店铺',regionPath:['root','huanan','gz','th'],
    templateId:'t2',templateName:'日常巡检标准模板B',method:'spot',executor:'李四',
    executedAt:'2026-06-07 15:00',totalItems:5,qualifiedCount:4,unqualifiedCount:1,
    screenshotCount:2,issueId:'ISSUE-20260607-001',issueStatus:'completed',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'fail',problemDesc:'多个货架商品歪斜',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:['s13','s14'] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'设备表面无灰尘',standardImages:[],screenshots:[] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
  {
    id:'r7',inspectionNo:'SP-20260604-001',storeId:'s6',storeName:'xxxxxxx城xx店铺',regionPath:['root','huadong','sh','lujz'],
    templateId:'t1',templateName:'日常巡检标准模板A',method:'spot',executor:'王五',
    executedAt:'2026-06-04 10:30',totalItems:5,qualifiedCount:5,unqualifiedCount:0,
    screenshotCount:0,issueId:null,issueStatus:'none',
    details:[
      { itemId:'i1',itemName:'地面是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'地面无杂物、无污渍、无水渍',standardImages:[],screenshots:[] },
      { itemId:'i2',itemName:'货架是否整齐',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'货架商品摆放整齐，无歪斜',standardImages:[],screenshots:[] },
      { itemId:'i3',itemName:'设备是否整洁',categoryName:'环境卫生',result:'pass',problemDesc:'',standard:'设备表面无灰尘',standardImages:[],screenshots:[] },
      { itemId:'i4',itemName:'员工着装规范',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'统一工服，佩戴工牌',standardImages:[],screenshots:[] },
      { itemId:'i5',itemName:'服务态度良好',categoryName:'行为规范',result:'pass',problemDesc:'',standard:'微笑服务，主动问候',standardImages:[],screenshots:[] },
    ],
  },
]

// 所有门店数据（用于区域树统计）
const allStoreRegionPaths = mockRecords.map(r => r.regionPath)

// ========== 区域树动态数量计算 ==========
const storeCountByKey = computed(() => {
  const map: Record<string, number> = {}
  // 用去重的 storeId 统计
  const seenStores = new Set<string>()
  for (const r of mockRecords) {
    if (seenStores.has(r.storeId)) continue
    seenStores.add(r.storeId)
    for (const k of r.regionPath) {
      map[k] = (map[k] || 0) + 1
    }
  }
  return map
})

const attachCount = (nodes: any[]): any[] => nodes.map(n => ({
  ...n,
  title: `${n.title}(${storeCountByKey.value[n.key] || 0})`,
  children: n.children ? attachCount(n.children) : undefined,
}))

const regionTree = computed(() => attachCount(rawRegionTree))

// 层级图标映射
const nodeTypeIconMap: Record<string, any> = {
  enterprise: BankOutlined,
  organization: ApartmentOutlined,
  store: ShopOutlined,
}

const titleRender = (nodeData: any) => {
  const icon = nodeData.nodeType && nodeTypeIconMap[nodeData.nodeType]
  if (icon) {
    return h('span', { class: 'scr-tree-node' }, [
      h(icon, { class: `scr-tree-icon scr-tree-icon-${nodeData.nodeType}` }),
      h('span', { class: 'scr-tree-title' }, nodeData.title),
    ])
  }
  return nodeData.title
}

const selectedKey = ref<string>('')
const expandedKeys = ref<string[]>(['root'])
const searchText = ref('')

const onTreeSelect = (keys: string[]) => {
  selectedKey.value = keys.length > 0 ? keys[0] : ''
}

// ========== 筛选条件 ==========
const getDefaultDateRange = (): [Dayjs, Dayjs] => {
  const end = dayjs()
  const start = dayjs().subtract(30, 'day')
  return [start, end]
}

const dateRange = ref<[Dayjs, Dayjs] | null>(getDefaultDateRange())
const storeSearch = ref('')
const selectedTemplate = ref<string | undefined>(undefined)

// 查询（页码重置为第 1 页）
const handleQuery = () => {
  // 当前为前端模拟数据，筛选已通过 computed 实时生效
  // 实际接入 API 时在此处调用接口并重置分页
  message.success('查询完成')
}

// 模板选项（从记录中提取去重）
const templateOpts = computed(() => {
  const set = new Set(mockRecords.map(r => r.templateName))
  return Array.from(set).map(name => ({ label: name, value: name }))
})

// ========== 过滤后的记录 ==========
const filteredRecords = computed(() => {
  let list = mockRecords

  // 区域树过滤
  if (selectedKey.value && selectedKey.value !== 'root') {
    list = list.filter(r => r.regionPath.includes(selectedKey.value))
  }

  // 门店搜索过滤
  if (storeSearch.value.trim()) {
    const kw = storeSearch.value.trim().toLowerCase()
    list = list.filter(r => r.storeName.toLowerCase().includes(kw))
  }

  // 模板过滤
  if (selectedTemplate.value) {
    list = list.filter(r => r.templateName === selectedTemplate.value)
  }

  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    list = list.filter(r => {
      const recordDate = dayjs(r.executedAt)
      return recordDate.isAfter(start.startOf('day')) && recordDate.isBefore(end.endOf('day'))
    })
  }

  return list
})

// ========== 表格列定义 ==========
const columns = [
  { title: '点检编号', dataIndex: 'inspectionNo', width: 150 },
  { title: '门店名称', key: 'storeName', width: 180, ellipsis: true },
  { title: '巡检模板', key: 'templateName', width: 160, ellipsis: true },
  { title: '执行人', dataIndex: 'executor', width: 90 },
  { title: '执行时间', key: 'executedAt', width: 170, sorter: true, defaultSortOrder: 'descend' as const },
  { title: '合格数', key: 'qualifiedCount', width: 70, align: 'center' as const },
  { title: '不合格数', key: 'unqualifiedCount', width: 80, align: 'center' as const },
  { title: '问题单状态', key: 'issueStatus', width: 100, align: 'center' as const },
  { title: '操作', key: 'actions', width: 160, align: 'center' as const, fixed: 'right' as const },
]

// ========== 记录详情 Drawer ==========
const detailVisible = ref(false)
const detailRecord = ref<SpotCheckRecord | null>(null)
const activeDetailCategory = ref(0)
const expandedStandardKeys = ref<string[]>([])

const detailCategories = computed(() => {
  if (!detailRecord.value) return []
  const set = new Set(detailRecord.value.details.map(d => d.categoryName))
  return Array.from(set)
})

const activeCatKey = computed({
  get: () => detailCategories.value.length > 0 ? String(activeDetailCategory.value) : '',
  set: (v: string) => { activeDetailCategory.value = Number(v) },
})

const filteredDetailItems = computed(() => {
  if (!detailRecord.value || detailCategories.value.length === 0) return []
  const cat = detailCategories.value[activeDetailCategory.value]
  return detailRecord.value.details.filter(d => d.categoryName === cat)
})

const toggleStandard = (itemId: string) => {
  const idx = expandedStandardKeys.value.indexOf(itemId)
  if (idx >= 0) {
    expandedStandardKeys.value.splice(idx, 1)
  } else {
    expandedStandardKeys.value.push(itemId)
  }
}

const isStandardExpanded = (itemId: string) => expandedStandardKeys.value.includes(itemId)

const openDetail = (record: SpotCheckRecord) => {
  detailRecord.value = record
  activeDetailCategory.value = 0
  expandedStandardKeys.value = []
  detailVisible.value = true
}

// ========== 问题单跳转 ==========
const goToIssue = (issueId: string) => {
  router.push(`/inspection/todos?issueId=${issueId}`)
}

// ========== 从 URL 参数入场 ==========
const initFromUrl = () => {
  const sid = route.query.storeId as string
  if (sid) {
    const store = mockRecords.find(r => r.storeId === sid)
    if (store) {
      storeSearch.value = store.storeName
    } else {
      message.warning('未找到该门店的点检记录')
    }
  }
}

initFromUrl()

// ========== 工具函数 ==========
const issueStatusMap: Record<string, { label: string; color: string }> = {
  none: { label: '无', color: 'default' },
  pending: { label: '待整改', color: 'orange' },
  rectifying: { label: '整改中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
}

const onReset = () => {
  dateRange.value = getDefaultDateRange()
  storeSearch.value = ''
  selectedTemplate.value = undefined
  selectedKey.value = ''
  message.success('已重置筛选条件')
}

const issueStatusTag = (status: string) => {
  const item = issueStatusMap[status]
  return item ? item : { label: status, color: 'default' }
}

// ========== 多选 & 导出 ==========
const selectedRowKeys = ref<string[]>([])
const exporting = ref(false)
const handleExport = () => {
  const list = selectedRowKeys.value.length > 0
    ? filteredRecords.value.filter(r => selectedRowKeys.value.includes(r.id))
    : filteredRecords.value
  if (list.length === 0) {
    message.warning('暂无数据可导出')
    return
  }
  exporting.value = true
  setTimeout(() => {
    exporting.value = false
    message.success(`成功导出 ${list.length} 条点检记录`)
  }, 800)
}
</script>

<template>
  <div class="scr-page">
    <!-- 左侧区域树 -->
    <div class="scr-sidebar">
      <a-input v-model:value="searchText" placeholder="搜索区域" class="scr-search">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-tree :tree-data="regionTree" :expanded-keys="expandedKeys"
        :selected-keys="selectedKey ? [selectedKey] : []"
        @select="onTreeSelect" @update:expandedKeys="(ks: string[]) => expandedKeys = ks"
        :field-names="{ children: 'children', title: 'title', key: 'key' }" block-node class="scr-tree" :title-render="titleRender" />
    </div>

    <!-- 右侧内容区 -->
    <div class="scr-content">
      <!-- 筛选栏 -->
      <div class="scr-filters">
        <a-range-picker v-model:value="dateRange" :placeholder="['开始日期', '结束日期']" style="width:200px" />
        <a-input v-model:value="storeSearch" placeholder="搜索门店名称" style="width:200px" allow-clear>
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select v-model:value="selectedTemplate" :options="templateOpts" placeholder="巡检模板" style="width:200px" allow-clear />
        <a-button type="primary" @click="handleQuery">查询</a-button>
        <a-button @click="onReset">重置</a-button>
        <a-button @click="handleExport" :loading="exporting">导出</a-button>
      </div>

      <!-- 记录表格 -->
      <div class="scr-table-wrap" v-if="filteredRecords.length > 0">
        <a-table :columns="columns" :data-source="filteredRecords" :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }" row-key="id" size="middle" :scroll="{ x: 1060 }" :row-selection="{ selectedRowKeys, onChange: (keys: string[]) => selectedRowKeys = keys }" :custom-row="(record: SpotCheckRecord) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'storeName'">
              <a-tooltip :title="record.storeName">
                <span class="scr-text-ellipsis">{{ record.storeName }}</span>
              </a-tooltip>
            </template>
            <template v-else-if="column.key === 'templateName'">
              <a-tooltip :title="record.templateName">
                <span class="scr-text-ellipsis">{{ record.templateName }}</span>
              </a-tooltip>
            </template>
            <template v-else-if="column.key === 'executedAt'">
              {{ record.executedAt }}
            </template>
            <template v-else-if="column.key === 'qualifiedCount'">
              <span class="scr-qualified">{{ record.qualifiedCount }}</span>
            </template>
            <template v-else-if="column.key === 'unqualifiedCount'">
              <span class="scr-unqualified" :class="{ zero: record.unqualifiedCount === 0 }">{{ record.unqualifiedCount }}</span>
            </template>
            <template v-else-if="column.key === 'issueStatus'">
              <a-tag :color="issueStatusTag(record.issueStatus).color">
                {{ issueStatusTag(record.issueStatus).label }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a @click="openDetail(record)">查看详情</a>
              <a v-if="record.issueId" @click="goToIssue(record.issueId)" class="scr-issue-link" style="margin-left:12px">问题单</a>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 空状态 -->
      <div v-else class="scr-empty">
        <a-empty description="暂无符合条件的视频点检记录" />
      </div>
    </div>

    <!-- 记录详情 Drawer -->
    <a-drawer v-model:open="detailVisible" title="记录详情" placement="right" :size="520" v-if="detailRecord" :body-style="{ padding: '20px' }">
      <!-- 基本信息 -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-title">基本信息</span>
        </div>
        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-label">点检编号</span>
            <span class="info-value">{{ detailRecord.inspectionNo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">门店</span>
            <span class="info-value" :title="detailRecord.storeName">{{ detailRecord.storeName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">巡检模板</span>
            <span class="info-value">{{ detailRecord.templateName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">执行人</span>
            <span class="info-value">{{ detailRecord.executor }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">执行时间</span>
            <span class="info-value">
              <ClockCircleOutlined class="info-time-icon" />
              {{ detailRecord.executedAt }}
            </span>
          </div>
        </div>
      </div>

      <a-divider style="margin: 16px 0" />

      <!-- 检查结果 -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-title">检查结果</span>
          <span class="detail-section-count">{{ detailRecord.details.length }} 项</span>
        </div>
        <a-tabs v-model:activeKey="activeCatKey" size="small" class="detail-tabs" v-if="detailCategories.length > 1">
          <a-tab-pane v-for="(cat, i) in detailCategories" :key="String(i)" :tab="cat" />
        </a-tabs>

        <div v-if="filteredDetailItems.length > 0" class="detail-items">
          <!-- 合格项卡片 -->
          <div v-for="item in filteredDetailItems.filter(d => d.result === 'pass')" :key="item.itemId" class="detail-item-card card-pass">
            <div class="item-card-head">
              <div class="item-card-title">
                <CheckCircleFilled class="item-card-status-icon icon-pass" />
                <span class="item-card-name">{{ item.itemName }}</span>
              </div>
              <a-tag color="success" class="item-card-tag">合格</a-tag>
            </div>
            <div class="item-card-meta">
              <span class="meta-label">问题描述</span>
              <span class="meta-value meta-empty">—</span>
            </div>
            <div class="item-card-meta">
              <span class="meta-label">截图</span>
              <span class="meta-value">0 张</span>
            </div>
            <!-- 查看标准 -->
            <div class="item-card-standard">
              <a class="standard-toggle" @click="toggleStandard(item.itemId)" :class="{ 'is-expanded': isStandardExpanded(item.itemId) }">
                <FileSearchOutlined />
                <span>查看标准</span>
                <RightOutlined class="standard-arrow" :class="{ rotated: isStandardExpanded(item.itemId) }" />
              </a>
              <div v-if="isStandardExpanded(item.itemId)" class="standard-content">
                <div class="standard-context">
                  <span class="standard-ctx-label">检查项</span>
                  <span class="standard-ctx-value">{{ item.itemName }}</span>
                </div>
                <div class="standard-context">
                  <span class="standard-ctx-label">分类</span>
                  <span class="standard-ctx-value">{{ item.categoryName }}</span>
                </div>
                <a-divider style="margin: 8px 0" dashed />
                <div class="standard-requirement">
                  <span class="standard-req-label">标准要求</span>
                  <span class="standard-req-text">{{ item.standard }}</span>
                </div>
                <div v-if="item.standardImages && item.standardImages.length > 0" class="standard-images-section">
                  <span class="standard-images-label">
                    <PictureOutlined style="margin-right:4px;font-size:12px" />
                    标准示例图
                  </span>
                  <div class="shots-grid">
                    <a-image
                      v-for="(stdImg, sii) in item.standardImages"
                      :key="sii"
                      :width="80"
                      :height="60"
                      :src="`https://placehold.co/800x600/e6f4ff/1677ff?text=Standard+${sii+1}`"
                      :preview="{ mask: true }"
                      class="shot-thumb"
                    >
                      <template #fallback>
                        <div class="shot-placeholder shot-placeholder-std">
                          <FileSearchOutlined />
                          <span class="shot-index">标准{{ sii + 1 }}</span>
                        </div>
                      </template>
                    </a-image>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 不合格项卡片 -->
          <div v-for="item in filteredDetailItems.filter(d => d.result === 'fail')" :key="item.itemId" class="detail-item-card card-fail">
            <div class="item-card-head">
              <div class="item-card-title">
                <CloseCircleFilled class="item-card-status-icon icon-fail" />
                <span class="item-card-name">{{ item.itemName }}</span>
              </div>
              <a-tag color="error" class="item-card-tag">不合格</a-tag>
            </div>
            <div class="item-card-meta">
              <span class="meta-label">问题描述</span>
              <span class="meta-value" :class="{ 'meta-empty': !item.problemDesc }">{{ item.problemDesc || '—' }}</span>
            </div>
            <!-- 截图（仅不合格项展示） -->
            <div v-if="item.screenshots.length > 0" class="item-card-shots">
              <span class="shots-header">
                <CameraOutlined />
                现场截图 · {{ item.screenshots.length }} 张
              </span>
              <div class="shots-grid">
                <a-image
                  v-for="(shot, si) in item.screenshots"
                  :key="si"
                  :width="80"
                  :height="60"
                  :src="`https://placehold.co/800x600/f5f5f5/8c8c8c?text=Screenshot+${si+1}`"
                  :preview="{ mask: true }"
                  class="shot-thumb"
                >
                  <template #fallback>
                    <div class="shot-placeholder">
                      <PictureOutlined />
                      <span class="shot-index">{{ si + 1 }}</span>
                    </div>
                  </template>
                </a-image>
              </div>
            </div>
            <div v-else class="item-card-meta">
              <span class="meta-label">截图</span>
              <span class="meta-value">0 张</span>
            </div>
            <!-- 查看标准 -->
            <div class="item-card-standard">
              <a class="standard-toggle" @click="toggleStandard(item.itemId)" :class="{ 'is-expanded': isStandardExpanded(item.itemId) }">
                <FileSearchOutlined />
                <span>查看标准</span>
                <RightOutlined class="standard-arrow" :class="{ rotated: isStandardExpanded(item.itemId) }" />
              </a>
              <div v-if="isStandardExpanded(item.itemId)" class="standard-content">
                <div class="standard-context">
                  <span class="standard-ctx-label">检查项</span>
                  <span class="standard-ctx-value">{{ item.itemName }}</span>
                </div>
                <div class="standard-context">
                  <span class="standard-ctx-label">分类</span>
                  <span class="standard-ctx-value">{{ item.categoryName }}</span>
                </div>
                <a-divider style="margin: 8px 0" dashed />
                <div class="standard-requirement">
                  <span class="standard-req-label">标准要求</span>
                  <span class="standard-req-text">{{ item.standard }}</span>
                </div>
                <div v-if="item.standardImages && item.standardImages.length > 0" class="standard-images-section">
                  <span class="standard-images-label">
                    <PictureOutlined style="margin-right:4px;font-size:12px" />
                    标准示例图
                  </span>
                  <div class="shots-grid">
                    <a-image
                      v-for="(stdImg, sii) in item.standardImages"
                      :key="sii"
                      :width="80"
                      :height="60"
                      :src="`https://placehold.co/800x600/e6f4ff/1677ff?text=Standard+${sii+1}`"
                      :preview="{ mask: true }"
                      class="shot-thumb"
                    >
                      <template #fallback>
                        <div class="shot-placeholder shot-placeholder-std">
                          <FileSearchOutlined />
                          <span class="shot-index">标准{{ sii + 1 }}</span>
                        </div>
                      </template>
                    </a-image>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <a-empty v-else description="该分类下暂无检查项" :image-style="{ height: '40px' }" />
      </div>

      <a-divider style="margin: 16px 0" />

      <!-- 关联问题单 -->
      <div class="detail-section">
        <div class="detail-section-head">
          <span class="detail-section-title">关联问题单</span>
        </div>
        <template v-if="detailRecord.issueId">
          <div class="issue-card">
            <div class="issue-card-left">
              <a-tag color="warning" class="issue-tag">{{ detailRecord.issueId }}</a-tag>
              <span class="issue-status-text">{{ issueStatusTag(detailRecord.issueStatus).label }}</span>
            </div>
            <a @click="goToIssue(detailRecord.issueId)" class="issue-link">
              查看详情 <RightOutlined style="font-size:11px" />
            </a>
          </div>
        </template>
        <a-empty v-else description="无关联问题单" :image-style="{ height: '40px' }" />
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.scr-page { display: flex; height: 100%; background: #f5f7fa; }
.scr-sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.scr-search { margin: 12px; width: auto; }
.scr-tree { flex: 1; overflow-y: auto; padding: 0 8px 12px; }
.scr-tree :deep(.ant-tree-node-selected) { background: #e6f7ff !important; }
.scr-tree :deep(.ant-tree-title) { font-size: 13px; }
.scr-tree :deep(.scr-tree-node) { display: inline-flex; align-items: center; gap: 10px; }
.scr-tree :deep(.scr-tree-icon) { font-size: 14px; flex-shrink: 0; }
.scr-tree :deep(.scr-tree-icon-enterprise) { color: #1677ff; }
.scr-tree :deep(.scr-tree-icon-organization) { color: #722ed1; }
.scr-tree :deep(.scr-tree-icon-store) { color: #fa8c16; }
.scr-tree :deep(.scr-tree-title) { font-size: 13px; }
.scr-content { flex: 1; padding: 16px 24px; overflow-y: auto; }
.scr-filters { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.scr-table-wrap { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.scr-text-ellipsis { display: inline-block; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.scr-qualified { color: #52c41a; font-weight: 600; }
.scr-unqualified { color: #ff4d4f; font-weight: 600; }
.scr-unqualified.zero { color: #bbb; font-weight: 400; }
.scr-issue-link { color: #fa8c16; }
.scr-empty { padding: 80px 0; }

/* ============================================ */
/* 记录详情 Drawer 样式                         */
/* ============================================ */

/* 分区 */
.detail-section { margin-bottom: 4px; }
.detail-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.detail-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3353;
  position: relative;
  padding-left: 10px;
}
.detail-section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background: #1677ff;
  border-radius: 2px;
}
.detail-section-count {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

/* ======== 基本信息网格 ======== */
.detail-info-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.info-item {
  display: flex;
  align-items: center;
  min-height: 40px;
  border-bottom: 1px solid #e8e8e8;
}
.info-item:last-child {
  border-bottom: none;
}
.info-item:nth-child(odd) {
  background: #fafbfc;
}
.info-item:nth-child(even) {
  background: #fff;
}
.info-label {
  flex-shrink: 0;
  width: 80px;
  padding: 10px 12px;
  font-size: 13px;
  color: #5a6d8a;
  font-weight: 500;
  background: #f0f5ff;
  border-right: 1px solid #dce3f0;
  white-space: nowrap;
  align-self: stretch;
  display: flex;
  align-items: center;
}
.info-value {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
  color: #1a3353;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-time-icon {
  color: #bbb;
  font-size: 12px;
  margin-right: 5px;
  flex-shrink: 0;
  vertical-align: -1px;
}

/* ======== 检查项卡片（通用） ======== */
.detail-tabs { margin-bottom: 12px; }
.detail-tabs :deep(.ant-tabs-nav) { margin-bottom: 8px; }

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-item-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px 16px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.detail-item-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-color: #d9d9d9;
}

/* 合格卡片 */
.card-pass {
  border-left: 3px solid #52c41a;
}
/* 不合格卡片 */
.card-fail {
  border-left: 3px solid #ff4d4f;
  background: #fffbfb;
}

/* 卡片头部 */
.item-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.item-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.item-card-status-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.icon-pass { color: #52c41a; }
.icon-fail { color: #ff4d4f; }
.item-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-card-tag {
  font-size: 12px;
  border-radius: 6px;
  padding: 0 8px;
  line-height: 22px;
  flex-shrink: 0;
}

/* 元信息行 */
.item-card-meta {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.6;
}
.meta-label {
  flex-shrink: 0;
  color: #8c8c8c;
  margin-right: 8px;
}
.meta-value {
  color: #434343;
  word-break: break-all;
}
.meta-empty { color: #bbb; }

/* 截图区域（仅不合格项） */
.item-card-shots {
  margin-bottom: 6px;
}
.shots-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
}
.shots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.shot-thumb {
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.shot-thumb:hover {
  transform: scale(1.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.shot-thumb :deep(.ant-image-img) {
  border-radius: 6px;
  object-fit: cover;
}
.shot-placeholder {
  width: 80px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e6e9ef 0%, #dce0e8 100%);
  color: #8c8c8c;
  font-size: 18px;
  gap: 2px;
  border-radius: 6px;
}
.shot-placeholder-std {
  background: linear-gradient(135deg, #e6f4ff 0%, #d6e8ff 100%);
  color: #1677ff;
}
.shot-index {
  font-size: 10px;
  color: #999;
}
.shot-placeholder-std .shot-index {
  color: #1677ff;
}

/* ======== 查看标准（折叠） ======== */
.item-card-standard { margin-top: 2px; }
.standard-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #1677ff;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
  user-select: none;
}
.standard-toggle:hover { color: #4096ff; }
.standard-arrow {
  font-size: 10px;
  transition: transform 0.25s ease;
}
.standard-arrow.rotated { transform: rotate(90deg); }

.standard-content {
  margin-top: 8px;
  padding: 12px 14px;
  background: #f7f9fc;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
}
.standard-context {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
}
.standard-context:last-of-type { margin-bottom: 0; }
.standard-ctx-label {
  flex-shrink: 0;
  width: 52px;
  color: #8c8c8c;
}
.standard-ctx-value {
  color: #434343;
  font-weight: 500;
}
.standard-requirement {
  font-size: 13px;
  line-height: 1.7;
}
.standard-req-label {
  display: block;
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 4px;
}
.standard-req-text {
  color: #434343;
}
.standard-images-section { margin-top: 10px; }
.standard-images-label {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #1677ff;
  margin-bottom: 8px;
  font-weight: 500;
}

/* ======== 关联问题单 ======== */
.issue-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 10px 14px;
}
.issue-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.issue-tag {
  font-size: 12px;
  border-radius: 6px;
}
.issue-status-text {
  font-size: 12px;
  color: #8c8c8c;
}
.issue-link {
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.issue-link:hover { color: #4096ff; }
</style>
