<template>
  <div class="report-container">
    <header class="header">
      <div class="logo">报告下载</div>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/growth">成长轨迹</router-link>
        <router-link to="/destination">去向地图</router-link>
        <router-link to="/learning">学习画像</router-link>
        <router-link to="/report">报告下载</router-link>
      </nav>
    </header>
    
    <main class="main-content">
      <div class="report-form">
        <el-card>
          <template #header>
            <span>生成个人发展报告</span>
          </template>
          
          <el-form :model="reportForm" label-width="100px">
            <el-form-item label="学号">
              <el-input v-model="reportForm.studentId" placeholder="请输入学号" />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="reportForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateReport">生成报告</el-button>
              <el-button @click="downloadReport">下载报告</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card v-if="reportGenerated" class="report-preview">
          <template #header>
            <span>报告预览</span>
          </template>
          <div class="preview-content">
            <h3>个人发展报告</h3>
            <p>学号：{{ reportForm.studentId }}</p>
            <p>姓名：{{ reportForm.name }}</p>
            <p>报告生成时间：{{ new Date().toLocaleString() }}</p>
            <div class="report-sections">
              <h4>一、基本信息</h4>
              <h4>二、成长轨迹</h4>
              <h4>三、学习画像</h4>
              <h4>四、就业去向</h4>
            </div>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const reportForm = ref({
  studentId: '',
  name: ''
})
const reportGenerated = ref(false)

const generateReport = () => {
  reportGenerated.value = true
}

const downloadReport = () => {
  if (!reportGenerated.value) {
    alert('请先生成报告')
    return
  }
  alert('报告下载功能开发中')
}
</script>

<style scoped>
.report-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav a {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
}

.main-content {
  padding: 40px;
  display: flex;
  justify-content: center;
}

.report-form {
  width: 600px;
}

.report-preview {
  margin-top: 20px;
}

.preview-content {
  padding: 20px;
}

.preview-content h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.report-sections h4 {
  margin: 10px 0;
  color: #666;
}
</style>