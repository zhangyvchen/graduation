<template>
  <div id="app">
    <router-view />
    <AIFloatButton v-if="showFloat && isLoggedIn" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AIFloatButton from './components/AIFloatButton.vue'
import { useAuth } from './stores/auth'

const route = useRoute()
const auth = useAuth()
/** 管理端已有全页 AI，隐藏全局悬浮球避免双入口 */
const showFloat = computed(() => !String(route.path || '').startsWith('/admin'))
/** 未登录时不挂载悬浮球，避免登录前发起 AI 接口请求导致 401 噪声 */
const isLoggedIn = computed(() => !!auth.state.isLoggedIn)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--text);
}
</style>
