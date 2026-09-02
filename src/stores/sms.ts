import { defineStore } from 'pinia'
import dayjs from 'dayjs'

// ========== 短信通知（告警短信推送） ==========

export interface SmsMember {
  id: string
  name: string
  phone: string
  role: string
}

export interface SmsRecipient {
  id: string
  memberId: string
  name: string
  phone: string
  role: string
  enabled: boolean
  scope: string[] // 接收告警的区域 key
}

export interface SmsPurchaseRecord {
  id: string
  orderNo: string
  buyer: string
  payTime: string
  payMethod: string
  serviceName: string
  amount: number
  count: number // 购买次数
}

export interface SmsPackage {
  count: number
  price: number
  originalPrice?: number // 划线价（原价），后台可配置
  tag?: string // 角标标签，如「推荐」「超值」
}

/**
 * 短信通知配置：告警中心展示概览，短信配置页进行详细配置与购买。
 * 接收人来自企业成员，共享同一短信次数池，并按区域配置接收范围。
 */
export const useSmsStore = defineStore('sms', {
  state: () => ({
    balance: 2680,
    buyerName: '建成',
    members: [
      { id: 'u1', name: '李建国', phone: '13951888888', role: '行政总监' },
      { id: 'u2', name: '张明远', phone: '13812345678', role: '区域经理' },
      { id: 'u3', name: '王芳', phone: '13700001111', role: '门店店长' },
      { id: 'u4', name: '陈晓', phone: '13655556666', role: '值班主管' },
      { id: 'u5', name: '刘洋', phone: '13599998888', role: '安保负责人' },
    ] as SmsMember[],
    recipients: [
      { id: 'sms-1', memberId: 'u1', name: '李建国', phone: '13951888888', role: '行政总监', enabled: true, scope: ['huadong', 'huanan', 'huabei'] },
      { id: 'sms-2', memberId: 'u2', name: '张明远', phone: '13812345678', role: '区域经理', enabled: true, scope: ['huadong'] },
      { id: 'sms-3', memberId: 'u3', name: '王芳', phone: '13700001111', role: '门店店长', enabled: false, scope: ['huanan'] },
    ] as SmsRecipient[],
    packages: [
      { count: 100, price: 10 },
      { count: 500, price: 45, originalPrice: 60 },
      { count: 1000, price: 80, originalPrice: 100, tag: '超值' },
      { count: 2000, price: 150, originalPrice: 200 },
      { count: 5000, price: 350, originalPrice: 450, tag: '推荐' },
      { count: 10000, price: 600, originalPrice: 800, tag: '最划算' },
    ] as SmsPackage[],
    records: [
      { id: 'p-1', orderNo: 'ORD202608280001', buyer: '李建国', payTime: '2026-08-28 15:32', payMethod: '微信支付', serviceName: '短信通知 - 1000条', amount: 80, count: 1000 },
      { id: 'p-2', orderNo: 'ORD202608150001', buyer: '张明远', payTime: '2026-08-15 09:20', payMethod: '支付宝', serviceName: '短信通知 - 500条', amount: 45, count: 500 },
    ] as SmsPurchaseRecord[],
  }),

  getters: {
    activeRecipients: (state) => state.recipients.filter(r => r.enabled),
    // 累计购买次数
    totalPurchased(state): number {
      return state.records.reduce((sum, r) => sum + r.count, 0)
    },
  },

  actions: {
    addRecipient(memberId: string, scope: string[]) {
      const member = this.members.find(m => m.id === memberId)
      if (!member) return false
      if (this.recipients.some(r => r.memberId === memberId)) return false
      this.recipients.push({
        id: `sms-${Date.now()}`,
        memberId: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        enabled: true,
        scope,
      })
      return true
    },
    updateRecipient(id: string, scope: string[]) {
      const target = this.recipients.find(r => r.id === id)
      if (target) target.scope = scope
    },
    removeRecipient(id: string) {
      this.recipients = this.recipients.filter(r => r.id !== id)
    },
    purchase(pkg: SmsPackage, payMethod: 'alipay' | 'wechat' = 'wechat') {
      this.balance += pkg.count
      this.records.unshift({
        id: `p-${Date.now()}`,
        orderNo: `ORD${dayjs().format('YYYYMMDDHHmmss')}`,
        buyer: this.buyerName,
        payTime: dayjs().format('YYYY-MM-DD HH:mm'),
        payMethod: payMethod === 'alipay' ? '支付宝' : '微信支付',
        serviceName: `短信通知 - ${pkg.count}条`,
        amount: pkg.price,
        count: pkg.count,
      })
    },
  },
})
