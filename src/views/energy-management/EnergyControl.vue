<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { message } from 'antdv-next'
import { PoweroffOutlined, PlayCircleOutlined, SearchOutlined, ReloadOutlined } from '@antdv-next/icons'
import { useEnergyStore } from '@/stores/energy'

// ========== 类型定义 ==========
interface Meter {
  key: string
  orgPath: string      // 所属组织路径（全路径）
  meterName: string
  communicationStatus: 'ONLINE' | 'OFFLINE' | 'DISABLED'
  powerStatus: 'POWER_ON' | 'POWER_OFF'
  power: number        // 当前功率 kW
}

type ControlAction = 'POWER_OFF' | 'POWER_ON'

// ========== Mock 数据（大数据量演示） ==========
const meterOrgPaths = [
  '新加坡 / 中央区 / 乌节路 / 乌节路旗舰店',
  '新加坡 / 滨海湾 / 滨海湾金沙店',
  '新加坡 / 牛车水 / 牛车水店',
  '新加坡 / 樟宜 / 樟宜机场店',
  '新加坡 / 武吉士 / 武吉士店',
  '新加坡 / 裕廊东 / 裕廊东店',
  '新加坡 / 淡滨尼 / 淡滨尼店',
  '新加坡 / 大巴窑 / 大巴窑店',
  '新加坡 / 实龙岗 / 实龙岗店',
  '新加坡 / 碧山 / 碧山店',
  '新加坡 / 义顺 / 义顺店',
  '新加坡 / 宏茂桥 / 宏茂桥店',
  '新加坡 / 勿洛 / 勿洛店',
  '新加坡 / 加冷 / 加冷店',
  '新加坡 / 榜鹅 / 榜鹅店',
  '新加坡 / 后港 / 后港店',
  '新加坡 / 盛港 / 盛港店',
  '新加坡 / 金文泰 / 金文泰店',
  '新加坡 / 武吉巴督 / 武吉巴督店',
  '新加坡 / 红山 / 红山店',
]
const meterNames = ['总表', '冷藏区', '照明区']

const meters = ref<Meter[]>(Array.from({ length: 24 }, (_, i) => {
  const communicationStatus: Meter['communicationStatus'] = i % 9 === 7 ? 'OFFLINE' : 'ONLINE'
  const powerStatus: Meter['powerStatus'] = i % 12 === 5 ? 'POWER_OFF' : 'POWER_ON'
  const power = powerStatus === 'POWER_OFF' ? 0 : Number((8 + ((i * 3.7) % 20)).toFixed(1))
  return {
    key: String(i + 1),
    orgPath: meterOrgPaths[i % meterOrgPaths.length],
    meterName: meterNames[i % meterNames.length],
    communicationStatus,
    powerStatus,
    power,
  }
}))

const energyStore = useEnergyStore()

// ========== 筛选 ==========
const loading = ref(false)
const orgFilter = ref<string | undefined>(undefined)
const commFilter = ref<string | undefined>(undefined)
const powerFilter = ref<string | undefined>(undefined)

const orgOptions = computed(() =>
  Array.from(new Set(meters.value.map(m => m.orgPath))).map(p => ({ value: p, label: p })))

const commOptions = [
  { value: 'ONLINE', label: '在线' },
  { value: 'OFFLINE', label: '离线' },
]
const powerOptions = [
  { value: 'POWER_ON', label: '已供电' },
  { value: 'POWER_OFF', label: '已断电' },
]

const activeOrg = ref<string | undefined>(undefined)
const activeComm = ref<string | undefined>(undefined)
const activePower = ref<string | undefined>(undefined)

const filteredMeters = computed(() =>
  meters.value.filter(m =>
    (!activeOrg.value || m.orgPath === activeOrg.value) &&
    (!activeComm.value || m.communicationStatus === activeComm.value) &&
    (!activePower.value || m.powerStatus === activePower.value)))

const handleSearch = () => {
  activeOrg.value = orgFilter.value
  activeComm.value = commFilter.value
  activePower.value = powerFilter.value
}
const handleReset = () => {
  orgFilter.value = undefined
  commFilter.value = undefined
  powerFilter.value = undefined
  activeOrg.value = undefined
  activeComm.value = undefined
  activePower.value = undefined
}

const columns = [
  { title: '所属组织路径', dataIndex: 'orgPath', key: 'orgPath', ellipsis: true },
  { title: '电表', dataIndex: 'meterName', key: 'meterName', width: 100 },
  { title: '通信状态', dataIndex: 'communicationStatus', key: 'communicationStatus', width: 100 },
  { title: '供电状态', dataIndex: 'powerStatus', key: 'powerStatus', width: 100 },
  { title: '当前功率 (kW)', dataIndex: 'power', key: 'power', align: 'right' as const, width: 120 },
  { title: '操作', key: 'action', align: 'center' as const, width: 120 },
]

const pagination = reactive({ current: 1, pageSize: 10 })
const pagedMeters = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredMeters.value.slice(start, start + pagination.pageSize)
})

// ========== 二次确认弹窗 ==========
const modalVisible = ref(false)
const controlTarget = ref<Meter | null>(null)
const controlAction = ref<ControlAction>('POWER_OFF')
const reason = ref('')
const submitting = ref(false)

const isOnline = (m: Meter) => m.communicationStatus === 'ONLINE'

const openControl = (record: Meter, action: ControlAction) => {
  if (!isOnline(record)) {
    message.error('电表已离线，无法执行断电操作')
    return
  }
  controlTarget.value = record
  controlAction.value = action
  reason.value = ''
  modalVisible.value = true
}

// TODO: 对接后端 API — 下发断电/启用指令 POST /api/energy/meters/:id/control
const handleSubmit = async () => {
  if (!reason.value.trim()) {
    message.warning('请填写操作原因')
    return
  }
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 800)) // 模拟指令下发与回执
  if (controlTarget.value) {
    controlTarget.value.powerStatus = controlAction.value === 'POWER_OFF' ? 'POWER_OFF' : 'POWER_ON'
    controlTarget.value.power = controlAction.value === 'POWER_OFF' ? 0 : 12
    energyStore.addLog({
      key: String(Date.now()),
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      operator: '🫏建成',
      orgPath: controlTarget.value.orgPath,
      meterName: controlTarget.value.meterName,
      action: controlAction.value,
      reason: reason.value.trim(),
      result: 'SUCCESS',
    })
  }
  submitting.value = false
  modalVisible.value = false
  message.success(controlAction.value === 'POWER_OFF' ? '断电指令已执行成功' : '启用指令已执行成功')
}

// TODO: 对接后端 API — 获取可控电表列表 GET /api/energy/meters
const fetchData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 400))
  loading.value = false
}

fetchData()
</script>

<template>
  <div class="page-container">
    <!-- 高危操作提示 -->
    <a-alert
      type="warning"
      show-icon
      message="断电为高危操作，请谨慎操作，并务必填写操作原因以便追溯。"
      banner
      style="margin-bottom: 16px"
    />

    <!-- 电表列表 -->
    <a-card>
      <div class="toolbar">
        <a-space wrap>
          <a-select
            v-model:value="orgFilter"
            placeholder="选择所属组织路径"
            allow-clear
            show-search
            :options="orgOptions"
            :filter-option="(input: string, option: any) => option.label.includes(input)"
            style="width: 260px"
          />
          <a-select
            v-model:value="commFilter"
            placeholder="通信状态"
            allow-clear
            :options="commOptions"
            style="width: 120px"
          />
          <a-select
            v-model:value="powerFilter"
            placeholder="供电状态"
            allow-clear
            :options="powerOptions"
            style="width: 120px"
          />
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined /> 查询
          </a-button>
          <a-button @click="handleReset">
            <ReloadOutlined /> 重置
          </a-button>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data-source="pagedMeters"
        :loading="loading"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'communicationStatus'">
            <a-badge :status="record.communicationStatus === 'ONLINE' ? 'success' : 'error'" />
            <span style="margin-left:6px">{{ record.communicationStatus === 'ONLINE' ? '在线' : '离线' }}</span>
          </template>
          <template v-if="column.key === 'powerStatus'">
            <a-tag :color="record.powerStatus === 'POWER_ON' ? 'blue' : 'orange'">
              {{ record.powerStatus === 'POWER_ON' ? '已供电' : '已断电' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-tooltip :title="isOnline(record) ? '' : '电表离线，无法操作'">
              <a-button
                v-if="record.powerStatus === 'POWER_ON'"
                type="primary"
                danger
                size="small"
                :disabled="!isOnline(record)"
                @click="openControl(record, 'POWER_OFF')"
              >
                <template #icon><PoweroffOutlined /></template>断电
              </a-button>
              <a-button
                v-else
                type="primary"
                size="small"
                :disabled="!isOnline(record)"
                @click="openControl(record, 'POWER_ON')"
              >
                <template #icon><PlayCircleOutlined /></template>启用
              </a-button>
            </a-tooltip>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无可控制的电表" />
        </template>
      </a-table>
      <div class="pagination-wrap">
        <a-pagination
          v-model:current="pagination.current"
          v-model:pageSize="pagination.pageSize"
          :total="filteredMeters.length"
          show-size-changer
          :page-size-options="['10','20','50','100']"
          :show-total="(total: number) => `共 ${total} 台`"
        />
      </div>
    </a-card>

    <!-- 二次确认弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="controlAction === 'POWER_OFF' ? '确认断电' : '确认启用'"
      :confirm-loading="submitting"
      ok-text="确认执行"
      cancel-text="取消"
      :ok-button-props="controlAction === 'POWER_OFF' ? { danger: true } : {}"
      @ok="handleSubmit"
      width="520px"
    >
      <div class="confirm-body">
        <a-descriptions :column="1" size="small" bordered class="target-desc">
          <a-descriptions-item label="所属组织路径">{{ controlTarget?.orgPath }}</a-descriptions-item>
          <a-descriptions-item label="电表">{{ controlTarget?.meterName }}</a-descriptions-item>
          <a-descriptions-item label="操作类型">
            <a-tag :color="controlAction === 'POWER_OFF' ? 'red' : 'blue'">
              {{ controlAction === 'POWER_OFF' ? '断电' : '启用' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <a-alert
          v-if="controlAction === 'POWER_OFF'"
          type="warning"
          show-icon
          message="断电后该电表供电将被切断，请确认该回路不含冷柜、收银、安防等不可断电设备。"
          class="confirm-alert"
        />
        <a-alert
          v-else
          type="info"
          show-icon
          message="启用后将恢复该电表供电。"
          class="confirm-alert"
        />

        <p class="reason-label">操作原因（必填）</p>
        <a-textarea
          v-model:value="reason"
          placeholder="请填写操作原因（1-200 字）"
          :maxlength="200"
          :rows="3"
          style="margin-bottom: 8px"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.page-container {
  padding: 8px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.confirm-body {
  padding-bottom: 8px;
}
.target-desc {
  margin-bottom: 16px;
}
.confirm-alert {
  margin-bottom: 16px;
}
.reason-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
:deep(.ant-table) {
  table-layout: fixed;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
