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

// ========== AI巡检 - 抓拍计划 ==========
export interface SnapshotPeriod {
  start: string   // HH:mm
  end: string     // HH:mm
}

export interface SnapshotPlan {
  id: string
  name: string
  validFrom: string
  validUntil: string
  snapshotPeriods: SnapshotPeriod[]
  frequency: number            // 抓拍频率（分钟）：15/30/60
  cycleDays: number[]          // 执行周期：1-7 周一至周日
  deviceIds: string[]
  deviceNames: string[]
  status: 'active' | 'paused' | 'expired'
  creator: string
  createdAt: string
  updatedAt: string
}

// ========== AI巡检 - AI巡检任务 ==========
export interface AIInspectionTask {
  id: string
  name: string
  taskNo: string
  planId: string
  planName: string
  validFrom: string
  validUntil: string
  algorithmIds: string[]
  algorithmNames: string[]
  cycleDays: number[]
  autoCreateTicket: boolean
  assigneeId: string | null
  assigneeName: string | null
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
