<template>
  <div class="batch-page">
    <header class="content-header">
      <h2>批次管理</h2>
      <el-button type="primary" @click="handleAdd">新增批次</el-button>
    </header>
    
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索年份" style="width: 200px" @keyup.enter="handleSearch" />
      <el-button @click="handleSearch">搜索</el-button>
    </div>
    
    <el-table :data="batchList" border>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="year" label="毕业年份" width="120" />
      <el-table-column prop="totalGraduates" label="总毕业生数" width="120" />
      <el-table-column prop="employmentRate" label="就业率(%)" width="120" />
      <el-table-column prop="enrollmentRate" label="升学率(%)" width="120" />
      <el-table-column prop="startDate" label="开始时间" width="150" />
      <el-table-column prop="endDate" label="结束时间" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" @click="handleToggle(scope.row)">
            {{ scope.row.status === 'active' ? '停用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      class="pagination"
    />
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑批次' : '新增批次'" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="毕业年份" required>
          <el-input v-model="formData.year" placeholder="请输入毕业年份" />
        </el-form-item>
        <el-form-item label="总毕业生数" required>
          <el-input v-model.number="formData.totalGraduates" placeholder="请输入总毕业生数" />
        </el-form-item>
        <el-form-item label="就业率(%)">
          <el-input v-model.number="formData.employmentRate" placeholder="请输入就业率" />
        </el-form-item>
        <el-form-item label="升学率(%)">
          <el-input v-model.number="formData.enrollmentRate" placeholder="请输入升学率" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="formData.startDate" type="date" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="formData.endDate" type="date" placeholder="选择结束时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const batchList = ref([
  { id: 1, year: 2024, totalGraduates: 1200, employmentRate: 95.5, enrollmentRate: 35.2, startDate: '2024-01-01', endDate: '2024-06-30', status: 'active' },
  { id: 2, year: 2023, totalGraduates: 1100, employmentRate: 94.2, enrollmentRate: 32.8, startDate: '2023-01-01', endDate: '2023-06-30', status: 'active' },
  { id: 3, year: 2022, totalGraduates: 1050, employmentRate: 93.8, enrollmentRate: 30.5, startDate: '2022-01-01', endDate: '2022-06-30', status: 'inactive' },
  { id: 4, year: 2021, totalGraduates: 980, employmentRate: 92.1, enrollmentRate: 28.3, startDate: '2021-01-01', endDate: '2021-06-30', status: 'inactive' }
])

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  year: '',
  totalGraduates: '',
  employmentRate: '',
  enrollmentRate: '',
  startDate: '',
  endDate: ''
})

const handleSearch = () => {
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    year: '',
    totalGraduates: '',
    employmentRate: '',
    enrollmentRate: '',
    startDate: '',
    endDate: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleToggle = (row) => {
  row.status = row.status === 'active' ? 'inactive' : 'active'
}

const handleDelete = (id) => {
  if (confirm(`确定删除批次ID: ${id}?`)) {
    batchList.value = batchList.value.filter(item => item.id !== id)
  }
}

const handleSubmit = () => {
  if (!formData.value.year || !formData.value.totalGraduates) {
    alert('请填写必填项')
    return
  }
  
  if (isEdit.value) {
    const index = batchList.value.findIndex(item => item.id === formData.value.id)
    if (index !== -1) {
      batchList.value[index] = { ...formData.value }
    }
  } else {
    formData.value.id = Date.now()
    formData.value.status = 'active'
    batchList.value.unshift({ ...formData.value })
  }
  
  dialogVisible.value = false
}
</script>

<style scoped>
.batch-page {
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

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>