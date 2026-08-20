import { defineStore } from 'pinia'

// ========== 企业应用场景 ==========

/** 应用场景 key（与企业中心"应用场景"选项一致） */
export type ScenarioKey = 'store' | 'factory' | 'district' | 'site' | 'warehouse' | 'construction' | 'school' | 'project'

export interface EnterpriseScenario {
  scenarioKey: ScenarioKey
}

const STORAGE_KEY = 'enterprise-scenario:v1'
const DEFAULT: EnterpriseScenario = { scenarioKey: 'store' }

/** 应用场景显示名 */
export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  store: '门店',
  factory: '厂区',
  district: '园区',
  site: '站点',
  warehouse: '仓库',
  construction: '工地',
  school: '学校',
  project: '项目',
}

function loadAll(): Record<string, EnterpriseScenario> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function normalize(cfg: Partial<EnterpriseScenario> | undefined): EnterpriseScenario {
  const key = cfg?.scenarioKey
  return { scenarioKey: key && SCENARIO_LABELS[key] ? key : 'store' }
}

/**
 * 企业应用场景：随企业切换加载、在企业中心保存。
 * 数据大屏根据企业应用场景自动匹配对应的展示场景。
 */
export const useEnterpriseStore = defineStore('enterprise', {
  state: (): EnterpriseScenario => ({ ...DEFAULT }),

  getters: {
    /** 数据大屏场景 key（与应用场景一致） */
    screenScenarioKey: (state): ScenarioKey => state.scenarioKey,
    /** 当前应用场景显示名 */
    scenarioLabel: (state): string => SCENARIO_LABELS[state.scenarioKey] ?? '门店',
  },

  actions: {
    /** 切换企业时加载该企业的应用场景 */
    loadForEnterprise(enterpriseId: string) {
      const cfg = loadAll()[enterpriseId]
      if (cfg) {
        this.scenarioKey = normalize(cfg).scenarioKey
      } else {
        this.scenarioKey = DEFAULT.scenarioKey
      }
    },

    /** 企业中心保存应用场景 */
    save(enterpriseId: string, cfg: EnterpriseScenario) {
      const normalized = normalize(cfg)
      const map = loadAll()
      map[enterpriseId] = normalized
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
      this.scenarioKey = normalized.scenarioKey
    },
  },
})
