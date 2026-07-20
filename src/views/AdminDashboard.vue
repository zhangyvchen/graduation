<template>
  <div class="dashboard-page">
    <header class="content-header">
      <h2>管理后台首页</h2>
      <el-select v-model="selectedYear" placeholder="选择年份" style="width: 150px" @change="handleYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
    </header>
    
    <div class="quick-stats">
      <el-card class="stat-card clickable" shadow="hover" @click="goToPage('/admin/batch')" @mousemove="handleCardMouseMove" @mouseleave="handleCardMouseLeave">
        <div class="light-mask"></div>
        <div class="stat-icon-wrap" style="background: #eef2ff;">
          <span class="stat-icon" style="color: #667eea;">📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalBatches }}</div>
          <div class="stat-label">管理批次</div>
        </div>
        <div class="stat-arrow">→</div>
      </el-card>
      <el-card class="stat-card clickable" shadow="hover" @click="goToPage('/admin/student')" @mousemove="handleCardMouseMove" @mouseleave="handleCardMouseLeave">
        <div class="light-mask"></div>
        <div class="stat-icon-wrap" style="background: #fdf2f8;">
          <span class="stat-icon" style="color: #ec4899;">👥</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalStudents }}</div>
          <div class="stat-label">学生总数</div>
        </div>
        <div class="stat-arrow">→</div>
      </el-card>
      <el-card class="stat-card clickable" shadow="hover" @click="goToPage('/admin/template')" @mousemove="handleCardMouseMove" @mouseleave="handleCardMouseLeave">
        <div class="light-mask"></div>
        <div class="stat-icon-wrap" style="background: #eff6ff;">
          <span class="stat-icon" style="color: #3b82f6;">📄</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalTemplates }}</div>
          <div class="stat-label">报告模板</div>
        </div>
        <div class="stat-arrow">→</div>
      </el-card>
      <el-card class="stat-card clickable" shadow="hover" @click="goToPage('/admin/message')" @mousemove="handleCardMouseMove" @mouseleave="handleCardMouseLeave">
        <div class="light-mask"></div>
        <div class="stat-icon-wrap" style="background: #f0fdf4;">
          <span class="stat-icon" style="color: #22c55e;">💬</span>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingMessages }}</div>
          <div class="stat-label">待审核留言</div>
        </div>
        <div class="stat-arrow">→</div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card-full" shadow="hover">
        <template #header>
          <span class="chart-title">就业地区分布</span>
          <span class="chart-tip">点击省份查看学生名单</span>
        </template>
        <div ref="provinceChart" class="chart-container-full"></div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <span class="chart-title">就业状态分布</span>
          <span class="chart-tip">点击查看学生名单</span>
        </template>
        <div ref="statusChart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <span class="chart-title">薪资水平分布</span>
          <span class="chart-tip">点击查看学生名单</span>
        </template>
        <div ref="salaryChart" class="chart-container"></div>
      </el-card>
    </div>
    
    <div class="recent-activities">
      <el-card shadow="hover">
        <template #header>
          <span class="chart-title">最近操作</span>
        </template>
        <el-table :data="activities" border v-loading="loading">
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="operation" label="操作" />
          <el-table-column prop="operator" label="操作者" width="100" />
          <el-table-column prop="module" label="模块" width="100">
            <template #default="scope">
              <el-tag size="small">{{ scope.row.module || '-' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="activities.length === 0 && !loading" class="empty-tip">
          暂无操作记录
        </div>
      </el-card>
    </div>
    
    <el-dialog 
      v-model="showStudentModal" 
      :title="modalTitle" 
      width="1000px" 
      :before-close="closeModal"
      class="student-modal"
      append-to-body
    >
      <div v-loading="modalLoading" class="modal-content">
        <el-table :data="selectedStudents" border class="student-table" :max-height="420" style="width: 1050px;">
          <el-table-column prop="studentId" label="学号" width="130" fixed />
          <el-table-column prop="name" label="姓名" width="100" fixed />
          <el-table-column prop="className" label="班级" width="140" />
          <el-table-column prop="major" label="专业" width="140" />
          <el-table-column prop="department" label="学院" width="180" />
          <el-table-column prop="employmentStatus" label="就业状态" width="110">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.employmentStatus)" size="small">
                {{ getStatusLabel(scope.row.employmentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="salary" label="薪资" width="100">
            <template #default="scope">
              {{ scope.row.salary ? (scope.row.salary / 1000).toFixed(1) + 'k' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="province" label="省份" width="120" />
        </el-table>
        <div v-if="selectedStudents.length === 0 && !modalLoading" class="empty-tip">
          暂无数据
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getRecentLogs } from '../api/operationLog'
import { getAllBatch } from '../api/batch'
import { getAllStudents, getDashboardStudentList, getStudentYears } from '../api/student'
import { getTemplateList } from '../api/template'
import { getProvinceStats } from '../api/destination'
import { getPendingMessageCount } from '../api/admin'

const router = useRouter()
const loading = ref(false)
const years = ref([2024])
const selectedYear = ref(2024)

const stats = ref({
  totalBatches: 0,
  totalStudents: 0,
  totalTemplates: 0,
  pendingMessages: 0
})

const activities = ref([])
const provinceData = ref([])
const statusData = ref([])
const salaryData = ref([])
const allStudents = ref([])

const provinceChart = ref(null)
const statusChart = ref(null)
const salaryChart = ref(null)

const showStudentModal = ref(false)
const modalTitle = ref('')
const modalLoading = ref(false)
const selectedStudents = ref([])

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 19)
}

const goToPage = (path) => {
  router.push(path)
}

const handleCardMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const mask = e.currentTarget.querySelector('.light-mask')
  if (mask) {
    mask.style.left = `${x}px`
    mask.style.top = `${y}px`
    mask.style.opacity = '1'
  }
}

const handleCardMouseLeave = (e) => {
  const mask = e.currentTarget.querySelector('.light-mask')
  if (mask) {
    mask.style.opacity = '0'
  }
}

const getStatusLabel = (status) => {
  return {
    'employed': '已就业',
    'enrolled': '升学',
    'unemployed': '待就业',
    'entrepreneur': '自主创业',
    '已就业': '已就业',
    '升学': '升学',
    '待就业': '待就业',
    '自主创业': '自主创业'
  }[status] || status
}

const getStatusType = (status) => {
  return {
    'employed': 'success',
    'enrolled': 'primary',
    'unemployed': 'warning',
    'entrepreneur': 'danger',
    '已就业': 'success',
    '升学': 'primary',
    '待就业': 'warning',
    '自主创业': 'danger'
  }[status] || 'info'
}

const showStudentList = (title, filterFn) => {
  modalTitle.value = title
  modalLoading.value = true
  selectedStudents.value = allStudents.value.filter(filterFn)
  modalLoading.value = false
  showStudentModal.value = true
}

const closeModal = () => {
  showStudentModal.value = false
  selectedStudents.value = []
}

const fetchStats = async () => {
  try {
    const [batchRes, studentRes, templateRes, messageRes] = await Promise.all([
      getAllBatch(),
      getAllStudents(selectedYear.value),
      getTemplateList({ all: true }),
      getPendingMessageCount().catch(() => ({ data: 0 }))
    ])
    
    if (batchRes.code === 200) {
      stats.value.totalBatches = batchRes.data.length
    }
    
    if (studentRes.code === 200) {
      stats.value.totalStudents = studentRes.data.total || 0
    }
    
    if (templateRes.code === 200) {
      stats.value.totalTemplates = templateRes.data.length
    }
    
    if (messageRes.code === 200) {
      stats.value.pendingMessages = messageRes.data || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchProvinceStats = async () => {
  try {
    const res = await getProvinceStats(selectedYear.value)
    if (res.code === 200 && res.data) {
      const provinces = res.data.provinces || []
      const counts = res.data.counts || []
      provinceData.value = provinces.map((p, i) => ({ name: p, value: counts[i] }))
    }
  } catch (error) {
    console.error('获取省份统计失败:', error)
    provinceData.value = [
      { name: '广东省', value: 280 },
      { name: '北京市', value: 195 },
      { name: '上海市', value: 178 },
      { name: '浙江省', value: 156 },
      { name: '江苏省', value: 142 },
      { name: '四川省', value: 98 },
      { name: '湖北省', value: 85 },
      { name: '湖南省', value: 76 },
      { name: '福建省', value: 68 },
      { name: '山东省', value: 55 },
      { name: '河南省', value: 48 },
      { name: '安徽省', value: 42 },
      { name: '河北省', value: 38 },
      { name: '广西壮族自治区', value: 35 },
      { name: '重庆市', value: 32 }
    ]
  }
}

const fetchStatusStats = async () => {
  try {
    const res = await getDashboardStudentList(selectedYear.value)
    if (res.code === 200 && res.data) {
      const students = res.data || []
      allStudents.value = students
      const statusMap = {}
      students.forEach(s => {
        const status = s.employmentStatus || '待就业'
        const statusLabel = getStatusLabel(status)
        statusMap[statusLabel] = (statusMap[statusLabel] || 0) + 1
      })
      statusData.value = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    }
  } catch (error) {
    console.error('获取就业状态失败:', error)
    statusData.value = [
      { name: '已就业', value: 850 },
      { name: '升学', value: 320 },
      { name: '待就业', value: 120 },
      { name: '自主创业', value: 60 }
    ]
  }
}

const fetchSalaryStats = async () => {
  try {
    const students = allStudents.value
    const salaryMap = { '3k以下': 0, '3-5k': 0, '5-8k': 0, '8-10k': 0, '10-15k': 0, '15k以上': 0 }
    students.forEach(s => {
      const salary = parseFloat(s.salary || 0)
      if (salary < 3000) salaryMap['3k以下']++
      else if (salary < 5000) salaryMap['3-5k']++
      else if (salary < 8000) salaryMap['5-8k']++
      else if (salary < 10000) salaryMap['8-10k']++
      else if (salary < 15000) salaryMap['10-15k']++
      else salaryMap['15k以上']++
    })
    salaryData.value = Object.entries(salaryMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
  } catch (error) {
    console.error('获取薪资分布失败:', error)
    salaryData.value = [
      { name: '3k以下', value: 60 },
      { name: '3-5k', value: 180 },
      { name: '5-8k', value: 320 },
      { name: '8-10k', value: 280 },
      { name: '10-15k', value: 220 },
      { name: '15k以上', value: 90 }
    ]
  }
}

const fetchRecentLogs = async () => {
  loading.value = true
  try {
    const res = await getRecentLogs(10)
    if (res.code === 200) {
      activities.value = res.data
    }
  } catch (error) {
    if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
      console.error('获取操作日志失败:', error)
    }
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  if (provinceChart.value) {
    const chart = echarts.init(provinceChart.value)
    const sortedData = [...provinceData.value].sort((a, b) => b.value - a.value).slice(0, 15)
    
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '12%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
      xAxis: { type: 'value', axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { 
        type: 'category', 
        data: sortedData.map(item => item.name).reverse(),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#374151', fontSize: 12 }
      },
      series: [{
        name: '人数',
        type: 'bar',
        data: sortedData.map(item => item.value).reverse(),
        barWidth: '55%',
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#A7E6F0' },
            { offset: 1, color: '#4DB6D4' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#7DD3E8' },
              { offset: 1, color: '#3AA4C2' }
            ])
          }
        }
      }]
    })
    
    chart.on('click', (params) => {
      const provinceName = sortedData[sortedData.length - 1 - params.dataIndex]?.name
      if (provinceName) {
        showStudentList(`${provinceName}就业学生名单`, (s) => s.province === provinceName)
      }
    })
    
    window.addEventListener('resize', () => chart.resize())
  }
  
  if (statusChart.value) {
    const chart = echarts.init(statusChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', textStyle: { color: '#374151' } },
      series: [{
        name: '就业状态',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['55%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#374151' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.1)' }
        },
        data: statusData.value,
        color: ['#7ED8A0', '#7DD3E8', '#FFE082', '#FFAB91']
      }]
    })
    
    chart.on('click', (params) => {
      const statusName = params.name
      showStudentList(`${statusName}学生名单`, (s) => {
        const status = s.employmentStatus || '待就业'
        return getStatusLabel(status) === statusName
      })
    })
    
    window.addEventListener('resize', () => chart.resize())
  }
  
  if (salaryChart.value) {
    const chart = echarts.init(salaryChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '5%', right: '5%', bottom: '5%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: salaryData.value.map(item => item.name),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 }
      },
      yAxis: { 
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' }
      },
      series: [{
        name: '人数',
        type: 'bar',
        data: salaryData.value.map(item => item.value),
        barWidth: '60%',
        barGap: '10%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#A7E6F0' },
            { offset: 1, color: '#4DB6D4' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7DD3E8' },
              { offset: 1, color: '#3AA4C2' }
            ])
          }
        }
      }]
    })
    
    chart.on('click', (params) => {
      const salaryRange = params.name
      const salaryMap = {
        '3k以下': (s) => parseFloat(s.salary || 0) < 3000,
        '3-5k': (s) => parseFloat(s.salary || 0) >= 3000 && parseFloat(s.salary || 0) < 5000,
        '5-8k': (s) => parseFloat(s.salary || 0) >= 5000 && parseFloat(s.salary || 0) < 8000,
        '8-10k': (s) => parseFloat(s.salary || 0) >= 8000 && parseFloat(s.salary || 0) < 10000,
        '10-15k': (s) => parseFloat(s.salary || 0) >= 10000 && parseFloat(s.salary || 0) < 15000,
        '15k以上': (s) => parseFloat(s.salary || 0) >= 15000
      }
      const filterFn = salaryMap[salaryRange]
      if (filterFn) {
        showStudentList(`${salaryRange}薪资学生名单`, filterFn)
      }
    })
    
    window.addEventListener('resize', () => chart.resize())
  }
}

const handleYearChange = async () => {
  await fetchAllData()
}

const fetchAllData = async () => {
  try {
    const yearRes = await getStudentYears()
    if (yearRes.code === 200 && yearRes.data) {
      years.value = yearRes.data
      if (years.value.length > 0) {
        selectedYear.value = years.value[0]
      }
    }
  } catch (error) {
    console.error('获取年份列表失败:', error)
  }
  
  await Promise.all([
    fetchStats(),
    fetchProvinceStats(),
    fetchStatusStats(),
    fetchRecentLogs()
  ])
  await fetchSalaryStats()
  nextTick(() => {
    initCharts()
  })
}

onMounted(() => {
  fetchAllData()
  const logTimer = setInterval(() => {
    fetchRecentLogs()
  }, 5000)
  onUnmounted(() => {
    clearInterval(logTimer)
  })
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background: #fafafa;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  color: #374151;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.quick-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  background: #fff;
  position: relative;
  overflow: hidden;
}

.light-mask {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(182, 221, 220, 0.4) 0%, rgba(182, 221, 220, 0.1) 40%, rgba(182, 221, 220, 0) 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 10;
  will-change: left, top, opacity;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

.stat-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.stat-card.clickable:hover .stat-icon-wrap {
  transform: scale(1.1);
}

.stat-icon {
  font-size: 26px;
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.stat-arrow {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 18px;
  font-weight: 300;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card.clickable:hover .stat-arrow {
  opacity: 1;
}

.charts-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  flex: 1;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  background: #fff;
}

.chart-card-full {
  width: 100%;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  background: #fff;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.chart-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 10px;
}

.chart-container {
  height: 280px;
}

.chart-container-full {
  height: 320px;
}

.recent-activities {
  margin-top: 16px;
}

.recent-activities .el-card {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  background: #fff;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
}

.modal-content {
  overflow: visible;
}
</style>
