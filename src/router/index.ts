/*
 * @Author: AloofXu
 * @Date: 2026-05-25 18:24:27
 * @LastEditors: null
 * @LastEditTime: 2026-06-04 16:21:49
 * @FilePath: /web-prototype/src/router/index.ts
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
        // 待办事项
        { path: 'inspection/todos', name: 'TodoPage', component: () => import('@/views/TodoPage.vue'), meta: { title: '待办事项' } },
        // AI巡检
        { path: 'inspection/ai/tasks', name: 'AIInspectionTask', component: () => import('@/views/ai-inspection/AIInspectionTask.vue'), meta: { title: 'AI巡检任务' } },
        { path: 'inspection/ai/results', name: 'AIAnalysisResult', component: () => import('@/views/ai-inspection/AIAnalysisResult.vue'), meta: { title: 'AI分析结果' } },
        // 视频广场
        { path: 'video-square', name: 'VideoSquare', component: () => import('@/views/video-square/VideoSquare.vue'), meta: { title: '视频广场' } },
      ],
    },
  ],
})

export default router
