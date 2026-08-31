import { defineStore } from 'pinia'

// ========== 能耗管理 — 操作日志（跨页面共享） ==========

export type EnergyAction = 'POWER_OFF' | 'POWER_ON'
export type OpResult = 'SUCCESS' | 'FAILED' | 'TIMEOUT'

export interface OperationLog {
  key: string
  time: string
  operator: string
  orgPath: string
  meterName: string
  action: EnergyAction
  reason: string
  result: OpResult
}

const logOrgPaths = [
  '新加坡 / 中央区 / 乌节路 / 乌节路旗舰店',
  '新加坡 / 滨海湾 / 滨海湾金沙店',
  '新加坡 / 牛车水 / 牛车水店',
  '新加坡 / 樟宜 / 樟宜机场店',
  '新加坡 / 武吉士 / 武吉士店',
  '新加坡 / 裕廊东 / 裕廊东店',
  '新加坡 / 淡滨尼 / 淡滨尼店',
  '新加坡 / 大巴窑 / 大巴窑店',
  '新加坡 / 实龙岗 / 实龙岗店',
  '新加坡 / 碧山 / 碧山店',
  '新加坡 / 义顺 / 义顺店',
  '新加坡 / 宏茂桥 / 宏茂桥店',
  '新加坡 / 勿洛 / 勿洛店',
  '新加坡 / 加冷 / 加冷店',
  '新加坡 / 榜鹅 / 榜鹅店',
]
const logOperators = ['🫏建成', '李运维', '王主管']
const logMeters = ['总表', '冷藏区', '照明区']
const powerOffReasons = ['安全应急', '欠费断电', '设备检修', '夜间闭店节能', '违规用电整改', '消防整改', '线路故障隔离']
const powerOnReasons = ['营业前恢复供电', '检修完成恢复供电', '缴清欠费恢复供电', '应急解除恢复供电', '故障修复恢复供电']

const initLogs: OperationLog[] = Array.from({ length: 48 }, (_, i) => {
  const action: EnergyAction = i % 2 === 0 ? 'POWER_OFF' : 'POWER_ON'
  const day = String(26 - Math.floor(i / 2)).padStart(2, '0')
  const hour = String(22 - (i % 12)).padStart(2, '0')
  const minute = String((i * 11) % 60).padStart(2, '0')
  return {
    key: String(i + 1),
    time: `2026-08-${day} ${hour}:${minute}:00`,
    operator: logOperators[i % logOperators.length],
    orgPath: logOrgPaths[i % logOrgPaths.length],
    meterName: logMeters[i % logMeters.length],
    action,
    reason: action === 'POWER_OFF' ? powerOffReasons[i % powerOffReasons.length] : powerOnReasons[i % powerOnReasons.length],
    result: i % 11 === 9 ? 'TIMEOUT' : 'SUCCESS',
  }
})

export const useEnergyStore = defineStore('energy', {
  state: () => ({
    logs: [...initLogs] as OperationLog[],
  }),

  actions: {
    /** 新增一条操作日志（断电/启用后写入，用于追溯） */
    addLog(log: OperationLog) {
      this.logs.unshift(log)
    },
  },
})
