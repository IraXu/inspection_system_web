<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Modal, message } from 'antdv-next'
import {
  CheckOutlined, CloseOutlined, DeleteOutlined, InfoCircleOutlined, PhoneOutlined,
  PlusOutlined, ReloadOutlined, SearchOutlined, TeamOutlined,
} from '@antdv-next/icons'

type Member = {
  id: string
  name: string
  countryCode: string
  phone: string
  role: string
  organizations: string[]
  createdAt: string
}

type JoinRequest = {
  id: string
  countryCode: string
  phone: string
  enterpriseCode: string
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
  memberName?: string
  reviewNote?: string
  reviewedAt?: string
}

const enterpriseCode = 'DRE12345'
const initialPassword = `${enterpriseCode.slice(0, 3)}@12345`
const roleOptions = [
  { label: '超级管理员', value: '超级管理员' },
  { label: '系统管理员', value: '系统管理员' },
  { label: '区域经理', value: '区域经理' },
  { label: '门店店长', value: '门店店长' },
  { label: '巡检员', value: '巡检员' },
]

const countryCodeOptions = [
  { label: '中国 +86', value: '+86' },
  { label: '美国 +1', value: '+1' },
  { label: '香港 +852', value: '+852' },
]

const organizationTree = [
  { label: '华东大区', value: '华东大区', children: [
    { label: '南京市', value: '南京市', children: [
      { label: '江宁万达', value: '江宁万达' },
      { label: '鼓楼万达', value: '鼓楼万达' },
    ]},
  ]},
  { label: '华南大区', value: '华南大区', children: [
    { label: '深圳市', value: '深圳市', children: [
      { label: '福田商圈', value: '福田商圈' },
    ]},
  ]},
  { label: '华北大区', value: '华北大区', children: [
    { label: '北京市', value: '北京市', children: [
      { label: '朝阳商圈', value: '朝阳商圈' },
    ]},
  ]},
]

const members = ref<Member[]>([
  { id: 'm1', name: '徐某', countryCode: '+86', phone: '123123123', role: '超级管理员', organizations: ['华东大区', '华南大区'], createdAt: '2025-08-12 10:26:18' },
  { id: 'm2', name: '陈晓', countryCode: '+86', phone: '13800001111', role: '区域经理', organizations: ['华东大区'], createdAt: '2025-08-16 14:08:32' },
  { id: 'm3', name: '王海', countryCode: '+86', phone: '13900002222', role: '巡检员', organizations: ['华南大区'], createdAt: '2025-08-20 09:15:07' },
  { id: 'm4', name: '吕某', countryCode: '+86', phone: '144445555', role: '门店店长', organizations: ['华北大区'], createdAt: '2025-09-02 16:43:51' },
  { id: 'm5', name: '赵磊', countryCode: '+86', phone: '15900007102', role: '巡检员', organizations: ['华东大区'], createdAt: '2025-09-17 09:20:11' },
])

const joinRequests = ref<JoinRequest[]>([
  { id: 'r1', countryCode: '+86', phone: '13800008888', enterpriseCode, appliedAt: '2025-09-18 10:32:16', status: 'pending' },
  { id: 'r2', countryCode: '+86', phone: '18600002301', enterpriseCode, appliedAt: '2025-09-18 09:15:40', status: 'pending' },
  { id: 'r3', countryCode: '+86', phone: '15900007102', enterpriseCode, appliedAt: '2025-09-16 16:08:02', status: 'approved', memberName: '赵磊', reviewedAt: '2025-09-17 09:20:11' },
  { id: 'r4', countryCode: '+86', phone: '13700004567', enterpriseCode, appliedAt: '2025-09-15 11:02:40', status: 'rejected', reviewNote: '身份信息无法核实，请联系企业管理员', reviewedAt: '2025-09-15 14:10:05' },
])

const activeTab = ref<'members' | 'requests'>('members')
const searchName = ref('')
const searchPhone = ref('')
const requestPhone = ref('')
const appliedName = ref('')
const appliedPhone = ref('')
const appliedRequestPhone = ref('')
const requestStatus = ref<'all' | JoinRequest['status']>('all')
const selectedMemberIds = ref<string[]>([])
const pendingCount = computed(() => joinRequests.value.filter(request => request.status === 'pending').length)

const filteredMembers = computed(() => members.value.filter(member =>
  (!appliedName.value || member.name.includes(appliedName.value))
  && (!appliedPhone.value
    || `${member.countryCode}${member.phone}`.includes(appliedPhone.value.replace(/\s/g, ''))
    || member.phone.includes(appliedPhone.value)),
))

const filteredRequests = computed(() => joinRequests.value.filter(request =>
  (requestStatus.value === 'all' || request.status === requestStatus.value)
  && (!appliedRequestPhone.value
    || `${request.countryCode}${request.phone}`.includes(appliedRequestPhone.value.replace(/\s/g, ''))
    || request.phone.includes(appliedRequestPhone.value)),
))

const search = () => {
  appliedName.value = searchName.value.trim()
  appliedPhone.value = searchPhone.value.trim()
  appliedRequestPhone.value = requestPhone.value.trim()
}

const resetSearch = () => {
  searchName.value = ''
  searchPhone.value = ''
  requestPhone.value = ''
  appliedName.value = ''
  appliedPhone.value = ''
  appliedRequestPhone.value = ''
}

const memberColumns = [
  { title: '成员名称', dataIndex: 'name', key: 'name', width: 140, align: 'center' as const },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 180, align: 'center' as const },
  { title: '角色', dataIndex: 'role', key: 'role', width: 130, align: 'center' as const },
  { title: '绑定组织路径', key: 'organizations', ellipsis: true, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, align: 'center' as const },
  { title: '操作', key: 'action', width: 220, align: 'center' as const },
]

const requestColumns = [
  { title: '申请账号', key: 'account', width: 200, align: 'center' as const },
  { title: '申请时间', dataIndex: 'appliedAt', key: 'appliedAt', width: 180, align: 'center' as const },
  { title: '审核状态', key: 'status', width: 110, align: 'center' as const },
  { title: '处理结果', key: 'result', ellipsis: true, align: 'center' as const },
  { title: '操作', key: 'action', width: 100, align: 'center' as const },
]

const rowSelection = computed(() => ({
  selectedRowKeys: selectedMemberIds.value,
  columnWidth: 56,
  onChange: (keys: string[]) => { selectedMemberIds.value = keys },
}))

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const editingMemberId = ref('')
const memberForm = reactive({
  name: '',
  countryCode: '+86',
  phone: '',
  role: '',
  password: initialPassword,
  organizations: [] as string[],
})

const openAddDrawer = () => {
  drawerMode.value = 'add'
  editingMemberId.value = ''
  Object.assign(memberForm, { name: '', countryCode: '+86', phone: '', role: '', password: initialPassword, organizations: [] })
  drawerVisible.value = true
}

const openEditDrawer = (member: Member) => {
  drawerMode.value = 'edit'
  editingMemberId.value = member.id
  Object.assign(memberForm, {
    name: member.name,
    countryCode: member.countryCode,
    phone: member.phone,
    role: member.role,
    password: '',
    organizations: [...member.organizations],
  })
  drawerVisible.value = true
}

const saveMember = () => {
  const phone = memberForm.phone.trim()
  if (!memberForm.name.trim()) { message.warning('请输入成员姓名'); return }
  const phonePatterns: Record<string, RegExp> = {
    '+86': /^1\d{10}$/,
    '+1': /^[2-9]\d{9}$/,
    '+852': /^[2-9]\d{7}$/,
  }
  if (!phonePatterns[memberForm.countryCode]?.test(phone)) { message.warning('请输入正确的手机号'); return }
  if (!memberForm.role) { message.warning('请选择角色'); return }
  if (!memberForm.organizations.length) { message.warning('请选择绑定组织路径'); return }
  if (drawerMode.value === 'add' && !memberForm.password.trim()) { message.warning('请输入初始密码'); return }
  if (members.value.some(member => member.countryCode === memberForm.countryCode && member.phone === phone && member.id !== editingMemberId.value)) {
    message.warning('该成员已在本企业存在')
    return
  }

  if (drawerMode.value === 'edit') {
    const target = members.value.find(member => member.id === editingMemberId.value)
    if (target) Object.assign(target, {
      name: memberForm.name.trim(),
      countryCode: memberForm.countryCode,
      phone,
      role: memberForm.role,
      organizations: [...memberForm.organizations],
    })
    message.success('成员信息已更新')
  } else {
    members.value.unshift({
      id: `m${Date.now()}`,
      name: memberForm.name.trim(),
      countryCode: memberForm.countryCode,
      phone,
      role: memberForm.role,
      organizations: [...memberForm.organizations],
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'),
    })
    message.success('成员已添加')
  }
  drawerVisible.value = false
}

const deleteMembers = (ids: string[]) => {
  if (!ids.length) { message.warning('请先选择成员'); return }
  Modal.confirm({
    title: '确认删除所选成员？',
    content: '删除后，所选成员将无法登录当前企业，是否继续？仅删除其在当前企业的授权关系，不影响该用户在其他企业的权限。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      members.value = members.value.filter(member => !ids.includes(member.id))
      selectedMemberIds.value = selectedMemberIds.value.filter(id => !ids.includes(id))
      message.success('成员已从当前企业移除')
    },
  })
}

const resetPassword = (member: Member) => {
  Modal.confirm({
    title: '确认重置密码？',
    content: `将「${member.name}」的密码重置为初始密码。`,
    okText: '确认重置',
    cancelText: '取消',
    onOk: () => message.success(`密码已成功重置，初始密码为：${initialPassword}`),
  })
}

const exportMembers = () => {
  const rows = [
    ['成员名称', '手机号', '角色', '绑定组织路径', '创建时间'],
    ...filteredMembers.value.map(member => [
      member.name, `${member.countryCode} ${member.phone}`, member.role, member.organizations.join('、'), member.createdAt,
    ]),
  ]
  const csv = `\uFEFF${rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = '企业成员.csv'
  link.click()
  URL.revokeObjectURL(url)
  message.success('成员列表已导出')
}

const reviewDrawerVisible = ref(false)
const reviewingRequest = ref<JoinRequest | null>(null)
const reviewForm = reactive({ name: '', role: '', organizations: [] as string[] })
const openReview = (request: JoinRequest) => {
  reviewingRequest.value = request
  reviewForm.name = ''
  reviewForm.role = ''
  reviewForm.organizations = []
  reviewDrawerVisible.value = true
}

const approveRequest = () => {
  const request = reviewingRequest.value
  if (!request) return
  if (!reviewForm.name.trim()) { message.warning('请填写成员名称'); return }
  if (!reviewForm.role) { message.warning('请选择成员角色'); return }
  if (!reviewForm.organizations.length) { message.warning('请选择绑定组织路径'); return }
  if (members.value.some(member => member.countryCode === request.countryCode && member.phone === request.phone)) {
    message.warning('该手机号已在本企业存在，请先检查成员列表')
    return
  }
  members.value.unshift({
    id: `m${Date.now()}`,
    name: reviewForm.name.trim(),
    countryCode: request.countryCode,
    phone: request.phone,
    role: reviewForm.role,
    organizations: [...reviewForm.organizations],
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'),
  })
  request.status = 'approved'
  request.memberName = reviewForm.name.trim()
  request.reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
  reviewDrawerVisible.value = false
  message.success('申请已通过，已加入企业成员列表')
}

const rejectVisible = ref(false)
const rejectReason = ref('')
const openReject = () => {
  rejectReason.value = ''
  rejectVisible.value = true
}
const rejectRequest = () => {
  if (!rejectReason.value.trim()) { message.warning('请填写驳回原因'); return }
  if (!reviewingRequest.value) return
  reviewingRequest.value.status = 'rejected'
  reviewingRequest.value.reviewNote = rejectReason.value.trim()
  reviewingRequest.value.reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
  rejectVisible.value = false
  reviewDrawerVisible.value = false
  message.success('已驳回加入企业申请')
}

const statusMeta: Record<JoinRequest['status'], { label: string; color: string }> = {
  pending: { label: '待审核', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
}

const getStatusMeta = (status: string) => statusMeta[status as JoinRequest['status']]
</script>

<template>
  <div class="members-page">
    <div class="members-card">
      <div class="tabs-row">
        <div class="tabs-left">
          <button :class="{ active: activeTab === 'members' }" @click="activeTab = 'members'">成员列表</button>
          <button :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">加入申请</button>
        </div>
        <div class="tab-stats">
          <span class="tab-stat"><TeamOutlined /> 成员 <strong>{{ members.length }}</strong></span>
          <button
            v-if="pendingCount"
            class="tab-stat pending-stat"
            @click="activeTab = 'requests'; requestStatus = 'pending'"
          >
            <span class="pending-dot"></span> 待审核 <strong>{{ pendingCount }}</strong>
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'members'" class="toolbar member-toolbar">
        <div class="filters">
          <a-input v-model:value="searchName" allow-clear placeholder="请输入成员名称" @pressEnter="search" />
          <a-input v-model:value="searchPhone" allow-clear placeholder="请输入成员登录手机号" @pressEnter="search" />
          <a-button type="primary" @click="search"><SearchOutlined /> 查询</a-button>
          <a-button @click="resetSearch"><ReloadOutlined /> 重置</a-button>
        </div>
        <div class="actions">
          <a-button type="primary" @click="openAddDrawer"><PlusOutlined /> 添加成员</a-button>
          <a-button danger :disabled="!selectedMemberIds.length" @click="deleteMembers(selectedMemberIds)"><DeleteOutlined /> 批量删除</a-button>
          <a-button @click="exportMembers">成员导出</a-button>
        </div>
      </div>

      <div v-else class="toolbar">
        <div class="filters">
          <a-input v-model:value="requestPhone" allow-clear placeholder="请输入申请账号手机号" @pressEnter="search" />
          <div class="status-filter">
            <a-select
              v-model:value="requestStatus"
              :options="[
                { label: '全部', value: 'all' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已驳回', value: 'rejected' },
              ]"
            />
          </div>
          <a-button type="primary" @click="search"><SearchOutlined /> 查询</a-button>
          <a-button @click="resetSearch"><ReloadOutlined /> 重置</a-button>
        </div>
      </div>

      <a-table
        v-if="activeTab === 'members'"
        :columns="memberColumns"
        :data-source="filteredMembers"
        :row-selection="rowSelection"
        row-key="id"
        table-layout="fixed"
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'phone'">{{ record.countryCode }} {{ record.phone }}</template>
          <template v-else-if="column.key === 'organizations'">
            <span class="org-path-text" :title="record.organizations.join('、')">{{ record.organizations.join('、') || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="row-actions">
              <a-button type="link" size="small" class="reset-password-action" @click="resetPassword(record)">重置密码</a-button>
              <a-button type="link" size="small" @click="openEditDrawer(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="deleteMembers([record.id])">删除</a-button>
            </div>
          </template>
        </template>
      </a-table>

      <a-table
        v-else
        :columns="requestColumns"
        :data-source="filteredRequests"
        row-key="id"
        table-layout="fixed"
        :locale="{ emptyText: requestStatus === 'pending' ? '暂无待审核申请' : '暂无加入企业申请' }"
        :pagination="{ pageSize: 10, showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: true }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'account'">{{ record.countryCode }} {{ record.phone }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusMeta(record.status).color">{{ getStatusMeta(record.status).label }}</a-tag>
          </template>
          <template v-else-if="column.key === 'result'">
            <span v-if="record.status === 'approved'">已加入成员：{{ record.memberName }}</span>
            <span v-else-if="record.status === 'rejected'" class="reject-reason" :title="record.reviewNote">{{ record.reviewNote }}</span>
            <span v-else class="reviewed-text">—</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button v-if="record.status === 'pending'" type="link" size="small" @click="openReview(record)">审核</a-button>
            <span v-else class="reviewed-text">—</span>
          </template>
        </template>
      </a-table>
    </div>

    <a-drawer
      v-model:open="drawerVisible"
      :title="drawerMode === 'add' ? '添加成员' : '编辑成员'"
      :size="520"
      placement="right"
      :styles="{ footer: { textAlign: 'right' } }"
    >
      <a-form layout="vertical">
        <a-form-item label="成员手机号" required>
          <div class="phone-input">
            <div class="country-code">
              <a-select v-model:value="memberForm.countryCode" :options="countryCodeOptions" />
            </div>
            <a-input v-model:value="memberForm.phone" class="phone-number" placeholder="请输入手机号" />
          </div>
          <div class="field-hint">手机号可加入多个企业，但不能重复添加到当前企业</div>
        </a-form-item>
        <a-form-item label="成员姓名" required>
          <a-input v-model:value="memberForm.name" placeholder="请输入成员姓名" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model:value="memberForm.role" :options="roleOptions" placeholder="请选择角色" />
        </a-form-item>
        <a-form-item v-if="drawerMode === 'add'" label="初始密码" required>
          <a-input-password v-model:value="memberForm.password" placeholder="请输入初始密码" />
          <div class="field-hint">默认初始密码：{{ initialPassword }}</div>
        </a-form-item>
        <a-form-item label="绑定组织路径" required>
          <a-tree-select
            v-model:value="memberForm.organizations"
            :tree-data="organizationTree"
            :field-names="{ label: 'label', value: 'value', children: 'children' }"
            tree-checkable
            multiple
            show-checked-strategy="SHOW_PARENT"
            :tree-default-expand-all="true"
            placeholder="请选择组织路径"
            style="width: 100%"
          />
          <div class="field-hint">成员仅对所绑定组织路径下的设备有权限</div>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" @click="saveMember">保存</a-button>
        </a-space>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="reviewDrawerVisible"
      title="审核加入企业申请"
      :size="520"
      placement="right"
      :styles="{ footer: { textAlign: 'right' } }"
      @close="reviewingRequest = null"
    >
      <template v-if="reviewingRequest">
        <div class="review-account">
          <span class="account-icon"><PhoneOutlined /></span>
          <div class="account-main">
            <div class="account-phone">{{ reviewingRequest.countryCode }} {{ reviewingRequest.phone }}</div>
            <div class="account-meta">申请时间 {{ reviewingRequest.appliedAt }}</div>
          </div>
          <a-tag color="processing">待审核</a-tag>
        </div>
        <div class="review-section">
          <div class="section-title">完善成员信息</div>
          <div class="section-desc">通过后该账号即可加入本企业</div>
        </div>
        <a-form layout="vertical" class="review-form">
          <a-form-item label="成员名称" required>
            <a-input v-model:value="reviewForm.name" placeholder="请输入成员名称" :maxlength="30" />
          </a-form-item>
          <a-form-item label="分配角色" required>
            <a-select v-model:value="reviewForm.role" :options="roleOptions" placeholder="请选择角色" />
          </a-form-item>
          <a-form-item label="绑定组织路径" required>
            <a-tree-select
              v-model:value="reviewForm.organizations"
              :tree-data="organizationTree"
              :field-names="{ label: 'label', value: 'value', children: 'children' }"
              tree-checkable
              multiple
              show-checked-strategy="SHOW_PARENT"
              :tree-default-expand-all="true"
              placeholder="请选择组织路径"
              style="width: 100%"
            />
            <div class="field-hint">成员仅对所绑定组织路径下的设备有权限</div>
          </a-form-item>
        </a-form>
        <div class="review-note"><InfoCircleOutlined /> 审核结果将同步至巡检 App。</div>
      </template>
      <template #footer>
        <a-space>
          <a-button danger @click="openReject"><CloseOutlined /> 驳回</a-button>
          <a-button type="primary" @click="approveRequest"><CheckOutlined /> 通过</a-button>
        </a-space>
      </template>
    </a-drawer>

    <a-modal
      v-model:open="rejectVisible"
      title="驳回加入企业申请"
      ok-text="确认驳回"
      cancel-text="取消"
      :ok-button-props="{ danger: true }"
      @ok="rejectRequest"
    >
      <p class="reject-intro">驳回后该账号将无法加入本企业，原因会同步至 App。</p>
      <a-textarea v-model:value="rejectReason" :rows="4" :maxlength="200" show-count placeholder="请输入驳回原因" />
    </a-modal>
  </div>
</template>

<style scoped>
.members-page {
  min-height: 100%;
  padding: 24px;
  background: #f4f6fa;
}

.tab-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #667085;
  font-size: 13px;
}

.tab-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #667085;
  font-size: 13px;
}

.tab-stat strong {
  color: #1d2939;
  font-size: 14px;
  font-weight: 650;
}

.pending-stat {
  cursor: pointer;
  transition: color 0.2s;
}

.pending-stat:hover {
  color: #1677ff;
}

.pending-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f5a623;
  box-shadow: 0 0 0 3px #fff4df;
}

.members-card {
  overflow: hidden;
  padding: 0 24px 20px;
  border: 1px solid #e9edf3;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgb(16 24 40 / 4%);
}

.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 60px;
  border-bottom: 1px solid #edf0f4;
}

.tabs-left {
  display: flex;
  align-items: stretch;
  gap: 30px;
  height: 100%;
}

.tabs-left button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #667085;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.tabs-left button:hover,
.tabs-left button.active {
  color: #1677ff;
}

.tabs-left button.active {
  font-weight: 600;
}

.tabs-left button.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #1677ff;
  content: '';
}

.toolbar {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.member-toolbar {
  gap: 12px;
}

.filters,
.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filters {
  min-width: 0;
}

.filters :deep(.ant-input-affix-wrapper) {
  flex: 0 0 220px;
  width: 220px;
  border-radius: 6px;
}

.status-filter {
  flex: 0 0 140px;
  width: 140px;
}

.status-filter :deep(.ant-select) {
  width: 100%;
}

.filters :deep(.ant-btn),
.actions :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 6px;
}

.reset-password-action,
.reset-password-action:hover,
.reset-password-action:focus {
  color: #52a91a !important;
}

.members-card :deep(.ant-table-wrapper) {
  margin-top: 4px;
}

.members-card :deep(.ant-table-thead > tr > th) {
  padding: 13px 16px;
  background: #f8fafc;
  color: #667085;
  font-size: 13px;
  font-weight: 500;
}

.members-card :deep(.ant-table-tbody > tr > td) {
  height: 56px;
  padding: 13px 16px;
  color: #344054;
  font-size: 13px;
  white-space: nowrap;
}

.members-card :deep(.ant-table-tbody > tr:hover > td) {
  background: #f7faff;
}

.members-card :deep(.ant-table-selection-column) {
  padding-right: 0;
  padding-left: 16px;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.row-actions :deep(.ant-btn) {
  height: auto;
  padding: 0;
  font-size: 13px;
  line-height: 1.4;
}

.org-path-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.members-card :deep(.ant-pagination) {
  margin: 16px 0 0;
}

.reviewed-text {
  color: #98a2b3;
  font-size: 12px;
}

.reject-reason {
  display: block;
  overflow: hidden;
  color: #b54708;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-input {
  display: flex;
  gap: 8px;
}

.country-code {
  flex: 0 0 124px;
  width: 124px;
}

.country-code :deep(.ant-select) {
  width: 100%;
}

.phone-number {
  flex: 1;
  min-width: 0;
}

.field-hint {
  margin-top: 6px;
  color: #8c96a5;
  font-size: 12px;
  line-height: 1.55;
}

.review-account {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e6edf7;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f9ff, #fbfdff);
}

.account-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 12px;
  background: #e6f0ff;
  color: #1677ff;
  font-size: 19px;
}

.account-main {
  flex: 1;
  min-width: 0;
}

.account-phone {
  color: #1d2939;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.account-meta {
  margin-top: 4px;
  color: #8c96a5;
  font-size: 12px;
}

.review-section {
  margin: 24px 0 14px;
}

.section-title {
  color: #1d2939;
  font-size: 14px;
  font-weight: 600;
}

.section-desc {
  margin-top: 4px;
  color: #8c96a5;
  font-size: 12px;
}

.review-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}

.review-form :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.review-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed #e6edf7;
  color: #8c96a5;
  font-size: 12px;
}

.reject-intro {
  margin-bottom: 10px;
  color: #595959;
}

@media (max-width: 1200px) {
  .members-page {
    padding: 20px;
  }

  .filters {
    width: 100%;
  }

  .filters :deep(.ant-input-affix-wrapper) {
    flex: 1 1 200px;
    width: auto;
  }
}

@media (max-width: 680px) {
  .members-page {
    padding: 12px;
  }

  .members-card {
    padding: 0 12px 16px;
    border-radius: 10px;
  }

  .tabs-row {
    gap: 16px;
  }

  .tab-stats {
    gap: 12px;
  }

  .filters :deep(.ant-input-affix-wrapper) {
    flex: 1 1 calc(50% - 5px);
    width: auto;
    min-width: 140px;
  }

  .status-filter {
    flex: 1 1 140px;
    width: auto;
  }

  .actions {
    width: 100%;
  }
}
</style>
