<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuProps } from 'antdv-next'
import { DownOutlined, BankOutlined, LogoutOutlined, CheckOutlined, SlackOutlined, XFilled, FundFilled, VideoCameraFilled, CloudServerOutlined, DeploymentUnitOutlined, AlertFilled, NotificationOutlined } from '@antdv-next/icons'
import touxiangImg from '@/assets/touxiang.jpg'

const router = useRouter()
const route = useRoute()

// 企业列表
interface Enterprise {
  id: string
  name: string
  role: string // 当前用户在该企业的角色
}
const enterprises: Enterprise[] = [
  { id: 'ent-1', name: '南京Dream信息技术有限公司', role: '系统管理员' },
  { id: 'ent-2', name: '上海星辰科技有限公司', role: '区域经理' },
  { id: 'ent-3', name: '北京云创科技股份公司', role: '门店店长' },
]
const currentEnterprise = ref(enterprises[0])
const enterpriseVisible = ref(false)

const switchEnterprise = (ent: Enterprise) => {
  currentEnterprise.value = ent
  enterpriseVisible.value = false
}

// 当前用户信息
interface CurrentUser {
  account: string
  name: string
  avatar: string
}
const currentUser: CurrentUser = {
  account: 'zhangwei@dreamtech.com',
  name: '🫏建成',
  avatar: touxiangImg,
}

const userMenuClick: MenuProps['onClick'] = ({ key }) => {
  if (key === 'logout') {
    // 退出登录逻辑
    console.log('退出登录')
  }
}

// 只保留有子菜单的模块
interface SubMenuItem { key: string; label: string }
interface MenuGroup { key: string; label: string; icon: any; children: SubMenuItem[] }
interface DirectItem { key: string; label: string; icon: any }
interface PrimaryItem { key: string; icon: any; label: string; groups: MenuGroup[]; routePrefix: string; directItems?: DirectItem[] }

const primaryItems: PrimaryItem[] = [
  {
    key: 'workbench', icon: FundFilled, label: '工作台', routePrefix: '/workbench',
    groups: [],
    directItems: [
      { key: '/workbench', label: '工作台', icon: FundFilled },
    ],
  },
  {
    key: 'video-square', icon: VideoCameraFilled, label: '视频广场', routePrefix: '/video-square',
    groups: [],
    directItems: [
      { key: '/video-square', label: '视频广场', icon: VideoCameraFilled },
    ],
  },
  {
    key: 'alert-center', icon: AlertFilled, label: '告警中心', routePrefix: '/alert-center',
    groups: [],
    directItems: [
      { key: '/alert-center', label: '告警中心', icon: AlertFilled },
    ],
  },
  {
    key: 'device-management', icon: CloudServerOutlined, label: '设备管理', routePrefix: '/device',
    groups: [],
    directItems: [
      { key: '/device/management', label: '设备管理', icon: CloudServerOutlined },
    ],
  },
  {
    key: 'smart-inspection', icon: SlackOutlined, label: '智慧巡检', routePrefix: '/inspection',
    groups: [
      { key: 'inspection-template-group', label: '巡检模板', icon: XFilled, children: [
        { key: '/inspection/items', label: '基础问题库' },
        { key: '/inspection/templates', label: '巡检模板' },
      ]},
      { key: 'inspection-plan-group', label: '巡检计划', icon: XFilled, children: [
        { key: '/inspection/plan-config', label: '巡检计划配置' },
        { key: '/inspection/task-list', label: '巡检任务清单' },
      ]},
      { key: 'daily-inspection-group', label: '日常巡检', icon: XFilled, children: [
        { key: '/inspection/online', label: '在线巡检' },
        { key: '/inspection/spot-check', label: '视频点检' },
        { key: '/inspection/spot-check-records', label: '视频点检记录' },
      ]},
      { key: 'ai-inspection-group', label: 'AI巡检', icon: XFilled, children: [
        { key: '/inspection/ai/tasks', label: 'AI巡检任务' },
        { key: '/inspection/ai/results', label: 'AI分析结果' },
      ]},
    ],
    directItems: [
      { key: '/inspection/todos', label: '待办事项', icon: XFilled },
    ],
  },
  {
    key: 'cloud-broadcast', icon: NotificationOutlined, label: '云广播', routePrefix: '/cloud-broadcast',
    groups: [
      { key: 'cb-broadcast-group', label: '广播管理', icon: XFilled, children: [
        { key: '/cloud-broadcast/realtime', label: '实时广播' },
        { key: '/cloud-broadcast/scheduled', label: '定时广播' },
        { key: '/cloud-broadcast/event', label: '事件广播' },
        { key: '/cloud-broadcast/records', label: '广播记录' },
      ]},
      { key: 'cb-resource-group', label: '广播资源', icon: XFilled, children: [
        { key: '/cloud-broadcast/media', label: '媒体资源库' },
      ]},
    ],
  },
  {
    key: 'system-management', icon: DeploymentUnitOutlined, label: '系统管理', routePrefix: '/system',
    groups: [],
    directItems: [
      { key: '/system/organization', label: '组织架构', icon: XFilled },
      { key: '/system/members', label: '企业成员', icon: XFilled },
      { key: '/system/roles', label: '角色管理', icon: XFilled },
      { key: '/system/logs', label: '系统日志', icon: XFilled },
      { key: '/system/enterprise-center', label: '企业中心', icon: XFilled },
    ],
  },
  /*
  {
    key: 'nav-management', icon: UnorderedListOutlined, label: '导航管理', routePrefix: '/system/nav-management',
    groups: [],
    directItems: [
      { key: '/system/nav-management', label: '导航管理', icon: UnorderedListOutlined },
    ],
  },
  */
]

const activePrimary = ref(primaryItems[0].key)
const currentPrimary = computed(() => primaryItems.find(p => p.key === activePrimary.value)!)
const showSecondary = computed(() => !(currentPrimary.value.groups.length === 0 && currentPrimary.value.directItems && currentPrimary.value.directItems.length === 1))
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

watch(() => route.path, (path) => {
  selectedKeys.value = [path]
  // 按 routePrefix 长度降序匹配，确保 /system/nav-management 优先于 /system
  const sorted = [...primaryItems].sort((a, b) => b.routePrefix.length - a.routePrefix.length)
  for (const p of sorted) {
    if (path.startsWith(p.routePrefix)) {
      activePrimary.value = p.key
      openKeys.value = p.groups.filter(g => g.children.some(c => c.key === path)).map(g => g.key)
      break
    }
  }
}, { immediate: true })

const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
  if (key.startsWith('/')) router.push(key)
}

// 点击一级菜单：无二级菜单的项直接跳转，否则展开二级菜单并跳到第一个子页面
const handlePrimaryClick = (item: PrimaryItem) => {
  if (item.groups.length === 0 && item.directItems && item.directItems.length === 1) {
    router.push(item.directItems[0].key)
    return
  }
  activePrimary.value = item.key
  if (item.directItems && item.directItems.length > 0) {
    router.push(item.directItems[0].key)
  } else if (item.groups.length > 0 && item.groups[0].children.length > 0) {
    router.push(item.groups[0].children[0].key)
  }
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <!-- 顶部导航栏：横跨全宽 -->
    <a-layout-header class="top-header">
      <div class="header-left">
        <img src="/logo.png" class="header-logo" />
        <span class="system-name">智慧巡检管理系统</span>
      </div>
      <div class="header-right">
        <!-- 企业切换下拉：Popover（自定义内容无需 menu） -->
        <a-popover v-model:open="enterpriseVisible" trigger="click" placement="bottomRight"
          :arrow="false" overlay-class-name="ent-popover-overlay"
          :overlay-style="{ maxWidth: '260px' }">
          <a-button class="enterprise-btn">
            <template #icon><BankOutlined style="color:#1677ff" /></template>
            <span class="ent-btn-text">{{ currentEnterprise.name }}</span>
            <DownOutlined class="ent-btn-arrow" />
          </a-button>
          <template #content>
            <div class="ent-dropdown">
              <div
                v-for="ent in enterprises"
                :key="ent.id"
                class="ent-dropdown-item"
                :class="{ active: ent.id === currentEnterprise.id }"
                @click="switchEnterprise(ent)"
              >
                <div class="ent-item-info">
                  <span class="ent-item-name">{{ ent.name }}</span>
                  <span class="ent-item-role">{{ ent.role }}</span>
                </div>
                <CheckOutlined v-if="ent.id === currentEnterprise.id" class="ent-item-check" />
              </div>
            </div>
          </template>
        </a-popover>

        <!-- 用户头像下拉 -->
        <a-dropdown :trigger="['click']" placement="bottomRight" overlay-class-name="user-dropdown-overlay"
          :menu="{ items: [] }">
          <template #popupRender>
            <div class="user-dropdown">
              <span class="user-dd-name">{{ currentUser.name }}</span>
              <a-tag color="blue" class="user-dd-tag">{{ currentEnterprise.role }}</a-tag>
              <div class="user-dd-divider"></div>
              <div class="user-dd-logout" @click="userMenuClick({ key: 'logout' } as any)">
                <LogoutOutlined />
                <span>退出当前账号</span>
              </div>
            </div>
          </template>
          <span class="user-avatar-wrap"><a-avatar :size="34" :src="currentUser.avatar" class="user-avatar" /></span>
        </a-dropdown>
      </div>
    </a-layout-header>

    <!-- 下方：侧边栏 + 内容区 -->
    <a-layout>
    <!-- 一级菜单（窄列，72px） -->
    <a-layout-sider width="72" theme="light" class="nav-primary" :trigger="null">
      <div class="np-items">
        <div v-for="item in primaryItems" :key="item.key"
          class="np-item" :class="{ active: activePrimary === item.key }"
          @click="handlePrimaryClick(item)">
          <component :is="item.icon" class="np-icon" />
          <span class="np-label">{{ item.label }}</span>
        </div>
      </div>
    </a-layout-sider>

    <!-- 二级菜单（宽列，200px），单页菜单隐藏 -->
    <a-layout-sider v-if="showSecondary" width="200" theme="light" class="nav-secondary" :trigger="null">
      <a-menu mode="inline" :selected-keys="selectedKeys" :open-keys="openKeys"
        @click="handleMenuClick" @update:openKeys="(ks: string[]) => openKeys = ks" class="ns-menu">
        <a-sub-menu v-for="g in currentPrimary.groups" :key="g.key">
          <template #title>
            <component :is="g.icon" />
            <span>{{ g.label }}</span>
          </template>
          <a-menu-item v-for="c in g.children" :key="c.key">{{ c.label }}</a-menu-item>
        </a-sub-menu>
        <a-menu-item v-for="d in currentPrimary.directItems" :key="d.key">
          <component :is="d.icon" />
          <span>{{ d.label }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容区 -->
    <a-layout>
      <a-layout-content class="content-area">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</a-layout>
</template>

<style scoped>
/* ====== 一级菜单：72px ====== */
.nav-primary { display:flex; flex-direction:column; border-right:1px solid #f0f0f0; }
.nav-primary :deep(.ant-layout-sider-children) { display:flex; flex-direction:column; }
.np-logo { display:flex; align-items:center; justify-content:center; height:48px; border-bottom:1px solid #f0f0f0; }
.np-logo-img { width:30px; height:30px; border-radius:6px; object-fit:contain; }
.np-items { flex:1; padding:4px 0; display:flex; flex-direction:column; }
.np-item { display:flex; flex-direction:column; align-items:center; justify-content:center; height:52px; margin:4px 6px; border-radius:10px; cursor:pointer; color:#999; transition:all .2s; gap:3px; position:relative; }
.np-item:hover { color:#1677ff; background:#f0f5ff; }
.np-item.active { color:#1677ff; background:#e6f4ff; font-weight:500; }
.np-icon { font-size:20px; }
.np-label { font-size:10px; line-height:1; white-space:nowrap; }

/* ====== 二级菜单：200px ====== */
.nav-secondary { display:flex; flex-direction:column; border-right:1px solid #f0f0f0; background:#fafbfc; }
.nav-secondary :deep(.ant-layout-sider-children) { display:flex; flex-direction:column; }
.ns-menu { flex:1; border:none!important; background:transparent!important; padding:8px 6px; }
.ns-menu :deep(.ant-menu-submenu-title) { font-size:13px!important; font-weight:500!important; color:#333!important; height:36px!important; line-height:36px!important; border-radius:6px!important; margin:1px 0!important; padding-left:16px!important; }
.ns-menu :deep(.ant-menu-submenu-title:hover) { background:#e6f4ff!important; color:#1677ff!important; }
.ns-menu :deep(.ant-menu-submenu.ant-menu-submenu-open > .ant-menu-submenu-title) { color:#1677ff!important; }
.ns-menu :deep(.ant-menu-sub .ant-menu-item) { font-size:13px!important; color:#666!important; height:32px!important; line-height:32px!important; padding-left:40px!important; margin:1px 4px!important; border-radius:6px!important; }
.ns-menu :deep(.ant-menu-sub .ant-menu-item:hover) { background:#e6f4ff!important; color:#1677ff!important; }
.ns-menu :deep(.ant-menu-sub .ant-menu-item.ant-menu-item-selected) { background:#e6f4ff!important; color:#1677ff!important; font-weight:500; }
.ns-menu :deep(.ant-menu-sub) { background:transparent!important; }

/* 二级菜单标题图标 */
.ns-menu :deep(.ant-menu-submenu-title .anticon) { font-size:14px!important; color:#1677ff!important; margin-right:8px!important; }
.ns-menu :deep(.ant-menu-item .anticon) { font-size:14px!important; color:#999!important; margin-right:8px!important; }

/* ====== 顶栏 + 内容 ====== */
.top-header { background:#fff; padding:0 24px; display:flex; justify-content:space-between; align-items:center; height:48px; line-height:48px; border-bottom:1px solid #f0f0f0; }
.header-left { display:flex; align-items:center; gap:10px; }
.header-logo { width:28px; height:28px; border-radius:6px; object-fit:contain; }
.system-name { font-size:14px; font-weight:600; color:#1a1a1a; }
.header-right { display:flex; align-items:center; gap:12px; }

/* 企业切换按钮：胶囊样式 */
.enterprise-btn {
  display:inline-flex;
  align-items:center;
  gap:6px;
  height:34px;
  padding:0 14px;
  border-radius:20px;
  border:1px solid #e8e8e8;
  background:#fff;
  box-shadow:none;
  font-size:13px;
  color:#333;
  cursor:pointer;
  transition:all .2s;
}
.enterprise-btn:hover {
  border-color:#91caff;
  color:#333;
}
.ent-btn-text {
  max-width:180px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:13px;
}
.ent-btn-arrow {
  font-size:11px;
  color:#bbb;
  transition:transform .2s;
  margin-left:2px;
}

/* 用户头像 */
.user-avatar-wrap {
  display:inline-flex;
  cursor:pointer;
}
.user-avatar {
  cursor:pointer;
  flex-shrink:0;
  border:2px solid #f0f0f0;
  transition:border-color .2s;
}
.user-avatar:hover {
  border-color:#91caff;
}

.content-area { margin:0; padding:8px; background:#f0f2f5; min-height:calc(100vh - 48px); }
</style>

<!-- 下拉面板样式（非 scoped，因为 overlay 被 teleport 到 body） -->
<style>
/* 企业 Popover 覆盖层：统一样式，去除内层重复背景 */
.ent-popover-overlay .ant-popover-inner {
  padding: 0 !important;
  border-radius: 8px !important;
  overflow: hidden;
}

/* 企业下拉面板 */
.ent-dropdown {
  background:#fff;
  padding:6px 0;
}
.ent-dropdown-item {
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:10px 18px;
  cursor:pointer;
  transition:background .15s;
}
.ent-dropdown-item:hover { background:#f5f7fa; }
.ent-dropdown-item.active { background:#e6f4ff; }
.ent-item-info {
  display:flex;
  flex-direction:column;
  gap:1px;
  flex:1;
  min-width:0;
}
.ent-item-name {
  font-size:13px;
  color:#333;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.ent-item-role {
  font-size:11px;
  color:#999;
}
.ent-item-check {
  font-size:14px;
  color:#1677ff;
  margin-left:8px;
  flex-shrink:0;
}

/* 用户下拉 overlay：重置默认样式 */
.user-dropdown-overlay .ant-dropdown-menu {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* 用户下拉面板 */
.user-dropdown {
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:4px;
  width:140px;
  padding:16px 12px 12px;
  background:#fff;
  border-radius:10px;
  box-shadow:0 8px 24px rgba(0,0,0,0.12);
}
.user-dd-name {
  font-size:14px;
  font-weight:600;
  color:#1a1a1a;
}
.user-dd-tag {
  font-size:12px;
}
.user-dd-divider {
  width:100%;
  height:1px;
  background:#f0f0f0;
  margin:8px 0 4px;
}

/* 退出登录按钮 */
.user-dd-logout {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  width:100%;
  padding:7px 0;
  border-radius:6px;
  font-size:13px;
  color:#ff4d4f;
  cursor:pointer;
  transition:all .2s;
  user-select:none;
}
.user-dd-logout:hover {
  background:#fff2f0;
}
.user-dd-logout:active {
  background:#ffd8d2;
}
</style>
