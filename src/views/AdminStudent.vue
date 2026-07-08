<template>
  <div class="student-page">
    <header class="content-header">
      <h2>名单管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增学生</el-button>
        <el-button @click="handleImport">导入Excel</el-button>
        <el-button @click="handleExport">导出Excel</el-button>
      </div>
    </header>
    
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索学号/姓名" style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="searchBatch" placeholder="选择批次" style="width: 150px">
        <el-option label="全部" value="" />
        <el-option v-for="batch in batches" :key="batch" :label="batch + '届'" :value="batch" />
      </el-select>
      <el-button @click="handleSearch">搜索</el-button>
    </div>
    
    <el-table :data="studentList" border>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="studentId" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="className" label="班级" width="150" />
      <el-table-column prop="major" label="专业" width="150" />
      <el-table-column prop="batchYear" label="批次" width="100" />
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="scope">
          {{ scope.row.gender === 'male' ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="employmentStatus" label="就业状态" width="100">
        <template #default="scope">
          <el-tag :type="getEmploymentType(scope.row.employmentStatus)">
            {{ getEmploymentLabel(scope.row.employmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
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
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学生' : '新增学生'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="学号" required>
          <el-input v-model="formData.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班级" required>
          <el-input v-model="formData.className" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="专业" required>
          <el-input v-model="formData.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="批次" required>
          <el-select v-model="formData.batchYear" placeholder="选择批次">
            <el-option v-for="batch in batches" :key="batch" :label="batch + '届'" :value="batch" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="就业状态">
          <el-select v-model="formData.employmentStatus" placeholder="选择就业状态">
            <el-option label="已就业" value="employed" />
            <el-option label="升学" value="enrolled" />
            <el-option label="待就业" value="unemployed" />
            <el-option label="自主创业" value="entrepreneur" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="importVisible" title="导入Excel" width="400px">
      <div class="import-area">
        <el-upload
          class="upload-demo"
          drag
          action="/api/student/import"
          :auto-upload="false"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              <el-icon size="14"><warning /></el-icon>
              支持 .xlsx, .xls 格式文件
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled, Warning } from '@element-plus/icons-vue'

const batches = [2024, 2023, 2022, 2021]

const studentList = ref([
  { id: 1, studentId: '2020001', name: '张三', className: '软件工程2001班', major: '软件工程', batchYear: 2024, gender: 'male', phone: '13800138001', employmentStatus: 'employed' },
  { id: 2, studentId: '2020002', name: '李四', className: '软件工程2001班', major: '软件工程', batchYear: 2024, gender: 'male', phone: '13800138002', employmentStatus: 'enrolled' },
  { id: 3, studentId: '2020003', name: '王五', className: '软件工程2002班', major: '软件工程', batchYear: 2024, gender: 'female', phone: '13800138003', employmentStatus: 'employed' },
  { id: 4, studentId: '2020004', name: '赵六', className: '计算机科学2001班', major: '计算机科学', batchYear: 2024, gender: 'male', phone: '13800138004', employmentStatus: 'unemployed' },
  { id: 5, studentId: '2020005', name: '钱七', className: '计算机科学2001班', major: '计算机科学', batchYear: 2024, gender: 'female', phone: '13800138005', employmentStatus: 'entrepreneur' }
])

const searchKeyword = ref('')
const searchBatch = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(500)

const dialogVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  studentId: '',
  name: '',
  gender: 'male',
  className: '',
  major: '',
  batchYear: '',
  phone: '',
  employmentStatus: ''
})

const getEmploymentType = (status) => {
  const types = { employed: 'success', enrolled: 'primary', unemployed: 'warning', entrepreneur: 'info' }
  return types[status] || 'default'
}

const getEmploymentLabel = (status) => {
  const labels = { employed: '已就业', enrolled: '升学', unemployed: '待就业', entrepreneur: '自主创业' }
  return labels[status] || status
}

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
    studentId: '',
    name: '',
    gender: 'male',
    className: '',
    major: '',
    batchYear: '',
    phone: '',
    employmentStatus: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  if (confirm(`确定删除学生ID: ${id}?`)) {
    studentList.value = studentList.value.filter(item => item.id !== id)
  }
}

const handleSubmit = () => {
  if (!formData.value.studentId || !formData.value.name || !formData.value.className || !formData.value.major) {
    alert('请填写必填项')
    return
  }
  
  if (isEdit.value) {
    const index = studentList.value.findIndex(item => item.id === formData.value.id)
    if (index !== -1) {
      studentList.value[index] = { ...formData.value }
    }
  } else {
    formData.value.id = Date.now()
    studentList.value.unshift({ ...formData.value })
  }
  
  dialogVisible.value = false
}

const handleImport = () => {
  importVisible.value = true
}

const handleFileChange = () => {
}

const handleConfirmImport = () => {
  alert('导入功能开发中')
  importVisible.value = false
}

const handleExport = () => {
  alert('导出功能开发中')
}
</script>

<style scoped>
.student-page {
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

.header-actions {
  display: flex;
  gap: 10px;
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

.import-area {
  padding: 20px;
}
</style>