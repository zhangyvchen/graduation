import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router/index.js'
import './styles/admin-theme.css'
import './styles/ai-chat-theme.css'
import './styles/theme.css'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
    app.component(key, component)
  }
}

app.use(router)
app.mount('#app')
