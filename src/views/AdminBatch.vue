<template>
  <div class="batch-page">
    <header class="content-header">
      <h2>批次管理</h2>
      <div class="header-actions">
        <el-button @click="handleRecalculate" type="warning">重新计算统计</el-button>
        <el-button type="primary" @click="handleAdd">新增批次</el-button>
      </div>
    </header>
    
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索年份" style="width: 200px" @keyup.enter="handleSearch" />
      <el-button @click="handleSearch">搜索</el-button>
    </div>
    
    <el-table :data="batchList" border>
      <el-table-column label="序号" width="60">
        <template #default="scope">
          {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="year" label="毕业年份" width="120" />
      <el-table-column prop="totalGraduates" label="总毕业生数" width="120" />
      <el-table-column label="就业人数" width="120">
        <template #default="scope">
          {{ getStatusCount(scope.row, 'employed') }}
        </template>
      </el-table-column>
      <el-table-column prop="employmentRate" label="就业率(%)" width="120" />
      <el-table-column label="升学人数" width="120">
        <template #default="scope">
          {{ getStatusCount(scope.row, 'enrolled') }}
        </template>
      </el-table-column>
      <el-table-column prop="enrollmentRate" label="升学率(%)" width="120" />
      <el-table-column prop="startTime" label="开始时间" width="150" />
      <el-table-column prop="endTime" label="结束时间" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">
            {{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="scope">
          <el-button size="small" @click="handleViewReport(scope.row)">查看报告</el-button>
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" @click="handleToggle(scope.row)">
            {{ scope.row.status === 'ENABLED' ? '停用' : '启用' }}
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
        <el-form-item label="开始时间">
          <el-date-picker v-model="formData.startTime" type="date" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="formData.endTime" type="date" placeholder="选择结束时间" />
        </el-form-item>
        <el-form-item label="统计说明">
          <el-alert title="就业率和升学率将根据名单管理中的学生数据自动计算" type="info" :closable="false" show-icon />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getBatchList, saveBatch, updateBatch, deleteBatch, toggleBatchStatus, recalculateBatch } from '../api/batch'
import { getStudentList } from '../api/student'

const router = useRouter()

const batchList = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const studentMap = ref({})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  year: '',
  startTime: '',
  endTime: ''
})

const fetchStudentMap = async () => {
  try {
    const res = await getStudentList({ pageNum: 1, pageSize: 1000 })
    if (res.code === 200) {
      const map = {}
      res.data.records.forEach(s => {
        if (!map[s.batchYear]) {
          map[s.batchYear] = { employed: 0, enrolled: 0, unemployed: 0, entrepreneur: 0 }
        }
        const status = s.employmentStatus
        if (status === 'employed' || status === '已就业') map[s.batchYear].employed++
        else if (status === 'enrolled' || status === '升学') map[s.batchYear].enrolled++
        else if (status === 'unemployed' || status === '待就业') map[s.batchYear].unemployed++
        else if (status === 'entrepreneur' || status === '自主创业') map[s.batchYear].entrepreneur++
      })
      studentMap.value = map
    }
  } catch (error) {
    console.error('Fetch student map error:', error)
  }
}

const getStatusCount = (row, status) => {
  const yearData = studentMap.value[row.year]
  return yearData ? yearData[status] : 0
}

const fetchData = async () => {
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchKeyword.value) {
      params.year = searchKeyword.value
    }
    const res = await getBatchList(params)
    if (res.code === 200) {
      batchList.value = res.data.records
      total.value = res.data.total
    }
    await fetchStudentMap()
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

const handleViewReport = (row) => {
  router.push('/admin/statistics')
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    year: '',
    startTime: '',
    endTime: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = {
    id: row.id,
    year: row.year,
    startTime: row.startTime,
    endTime: row.endTime
  }
  dialogVisible.value = true
}

const handleToggle = async (row) => {
  try {
    const res = await toggleBatchStatus(row.id)
    if (res && res.code === 200) {
      row.status = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
      ElMessage.success(res.message || '状态已更新')
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (error) {
    console.error('Toggle status error:', error)
    ElMessage.error('操作失败，请检查网络连接')
  }
}

const handleDelete = async (id) => {
  if (!confirm(`确定删除批次ID: ${id}?`)) return
  
  try {
    const res = await deleteBatch(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleRecalculate = async () => {
  try {
    const res = await recalculateBatch()
    if (res.code === 200) {
      ElMessage.success('重新计算成功')
      fetchData()
    }
  } catch (error) {
    ElMessage.error('重新计算失败')
  }
}

const handleSubmit = async () => {
  if (!formData.value.year) {
    ElMessage.warning('请填写毕业年份')
    return
  }
  
  try {
    let res
    if (isEdit.value) {
      res = await updateBatch(formData.value)
    } else {
      res = await saveBatch(formData.value)
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

onMounted(() => {
  fetchData()
})
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
</style>
