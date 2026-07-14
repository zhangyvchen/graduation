import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router/index.js'

const app = createApp(App)
app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
    app.component(key, component)
  }
}

app.use(router)
app.mount('#app')