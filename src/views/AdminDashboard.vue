<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <div class="sidebar-header">管理后台</div>
      <el-menu default-active="1" class="sidebar-menu">
        <el-menu-item index="1">批次管理</el-menu-item>
        <el-menu-item index="2">名单管理</el-menu-item>
        <el-menu-item index="3">数据统计</el-menu-item>
        <el-menu-item index="4">报告模板配置</el-menu-item>
      </el-menu>
    </aside>
    
    <main class="content">
      <header class="content-header">
        <h2>批次管理</h2>
        <el-button type="primary" @click="handleAdd">新增批次</el-button>
      </header>
      
      <el-table :data="batchList" border>
        <el-table-column prop="year" label="年份" />
        <el-table-column prop="totalGraduates" label="总毕业生数" />
        <el-table-column prop="employmentRate" label="就业率" />
        <el-table-column prop="enrollmentRate" label="升学率" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const batchList = ref([
  { id: 1, year: 2024, totalGraduates: 1200, employmentRate: 95.5, enrollmentRate: 35.2 },
  { id: 2, year: 2023, totalGraduates: 1100, employmentRate: 94.2, enrollmentRate: 32.8 }
])

const handleAdd = () => {
  alert('新增批次')
}

const handleEdit = (row) => {
  alert(`编辑批次: ${row.year}`)
}

const handleDelete = (id) => {
  alert(`删除批次: ${id}`)
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 200px;
  background: #333;
  color: #fff;
}

.sidebar-header {
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #444;
}

.sidebar-menu :deep(.el-menu) {
  border-right: none;
}

.content {
  flex: 1;
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
}
</style>