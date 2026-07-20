<template>
  <div id="app">
    <router-view />
    <AIFloatButton />
  </div>
</template>

<script setup>
import AIFloatButton from './components/AIFloatButton.vue'
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
