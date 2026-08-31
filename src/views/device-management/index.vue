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

/** 设备能力模型（云端下发配置） */
interface DeviceCapabilities {
  screen: boolean       // 是否支持画面设置（屏幕模式、画面翻转、宽动态）
  alarm: boolean        // 是否支持事件侦测报警
  light: boolean        // 是否支持灯光设置（状态指示灯、灯光模式）
  eventTypes: string[]  // 支持的事件侦测类型，如 motion/move/human/pet/child
}

/** NVR 通道（下挂 IPC，作为可播放的最小单元） */
interface NvrChannel {
  id: string
  channelNo: number
  name: string
  deviceModel: string
  serialNo?: string
  ip?: string
  protocol?: string
  location?: string
  status: 'online' | 'offline'
}

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
  capabilities: DeviceCapabilities
  channels?: NvrChannel[]   // NVR 设备的通道列表
}

interface OrgTreeNode {
  key: string
  title: string
  children?: OrgTreeNode[]
}

/** 支持的事件侦测类型名称映射 */
const eventTypeLabels: Record<string, string> = {
  motion: '运动侦测',
  move: '移动侦测',
  human: '人形侦测',
  pet: '宠物侦测',
  child: '孩童侦测',
}

/** 事件类型对应的提示语 */
const eventTypeHints: Record<string, string> = {
  motion: '检测画面中有物体运动时触发报警',
  move: '检测画面中有物体移动时触发报警',
  human: '检测画面中有人形出现时触发报警',
  pet: '检测画面中有宠物出现时触发报警',
  child: '检测画面中有孩童出现时触发报警',
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
  { id: 'd1', name: 'xx相机-南门入口', license: 'LIC-2024-A001', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0493', platform: '海康威视', capabilities: { screen: true, alarm: true, light: false, eventTypes: ['motion'] } },
  { id: 'd2', name: 'xx相机-北门入口', license: 'LIC-2024-A002', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0498', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'human', 'pet'] } },
  { id: 'd3', name: 'xx相机-收银台', license: 'LIC-2024-A003', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'offline', location: '118.7453, 32.1021', platform: '海康威视', capabilities: { screen: true, alarm: false, light: false, eventTypes: [] } },
  { id: 'd4', name: 'xx相机-仓库后门', license: 'LIC-2024-A004', deviceType: '低功耗摄像机', deviceModel: '低功耗网络摄像机', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'sleep', location: '118.7456, 32.1025', platform: '萤石', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['move'] } },
  { id: 'd5', name: 'xx相机-大厅全景', license: 'LIC-2024-A005', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-taiyang'], orgPathLabel: '华东/江苏/南京/新街口商圈/21世纪太阳城', status: 'online', location: '118.7831, 32.0487', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'move', 'human', 'pet', 'child'] } },
  { id: 'd6', name: 'xx相机-停车场入口', license: 'LIC-2024-A006', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','sz','sz-gusu','sz-gusu-meiluo'], orgPathLabel: '华东/江苏/苏州/姑苏区/美罗商城', status: 'online', location: '120.6154, 31.2989', platform: '海康威视', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['motion', 'move'] } },
  { id: 'd7', name: 'xx相机-东门监控', license: 'LIC-2024-A007', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','sh','sh-pudong','sh-lujiazui','sh-guoji'], orgPathLabel: '华东/上海/浦东新区/陆家嘴商圈/上海国际中心', status: 'offline', location: '121.5023, 31.2361', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion'] } },
  { id: 'd8', name: 'xx相机-正门大厅', license: 'LIC-2024-A008', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'online', location: '116.4605, 39.9092', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'human', 'pet', 'child'] } },
  { id: 'd9', name: 'xx相机-侧门通道', license: 'LIC-2024-A009', deviceType: '低功耗摄像机', deviceModel: '低功耗网络摄像机', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'sleep', location: '116.4608, 39.9095', platform: '萤石', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['move', 'human'] } },
  { id: 'd10', name: 'xx相机-1楼中庭', license: 'LIC-2024-A010', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','gz','gz-tianhe','gz-taiKoo'], orgPathLabel: '华南/广东/广州/天河商圈/太古汇', status: 'online', location: '113.3233, 23.1291', platform: '海康威视', capabilities: { screen: true, alarm: false, light: false, eventTypes: [] } },
  { id: 'd11', name: 'xx相机-B1车库', license: 'LIC-2024-A011', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'offline', location: '113.9526, 22.5176', platform: '海康威视', capabilities: { screen: true, alarm: true, light: false, eventTypes: ['motion', 'move'] } },
  { id: 'd12', name: 'xx相机-二楼走廊', license: 'LIC-2024-A012', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'online', location: '113.9528, 22.5180', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'move', 'human', 'pet', 'child'] } },
  { id: 'd13', name: 'xx相机-消防通道A', license: 'LIC-2024-A013', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','qb','qb-hongyang'], orgPathLabel: '华东/江苏/南京/桥北商圈/弘扬广场', status: 'online', location: '118.7421, 32.0987', platform: '海康威视', capabilities: { screen: false, alarm: false, light: true, eventTypes: [] } },
  { id: 'd14', name: 'NVR-新街口机房', license: 'LIC-2024-N014', deviceType: 'NVR', deviceModel: '网络硬盘录像机', firmwareVersion: 'v4.60.10', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0493', platform: '海康威视', capabilities: { screen: false, alarm: false, light: false, eventTypes: [] },
    channels: [
      { id: 'd14-c1', channelNo: 1, name: '通道1-大门', deviceModel: '高清网络枪机', serialNo: 'C20702456', ip: '192.168.1.64', protocol: 'private', location: '118.7842, 32.0493', status: 'online' },
      { id: 'd14-c2', channelNo: 2, name: '通道2-收银台', deviceModel: 'AI智能摄像机', serialNo: 'C20702457', ip: '192.168.1.65', protocol: 'hik', location: '118.7845, 32.0495', status: 'online' },
      { id: 'd14-c3', channelNo: 3, name: '通道3-库房', deviceModel: '高清网络枪机', serialNo: 'C20702458', ip: '192.168.1.66', protocol: 'onvif', status: 'offline' },
      { id: 'd14-c4', channelNo: 4, name: '通道4-后门', deviceModel: '高清半球摄像机', serialNo: 'GB28181-2231', ip: '192.168.1.67', protocol: 'gb28181', status: 'online' },
      { id: 'd14-c5', channelNo: 5, name: '通道5-机房', deviceModel: '—', serialNo: '', ip: '', protocol: 'unknown', status: 'online' },
    ] },
  { id: 'd15', name: 'NVR-万象天地机房', license: 'LIC-2024-N015', deviceType: 'NVR', deviceModel: '网络硬盘录像机', firmwareVersion: 'v4.60.10', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'online', location: '113.9526, 22.5176', platform: '海康威视', capabilities: { screen: false, alarm: false, light: false, eventTypes: [] },
    channels: [
      { id: 'd15-c1', channelNo: 1, name: '通道1-东门', deviceModel: '高清网络枪机', serialNo: 'C20800112', ip: '192.168.1.64', protocol: 'hik', status: 'online' },
      { id: 'd15-c2', channelNo: 2, name: '通道2-停车场', deviceModel: '4K云台球机', serialNo: 'RTSP-5567-9A12', ip: '192.168.1.65', protocol: 'rtsp', status: 'offline' },
    ] },
  { id: 'd16', name: '智能电表-总表', license: 'SN-SG-2024-0001', deviceType: '智能电表', deviceModel: 'DDSU666', firmwareVersion: 'v1.0.2', sdkVersion: '—', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0493', platform: '正泰', capabilities: { screen: false, alarm: false, light: false, eventTypes: [] } },
  { id: 'd17', name: '智能电表-冷藏区', license: 'SN-SG-2024-0002', deviceType: '智能电表', deviceModel: 'DTS634', firmwareVersion: 'v1.0.2', sdkVersion: '—', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0493', platform: '安科瑞', capabilities: { screen: false, alarm: false, light: false, eventTypes: [] } },
  { id: 'd18', name: '智能电表-总表', license: 'SN-SG-2024-0003', deviceType: '智能电表', deviceModel: 'DDSU666', firmwareVersion: 'v1.0.1', sdkVersion: '—', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'offline', location: '113.9526, 22.5176', platform: '正泰', capabilities: { screen: false, alarm: false, light: false, eventTypes: [] } },
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
  d14: { deviceId: 'd14', cloudStorage: { id: 'cs2', name: '30天云存储', storageDays: 30, recordingMode: 'fullDay', status: 'active', activatedAt: '2026-05-01', expiredAt: '2027-05-01', price: 699 }, aiAlgorithm: null },
  d15: { deviceId: 'd15', cloudStorage: null, aiAlgorithm: null },
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
// NVR 设备排在最前，便于演示（第一页即可看到 NVR 及其通道）
const allDevices = ref<DeviceItem[]>([...mockDevices].sort((a, b) => (a.deviceType === 'NVR' ? -1 : 1) - (b.deviceType === 'NVR' ? -1 : 1)))

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
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 150 },
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

// 模拟云端根据 License 自动识别设备类型（实际由后端识别并返回）
const detectDeviceTypeByLicense = (license: string): 'NVR' | 'WIFI摄像机' => {
  const upper = license.toUpperCase()
  if (upper.includes('NVR') || /-N\d/.test(upper)) return 'NVR'
  return 'WIFI摄像机'
}

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
    const isNvr = detectDeviceTypeByLicense(deviceForm.license.trim()) === 'NVR'
    allDevices.value.push({
      id: `d${Date.now()}`, name: deviceForm.name.trim(), license: deviceForm.license.trim(),
      deviceType: isNvr ? 'NVR' : 'WIFI摄像机',
      deviceModel: isNvr ? '网络硬盘录像机' : '高清网络枪机',
      firmwareVersion: isNvr ? 'v4.60.10' : 'v5.7.11',
      sdkVersion: 'v2.3.1', orgPath: [deviceForm.orgKey], orgPathLabel: orgLabel,
      status: 'offline', location: deviceForm.location || '', platform: '海康威视',
      capabilities: { screen: !isNvr, alarm: false, light: false, eventTypes: [] },
      ...(isNvr ? { channels: [] } : {}),
    })
    message.success(isNvr ? '添加成功，已自动识别为 NVR 设备' : '添加成功')
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

// ==========================================
// NVR 添加子设备（自动搜索检测 → 勾选 → 通道分配/认证）
// ==========================================
interface DetectedCamera {
  id: string
  serialNo: string
  ip: string
  model: string
  protocol: 'private' | 'hik' | 'onvif' | 'gb28181' | 'rtsp' | 'unknown'
  needsAuth: boolean      // onvif / 其他协议需输入用户名密码
  selected: boolean
  channelNo: number
  name?: string
  location?: string
  username: string
  password: string
  authError?: string
}

// 协议名称映射
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

const subDeviceModalVisible = ref(false)
const subDeviceStep = ref<1 | 2>(1)
const subDeviceTargetNvr = ref<DeviceItem | null>(null)
const detecting = ref(false)
const detectError = ref(false)
const detectedCameras = ref<DetectedCamera[]>([])

// 模拟 NVR 扫描到的、已通过网线连接的摄像头
const mockDetectedCameras: DetectedCamera[] = [
  { id: 'det-1', serialNo: 'C20702461', ip: '192.168.1.64', model: '高清网络枪机', protocol: 'private', needsAuth: false, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-2', serialNo: 'C20702462', ip: '192.168.1.65', model: 'AI智能摄像机', protocol: 'private', needsAuth: false, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-3', serialNo: 'C20702463', ip: '192.168.1.66', model: '高清网络枪机', protocol: 'hik', needsAuth: false, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-4', serialNo: 'ONVIF-8842-9F31', ip: '192.168.1.67', model: '4K云台球机', protocol: 'onvif', needsAuth: true, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-5', serialNo: 'GB28181-1023', ip: '192.168.1.68', model: '高清半球摄像机', protocol: 'gb28181', needsAuth: true, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-6', serialNo: 'RTSP-5567-9A12', ip: '192.168.1.69', model: '4K云台球机', protocol: 'rtsp', needsAuth: true, selected: false, channelNo: 0, username: '', password: '' },
  { id: 'det-7', serialNo: '', ip: '192.168.1.70', model: '未知型号', protocol: 'unknown', needsAuth: false, selected: false, channelNo: 0, username: '', password: '' },
]

const selectedCameras = computed(() => detectedCameras.value.filter(c => c.selected))

const runDetect = () => {
  detecting.value = true
  detectError.value = false
  detectedCameras.value = []
  setTimeout(() => {
    // 模拟搜索：小概率失败，演示搜索异常兜底（实际由 NVR SDK 返回结果）
    if (Math.random() < 0.15) {
      detecting.value = false
      detectError.value = true
      return
    }
    const nvr = subDeviceTargetNvr.value
    const existingSns = new Set((nvr?.channels || []).map(c => c.serialNo).filter(Boolean))
    detectedCameras.value = mockDetectedCameras
      .filter(c => !c.serialNo || !existingSns.has(c.serialNo))
      .map(c => ({ ...c, selected: false, channelNo: 0, name: '', location: '', username: '', password: '' }))
    detecting.value = false
  }, 800)
}

const showAddSubDevice = (nvr: DeviceItem) => {
  if (nvr.status === 'offline') {
    message.warning('NVR 已离线，无法搜索子设备，请确认设备在线后再试')
    return
  }
  subDeviceTargetNvr.value = nvr
  subDeviceStep.value = 1
  subDeviceModalVisible.value = true
  runDetect()
}

const rescanSubDevices = () => { runDetect() }

const goToChannelAssign = () => {
  if (selectedCameras.value.length === 0) { message.warning('请至少勾选一台设备'); return }
  const nvr = subDeviceTargetNvr.value
  let nextNo = (nvr?.channels?.length ? Math.max(...nvr.channels.map(c => c.channelNo)) : 0) + 1
  for (const cam of selectedCameras.value) {
    cam.channelNo = nextNo++
    if (!cam.name) cam.name = `${cam.channelNo}-智能设备`
  }
  subDeviceStep.value = 2
}

const confirmAddSubDevice = () => {
  const nvr = subDeviceTargetNvr.value
  if (!nvr) return
  const existingNos = new Set((nvr.channels || []).map(c => c.channelNo))
  const okList: DetectedCamera[] = []
  const failList: string[] = []
  let authFailed = false

  for (const cam of selectedCameras.value) {
    if (cam.needsAuth && (!cam.username.trim() || !cam.password.trim())) {
      message.warning(`请为通道 CH${cam.channelNo} 填写用户名和密码`); return
    }
    if (!cam.name || !cam.name.trim()) {
      message.warning('请填写通道名称'); return
    }
    if (existingNos.has(cam.channelNo)) {
      message.warning(`通道号 CH${cam.channelNo} 已被占用，请调整`); return
    }
    cam.authError = ''
    // 模拟认证：需认证设备校验凭证（原型以「用户名与密码相同」模拟错误，真实场景由设备端校验）
    if (cam.needsAuth && cam.username.trim() === cam.password.trim()) {
      cam.authError = '用户名或密码错误，认证不通过'
      authFailed = true
      continue
    }
    existingNos.add(cam.channelNo)
    // 模拟添加失败：序列号为空（无法建立有效连接）的设备添加失败
    if (!cam.serialNo) {
      failList.push(cam.model || '未知设备')
      continue
    }
    okList.push(cam)
  }

  if (authFailed) {
    message.error('部分设备认证不通过，请检查用户名和密码后重试')
    return
  }

  if (!nvr.channels) nvr.channels = []
  for (const cam of okList) {
    nvr.channels.push({
      id: `ch-${Date.now()}-${cam.id}`,
      channelNo: cam.channelNo,
      name: cam.name!.trim(),
      deviceModel: cam.model,
      serialNo: cam.serialNo,
      ip: cam.ip,
      protocol: cam.protocol,
      location: cam.location?.trim() || '',
      status: 'online',
    })
  }

  subDeviceModalVisible.value = false
  if (failList.length === 0) {
    message.success(`成功添加 ${okList.length} 路子设备`)
  } else if (okList.length === 0) {
    message.error(`添加失败：${failList.join('、')} 未能建立连接`)
  } else {
    message.warning(`成功添加 ${okList.length} 路，${failList.length} 路失败（${failList.join('、')}）`)
  }
}

const showDeleteChannel = (nvr: DeviceItem, channel: NvrChannel) => {
  if (nvr.channels) {
    nvr.channels = nvr.channels.filter(c => c.id !== channel.id)
  }
  message.success('通道删除成功')
}

// ==========================================
// 子设备编辑（名称 + GPS 详细位置）
// ==========================================
const channelRenameVisible = ref(false)
const channelRenameTarget = ref<NvrChannel | null>(null)
const channelRenameName = ref('')
const channelRenameLocation = ref('')

const showRenameChannel = (channel: NvrChannel) => {
  channelRenameTarget.value = channel
  channelRenameName.value = channel.name
  channelRenameLocation.value = channel.location || ''
  channelRenameVisible.value = true
}

const handleRenameChannel = () => {
  const target = channelRenameTarget.value
  if (!target) return
  const name = channelRenameName.value.trim()
  if (!name) { message.warning('请输入通道名称'); return }
  if (name.length > 50) { message.warning('通道名称限制50个字符以内'); return }
  target.name = name
  target.location = channelRenameLocation.value.trim()
  message.success('保存成功')
  channelRenameVisible.value = false
}

// ==========================================
// 鹤梦云协议子设备功能设置（复用功能设置抽屉）
// ==========================================
const buildChannelSettingsDevice = (channel: NvrChannel): DeviceItem => ({
  id: channel.id,
  name: channel.name,
  license: '',
  deviceType: '鹤梦云协议摄像机',
  deviceModel: channel.deviceModel,
  firmwareVersion: '',
  sdkVersion: '',
  orgPath: [],
  orgPathLabel: '',
  status: channel.status === 'online' ? 'online' : 'offline',
  location: '',
  platform: '',
  capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'human'] },
})

const showChannelSettings = (channel: NvrChannel) => {
  showSettings(buildChannelSettingsDevice(channel))
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
type MapPickTarget =
  | { kind: 'device' }
  | { kind: 'addChannel'; cam: DetectedCamera }
  | { kind: 'editChannel'; channel: NvrChannel }
const mapPickTarget = ref<MapPickTarget>({ kind: 'device' })

const showMapPicker = (target?: MapPickTarget) => {
  if (target) mapPickTarget.value = target
  mapVisible.value = true
}

const mapCurrentLocation = computed(() => {
  const t = mapPickTarget.value
  if (t.kind === 'addChannel') return t.cam.location || ''
  if (t.kind === 'editChannel') return t.channel.location || ''
  return deviceForm.location || ''
})

const handleMapConfirm = () => {
  const t = mapPickTarget.value
  const coords = '118.7850, 32.0500'
  if (t.kind === 'addChannel') t.cam.location = coords
  else if (t.kind === 'editChannel') t.channel.location = coords
  else deviceForm.location = coords
  mapVisible.value = false
  message.success('已选择位置')
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

/** 设备设置数据模型 */
interface DeviceSettings {
  // 画面设置
  screenMode: 'single' | 'multi'
  flipMode: 'normal' | 'invert'
  wideDynamic: boolean
  // 报警通知 - 事件侦测类型开关（key为事件类型，value为是否开启）
  alarmNotify: boolean
  eventAlarm: Record<string, boolean>
  // 灯光设置
  lightMode: 'smart' | 'bw'
  statusLed: boolean
}

// 每台设备的设置缓存
const deviceSettingsMap = reactive<Record<string, DeviceSettings>>({})

const getDefaultSettings = (device: DeviceItem): DeviceSettings => {
  const eventAlarm: Record<string, boolean> = {}
  for (const et of device.capabilities.eventTypes) {
    eventAlarm[et] = false
  }
  return {
    screenMode: 'single',
    flipMode: 'normal',
    wideDynamic: false,
    alarmNotify: false,
    eventAlarm,
    lightMode: 'smart',
    statusLed: true,
  }
}

const showSettings = (device: DeviceItem) => {
  settingsDevice.value = device
  if (!deviceSettingsMap[device.id]) {
    deviceSettingsMap[device.id] = getDefaultSettings(device)
  }
  settingsVisible.value = true
}

const currentSettings = computed(() => {
  if (!settingsDevice.value) return getDefaultSettings({ capabilities: { screen: false, alarm: false, light: false, eventTypes: [] } } as unknown as DeviceItem)
  return deviceSettingsMap[settingsDevice.value.id]
})

/** 当前设备支持的能力（便捷计算属性） */
const currentCapabilities = computed(() => settingsDevice.value?.capabilities ?? { screen: false, alarm: false, light: false, eventTypes: [] })

/** 当前设备是否有任何设置项（如果三个能力都为false则无设置项） */
const hasAnySettings = computed(() => {
  const cap = currentCapabilities.value
  return cap.screen || cap.alarm || cap.light
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
          :scroll="{ x: 1180 }"
          :expandable="{ rowExpandable: (r: DeviceItem) => r.deviceType === 'NVR' }"
          size="middle"
        >
          <template #expandedRowRender="{ record }">
            <div class="dm-channel-panel">
              <div class="dm-channel-header">
                <span class="dm-channel-title">子设备列表（{{ record.channels?.length || 0 }} 路）</span>
                <a-button size="small" type="primary" @click="showAddSubDevice(record)">
                  <template #icon><PlusOutlined /></template>添加子设备
                </a-button>
              </div>
              <div v-if="record.channels && record.channels.length" class="dm-channel-list">
                <div v-for="ch in record.channels" :key="ch.id" class="dm-channel-item">
                  <span class="dm-channel-no">CH{{ ch.channelNo }}</span>
                  <span class="dm-channel-name">{{ ch.name }}</span>
                  <a-tag color="blue" class="dm-channel-protocol">{{ protocolLabel(ch.protocol) }}</a-tag>
                  <span class="dm-channel-meta">SN：{{ ch.serialNo || '—' }} · IP：{{ ch.ip || '—' }} · GPS：{{ ch.location || '—' }}</span>
                  <a-tag :color="ch.status === 'online' ? 'green' : 'red'" class="dm-channel-status">{{ ch.status === 'online' ? '在线' : '离线' }}</a-tag>
                  <div class="dm-channel-actions">
                    <a @click="showRenameChannel(ch)">编辑</a>
                    <a v-if="ch.protocol === 'private'" @click="showChannelSettings(ch)">功能设置</a>
                    <a class="dm-link-danger" @click="showDeleteChannel(record, ch)">删除</a>
                  </div>
                </div>
              </div>
              <a-empty v-else description="暂无子设备，点击右上角添加" :image-style="{ height: '40px' }" />
            </div>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'deviceType'">
              <a-space :size="6">
                <span>{{ record.deviceType }}</span>
                <a-tag v-if="record.deviceType === 'NVR'" color="blue">{{ record.channels?.length || 0 }} 路</a-tag>
              </a-space>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor[record.status]">{{ statusLabel[record.status] }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space :size="8">
                <a @click="showEdit(record)">编辑</a>
                <a v-if="record.deviceType !== 'NVR'" @click="showSettings(record)">功能设置</a>
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
                  <template #suffix><EnvironmentOutlined class="dm-map-icon" @click="showMapPicker()" title="地图选点" /></template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label=" "><a @click="showMapPicker()" class="dm-map-link"><EnvironmentOutlined /> 地图选点</a></a-form-item>
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
                <a-form-item label="固件版本">
                  <a-input :value="editingDevice.firmwareVersion" disabled style="background:#f5f5f5" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
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

    <!-- ==================== 添加子设备弹窗（NVR 自动搜索） ==================== -->
    <a-modal v-model:open="subDeviceModalVisible" :title="subDeviceStep === 1 ? '添加子设备' : '通道分配'" width="720px"
      :footer="null" :destroy-on-hidden="true">
      <a-steps :current="subDeviceStep - 1" size="small" style="margin-bottom:20px">
        <a-step title="搜索检测" />
        <a-step title="通道分配" />
      </a-steps>

      <!-- 步骤 1：自动搜索检测 -->
      <template v-if="subDeviceStep === 1">
        <div class="dm-sub-tip">
          <template v-if="detecting">
            <a-spin size="small" /> 正在搜索已通过网线连接 NVR 的摄像头...
          </template>
          <template v-else-if="detectError">
            <span class="dm-sub-error-text">搜索失败，请检查 NVR 网络连接后重试</span>
            <a-button size="small" type="link" @click="rescanSubDevices"><template #icon><ReloadOutlined /></template>重试</a-button>
          </template>
          <template v-else>
            共检测到 <b>{{ detectedCameras.length }}</b> 台设备，已选 <b>{{ selectedCameras.length }}</b> 台
            <a-button size="small" type="link" @click="rescanSubDevices"><template #icon><ReloadOutlined /></template>重新搜索</a-button>
          </template>
        </div>

        <div v-if="detecting" class="dm-sub-searching">
          <a-spin />
          <p>设备搜索中，请稍候...</p>
        </div>

        <div v-else-if="detectError" class="dm-sub-searching">
          <a-result status="error" title="搜索失败" sub-title="未能搜索到子设备，请检查 NVR 连接后重试">
            <template #extra>
              <a-button type="primary" @click="rescanSubDevices"><template #icon><ReloadOutlined /></template>重新搜索</a-button>
            </template>
          </a-result>
        </div>

        <div v-else class="dm-sub-detect-list">
          <div v-for="cam in detectedCameras" :key="cam.id" class="dm-sub-detect-item">
            <a-checkbox v-model:checked="cam.selected">智能设备</a-checkbox>
            <span class="dm-sub-detect-sn">SN：{{ cam.serialNo }}</span>
            <span class="dm-sub-detect-ip">IP：{{ cam.ip }}</span>
            <a-tag v-if="cam.needsAuth" color="orange">需认证</a-tag>
          </div>
        </div>

        <div class="dm-sub-footer">
          <a-space>
            <a-button @click="subDeviceModalVisible = false">取消</a-button>
            <a-button type="primary" :disabled="selectedCameras.length === 0" @click="goToChannelAssign">下一步</a-button>
          </a-space>
        </div>
      </template>

      <!-- 步骤 2：通道分配 + 协议认证 -->
      <template v-else>
        <div class="dm-sub-assign-list">
          <div v-for="cam in selectedCameras" :key="cam.id" class="dm-sub-assign-item">
            <div class="dm-sub-assign-head">
              <span class="dm-sub-assign-label">通道名称</span>
              <a-input v-model:value="cam.name" placeholder="请输入通道名称" :maxlength="50" class="dm-sub-assign-name" />
              <span class="dm-sub-assign-meta">SN：{{ cam.serialNo }} · IP：{{ cam.ip }}</span>
            </div>
            <div class="dm-sub-assign-row">
              <div class="dm-sub-assign-field">
                <span class="dm-sub-assign-label">通道号</span>
                <a-input-number v-model:value="cam.channelNo" :min="1" :max="64" style="width:120px" />
              </div>
              <div class="dm-sub-assign-field">
                <span class="dm-sub-assign-label">详细位置</span>
                <a-input v-model:value="cam.location" placeholder="经纬度坐标" style="width:280px">
                  <template #suffix><EnvironmentOutlined class="dm-map-icon" @click="showMapPicker({ kind: 'addChannel', cam })" title="地图选点" /></template>
                </a-input>
              </div>
            </div>
            <div v-if="cam.needsAuth" class="dm-sub-assign-row">
              <div class="dm-sub-assign-field">
                <span class="dm-sub-assign-label">用户名</span>
                <a-input v-model:value="cam.username" placeholder="请输入用户名" style="width:180px" />
              </div>
              <div class="dm-sub-assign-field">
                <span class="dm-sub-assign-label">密码</span>
                <a-input-password v-model:value="cam.password" placeholder="请输入密码" style="width:180px" />
              </div>
              <div v-if="cam.authError" class="dm-sub-auth-error">{{ cam.authError }}</div>
            </div>
          </div>
        </div>

        <div class="dm-sub-footer">
          <a-space>
            <a-button @click="subDeviceStep = 1">上一步</a-button>
            <a-button type="primary" @click="confirmAddSubDevice">确认添加</a-button>
          </a-space>
        </div>
      </template>
    </a-modal>

    <!-- ==================== 子设备编辑弹窗 ==================== -->
    <a-modal v-model:open="channelRenameVisible" title="编辑子设备" width="480px" @ok="handleRenameChannel" @cancel="channelRenameVisible = false" :destroy-on-hidden="true">
      <a-form :model="{ name: channelRenameName, location: channelRenameLocation }" layout="vertical" class="dm-form">
        <a-form-item label="通道名称" required>
          <a-input v-model:value="channelRenameName" placeholder="请输入通道名称" :maxlength="50" />
        </a-form-item>
        <a-form-item label="详细位置">
          <a-input v-model:value="channelRenameLocation" placeholder="经纬度坐标">
            <template #suffix><EnvironmentOutlined class="dm-map-icon" @click="showMapPicker({ kind: 'editChannel', channel: channelRenameTarget! })" title="地图选点" /></template>
          </a-input>
          <a @click="showMapPicker({ kind: 'editChannel', channel: channelRenameTarget! })" class="dm-map-link" style="margin-top:4px;display:inline-flex"><EnvironmentOutlined /> 地图选点</a>
        </a-form-item>
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
          <a-descriptions-item label="固件版本">{{ viewDevice.firmwareVersion }}</a-descriptions-item>
          <a-descriptions-item label="SDK版本">{{ viewDevice.sdkVersion }}</a-descriptions-item>
        </a-descriptions>

        <!-- NVR 通道列表 -->
        <template v-if="viewDevice.deviceType === 'NVR'">
          <a-divider orientation="center" style="font-size:13px;font-weight:600;color:#1677ff;margin:16px 0 12px">通道列表</a-divider>
          <div class="dm-view-channels">
            <div v-for="ch in viewDevice.channels || []" :key="ch.id" class="dm-view-channel-item">
              <span class="dm-view-channel-no">CH{{ ch.channelNo }}</span>
              <span class="dm-view-channel-name">{{ ch.name }}</span>
              <a-tag color="blue">{{ protocolLabel(ch.protocol) }}</a-tag>
              <span class="dm-channel-meta">SN：{{ ch.serialNo || '—' }} · IP：{{ ch.ip || '—' }} · GPS：{{ ch.location || '—' }}</span>
              <a-tag :color="ch.status === 'online' ? 'green' : 'red'">{{ ch.status === 'online' ? '在线' : '离线' }}</a-tag>
            </div>
            <a-empty v-if="!(viewDevice.channels && viewDevice.channels.length)" description="暂无通道" :image-style="{ height: '40px' }" />
          </div>
        </template>

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
    <a-modal v-model:open="mapVisible" title="地图选点" width="640px" :z-index="2000" @ok="handleMapConfirm" @cancel="mapVisible = false" ok-text="确定选择" cancel-text="取消">
      <div class="dm-map-placeholder">
        <EnvironmentOutlined style="font-size:48px;color:#1890ff" />
        <p>地图选点组件（模拟）</p>
        <p class="dm-map-coords">当前坐标：{{ mapCurrentLocation || '未选择' }}</p>
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

        <!-- 无设置项提示 -->
        <a-empty v-if="!hasAnySettings" description="该设备暂无可配置项" />

        <template v-else>
        <!-- 画面设置 -->
        <a-card v-if="currentCapabilities.screen" title="画面设置" size="small" class="dm-settings-card" variant="outlined">
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
        <a-card v-if="currentCapabilities.alarm" title="报警管理" size="small" class="dm-settings-card" variant="outlined">
          <template #extra>
            <span class="dm-settings-card-desc">配置设备报警相关功能</span>
          </template>
          <!-- 报警通知总开关 -->
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">报警通知</span>
              <span class="dm-settings-row-hint">开启后设备产生事件报警将推送系统通知</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch
                v-model:checked="currentSettings.alarmNotify"
                checked-children="开启"
                un-checked-children="关闭"
              />
            </div>
          </div>
          <!-- 事件侦测类型开关（动态渲染） -->
          <template v-if="currentCapabilities.eventTypes.length > 0">
            <a-divider style="margin:12px 0" />
            <div
              v-for="et in currentCapabilities.eventTypes"
              :key="et"
              class="dm-settings-row"
            >
              <div class="dm-settings-row-label">
                <span class="dm-settings-row-title">{{ eventTypeLabels[et] || et }}</span>
                <span class="dm-settings-row-hint">{{ eventTypeHints[et] || '开启后检测到事件将触发报警' }}</span>
              </div>
              <div class="dm-settings-row-ctrl">
                <a-switch
                  :checked="currentSettings.eventAlarm[et]"
                  checked-children="开启"
                  un-checked-children="关闭"
                  @update:checked="(val: boolean) => currentSettings.eventAlarm[et] = val"
                />
              </div>
            </div>
          </template>
          <a-empty
            v-else
            description="该设备不支持事件侦测类型"
            :image-style="{ height: '40px' }"
          />
        </a-card>

        <!-- 灯光设置 -->
        <a-card v-if="currentCapabilities.light" title="灯光设置" size="small" class="dm-settings-card" variant="outlined">
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

/* ==================== NVR 通道 ==================== */
.dm-channel-panel { padding:4px 8px 8px; }
.dm-channel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.dm-channel-title { font-size:13px; font-weight:600; color:#333; }
.dm-channel-list { display:flex; flex-direction:column; gap:6px; }
.dm-channel-item { display:grid; grid-template-columns:56px minmax(120px,1fr) 88px 220px 60px 132px; align-items:center; gap:12px; padding:8px 12px; background:#fafbfc; border:1px solid #f0f0f0; border-radius:6px; }
.dm-channel-no { font-size:12px; font-weight:600; color:#1677ff; }
.dm-channel-name { font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-channel-protocol, .dm-channel-status { justify-self:start; }
.dm-channel-meta { font-size:12px; color:#999; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dm-channel-actions { display:flex; justify-content:flex-end; gap:8px; white-space:nowrap; }

.dm-view-channels { display:flex; flex-direction:column; gap:6px; }
.dm-view-channel-item { display:flex; align-items:center; gap:12px; padding:8px 12px; background:#fafbfc; border:1px solid #f0f0f0; border-radius:6px; }
.dm-view-channel-no { font-size:12px; font-weight:600; color:#1677ff; min-width:44px; }
.dm-view-channel-name { font-size:13px; color:#333; flex:1; }

/* ==================== 添加子设备向导 ==================== */
.dm-sub-tip { display:flex; align-items:center; gap:8px; font-size:13px; color:#666; margin-bottom:12px; }
.dm-sub-error-text { color:#ff4d4f; }
.dm-sub-searching { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:48px 0; color:#999; }
.dm-sub-detect-list { display:flex; flex-direction:column; gap:8px; max-height:320px; overflow-y:auto; }
.dm-sub-detect-item { display:flex; align-items:center; gap:12px; padding:10px 12px; background:#fafbfc; border:1px solid #f0f0f0; border-radius:6px; }
.dm-sub-detect-item :deep(.ant-checkbox-wrapper) { min-width:200px; }
.dm-sub-detect-sn { font-size:12px; color:#666; }
.dm-sub-detect-ip { font-size:12px; color:#999; }
.dm-sub-footer { display:flex; justify-content:flex-end; margin-top:16px; }

.dm-sub-assign-list { display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; }
.dm-sub-assign-item { padding:12px; background:#fafbfc; border:1px solid #f0f0f0; border-radius:6px; display:flex; flex-direction:column; gap:12px; }
.dm-sub-assign-head { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.dm-sub-assign-name { width:180px; }
.dm-sub-assign-meta { font-size:12px; color:#999; }
.dm-sub-assign-row { display:flex; align-items:center; flex-wrap:wrap; gap:16px; }
.dm-sub-assign-field { display:flex; align-items:center; gap:8px; }
.dm-sub-assign-label { font-size:12px; color:#666; white-space:nowrap; }
.dm-sub-auth-error { width:100%; color:#ff4d4f; font-size:12px; line-height:1.5; }
</style>
