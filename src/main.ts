import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'antdv-next'
import zhCN from 'antdv-next/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'antdv-next/dist/reset.css'
import App from './App.vue'
import router from './router'

dayjs.locale('zh-cn')

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Antd, { locale: zhCN })
app.mount('#app')
