<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ReloadOutlined, RightOutlined, ArrowRightOutlined,
  CheckCircleFilled, CloseCircleFilled, CheckOutlined,
  BellFilled, PhoneOutlined, EnvironmentOutlined, VideoCameraOutlined,
} from '@antdv-next/icons'
const router = useRouter()

const now = ref(new Date())
const ts = computed(() => now.value.toLocaleString('zh-CN', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }))
let t1: any = null

const u = { name:'🫏建成', account:'zhangwei@dreamtech.com' }
const org = { name:'南京Dream信息技术有限公司', role:'系统管理员' }
const ent = { name:'南京Dream信息技术有限公司', phone:'025-8888-6666', address:'南京市玄武区珠江路88号新世界中心A座18层' }

const steps = [
  { t:'新建组织', d:'创建您的第一个组织架构', to:'/system/management' },
  { t:'新建角色', d:'为组织设置角色和权限', to:'/system/management' },
  { t:'新建成员', d:'添加团队成员到组织中', to:'/system/management' },
  { t:'添加设备', d:'录入并绑定巡检设备', to:'/device/management' },
]
const done = reactive([true,true,true,false])
const dn = computed(() => done.filter(Boolean).length)
const nr = ref(false); const gv = ref(true)
const sg = computed(() => org.role==='系统管理员' && gv.value)
const go = (url: string) => window.open(url, '_blank')

const td = reactive({a:0,b:0,c:0}); const tL=ref(false)
const lt = async()=>{tL.value=true;try{await new Promise(r=>setTimeout(r,500));td.a=12;td.b=5;td.c=3}finally{tL.value=false}}

const dv = reactive({on:0,off:0,total:0,rate:0}); const dL=ref(false)
const ld = async()=>{dL.value=true;try{await new Promise(r=>setTimeout(r,400));dv.on=128;dv.off=12;dv.total=140;dv.rate=91}finally{dL.value=false}}
const dc = computed(()=>dv.rate>=90?'#52c41a':dv.rate>=70?'#faad14':'#ff4d4f')

type P='thisWeek'|'lastWeek'|'thisMonth'
const pd=ref<P>('thisWeek')
const ins=reactive({plan:0,done:0,rate:0}); const iL=ref(false)
const im:Record<P,{plan:number,done:number,rate:number}>={thisWeek:{plan:24,done:18,rate:75},lastWeek:{plan:20,done:20,rate:100},thisMonth:{plan:86,done:62,rate:72}}
const li=async()=>{iL.value=true;try{await new Promise(r=>setTimeout(r,350));const x=im[pd.value];ins.plan=x.plan;ins.done=x.done;ins.rate=x.rate}finally{iL.value=false}}

interface A{id:string;thumb:string;etype:string;opath:string;dev:string;time:string;isNew:boolean}
const al=ref<A[]>([]); const aL=ref(false); let t2:any=null
const cc=['#e6f4ff','#fff7e6','#f6ffed','#fff0f6','#f0f5ff']
const ap=[{thumb:cc[0],etype:'视频流中断',opath:'华东区 / 南京 / 新街口店',dev:'门口高清摄像头-CAM-001'},{thumb:cc[1],etype:'镜头遮挡',opath:'华东区 / 上海 / 徐汇店',dev:'仓库红外摄像头-CAM-012'},{thumb:cc[2],etype:'画面模糊',opath:'华东区 / 南京 / 新街口店',dev:'收银台全景摄像头-CAM-007'},{thumb:cc[3],etype:'夜视异常',opath:'华北区 / 北京 / 朝阳店',dev:'停车场出入口摄像头-CAM-023'},{thumb:cc[4],etype:'存储不足',opath:'华东区 / 上海 / 徐汇店',dev:'货架巡查摄像头-CAM-015'}]
const la=async()=>{aL.value=true;try{await new Promise(r=>setTimeout(r,600));const n=new Date();al.value=ap.slice(0,5).map((x,i)=>({...x,id:'a'+Date.now()+i,time:new Date(n.getTime()-(4-i)*90000).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),isNew:false}))}finally{aL.value=false}}

onMounted(async()=>{t1=setInterval(()=>now.value=new Date(),1000);await Promise.all([lt(),ld(),li(),la()])})
onUnmounted(()=>{clearInterval(t1);clearInterval(t2)})
</script>

<template>
  <div class="wb">
    <a-row :gutter="16" class="r">
      <a-col :xs="24" :lg="12">
        <a-card :bordered="false" class="c">
          <template #title><div class="hd"><span>账号信息</span><span class="hd-tm">{{ ts }}</span></div></template>
          <div class="acct"><div class="acct-hi">您好，{{ u.name }}</div><div class="acct-row">账号：{{ u.account }}</div><div class="acct-row">{{ org.name }}<span class="d">·</span><a-tag color="blue" size="small">{{ org.role }}</a-tag></div></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="企业信息" :bordered="false" class="c">
          <div class="ent"><div class="ent-badge">D</div><div class="ent-body"><div class="ent-name">{{ ent.name }}</div><div class="ent-line"><PhoneOutlined />{{ ent.phone }}</div><div class="ent-line"><EnvironmentOutlined />{{ ent.address }}</div></div></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row v-if="sg" :gutter="16" class="r">
      <a-col :span="24">
        <a-card :bordered="false" class="c guide">
          <template #title>👋 欢迎使用智慧巡检平台，完成以下基础设置后即可正常使用</template>
          <template #extra><div class="ge"><span class="gn" @click="nr=!nr"><CheckCircleFilled v-if="nr" style="color:#1677ff"/><span v-else class="gnb"></span>不再提示</span><a-button size="small" type="text" @click="gv=false"><CloseCircleFilled/></a-button></div></template>
          <div class="gt"><template v-for="(s,i) in steps" :key="s.t"><div class="gnode" :class="{ok:done[i]}" @click="go(s.to)"><CheckCircleFilled v-if="done[i]" class="gok"/><span v-else class="gnum">{{ i+1 }}</span><div class="gtxt"><span class="gt">{{ s.t }}</span><span class="gd">{{ s.d }}</span></div></div><RightOutlined v-if="i<3" class="ga" :class="{ok:done[i]}"/></template></div>
          <div class="gb"><a-progress :percent="Math.round(dn/4*100)" :stroke-color="{from:'#1677ff',to:'#52c41a'}" size="small"/><span>{{ dn }}/4 步已完成</span></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="r r3">
      <a-col :xs="24" :md="8">
        <a-card title="待我处理" :bordered="false" class="c">
          <template #extra><a-button size="small" type="text" :loading="tL" @click="lt"><ReloadOutlined/></a-button></template>
          <a-skeleton v-if="tL" active :paragraph="{rows:3}"/>
          <div v-else class="tw">
            <div class="tr" @click="router.push('/inspection/todos?tab=pending')"><i class="td" style="background:#1677ff"/><span class="tl">待执行任务</span><b>{{ td.a }}</b></div>
            <div class="tr" @click="router.push('/inspection/todos?tab=rectify')"><i class="td" style="background:#fa8c16"/><span class="tl">待整改问题</span><b>{{ td.b }}</b></div>
            <div class="tr" @click="router.push('/inspection/todos?tab=review')"><i class="td" style="background:#52c41a"/><span class="tl">待审核问题</span><b>{{ td.c }}</b></div>
            <div class="ft"><span class="lk" @click="router.push('/inspection/todos')">查看全部待办 <ArrowRightOutlined/></span></div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card title="今日设备概览" :bordered="false" class="c">
          <template #extra><a-button size="small" type="text" :loading="dL" @click="ld"><ReloadOutlined/></a-button></template>
          <a-skeleton v-if="dL" active :paragraph="{rows:2}"/>
          <a-empty v-else-if="dv.total===0" description="暂无设备"/>
          <div v-else class="dw" @click="router.push('/device/management')">
            <a-progress type="circle" :percent="dv.rate" :stroke-color="dc" :size="90" :stroke-width="8"><template #format="v">{{ v }}%</template></a-progress>
            <div class="dns"><span><i class="dd on"/>在线 <b>{{ dv.on }}</b></span><span><i class="dd off"/>离线 <b>{{ dv.off }}</b></span><span>共 <b>{{ dv.total }}</b> 台</span></div>
            <div class="ft"><span class="lk">查看详情 <ArrowRightOutlined/></span></div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card :bordered="false" class="c">
          <template #title><div class="ih"><span>巡检总览</span><div class="it"><span :class="{on:pd==='thisWeek'}" @click="pd='thisWeek';li()">本周</span><span :class="{on:pd==='lastWeek'}" @click="pd='lastWeek';li()">上周</span><span :class="{on:pd==='thisMonth'}" @click="pd='thisMonth';li()">本月</span></div></div></template>
          <template #extra><a-button size="small" type="text" :loading="iL" @click="li"><ReloadOutlined/></a-button></template>
          <a-skeleton v-if="iL" active :paragraph="{rows:2}"/>
          <a-empty v-else-if="ins.plan===0" description="暂无计划"/>
          <div v-else class="iw" @click="router.push('/inspection/task-list')">
            <div class="ics"><div class="ic ic-blue"><span class="icv">{{ ins.plan }}</span><span class="icl">计划总数</span></div><div class="ic ic-green"><span class="icv">{{ ins.done }}</span><span class="icl">已执行</span></div><div class="ic ic-rate"><span class="icv">{{ ins.rate }}%</span><span class="icl">完成率</span></div></div>
            <a-progress :percent="ins.rate" :stroke-color="{from:'#1677ff',to:'#52c41a'}" size="small"/>
            <div class="ft"><span class="lk">查看全部任务 <ArrowRightOutlined/></span></div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="r">
      <a-col :span="24">
        <a-card :bordered="false" class="c">
          <template #title><span><BellFilled style="color:#fa8c16;margin-right:4px"/>告警推送</span></template>
          <template #extra><a-button size="small" type="text" :loading="aL" @click="la"><ReloadOutlined/></a-button><a-button size="small" type="link" @click="router.push('/alert-center')">查看全部 <ArrowRightOutlined/></a-button></template>
          <a-skeleton v-if="aL" active :paragraph="{rows:3}"/>
          <a-empty v-else-if="al.length===0" description="暂无告警"/>
          <div v-else class="alist"><div v-for="x in al" :key="x.id" class="ar" :class="{flash:x.isNew}" @click="router.push('/alert-center?detail='+x.id)"><div class="ath" :style="{background:x.thumb}"><VideoCameraOutlined style="color:#fff;font-size:14px"/></div><div class="ab"><div class="ah"><a-tag color="processing" size="small">{{ x.etype }}</a-tag><span class="an">{{ x.dev }}</span><span class="atm">{{ x.time }}</span></div><div class="aa">{{ x.opath }}</div></div><RightOutlined class="aarr"/></div></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.wb { padding: 16px 24px 24px; }
.r { margin-bottom: 16px; }
.r3 > .ant-col { display: flex; }
.r3 > .ant-col > .ant-card { flex: 1; }

.c { border-radius: 8px; display:flex; flex-direction:column; }
.c :deep(.ant-card-head) { border-bottom:1px solid #f0f0f0; padding:0 20px; min-height:48px; flex:none; }
.c :deep(.ant-card-head-title) { font-size:14px; font-weight:600; padding:0; }
.c :deep(.ant-card-body) { padding:20px; flex:1; display:flex; flex-direction:column; }
.c :deep(.ant-card-body)>* { flex:1; min-height:0; }
.c :deep(.ant-card-body)>.ant-skeleton { flex:none; }
.c :deep(.ant-card-body)>.ant-empty { flex:none; }

.hd { display:flex; align-items:center; justify-content:space-between; width:100%; }
.hd-tm { font-size:13px; font-weight:400; color:#999; font-variant-numeric:tabular-nums; }

.acct { display:flex; flex-direction:column; gap:4px; }
.acct-hi { font-size:16px; font-weight:600; color:#111; }
.acct-row { font-size:13px; color:#666; display:flex; align-items:center; gap:4px; }
.d { margin:0 2px; color:#ddd; }

.ent { display:flex; align-items:center; gap:16px; }
.ent-badge { width:48px; height:48px; border-radius:8px; background:linear-gradient(135deg,#1677ff,#69b1ff); color:#fff; font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ent-body { flex:1; display:flex; flex-direction:column; gap:5px; }
.ent-name { font-size:16px; font-weight:600; color:#111; }
.ent-line { font-size:13px; color:#888; display:flex; align-items:center; gap:5px; }
.ent-line :deep(.anticon) { font-size:13px; color:#bbb; }

.guide { border-left:3px solid #1677ff; }
.ge { display:flex; align-items:center; gap:8px; }
.gn { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#999; cursor:pointer; }
.gn:hover { color:#1677ff; }
.gnb { width:14px; height:14px; border:2px solid #d9d9d9; border-radius:3px; flex-shrink:0; }
.gt { display:flex; align-items:flex-start; }
.gnode { display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 8px; cursor:pointer; border-radius:8px; border:2px solid transparent; flex:1; text-align:center; transition:all .2s; }
.gnode:hover { background:#f0f5ff; border-color:#d6e4ff; }
.gnode.ok { background:#f6ffed; }
.gnum { width:32px; height:32px; border-radius:50%; background:#1677ff; color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.gok { font-size:32px; color:#52c41a; flex-shrink:0; }
.gtxt { display:flex; flex-direction:column; gap:1px; }
.gt { font-size:14px; font-weight:600; color:#111; }
.gd { font-size:11px; color:#999; }
.ga { display:flex; align-items:center; padding-top:22px; flex-shrink:0; width:18px; justify-content:center; color:#ddd; font-size:12px; }
.ga.ok { color:#52c41a; }
.gb { display:flex; align-items:center; gap:12px; margin-top:12px; padding-top:10px; border-top:1px solid #f0f0f0; }
.gb :deep(.ant-progress) { flex:1; }
.gb span { font-size:12px; color:#999; }

.tw { display:flex; flex-direction:column; gap:2px; }
.tr { display:flex; align-items:center; gap:10px; padding:12px; cursor:pointer; border-radius:6px; transition:background .15s; }
.tr:hover { background:#f5f7fa; }
.tr .tl { flex:1; font-size:14px; color:#333; }
.tr b { font-size:24px; font-weight:700; color:#111; margin-left:4px; }
.td { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

.dw { display:flex; flex-direction:column; align-items:center; gap:16px; cursor:pointer; padding-top:4px; }
.dns { display:flex; gap:20px; }
.dns span { display:flex; align-items:center; gap:6px; font-size:13px; color:#666; }
.dns b { font-size:16px; font-weight:700; color:#111; }
.dd { width:8px; height:8px; border-radius:50%; }
.dd.on { background:#52c41a; } .dd.off { background:#ff4d4f; }

.ih { display:flex; align-items:center; gap:8px; }
.it { display:flex; gap:0; }
.it span { font-size:12px; padding:2px 10px; cursor:pointer; border:1px solid #e0e0e0; color:#888; transition:all .2s; background:#fff; }
.it span:first-child { border-radius:4px 0 0 4px; }
.it span:last-child { border-radius:0 4px 4px 0; }
.it span+span { border-left:none; }
.it span.on { background:#1677ff; border-color:#1677ff; color:#fff; }
.iw { display:flex; flex-direction:column; cursor:pointer; }
.ics { display:flex; gap:10px; margin-bottom:14px; }
.ic { flex:1; border-radius:8px; padding:14px 8px; text-align:center; display:flex; flex-direction:column; gap:4px; border-top:3px solid transparent; }
.ic-blue { background:#f0f5ff; border-top-color:#1677ff; }
.ic-green { background:#f6ffed; border-top-color:#52c41a; }
.ic-rate { background:#fff7e6; border-top-color:#fa8c16; }
.icv { font-size:24px; font-weight:700; color:#111; }
.icl { font-size:11px; color:#999; }

.ft { margin-top:auto; padding-top:12px; display:flex; justify-content:flex-end; }
.lk { font-size:13px; color:#1677ff; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }
.lk:hover { color:#4096ff; }

.alist { display:flex; flex-direction:column; }
.ar { display:flex; align-items:flex-start; gap:12px; padding:10px 0; cursor:pointer; }
.ar+.ar { border-top:1px solid #f9f9f9; }
.ar:hover { margin:0 -8px; padding-left:8px; padding-right:8px; background:#fafafa; }
.ar.flash { animation:fl .6s ease-in-out 3; background:#fff7e6; }
@keyframes fl { 0%,100%{background:#fff7e6} 50%{background:#fffbe6} }
.ath { width:48px; height:36px; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.ab { flex:1; min-width:0; }
.ah { display:flex; align-items:center; gap:8px; }
.an { font-size:13px; font-weight:600; color:#111; }
.atm { font-size:12px; color:#bbb; margin-left:auto; flex-shrink:0; }
.aa { font-size:12px; color:#999; margin-top:4px; }
.aarr { font-size:12px; color:#ccc; flex-shrink:0; margin-top:4px; }

@media (max-width:768px) { .wb { padding:12px 16px 20px; } .gt { flex-wrap:wrap; } .ga { display:none; } }
</style>
