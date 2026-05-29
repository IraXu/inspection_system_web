<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'antdv-next'
import { useRouter } from 'vue-router'
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@antdv-next/icons'
import { createVNode } from 'vue'
import type { TodoTask, IssueTicket, IssueItem } from '@/types'

const router = useRouter()

// ========== Tab ==========
const activeTab = ref('pending')
const tabCounts = reactive({ pending: 356, rectify: 24, review: 24, done: 24 })

// ========== Mock: 待执行 ==========
const mockTasks: TodoTask[] = [
  { taskId:'T200-P111-xxxxxxxxA',storeName:'xxx万达苏宁--AAA旗舰门店',templateName:'xxxx模板A',method:'在线巡检',executors:['吕建成','孙锐'],generatedAt:'xxxx-xx-xx xx:xx:xx' },
  { taskId:'T200-P111-xxxxxxxxB',storeName:'xxx万达苏宁--VVV旗舰门店',templateName:'xxxx模板A',method:'在线巡检',executors:['吕建成'],generatedAt:'xxxx-xx-xx xx:xx:xx' },
  { taskId:'T200-P111-xxxxxxxxC',storeName:'xxx万达苏宁--BBB旗舰门店',templateName:'xxxx模板B',method:'在线巡检',executors:['孙锐','王鹏'],generatedAt:'xxxx-xx-xx xx:xx:xx' },
  { taskId:'T200-P111-xxxxxxxxD',storeName:'xxx万达苏宁--xxx明星门店',templateName:'xxxx模板A',method:'在线巡检',executors:['吕建成','孙锐'],generatedAt:'xxxx-xx-xx xx:xx:xx' },
]

// ========== Mock: 待整改 ==========
const mockTickets: IssueTicket[] = [
  { ticketId:'SP-XXXXX1313-ADAD',taskId:'T200-P111-xxxxxxxA',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:5,submitter:'紫航',rectifier:'孙锐',reviewer:'',status:'pending_rectify',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:null,reviewedAt:null },
  { ticketId:'SP-XXXXX1313-ADAE',taskId:'T200-P111-xxxxxxxB',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:1,submitter:'紫航',rectifier:'孙锐',reviewer:'',status:'pending_rectify',rejectReason:'仅清理了地面垃圾，xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:null,reviewedAt:null },
  { ticketId:'RECT-20260529-001',taskId:'AI20260529-003',storeName:'京东电器--南京新街口店',issueCount:1,submitter:'AI系统',rectifier:'张三',reviewer:'',status:'pending_rectify',rejectReason:null,items:[],createdAt:'2026-05-29 09:35:48',rectifiedAt:null,reviewedAt:null,sourceType:'ai_inspection' },
  { ticketId:'RECT-20260529-003',taskId:'AI20260529-003',storeName:'京东电器--苏州观前街店',issueCount:1,submitter:'AI系统',rectifier:'张三',reviewer:'',status:'pending_rectify',rejectReason:null,items:[],createdAt:'2026-05-29 09:35:55',rectifiedAt:null,reviewedAt:null,sourceType:'ai_inspection' },
]

// ========== Mock: 待审核 ==========
const mockReviews: IssueTicket[] = [
  { ticketId:'SP-A',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:5,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'pending_review',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:null },
  { ticketId:'SP-B',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:2,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'pending_review',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:null },
  { ticketId:'SP-C',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:1,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'pending_review',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:null },
]

// ========== Mock: 已完成 ==========
const mockDones: IssueTicket[] = [
  { ticketId:'SP-D',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:3,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'completed',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:'xxxx-xx-xx xx:xx:xx' },
  { ticketId:'SP-E',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:1,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'completed',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:'xxxx-xx-xx xx:xx:xx' },
  { ticketId:'SP-F',taskId:'T200-P111-xxx',storeName:'xxx万达苏宁--xxx旗舰门店',issueCount:5,submitter:'紫航',rectifier:'孙锐',reviewer:'阿老师',status:'completed',rejectReason:null,items:[],createdAt:'xxxx-xx-xx xx:xx:xx',rectifiedAt:'xxxx-xx-xx xx:xx:xx',reviewedAt:'xxxx-xx-xx xx:xx:xx' },
]

// ========== 整改处理弹窗 ==========
const rectifyVisible = ref(false)
const rectifyTicket = ref<IssueTicket | null>(null)
const rectifyDescriptions = [
  '已通知相关人员进行垃圾处理，并进行绩效扣除',
  '已对该员工进行警告谈话，并记录在案',
  '货架商品已按陈列标准重新摆放，拍照存档',
  '已要求员工更换工服，纳入月度考核',
  '已安排替岗人员，并对脱岗员工进行处罚',
]
const allMockItems: IssueItem[] = [
  { itemId:'1',categoryName:'环境卫生',itemName:'地面是否整洁',problemDesc:'检测到xx区域有明显垃圾未处理！',inspectImages:[],rectifyDesc:'',rectifyImages:[] },
  { itemId:'2',categoryName:'行为准则',itemName:'上班是否手机',problemDesc:'检测到在xxx点时员工玩手机！',inspectImages:[],rectifyDesc:'',rectifyImages:[] },
  { itemId:'3',categoryName:'环境卫生',itemName:'货架是否整齐',problemDesc:'检测到货架商品摆放杂乱，未按规定陈列',inspectImages:[],rectifyDesc:'',rectifyImages:[] },
  { itemId:'4',categoryName:'仪容仪表',itemName:'工服是否穿戴',problemDesc:'检测到员工未穿戴统一工服',inspectImages:[],rectifyDesc:'',rectifyImages:[] },
  { itemId:'5',categoryName:'行为准则',itemName:'是否在岗',problemDesc:'检测到xxx时间段岗位无人值守',inspectImages:[],rectifyDesc:'',rectifyImages:[] },
]
const rectifyItems = ref<IssueItem[]>([])
const rectifyUploadFiles = reactive<Record<string, string[]>>({})
const uploadFileList = reactive<Record<string, any[]>>({})

const handleBeforeUpload = (file: any, itemId: string) => {
  if (!uploadFileList[itemId]) uploadFileList[itemId] = []
  const url = URL.createObjectURL(file)
  uploadFileList[itemId].push({ uid: Date.now().toString(), name: file.name, status: 'done', url, thumbUrl: url })
  // Sync to rectifyUploadFiles for status check
  if (!rectifyUploadFiles[itemId]) rectifyUploadFiles[itemId] = []
  rectifyUploadFiles[itemId].push(url)
  return false // Prevent auto upload
}
const handleRemoveUpload = (file: any, itemId: string) => {
  const idx = uploadFileList[itemId]?.findIndex((f: any) => f.uid === file.uid)
  if (idx > -1) {
    uploadFileList[itemId].splice(idx, 1)
    rectifyUploadFiles[itemId].splice(idx, 1)
  }
}

const openRectify = (ticket: IssueTicket) => {
  rectifyTicket.value = ticket
  rectifyItems.value = JSON.parse(JSON.stringify(allMockItems.slice(0, ticket.issueCount)))
  rectifyItems.value.forEach(item => {
    uploadFileList[item.itemId] = []
    rectifyUploadFiles[item.itemId] = []
  })
  rectifyVisible.value = true
}

const submitRectify = () => {
  const allFilled = rectifyItems.value.every(item => (item.rectifyDesc || '').trim() && (uploadFileList[item.itemId]?.length ?? 0) > 0)
  if (!allFilled) { message.warning('请完成所有检查项的整改说明和整改截图'); return }
  message.success('整改提交成功')
  rectifyVisible.value = false
}

const handleRectifyCancel = () => {
  const hasContent = rectifyItems.value.some(item => (item.rectifyDesc || '').trim() || (uploadFileList[item.itemId]?.length ?? 0) > 0)
  if (hasContent) {
    message.warning('您填写的内容尚未保存，确定要离开吗？')
  }
  rectifyVisible.value = false
}

// ========== 整改审核弹窗 ==========
const reviewVisible = ref(false)
const reviewTicket = ref<IssueTicket | null>(null)
const reviewItems = ref<IssueItem[]>([])
const reviewOpinion = ref('')

const openReview = (ticket: IssueTicket) => {
  reviewTicket.value = ticket
  reviewItems.value = allMockItems.slice(0, ticket.issueCount).map((item, idx) => ({ ...item, rectifyDesc: rectifyDescriptions[idx % rectifyDescriptions.length], rectifyImages: ['img1','img2'] }))
  reviewOpinion.value = ''
  reviewVisible.value = true
}

const approveReview = () => {
  message.success('审核通过')
  reviewVisible.value = false
}

const rejectReview = () => {
  if (!reviewOpinion.value.trim()) { message.warning('驳回须填写审核意见'); return }
  message.success('已驳回')
  reviewVisible.value = false
}

// ========== 查看详情弹窗 ==========
const detailVisible = ref(false)
const detailTicket = ref<IssueTicket | null>(null)
const timelineNodes = ref([
  { type:'found' as const, label:'发现问题', timestamp:'2015-09-01 11:11:11', operator:'孙巡检员', opinion:null },
  { type:'rectified' as const, label:'提交整改', timestamp:'2015-09-01 11:11:11', operator:'吕清洁员', opinion:null },
  { type:'rejected' as const, label:'审核驳回', timestamp:'2015-09-01 11:11:11', operator:'赵审核员', opinion:'仅清理了地面垃圾，未处理货架问题' },
  { type:'approved' as const, label:'审核通过', timestamp:'2015-09-01 11:11:11', operator:'赵审核员', opinion:'整改合格，地面确认已整洁' },
])

const openDetail = (ticket: IssueTicket) => {
  detailTicket.value = ticket
  reviewItems.value = allMockItems.slice(0, ticket.issueCount).map((item, idx) => ({ ...item, rectifyDesc: rectifyDescriptions[idx % rectifyDescriptions.length], rectifyImages: ['img1','img2'] }))
  detailVisible.value = true
}

// ========== 每页加载 10 条 mock 数据 ==========
const pendingCards = computed(() => Array.from({length:10}, (_, i) => ({ ...mockTasks[i % mockTasks.length], taskId: mockTasks[i % mockTasks.length].taskId.replace('A', String.fromCharCode(65+i)) })))
const rectifyCards = computed(() => Array.from({length:10}, (_, i) => ({ ...mockTickets[i % mockTickets.length], ticketId: mockTickets[i % mockTickets.length].ticketId.replace('ADAD', `AD${String.fromCharCode(65+i)}${String.fromCharCode(68+i)}`) })))
const reviewCards = computed(() => Array.from({length:10}, (_, i) => ({ ...mockReviews[i % mockReviews.length], ticketId: mockReviews[i % mockReviews.length].ticketId + i })))
const doneCards = computed(() => Array.from({length:10}, (_, i) => ({ ...mockDones[i % mockDones.length], ticketId: mockDones[i % mockDones.length].ticketId + i })))

// ========== 跳转在线巡检 ==========
const goExecute = (task: TodoTask) => {
  router.push(`/inspection/online/execute?taskId=${task.taskId}`)
}

// ========== 生成问题标签 ==========
const getIssueTag = (id: string) => `[${id}]`
</script>

<template>
  <div class="todo-page">
    <a-tabs v-model:activeKey="activeTab" class="todo-tabs">
      <a-tab-pane key="pending">
        <template #tab>
          <span>待执行<span class="tab-badge">({{ tabCounts.pending }})</span></span>
        </template>
      </a-tab-pane>
      <a-tab-pane key="rectify">
        <template #tab>
          <span>待整改<span class="tab-badge">({{ tabCounts.rectify }})</span></span>
        </template>
      </a-tab-pane>
      <a-tab-pane key="review">
        <template #tab>
          <span>待审核<span class="tab-badge">({{ tabCounts.review }})</span></span>
        </template>
      </a-tab-pane>
      <a-tab-pane key="done">
        <template #tab>
          <span>已完成<span class="tab-badge">({{ tabCounts.done }})</span></span>
        </template>
      </a-tab-pane>
    </a-tabs>

    <!-- 待执行卡片列表 -->
    <div v-if="activeTab === 'pending'" class="card-list">
      <div v-for="(t, i) in pendingCards" :key="i" class="todo-card card-pending">
        <div class="card-body">
          <div class="card-title-row">
            <div class="card-title-left">
              <div class="store-name">{{ t.storeName }}</div>
              <a-tag>{{ t.taskId }}</a-tag>
            </div>
            <div class="card-action">
              <a-button type="primary" @click="goExecute(t)">立即执行</a-button>
            </div>
          </div>
          <div class="card-info-row">
            <span class="info-item"><span class="info-label">巡检模板：</span>{{ t.templateName }}</span>
            <span class="info-item"><span class="info-label">巡检方式：</span>{{ t.method }}</span>
            <span class="info-item"><span class="info-label">执行人：</span>{{ t.executors.join('、') }}</span>
            <span class="info-item"><span class="info-label">生成时间：</span>{{ t.generatedAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 待整改卡片列表 -->
    <div v-if="activeTab === 'rectify'" class="card-list">
      <div v-for="(t, i) in rectifyCards" :key="i" class="todo-card card-rectify">
        <div class="card-body">
          <div class="card-title-row">
            <div class="card-title-left">
              <div class="store-name">{{ t.storeName }}</div>
              <div class="task-tags-line">
                <a-tag>{{ t.taskId }}</a-tag>
                <a-tag color="blue">{{ getIssueTag(t.ticketId) }}</a-tag>
                <a-tag color="red">问题数：{{ t.issueCount }}个</a-tag>
              </div>
            </div>
            <div class="card-action">
              <a-button style="background:#fa8c16;border-color:#fa8c16;color:#fff" @click="openRectify(t)">整改处理</a-button>
            </div>
          </div>
          <div class="card-info-row">
            <span class="info-item"><span class="info-label">巡检模板：</span>xxxx模板A</span>
            <span class="info-item"><span class="info-label">巡检方式：</span>{{ t.sourceType === 'ai_inspection' ? 'AI巡检' : '在线巡检' }}<a-tag v-if="t.sourceType === 'ai_inspection'" color="blue" size="small" style="margin-left:4px;font-size:10px">AI</a-tag></span>
            <span class="info-item"><span class="info-label">提交人：</span>{{ t.submitter }}</span>
            <span class="info-item"><span class="info-label">整改人：</span>{{ t.rectifier }}</span>
            <span class="info-item"><span class="info-label">生成时间：</span>{{ t.createdAt }}</span>
          </div>
          <a-alert v-if="t.rejectReason" type="error" show-icon style="margin-top:10px">
            <template #message>
              <span style="color:#ff4d4f">审核驳回原因: {{ t.rejectReason }}</span>
            </template>
          </a-alert>
        </div>
      </div>
    </div>

    <!-- 待审核卡片列表 -->
    <div v-if="activeTab === 'review'" class="card-list">
      <div v-for="(t, i) in reviewCards" :key="i" class="todo-card card-review">
        <div class="card-body">
          <div class="card-title-row">
            <div class="card-title-left">
              <div class="store-name">{{ t.storeName }}</div>
              <div class="task-tags-line">
                <a-tag>{{ t.taskId }}</a-tag>
                <a-tag color="blue">{{ getIssueTag(t.ticketId) }}</a-tag>
                <a-tag color="red">问题数：{{ t.issueCount }}个</a-tag>
              </div>
            </div>
            <div class="card-action">
              <a-button style="background:#52c41a;border-color:#52c41a;color:#fff" @click="openReview(t)">整改审核</a-button>
            </div>
          </div>
          <div class="card-info-row">
            <span class="info-item"><span class="info-label">巡检模板：</span>xxxx模板A</span>
            <span class="info-item"><span class="info-label">巡检方式：</span>{{ t.sourceType === 'ai_inspection' ? 'AI巡检' : '在线巡检' }}<a-tag v-if="t.sourceType === 'ai_inspection'" color="blue" size="small" style="margin-left:4px;font-size:10px">AI</a-tag></span>
            <span class="info-item"><span class="info-label">审核人：</span>{{ t.reviewer }}</span>
            <span class="info-item"><span class="info-label">整改时间：</span>{{ t.rectifiedAt || t.createdAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 已完成卡片列表 -->
    <div v-if="activeTab === 'done'" class="card-list">
      <div v-for="(t, i) in doneCards" :key="i" class="todo-card card-done">
        <div class="card-body">
          <div class="card-title-row">
            <div class="card-title-left">
              <div class="store-name">{{ t.storeName }}</div>
              <div class="task-tags-line">
                <a-tag>{{ t.taskId }}</a-tag>
                <a-tag color="blue">{{ getIssueTag(t.ticketId) }}</a-tag>
                <a-tag color="red">问题数：{{ t.issueCount }}个</a-tag>
              </div>
            </div>
            <div class="card-action">
              <a-button style="background:#722ed1;border-color:#722ed1;color:#fff" @click="openDetail(t)">查看详情</a-button>
            </div>
          </div>
          <div class="card-info-row">
            <span class="info-item"><span class="info-label">巡检模板：</span>xxxx模板A</span>
            <span class="info-item"><span class="info-label">巡检方式：</span>{{ t.sourceType === 'ai_inspection' ? 'AI巡检' : '在线巡检' }}<a-tag v-if="t.sourceType === 'ai_inspection'" color="blue" size="small" style="margin-left:4px;font-size:10px">AI</a-tag></span>
            <span class="info-item"><span class="info-label">审核人：</span>{{ t.reviewer }}</span>
            <span class="info-item"><span class="info-label">完成时间：</span>{{ t.reviewedAt || t.createdAt }}</span>
          </div>
          <div class="review-opinion-box">
            <CheckCircleOutlined class="ro-icon" />
            <span>审核意见：整改符合要求，审核通过</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <a-pagination :total="activeTab==='pending'?356:24" show-size-changer :show-total="(t: number) => `共 ${t} 条`" />
    </div>

    <!-- ========== 整改处理弹窗 ========== -->
    <a-modal v-model:open="rectifyVisible" title="整改处理" width="680px" :footer="null" :maskClosable="false">
      <div class="rm-scroll">
        <div v-for="(item, idx) in rectifyItems" :key="item.itemId" class="rm-card">
          <!-- 头部 -->
          <div class="rmc-head">
            <span class="rmc-title">{{ item.categoryName }} - {{ item.itemName }}</span>
            <a-tag :color="((item.rectifyDesc || '').trim() && (uploadFileList[item.itemId]?.length || 0) > 0) ? 'green' : 'orange'" class="rmc-tag">
              {{ ((item.rectifyDesc || '').trim() && (uploadFileList[item.itemId]?.length || 0) > 0) ? '已整改' : '待整改' }}
            </a-tag>
          </div>
          <!-- 问题详情 -->
          <div class="rmc-detail">
            <span class="rmc-label">问题描述：</span>{{ item.problemDesc }}
          </div>
          <div class="rmc-detail">
            <span class="rmc-label">巡检截图：</span>
            <span class="rmc-thumbs">
              <span class="rmc-thumb" v-for="n in (idx === 0 ? 3 : 1)" :key="n" title="点击查看大图"></span>
            </span>
          </div>
          <div class="rmc-divider"></div>
          <!-- 整改说明 -->
          <div class="rmc-field">
            <span class="rmc-label"><span class="rmc-required">*</span> 整改说明</span>
            <a-textarea v-model:value="item.rectifyDesc" :placeholder="(item.rectifyDesc || '').trim() ? '' : '请输入该问题的整改措施'" :rows="2" :maxlength="500" class="rmc-textarea" />
          </div>
          <!-- 整改截图 -->
          <div class="rmc-field">
            <span class="rmc-label"><span class="rmc-required">*</span> 整改截图</span>
            <a-upload
              :file-list="uploadFileList[item.itemId] || []"
              list-type="picture-card"
              :before-upload="(file: any) => handleBeforeUpload(file, item.itemId)"
              @remove="(file: any) => handleRemoveUpload(file, item.itemId)"
              class="rmc-upload-wrap"
            >
              <div v-if="(uploadFileList[item.itemId]?.length || 0) < 9" class="rmc-upload-btn">
                <span class="rmc-upload-plus">+</span>
                <span class="rmc-upload-text">上传</span>
              </div>
            </a-upload>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <a-button @click="handleRectifyCancel">取消</a-button>
        <a-button type="primary" danger @click="submitRectify" style="margin-left:12px">提交整改</a-button>
      </div>
    </a-modal>

    <!-- ========== 整改审核弹窗 ========== -->
    <a-modal v-model:open="reviewVisible" title="整改审核" width="700px" :footer="null">
      <div class="rv-scroll">
        <div v-for="item in reviewItems" :key="item.itemId" class="rv-card">
          <div class="rv-title">{{ item.categoryName }} - {{ item.itemName }}</div>
          <div class="rv-row"><span class="rv-label">问题描述：</span>{{ item.problemDesc }}</div>
          <div class="rv-row">
            <span class="rv-label">巡检截图：</span>
            <span class="rv-thumbs"><span class="rv-thumb" v-for="n in 3" :key="n"></span></span>
          </div>
          <div class="rv-divider"></div>
          <div class="rv-row">
            <span class="rv-label"><CheckCircleOutlined class="rv-check" /> 整改说明：</span>{{ item.rectifyDesc }}
          </div>
          <div class="rv-row">
            <span class="rv-label">整改截图：</span>
            <span class="rv-thumbs"><span class="rv-thumb" v-for="n in 2" :key="n"></span></span>
          </div>
        </div>
      </div>
      <div class="rv-opinion">
        <span class="rv-label"><span class="rmc-required">*</span> 审核意见：</span>
        <a-textarea v-model:value="reviewOpinion" placeholder="请填写整体审核意见" :rows="3" />
      </div>
      <div class="modal-footer">
        <a-button @click="reviewVisible = false">取消</a-button>
        <a-button danger @click="rejectReview" style="margin:0 12px">驳回整改</a-button>
        <a-button type="primary" style="background:#52c41a;border-color:#52c41a" @click="approveReview">审核通过</a-button>
      </div>
    </a-modal>

    <!-- ========== 查看详情弹窗 ========== -->
    <a-modal v-model:open="detailVisible" title="查看详情" width="700px" :footer="null">
      <!-- 流转时间轴 -->
      <div class="dt-timeline">
        <a-timeline>
          <a-timeline-item v-for="(node,idx) in timelineNodes" :key="idx" :color="node.type==='rejected'?'red':'blue'">
            <span class="dt-tl-time">{{ node.timestamp }}</span>
            <span class="dt-tl-action">{{ node.label }}</span>
            <span class="dt-tl-person">{{ node.operator }}</span>
            <div v-if="node.opinion" class="dt-tl-opinion">{{ node.opinion }}</div>
          </a-timeline-item>
        </a-timeline>
      </div>

      <!-- 整改明细 -->
      <div class="dt-section-title">整改明细（{{ reviewItems.length }}项）</div>
      <div class="dt-scroll">
        <div v-for="item in reviewItems" :key="item.itemId" class="dt-card">
          <div class="dt-card-title">{{ item.categoryName }} - {{ item.itemName }}</div>
          <div class="dt-divider"></div>
          <div class="dt-row">问题描述：{{ item.problemDesc }}</div>
          <div class="dt-row">
            巡检截图：
            <span class="dt-thumbs"><span class="dt-thumb" v-for="n in 3" :key="n"></span></span>
          </div>
          <div class="dt-divider"></div>
          <div class="dt-row">
            <CheckCircleOutlined class="rv-check" /> 整改说明：{{ item.rectifyDesc }}
          </div>
          <div class="dt-row">
            整改截图：
            <span class="dt-thumbs"><span class="dt-thumb" v-for="n in 1" :key="n"></span></span>
          </div>
        </div>
      </div>

      <!-- 审核意见 -->
      <div class="dt-opinion">
        <span class="rmc-required">*</span> 审核意见：整改合格，地面确认已整洁，相关人员已确认惩罚。
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { h } from 'vue'
export default { name: 'TodoPage' }
</script>

<style scoped>
.todo-page { background: #f5f5f5; min-height: 100%; }
.todo-tabs :deep(.ant-tabs-nav) { margin-bottom: 16px; padding: 0 24px; background: #fff; border-radius: 6px; }
.tab-badge { color: #999; font-size: 12px; }

/* 卡片通用 */
.card-list { display: flex; flex-direction: column; gap: 12px; }
.todo-card {
  background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 12px; transition: box-shadow .2s;
}
.todo-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.card-body { padding: 16px 20px; }

/* 待执行卡片 - 蓝色左边框 */
.card-pending { border-left: 4px solid #409EFF; }

/* 标题行：左标题 / 右按钮 */
.card-title-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.card-title-left { flex: 1; min-width: 0; }
.store-name { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 0; }
/* 待执行中 tag 紧跟标题下方的间距 */
.card-title-left > .ant-tag { margin-top: 6px; }
.card-action { flex-shrink: 0; padding-left: 24px; }

/* 信息行：space-between 分布 */
.card-info-row {
  display: flex; justify-content: space-between; flex-wrap: wrap;
  gap: 8px 16px;
}
.info-item { font-size: 13px; color: #999; white-space: nowrap; }
.info-label { color: #bbb; }

/* 待整改 - 橙色左边框 */
.card-rectify { border-left: 4px solid #fa8c16; }

/* 标签行（待整改/待审核/已完成 - 在card-title-left内部） */
.task-tags-line { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

/* 审核意见框（已完成卡片-紫色alert风格） */
.review-opinion-box {
  background: #f9f0ff; border: 1px solid #d3adf7; border-radius: 6px;
  padding: 10px 16px; font-size: 13px; color: #722ed1;
  display: flex; align-items: flex-start; gap: 8px; margin-top: 10px;
}
.ro-icon { font-size: 14px; flex-shrink: 0; color: #722ed1; }

/* 待审核 - 绿色左边框 */
.card-review { border-left: 4px solid #52c41a; }
/* 已完成 - 紫色左边框 */
.card-done { border-left: 4px solid #722ed1; }

/* 分页 */
.pagination-wrap { display: flex; justify-content: center; padding: 24px; }

/* ========== 整改处理弹窗 ========== */
.rm-scroll { max-height: 60vh; overflow-y: auto; padding-right: 4px; }
.rm-card { background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; padding: 16px; margin-bottom: 12px; }
.rmc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rmc-title { font-size: 15px; font-weight: 600; color: #333; }
.rmc-tag { margin: 0; }
.rmc-detail { font-size: 13px; color: #666; margin-bottom: 8px; line-height: 1.6; }
.rmc-label { font-weight: 500; color: #555; }
.rmc-thumbs { display: inline-flex; gap: 6px; vertical-align: middle; }
.rmc-thumb { width: 48px; height: 48px; border: 1px solid #e8e8e8; border-radius: 4px; background: #fafafa; display: inline-block; cursor: pointer; }
.rmc-thumb:hover { border-color: #1890ff; }
.rmc-divider { height: 1px; background: #f0f0f0; margin: 10px 0; }
.rmc-field { display: flex; align-items: flex-start; margin-bottom: 8px; }
.rmc-field .rmc-label { flex-shrink: 0; width: 72px; font-size: 13px; color: #555; padding-top: 5px; }
.rmc-textarea { flex: 1; }
.rmc-upload-wrap { flex: 1; }
.rmc-required { color: #ff4d4f; margin-right: 2px; }
.rmc-upload-btn { width: 80px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; }
.rmc-upload-plus { font-size: 24px; line-height: 1; }
.rmc-upload-text { font-size: 12px; margin-top: 2px; }

.modal-footer { display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #f0f0f0; }

/* ========== 整改审核弹窗 ========== */
.rv-scroll { max-height: 55vh; overflow-y: auto; padding-right: 4px; }
.rv-card { background: #f5f7fa; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px; }
.rv-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e8e8e8; }
.rv-row { font-size: 13px; color: #666; margin-bottom: 8px; line-height: 1.6; }
.rv-label { color: #555; }
.rv-check { color: #52c41a; font-size: 14px; margin-right: 2px; }
.rv-thumbs { display: inline-flex; gap: 6px; vertical-align: middle; }
.rv-thumb { width: 48px; height: 48px; border: 1px solid #e8e8e8; border-radius: 4px; background: #fff; display: inline-block; }
.rv-divider { height: 1px; background: #e8e8e8; margin: 8px 0; }
.rv-opinion { margin-top: 12px; }
.rv-opinion .rv-label { display: block; margin-bottom: 6px; font-size: 13px; color: #555; }

/* ========== 查看详情弹窗 ========== */
.dt-timeline { padding: 12px 16px; background: #f5f7fa; border-radius: 6px; margin-bottom: 16px; }
.dt-tl-time { font-size: 12px; color: #999; margin-right: 8px; }
.dt-tl-action { font-size: 13px; font-weight: 600; color: #333; margin-right: 4px; }
.dt-tl-person { font-size: 13px; color: #666; }
.dt-tl-opinion { font-size: 13px; color: #ff4d4f; }
.dt-section-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.dt-scroll { max-height: 40vh; overflow-y: auto; padding-right: 4px; }
.dt-card { background: #f5f7fa; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px; }
.dt-card-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
.dt-divider { height: 1px; background: #e8e8e8; margin: 8px 0; }
.dt-row { font-size: 13px; color: #666; margin-bottom: 6px; line-height: 1.6; }
.dt-thumbs { display: inline-flex; gap: 6px; vertical-align: middle; }
.dt-thumb { width: 48px; height: 48px; border: 1px solid #e8e8e8; border-radius: 4px; background: #fff; display: inline-block; }
.dt-opinion { font-size: 13px; color: #333; padding: 12px 0 0; }
</style>
