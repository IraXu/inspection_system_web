<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ShopOutlined, SearchOutlined } from '@antdv-next/icons'

const router = useRouter()

// ========== 区域树（不含数量，由 computed 动态计算） ==========
const rawRegionTree = [
  {
    key: 'root', title: '鹤梦信息大中华区',
    children: [
      { key: 'huabei', title: '华北大区',
        children: [
          { key: 'nj', title: '南京市',
            children: [
              { key: 'qb', title: '桥北万象城' },
              { key: 'xl', title: '新街口商圈' },
              { key: 'gl', title: '鼓楼万达' },
              { key: 'ln', title: '辽宁万达' },
            ]
          },
        ]
      },
      { key: 'huanan', title: '华南大区',
        children: [
          { key: 'gz', title: '广州市',
            children: [
              { key: 'th', title: '天河商圈' },
            ]
          },
        ]
      },
      { key: 'huadong', title: '华东大区',
        children: [
          { key: 'sh', title: '上海市',
            children: [
              { key: 'lujz', title: '陆家嘴商圈' },
              { key: 'xh', title: '徐汇商圈' },
            ]
          },
        ]
      },
    ],
  },
]

// ========== 门店卡片 ==========
const mockStores = [
  { id:'s1',name:'21世纪太阳城xxx商铺',hasDevice:true,regionPath:['root','huabei','nj','qb'] },
  { id:'s2',name:'xxx万达苏宁--xxx旗舰门店',hasDevice:true,regionPath:['root','huabei','nj','qb'] },
  { id:'s3',name:'xxx万达苏宁--xxx旗舰门店',hasDevice:true,regionPath:['root','huabei','nj','qb'] },
  { id:'s4',name:'xxxxx城xxx店铺',hasDevice:false,regionPath:['root','huabei','nj','gl'] },
  { id:'s5',name:'xxxxx城xxx店铺',hasDevice:true,regionPath:['root','huabei','nj','gl'] },
  { id:'s6',name:'xxxxxxx城xx店铺',hasDevice:true,regionPath:['root','huadong','sh','lujz'] },
  { id:'s7',name:'xxxxx城xxx店铺',hasDevice:true,regionPath:['root','huadong','sh','lujz'] },
  { id:'s8',name:'xxxxx城xxx店铺',hasDevice:false,regionPath:['root','huadong','sh','lujz'] },
  { id:'s9',name:'xxxxxxx城xx店铺',hasDevice:true,regionPath:['root','huadong','sh','xh'] },
  { id:'s10',name:'xxxxx城xxx店铺',hasDevice:true,regionPath:['root','huanan','gz','th'] },
  { id:'s11',name:'xxxxxxx城xx店铺',hasDevice:true,regionPath:['root','huanan','gz','th'] },
  { id:'s12',name:'xxxxx城xxx店铺',hasDevice:false,regionPath:['root','huanan','gz','th'] },
]

// 动态计算每个树节点的门店数
const storeCountByKey = computed(() => {
  const map: Record<string, number> = {}
  for (const s of mockStores) {
    for (const k of s.regionPath) {
      map[k] = (map[k] || 0) + 1
    }
  }
  return map
})

const attachCount = (nodes: any[]): any[] => nodes.map(n => ({
  ...n,
  title: `${n.title}(${storeCountByKey.value[n.key] || 0})`,
  children: n.children ? attachCount(n.children) : undefined,
}))

const regionTree = computed(() => attachCount(rawRegionTree))

const selectedKey = ref<string>('')
const expandedKeys = ref<string[]>(['root'])
const searchText = ref('')

const onTreeSelect = (keys: string[]) => {
  selectedKey.value = keys.length > 0 ? keys[0] : ''
}

const filteredStores = computed(() => {
  if (!selectedKey.value || selectedKey.value === 'root') return mockStores
  return mockStores.filter(s => s.regionPath.includes(selectedKey.value))
})

const goSpotCheck = (store: any) => {
  if (!store.hasDevice) return
  router.push(`/inspection/spot-check/execute?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}`)
}
const viewHistory = (store: any) => {
  router.push(`/inspection/spot-check-records?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}`)
}
</script>

<template>
  <div class="sl-page">
    <div class="sl-sidebar">
      <a-input v-model:value="searchText" placeholder="搜索" class="sl-search">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-tree :tree-data="regionTree" :expanded-keys="expandedKeys"
        :selected-keys="selectedKey ? [selectedKey] : []"
        @select="onTreeSelect" @update:expandedKeys="(ks: string[]) => expandedKeys = ks"
        :field-names="{ children: 'children', title: 'title', key: 'key' }" block-node class="sl-tree" />
    </div>
    <div class="sl-content">
      <div class="sl-grid" v-if="filteredStores.length > 0">
        <div v-for="store in filteredStores" :key="store.id" class="sl-card">
          <div class="slc-cover">
            <ShopOutlined class="slc-icon" />
            <span v-if="!store.hasDevice" class="slc-tag">无设备</span>
          </div>
          <div class="slc-name">{{ store.name }}</div>
          <div class="slc-actions">
            <a-button type="primary" :disabled="!store.hasDevice" @click="goSpotCheck(store)">立即点检</a-button>
            <a-button @click="viewHistory(store)">查看记录</a-button>
          </div>
        </div>
      </div>
      <div v-else class="sl-empty">
        <a-empty description="该区域暂无门店" />
      </div>
      <div class="sl-pagination">
        <a-pagination :total="mockStores.length" show-size-changer :show-total="(t: number) => `共 ${t} 条`" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sl-page { display: flex; height: 100%; background: #f5f7fa; }
.sl-sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; }
.sl-search { margin: 12px; width: auto; }
.sl-tree { flex: 1; overflow-y: auto; padding: 0 8px 12px; }
.sl-tree :deep(.ant-tree-node-selected) { background: #e6f7ff !important; }
.sl-tree :deep(.ant-tree-title) { font-size: 13px; }
.sl-content { flex: 1; padding: 16px 24px; overflow-y: auto; }
.sl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.sl-card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; transition: box-shadow .2s; }
.sl-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.slc-cover { height: 120px; background: #f5f7fa; display: flex; align-items: center; justify-content: center; position: relative; }
.slc-icon { font-size: 40px; color: #c0c4cc; }
.slc-tag { position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.9); color: #999; font-size: 12px; padding: 2px 8px; border-radius: 3px; }
.slc-name { padding: 14px 16px 0; text-align: center; font-size: 14px; font-weight: 600; color: #333; }
.slc-actions { display: flex; gap: 10px; padding: 12px 16px 16px; justify-content: center; }
.slc-actions .ant-btn { flex: 1; }
.sl-pagination { display: flex; justify-content: center; padding: 24px 0; }
.sl-empty { padding: 80px 0; }
</style>
