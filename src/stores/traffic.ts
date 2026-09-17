import { defineStore } from 'pinia'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { ScenarioKey } from '@/stores/enterprise'

// ========== 人流统计 — 计数点位（跨页面共享） ==========

/**
 * 计数点位：来自「支持人流统计能力」的设备。
 * 设备在 设备管理 → 功能设置 中开启人流统计后，方可作为计数点位。
 */
export interface CountingPoint {
  id: string
  /** 点位名称（设备名称） */
  name: string
  /** 设备 ID，与设备管理中的设备一一对应 */
  deviceId: string
  /** 设备序列号 */
  deviceSn: string
  /** 所属组织路径 */
  orgPath: string
  /** 计数模式：area=区域计数，line=跨线计数 */
  mode: 'area' | 'line'
  online: boolean
  /** 在数预警阈值 */
  insideThreshold: number
  /** 进入/小时预警阈值 */
  enterThreshold: number
}

/** 场景 → 统计对象称呼（人流统计统一统计「人」） */
const SCENARIO_OBJECT: Record<ScenarioKey, string> = {
  store: '顾客',
  factory: '员工',
  district: '人员',
  warehouse: '人员',
  construction: '工人',
  eldercare: '老人',
}

const initPoints: CountingPoint[] = [
  { id: 'cp-1', name: 'xx相机-北门入口', deviceId: 'd2', deviceSn: 'LIC-2024-A002', orgPath: '华东/江苏/南京/新街口商圈/万达苏宁旗舰店', mode: 'line', online: true, insideThreshold: 120, enterThreshold: 200 },
  { id: 'cp-2', name: 'xx相机-大厅全景', deviceId: 'd5', deviceSn: 'LIC-2024-A005', orgPath: '华东/江苏/南京/新街口商圈/21世纪太阳城', mode: 'area', online: true, insideThreshold: 300, enterThreshold: 500 },
  { id: 'cp-3', name: 'xx相机-正门大厅', deviceId: 'd8', deviceSn: 'LIC-2024-A008', orgPath: '华北/北京/朝阳区/国贸商圈/银泰中心', mode: 'line', online: true, insideThreshold: 200, enterThreshold: 320 },
  { id: 'cp-4', name: 'xx相机-二楼走廊', deviceId: 'd12', deviceSn: 'LIC-2024-A012', orgPath: '华南/广东/深圳/南山区/万象天地', mode: 'area', online: true, insideThreshold: 90, enterThreshold: 160 },
]

export const useTrafficStore = defineStore('traffic', {
  state: () => ({
    /** 计数点位（源自支持人流统计能力的设备） */
    points: [...initPoints] as CountingPoint[],
  }),

  getters: {
    /** 统计对象称呼：随企业中心「应用场景」联动 */
    objectName(): string {
      const enterprise = useEnterpriseStore()
      return SCENARIO_OBJECT[enterprise.scenarioKey] ?? '人员'
    },
    /** 计量单位：人流统计统一为「人次」 */
    unit: () => '人次',
    /** 在数取整单位 */
    insideUnit: () => '人',
    /** 计数点位下拉选项 */
    pointOptions: (state) => state.points.map(p => ({ value: p.id, label: `${p.name}（${p.orgPath.split('/').pop()}）` })),
  },

  actions: {
    updatePoint(id: string, patch: Partial<CountingPoint>) {
      const p = this.points.find(x => x.id === id)
      if (p) Object.assign(p, patch)
    },
  },
})
