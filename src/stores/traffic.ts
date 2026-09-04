import { defineStore } from 'pinia'

// ========== 人流统计 — 场景模板 / 计数点位（跨页面共享） ==========

/** 场景模板：切换后联动统计对象名称、单位、目标分类与预警阈值 */
export interface ScenarioTemplate {
  key: string
  name: string
  /** 统计对象名称，如 游客 / 人员 / 顾客 / 目标 */
  objectName: string
  /** 计量单位：人次 / 人 / 辆 / 个 */
  unit: string
  /** 目标分类 */
  targetTypes: string[]
  /** 预警阈值 */
  thresholds: { inside: number; enterPerHour: number }
}

/** 计数点位 */
export interface CountingPoint {
  id: string
  name: string
  orgPath: string
  /** 计数模式：area=区域计数，line=跨线计数 */
  mode: 'area' | 'line'
  online: boolean
  targetTypes: string[]
  thresholds: { inside: number; enterPerHour: number }
}

export const scenarioTemplates: ScenarioTemplate[] = [
  { key: 'general', name: '通用', objectName: '目标', unit: '个', targetTypes: ['人', '车', '宠物', '其他'], thresholds: { inside: 500, enterPerHour: 800 } },
  { key: 'park', name: '公园', objectName: '游客', unit: '人次', targetTypes: ['人', '宠物', '其他'], thresholds: { inside: 2000, enterPerHour: 1500 } },
  { key: 'school', name: '学校', objectName: '人员', unit: '人', targetTypes: ['人', '其他'], thresholds: { inside: 1200, enterPerHour: 900 } },
  { key: 'warehouse', name: '仓储', objectName: '人员', unit: '人', targetTypes: ['人', '车辆', '其他'], thresholds: { inside: 200, enterPerHour: 300 } },
  { key: 'supermarket', name: '超市', objectName: '顾客', unit: '人次', targetTypes: ['人', '其他'], thresholds: { inside: 300, enterPerHour: 600 } },
]

const initPoints: CountingPoint[] = [
  { id: 'cp-1', name: '主入口', orgPath: '新加坡 / 中央区 / 乌节路 / 乌节路旗舰店', mode: 'line', online: true, targetTypes: ['人'], thresholds: { inside: 120, enterPerHour: 200 } },
  { id: 'cp-2', name: '东门', orgPath: '新加坡 / 滨海湾 / 滨海湾金沙店', mode: 'line', online: true, targetTypes: ['人'], thresholds: { inside: 80, enterPerHour: 150 } },
  { id: 'cp-3', name: '中庭', orgPath: '新加坡 / 中央区 / 乌节路 / 乌节路旗舰店', mode: 'area', online: true, targetTypes: ['人', '宠物'], thresholds: { inside: 300, enterPerHour: 500 } },
  { id: 'cp-4', name: '收银区', orgPath: '新加坡 / 牛车水 / 牛车水店', mode: 'area', online: true, targetTypes: ['人'], thresholds: { inside: 60, enterPerHour: 120 } },
  { id: 'cp-5', name: '停车场入口', orgPath: '新加坡 / 樟宜 / 樟宜机场店', mode: 'line', online: true, targetTypes: ['车', '人'], thresholds: { inside: 200, enterPerHour: 300 } },
  { id: 'cp-6', name: '卸货区', orgPath: '新加坡 / 裕廊东 / 裕廊东店', mode: 'line', online: false, targetTypes: ['车辆', '人'], thresholds: { inside: 40, enterPerHour: 80 } },
  { id: 'cp-7', name: '二层走廊', orgPath: '新加坡 / 武吉士 / 武吉士店', mode: 'area', online: true, targetTypes: ['人'], thresholds: { inside: 90, enterPerHour: 160 } },
  { id: 'cp-8', name: '活动广场', orgPath: '新加坡 / 淡滨尼 / 淡滨尼店', mode: 'area', online: true, targetTypes: ['人', '宠物', '其他'], thresholds: { inside: 500, enterPerHour: 800 } },
  { id: 'cp-9', name: '办公区入口', orgPath: '新加坡 / 大巴窑 / 大巴窑店', mode: 'line', online: true, targetTypes: ['人'], thresholds: { inside: 50, enterPerHour: 90 } },
  { id: 'cp-10', name: '西门', orgPath: '新加坡 / 实龙岗 / 实龙岗店', mode: 'line', online: true, targetTypes: ['人'], thresholds: { inside: 70, enterPerHour: 130 } },
]

export const useTrafficStore = defineStore('traffic', {
  state: () => ({
    currentScenarioKey: 'general' as string,
    points: [...initPoints] as CountingPoint[],
  }),

  getters: {
    currentScenario: (state) => scenarioTemplates.find(s => s.key === state.currentScenarioKey) ?? scenarioTemplates[0],
    /** 全部目标分类（跨场景去重合并） */
    allTargetTypes(): string[] {
      const set = new Set<string>()
      scenarioTemplates.forEach(s => s.targetTypes.forEach(t => set.add(t)))
      return Array.from(set)
    },
  },

  actions: {
    setScenario(key: string) {
      this.currentScenarioKey = key
    },
    updatePoint(id: string, patch: Partial<CountingPoint>) {
      const p = this.points.find(x => x.id === id)
      if (p) Object.assign(p, patch)
    },
    addPoint(point: CountingPoint) {
      this.points.unshift(point)
    },
    removePoint(id: string) {
      this.points = this.points.filter(x => x.id !== id)
    },
  },
})
