<script setup lang="ts">
import { ref, h, computed } from 'vue'
import dayjs from 'dayjs'
import { message, Modal } from 'antdv-next'
import { SearchOutlined, CheckCircleFilled, ExclamationCircleOutlined, CalendarOutlined } from '@antdv-next/icons'

interface AIProblem {
  id: string; description: string; orgPath: string; deviceName: string; capturedAt: string
  aiDetail: string; status: 'pending_rectify' | 'rectified' | 'ignored' | 'pending' | 'closed'
  ticketId: string | null; autoTicket: boolean
}

interface AIResultCard {
  id: string; taskName: string; taskNo: string; autoCreateTicket: boolean
  totalImages: number; problemCount: number; passRate: number
  problems: AIProblem[]; qualifiedImages: number
}

// ========== Mock ==========
const mockResults: AIResultCard[] = [
  {
    id: '1', taskName: '京东电器门店展陈规范检测', taskNo: 'AI20260529-003', autoCreateTicket: true,
    totalImages: 456, problemCount: 5, passRate: 98.9,
    problems: [
      { id: 'p1', description: '电视展区样机未开机', orgPath: '京东电器/华东区/南京分区/新街口店', deviceName: '电视展区摄像头-03', capturedAt: '2026-05-29 09:35:48', aiDetail: '检测到75寸新品样机处于关机状态，品牌方要求新品展区样机100%开机展示', status: 'pending_rectify', ticketId: 'RECT-20260529-001', autoTicket: true },
      { id: 'p2', description: '价签与样机型号不一致', orgPath: '京东电器/华东区/南京分区/新街口店', deviceName: '冰箱展区摄像头-01', capturedAt: '2026-05-29 09:36:12', aiDetail: '检测到价签显示"美的BCD-508WTPZM"，实际样机为"美的BCD-485WSPZM"', status: 'rectified', ticketId: 'RECT-20260529-002', autoTicket: true },
      { id: 'p3', description: '手机展台防盗器脱落', orgPath: '京东电器/华东区/苏州分区/观前街店', deviceName: '手机展区摄像头-02', capturedAt: '2026-05-29 09:35:55', aiDetail: '检测到iPhone展台一台样机防盗拉线脱落，存在样机被盗风险', status: 'pending_rectify', ticketId: 'RECT-20260529-003', autoTicket: true },
      { id: 'p4', description: '空调展区地面有包装垃圾', orgPath: '京东电器/华东区/南京分区/新街口店', deviceName: '空调展区摄像头-01', capturedAt: '2026-05-29 09:36:30', aiDetail: '检测到空调展区地面有泡沫板和缠绕膜，疑似安装后未清理', status: 'pending_rectify', ticketId: 'RECT-20260529-004', autoTicket: true },
      { id: 'p5', description: '小家电展台灯带不亮', orgPath: '京东电器/华东区/南京分区/新街口店', deviceName: '小家电展区摄像头-03', capturedAt: '2026-05-29 09:37:15', aiDetail: '检测到破壁机展台底部氛围灯带熄灭，影响展台整体视觉效果', status: 'rectified', ticketId: 'RECT-20260529-005', autoTicket: true },
    ],
    qualifiedImages: 451,
  },
  {
    id: '2', taskName: '苏宁易购门店展陈规范检测', taskNo: 'AI20260528-007', autoCreateTicket: true,
    totalImages: 380, problemCount: 3, passRate: 99.2,
    problems: [
      { id: 'p6', description: '洗衣机展区地面有水渍', orgPath: '苏宁易购/华北区/北京分区/朝阳大悦城店', deviceName: '洗衣机展区摄像头-02', capturedAt: '2026-05-28 14:20:00', aiDetail: '检测到洗衣机展区演示用水未清理干净，地面有明显水渍，存在顾客滑倒隐患', status: 'pending_rectify', ticketId: 'RECT-20260528-101', autoTicket: true },
      { id: 'p7', description: '笔记本展区样机锁屏密码未取消', orgPath: '苏宁易购/华北区/天津分区/和平路店', deviceName: '笔记本展区摄像头-01', capturedAt: '2026-05-28 14:22:30', aiDetail: '检测到1台联想笔记本样机停留在锁屏界面，顾客无法体验', status: 'pending_rectify', ticketId: 'RECT-20260528-102', autoTicket: true },
      { id: 'p8', description: '扫地机器人演示区围栏倾倒', orgPath: '苏宁易购/华北区/北京分区/朝阳大悦城店', deviceName: '扫地机器人演示区摄像头-03', capturedAt: '2026-05-28 14:25:10', aiDetail: '检测到科沃斯演示区透明围栏倾倒，机器人运行轨迹超出演示范围', status: 'rectified', ticketId: 'RECT-20260528-103', autoTicket: true },
    ],
    qualifiedImages: 377,
  },
  {
    id: '3', taskName: '京东电器门店展陈规范检测', taskNo: 'AI20260527-012', autoCreateTicket: true,
    totalImages: 320, problemCount: 0, passRate: 100,
    problems: [],
    qualifiedImages: 320,
  },
  {
    id: '4', taskName: '苏宁易购门店安全巡检', taskNo: 'AI20260526-019', autoCreateTicket: false,
    totalImages: 456, problemCount: 5, passRate: 98.9,
    problems: [
      { id: 'p9', description: '配电间门未关闭上锁', orgPath: '苏宁易购/华南区/深圳分区/福田华强北店', deviceName: '后场配电间摄像头-01', capturedAt: '2026-05-26 10:15:30', aiDetail: '检测到配电间门呈半开状态，门锁未扣合，非工作人员可随意进入', status: 'pending', ticketId: null, autoTicket: false },
      { id: 'p10', description: '消防栓前堆放样机包装箱', orgPath: '苏宁易购/华南区/深圳分区/福田华强北店', deviceName: '2F消防通道摄像头-02', capturedAt: '2026-05-26 10:18:45', aiDetail: '检测到2F消防栓前堆放冰箱外包装纸箱，遮挡消防器材取用', status: 'pending', ticketId: null, autoTicket: false },
      { id: 'p11', description: '安全出口指示灯闪烁', orgPath: '苏宁易购/华南区/广州分区/天河正佳店', deviceName: '1F安全出口摄像头-04', capturedAt: '2026-05-26 10:22:10', aiDetail: '检测到1F西侧安全出口指示灯间歇性闪烁，疑似线路接触不良', status: 'pending', ticketId: null, autoTicket: false },
      { id: 'p12', description: '仓库通道堆货堵塞', orgPath: '苏宁易购/华南区/深圳分区/福田华强北店', deviceName: '仓库通道摄像头-03', capturedAt: '2026-05-26 10:25:00', aiDetail: '检测到仓库主通道被空调外机堆放堵塞，通行宽度不足0.5米', status: 'closed', ticketId: 'RECT-20260526-301', autoTicket: false },
      { id: 'p13', description: '停车场入口照明不足', orgPath: '苏宁易购/华南区/深圳分区/福田华强北店', deviceName: 'B1停车场入口摄像头-05', capturedAt: '2026-05-26 10:30:20', aiDetail: '检测到B1停车场入口3盏顶灯熄灭，照度低于安全标准', status: 'pending', ticketId: null, autoTicket: false },
    ],
    qualifiedImages: 451,
  },
]

// ========== 统计 ==========
const totalImages = ref(1612)
const totalProblems = ref(13)
const overallPassRate = ref(99.2)

// ========== 筛选 ==========
const searchTime = ref<any>([dayjs(), dayjs()])
const searchLicense = ref('')
const searchOrg = ref<string | undefined>(undefined)
const orgOptions = [
  { label: '京东电器', value: '京东电器' },
  { label: '苏宁易购', value: '苏宁易购' },
]

const results = ref([...mockResults])

const doSearch = () => { results.value = mockResults }
const doReset = () => { searchTime.value = [dayjs(), dayjs()]; searchLicense.value = ''; searchOrg.value = undefined; results.value = [...mockResults] }

// ========== 折叠面板 ==========
const activeKeys = ref<string[]>([])
const expandedProblems = ref<Record<string, boolean>>({})
const DEFAULT_SHOW = 2

const getVisibleProblems = (result: AIResultCard) => {
  if (expandedProblems.value[result.id]) return result.problems
  return result.problems.slice(0, DEFAULT_SHOW)
}
const getHiddenCount = (result: AIResultCard) => Math.max(0, result.problems.length - DEFAULT_SHOW)

const problemStatusMap: Record<string, { label: string; color: string }> = {
  pending_rectify: { label: '待整改', color: 'orange' },
  rectified: { label: '已整改', color: 'green' },
  ignored: { label: '已忽略', color: 'default' },
  closed: { label: '已关闭', color: 'default' },
  pending: { label: '待处理', color: 'blue' },
}

// ========== 手动操作 ==========
const mockRectifiers = ['张三', '李四', '王五', '赵六']
const ticketModalVisible = ref(false)
const ticketProblem = ref<AIProblem | null>(null)
const selectedRectifier = ref<string[]>([])

const openTicketModal = (problem: AIProblem) => {
  ticketProblem.value = problem; selectedRectifier.value = []; ticketModalVisible.value = true
}
const confirmTicket = () => {
  if (!selectedRectifier.value.length) { message.warning('请选择整改人'); return }
  if (ticketProblem.value) {
    ticketProblem.value.status = 'pending_rectify'
    ticketProblem.value.ticketId = 'RECT-' + Date.now().toString(36).toUpperCase()
    message.success(`整改单 ${ticketProblem.value.ticketId} 已生成，指派给 ${selectedRectifier.value.join('、')}`)
  }
  ticketModalVisible.value = false
}
const handleIgnore = (problem: AIProblem) => {
  Modal.confirm({ title: '确定忽略该异常吗？', icon: () => h(ExclamationCircleOutlined), content: '忽略后不会生成整改单。', okText: '确定', cancelText: '取消', onOk: () => { problem.status = 'ignored'; message.success('已忽略该异常') } })
}

// ========== 图片预览 ==========
const previewVisible = ref(false)
const previewTitle = ref('')
const expandedQualified = ref<Record<string, boolean>>({})
const openPreview = (title: string) => { previewTitle.value = title; previewVisible.value = true }

const statusLabel = (p: AIProblem) => {
  const base = problemStatusMap[p.status]?.label || p.status
  return p.ticketId ? `${base}：${p.ticketId}` : base
}

const collapseKey = (r: AIResultCard) => `panel-${r.id}`

const toggleQualified = (id: string) => {
  expandedQualified.value = { ...expandedQualified.value, [id]: !expandedQualified.value[id] }
}
const collapseQualified = (id: string) => {
  expandedQualified.value = { ...expandedQualified.value, [id]: false }
}
</script>

<template>
  <div class="ai-result">
    <!-- 顶部统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ totalImages.toLocaleString() }}</div>
        <div class="stat-label">分析图片</div>
      </div>
      <div class="stat-card stat-problems">
        <div class="stat-value">{{ totalProblems.toLocaleString() }}</div>
        <div class="stat-label">发现问题</div>
      </div>
      <div class="stat-card stat-rate">
        <div class="stat-value">{{ overallPassRate }}%</div>
        <div class="stat-label">合格率</div>
      </div>
    </div>

    <!-- 搜索区 -->
    <div class="search-area">
      <a-space wrap :size="12">
        <a-range-picker v-model:value="searchTime" style="width:260px" :placeholder="['开始时间', '结束时间']"><template #suffixIcon><CalendarOutlined /></template></a-range-picker>
        <a-input v-model:value="searchLicense" placeholder="请输入License" style="width:200px" allow-clear />
        <a-select v-model:value="searchOrg" placeholder="请选择区域组织" style="width:200px" allow-clear :options="orgOptions" />
        <a-button type="primary" @click="doSearch"><SearchOutlined /> 查询</a-button>
        <a-button @click="doReset">重置</a-button>
      </a-space>
    </div>

    <!-- 结果列表 -->
    <div class="result-list">
      <div v-for="result in results" :key="result.id" class="result-panel">
        <!-- 面板头部 -->
        <div class="panel-header" @click="activeKeys.includes(collapseKey(result)) ? activeKeys = activeKeys.filter(k => k !== collapseKey(result)) : activeKeys.push(collapseKey(result))">
          <div class="panel-header-left">
            <span class="collapse-arrow" :class="{ expanded: activeKeys.includes(collapseKey(result)) }">▶</span>
            <span class="task-name">{{ result.taskName }}</span>
            <span class="task-no">{{ result.taskNo }}</span>
            <a-tag v-if="result.autoCreateTicket" color="blue" size="small">AI自动提单</a-tag>
          </div>
          <div class="panel-stats">
            <span class="stat-pill">分析 <b>{{ result.totalImages }}</b> 张</span>
            <span class="stat-pill stat-pill-problem">问题 <b>{{ result.problemCount }}</b> 个</span>
            <span class="stat-pill">合格率 <b>{{ result.passRate }}%</b></span>
          </div>
        </div>

        <!-- 面板内容 -->
        <div v-if="activeKeys.includes(collapseKey(result))" class="panel-body">
          <!-- 有问题 -->
          <template v-if="result.problems.length > 0">
            <div class="section-title section-problems">
              <span class="badge badge-yellow">{{ result.problems.length }}</span>
              <span>发现的问题</span>
            </div>

            <div class="problem-list">
              <div v-for="problem in getVisibleProblems(result)" :key="problem.id" class="problem-card" :class="{ 'problem-pending': !problem.autoTicket && problem.status === 'pending' }">
                <div class="problem-body">
                  <div class="problem-thumb" @click.stop="openPreview(problem.description)">
                    <div class="thumb-placeholder">截图</div>
                    <span class="thumb-badge">AI</span>
                  </div>
                  <div class="problem-info">
                    <div class="problem-title">{{ problem.description }}</div>
                    <div class="problem-meta">{{ problem.orgPath }} | 设备：{{ problem.deviceName }} | {{ problem.capturedAt }}</div>
                    <div class="problem-detail">{{ problem.aiDetail }}</div>
                  </div>
                  <div class="problem-actions">
                    <a-tag :color="problemStatusMap[problem.status]?.color">{{ statusLabel(problem) }}</a-tag>
                    <template v-if="!problem.autoTicket && problem.status === 'pending'">
                      <div class="action-btns">
                        <a-button type="primary" size="small" @click.stop="openTicketModal(problem)">生成问题单</a-button>
                        <a-button size="small" @click.stop="handleIgnore(problem)">忽略此条</a-button>
                      </div>
                      <div class="action-hint">非AI自动提单的检测结果，需人为处理</div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="getHiddenCount(result) > 0" class="expand-more" @click="expandedProblems[result.id] = true">
              展开更多（还有 {{ getHiddenCount(result) }} 个问题）
            </div>
          </template>

          <!-- 全部合格 -->
          <template v-else>
            <div class="all-pass-banner">🎉 今日检测全部合格，未发现问题！</div>
          </template>

          <!-- 合格记录 -->
          <div class="qualified-section">
            <div class="qualified-header">
              <CheckCircleFilled style="color:#52c41a;margin-right:6px" />
              <span>合格记录</span>
              <span class="qualified-count">{{ result.qualifiedImages }} 张图片检测合格</span>
            </div>
            <div class="qualified-thumbs" v-if="!expandedQualified[result.id]">
              <div v-for="i in Math.min(result.qualifiedImages, 5)" :key="i" class="qt-thumb" @click="openPreview('合格图片 ' + i)" style="cursor:pointer"></div>
              <div v-if="result.qualifiedImages > 5" class="qt-thumb qt-more" @click.stop="toggleQualified(result.id)" style="cursor:pointer">+{{ result.qualifiedImages - 5 }}</div>
            </div>
            <Transition name="slide">
              <div v-if="expandedQualified[result.id]" class="qualified-all">
                <div class="qualified-all-header">全部合格图片（{{ result.qualifiedImages }} 张）<a-button type="link" size="small" @click.stop="collapseQualified(result.id)">收起</a-button></div>
                <div class="qualified-all-grid">
                  <div v-for="i in result.qualifiedImages" :key="'q'+i" class="qt-thumb" @click="openPreview('合格图片 ' + i)" style="cursor:pointer"></div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <a-empty v-if="results.length === 0" description="暂无AI分析结果" />
    </div>

    <!-- 生成问题单弹窗 -->
    <a-modal v-model:open="ticketModalVisible" title="生成问题单" width="420px" ok-text="确定" cancel-text="取消" @ok="confirmTicket">
      <a-form layout="vertical">
        <a-form-item label="选择整改人" required>
          <a-select v-model:value="selectedRectifier" mode="multiple" placeholder="请选择整改人" style="width:100%" :options="mockRectifiers.map(r => ({ label: r, value: r }))" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal v-model:open="previewVisible" :title="previewTitle" :footer="null" width="600px">
      <div style="background:#f0f0f0;height:300px;display:flex;align-items:center;justify-content:center;border-radius:4px;color:#bbb">图片预览区域</div>
    </a-modal>
  </div>
</template>

<style scoped>
.ai-result { padding: 0; }

/* 统计卡片 */
.stat-cards { display: flex; gap: 16px; margin-bottom: 16px; }
.stat-card { flex: 1; background: #fff; border-radius: 8px; padding: 20px 24px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.stat-value { font-size: 32px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
.stat-label { font-size: 14px; color: #999; }
.stat-problems .stat-value { color: #ff4d4f; }
.stat-rate .stat-value { color: #1677ff; }

/* 搜索区 */
.search-area { background: #f6f8fa; border-radius: 8px; padding: 14px 20px; margin-bottom: 16px; }

/* 面板列表 */
.result-list { display: flex; flex-direction: column; gap: 12px; }
.result-panel { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }

/* 面板头部 */
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; transition: background .15s; flex-wrap: wrap; gap: 8px; }
.panel-header:hover { background: #fafafa; }
.panel-header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.collapse-arrow { font-size: 10px; color: #999; transition: transform .2s; display: inline-block; }
.collapse-arrow.expanded { transform: rotate(90deg); }
.task-name { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.task-no { font-size: 12px; color: #666; background: #f0f0f0; border: 1px solid #e0e0e0; padding: 2px 8px; border-radius: 3px; }
.panel-stats { display: flex; gap: 6px; flex-shrink: 0; }
.stat-pill { background: #f6f8fa; border: 1px solid #e8e8e8; padding: 3px 12px; border-radius: 12px; font-size: 13px; color: #666; }
.stat-pill b { color: #333; margin: 0 2px; }
.stat-pill-problem b { color: #ff4d4f; }

/* 面板内容 */
.panel-body { padding: 0 20px 16px; }

/* 问题区域 */
.section-problems { display: flex; align-items: center; gap: 8px; padding: 8px 0 12px; }
.badge-yellow { background: #faad14; color: #fff; border-radius: 10px; padding: 0 8px; font-size: 12px; font-weight: 600; min-width: 20px; text-align: center; line-height: 20px; }
.problem-list { display: flex; flex-direction: column; gap: 8px; }
.problem-card { border: 1px solid #ffe58f; background: #fffbe6; border-radius: 6px; padding: 12px; }
.problem-card.problem-pending { border-color: #faad14; background: #fffbe6; }
.problem-body { display: flex; gap: 12px; }
.problem-thumb { width: 72px; height: 54px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; }
.thumb-placeholder { font-size: 11px; color: #bbb; }
.thumb-badge { position: absolute; bottom: 2px; right: 2px; background: #1677ff; color: #fff; font-size: 9px; padding: 0 4px; border-radius: 2px; }
.problem-info { flex: 1; min-width: 0; }
.problem-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
.problem-meta { font-size: 11px; color: #999; margin-bottom: 4px; line-height: 1.5; }
.problem-detail { font-size: 12px; color: #666; }
.problem-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.action-btns { display: flex; gap: 4px; }
.action-hint { font-size: 10px; color: #999; }

/* 展开更多 */
.expand-more { text-align: center; padding: 10px 0 4px; color: #1677ff; font-size: 13px; cursor: pointer; }
.expand-more:hover { color: #409EFF; }

/* 全部合格 */
.all-pass-banner { text-align: center; padding: 24px; font-size: 16px; color: #52c41a; font-weight: 500; background: #f6ffed; border-radius: 6px; margin: 8px 0; }

/* 合格记录 */
.qualified-section { background: #f6ffed; border-radius: 6px; padding: 10px 14px; margin-top: 8px; }
.qualified-header { display: flex; align-items: center; font-size: 13px; color: #333; margin-bottom: 8px; }
.qualified-count { margin-left: auto; font-size: 12px; color: #999; }
.qualified-thumbs { display: flex; gap: 6px; }
.qt-thumb { width: 48px; height: 36px; background: #e8e8e8; border-radius: 4px; }
.qt-more { background: #1677ff; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; }
.qualified-all { margin-top: 8px; }
.qualified-all-header { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 8px; }
.qualified-all-grid { display: grid; grid-template-columns: repeat(auto-fill, 56px); gap: 6px; max-height: 200px; overflow-y: auto; padding: 8px; background: #fff; border-radius: 4px; border: 1px solid #e8e8e8; }
.qualified-all-grid .qt-thumb { width: 56px; height: 42px; }

/* 空状态 */
:deep(.ant-empty) { padding: 60px 0; }

/* Transition */
.slide-enter-active, .slide-leave-active { transition: all .3s ease; overflow: hidden; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; transform: translateY(-8px); }
.slide-enter-to, .slide-leave-from { opacity: 1; max-height: 600px; transform: translateY(0); }
</style>
