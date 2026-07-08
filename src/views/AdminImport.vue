<!-- src/views/AdminImport.vue -->
<template>
  <div class="import-page">
    <header class="content-header">
      <h2>📥 数据导入管理</h2>
      <el-tag type="info" size="large">支持 .xlsx / .xls 格式，异步流式导入（每批1000条）</el-tag>
    </header>

    <!-- 统计概览 -->
    <div class="stats-row">
      <el-card class="stat-card" v-for="stat in statsData" :key="stat.key">
        <div class="stat-content">
          <div class="stat-icon" :style="{ background: stat.color }">{{ stat.icon }}</div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 三个导入卡片 -->
    <div class="import-grid">
      <!-- 去向数据 -->
      <el-card class="import-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><span class="card-icon">📍</span> 去向数据导入</span>
            <el-tag :type="getStatusType(destination.status)" size="small">
              {{ getStatusLabel(destination.status) }}
            </el-tag>
          </div>
        </template>
        <div class="card-body">
          <div class="file-path-row">
            <el-input v-model="destination.filePath" placeholder="请输入Excel文件路径，如：D:/excel-data/destination.xlsx" size="default">
              <template #prepend>
                <el-icon><FolderOpened /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="startImport('destination')" :loading="destination.loading" :disabled="!destination.filePath">
              开始导入
            </el-button>
          </div>

          <!-- 进度条 -->
          <div class="progress-area" v-if="destination.progress > 0 || destination.status === 'PROCESSING'">
            <el-progress
                :percentage="destination.progress"
                :status="destination.status === 'ERROR' ? 'exception' : destination.progress === 100 ? 'success' : ''"
                :stroke-width="10"
                striped
                :striped-flow="destination.status === 'PROCESSING'"
            />
            <div class="progress-info">
              <span>已处理 {{ destination.processedRows }} / {{ destination.totalRows }} 条</span>
              <span class="status-text" :class="destination.status.toLowerCase()">
                {{ getStatusDetail(destination.status) }}
                <span v-if="destination.errorMessage" class="error-msg">：{{ destination.errorMessage }}</span>
              </span>
            </div>
          </div>

          <div class="card-footer">
            <el-button size="small" @click="downloadTemplate('destination')">下载模板</el-button>
            <el-button size="small" type="warning" @click="clearProgress('destination')" v-if="destination.progress > 0">
              清除状态
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 学习画像 -->
      <el-card class="import-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><span class="card-icon">📚</span> 学习画像导入</span>
            <el-tag :type="getStatusType(learning.status)" size="small">
              {{ getStatusLabel(learning.status) }}
            </el-tag>
          </div>
        </template>
        <div class="card-body">
          <div class="file-path-row">
            <el-input v-model="learning.filePath" placeholder="请输入Excel文件路径，如：D:/excel-data/learning.xlsx" size="default">
              <template #prepend>
                <el-icon><FolderOpened /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="startImport('learning')" :loading="learning.loading" :disabled="!learning.filePath">
              开始导入
            </el-button>
          </div>

          <div class="progress-area" v-if="learning.progress > 0 || learning.status === 'PROCESSING'">
            <el-progress
                :percentage="learning.progress"
                :status="learning.status === 'ERROR' ? 'exception' : learning.progress === 100 ? 'success' : ''"
                :stroke-width="10"
                striped
                :striped-flow="learning.status === 'PROCESSING'"
            />
            <div class="progress-info">
              <span>已处理 {{ learning.processedRows }} / {{ learning.totalRows }} 条</span>
              <span class="status-text" :class="learning.status.toLowerCase()">
                {{ getStatusDetail(learning.status) }}
                <span v-if="learning.errorMessage" class="error-msg">：{{ learning.errorMessage }}</span>
              </span>
            </div>
          </div>

          <div class="card-footer">
            <el-button size="small" @click="downloadTemplate('learning')">下载模板</el-button>
            <el-button size="small" type="warning" @click="clearProgress('learning')" v-if="learning.progress > 0">
              清除状态
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 成长轨迹 -->
      <el-card class="import-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><span class="card-icon">📈</span> 成长轨迹导入</span>
            <el-tag :type="getStatusType(growth.status)" size="small">
              {{ getStatusLabel(growth.status) }}
            </el-tag>
          </div>
        </template>
        <div class="card-body">
          <div class="file-path-row">
            <el-input v-model="growth.filePath" placeholder="请输入Excel文件路径，如：D:/excel-data/growth.xlsx" size="default">
              <template #prepend>
                <el-icon><FolderOpened /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="startImport('growth')" :loading="growth.loading" :disabled="!growth.filePath">
              开始导入
            </el-button>
          </div>

          <div class="progress-area" v-if="growth.progress > 0 || growth.status === 'PROCESSING'">
            <el-progress
                :percentage="growth.progress"
                :status="growth.status === 'ERROR' ? 'exception' : growth.progress === 100 ? 'success' : ''"
                :stroke-width="10"
                striped
                :striped-flow="growth.status === 'PROCESSING'"
            />
            <div class="progress-info">
              <span>已处理 {{ growth.processedRows }} / {{ growth.totalRows }} 条</span>
              <span class="status-text" :class="growth.status.toLowerCase()">
                {{ getStatusDetail(growth.status) }}
                <span v-if="growth.errorMessage" class="error-msg">：{{ growth.errorMessage }}</span>
              </span>
            </div>
          </div>

          <div class="card-footer">
            <el-button size="small" @click="downloadTemplate('growth')">下载模板</el-button>
            <el-button size="small" type="warning" @click="clearProgress('growth')" v-if="growth.progress > 0">
              清除状态
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 导入日志 -->
    <el-card class="log-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📋 导入日志</span>
          <el-button size="small" @click="clearLogs">清空日志</el-button>
        </div>
      </template>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-icon">{{ log.icon }}</span>
          <span class="log-content">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">暂无日志</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened } from '@element-plus/icons-vue'
import {
  importDestinationAsync,
  getDestinationImportProgress,
  importLearningAsync,
  getLearningImportProgress,
  importGrowthAsync,
  getGrowthImportProgress
} from '../api/import'

// ========== 统计数据 ==========
const statsData = ref([
  { key: 'destination', icon: '📍', label: '去向数据', color: 'linear-gradient(135deg, #667eea, #764ba2)', count: 0 },
  { key: 'learning', icon: '📚', label: '学习画像', color: 'linear-gradient(135deg, #f093fb, #f5576c)', count: 0 },
  { key: 'growth', icon: '📈', label: '成长轨迹', color: 'linear-gradient(135deg, #4facfe, #00f2fe)', count: 0 }
])

// ========== 导入状态管理 ==========
const createImportState = () => ({
  filePath: '',
  progress: 0,
  totalRows: 0,
  processedRows: 0,
  status: 'IDLE', // IDLE | READING | PROCESSING | COMPLETED | ERROR
  errorMessage: '',
  loading: false,
  timer: null
})

const destination = reactive(createImportState())
const learning = reactive(createImportState())
const growth = reactive(createImportState())

const importMap = {
  destination: { state: destination, api: importDestinationAsync, progressApi: getDestinationImportProgress },
  learning: { state: learning, api: importLearningAsync, progressApi: getLearningImportProgress },
  growth: { state: growth, api: importGrowthAsync, progressApi: getGrowthImportProgress }
}

// ========== 日志 ==========
const logs = ref([])

const addLog = (type, message) => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  logs.value.unshift({
    time: new Date().toLocaleString(),
    type,
    icon: icons[type] || 'ℹ️',
    message
  })
  if (logs.value.length > 200) {
    logs.value = logs.value.slice(0, 200)
  }
}

const clearLogs = () => {
  logs.value = []
}

// ========== 状态辅助方法 ==========
const getStatusType = (status) => {
  const map = { IDLE: 'info', READING: 'warning', PROCESSING: 'warning', COMPLETED: 'success', ERROR: 'danger' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { IDLE: '待开始', READING: '读取中', PROCESSING: '处理中', COMPLETED: '已完成', ERROR: '失败' }
  return map[status] || status
}

const getStatusDetail = (status) => {
  const map = { IDLE: '等待开始', READING: '正在读取文件...', PROCESSING: '正在处理数据...', COMPLETED: '✅ 导入完成！', ERROR: '❌ 导入失败' }
  return map[status] || status
}

// ========== 核心导入逻辑 ==========
const startImport = async (type) => {
  const config = importMap[type]
  const state = config.state

  if (!state.filePath || !state.filePath.trim()) {
    ElMessage.warning('请输入文件路径')
    return
  }

  // 检查文件扩展名
  const ext = state.filePath.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls'].includes(ext)) {
    ElMessage.error('只支持 .xlsx 或 .xls 格式')
    return
  }

  // 如果已有进度，提示确认重新导入
  if (state.progress > 0 && state.progress < 100) {
    try {
      await ElMessageBox.confirm('当前有进行中的导入任务，是否重新开始？', '提示', {
        confirmButtonText: '重新导入',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }

  // 重置状态
  state.progress = 0
  state.totalRows = 0
  state.processedRows = 0
  state.status = 'READING'
  state.errorMessage = ''
  state.loading = true

  const typeLabels = { destination: '去向数据', learning: '学习画像', growth: '成长轨迹' }
  addLog('info', `开始导入 ${typeLabels[type]}，文件：${state.filePath}`)

  try {
    const res = await config.api(state.filePath)
    if (res.code === 200) {
      ElMessage.success('导入任务已提交，后台正在处理...')
      addLog('success', `${typeLabels[type]} 导入任务已提交`)

      // 开始轮询进度
      if (state.timer) clearInterval(state.timer)
      state.timer = setInterval(() => {
        pollProgress(type)
      }, 2000)

      // 立即查询一次
      await pollProgress(type)
    } else {
      state.status = 'ERROR'
      state.errorMessage = res.message || '提交失败'
      state.loading = false
      ElMessage.error(`提交失败：${res.message}`)
      addLog('error', `${typeLabels[type]} 导入提交失败：${res.message}`)
    }
  } catch (error) {
    state.status = 'ERROR'
    state.errorMessage = error.message || '网络异常'
    state.loading = false
    ElMessage.error(`导入失败：${error.message}`)
    addLog('error', `${typeLabels[type]} 导入异常：${error.message}`)
  }
}

const pollProgress = async (type) => {
  const config = importMap[type]
  const state = config.state

  try {
    const res = await config.progressApi(state.filePath)
    if (res.code === 200) {
      const progress = res.data

      if (progress === -1) {
        // 任务已完成或不存在
        if (state.status !== 'COMPLETED' && state.status !== 'ERROR') {
          state.status = 'COMPLETED'
          state.progress = 100
          state.loading = false
          if (state.timer) {
            clearInterval(state.timer)
            state.timer = null
          }
          const labels = { destination: '去向数据', learning: '学习画像', growth: '成长轨迹' }
          addLog('success', `${labels[type]} 导入完成！共导入 ${state.processedRows} 条数据`)
          ElMessage.success(`${labels[type]} 导入完成！`)
        }
        return
      }

      // 更新进度
      state.progress = progress

      // 根据进度判断状态
      if (progress >= 100) {
        state.status = 'COMPLETED'
        state.loading = false
        if (state.timer) {
          clearInterval(state.timer)
          state.timer = null
        }
        const labels = { destination: '去向数据', learning: '学习画像', growth: '成长轨迹' }
        addLog('success', `${labels[type]} 导入完成！共导入 ${state.processedRows || '?'} 条数据`)
        ElMessage.success(`${labels[type]} 导入完成！`)
      } else if (progress > 0) {
        state.status = 'PROCESSING'
      } else {
        state.status = 'READING'
      }
    } else {
      // 查询失败但任务可能还在进行
      console.warn('查询进度失败:', res)
    }
  } catch (error) {
    console.error('轮询进度失败:', error)
    // 不中断轮询，继续尝试
  }
}

const clearProgress = (type) => {
  const config = importMap[type]
  const state = config.state

  if (state.timer) {
    clearInterval(state.timer)
    state.timer = null
  }

  state.progress = 0
  state.totalRows = 0
  state.processedRows = 0
  state.status = 'IDLE'
  state.errorMessage = ''
  state.loading = false
  state.filePath = ''
}

// ========== 下载模板 ==========
const downloadTemplate = (type) => {
  const templates = {
    destination: {
      name: '去向数据导入模板',
      headers: ['学号', '省份', '城市', '行业', '公司名称', '职位名称', '学校名称', '专业名称', '年份']
    },
    learning: {
      name: '学习画像导入模板',
      headers: ['学号', '平均绩点', '图书馆借阅次数', '实验室参与次数', '竞赛奖项', '年份']
    },
    growth: {
      name: '成长轨迹导入模板',
      headers: ['学号', '荣誉类型', '荣誉名称', '奖学金类型', '学生干部职位', '政治面貌', '年份']
    }
  }

  const template = templates[type]
  // 生成CSV内容（简单模拟）
  const content = template.headers.join(',') + '\n' + '示例数据1,示例数据2,示例数据3,...'
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.name}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  addLog('info', `下载模板：${template.name}`)
  ElMessage.success('模板下载已开始')
}

// ========== 生命周期 ==========
onMounted(() => {
  // 清理所有定时器
})

onUnmounted(() => {
  // 清理所有定时器
  Object.values(importMap).forEach(({ state }) => {
    if (state.timer) {
      clearInterval(state.timer)
      state.timer = null
    }
  })
})

// 添加 ElMessageBox 引用
import { ElMessageBox } from 'element-plus'
</script>

<style scoped>
.import-page {
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.content-header h2 {
  color: #333;
  font-size: 24px;
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.import-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.import-card {
  border-radius: 12px;
  transition: transform 0.2s;
}

.import-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-icon {
  margin-right: 8px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-path-row {
  display: flex;
  gap: 10px;
}

.file-path-row :deep(.el-input) {
  flex: 1;
}

.file-path-row :deep(.el-input-group__prepend) {
  padding: 0 12px;
}

.progress-area {
  padding: 8px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

.status-text {
  font-weight: 500;
}

.status-text.idle { color: #909399; }
.status-text.reading { color: #e6a23c; }
.status-text.processing { color: #409eff; }
.status-text.completed { color: #67c23a; }
.status-text.error { color: #f56c6c; }

.error-msg {
  color: #f56c6c;
  font-weight: normal;
}

.card-footer {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.log-card {
  border-radius: 12px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f5f7fa;
  align-items: center;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  font-size: 12px;
  min-width: 140px;
}

.log-icon {
  font-size: 16px;
}

.log-content {
  color: #333;
}

.log-item.error .log-content {
  color: #f56c6c;
}

.log-item.success .log-content {
  color: #67c23a;
}

.log-item.warning .log-content {
  color: #e6a23c;
}

.log-empty {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

@media (max-width: 1400px) {
  .import-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .import-grid {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .file-path-row {
    flex-direction: column;
  }
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>