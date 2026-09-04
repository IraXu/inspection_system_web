<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'antdv-next'
import {
  SearchOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined,
  ExclamationCircleOutlined, EnvironmentOutlined, DownloadOutlined, UploadOutlined,
  SyncOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined, MinusOutlined, AimOutlined,
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
  intrusion?: boolean   // 是否支持区域检测管理（区域闯入/离开检测）
  intrusionDetectTypes?: string[]  // 区域检测管理支持的检测类型，如 human/pet
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

/** 区域检测管理类型名称映射 */
const intrusionDetectTypeLabels: Record<string, string> = {
  human: '人形检测',
  pet: '宠物检测',
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
  { id: 'd2', name: 'xx相机-北门入口', license: 'LIC-2024-A002', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-wanda'], orgPathLabel: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', status: 'online', location: '118.7842, 32.0498', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'human', 'pet'], intrusion: true, intrusionDetectTypes: ['human', 'pet'] } },
  { id: 'd3', name: 'xx相机-收银台', license: 'LIC-2024-A003', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'offline', location: '118.7453, 32.1021', platform: '海康威视', capabilities: { screen: true, alarm: false, light: false, eventTypes: [] } },
  { id: 'd4', name: 'xx相机-仓库后门', license: 'LIC-2024-A004', deviceType: '低功耗摄像机', deviceModel: '低功耗网络摄像机', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huadong','js','nj','qb','qb-wanda'], orgPathLabel: '华东/江苏/南京/桥北商圈/桥北万象城', status: 'sleep', location: '118.7456, 32.1025', platform: '萤石', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['move'] } },
  { id: 'd5', name: 'xx相机-大厅全景', license: 'LIC-2024-A005', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','nj','xb','xb-taiyang'], orgPathLabel: '华东/江苏/南京/新街口商圈/21世纪太阳城', status: 'online', location: '118.7831, 32.0487', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'move', 'human', 'pet', 'child'], intrusion: true, intrusionDetectTypes: ['human', 'pet'] } },
  { id: 'd6', name: 'xx相机-停车场入口', license: 'LIC-2024-A006', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huadong','js','sz','sz-gusu','sz-gusu-meiluo'], orgPathLabel: '华东/江苏/苏州/姑苏区/美罗商城', status: 'online', location: '120.6154, 31.2989', platform: '海康威视', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['motion', 'move'] } },
  { id: 'd7', name: 'xx相机-东门监控', license: 'LIC-2024-A007', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huadong','sh','sh-pudong','sh-lujiazui','sh-guoji'], orgPathLabel: '华东/上海/浦东新区/陆家嘴商圈/上海国际中心', status: 'offline', location: '121.5023, 31.2361', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion'] } },
  { id: 'd8', name: 'xx相机-正门大厅', license: 'LIC-2024-A008', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'online', location: '116.4605, 39.9092', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'human', 'pet', 'child'], intrusion: true, intrusionDetectTypes: ['human', 'pet'] } },
  { id: 'd9', name: 'xx相机-侧门通道', license: 'LIC-2024-A009', deviceType: '低功耗摄像机', deviceModel: '低功耗网络摄像机', firmwareVersion: 'v3.2.0', sdkVersion: 'v1.8.5', orgPath: ['root','huabei','bj','bj-chaoyang','bj-guomao','bj-guomao-yintai'], orgPathLabel: '华北/北京/朝阳区/国贸商圈/银泰中心', status: 'sleep', location: '116.4608, 39.9095', platform: '萤石', capabilities: { screen: false, alarm: true, light: false, eventTypes: ['move', 'human'] } },
  { id: 'd10', name: 'xx相机-1楼中庭', license: 'LIC-2024-A010', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','gz','gz-tianhe','gz-taiKoo'], orgPathLabel: '华南/广东/广州/天河商圈/太古汇', status: 'online', location: '113.3233, 23.1291', platform: '海康威视', capabilities: { screen: true, alarm: false, light: false, eventTypes: [] } },
  { id: 'd11', name: 'xx相机-B1车库', license: 'LIC-2024-A011', deviceType: 'WIFI摄像机', deviceModel: '高清网络枪机', firmwareVersion: 'v5.6.3', sdkVersion: 'v2.2.8', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'offline', location: '113.9526, 22.5176', platform: '海康威视', capabilities: { screen: true, alarm: true, light: false, eventTypes: ['motion', 'move'] } },
  { id: 'd12', name: 'xx相机-二楼走廊', license: 'LIC-2024-A012', deviceType: 'AI摄像机', deviceModel: 'AI智能摄像机', firmwareVersion: 'v5.7.11', sdkVersion: 'v2.3.1', orgPath: ['root','huanan','gd','sz_city','sz-nanshan','sz-wanxiang'], orgPathLabel: '华南/广东/深圳/南山区/万象天地', status: 'online', location: '113.9528, 22.5180', platform: '海康威视', capabilities: { screen: true, alarm: true, light: true, eventTypes: ['motion', 'move', 'human', 'pet', 'child'], intrusion: true, intrusionDetectTypes: ['human', 'pet'] } },
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
// NVR 子设备同步（子设备在 NVR 设备端添加，此处仅同步最新列表）
// ==========================================

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

const syncingNvrId = ref<string | null>(null)

/** 同步 NVR 子设备：子设备在 NVR 设备端添加，此处仅拉取最新列表 */
const syncSubDevices = (nvr: DeviceItem) => {
  if (nvr.status === 'offline') {
    message.warning('NVR 已离线，无法同步子设备，请确认设备在线后再试')
    return
  }
  if (syncingNvrId.value) return
  syncingNvrId.value = nvr.id
  setTimeout(() => {
    syncingNvrId.value = null
    const count = nvr.channels?.length || 0
    message.success(`同步完成，共 ${count} 路子设备`)
  }, 800)
}

// 进入列表自动执行一次子设备同步
onMounted(() => {
  const nvrs = allDevices.value.filter(d => d.deviceType === 'NVR' && d.status !== 'offline')
  if (nvrs.length) {
    message.info(`已自动同步 ${nvrs.length} 台 NVR 的子设备，展开子设备列表可查看最新结果`)
  }
})

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
  | { kind: 'editChannel'; channel: NvrChannel }
const mapPickTarget = ref<MapPickTarget>({ kind: 'device' })

const showMapPicker = (target?: MapPickTarget) => {
  if (target) mapPickTarget.value = target
  mapVisible.value = true
}

const mapCurrentLocation = computed(() => {
  const t = mapPickTarget.value
  if (t.kind === 'editChannel') return t.channel.location || ''
  return deviceForm.location || ''
})

const handleMapConfirm = () => {
  const t = mapPickTarget.value
  const coords = '118.7850, 32.0500'
  if (t.kind === 'editChannel') t.channel.location = coords
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
  // 区域检测管理
  intrusionEnter: boolean
  intrusionLeave: boolean
  intrusionTimeStart: string
  intrusionTimeEnd: string
  intrusionAreaMode: 'all' | 'custom'
  intrusionArea: IntrusionArea | null
  intrusionSensitivity: '低' | '中' | '高'
  intrusionDetectTypes: string[]
  intrusionBuzzer: boolean
  intrusionAlarmLight: boolean
}

/** 区域检测管理框选区域（基于摄像机画面的归一化六边形） */
interface IntrusionArea {
  points: { x: number; y: number }[]   // 归一化坐标 0~1，6个顶点
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
    intrusionEnter: false,
    intrusionLeave: false,
    intrusionTimeStart: '00:00',
    intrusionTimeEnd: '23:59',
    intrusionAreaMode: 'all',
    intrusionArea: null,
    intrusionSensitivity: '中',
    intrusionDetectTypes: [...(device.capabilities.intrusionDetectTypes ?? [])],
    intrusionBuzzer: false,
    intrusionAlarmLight: false,
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
  return cap.screen || cap.alarm || cap.light || cap.intrusion
})

const router = useRouter()

const goToCloudBroadcast = () => {
  settingsVisible.value = false
  router.push('/cloud-broadcast/event')
}

const handleSettingsSave = () => {
  if (settingsDevice.value?.status === 'offline') {
    message.warning('离线设备无法进行功能设置，请确认设备在线后再试')
    return
  }
  if (currentSettings.value.intrusionAreaMode === 'custom' && !currentSettings.value.intrusionArea) {
    message.warning('已选择自定义区域，请先框选检测区域')
    return
  }
  message.success(`${settingsDevice.value?.name || ''} 功能设置保存成功`)
  settingsVisible.value = false
}

// ==========================================
// 区域检测管理 - 区域框选（六边形）
// ==========================================
const intrusionDrawVisible = ref(false)
const intrusionCanvasEl = ref<HTMLDivElement | null>(null)
const intrusionDraftPoints = ref<{ x: number; y: number }[]>([])
const intrusionDragIndex = ref<number | null>(null)
const intrusionCursor = ref<{ x: number; y: number } | null>(null)

const intrusionDetectOptions = computed(() =>
  (currentCapabilities.value.intrusionDetectTypes ?? []).map(ft => ({
    label: intrusionDetectTypeLabels[ft] || ft,
    value: ft,
  })),
)

const intrusionSensitivityLevels: ('低' | '中' | '高')[] = ['低', '中', '高']

const intrusionSensitivityIndex = computed({
  get: () => intrusionSensitivityLevels.indexOf(currentSettings.value.intrusionSensitivity),
  set: (v: number) => {
    currentSettings.value.intrusionSensitivity = intrusionSensitivityLevels[v]
  },
})

const getIntrusionPos = (e: MouseEvent) => {
  const rect = intrusionCanvasEl.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const INTRUSION_VERTEX_HIT = 12

const hitIntrusionVertex = (pos: { x: number; y: number }) => {
  const idx = intrusionDraftPoints.value.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) <= INTRUSION_VERTEX_HIT)
  return idx >= 0 ? idx : -1
}

const intrusionHoverVertex = computed(() => {
  const cur = intrusionCursor.value
  return cur ? hitIntrusionVertex(cur) : -1
})

const intrusionCursorStyle = computed(() => {
  if (intrusionDragIndex.value !== null) return 'grabbing'
  if (intrusionHoverVertex.value >= 0) return 'grab'
  if (intrusionDraftPoints.value.length < 6) return 'crosshair'
  return 'default'
})

type IntrusionPoint = { x: number; y: number }

const orientation = (p: IntrusionPoint, q: IntrusionPoint, r: IntrusionPoint) => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
  if (val === 0) return 0
  return val > 0 ? 1 : 2
}

const onSegment = (p: IntrusionPoint, q: IntrusionPoint, r: IntrusionPoint) =>
  q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
  q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)

const segmentsIntersect = (a: IntrusionPoint, b: IntrusionPoint, c: IntrusionPoint, d: IntrusionPoint) => {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(a, c, b)) return true
  if (o2 === 0 && onSegment(a, d, b)) return true
  if (o3 === 0 && onSegment(c, a, d)) return true
  if (o4 === 0 && onSegment(c, b, d)) return true
  return false
}

const hasSelfIntersection = (pts: IntrusionPoint[], closed: boolean) => {
  const n = pts.length
  const edgeCount = closed ? n : n - 1
  for (let i = 0; i < edgeCount; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    for (let j = i + 1; j < edgeCount; j++) {
      const c = pts[j]
      const d = pts[(j + 1) % n]
      // 相邻边（共享顶点）允许相交，跳过
      const adjacent = j === i + 1 || (closed && i === 0 && j === edgeCount - 1)
      if (adjacent) continue
      if (segmentsIntersect(a, b, c, d)) return true
    }
  }
  return false
}

const intrusionSelfIntersects = computed(() => {
  const pts = intrusionDraftPoints.value
  if (pts.length < 4) return false
  return hasSelfIntersection(pts, pts.length === 6)
})

const intrusionHintText = computed(() => {
  const n = intrusionDraftPoints.value.length
  if (n === 0) return '点击画面依次放置 6 个顶点，框选检测区域'
  if (n < 6) return `已放置 ${n}/6 个顶点，继续点击放置（拖动顶点可微调）`
  return '已放置 6/6 个顶点，可拖动顶点微调后确认框选'
})

const clearIntrusionDraft = () => {
  intrusionDraftPoints.value = []
  intrusionCursor.value = null
  intrusionDragIndex.value = null
}

// PTZ 云台控制（模拟，便于调整实时画面位置）
const ptzZoom = ref(1)
const ptzPan = ref({ x: 0, y: 0 })
const ptzStep = 24
const ptzVisible = ref(false)

const ptzSceneStyle = computed(() => ({
  transform: `translate(${ptzPan.value.x}px, ${ptzPan.value.y}px) scale(${ptzZoom.value})`,
}))

const ptzMove = (dx: number, dy: number) => {
  ptzPan.value = {
    x: Math.max(-64, Math.min(64, ptzPan.value.x + dx)),
    y: Math.max(-64, Math.min(64, ptzPan.value.y + dy)),
  }
}

const ptzZoomIn = () => { ptzZoom.value = Math.min(3, +(ptzZoom.value + 0.25).toFixed(2)) }
const ptzZoomOut = () => { ptzZoom.value = Math.max(1, +(ptzZoom.value - 0.25).toFixed(2)) }
const ptzReset = () => {
  ptzPan.value = { x: 0, y: 0 }
  ptzZoom.value = 1
}

const intrusionDraftLinePoints = computed(() =>
  intrusionDraftPoints.value.map(p => `${p.x},${p.y}`).join(' '),
)

const intrusionDraftPolygonPoints = computed(() =>
  intrusionDraftPoints.value.length === 6 ? intrusionDraftLinePoints.value : '',
)

const intrusionPreviewLine = computed(() => {
  const pts = intrusionDraftPoints.value
  const cur = intrusionCursor.value
  if (!cur || pts.length === 0 || pts.length >= 6) return null
  const last = pts[pts.length - 1]
  return { x1: last.x, y1: last.y, x2: cur.x, y2: cur.y }
})

const intrusionAreaPoints = (area: IntrusionArea) =>
  area.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')

const openIntrusionDraw = () => {
  intrusionDraftPoints.value = []
  intrusionCursor.value = null
  intrusionDragIndex.value = null
  ptzZoom.value = 1
  ptzPan.value = { x: 0, y: 0 }
  ptzVisible.value = false
  intrusionDrawVisible.value = true
}

const onIntrusionMouseDown = (e: MouseEvent) => {
  const pos = getIntrusionPos(e)
  const idx = hitIntrusionVertex(pos)
  if (idx >= 0) {
    intrusionDragIndex.value = idx
    return
  }
  if (intrusionDraftPoints.value.length < 6) {
    intrusionDraftPoints.value.push(pos)
  }
}

const onIntrusionMouseMove = (e: MouseEvent) => {
  const pos = getIntrusionPos(e)
  intrusionCursor.value = pos
  if (intrusionDragIndex.value !== null) {
    const idx = intrusionDragIndex.value
    const arr = intrusionDraftPoints.value
    arr[idx] = { ...arr[idx], ...pos }
  }
}

const onIntrusionMouseUp = () => {
  intrusionDragIndex.value = null
}

const handleIntrusionDrawConfirm = () => {
  const pts = intrusionDraftPoints.value
  if (pts.length !== 6) {
    message.warning('请依次点击放置6个顶点，完成区域框选')
    return
  }
  if (intrusionSelfIntersects.value) {
    message.warning('框选区域存在交叉线，请调整顶点后再确认')
    return
  }
  const el = intrusionCanvasEl.value
  const cw = el?.clientWidth || 1
  const ch = el?.clientHeight || 1
  currentSettings.value.intrusionArea = {
    points: pts.map(p => ({ x: p.x / cw, y: p.y / ch })),
  }
  intrusionDraftPoints.value = []
  intrusionCursor.value = null
  intrusionDrawVisible.value = false
  message.success('已框选检测区域')
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
                <a-button size="small" type="primary" :loading="syncingNvrId === record.id" @click="syncSubDevices(record)">
                  <template #icon><SyncOutlined /></template>同步子设备
                </a-button>
              </div>
              <div class="dm-channel-guide">
                <SyncOutlined /> 子设备需在 NVR 设备端添加，添加完成后点击右上角「同步子设备」即可拉取最新子设备。
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
              <a-empty v-else description="暂无子设备，请在 NVR 设备端添加后点击同步" :image-style="{ height: '40px' }" />
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

    <!-- ==================== 区域框选弹窗（模拟） ==================== -->
    <a-modal v-model:open="intrusionDrawVisible" title="区域框选" width="1200px" :z-index="2000" :ok-button-props="{ disabled: intrusionSelfIntersects }" @ok="handleIntrusionDrawConfirm" @cancel="intrusionDrawVisible = false" ok-text="确认框选" cancel-text="取消">
      <div class="dm-intrusion-toolbar">
        <span class="dm-intrusion-toolbar-count">{{ intrusionHintText }}</span>
        <div class="dm-intrusion-toolbar-actions">
          <a-button size="small" class="dm-toolbar-btn" @click="ptzVisible = !ptzVisible">PTZ</a-button>
          <a-button size="small" class="dm-toolbar-btn" danger :disabled="intrusionDraftPoints.length === 0" @click="clearIntrusionDraft">一键清除</a-button>
        </div>
      </div>
      <div
        ref="intrusionCanvasEl"
        class="dm-intrusion-canvas"
        :style="{ cursor: intrusionCursorStyle }"
        @mousedown="onIntrusionMouseDown"
        @mousemove="onIntrusionMouseMove"
        @mouseup="onIntrusionMouseUp"
        @mouseleave="onIntrusionMouseUp"
      >
        <div class="dm-intrusion-scene" :style="ptzSceneStyle">
          <span class="dm-intrusion-scene-tag">实时画面 · 变倍 {{ ptzZoom.toFixed(2) }}x</span>
        </div>
        <svg class="dm-intrusion-svg" :class="{ 'is-invalid': intrusionSelfIntersects }">
          <polygon v-if="intrusionDraftPoints.length === 6" :points="intrusionDraftPolygonPoints" class="dm-intrusion-polygon" />
          <polyline v-if="intrusionDraftPoints.length >= 2" :points="intrusionDraftLinePoints" class="dm-intrusion-polyline" />
          <line v-if="intrusionPreviewLine" :x1="intrusionPreviewLine.x1" :y1="intrusionPreviewLine.y1" :x2="intrusionPreviewLine.x2" :y2="intrusionPreviewLine.y2" class="dm-intrusion-preview-line" />
          <circle v-for="(p, i) in intrusionDraftPoints" :key="'hit-' + i" :cx="p.x" :cy="p.y" r="12" class="dm-intrusion-vertex-hit" />
          <g v-for="(p, i) in intrusionDraftPoints" :key="'v-' + i">
            <circle :cx="p.x" :cy="p.y" r="8" :fill="intrusionDragIndex === i ? (intrusionSelfIntersects ? '#ff4d4f' : '#1890ff') : '#fff'" class="dm-intrusion-vertex" />
            <text :x="p.x" :y="p.y" class="dm-intrusion-vertex-label" :fill="intrusionDragIndex === i ? '#fff' : (intrusionSelfIntersects ? '#ff4d4f' : '#1890ff')">{{ i + 1 }}</text>
          </g>
        </svg>
        <div v-if="ptzVisible" class="dm-intrusion-ptz" @mousedown.stop>
          <div class="dm-intrusion-ptz-body">
            <div class="dm-intrusion-ptz-pad">
              <a-button size="small" class="dm-ptz-btn dm-ptz-up" @click="ptzMove(0, -ptzStep)"><UpOutlined /></a-button>
              <a-button size="small" class="dm-ptz-btn dm-ptz-left" @click="ptzMove(-ptzStep, 0)"><LeftOutlined /></a-button>
              <a-button size="small" class="dm-ptz-btn dm-ptz-home" title="复位" @click="ptzReset"><AimOutlined /></a-button>
              <a-button size="small" class="dm-ptz-btn dm-ptz-right" @click="ptzMove(ptzStep, 0)"><RightOutlined /></a-button>
              <a-button size="small" class="dm-ptz-btn dm-ptz-down" @click="ptzMove(0, ptzStep)"><DownOutlined /></a-button>
            </div>
            <div class="dm-intrusion-ptz-zoom">
              <a-button size="small" class="dm-ptz-btn" title="放大" @click="ptzZoomIn"><PlusOutlined /></a-button>
              <a-button size="small" class="dm-ptz-btn" title="缩小" @click="ptzZoomOut"><MinusOutlined /></a-button>
            </div>
          </div>
        </div>
        <div v-if="intrusionSelfIntersects" class="dm-intrusion-invalid-banner">
          <ExclamationCircleOutlined />
          <span>框选区域存在交叉线，请调整顶点</span>
        </div>
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

        <!-- 区域检测管理 -->
        <a-card v-if="currentCapabilities.intrusion" title="区域检测管理" size="small" class="dm-settings-card" variant="outlined">
          <template #extra>
            <span class="dm-settings-card-desc">配置区域闯入/离开检测</span>
          </template>
          <!-- 区域闯入检测 -->
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">区域闯入检测</span>
              <span class="dm-settings-row-hint">检测到目标进入框选区域时触发报警</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch v-model:checked="currentSettings.intrusionEnter" checked-children="开启" un-checked-children="关闭" />
            </div>
          </div>
          <!-- 区域离开检测 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">区域离开检测</span>
              <span class="dm-settings-row-hint">检测到目标离开框选区域时触发报警</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch v-model:checked="currentSettings.intrusionLeave" checked-children="开启" un-checked-children="关闭" />
            </div>
          </div>
          <template v-if="currentSettings.intrusionEnter || currentSettings.intrusionLeave">
          <!-- 时间段设置 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">时间段设置</span>
              <span class="dm-settings-row-hint">仅在设定时间段内启用检测</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <div class="dm-settings-time-range">
                <a-time-picker v-model:value="currentSettings.intrusionTimeStart" value-format="HH:mm" format="HH:mm" size="small" :input-read-only="true" style="width:96px" />
                <span class="dm-settings-time-sep">~</span>
                <a-time-picker v-model:value="currentSettings.intrusionTimeEnd" value-format="HH:mm" format="HH:mm" size="small" :input-read-only="true" style="width:96px" />
              </div>
            </div>
          </div>
          <!-- 区域划分 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">区域划分</span>
              <span class="dm-settings-row-hint">选择检测范围：全部画面或自定义框选区域</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-radio-group v-model:value="currentSettings.intrusionAreaMode" option-type="button" button-style="solid" size="small">
                <a-radio-button value="all">全部区域</a-radio-button>
                <a-radio-button value="custom">自定义区域</a-radio-button>
              </a-radio-group>
            </div>
          </div>
          <!-- 自定义区域：展示摄像机画面并框选 -->
          <template v-if="currentSettings.intrusionAreaMode === 'custom'">
            <div class="dm-intrusion-preview">
              <div class="dm-intrusion-scene">
                <svg class="dm-intrusion-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon v-if="currentSettings.intrusionArea" :points="intrusionAreaPoints(currentSettings.intrusionArea)" class="dm-intrusion-polygon dm-intrusion-polygon-dashed" />
                </svg>
                <span class="dm-intrusion-scene-tag">画面抓图</span>
                <a-button size="small" type="dashed" class="dm-intrusion-reframe" @click="openIntrusionDraw">
                  {{ currentSettings.intrusionArea ? '重新框选' : '框选区域' }}
                </a-button>
              </div>
            </div>
          </template>
          <!-- 灵敏度 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">灵敏度</span>
              <span class="dm-settings-row-hint">灵敏度越高，越容易触发检测报警</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-slider
                v-model:value="intrusionSensitivityIndex"
                :min="0"
                :max="2"
                :step="1"
                :marks="{ 0: '低', 1: '中', 2: '高' }"
                :tooltip="{ formatter: (v: number) => intrusionSensitivityLevels[v] }"
                style="width:180px"
              />
            </div>
          </div>
          <!-- 检测类型 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">检测类型</span>
              <span class="dm-settings-row-hint">根据设备能力可选，默认全选</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-select
                v-model:value="currentSettings.intrusionDetectTypes"
                mode="multiple"
                :options="intrusionDetectOptions"
                :max-tag-count="2"
                placeholder="请选择检测类型"
                size="small"
                style="width:220px"
              />
            </div>
          </div>
          <!-- 蜂鸣器设置 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">蜂鸣器设置</span>
              <span class="dm-settings-row-hint">触发报警时设备蜂鸣器鸣响提醒</span>
              <span class="dm-settings-row-hint">如需自定义语音报警，可前往<a class="dm-settings-guide-link" @click="goToCloudBroadcast">云广播</a>模块配置</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch v-model:checked="currentSettings.intrusionBuzzer" checked-children="开启" un-checked-children="关闭" />
            </div>
          </div>
          <!-- 报警灯开关 -->
          <a-divider style="margin:12px 0" />
          <div class="dm-settings-row">
            <div class="dm-settings-row-label">
              <span class="dm-settings-row-title">报警灯开关</span>
              <span class="dm-settings-row-hint">触发报警时设备报警灯闪烁</span>
            </div>
            <div class="dm-settings-row-ctrl">
              <a-switch v-model:checked="currentSettings.intrusionAlarmLight" checked-children="开启" un-checked-children="关闭" />
            </div>
          </div>
          </template>
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
.dm-settings-guide-link { font-size:12px; color:#1890ff; cursor:pointer; }
.dm-settings-row-ctrl { flex-shrink:0; }
.dm-settings-time-range { display:flex; align-items:center; gap:6px; }
.dm-settings-time-sep { color:#999; font-size:12px; }
.dm-intrusion-preview { display:flex; flex-direction:column; gap:8px; padding:8px 0 4px; }
.dm-intrusion-scene { position:relative; width:100%; height:180px; background:linear-gradient(135deg,#1f3b57 0%,#2b5a7a 45%,#7a9fb8 100%); border-radius:6px; overflow:hidden; }
.dm-intrusion-scene::before { content:''; position:absolute; inset:0; background:linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px); background-size:24px 24px; }
.dm-intrusion-scene-tag { position:absolute; left:8px; bottom:8px; padding:2px 8px; background:rgba(0,0,0,0.45); color:#fff; font-size:12px; border-radius:4px; }
.dm-intrusion-reframe { position:absolute; top:8px; right:8px; z-index:2; }
.dm-intrusion-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.dm-intrusion-polygon { fill:rgba(24,144,255,0.15); stroke:#1890ff; stroke-width:1.5; }
.dm-intrusion-polygon-dashed { stroke-width:1; stroke-dasharray:6 4; }
.dm-intrusion-polyline { fill:none; stroke:#1890ff; stroke-width:1.5; }
.dm-intrusion-preview-line { stroke:#1890ff; stroke-width:1.5; stroke-dasharray:6 4; }
.dm-intrusion-vertex-hit { fill:rgba(24,144,255,0.14); }
.dm-intrusion-vertex { fill:#fff; stroke:#1890ff; stroke-width:1.5; }
.dm-intrusion-vertex-label { text-anchor:middle; dominant-baseline:central; font-size:10px; font-weight:600; pointer-events:none; }
.dm-intrusion-svg.is-invalid .dm-intrusion-polygon { fill:rgba(255,77,79,0.15); stroke:#ff4d4f; }
.dm-intrusion-svg.is-invalid .dm-intrusion-polyline { stroke:#ff4d4f; }
.dm-intrusion-svg.is-invalid .dm-intrusion-vertex-hit { fill:rgba(255,77,79,0.14); }
.dm-intrusion-svg.is-invalid .dm-intrusion-vertex { stroke:#ff4d4f; }
.dm-intrusion-toolbar { display:flex; align-items:center; justify-content:space-between; margin:4px 0 8px; }
.dm-intrusion-toolbar-count { font-size:12px; color:#666; }
.dm-intrusion-canvas { position:relative; height:520px; border-radius:8px; overflow:hidden; cursor:crosshair; user-select:none; background:#16324a; }
.dm-intrusion-canvas .dm-intrusion-scene { position:absolute; inset:-20%; width:auto; height:auto; }
.dm-intrusion-invalid-banner { position:absolute; top:12px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:6px; padding:6px 14px; background:rgba(255,77,79,0.85); color:#fff; font-size:13px; border-radius:20px; z-index:3; pointer-events:none; box-shadow:0 2px 8px rgba(0,0,0,0.3); }
.dm-intrusion-ptz { position:absolute; right:10px; bottom:10px; display:flex; flex-direction:column; align-items:flex-end; gap:8px; z-index:2; }
.dm-intrusion-ptz-body { display:flex; align-items:center; gap:10px; padding:8px; background:rgba(0,0,0,0.38); border-radius:10px; backdrop-filter:blur(2px); }
.dm-intrusion-ptz-pad { display:grid; grid-template-columns:repeat(3, 30px); grid-template-rows:repeat(3, 30px); gap:5px; }
.dm-ptz-btn { width:30px; height:30px; min-width:30px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:14px; }
.dm-ptz-up { grid-column:2; grid-row:1; }
.dm-ptz-left { grid-column:1; grid-row:2; }
.dm-ptz-home { grid-column:2; grid-row:2; }
.dm-ptz-right { grid-column:3; grid-row:2; }
.dm-ptz-down { grid-column:2; grid-row:3; }
.dm-intrusion-ptz-zoom { display:flex; flex-direction:column; gap:5px; }
.dm-intrusion-toolbar-actions { display:flex; align-items:center; gap:8px; }
.dm-toolbar-btn { border-radius:6px; }

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
.dm-channel-guide { display:flex; align-items:center; gap:6px; padding:6px 12px; margin-bottom:8px; background:#e6f7ff; border:1px solid #91d5ff; border-radius:6px; color:#0958d9; font-size:12px; line-height:1.5; }
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
