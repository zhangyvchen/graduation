<template>
  <div id="app">
    <router-view />
    <AIFloatButton v-if="showFloat" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AIFloatButton from './components/AIFloatButton.vue'

const route = useRoute()
/** 管理端已有全页 AI，隐藏全局悬浮球避免双入口 */
const showFloat = computed(() => !String(route.path || '').startsWith('/admin'))
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', sans-serif;
}
</style>
