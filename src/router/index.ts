import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/workbench',
      children: [
        { path: 'workbench', name: 'Workbench', component: () => import('@/views/Workbench.vue'), meta: { title: '工作台' } },
        { path: 'inspection/templates', name: 'InspectionTemplate', component: () => import('@/views/InspectionTemplate.vue'), meta: { title: '巡检模板' } },
        { path: 'inspection/items', name: 'InspectionItemLibrary', component: () => import('@/views/InspectionItemLibrary.vue'), meta: { title: '基础问题库' } },
        { path: 'inspection/plan-config', name: 'InspectionPlanConfig', component: () => import('@/views/InspectionPlanConfig.vue'), meta: { title: '巡检计划配置' } },
        { path: 'inspection/task-list', name: 'InspectionTaskList', component: () => import('@/views/InspectionTaskList.vue'), meta: { title: '巡检任务清单' } },
        // 日常巡检
        { path: 'inspection/online', name: 'InspectionStoreList', component: () => import('@/views/InspectionStoreList.vue'), meta: { title: '在线巡检' } },
        { path: 'inspection/online/execute', name: 'InspectionExecution', component: () => import('@/views/InspectionExecution.vue'), meta: { title: '在线巡检执行' } },
        { path: 'inspection/spot-check', name: 'SpotCheckStoreList', component: () => import('@/views/SpotCheckStoreList.vue'), meta: { title: '视频点检' } },
        { path: 'inspection/spot-check/execute', name: 'SpotCheckExecution', component: () => import('@/views/SpotCheckExecution.vue'), meta: { title: '视频点检执行' } },
        // 视频点检记录
        { path: 'inspection/spot-check-records', name: 'VideoSpotCheckRecords', component: () => import('@/views/VideoSpotCheckRecords.vue'), meta: { title: '视频点检记录' } },
        // 待办事项
        { path: 'inspection/todos', name: 'TodoPage', component: () => import('@/views/TodoPage.vue'), meta: { title: '待办事项' } },
        // AI巡检
        { path: 'inspection/ai/tasks', name: 'AIInspectionTask', component: () => import('@/views/ai-inspection/AIInspectionTask.vue'), meta: { title: 'AI巡检任务' } },
        { path: 'inspection/ai/results', name: 'AIAnalysisResult', component: () => import('@/views/ai-inspection/AIAnalysisResult.vue'), meta: { title: 'AI分析结果' } },
        // 视频广场
        { path: 'video-square', name: 'VideoSquare', component: () => import('@/views/video-square/VideoSquare.vue'), meta: { title: '视频广场' } },
        // 告警中心
        { path: 'alert-center', name: 'AlertCenter', component: () => import('@/views/alert-center/index.vue'), meta: { title: '告警中心' } },
        // 设备管理
        { path: 'device/management', name: 'DeviceManagement', component: () => import('@/views/device-management/index.vue'), meta: { title: '设备管理' } },
        // 云广播
        { path: 'cloud-broadcast/realtime', name: 'RealTimeBroadcast', component: () => import('@/views/cloud-broadcast/RealTimeBroadcast.vue'), meta: { title: '实时广播' } },
        { path: 'cloud-broadcast/scheduled', name: 'ScheduledBroadcast', component: () => import('@/views/cloud-broadcast/ScheduledBroadcast.vue'), meta: { title: '定时广播' } },
        { path: 'cloud-broadcast/event', name: 'EventBroadcast', component: () => import('@/views/cloud-broadcast/EventBroadcast.vue'), meta: { title: '事件广播' } },
        { path: 'cloud-broadcast/records', name: 'BroadcastRecords', component: () => import('@/views/cloud-broadcast/BroadcastRecords.vue'), meta: { title: '广播记录' } },
        { path: 'cloud-broadcast/media', name: 'MediaLibrary', component: () => import('@/views/cloud-broadcast/MediaLibrary.vue'), meta: { title: '媒体资源库' } },
        // 系统管理
        { path: 'system/management', name: 'SystemManagement', component: () => import('@/views/system-management/index.vue'), meta: { title: '系统管理' } },
        { path: 'system/nav-management', name: 'NavManagement', component: () => import('@/views/nav-management/index.vue'), meta: { title: '导航管理' } },
      ],
    },
  ],
})

export default router
