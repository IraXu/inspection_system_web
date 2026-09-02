<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'antdv-next'
import {
  SearchOutlined, ReloadOutlined, SyncOutlined,
  ExclamationCircleOutlined,
} from '@antdv-next/icons'
import type { TableColumnsType } from 'antdv-next'

// ==========================================
// 类型定义
// ==========================================
type DevStatus = 'online' | 'offline' | 'sleep'

/** NVR 子设备（通道） */
interface ChannelItem {
  id: string
  channelNo: number
  name: string
  model: string
  protocol: string        // 接入协议：private(鹤梦云)/hik/onvif/gb28181/rtsp
  status: DevStatus
  firmwareVersion: string
  latestVersion: string
  hasUpdate: boolean       // 红点：存在可升级固件
  upgrading: boolean
}

/** 维护设备（含 NVR 及其通道） */
interface MaintDevice {
  id: string
  name: string
  license: string
  deviceType?: string       // 设备类型：摄像机 / NVR / 智能电表
  status: DevStatus
  orgPath: string[]
  orgPathLabel: string
  model: string
  firmwareVersion: string
  latestVersion: string
  hasUpdate: boolean       // 红点：存在可升级固件
  upgrading: boolean
  isNvr?: boolean
  channels?: ChannelItem[]
}

interface OrgTreeNode {
  key: string
  title: string
  count?: number
  children?: OrgTreeNode[]
}

const pkgStatusMap: Record<string, { label: string; color: string }> = {
  online: { label: '在线', color: 'green' },
  offline: { label: '离线', color: 'red' },
  sleep: { label: '休眠中', color: 'orange' },
}

// ==========================================
// Mock 组织架构树
// ==========================================
const rawOrgTree: OrgTreeNode[] = [
  {
    key: 'root', title: '鹤梦信息大中华区',
    children: [
      { key: 'huabei', title: '华北大区', children: [] },
      {
        key: 'huanan', title: '华南大区',
        children: [
          { key: 'shenzhen', title: '深圳市',
            children: [
              { key: 'sz-ft', title: '福田商圈',
                children: [
                  { key: 'sz-s1', title: 'xxx店铺a', children: [] },
                ]
              },
            ]
          },
        ]
      },
      {
        key: 'huadong', title: '华东大区',
        children: [
          { key: 'nanjing', title: '南京市',
            children: [
              { key: 'qiaobei', title: '桥北万象城', children: [] },
              { key: 'gulou', title: '鼓楼万达', children: [] },
              { key: 'jiangning', title: '江宁万达',
                children: [
                  { key: 'jn-s1', title: 'xxx店铺a', children: [] },
                  { key: 'jn-s2', title: 'xxx店铺b', children: [] },
                  { key: 'jn-s3', title: 'xxx店铺c', children: [] },
                ]
              },
            ]
          },
        ]
      },
    ],
  },
]

// ==========================================
// Mock 设备数据（含 NVR 与通道）
// ==========================================
const mockDevices: MaintDevice[] = [
  // 华南大区（默认展示区，含 NVR 演示）
  { id: 'm1', name: 'xx相机', license: 'xxxxxxxx', status: 'online', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'AJ-0801', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: false },
  { id: 'm2', name: 'xx相机', license: 'cccccccc', status: 'online', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'AJ-0808', firmwareVersion: 'V260409.5555', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
  { id: 'm3', name: 'xx相机', license: 'vvvvvvv', status: 'offline', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'ZJ-8766Y', firmwareVersion: 'V260409.6666', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
  { id: 'm4', name: 'xx相机', license: 'ttttttt', status: 'online', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'ZJ-8766Y', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: true },
  { id: 'm5', name: 'xx相机', license: 'hhhhhhh', status: 'sleep', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'ZJ-8766Y', firmwareVersion: 'V260409.7777', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
  { id: 'm6', name: 'NVR-华南机房', license: 'NVR-SZ-0001', status: 'online', orgPath: ['root','huanan','shenzhen','sz-ft','sz-s1'], orgPathLabel: '华南/深圳/福田商圈/xxx店铺a', model: 'NVR-9832N', firmwareVersion: 'V270101.1000', latestVersion: 'V270201.2000', hasUpdate: true, upgrading: false, isNvr: true,
    channels: [
      { id: 'm6-c1', channelNo: 1, name: '通道1-大门', model: 'AJ-0808', protocol: 'private', status: 'online', firmwareVersion: 'V260409.5555', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
      { id: 'm6-c2', channelNo: 2, name: '通道2-收银台', model: 'ZJ-8766Y', protocol: 'hik', status: 'online', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: false },
      { id: 'm6-c3', channelNo: 3, name: '通道3-库房', model: 'ZJ-8766Y', protocol: 'onvif', status: 'offline', firmwareVersion: 'V260409.6666', latestVersion: 'V260409.6666', hasUpdate: false, upgrading: false },
      { id: 'm6-c4', channelNo: 4, name: '通道4-后门', model: 'AJ-0801', protocol: 'private', status: 'sleep', firmwareVersion: 'V260409.7777', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
      { id: 'm6-c5', channelNo: 5, name: '通道5-机房', model: '—', protocol: 'unknown', status: 'online', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: false },
    ] },

  // 华东大区 / 南京市 / 江宁万达（NVR 演示）
  { id: 'm7', name: 'xx相机-收银台', license: 'HD-2024-001', status: 'online', orgPath: ['root','huadong','nanjing','jiangning','jn-s1'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺a', model: 'AJ-0808', firmwareVersion: 'V260409.5555', latestVersion: 'V260409.5555', hasUpdate: false, upgrading: false },
  { id: 'm8', name: 'NVR-江宁机房', license: 'NVR-JN-0002', status: 'online', orgPath: ['root','huadong','nanjing','jiangning','jn-s1'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺a', model: 'NVR-9832N', firmwareVersion: 'V270101.1000', latestVersion: 'V270201.2000', hasUpdate: true, upgrading: false, isNvr: true,
    channels: [
      { id: 'm8-c1', channelNo: 1, name: '通道1-东门', model: 'AJ-0808', protocol: 'private', status: 'online', firmwareVersion: 'V260409.5555', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
      { id: 'm8-c2', channelNo: 2, name: '通道2-停车场', model: 'ZJ-8766Y', protocol: 'gb28181', status: 'sleep', firmwareVersion: 'V260409.7777', latestVersion: 'V260409.7777', hasUpdate: false, upgrading: false },
    ] },
  { id: 'm9', name: 'xx相机-大厅', license: 'HD-2024-002', status: 'offline', orgPath: ['root','huadong','nanjing','jiangning','jn-s2'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺b', model: 'ZJ-8766Y', firmwareVersion: 'V260409.6666', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
  { id: 'm10', name: 'xx相机-库房', license: 'HD-2024-003', status: 'sleep', orgPath: ['root','huadong','nanjing','jiangning','jn-s2'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺b', model: 'AJ-0801', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: false },

  // 其他区域（充实树统计）
  { id: 'm11', name: 'xx相机-入口', license: 'HB-2024-001', status: 'online', orgPath: ['root','huabei'], orgPathLabel: '华北大区', model: 'AJ-0808', firmwareVersion: 'V260409.5555', latestVersion: 'V260909.8888', hasUpdate: true, upgrading: false },
  { id: 'm12', name: 'xx相机-东门', license: 'HB-2024-002', status: 'online', orgPath: ['root','huadong','nanjing','qiaobei'], orgPathLabel: '华东/江苏/南京/桥北万象城', model: 'ZJ-8766Y', firmwareVersion: 'V260101.1234', latestVersion: 'V260101.1234', hasUpdate: false, upgrading: false },
  { id: 'm13', name: '智能电表-总表', license: 'SN-SG-2024-0001', deviceType: '智能电表', status: 'online', orgPath: ['root','huadong','nanjing','jiangning','jn-s1'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺a', model: 'DDSU666', firmwareVersion: 'V1.0.2', latestVersion: 'V1.0.2', hasUpdate: false, upgrading: false },
  { id: 'm14', name: '智能电表-冷藏区', license: 'SN-SG-2024-0002', deviceType: '智能电表', status: 'online', orgPath: ['root','huadong','nanjing','jiangning','jn-s1'], orgPathLabel: '华东/江苏/南京/江宁万达/xxx店铺a', model: 'DTS634', firmwareVersion: 'V1.0.1', latestVersion: 'V1.0.3', hasUpdate: true, upgrading: false },
]

// ==========================================
// 树节点设备总数统计
// ==========================================
const deviceCountByKey = computed(() => {
  const map: Record<string, number> = {}
  for (const d of mockDevices) {
    for (const k of d.orgPath) map[k] = (map[k] || 0) + 1
  }
  return map
})

const attachCount = (nodes: OrgTreeNode[]): OrgTreeNode[] =>
  nodes.map(n => ({
    ...n,
    title: `${n.title}(${deviceCountByKey.value[n.key] || 0})`,
    children: n.children ? attachCount(n.children) : undefined,
  }))

const orgTree = computed(() => attachCount(rawOrgTree))

// ==========================================
// 树搜索
// ==========================================
const treeSearchText = ref('')
const treeExpandedKeys = ref<string[]>(['root', 'huanan', 'shenzhen', 'sz-ft'])

const filterTree = (nodes: OrgTreeNode[], keyword: string): OrgTreeNode[] => {
  if (!keyword) return nodes
  const result: OrgTreeNode[] = []
  for (const node of nodes) {
    const titleMatch = node.title.replace(/\s*\(\d+\)\s*/, '').includes(keyword)
    const filteredChildren = node.children ? filterTree(node.children, keyword) : []
    if (titleMatch || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children })
    }
  }
  return result
}

const filteredOrgTree = computed(() => {
  const kw = treeSearchText.value.trim()
  return kw ? filterTree(rawOrgTree, kw) : orgTree.value
})

const collectFilteredKeys = (nodes: OrgTreeNode[], keyword: string): string[] => {
  if (!keyword) return []
  const keys: string[] = []
  const walk = (ns: OrgTreeNode[]) => {
    for (const n of ns) {
      if (n.title.replace(/\s*\(\d+\)\s*/, '').includes(keyword)) keys.push(n.key)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

watch(treeSearchText, (val) => {
  treeExpandedKeys.value = val.trim() ? collectFilteredKeys(rawOrgTree, val.trim()) : ['root', 'huanan', 'shenzhen', 'sz-ft']
})

// ==========================================
// 树选择
// ==========================================
const selectedOrgKey = ref<string>('huanan')
const onTreeSelect = (keys: string[]) => {
  selectedOrgKey.value = keys.length > 0 ? keys[0] : ''
}

const getOrgPathLabel = (key: string): string => {
  const path: string[] = []
  const find = (nodes: OrgTreeNode[], target: string, cur: string[]): boolean => {
    for (const n of nodes) {
      const p = [...cur, n.title.replace(/\s*\(\d+\)\s*/, '')]
      if (n.key === target) { path.push(...p); return true }
      if (n.children && find(n.children, target, p)) return true
    }
    return false
  }
  find(rawOrgTree, key, [])
  return path.join('/')
}
void getOrgPathLabel

// ==========================================
// 筛选条件
// ==========================================
const filterLicense = ref('')
const activeLicense = ref('')

const handleSearch = () => {
  activeLicense.value = filterLicense.value.trim()
}
const handleReset = () => {
  filterLicense.value = ''
  activeLicense.value = ''
  selectedOrgKey.value = 'huanan'
}

// ==========================================
// 列表计算
// ==========================================
const filteredDevices = computed(() => {
  let list = mockDevices
  if (selectedOrgKey.value && selectedOrgKey.value !== 'root') {
    list = list.filter(d => d.orgPath.includes(selectedOrgKey.value))
  }
  if (activeLicense.value) list = list.filter(d => d.license.includes(activeLicense.value))
  return list
})

// ==========================================
// 表格列
// ==========================================
const columns: TableColumnsType = [
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
  { title: 'License', dataIndex: 'license', key: 'license', width: 150 },
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 120 },
  { title: '设备状态', key: 'status', width: 110 },
  { title: '所属组织路径', dataIndex: 'orgPathLabel', key: 'orgPathLabel', width: 220, ellipsis: true },
  { title: '设备型号', dataIndex: 'model', key: 'model', width: 110 },
  { title: '固件版本', key: 'firmware', width: 170 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
]

// ==========================================
// 升级判定
// ==========================================
/** 协议名称映射 */
const protocolLabelMap: Record<string, string> = {
  private: '鹤梦云协议',
  hik: '海康协议',
  onvif: 'ONVIF',
  gb28181: 'GB28181',
  rtsp: 'RTSP',
  unknown: '其他协议',
}

/** 协议展示名：检测不到协议时兜底为「其他协议」 */
const protocolLabel = (protocol?: string) => protocolLabelMap[protocol || 'unknown'] || '其他协议'

/** 是否可升级：存在新版本 且 在线/休眠中（离线不可下发）；子设备仅鹤梦云协议可升级 */
const canUpgrade = (d: { hasUpdate: boolean; status: DevStatus; upgrading: boolean }, protocol?: string): boolean =>
  !!d.hasUpdate && !d.upgrading && (d.status === 'online' || d.status === 'sleep') &&
  (protocol === undefined || protocol === 'private')

// ==========================================
// 版本检测
// ==========================================

/** 解析版本号：V260909.8888 -> [260909, 8888] */
const parseVersion = (v: string): number[] => v.replace(/^V/i, '').split('.').map(Number)

/** 判断版本 a 是否低于版本 b（用于比对 Current_Version < Latest_Version） */
const isLower = (a: string, b: string): boolean => {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  const len = Math.max(va.length, vb.length)
  for (let i = 0; i < len; i++) {
    const x = va[i] || 0
    const y = vb[i] || 0
    if (x !== y) return x < y
  }
  return false
}

const detectVisible = ref(false)
const detecting = ref(false)
const detectDeviceCount = computed(() => filteredDevices.value.length)
const openDetect = () => { detectVisible.value = true }

const confirmDetect = () => {
  detectVisible.value = false
  detecting.value = true
  message.success('检测任务已下发')
  // 模拟：设备上报当前版本 -> 服务器比对 Latest_Version -> 刷新红点
  setTimeout(() => {
    detecting.value = false
    let updateCount = 0
    const check = (target: { firmwareVersion: string; latestVersion: string; hasUpdate: boolean }) => {
      target.hasUpdate = isLower(target.firmwareVersion, target.latestVersion)
      if (target.hasUpdate) updateCount++
    }
    for (const d of filteredDevices.value) {
      if (d.upgrading || d.status === 'offline') continue
      check(d)
      if (d.channels) {
        for (const c of d.channels) {
          // 子设备仅鹤梦云协议参与检测
          if (c.protocol !== 'private' || c.upgrading || c.status === 'offline') continue
          check(c)
        }
      }
    }
    message.success(`检测完成，共 ${updateCount} 台设备存在可用更新`)
  }, 1200)
}

// ==========================================
// 单条升级
// ==========================================
const upgradeTarget = ref<{ device: MaintDevice; label: string } | null>(null)
const upgradeVisible = ref(false)

const showUpgrade = (device: MaintDevice) => {
  if (!canUpgrade(device)) { message.warning('该设备当前不满足升级条件'); return }
  upgradeTarget.value = { device, label: device.name }
  upgradeVisible.value = true
}

const setUpgrading = (target: MaintDevice | ChannelItem) => {
  target.upgrading = true
  // 模拟升级完成：恢复在线态、清除红点并更新版本
  setTimeout(() => {
    target.upgrading = false
    target.status = 'online'
    target.hasUpdate = false
    target.firmwareVersion = bumpVersion(target.firmwareVersion)
  }, 2500)
}

const bumpVersion = (v: string): string => {
  // V260409.5555 -> V260409.5556 简单自增演示
  const idx = v.lastIndexOf('.')
  if (idx === -1) return v
  const suffix = v.slice(idx + 1)
  const next = String(Number(suffix) + 1).padStart(suffix.length, '0')
  return v.slice(0, idx + 1) + next
}

const channelsTitle = (record: MaintDevice) =>
  `子设备列表（${record.channels?.length || 0} 路）`

const confirmUpgrade = () => {
  const t = upgradeTarget.value
  if (!t) return
  upgradeVisible.value = false
  message.success(`升级任务已成功下发：${t.label}`)
  setUpgrading(t.device)
}

// ==========================================
// 批量升级
// ==========================================
const selectedRowKeys = ref<string[]>([])
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[]) => { selectedRowKeys.value = keys as string[] },
}))

const selectedForUpgrade = computed(() =>
  filteredDevices.value.filter(d => selectedRowKeys.value.includes(d.id) && canUpgrade(d)))

const batchUpgradeVisible = ref(false)
const openBatchUpgrade = () => {
  if (selectedRowKeys.value.length === 0) { message.warning('请先勾选需要升级的设备'); return }
  if (selectedForUpgrade.value.length === 0) { message.warning('所选设备均不满足升级条件（需在线/休眠中且存在新版本）'); return }
  batchUpgradeVisible.value = true
}

const confirmBatchUpgrade = () => {
  batchUpgradeVisible.value = false
  const devs = selectedForUpgrade.value
  message.success(`升级任务已成功下发：共 ${devs.length} 台设备`)
  for (const d of devs) setUpgrading(d)
  selectedRowKeys.value = []
}
</script>

<template>
  <div class="mt-page">
    <!-- ==================== 左侧组织树 ==================== -->
    <div class="mt-sidebar">
      <a-input v-model:value="treeSearchText" placeholder="搜索" class="mt-tree-search" allow-clear>
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-tree
        :tree-data="filteredOrgTree"
        :expanded-keys="treeExpandedKeys"
        :selected-keys="selectedOrgKey ? [selectedOrgKey] : []"
        @select="onTreeSelect"
        @update:expandedKeys="(ks: string[]) => treeExpandedKeys = ks"
        :field-names="{ children: 'children', title: 'title', key: 'key' }"
        block-node
        class="mt-tree"
      />
    </div>

    <!-- ==================== 右侧内容区 ==================== -->
    <div class="mt-content">
      <!-- 顶部操作与筛选区 -->
      <div class="mt-toolbar">
        <a-space :size="12">
          <a-button type="primary" :loading="detecting" @click="openDetect">检测版本</a-button>
          <a-button type="primary" class="mt-btn-success" @click="openBatchUpgrade">批量升级</a-button>
        </a-space>
        <a-space :size="12">
          <a-input v-model:value="filterLicense" placeholder="请输入License查询" style="width:220px" allow-clear @pressEnter="handleSearch" />
          <a-button type="primary" @click="handleSearch"><template #icon><SearchOutlined /></template>查询</a-button>
          <a-button @click="handleReset"><template #icon><ReloadOutlined /></template>重置</a-button>
        </a-space>
      </div>

      <!-- 设备列表 -->
      <div class="mt-table-wrap">
        <a-table
          :columns="columns"
          :data-source="filteredDevices"
          :row-key="(r: MaintDevice) => r.id"
          :row-selection="rowSelection"
          :pagination="false"
          :scroll="{ x: 1080 }"
          :expandable="{ rowExpandable: (r: MaintDevice) => r.isNvr }"
          size="middle"
        >
          <template #expandedRowRender="{ record }">
            <div class="mt-channel-panel">
              <div class="mt-channel-header">
                <span class="mt-channel-title">{{ channelsTitle(record) }}</span>
              </div>
              <div class="mt-channel-guide">
                <ExclamationCircleOutlined /> NVR 子设备不支持在系统内升级，请前往 NVR 设备端进行固件升级。
              </div>
              <!-- 通道列表头 -->
              <div class="mt-channel-head">
                <span class="mtc-no">通道号</span>
                <span class="mtc-name">通道名称</span>
                <span class="mtc-protocol">协议</span>
                <span class="mtc-status">状态</span>
                <span class="mtc-model">设备型号</span>
                <span class="mtc-fw">固件版本</span>
              </div>
              <div v-for="ch in record.channels || []" :key="ch.id" class="mt-channel-item">
                <span class="mtc-no">CH{{ ch.channelNo }}</span>
                <span class="mtc-name">{{ ch.name }}</span>
                <span class="mtc-protocol">
                  <a-tag color="blue" style="margin:0">{{ protocolLabel(ch.protocol) }}</a-tag>
                </span>
                <span class="mtc-status">
                  <a-tag :color="pkgStatusMap[ch.status]?.color" style="margin:0">{{ pkgStatusMap[ch.status]?.label }}</a-tag>
                </span>
                <span class="mtc-model">{{ ch.model }}</span>
                <span class="mtc-fw">
                  <span v-if="ch.upgrading" class="mt-upgrading-tag"><SyncOutlined spin /> 升级中</span>
                  <span v-else class="mt-fw-wrap">
                    <span v-if="ch.hasUpdate" class="mt-red-dot"></span>
                    <a-tag :bordered="true" style="margin:0">{{ ch.hasUpdate ? ch.latestVersion : ch.firmwareVersion }}</a-tag>
                  </span>
                </span>
              </div>
            </div>
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'deviceType'">
              <span>{{ record.deviceType || (record.isNvr ? 'NVR' : '摄像机') }}</span>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="record.upgrading ? 'blue' : pkgStatusMap[record.status]?.color" style="margin:0">
                {{ record.upgrading ? '升级中' : pkgStatusMap[record.status]?.label }}
              </a-tag>
            </template>
            <template v-if="column.key === 'firmware'">
              <span class="mt-fw-wrap">
                <span v-if="record.hasUpdate" class="mt-red-dot"></span>
                <a-tag :bordered="true" style="margin:0">{{ record.hasUpdate ? record.latestVersion : record.firmwareVersion }}</a-tag>
              </span>
            </template>
            <template v-if="column.key === 'action'">
              <a v-if="canUpgrade(record)" class="mt-upgrade-link" @click="showUpgrade(record)">升级</a>
              <span v-else-if="record.upgrading" class="mt-upgrading-text"><SyncOutlined spin /> 升级中</span>
              <span v-else class="mt-upgrade-disabled">升级</span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 分页 -->
      <div class="mt-pagination">
        <a-pagination
          :total="filteredDevices.length"
          :page-size="10"
          show-size-changer
          :page-size-options="['10','20','50']"
          show-total
          style="margin-left:auto"
        />
      </div>
    </div>

    <!-- 检测版本确认弹窗 -->
    <a-modal v-model:open="detectVisible" title="固件版本检测" width="480px" @ok="confirmDetect" @cancel="detectVisible = false">
      <div class="mt-modal-body">
        <a-flex align="flex-start" :gap="12">
          <ExclamationCircleOutlined style="font-size:22px;color:#faad14" />
          <p class="mt-modal-text">是否对所属设备（{{ detectDeviceCount }} 台）进行固件版本检测？执行版本检测后，当版本存在可升级时，会有红点标记。</p>
        </a-flex>
      </div>
    </a-modal>

    <!-- 单条升级确认弹窗 -->
    <a-modal v-model:open="upgradeVisible" title="固件升级" width="480px" @ok="confirmUpgrade" @cancel="upgradeVisible = false">
      <div class="mt-modal-body">
        <a-flex align="flex-start" :gap="12">
          <ExclamationCircleOutlined style="font-size:22px;color:#faad14" />
          <p class="mt-modal-text">是否升级所选设备的固件版本？执行版本升级时，请勿对升级设备进行操作。</p>
        </a-flex>
      </div>
    </a-modal>

    <!-- 批量升级确认弹窗 -->
    <a-modal v-model:open="batchUpgradeVisible" title="批量固件升级" width="480px" @ok="confirmBatchUpgrade" @cancel="batchUpgradeVisible = false">
      <div class="mt-modal-body">
        <a-flex align="flex-start" :gap="12">
          <ExclamationCircleOutlined style="font-size:22px;color:#faad14" />
          <p class="mt-modal-text">是否升级所选 {{ selectedForUpgrade.length }} 台设备的固件版本？执行版本升级时，请勿对升级设备进行操作。</p>
        </a-flex>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.mt-page { display:flex; height:100%; background:#f5f7fa; }
.mt-sidebar { width:260px; flex-shrink:0; background:#fff; border-right:1px solid #f0f0f0; display:flex; flex-direction:column; overflow:hidden; }
.mt-tree-search { margin:12px 16px; width:auto; }
.mt-tree { flex:1; overflow-y:auto; padding:0 8px 12px; }
.mt-tree :deep(.ant-tree-node-selected) { background:#e6f7ff !important; }
.mt-tree :deep(.ant-tree-title) { font-size:13px; }
.mt-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.mt-toolbar { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:16px 24px; background:#fff; border-bottom:1px solid #f0f0f0; }
.mt-btn-success { background:#52c41a; border-color:#52c41a; }
.mt-btn-success:hover { background:#73d13d; border-color:#73d13d; }
.mt-table-wrap { flex:1; overflow-y:auto; padding:0 24px; background:#fff; }
.mt-table-wrap :deep(.ant-table) { font-size:13px; }
.mt-table-wrap :deep(.ant-table-thead > tr > th) { background:#fafafa; font-weight:600; white-space:nowrap; }
.mt-fw-wrap { display:inline-flex; align-items:center; gap:6px; }
.mt-red-dot { display:inline-block; width:10px; height:10px; border-radius:50%; background:#ff4d4f; box-shadow:0 0 0 3px rgba(255,77,79,0.18); flex-shrink:0; }
.mt-upgrade-link { color:#52c41a !important; cursor:pointer; }
.mt-upgrade-disabled { color:#bfbfbf; cursor:not-allowed; }
.mt-upgrading-text { color:#1677ff; }
.mt-upgrading-tag { display:inline-flex; align-items:center; gap:4px; color:#1677ff; font-size:12px; }
.mt-pagination { display:flex; justify-content:flex-end; padding:16px 24px; background:#fff; border-top:1px solid #f0f0f0; }
.mt-modal-body { padding:8px 0; }
.mt-modal-text { margin:0; color:#666; font-size:14px; line-height:1.8; }

/* 通道展开区域 */
.mt-channel-panel { padding:4px 12px 8px; }
.mt-channel-header { margin-bottom:8px; }
.mt-channel-title { font-size:13px; font-weight:600; color:#333; }
.mt-channel-guide { display:flex; align-items:center; gap:6px; padding:6px 12px; margin-bottom:8px; background:#fffbe6; border:1px solid #ffe58f; border-radius:6px; color:#ad6800; font-size:12px; line-height:1.5; }
.mt-channel-head, .mt-channel-item {
  display:grid;
  grid-template-columns:60px minmax(120px,1fr) 90px 90px 110px 170px;
  align-items:center;
  gap:12px;
  padding:8px 12px;
}
.mt-channel-head { font-size:12px; color:#999; font-weight:600; background:#fafbfc; border-radius:6px; }
.mt-channel-item { font-size:13px; color:#333; border-bottom:1px solid #f5f5f5; }
.mtc-no { color:#1677ff; font-weight:600; }
.mtc-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mtc-protocol, .mtc-status, .mtc-fw { display:flex; align-items:center; }
.mtc-model { color:#666; }
</style>
