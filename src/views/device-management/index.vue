<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'antdv-next'
import {
  SearchOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined,
  ExclamationCircleOutlined, EnvironmentOutlined, DownloadOutlined, UploadOutlined,
} from '@antdv-next/icons'
import type { TableColumnsType } from 'antdv-next'
import type { DevicePackageInfo, CloudStoragePackage, AIAlgorithmPackage } from '@/types'

// ==========================================
// 类型定义
// ==========================================
interface DeviceItem {
  id: string
  name: string
  license: string
  deviceType: string
  deviceModel: string
  firmwareVersion: string
  sdkVersion: string
  orgPath: string[]
  orgPathLabel: string
  status: 'online' | 'offline' | 'sleep'
  location: string
  platform: string
}

interface OrgTreeNode {
  key: string
  title: string
  children?: OrgTreeNode[]
}

// ==========================================
// Mock 组织架构树
// ==========================================
const rawOrgTree: OrgTreeNode[] = [
  {
    key: 'root', title: '鹤梦信息大中华区',
    children: [
      {
        key: 'huadong', title: '华东大区',
        children: [
          {
            key: 'js', title: '江苏省',
            children: [
              { key: 'nj', title: '南京市',
                children: [
                  { key: 'xb', title: '新街口商圈',
                    children: [
                      { key: 'xb-wanda', title: '万达苏宁旗舰店' },
                      { key: 'xb-taiyang', title: '21世纪太阳城' },
                    ]
                  },
                  { key: 'qb', title: '桥北商圈',
                    children: [
                      { key: 'qb-wanda', title: '桥北万象城' },
                      { key: 'qb-hongyang', title: '弘扬广场' },
                    ]
                  },
                ]
              },
              { key: 'sz', title: '苏州市',
                children: [
                  { key: 'sz-gusu', title: '姑苏区',
                    children: [
                      { key: 'sz-gusu-meiluo', title: '美罗商城' },
                    ]
                  },
                ]
              },
            ]
          },
          {
            key: 'sh', title: '上海市',
            children: [
              { key: 'sh-pudong', title: '浦东新区',
                children: [
                  { key: 'sh-lujiazui', title: '陆家嘴商圈',
                    children: [
                      { key: 'sh-guoji', title: '上海国际中心' },
                    ]
                  },
                ]
              },
            ]
          },
        ],
      },
      {
        key: 'huabei', title: '华北大区',
        children: [
          {
            key: 'bj', title: '北京市',
            children: [
              { key: 'bj-chaoyang', title: '朝阳区',
                children: [
                  { key: 'bj-guomao', title: '国贸商圈',
                    children: [
                      { key: 'bj-guomao-yintai', title: '银泰中心' },
                    ]
                  },
                ]
              },
            ]
          },
        ],
      },
      {
        key: 'huanan', title: '华南大区',
        children: [
          {
            key: 'gd', title: '广东省',
            children: [
              { key: 'gz', title: '广州市',
                children: [
                  { key: 'gz-tianhe', title: '天河商圈',
                    children: [
                      { key: 'gz-taiKoo', title: '太古汇' },
                    ]
                  },
                ]
              },
              { key: 'sz_city', title: '深圳市',
                children: [
                  { key: 'sz-nanshan', title: '南山区',
                    children: [
                      { key: 'sz-wanxiang', title: '万象天地' },
                    ]
                  },
                ]
              },
            ]
          },
        ],
      },
    ],
  },
]

// ==========================================
// Mock 设备数据
// ==========================================
const mockDevices: DeviceItem[] = [
  { id: 'd1', name: 'xx相机-南门入口', license: 'LIC-2024-A001', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0493', platform: '海康威视' },
  { id: 'd2', name: 'xx相机-北门入口', license: 'LIC-2024-A002', deviceType: 'AI摄像机', deviceModel: 'DS-2CD7A46G0/P-IZHS', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0498', platform: '海康威视' },
  { id: 'd3', name: 'xx相机-收银台', license: 'LIC-2024-A003', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'offline', location: '118.7453, 32.1021', platform: '海康威视' },
  { id: 'd4', name: 'xx相机-仓库后门', license: 'LIC-2024-A004', deviceType: '低功耗摄像机', deviceModel: 'CS-C1HC-1D1WFR', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'sleep', location: '118.7456, 32.1025', platform: '萤石' },
  { id: 'd5', name: 'xx相机-大厅全景', license: 'LIC-2024-A005', deviceType: 'AI摄像机', deviceModel: 'DS-2CD7A46G0/P-IZHS', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-taiyang'], orgPathLabel: '华东/江苏/南京/新街口商圈/21世纪太阳城', status: 'online', location: '118.7831, 32.0487', platform: '海康威视' },
  { id: 'd6', name: 'xx相机-停车场入口', license: 'LIC-2024-A006', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','sz','sz-gusu','sz-gusu-meiluo'], orgPathLabel: '华东/江苏/苏州/姑苏区/美罗商城', status: 'online', location: '120.6154, 31.2989', platform: '海康威视' },
  { id: 'd7', name: 'xx相机-东门监控', license: 'LIC-2024-A007', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','sh','sh-pudong','sh-lujiazui','sh-guoji'], orgPathLabel: '华东/上海/浦东新区/陆家嘴商圈/上海国际中心', status: 'offline', location: '121.5023, 31.2361', platform: '海康威视' },
  { id: 'd8', name: 'xx相机-正门大厅', license: 'LIC-2024-A008', deviceType: 'AI摄像机', deviceModel: 'DS-2CD7A46G0/P-IZHS', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'online', location: '116.4605, 39.9092', platform: '海康威视' },
  { id: 'd9', name: 'xx相机-侧门通道', license: 'LIC-2024-A009', deviceType: '低功耗摄像机', deviceModel: 'CS-C1HC-1D1WFR', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'sleep', location: '116.4608, 39.9095', platform: '萤石' },
  { id: 'd10', name: 'xx相机-1楼中庭', license: 'LIC-2024-A010', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','gz','gz-tianhe','gz-taiKoo'], orgPathLabel: '华南/广东/广州/天河商圈/太古汇', status: 'online', location: '113.3233, 23.1291', platform: '海康威视' },
  { id: 'd11', name: 'xx相机-B1车库', license: 'LIC-2024-A011', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'offline', location: '113.9526, 22.5176', platform: '海康威视' },
  { id: 'd12', name: 'xx相机-二楼走廊', license: 'LIC-2024-A012', deviceType: 'AI摄像机', deviceModel: 'DS-2CD7A46G0/P-IZHS', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'online', location: '113.9528, 22.5180', platform: '海康威视' },
  { id: 'd13', name: 'xx相机-消防通道A', license: 'LIC-2024-A013', deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','qb','qb-hongyang'], orgPathLabel: '华东/江苏/南京/桥北商圈/弘扬广场', status: 'online', location: '118.7421, 32.0987', platform: '海康威视' },
]

// ==========================================
// Mock 设备套餐数据
// ==========================================
const mockDevicePackages: Record<string, DevicePackageInfo> = {
  d1: { deviceId: 'd1', cloudStorage: { id: 'cs1', name: '7天云存储', storageDays: 7, recordingMode: 'event', status: 'active', activatedAt: '2025-12-01', expiredAt: '2026-12-01', price: 299 }, aiAlgorithm: { id: 'aip1', name: '基础AI巡检包', algorithmIds: ['alg1','alg2','alg3'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测'], status: 'active', activatedAt: '2025-12-01', expiredAt: '2026-12-01', price: 599 } },
  d2: { deviceId: 'd2', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'active', activatedAt: '2026-01-15', expiredAt: '2027-01-15', price: 699 }, aiAlgorithm: { id: 'aip2', name: '高级AI巡检包', algorithmIds: ['alg1','alg2','alg3','alg4','alg5','alg6'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测','灭火器在位检测','灯光设备状态检测','卫生死角识别'], status: 'active', activatedAt: '2026-01-15', expiredAt: '2027-01-15', price: 1299 } },
  d3: { deviceId: 'd3', cloudStorage: { id: 'cs1', name: '7天云存储', storageDays: 7, recordingMode: 'event', status: 'pending', activatedAt: '2026-07-20', expiredAt: '2027-07-20', price: 299 }, aiAlgorithm: null },
  d4: { deviceId: 'd4', cloudStorage: null, aiAlgorithm: { id: 'aip1', name: '基础AI巡检包', algorithmIds: ['alg1','alg2'], algorithmNames: ['地面整洁度识别','物品摆放规范检测'], status: 'active', activatedAt: '2025-08-20', expiredAt: '2026-08-20', price: 599 } },
  d5: { deviceId: 'd5', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'active', activatedAt: '2026-03-01', expiredAt: '2027-03-01', price: 699 }, aiAlgorithm: { id: 'aip1', name: '基础AI巡检包', algorithmIds: ['alg4','alg5'], algorithmNames: ['灭火器在位检测','灯光设备状态检测'], status: 'active', activatedAt: '2026-03-01', expiredAt: '2027-03-01', price: 599 } },
  d6: { deviceId: 'd6', cloudStorage: null, aiAlgorithm: null },
  d7: { deviceId: 'd7', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'expired', activatedAt: '2025-05-01', expiredAt: '2026-05-01', price: 699 }, aiAlgorithm: { id: 'aip2', name: '高级AI巡检包', algorithmIds: ['alg1','alg2','alg3','alg4','alg5','alg6'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测','灭火器在位检测','灯光设备状态检测','卫生死角识别'], status: 'expired', activatedAt: '2025-05-01', expiredAt: '2026-05-01', price: 1299 } },
  d8: { deviceId: 'd8', cloudStorage: { id: 'cs1', name: '7天云存储', storageDays: 7, recordingMode: 'event', status: 'active', activatedAt: '2026-02-10', expiredAt: '2027-02-10', price: 299 }, aiAlgorithm: null },
  d9: { deviceId: 'd9', cloudStorage: null, aiAlgorithm: { id: 'aip1', name: '基础AI巡检包', algorithmIds: ['alg1','alg6'], algorithmNames: ['地面整洁度识别','卫生死角识别'], status: 'expired', activatedAt: '2025-10-01', expiredAt: '2026-10-01', price: 599 } },
  d10: { deviceId: 'd10', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'active', activatedAt: '2026-04-15', expiredAt: '2027-04-15', price: 699 }, aiAlgorithm: { id: 'aip2', name: '高级AI巡检包', algorithmIds: ['alg1','alg2','alg3','alg4','alg5','alg6'], algorithmNames: ['地面整洁度识别','物品摆放规范检测','安全通道占用检测','灭火器在位检测','灯光设备状态检测','卫生死角识别'], status: 'active', activatedAt: '2026-04-15', expiredAt: '2027-04-15', price: 1299 } },
  d11: { deviceId: 'd11', cloudStorage: { id: 'cs1', name: '7天云存储', storageDays: 7, recordingMode: 'event', status: 'pending', activatedAt: '2026-07-22', expiredAt: '2027-07-22', price: 299 }, aiAlgorithm: { id: 'aip1', name: '基础AI巡检包', algorithmIds: ['alg1','alg2'], algorithmNames: ['地面整洁度识别','物品摆放规范检测'], status: 'active', activatedAt: '2026-05-01', expiredAt: '2027-05-01', price: 599 } },
  d12: { deviceId: 'd12', cloudStorage: null, aiAlgorithm: null },
  d13: { deviceId: 'd13', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'active', activatedAt: '2026-06-01', expiredAt: '2027-06-01', price: 699 }, aiAlgorithm: { id: 'aip2', name: '高级AI巡检包', algorithmIds: ['alg3','alg4','alg5'], algorithmNames: ['安全通道占用检测','灭火器在位检测','灯光设备状态检测'], status: 'active', activatedAt: '2026-06-01', expiredAt: '2027-06-01', price: 1299 } },
}

const pkgStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '生效中', color: 'green' },
  expired: { label: '已过期', color: 'red' },
  pending: { label: '待生效', color: 'orange' },
}

const recordingModeLabel: Record<string, string> = { event: '事件', fullDay: '全天' }

// ==========================================
// 计算每个树节点的设备总数
// ==========================================
const deviceCountByKey = computed(() => {
  const map: Record<string, number> = {}
  for (const d of mockDevices) {
    for (const k of d.orgPath) {
      map[k] = (map[k] || 0) + 1
    }
  }
  return map
})

const attachCount = (nodes: OrgTreeNode[]): OrgTreeNode[] =>
  nodes.map(n => ({
    ...n,
    title: `${n.title} (${deviceCountByKey.value[n.key] || 0})`,
    children: n.children ? attachCount(n.children) : undefined,
  }))

const orgTree = computed(() => attachCount(rawOrgTree))

// ==========================================
// 树搜索
// ==========================================
const treeSearchText = ref('')
const treeExpandedKeys = ref<string[]>(['root'])

const filterTree = (nodes: OrgTreeNode[], keyword: string): OrgTreeNode[] => {
  if (!keyword) return nodes
  const result: OrgTreeNode[] = []
  for (const node of nodes) {
    const titleMatch = node.title.includes(keyword)
    const filteredChildren = node.children ? filterTree(node.children, keyword) : []
    if (titleMatch || filteredChildren.length > 0) {
      result.push({ ...node, children: titleMatch ? node.children : filteredChildren })
    }
  }
  return result
}

const filteredOrgTree = computed(() => {
  const keyword = treeSearchText.value.trim()
  return keyword ? filterTree(rawOrgTree, keyword) : orgTree.value
})

const collectFilteredKeys = (nodes: OrgTreeNode[], keyword: string): string[] => {
  if (!keyword) return []
  const keys: string[] = []
  const walk = (ns: OrgTreeNode[]) => {
    for (const n of ns) {
      if (n.title.includes(keyword)) keys.push(n.key)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

watch(treeSearchText, (val) => {
  if (val.trim()) {
    treeExpandedKeys.value = collectFilteredKeys(rawOrgTree, val.trim())
  }
})

// ==========================================
// 树选择状态
// ==========================================
const selectedOrgKey = ref<string>('')

const onTreeSelect = (keys: string[]) => {
  selectedOrgKey.value = keys.length > 0 ? keys[0] : ''
}

const getOrgPathLabel = (key: string): string => {
  const path: string[] = []
  const find = (nodes: OrgTreeNode[], target: string, currentPath: string[]): boolean => {
    for (const n of nodes) {
      const p = [...currentPath, n.title.replace(/\s*\(\d+\)\s*/, '')]
      if (n.key === target) { path.push(...p); return true }
      if (n.children && find(n.children, target, p)) return true
    }
    return false
  }
  find(rawOrgTree, key, [])
  return path.join('/')
}

// ==========================================
// 筛选条件
// ==========================================
const filterName = ref('')
const filterLicense = ref('')
const filterStatus = ref<string>('')
const filterArea = ref<string>('')

const activeName = ref('')
const activeLicense = ref('')
const activeStatus = ref<string>('')
const activeArea = ref<string>('')

const handleSearch = () => {
  activeName.value = filterName.value
  activeLicense.value = filterLicense.value
  activeStatus.value = filterStatus.value
  activeArea.value = filterArea.value
}

const handleReset = () => {
  filterName.value = ''
  filterLicense.value = ''
  filterStatus.value = ''
  filterArea.value = ''
  activeName.value = ''
  activeLicense.value = ''
  activeStatus.value = ''
  activeArea.value = ''
  selectedOrgKey.value = ''
}

watch(filterArea, (val) => {
  if (val) { selectedOrgKey.value = val }
})

watch(selectedOrgKey, (key) => {
  if (key && filterArea.value !== key) { filterArea.value = key }
})

// ==========================================
// 设备列表计算
// ==========================================
const allDevices = ref<DeviceItem[]>([...mockDevices])

const filteredDevices = computed(() => {
  let list = allDevices.value
  if (selectedOrgKey.value && selectedOrgKey.value !== 'root') {
    list = list.filter(d => d.orgPath.includes(selectedOrgKey.value))
  }
  if (activeName.value) list = list.filter(d => d.name.includes(activeName.value))
  if (activeLicense.value) list = list.filter(d => d.license.includes(activeLicense.value))
  if (activeStatus.value) list = list.filter(d => d.status === activeStatus.value)
  if (activeArea.value && activeArea.value !== 'root') list = list.filter(d => d.orgPath.includes(activeArea.value))
  return list
})

// ==========================================
// 表格选中行
// ==========================================
const selectedRowKeys = ref<string[]>([])

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[]) => { selectedRowKeys.value = keys as string[] },
}))

// ==========================================
// 状态标签颜色
// ==========================================
const statusColor: Record<string, string> = { online: 'green', offline: 'red', sleep: 'orange' }
const statusLabel: Record<string, string> = { online: '在线', offline: '离线', sleep: '休眠中' }

// ==========================================
// 表格列
// ==========================================
const columns: TableColumnsType = [
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
  { title: 'LICENSE', dataIndex: 'license', key: 'license', width: 160 },
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 130 },
  { title: '所属组织路径', dataIndex: 'orgPathLabel', key: 'orgPathLabel', width: 260, ellipsis: true },
  { title: '设备状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' },
]

// ==========================================
// 删除弹窗
// ==========================================
const deleteVisible = ref(false)
const deleteTarget = ref<DeviceItem | null>(null)
const deleteMode = ref<'single' | 'batch'>('single')

const showDeleteSingle = (device: DeviceItem) => {
  deleteTarget.value = device; deleteMode.value = 'single'; deleteVisible.value = true
}

const showDeleteBatch = () => {
  if (selectedRowKeys.value.length === 0) { message.warning('请先选择要删除的设备'); return }
  deleteTarget.value = null; deleteMode.value = 'batch'; deleteVisible.value = true
}

const handleDeleteConfirm = () => {
  if (deleteMode.value === 'single' && deleteTarget.value) {
    allDevices.value = allDevices.value.filter(d => d.id !== deleteTarget.value!.id)
    message.success('删除成功')
  } else if (deleteMode.value === 'batch') {
    const count = selectedRowKeys.value.length
    allDevices.value = allDevices.value.filter(d => !selectedRowKeys.value.includes(d.id))
    selectedRowKeys.value = []
    message.success(`成功删除 ${count} 台设备`)
  }
  deleteVisible.value = false
}

// ==========================================
// 查看设备信息弹窗
// ==========================================
const viewVisible = ref(false)
const viewDevice = ref<DeviceItem | null>(null)
const viewPackageInfo = ref<DevicePackageInfo | null>(null)

const showView = (device: DeviceItem) => {
  viewDevice.value = device
  viewPackageInfo.value = mockDevicePackages[device.id] || { deviceId: device.id, cloudStorage: null, aiAlgorithm: null }
  viewVisible.value = true
}

// ==========================================
// 添加/编辑设备弹窗
// ==========================================
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')

interface DeviceForm {
  name: string; license: string; orgKey: string; location: string
}

const deviceForm = reactive<DeviceForm>({ name: '', license: '', orgKey: '', location: '' })
const addMode = ref<'single' | 'batch'>('single')
const formTitle = computed(() => formMode.value === 'add' ? '添加设备' : '编辑设备')
const editingDevice = ref<DeviceItem | null>(null)

const showAdd = () => {
  formMode.value = 'add'; addMode.value = 'single'
  deviceForm.name = ''; deviceForm.license = ''; deviceForm.orgKey = ''; deviceForm.location = ''
  editingDevice.value = null; formVisible.value = true
}

const showEdit = (device: DeviceItem) => {
  formMode.value = 'edit'; addMode.value = 'single'
  deviceForm.name = device.name; deviceForm.license = device.license
  deviceForm.orgKey = device.orgPath[device.orgPath.length - 1] || ''
  deviceForm.location = device.location
  editingDevice.value = device; formVisible.value = true
}

const handleFormSubmit = () => {
  if (!deviceForm.name.trim()) { message.warning('请输入设备名称'); return }
  if (deviceForm.name.trim().length < 2 || deviceForm.name.trim().length > 50) { message.warning('设备名称限制2-50个字符'); return }
  if (!deviceForm.license.trim()) { message.warning('请输入设备License'); return }
  if (formMode.value === 'add' && allDevices.value.some(d => d.license === deviceForm.license.trim())) {
    message.warning('该License已被添加，请检查'); return
  }
  if (!deviceForm.orgKey) { message.warning('请选择所属组织'); return }

  const orgLabel = getOrgPathLabel(deviceForm.orgKey)

  if (formMode.value === 'add') {
    allDevices.value.push({
      id: `d${Date.now()}`, name: deviceForm.name.trim(), license: deviceForm.license.trim(),
      deviceType: 'WIFI摄像机', deviceModel: 'DS-2CD2T47G2-L', firmwareVersion: 'v5.7.11',
      sdkVersion: 'v2.3.1', orgPath: [deviceForm.orgKey], orgPathLabel: orgLabel,
      status: 'offline', location: deviceForm.location || '', platform: '海康威视',
    })
    message.success('添加成功')
  } else if (formMode.value === 'edit' && editingDevice.value) {
    const dev = allDevices.value.find(d => d.id === editingDevice.value!.id)
    if (dev) {
      dev.name = deviceForm.name.trim(); dev.license = deviceForm.license.trim()
      dev.orgPath = [deviceForm.orgKey]; dev.orgPathLabel = orgLabel
      dev.location = deviceForm.location
    }
    message.success('编辑成功')
  }
  formVisible.value = false
}

// 上传处理
const uploadFileList = ref<any[]>([])
const handleUploadChange = (info: any) => {
  uploadFileList.value = info.fileList
  if (info.file.status === 'done') message.success('成功导入 5 条数据')
  else if (info.file.status === 'error') message.error('导入失败，请检查文件格式')
}
const beforeUpload = (file: File) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  if (!isExcel) { message.error('仅支持 .xlsx, .xls 格式文件'); return false }
  return false
}

// ==========================================
// 地图选点
// ==========================================
const mapVisible = ref(false)
const showMapPicker = () => { mapVisible.value = true }
const handleMapConfirm = () => {
  deviceForm.location = '118.7850, 32.0500'
  mapVisible.value = false; message.success('已选择位置')
}

// ==========================================
// 区域下拉选项
// ==========================================
const flattenOrg = (nodes: OrgTreeNode[]): { value: string; label: string }[] => {
  const result: { value: string; label: string }[] = []
  const walk = (ns: OrgTreeNode[], prefix: string) => {
    for (const n of ns) {
      const cleanTitle = n.title.replace(/\s*\(\d+\)\s*/, '')
      const label = prefix ? `${prefix}/${cleanTitle}` : cleanTitle
      result.push({ value: n.key, label })
      if (n.children) walk(n.children, label)
    }
  }
  walk(nodes, '')
  return result
}

const orgOptions = computed(() => flattenOrg(rawOrgTree))

const treeSelectData = computed(() => rawOrgTree.map(n => ({
  value: n.key, title: n.title.replace(/\s*\(\d+\)\s*/, ''),
  children: n.children ? convertTreeChildren(n.children) : undefined,
})))

const convertTreeChildren = (nodes: OrgTreeNode[]): any[] =>
  nodes.map(n => ({
    value: n.key, title: n.title.replace(/\s*\(\d+\)\s*/, ''),
    children: n.children ? convertTreeChildren(n.children) : undefined,
  }))

// ==========================================
// 分页
// ==========================================
const pagination = reactive({
  current: 1, pageSize: 10,
  total: computed(() => filteredDevices.value.length),
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const pagedDevices = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredDevices.value.slice(start, start + pagination.pageSize)
})

watch([activeName, activeLicense, activeStatus, activeArea, selectedOrgKey], () => {
  pagination.current = 1
})

const downloadTemplate = () => { message.success('模板下载中...') }

// ==========================================
// 功能设置抽屉
// ==========================================
const settingsVisible = ref(false)
const settingsDevice = ref<DeviceItem | null>(null)

// 每台设备的设置缓存
const deviceSettingsMap = reactive<Record<string, {
  screenMode: 'single' | 'multi'
  flipMode: 'normal' | 'invert'
  wideDynamic: boolean
  alarmEnabled: boolean
  lightMode: 'smart' | 'bw'
  statusLed: boolean
}>>({})

const getDefaultSettings = () => ({
  screenMode: 'single' as const,
  flipMode: 'normal' as const,
  wideDynamic: false,
  alarmEnabled: true,
  lightMode: 'smart' as const,
  statusLed: true,
})

const showSettings = (device: DeviceItem) => {
  settingsDevice.value = device
  if (!deviceSettingsMap[device.id]) {
    deviceSettingsMap[device.id] = getDefaultSettings()
  }
  settingsVisible.value = true
}

const currentSettings = computed(() => {
  if (!settingsDevice.value) return getDefaultSettings()
  return deviceSettingsMap[settingsDevice.value.id]
})

const handleSettingsSave = () => {
  if (settingsDevice.value?.status === 'offline') {
    message.warning('离线设备无法进行功能设置，请确认设备在线后再试')
    return
  }
  message.success(`${settingsDevice.value?.name || ''} 功能设置保存成功`)
  settingsVisible.value = false
}

// 画面设置项
const screenModeOptions = [
  { label: '单屏展示', value: 'single', desc: '仅显示单路视频画面' },
  { label: '多屏展示', value: 'multi', desc: '同时显示多路视频画面，适用于多镜头设备' },
]
const flipModeOptions = [
  { label: '正放', value: 'normal', desc: '画面保持正常方向' },
  { label: '倒放', value: 'invert', desc: '画面上下翻转180度' },
]
</script>

<template>
  <div class="dm-page">
    <!-- ==================== 左侧组织架构树 ==================== -->
    <div class="dm-sidebar">
      <div class="dm-sidebar-header">组织架构</div>
      <a-input v-model:value="treeSearchText" placeholder="搜索组织区域" class="dm-tree-search" allow-clear>
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
        class="dm-tree"
      />
    </div>

    <!-- ==================== 右侧内容区 ==================== -->
    <div class="dm-content">
      <!-- 顶部操作栏 -->
      <div class="dm-toolbar">
        <a-space :size="12" wrap>
          <a-input v-model:value="filterName" placeholder="设备名称" style="width:180px" allow-clear @pressEnter="handleSearch" />
          <a-input v-model:value="filterLicense" placeholder="License" style="width:180px" allow-clear @pressEnter="handleSearch" />
          <a-select v-model:value="filterStatus" placeholder="设备状态" style="width:140px" allow-clear>
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="online">在线</a-select-option>
            <a-select-option value="offline">离线</a-select-option>
            <a-select-option value="sleep">休眠中</a-select-option>
          </a-select>
          <a-select v-model:value="filterArea" placeholder="所选区域" style="width:200px" allow-clear show-search
            :filter-option="(input: string, option: any) => option.label.includes(input)">
            <a-select-option v-for="opt in orgOptions" :key="opt.value" :value="opt.value" :label="opt.label">
              {{ opt.label }}
            </a-select-option>
          </a-select>
          <a-button type="primary" @click="handleSearch"><template #icon><SearchOutlined /></template>查询</a-button>
          <a-button @click="handleReset"><template #icon><ReloadOutlined /></template>重置</a-button>
        </a-space>
        <a-space :size="12">
          <a-button type="primary" @click="showAdd"><template #icon><PlusOutlined /></template>添加设备</a-button>
          <a-button danger :disabled="selectedRowKeys.length === 0" @click="showDeleteBatch">
            <template #icon><DeleteOutlined /></template>批量删除
          </a-button>
        </a-space>
      </div>

      <!-- 设备列表表格 -->
      <div class="dm-table-wrap">
        <a-table
          :columns="columns"
          :data-source="pagedDevices"
          :row-key="(r: DeviceItem) => r.id"
          :row-selection="rowSelection"
          :pagination="false"
          :scroll="{ x: 1070 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor[record.status]">{{ statusLabel[record.status] }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="8">
                <a @click="showEdit(record)">编辑</a>
                <a @click="showSettings(record)">功能设置</a>
                <a @click="showView(record)">查看</a>
                <a class="dm-link-danger" @click="showDeleteSingle(record)">删除</a>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 分页 -->
      <div class="dm-pagination">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="pagination.total"
          show-size-changer
          :show-total="pagination.showTotal"
          :page-size-options="['10','20','50','100']"
        />
      </div>
    </div>

    <!-- ==================== 添加/编辑设备弹窗 ==================== -->
    <a-modal v-model:open="formVisible" :title="formTitle" width="640px" @ok="handleFormSubmit" @cancel="formVisible = false" :destroy-on-hidden="true">
      <a-form :model="deviceForm" layout="vertical" class="dm-form">
        <!-- 添加方式切换（仅添加模式） -->
        <a-form-item v-if="formMode === 'add'" label="添加方式" required>
          <a-radio-group v-model:value="addMode">
            <a-radio value="single">单个添加</a-radio>
            <a-radio value="batch">批量添加</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 单个添加 / 编辑 -->
        <template v-if="addMode === 'single' || formMode === 'edit'">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="设备名称" required>
                <a-input v-model:value="deviceForm.name" placeholder="请输入设备名称（2-50字符）" :maxlength="50" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="设备License" required>
                <a-input v-model:value="deviceForm.license" placeholder="请输入设备License" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="所属组织" required>
            <a-tree-select
              v-model:value="deviceForm.orgKey"
              :tree-data="treeSelectData"
              placeholder="请选择设备归属的组织节点"
              style="width:100%"
              :field-names="{ children:'children', label:'title', value:'value' }"
              tree-default-expand-all
            />
          </a-form-item>

          <!-- 编辑模式：详细位置 -->
          <a-row v-if="formMode === 'edit'" :gutter="16">
            <a-col :span="12">
              <a-form-item label="详细位置">
                <a-input v-model:value="deviceForm.location" placeholder="经纬度坐标">
                  <template #suffix><EnvironmentOutlined class="dm-map-icon" @click="showMapPicker" title="地图选点" /></template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label=" "><a @click="showMapPicker" class="dm-map-link"><EnvironmentOutlined /> 地图选点</a></a-form-item>
            </a-col>
          </a-row>

          <!-- 编辑模式只读字段 -->
          <template v-if="formMode === 'edit' && editingDevice">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="设备类型">
                  <a-input :value="editingDevice.deviceType" disabled style="background:#f5f5f5" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="设备型号">
                  <a-input :value="editingDevice.deviceModel" disabled style="background:#f5f5f5" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="固件版本">
                  <a-input :value="editingDevice.firmwareVersion" disabled style="background:#f5f5f5" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="SDK版本">
                  <a-input :value="editingDevice.sdkVersion" disabled style="background:#f5f5f5" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>
        </template>

        <!-- 批量添加 -->
        <template v-if="addMode === 'batch' && formMode === 'add'">
          <a-form-item label="上传设备">
            <div class="dm-upload-area">
              <p class="dm-upload-desc">
                请按照模板格式填写设备信息后上传，
                <a @click="downloadTemplate" class="dm-link-primary"><DownloadOutlined /> 下载导入模板</a>
              </p>
              <a-upload-dragger v-model:fileList="uploadFileList" name="file" :multiple="false" :before-upload="beforeUpload" @change="handleUploadChange">
                <p class="ant-upload-drag-icon"><UploadOutlined style="font-size:36px;color:#1890ff" /></p>
                <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p class="ant-upload-hint">支持 .xlsx, .xls 格式</p>
              </a-upload-dragger>
            </div>
          </a-form-item>
          <a-form-item label="所属组织" required>
            <a-tree-select
              v-model:value="deviceForm.orgKey"
              :tree-data="treeSelectData"
              placeholder="请选择设备归属的组织节点"
              style="width:100%"
              :field-names="{ children:'children', label:'title', value:'value' }"
              tree-default-expand-all
            />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- ==================== 确认删除弹窗 ==================== -->
    <a-modal v-model:open="deleteVisible" title="确认删除所选设备？" width="440px" @ok="handleDeleteConfirm" @cancel="deleteVisible = false" :ok-button-props="{ danger: true }" ok-text="继续" cancel-text="取消">
      <div class="dm-delete-body">
        <a-flex align="flex-start" :gap="12">
          <ExclamationCircleOutlined style="font-size:22px;color:#faad14" />
          <p class="dm-delete-text">删除后，所选设备将从你的企业下消失，您将无法控制并观看该设备，是否继续？</p>
        </a-flex>
      </div>
    </a-modal>

    <!-- ==================== 查看设备信息弹窗（含套餐详情） ==================== -->
    <a-modal v-model:open="viewVisible" title="查看设备信息" width="720px" :footer="null" @cancel="viewVisible = false">
      <template v-if="viewDevice">
        <a-descriptions :column="2" bordered size="middle">
          <a-descriptions-item label="设备名称">{{ viewDevice.name }}</a-descriptions-item>
          <a-descriptions-item label="设备License">{{ viewDevice.license }}</a-descriptions-item>
          <a-descriptions-item label="所属组织架构" :span="2">{{ viewDevice.orgPathLabel }}</a-descriptions-item>
          <a-descriptions-item label="详细位置">{{ viewDevice.location || '—' }}</a-descriptions-item>
          <a-descriptions-item label="设备类型">{{ viewDevice.deviceType }}</a-descriptions-item>
          <a-descriptions-item label="设备型号">{{ viewDevice.deviceModel }}</a-descriptions-item>
          <a-descriptions-item label="固件版本">{{ viewDevice.firmwareVersion }}</a-descriptions-item>
          <a-descriptions-item label="SDK版本">{{ viewDevice.sdkVersion }}</a-descriptions-item>
        </a-descriptions>

        <!-- 套餐信息：仅展示生效中或待生效的套餐 -->
        <template v-if="(viewPackageInfo?.cloudStorage && (viewPackageInfo.cloudStorage.status === 'active' || viewPackageInfo.cloudStorage.status === 'pending')) || (viewPackageInfo?.aiAlgorithm && (viewPackageInfo.aiAlgorithm.status === 'active' || viewPackageInfo.aiAlgorithm.status === 'pending'))">
        <a-divider orientation="center" style="font-size:13px;font-weight:600;color:#1677ff;margin:16px 0 12px">套餐信息</a-divider>

        <!-- 云存储套餐 -->
        <a-card v-if="viewPackageInfo?.cloudStorage && (viewPackageInfo.cloudStorage.status === 'active' || viewPackageInfo.cloudStorage.status === 'pending')" title="云存储套餐" size="small" class="dm-view-package-card" variant="outlined">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="套餐名称">
              <span class="dm-package-name">{{ viewPackageInfo.cloudStorage.name }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="套餐状态">
              <a-tag :color="pkgStatusMap[viewPackageInfo.cloudStorage.status]?.color">
                {{ pkgStatusMap[viewPackageInfo.cloudStorage.status]?.label }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="存储天数">{{ viewPackageInfo.cloudStorage.storageDays }} 天</a-descriptions-item>
            <a-descriptions-item label="录制模式">{{ recordingModeLabel[viewPackageInfo.cloudStorage.recordingMode] || viewPackageInfo.cloudStorage.recordingMode }}</a-descriptions-item>
            <a-descriptions-item label="开通时间">{{ viewPackageInfo.cloudStorage.activatedAt }}</a-descriptions-item>
            <a-descriptions-item label="到期时间">{{ viewPackageInfo.cloudStorage.expiredAt }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- AI算法套餐 -->
        <a-card v-if="viewPackageInfo?.aiAlgorithm && (viewPackageInfo.aiAlgorithm.status === 'active' || viewPackageInfo.aiAlgorithm.status === 'pending')" title="AI算法套餐" size="small" class="dm-view-package-card" variant="outlined">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="套餐名称">
              <span class="dm-package-name">{{ viewPackageInfo.aiAlgorithm.name }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="套餐状态">
              <a-tag :color="pkgStatusMap[viewPackageInfo.aiAlgorithm.status]?.color">
                {{ pkgStatusMap[viewPackageInfo.aiAlgorithm.status]?.label }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="包含算法" :span="2">
              <a-space wrap :size="4">
                <a-tag v-for="(name, i) in viewPackageInfo.aiAlgorithm.algorithmNames" :key="i" color="blue">{{ name }}</a-tag>
              </a-space>
            </a-descriptions-item>
            <a-descriptions-item label="开通时间">{{ viewPackageInfo.aiAlgorithm.activatedAt }}</a-descriptions-item>
            <a-descriptions-item label="到期时间">{{ viewPackageInfo.aiAlgorithm.expiredAt }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
        </template>
      </template>
    </a-modal>

    <!-- ==================== 地图选点弹窗（模拟） ==================== -->
    <a-modal v-model:open="mapVisible" title="地图选点" width="640px" @ok="handleMapConfirm" @cancel="mapVisible = false" ok-text="确定选择" cancel-text="取消">
      <div class="dm-map-placeholder">
        <EnvironmentOutlined style="font-size:48px;color:#1890ff" />
        <p>地图选点组件（模拟）</p>
        <p class="dm-map-coords">当前坐标：{{ deviceForm.location || '未选择' }}</p>
        <p class="dm-map-hint">点击地图任意位置选择设备安装地点</p>
      </div>
    </a-modal>

    <!-- ==================== 功能设置抽屉 ==================== -->
    <a-drawer
      v-model:open="settingsVisible"
      title="功能设置"
      :size="480"
      @close="settingsVisible = false"
      :destroy-on-hidden="true"
    >
      <template v-if="settingsDevice">
        <!-- 设备信息 -->
        <div class="dm-settings-device">
          <span class="dm-settings-device-label">当前设备：</span>
          <span class="dm-settings-device-name">{{ settingsDevice.name }}</span>
          <a-tag :color="statusColor[settingsDevice.status]" class="dm-settings-device-status">
            {{ statusLabel[settingsDevice.status] }}
          </a-tag>
        </div>

        <!-- 画面设置 -->
        <a-card title="画面设置" size="small" class="dm-settings-card" variant="outlined">
          <template #extra>
            <span class="dm-settings-card-desc">配置设备画面的显示方式</span>
          </template>
          <!-- 屏幕模式 -->
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">屏幕模式</span>
              <span class="dm-settings-row-hint">选择单屏或多屏显示</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-radio-group
                v-model:value="currentSettings.screenMode"
                option-type="button"
                button-style="solid"
                size="small"
              >
                <a-radio-button
                  v-for="opt in screenModeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  <a-tooltip :title="opt.desc" placement="top">
                    <span>{{ opt.label }}</span>
                  </a-tooltip>
                </a-radio-button>
              </a-radio-group>
            </div>
          </div>
          <!-- 画面翻转 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">画面翻转</span>
              <span class="dm-settings-row-hint">控制画面是否翻转显示</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-radio-group
                v-model:value="currentSettings.flipMode"
                option-type="button"
                button-style="solid"
                size="small"
              >
                <a-radio-button
                  v-for="opt in flipModeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  <a-tooltip :title="opt.desc" placement="top">
                    <span>{{ opt.label }}</span>
                  </a-tooltip>
                </a-radio-button>
              </a-radio-group>
            </div>
          </div>
          <!-- 宽动态 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">宽动态</span>
              <span class="dm-settings-row-hint">在高对比度场景下提升画面细节</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch
                v-model:checked="currentSettings.wideDynamic"
                checked-children="开启"
                un-checked-children="关闭"
              />
            </div>
          </div>
        </a-card>

        <!-- 报警管理 -->
        <a-card title="报警管理" size="small" class="dm-settings-card" variant="outlined">
          <template #extra>
            <span class="dm-settings-card-desc">配置设备报警相关功能</span>
          </template>
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">报警设置</span>
              <span class="dm-settings-row-hint">开启后设备检测到异常将触发报警</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch
                v-model:checked="currentSettings.alarmEnabled"
                checked-children="已开启"
                un-checked-children="已关闭"
              />
            </div>
          </div>
        </a-card>

        <!-- 灯光设置 -->
        <a-card title="灯光设置" size="small" class="dm-settings-card" variant="outlined">
          <template #extra>
            <span class="dm-settings-card-desc">配置设备补光灯工作模式</span>
          </template>
          <!-- 状态指示灯 -->
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">状态指示灯</span>
              <span class="dm-settings-row-hint">开启后设备面板指示灯常亮，便于定位设备</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch
                v-model:checked="currentSettings.statusLed"
                checked-children="开启"
                un-checked-children="关闭"
              />
            </div>
          </div>
          <!-- 灯光模式 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">灯光模式</span>
              <span class="dm-settings-row-hint">选择灯光工作模式以适应不同场景</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-radio-group
                v-model:value="currentSettings.lightMode"
                option-type="button"
                button-style="solid"
                size="small"
              >
                <a-radio-button value="smart">
                  <a-tooltip title="根据环境光线自动调节灯光亮度和色温" placement="top">
                    <span>智能模式</span>
                  </a-tooltip>
                </a-radio-button>
                <a-radio-button value="bw">
                  <a-tooltip title="仅显示黑白画面，适合低照度场景" placement="top">
                    <span>黑白模式</span>
                  </a-tooltip>
                </a-radio-button>
              </a-radio-group>
            </div>
          </div>
        </a-card>
      </template>

      <!-- 底部操作 -->
      <template #footer>
        <a-space>
          <a-button @click="settingsVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSettingsSave">保存设置</a-button>
        </a-space>
      </template>
    </a-drawer>

  </div>
</template>

<style scoped>
.dm-page { display:flex; height:100%; background:#f5f7fa; }
.dm-sidebar { width:260px; flex-shrink:0; background:#fff; border-right:1px solid #f0f0f0; display:flex; flex-direction:column; overflow:hidden; }
.dm-sidebar-header { font-size:14px; font-weight:600; color:#333; padding:16px 16px 0; }
.dm-tree-search { margin:12px 16px; width:auto; }
.dm-tree { flex:1; overflow-y:auto; padding:0 8px 12px; }
.dm-tree :deep(.ant-tree-node-selected) { background:#e6f7ff !important; }
.dm-tree :deep(.ant-tree-title) { font-size:13px; }
.dm-content { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.dm-toolbar { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; padding:16px 24px; background:#fff; border-bottom:1px solid #f0f0f0; }
.dm-table-wrap { flex:1; overflow-y:auto; padding:0 24px; background:#fff; }
.dm-table-wrap :deep(.ant-table) { font-size:13px; }
.dm-table-wrap :deep(.ant-table-thead > tr > th) { background:#fafafa; font-weight:600; white-space:nowrap; }
.dm-link-danger { color:#ff4d4f !important; }
.dm-link-primary { color:#1890ff !important; }
.dm-pagination { display:flex; justify-content:flex-end; padding:16px 24px; background:#fff; border-top:1px solid #f0f0f0; }
.dm-form :deep(.ant-form-item) { margin-bottom:16px; }
.dm-map-icon { cursor:pointer; color:#1890ff; font-size:16px; }
.dm-map-link { display:inline-flex; align-items:center; gap:4px; color:#1890ff; cursor:pointer; line-height:32px; }
.dm-delete-body { padding:8px 0; }
.dm-delete-text { margin:0; color:#666; font-size:14px; line-height:1.6; }
.dm-upload-area { width:100%; }
.dm-upload-desc { font-size:13px; color:#666; margin-bottom:8px; }
.dm-map-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; height:360px; background:#f5f7fa; border:2px dashed #d9d9d9; border-radius:8px; color:#999; }
.dm-map-placeholder p { margin:8px 0 0; }
.dm-map-coords { color:#1890ff; font-weight:500; }
.dm-map-hint { font-size:12px; }

/* ==================== 功能设置抽屉 ==================== */
.dm-settings-device { display:flex; align-items:center; gap:8px; padding:12px 16px; background:#f6f8fa; border-radius:8px; margin-bottom:20px; }
.dm-settings-device-label { font-size:13px; color:#999; }
.dm-settings-device-name { font-size:14px; font-weight:600; color:#333; }
.dm-settings-device-status { margin-left:auto; }
.dm-settings-card { margin-bottom:16px; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
.dm-settings-card :deep(.ant-card-head) { background:#fafbfc; border-bottom:1px solid #f0f0f0; min-height:40px; }
.dm-settings-card :deep(.ant-card-head-title) { font-size:14px; font-weight:600; padding:10px 0; }
.dm-settings-card :deep(.ant-card-body) { padding:12px 16px; }
.dm-settings-card-desc { font-size:12px; color:#999; font-weight:400; }
.dm-settings-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; }
.dm-settings-row-label { display:flex; flex-direction:column; gap:2px; flex:1; }
.dm-settings-row-title { font-size:13px; font-weight:500; color:#333; }
.dm-settings-row-hint { font-size:12px; color:#bbb; }
.dm-settings-row-ctrl { flex-shrink:0; }

/* ==================== 查看弹窗内套餐卡片 ==================== */
.dm-view-package-card { margin-bottom:12px; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
.dm-view-package-card :deep(.ant-card-head) { background:#fafbfc; border-bottom:1px solid #f0f0f0; min-height:36px; }
.dm-view-package-card :deep(.ant-card-head-title) { font-size:13px; font-weight:600; padding:8px 0; }
.dm-view-package-card :deep(.ant-card-body) { padding:8px 12px; }
.dm-package-name { font-size:13px; font-weight:600; color:#1677ff; }
.dm-package-empty { display:flex; align-items:center; gap:6px; padding:8px 0; color:#999; font-size:13px; }
</style>
