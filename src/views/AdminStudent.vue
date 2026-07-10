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
      <el-table-column label="序号" width="60">
        <template #default="scope">
          {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="studentId" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="className" label="班级" width="150" />
      <el-table-column prop="major" label="专业" width="150" />
      <el-table-column prop="department" label="学院" width="150" />
      <el-table-column prop="batchYear" label="批次" width="100" />
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="scope">
          {{ scope.row.gender === 'male' || scope.row.gender === '男' ? '男' : '女' }}
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
      <el-table-column label="操作" width="260">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleViewReport(scope.row)">查看报告</el-button>
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
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="formData.department" placeholder="请输入学院" />
        </el-form-item>
        <el-form-item label="专业" required>
          <el-input v-model="formData.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="班级" required>
          <el-input v-model="formData.className" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="批次" required>
          <el-select v-model="formData.batchYear" placeholder="选择批次">
            <el-option v-for="batch in batches" :key="batch" :label="batch + '届'" :value="batch" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="就业状态">
          <el-select v-model="formData.employmentStatus" placeholder="选择就业状态">
            <el-option label="已就业" value="已就业" />
            <el-option label="升学" value="升学" />
            <el-option label="待就业" value="待就业" />
            <el-option label="自主创业" value="自主创业" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Warning } from '@element-plus/icons-vue'
import { getStudentList, saveStudent, updateStudent, deleteStudent } from '../api/student'
import { getAllBatch } from '../api/batch'

const router = useRouter()

const batches = ref([2024])

const studentList = ref([])
const searchKeyword = ref('')
const searchBatch = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  studentId: '',
  name: '',
  gender: '男',
  department: '',
  className: '',
  major: '',
  batchYear: '',
  phone: '',
  email: '',
  employmentStatus: ''
})

const getEmploymentType = (status) => {
  const types = { 
    employed: 'success', enrolled: 'primary', unemployed: 'warning', entrepreneur: 'info',
    '已就业': 'success', '升学': 'primary', '待就业': 'warning', '自主创业': 'info'
  }
  return types[status] || 'default'
}

const getEmploymentLabel = (status) => {
  const labels = { employed: '已就业', enrolled: '升学', unemployed: '待就业', entrepreneur: '自主创业' }
  return labels[status] || status
}

const fetchBatches = async () => {
  try {
    const res = await getAllBatch()
    if (res.code === 200) {
      batches.value = res.data.map(item => item.year)
    }
  } catch (error) {
    console.error('获取批次数据失败', error)
  }
}

const fetchData = async () => {
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value) {
      const keyword = searchKeyword.value
      params.studentId = keyword
      params.name = keyword
    }
    if (searchBatch.value) {
      params.batchYear = searchBatch.value
    }
    const res = await getStudentList(params)
    if (res.code === 200) {
      studentList.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    studentId: '',
    name: '',
    gender: '男',
    department: '',
    className: '',
    major: '',
    batchYear: '',
    phone: '',
    email: '',
    employmentStatus: ''
  }
  dialogVisible.value = true
}

const handleViewReport = (row) => {
  router.push({
    path: '/admin/report',
    query: {
      studentId: row.studentId,
      name: row.name
    }
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  if (!confirm('确定删除该学生？')) return
  
  try {
    const res = await deleteStudent(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  if (!formData.value.studentId || !formData.value.name || !formData.value.className || !formData.value.major) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  try {
    let res
    if (isEdit.value) {
      res = await updateStudent(formData.value)
    } else {
      res = await saveStudent(formData.value)
    }
    
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleImport = () => {
  importVisible.value = true
}

const handleFileChange = () => {
}

const handleConfirmImport = () => {
  ElMessage.warning('导入功能开发中')
  importVisible.value = false
}

const handleExport = () => {
  ElMessage.warning('导出功能开发中')
}

onMounted(() => {
  fetchBatches()
  fetchData()
})
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
