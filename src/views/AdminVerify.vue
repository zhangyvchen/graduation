<template>
  <div class="admin-verify">
    <header class="content-header">
      <h2>📱 扫码核销</h2>
      <div class="header-actions">
        <el-button @click="loadRecords" :icon="Refresh">刷新记录</el-button>
      </div>
    </header>

    <el-row :gutter="20">
      <!-- 左侧：核销操作 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="hover">
          <template #header><span>🔍 核销操作</span></template>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="扫码核销" name="scan">
              <el-alert
                title="请使用扫码枪扫描学生二维码，或粘贴二维码文本到下方"
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 16px;"
              />
              <el-input
                v-model="scanInput"
                placeholder="请扫码或输入二维码内容（自动聚焦）"
                ref="scanInputRef"
                clearable
                @keyup.enter="handleScanVerify"
                size="large"
              >
                <template #prefix>
                  <el-icon><Aim /></el-icon>
                </template>
              </el-input>
              <el-button
                type="primary"
                size="large"
                style="width: 100%; margin-top: 12px;"
                :loading="loading.verify"
                @click="handleScanVerify"
              >
                立即核销
              </el-button>
            </el-tab-pane>

            <el-tab-pane label="按学号核销" name="byId">
              <el-form @submit.prevent>
                <el-form-item label="学号">
                  <el-input
                    v-model="studentIdInput"
                    placeholder="输入学号"
                    clearable
                    @keyup.enter="handleStudentIdVerify"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  style="width: 100%;"
                  :loading="loading.verify"
                  @click="handleStudentIdVerify"
                >
                  立即核销
                </el-button>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <el-divider />

          <div v-if="lastResult" class="result-block">
            <el-alert
              v-if="lastResult.success"
              :title="`✓ 核销成功：${lastResult.studentId}`"
              type="success"
              :closable="false"
              show-icon
            />
            <el-alert
              v-else
              :title="`✗ 核销失败：${lastResult.message}`"
              type="error"
              :closable="false"
              show-icon
            />
            <div v-if="lastResult.student" class="student-card">
              <h4>{{ lastResult.student.name }}（{{ lastResult.student.studentId }}）</h4>
              <p>学院：{{ lastResult.student.college || '-' }}</p>
              <p>专业：{{ lastResult.student.major || '-' }}</p>
              <p>班级：{{ lastResult.student.className || '-' }}</p>
              <p>批次：{{ lastResult.student.batchYear }}届</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：核销记录 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>📋 核销记录</span>
              <div class="filters">
                <el-input
                  v-model="filters.studentId"
                  placeholder="学号"
                  size="small"
                  clearable
                  style="width: 140px;"
                  @keyup.enter="handleSearch"
                />
                <el-input
                  v-model="filters.name"
                  placeholder="姓名"
                  size="small"
                  clearable
                  style="width: 140px;"
                  @keyup.enter="handleSearch"
                />
                <el-button size="small" type="primary" @click="handleSearch">搜索</el-button>
              </div>
            </div>
          </template>

          <el-table :data="records" border v-loading="loading.records" empty-text="暂无核销记录">
            <el-table-column label="序号" width="60">
              <template #default="scope">
                {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="studentId" label="学号" min-width="120" />
            <el-table-column prop="verificationCode" label="核销码" min-width="160" />
            <el-table-column prop="verified" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.verified ? 'success' : 'warning'">
                  {{ scope.row.verified ? '已核销' : '未核销' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verifiedAt" label="核销时间" min-width="170">
              <template #default="scope">
                {{ scope.row.verifiedAt ? formatDateTime(scope.row.verifiedAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="170">
              <template #default="scope">
                {{ scope.row.createdAt ? formatDateTime(scope.row.createdAt) : '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            style="margin-top: 16px; justify-content: flex-end;"
            @size-change="loadRecords"
            @current-change="loadRecords"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Aim, User } from '@element-plus/icons-vue'
import { adminVerify, getAdminVerifyRecords, getStudentVerifyInfo } from '@/api/adminVerify'

const activeTab = ref('scan')
const scanInput = ref('')
const studentIdInput = ref('')
const scanInputRef = ref(null)

const records = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({ studentId: '', name: '' })

const lastResult = ref(null)

const loading = reactive({ verify: false, records: false })

onMounted(() => {
  loadRecords()
  nextTick(() => {
    scanInputRef.value?.focus()
  })
})

const handleScanVerify = async () => {
  if (!scanInput.value) {
    ElMessage.warning('请先扫码或输入核销码')
    return
  }
  loading.verify = true
  try {
    const res = await adminVerify({ code: scanInput.value.trim() })
    if (res.code === 200) {
      ElMessage.success('核销成功')
      const studentId = extractStudentId(scanInput.value)
      const info = await getStudentVerifyInfo(studentId)
      lastResult.value = {
        success: true,
        studentId,
        student: info.data?.student
      }
      scanInput.value = ''
      loadRecords()
      nextTick(() => scanInputRef.value?.focus())
    } else {
      lastResult.value = { success: false, message: res.message }
      ElMessage.error(res.message || '核销失败')
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || '核销失败'
    lastResult.value = { success: false, message: msg }
    ElMessage.error(msg)
  } finally {
    loading.verify = false
  }
}

const handleStudentIdVerify = async () => {
  if (!studentIdInput.value) {
    ElMessage.warning('请输入学号')
    return
  }
  loading.verify = true
  try {
    const res = await adminVerify({ studentId: studentIdInput.value.trim() })
    if (res.code === 200) {
      ElMessage.success('核销成功')
      const info = await getStudentVerifyInfo(studentIdInput.value.trim())
      lastResult.value = {
        success: true,
        studentId: studentIdInput.value.trim(),
        student: info.data?.student
      }
      studentIdInput.value = ''
      loadRecords()
    } else {
      lastResult.value = { success: false, message: res.message }
      ElMessage.error(res.message || '核销失败')
    }
  } catch (error) {
    const msg = error.response?.data?.message || error.message || '核销失败'
    lastResult.value = { success: false, message: msg }
    ElMessage.error(msg)
  } finally {
    loading.verify = false
  }
}

const extractStudentId = (code) => {
  if (!code) return ''
  return code.startsWith('VERIFY:') ? code.substring(7) : code
}

const handleSearch = () => {
  currentPage.value = 1
  loadRecords()
}

const loadRecords = async () => {
  loading.records = true
  try {
    const res = await getAdminVerifyRecords({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      studentId: filters.studentId || undefined,
      name: filters.name || undefined
    })
    if (res.code === 200) {
      records.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      records.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载核销记录失败:', error)
    ElMessage.error('加载核销记录失败')
  } finally {
    loading.records = false
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
</script>

<style scoped>
.admin-verify {
  padding-bottom: 16px;
}
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.content-header h2 {
  margin: 0;
  color: #303133;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
}
.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}
.result-block {
  margin-top: 12px;
}
.student-card {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}
.student-card h4 {
  margin: 0 0 8px 0;
  color: #303133;
}
.student-card p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}
</style>
