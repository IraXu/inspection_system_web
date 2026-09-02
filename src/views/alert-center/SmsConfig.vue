<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'antdv-next'
import {
  ArrowLeftOutlined, PlusOutlined, EditOutlined,
  PayCircleOutlined, PhoneOutlined, CheckCircleFilled,
  WechatFilled, AlipayCircleOutlined, ClockCircleOutlined,
  MessageOutlined,
} from '@antdv-next/icons'
import dayjs from 'dayjs'
import { useSmsStore, type SmsRecipient } from '@/stores/sms'

const router = useRouter()
const smsStore = useSmsStore()

const goBack = () => router.push('/alert-center')

// ==================== 概览 ====================
const balance = computed(() => smsStore.balance)
const activeCount = computed(() => smsStore.activeRecipients.length)
const isBalanceZero = computed(() => smsStore.balance <= 0)
const hasActiveRecipient = computed(() => smsStore.activeRecipients.length > 0)

// ==================== 接收范围 ====================
interface ScopeNode { label: string; value: string; children?: ScopeNode[] }
const scopeTree: ScopeNode[] = [
  { label: '华东大区', value: 'huadong', children: [
    { label: '南京市', value: 'nanjing', children: [
      { label: '江宁万达', value: 'jiangning-wanda' },
      { label: '鼓楼万达', value: 'gulou-wanda' },
      { label: '桥北万象城', value: 'qiaobei' },
    ]},
  ]},
  { label: '华南大区', value: 'huanan', children: [
    { label: '深圳市', value: 'shenzhen', children: [
      { label: '福田商圈', value: 'sz-futian' },
    ]},
  ]},
  { label: '华北大区', value: 'huabei', children: [
    { label: '北京市', value: 'beijing', children: [
      { label: '朝阳商圈', value: 'bj-chaoyang' },
    ]},
    { label: '天津市', value: 'tianjin', children: [
      { label: '南开区', value: 'tj-nankai' },
    ]},
  ]},
]

const scopeLabelMap: Record<string, string> = {}
const buildScopeLabelMap = (nodes: ScopeNode[]) => {
  for (const n of nodes) {
    scopeLabelMap[n.value] = n.label
    if (n.children) buildScopeLabelMap(n.children)
  }
}
buildScopeLabelMap(scopeTree)

const scopeLabels = (keys: string[]) => keys.map(k => scopeLabelMap[k] || k).join('、') || '全部区域'

// ==================== 成员选择 ====================
const memberOptions = computed(() => smsStore.members.map(m => ({
  value: m.id,
  label: `${m.name} · ${m.phone}`,
})))

// ==================== 接收人表格 ====================
const recipientColumns = [
  { title: '成员', dataIndex: 'name', key: 'name', width: 120 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 150 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 110 },
  { title: '接收范围', key: 'scope', width: 200, ellipsis: true },
  { title: '启用', key: 'enabled', width: 80, align: 'center' as const },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
]
const recipientTableScroll = { x: 860 }

// ==================== 新增 / 编辑 ====================
const modalVisible = ref(false)
const editingId = ref('')
const form = reactive({ memberId: '', name: '', phone: '', scope: [] as string[] })

const openAdd = () => {
  editingId.value = ''
  form.memberId = ''; form.name = ''; form.phone = ''; form.scope = []
  modalVisible.value = true
}
const openEdit = (r: SmsRecipient) => {
  editingId.value = r.id
  form.memberId = r.memberId; form.name = r.name; form.phone = r.phone; form.scope = [...r.scope]
  modalVisible.value = true
}
const onMemberChange = (val: string) => {
  const m = smsStore.members.find(x => x.id === val)
  if (m) {
    form.name = m.name; form.phone = m.phone
    if (!m.phone) message.warning('该成员未配置手机号，请先完善成员信息')
  }
}
const saving = ref(false)
const saveRecipient = () => {
  if (!form.name) { message.warning('请选择成员'); return }
  if (!form.scope.length) { message.warning('请选择接收范围'); return }
  if (saving.value) return
  saving.value = true
  // 模拟保存异步，展示 loading 态
  setTimeout(() => {
    if (editingId.value) {
      smsStore.updateRecipient(editingId.value, form.scope)
      message.success('接收号码已更新')
    } else {
      const ok = smsStore.addRecipient(form.memberId, form.scope)
      if (!ok) { saving.value = false; message.warning('该成员已在接收列表中'); return }
      message.success('接收号码已添加')
    }
    saving.value = false
    modalVisible.value = false
  }, 500)
}
const deleteRecipient = (r: SmsRecipient) => {
  smsStore.removeRecipient(r.id)
  message.success('接收号码已删除')
}
const onToggleEnabled = (r: SmsRecipient, checked: boolean) => {
  const action = checked ? '启用' : '禁用'
  Modal.confirm({
    title: `确认${action}该接收号码？`,
    content: `确定要${action}「${r.name}」的短信接收吗？`,
    okText: action,
    cancelText: '取消',
    onOk: () => {
      r.enabled = checked
      message.success(`${action}成功`)
    },
  })
}

// ==================== 短信套餐 ====================
const tagColorMap: Record<string, string> = {
  推荐: 'linear-gradient(90deg, #ff7a45, #ff4d4f)',
  超值: 'linear-gradient(90deg, #52c41a, #389e0d)',
  最划算: 'linear-gradient(90deg, #722ed1, #531dab)',
}
const tagBg = (tag?: string) => (tag && tagColorMap[tag]) || 'linear-gradient(90deg, #ff9c6e, #fa541c)'

const selectedPackage = ref<number>(1000)
const selectedDetail = computed(() => smsStore.packages.find(p => p.count === selectedPackage.value))
const hasPackages = computed(() => smsStore.packages.length > 0)

// 套餐名称：短信通知 - xxx条
const packageName = (count: number) => `短信通知 - ${count}条`

// 支付方式（第一期：支付宝 / 微信）
type PayMethod = 'alipay' | 'wechat'
const payMethods: { value: PayMethod; label: string; icon: any; color: string }[] = [
  { value: 'alipay', label: '支付宝', icon: AlipayCircleOutlined, color: '#1677ff' },
  { value: 'wechat', label: '微信', icon: WechatFilled, color: '#07c160' },
]
const payMethod = ref<PayMethod>('alipay')
const payMethodLabel = computed(() => payMethods.find(p => p.value === payMethod.value)?.label || '')

// 打开支付弹窗
const payModalVisible = ref(false)
const payOrderNo = ref('')
const payMinute = ref(10)
const paySecond = ref(0)
let payTimer: ReturnType<typeof setInterval> | null = null
const payCountdown = computed(() => {
  const m = String(payMinute.value).padStart(2, '0')
  const s = String(paySecond.value).padStart(2, '0')
  return `${m}:${s}`
})
const startPayCountdown = () => {
  payMinute.value = 10
  paySecond.value = 0
  if (payTimer) clearInterval(payTimer)
  payTimer = setInterval(() => {
    if (paySecond.value > 0) {
      paySecond.value--
    } else if (payMinute.value > 0) {
      payMinute.value--
      paySecond.value = 59
    } else {
      clearInterval(payTimer!)
      payTimer = null
      payModalVisible.value = false
      message.info('支付已超时，请重新发起')
    }
  }, 1000)
}

const openPay = () => {
  if (!selectedDetail.value) return
  payOrderNo.value = `ORD${dayjs().format('YYYYMMDDHHmmss')}`
  payModalVisible.value = true
  startPayCountdown()
}

// 虚拟二维码占位：确定性地生成一个仿二维码 SVG（21x21 模块）
const fakeQrRects = computed(() => {
  const seed = payOrderNo.value || 'sms-pay'
  // 简单哈希，让同一个订单号每次生成一致的占位图
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const rand = () => { hash = (hash * 1103515245 + 12345) >>> 0; return (hash >> 16) & 1 }
  const N = 21
  const rects: { x: number; y: number; w: number; h: number }[] = []
  // 三个定位角（左上、右上、左下）
  const finder = (fx: number, fy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const border = x === 0 || x === 6 || y === 0 || y === 6
      const core = (x >= 2 && x <= 4) && (y >= 2 && y <= 4)
      if (border || core) rects.push({ x: fx + x, y: fy + y, w: 1, h: 1 })
    }
  }
  finder(0, 0)
  finder(N - 7, 0)
  finder(0, N - 7)
  // 其余伪随机填充
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const inFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    if (!inFinder && rand()) rects.push({ x, y, w: 1, h: 1 })
  }
  return rects
})
const closePay = () => {
  payModalVisible.value = false
  if (payTimer) { clearInterval(payTimer); payTimer = null }
}
const paying = ref(false)
const confirmPay = () => {
  const detail = selectedDetail.value
  if (!detail || paying.value) return
  paying.value = true
  // 模拟支付异步，展示 loading 态
  setTimeout(() => {
    closePay()
    smsStore.purchase(detail, payMethod.value)
    paying.value = false
    message.success(`支付成功，短信余额增加 ${detail.count} 次`)
  }, 800)
}
onUnmounted(() => { if (payTimer) clearInterval(payTimer) })

// ==================== 列表加载态 ====================
const tableLoading = ref(false)
const simulateLoad = () => {
  tableLoading.value = true
  setTimeout(() => { tableLoading.value = false }, 500)
}
onMounted(simulateLoad)

// ==================== 购买记录 ====================
const recordColumns = [
  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170 },
  { title: '购买人', dataIndex: 'buyer', key: 'buyer', width: 90 },
  { title: '支付时间', dataIndex: 'payTime', key: 'payTime', width: 160 },
  { title: '支付方式', dataIndex: 'payMethod', key: 'payMethod', width: 100 },
  { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 200 },
  { title: '支付金额', dataIndex: 'amount', key: 'amount', width: 100, align: 'right' as const },
]

// ==================== 分页 ====================
const recipientPagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
})
const recordPagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
})
const onRecipientPageChange = (p: { current: number; pageSize: number }) => {
  recipientPagination.current = p.current
  recipientPagination.pageSize = p.pageSize
}
const onRecordPageChange = (p: { current: number; pageSize: number }) => {
  recordPagination.current = p.current
  recordPagination.pageSize = p.pageSize
}
</script>

<template>
  <div class="sc-page">
    <!-- 顶部标题栏 -->
    <div class="sc-header">
      <a-button type="text" class="sc-back" @click="goBack">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>
      <div>
        <div class="sc-title">短信通知配置</div>
        <div class="sc-subtitle">设备告警将发送短信至企业成员，所有启用号码共享同一短信次数池</div>
      </div>
    </div>

    <!-- 概览统计 -->
    <div class="sc-overview">
      <span class="sc-ov-icon"><MessageOutlined /></span>
      <div class="sc-ov-item">
        <div class="sc-ov-label">剩余短信次数</div>
        <div class="sc-ov-value" :class="{ 'sc-ov-danger': isBalanceZero }">{{ balance.toLocaleString() }}</div>
      </div>
      <span class="sc-ov-divider"></span>
      <div class="sc-ov-item">
        <div class="sc-ov-label">启用接收号码</div>
        <div class="sc-ov-value">{{ activeCount }}</div>
      </div>
      <span v-if="!hasActiveRecipient" class="sc-ov-warn">无启用号码，短信不会发送</span>
      <span class="sc-ov-tag">共享次数池</span>
    </div>

    <!-- 接收手机号 -->
    <div class="sc-card">
      <div class="sc-card-head">
        <div>
          <div class="sc-card-title">接收手机号</div>
          <div class="sc-card-desc">从企业成员中选择接收人，其手机号自动带入，并可配置接收区域。</div>
        </div>
        <a-button type="primary" @click="openAdd"><template #icon><PlusOutlined /></template>新增号码</a-button>
      </div>
      <a-table
        :columns="recipientColumns"
        :data-source="smsStore.recipients"
        :pagination="recipientPagination"
        :scroll="recipientTableScroll"
        :loading="tableLoading"
        :locale="{ emptyText: '暂无接收号码，点击右上角新增' }"
        row-key="id"
        size="middle"
        @change="onRecipientPageChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scope'">
            <a-tooltip :title="scopeLabels(record.scope)">
              <span class="sc-scope">{{ scopeLabels(record.scope) }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-switch :checked="record.enabled" size="small" @change="(c: boolean) => onToggleEnabled(record, c)" />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openEdit(record)"><EditOutlined /> 编辑</a-button>
            <a-popconfirm title="确定删除该号码？" ok-text="删除" cancel-text="取消" @confirm="deleteRecipient(record)">
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 短信套餐 -->
    <div class="sc-card">
      <div class="sc-card-head">
        <div>
          <div class="sc-card-title">短信套餐</div>
          <div class="sc-card-desc">短信推送按次数计费，购买后所有启用号码共享同一次数池。</div>
        </div>
      </div>
      <div v-if="!hasPackages" class="sc-package-empty">暂无可购买的短信套餐</div>
      <div v-else class="sc-package-grid">
        <div
          v-for="pkg in smsStore.packages"
          :key="pkg.count"
          class="sc-package-card"
          :class="{ active: selectedPackage === pkg.count }"
          @click="selectedPackage = pkg.count"
        >
          <span v-if="pkg.tag" class="sc-package-tag" :style="{ background: tagBg(pkg.tag) }">{{ pkg.tag }}</span>
          <CheckCircleFilled v-if="selectedPackage === pkg.count" class="sc-package-check" />
          <div class="sc-package-count">{{ packageName(pkg.count) }}</div>
          <div class="sc-package-price">
            <span class="sc-package-cur">¥{{ pkg.price }}</span>
            <span v-if="pkg.originalPrice" class="sc-package-orig">¥{{ pkg.originalPrice }}</span>
          </div>
        </div>
      </div>
      <div class="sc-purchase-foot">
        <div class="sc-pay-methods">
          <span class="sc-pay-label">支付方式</span>
          <div
            v-for="pm in payMethods"
            :key="pm.value"
            class="sc-pay-method"
            :class="{ active: payMethod === pm.value }"
            @click="payMethod = pm.value"
          >
            <component :is="pm.icon" :style="{ color: pm.color }" />
            <span>{{ pm.label }}</span>
          </div>
        </div>
        <div class="sc-purchase-actions">
          <span class="sc-purchase-total">合计：<strong>¥{{ selectedDetail?.price ?? 0 }}</strong></span>
          <a-button type="primary" :disabled="!selectedDetail" @click="openPay">
            <template #icon><PayCircleOutlined /></template>立即购买
          </a-button>
        </div>
      </div>
    </div>

    <!-- 购买记录 -->
    <div class="sc-card">
      <div class="sc-card-head">
        <div>
          <div class="sc-card-title">购买记录</div>
          <div class="sc-card-desc">历史购买的短信套餐订单。</div>
        </div>
      </div>
      <a-table
        :columns="recordColumns"
        :data-source="smsStore.records"
        :pagination="recordPagination"
        :loading="tableLoading"
        :locale="{ emptyText: '暂无购买记录' }"
        row-key="id"
        size="middle"
        @change="onRecordPageChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'amount'">
            <span class="sc-amount">¥{{ record.amount.toFixed(2) }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingId ? '编辑接收号码' : '新增接收号码'"
      :width="480"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="saving"
      @ok="saveRecipient"
      @cancel="modalVisible = false"
    >
      <a-form layout="vertical" class="sc-form">
        <a-form-item v-if="!editingId" label="选择成员">
          <a-select
            v-model:value="form.memberId"
            :options="memberOptions"
            show-search
            option-filter-prop="label"
            placeholder="请选择企业成员"
            :not-found-content="'暂无可用成员'"
            @change="onMemberChange"
          />
        </a-form-item>
        <a-form-item v-else label="成员">
          <a-input :value="form.name" disabled />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input :value="form.phone" disabled placeholder="选择成员后自动带入">
            <template #prefix><PhoneOutlined style="color:#bfbfbf" /></template>
          </a-input>
        </a-form-item>
        <a-form-item label="接收范围">
          <a-tree-select
            v-model:value="form.scope"
            :tree-data="scopeTree"
            :field-names="{ label: 'label', value: 'value', children: 'children' }"
            tree-checkable
            multiple
            show-checked-strategy="SHOW_PARENT"
            :tree-default-expand-all="true"
            placeholder="请选择接收告警的区域"
            style="width:100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 扫码支付弹窗 -->
    <a-modal
      v-model:open="payModalVisible"
      :footer="null"
      :width="380"
      :closable="false"
      :mask-closable="false"
      centered
      class="sc-pay-modal"
    >
      <div class="sc-pay-box">
        <div class="sc-pay-head">
          <span class="sc-pay-title">扫码支付</span>
          <span class="sc-pay-close" @click="closePay">
            <svg viewBox="0 0 1024 1024" width="14" height="14"><path d="M512 471.6l202-202a28.6 28.6 0 0 1 40.4 40.4L552.4 512l202 202a28.6 28.6 0 0 1-40.4 40.4l-202-202-202 202A28.6 28.6 0 0 1 269.6 714l202-202-202-202a28.6 28.6 0 0 1 40.4-40.4z" fill="#c2c2c2"/></svg>
          </span>
        </div>
        <div class="sc-pay-amount">¥{{ (selectedDetail?.price ?? 0).toLocaleString() }}</div>
        <div class="sc-pay-orderno">订单号：{{ payOrderNo }}</div>
        <div class="sc-pay-qr">
          <svg width="180" height="180" viewBox="0 0 21 21" role="img" aria-label="支付二维码（占位）">
            <rect width="21" height="21" fill="#ffffff" />
            <rect
              v-for="(r, i) in fakeQrRects"
              :key="i"
              :x="r.x" :y="r.y" :width="r.w" :height="r.h"
              fill="#1677ff"
            />
          </svg>
        </div>
        <div class="sc-pay-tip">打开{{ payMethodLabel }}扫一扫</div>
        <div class="sc-pay-expire">请在10分钟内完成支付</div>
        <div class="sc-pay-countdown"><ClockCircleOutlined /> {{ payCountdown }}</div>
        <div class="sc-pay-footer">
          <a-button type="text" size="middle" class="sc-pay-demo" :loading="paying" @click="confirmPay">模拟扫码成功（演示）</a-button>
          <a-button size="middle" @click="closePay">取消</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.sc-page {
  min-height: 100%;
  padding: 12px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部标题栏 */
.sc-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sc-back { padding: 0 8px; }
.sc-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.sc-subtitle { margin-top: 2px; font-size: 12px; color: #94a3b8; }

/* 概览（横向信息条） */
.sc-overview {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: linear-gradient(100deg, #eef5ff 0%, #f7fbff 55%, #ffffff 100%);
  border: 1px solid #d6e8ff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04), 0 1px 2px rgba(0, 0, 0, .02);
}
.sc-ov-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #1677ff;
  color: #fff;
  font-size: 19px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(22, 119, 255, .25);
}
.sc-ov-item { display: flex; flex-direction: column; gap: 4px; }
.sc-ov-label { font-size: 12px; color: #94a3b8; }
.sc-ov-value { font-size: 26px; font-weight: 700; color: #1e293b; line-height: 1; font-variant-numeric: tabular-nums; }
.sc-ov-value.sc-ov-danger { color: #f5222d; }
.sc-ov-warn { color: #fa8c16; font-size: 12px; }
.sc-ov-divider { width: 1px; height: 34px; background: #dbeafe; flex-shrink: 0; }
.sc-ov-tag {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 卡片 */
.sc-card {
  background: #fff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  padding: 16px 20px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04), 0 1px 2px rgba(0, 0, 0, .02);
}
.sc-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.sc-card-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.sc-card-desc { margin-top: 4px; font-size: 12px; color: #94a3b8; }

.sc-scope { color: #334155; }

/* 表格列间距优化 */
.sc-card :deep(.ant-table) { font-size: 13px; }
.sc-card :deep(.ant-table-thead > tr > th) {
  background: #fafbfc;
  font-weight: 600;
  color: #64748b;
  padding: 12px 16px;
  border-bottom: 1px solid #eef1f5;
}
.sc-card :deep(.ant-table-tbody > tr > td) {
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafc;
}
.sc-card :deep(.ant-table-tbody > tr:hover > td) { background: #fafcff; }
.sc-card :deep(.ant-pagination) { margin: 16px 0 0 !important; }

/* 支付金额：两位小数 + 红色 */
.sc-amount { color: #f5222d; font-weight: 600; font-variant-numeric: tabular-nums; }

/* 套餐 */
.sc-package-empty {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  border: 1px dashed #e8e8e8;
  border-radius: 12px;
}
.sc-package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.sc-package-card {
  position: relative;
  padding: 18px 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
  background: #fff;
  overflow: hidden;
}
.sc-package-card:hover {
  border-color: #91caff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 119, 255, .10);
}
.sc-package-card.active {
  border-color: #1677ff;
  background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
  box-shadow: 0 6px 16px rgba(22, 119, 255, .14);
}
.sc-package-tag {
  position: absolute;
  top: 0;
  left: 0;
  padding: 4px 12px 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  border-radius: 12px 0 12px 0;
  line-height: 1;
}
.sc-package-check {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 18px;
  color: #1677ff;
  background: #fff;
  border-radius: 50%;
}
.sc-package-count { font-size: 15px; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
.sc-package-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}
.sc-package-cur { font-size: 22px; font-weight: 700; color: #1677ff; line-height: 1; }
.sc-package-orig { font-size: 13px; color: #bfbfbf; text-decoration: line-through; }
.sc-purchase-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.sc-pay-methods { display: flex; align-items: center; gap: 10px; }
.sc-pay-label { font-size: 13px; color: #64748b; }
.sc-pay-method {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all .2s;
  background: #fff;
}
.sc-pay-method:hover { border-color: #91caff; }
.sc-pay-method.active { border-color: #1677ff; background: #e6f4ff; color: #1677ff; font-weight: 500; }
.sc-pay-method .anticon { font-size: 16px; }
.sc-purchase-actions { display: flex; align-items: center; gap: 16px; margin-left: auto; }
.sc-purchase-total { font-size: 14px; color: #64748b; }
.sc-purchase-total strong { font-size: 18px; color: #1a1a1a; margin-left: 4px; }

/* 表单 */
.sc-form { padding-top: 8px; }
.sc-form :deep(.ant-form-item:last-child) { margin-bottom: 0; }

/* 扫码支付弹窗 */
.sc-pay-modal :deep(.ant-modal-content) { border-radius: 12px; padding: 24px 20px 20px; }
.sc-pay-box { display: flex; flex-direction: column; align-items: center; }
.sc-pay-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.sc-pay-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.sc-pay-close { display: inline-flex; cursor: pointer; padding: 2px; }
.sc-pay-close:hover svg path { fill: #999; }
.sc-pay-amount { font-size: 30px; font-weight: 700; color: #ff7a45; line-height: 1; }
.sc-pay-orderno { margin-top: 8px; font-size: 13px; color: #94a3b8; }
.sc-pay-qr { margin-top: 16px; }
.sc-pay-tip { margin-top: 14px; font-size: 15px; font-weight: 500; color: #1e293b; }
.sc-pay-expire { margin-top: 6px; font-size: 12px; color: #94a3b8; }
.sc-pay-countdown {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #ff4d4f;
}
.sc-pay-footer { margin-top: 20px; align-self: flex-end; display: flex; align-items: center; gap: 12px; }
.sc-pay-demo { color: #94a3b8; }
</style>
