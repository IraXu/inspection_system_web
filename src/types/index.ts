// ========== 巡检分类 ==========
export interface InspectionCategory {
  id: string
  name: string
}

// ========== 巡检项 ==========
export interface InspectionItem {
  id: string
  name: string
  categoryId: string
  categoryName: string
  enabled: boolean
  linkedTemplate: boolean
  description: string
  images: string[]
}

// ========== 巡检模板 ==========
export interface InspectionTemplate {
  id: string
  name: string
  enabled: boolean
  description: string
  creator: string
  createdAt: string
  selectedCategoryIds: string[]
  selectedItemIds: string[]
}

// ========== 巡检计划 ==========
export interface StorePersonnelTemplate {
  key: string
  storeId: string
  storeName: string
  personnelIds: string[]
  personnelNames: string[]
  templateId: string
  templateName: string
}

export interface InspectionPlan {
  id: string
  name: string
  status: 'not_started' | 'in_progress' | 'ended'
  inspectionMode: 'online' | 'offline'
  description: string
  cycleMode: 'once' | 'cycle'
  cycleType?: 'daily' | 'weekly' | 'monthly'
  cycleDays?: number[]           // weekly: 1-7, monthly: 1-31
  executionTime?: string         // HH:mm
  validUntil?: string
  duration?: string
  storesPersonnelTemplates: StorePersonnelTemplate[]
  creator: string
  createdAt: string
  updatedAt: string
}

// ========== 巡检任务 ==========
export interface InspectionTask {
  id: string
  taskNo: string
  executionTime: string
  storeName: string
  plannedPersonnel: string       // 计划巡检人
  planCreator: string            // 计划创建人
  templateName: string           // 巡检模版
  inspectionMode: string         // 巡检方式
  relatedPlan: string            // 关联计划
  planStatus: string             // 计划状态
  pushTime: string               // 任务推送时间
  pushStatus: string             // 推送状态
  executionStatus: 'pending' | 'executing' | 'executed'
  validUntil: string             // 任务有效期
  actualPersonnel: string        // 实际巡检人
  inspectionNo: string           // 巡检编号
  inspectionTime: string         // 巡检时间
  issueStatus: string            // 问题单状态
  issueCount: number             // 需整改问题数
  resolvedIssueCount: number     // 整改完成问题数
}

// ========== 待办事项 ==========
export interface TodoTask {
  taskId: string
  storeName: string
  templateName: string
  method: string                 // 在线巡检 / 视频点检 / AI巡检
  executors: string[]
  generatedAt: string
}

export interface IssueItem {
  itemId: string
  categoryName: string
  itemName: string
  problemDesc: string
  inspectImages: string[]
  rectifyDesc: string | null
  rectifyImages: string[]
}

export interface IssueTicket {
  ticketId: string
  taskId: string
  storeName: string
  issueCount: number
  submitter: string
  rectifier: string
  reviewer: string
  status: 'pending_rectify' | 'pending_review' | 'completed'
  rejectReason: string | null
  items: IssueItem[]
  createdAt: string
  rectifiedAt: string | null
  reviewedAt: string | null
  sourceType?: string            // 'ai_inspection' | undefined（AI巡检来源标记）
}

export interface TimelineNode {
  type: 'found' | 'rectified' | 'approved' | 'rejected'
  label: string
  timestamp: string
  operator: string
  opinion: string | null
}

// ========== 日常巡检 ==========
export interface InspectionStore {
  storeId: string
  storeName: string
  regionId: string
  regionName: string
  hasDevice: boolean
  pendingTaskCount: number
  taskId?: string                // 最近待执行任务ID
}

export interface RegionNode {
  key: string
  title: string
  children?: RegionNode[]
}

export interface InspectionResult {
  itemId: string
  categoryName: string
  itemName: string
  problemDesc: string
  standard: string
  result: 'pass' | 'fail'
  screenshots: string[]
}

export interface InspectionSession {
  taskId: string
  storeId: string
  storeName: string
  templateName: string
  templateId: string
  cameraIds: string[]
  items: InspectionResult[]
}

export interface SpotCheckSession {
  storeId: string
  storeName: string
  templateId: string | null
  cameraIds: string[]
  assigneeId: string | null
  items: InspectionResult[]
}

// ========== 视频点检记录 ==========
export interface RecordDetail {
  itemId: string
  itemName: string
  categoryName: string
  result: 'pass' | 'fail'
  problemDesc: string
  standard: string
  standardImages: string[]
  screenshots: string[]
}

export interface SpotCheckRecord {
  id: string
  inspectionNo: string           // 点检编号
  storeId: string
  storeName: string
  regionPath: string[]
  templateId: string
  templateName: string
  method: 'online' | 'spot'     // 在线巡检 / 视频点检
  executor: string
  executedAt: string
  totalItems: number
  qualifiedCount: number
  unqualifiedCount: number
  screenshotCount: number
  issueId: string | null
  issueStatus: 'none' | 'pending' | 'rectifying' | 'completed'
  assignee?: string
  details: RecordDetail[]
}

// ========== AI巡检 - 抓拍计划（已废弃，合并至 AIInspectionTask）==========
// 保留类型以兼容，新功能请使用 AIInspectionTask

// ========== 导航管理 ==========
export interface NavItem {
  id: string
  parentId: string | null
  label: string
  icon: string
  routePath: string
  sortOrder: number
  visible: boolean
  description: string            // 导航描述
  openMode: 'inner' | 'blank'   // 打开方式
  permission: string             // 权限标识
  navType: 'dir' | 'menu' | 'action' | 'url'  // 导航类型
}

// ========== AI巡检 - AI巡检任务（含抓拍配置）==========
export interface AIInspectionTask {
  id: string
  name: string
  taskNo: string
  validFrom: string
  validUntil: string
  // 抓拍配置
  snapshotStart: string         // HH:mm 抓拍开始时间
  snapshotEnd: string           // HH:mm 抓拍结束时间
  frequency: number             // 抓拍频率（分钟）：5~30
  cycleDays: number[]           // 执行周期：1-7 周一至周日
  deviceIds: string[]
  deviceNames: string[]
  // AI分析配置
  algorithmIds: string[]
  algorithmNames: string[]
  confidenceThreshold: number    // 置信度阈值（0-100），AI分析检测项置信度≥此值才会告警
  autoCreateTicket: boolean
  assigneeId: string | null
  assigneeName: string | null
  // 状态
  status: 'active' | 'paused' | 'completed'
  creator: string
  createdAt: string
  updatedAt: string
}

// ========== AI巡检 - AI分析结果 ==========
export interface AIProblem {
  id: string
  description: string
  deviceName: string
  capturedAt: string
  aiDetail: string
  imageUrls: string[]
  status: 'pending_rectify' | 'rectified' | 'ignored' | 'closed' | 'pending'
  ticketId: string | null
  autoTicket: boolean
}

export interface AIAnalysisResult {
  id: string
  taskId: string
  taskName: string
  taskNo: string
  autoCreateTicket: boolean
  totalImages: number
  problemCount: number
  passRate: number
  problems: AIProblem[]
  qualifiedImages: number
  orgName: string
  analyzedAt: string
}

// ========== 视频广场 ==========
export interface VideoDevice {
  id: string
  name: string
  online: boolean
  regionPath: string[]
  capabilities: {
    ptz: boolean
    intercom: boolean
    light: boolean
  }
  streamType: 'main' | 'sub'
  snapshot: string
}

export interface VideoGridCell {
  deviceId: string | null
  deviceName: string
  status: 'empty' | 'connecting' | 'connected' | 'error'
  paused: boolean
  muted: boolean
  flipped: boolean
  streamType: 'main' | 'sub'
  isRecording: boolean
  recordDuration: number
}

export interface PatrolScheme {
  name: string
  deviceIds: string[]
  duration: number
}

export interface RecordingSegment {
  start: number
  end: number
  label: string
}

