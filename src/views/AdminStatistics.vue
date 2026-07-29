<template>
  <div class="statistics-page">
    <header class="content-header">
      <h2>数据统计</h2>
      <el-select v-model="selectedYear" placeholder="选择年份" style="width: 150px" @change="handleYearChange">
        <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
      </el-select>
    </header>
    
    <div class="stats-overview">
      <el-card class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.totalGraduates }}</div>
          <div class="stat-label">总毕业生数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.employmentRate }}%</div>
          <div class="stat-label">就业率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.enrollmentRate }}%</div>
          <div class="stat-label">升学率</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatSalary(statistics.averageSalary) }}K</div>
          <div class="stat-label">平均薪资</div>
        </div>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card">
        <template #header>
          <span>专业就业率对比</span>
          <span class="chart-tip">（点击柱形查看详情）</span>
        </template>
        <div ref="majorChart" class="chart-container-major"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>就业单位类型分布</span>
          <span class="chart-tip">（点击行查看详情）</span>
        </template>
        <el-table :data="companyTypeData" border @row-click="handleCompanyTypeClick" highlight-current-row>
          <el-table-column prop="type" label="单位类型" />
          <el-table-column prop="count" label="人数" />
          <el-table-column prop="percentage" label="占比(%)" />
          <el-table-column prop="trend" label="同比">
            <template #default="scope">
              <span :class="scope.row.trend > 0 ? 'trend-up' : 'trend-down'">
                {{ scope.row.trend > 0 ? '+' : '' }}{{ scope.row.trend }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
    
    <div class="charts-row">
      <el-card class="chart-card-full">
        <template #header>
          <span>历年就业率趋势</span>
        </template>
        <div ref="trendChart" class="chart-container-full"></div>
      </el-card>
    </div>
    
    <!-- 学生详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="detailDialogTitle" width="900px" top="5vh">
      <div v-if="detailLoading" style="text-align: center; padding: 40px;">
        <el-icon class="is-loading" :size="32" color="#48CAE4"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      <div v-else>
        <div class="detail-summary">
          <span>共 <strong>{{ studentDetailList.length }}</strong> 名学生</span>
        </div>
        <el-table :data="studentDetailList" border stripe max-height="500">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="gender" label="性别" width="60" />
          <el-table-column prop="major" label="专业" show-overflow-tooltip />
          <el-table-column prop="className" label="班级" width="100" />
          <el-table-column prop="employmentStatus" label="就业状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.employmentStatus)" size="small">
                {{ scope.row.employmentStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="companyName" label="公司/单位" show-overflow-tooltip />
          <el-table-column prop="jobTitle" label="职位" width="100" />
          <el-table-column prop="salary" label="薪资" width="100">
            <template #default="scope">
              <span v-if="scope.row.salary">¥{{ Number(scope.row.salary).toLocaleString() }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="schoolName" label="升学学校" show-overflow-tooltip />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getStatisticsByYear, getStatisticsTrend, getCompanyTypes, getMajorRates, getStudentYears, getStatisticsStudents } from '../api/batch'
import { getAdminPermissions } from '../api/admin'
import { useAuth } from '../stores/auth'

const auth = useAuth()
const userPermissions = ref([])

const hasPermission = (module) => {
  if (auth.state.role?.toUpperCase() === 'ADMIN') return true
  return userPermissions.value.some(p => p.module === module)
}

const fetchUserPermissions = async () => {
  const userId = auth.state.user?.id
  if (!userId) return
  try {
    const res = await getAdminPermissions(userId)
    if (res.code === 200) {
      userPermissions.value = res.data || []
    }
  } catch (e) {
    console.error('获取权限失败:', e)
  }
}

const years = ref([])
const selectedYear = ref(null)

const statistics = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0,
  averageSalary: 0
})

const companyTypeData = ref([])
const majorRateData = ref([])
const trendData = ref({
  years: [],
  employmentRates: [],
  enrollmentRates: []
})

const majorChart = ref(null)
const trendChart = ref(null)

// 弹窗相关
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('')
const detailLoading = ref(false)
const studentDetailList = ref([])

// 格式化薪资（保留3位小数）
const formatSalary = (salary) => {
  if (!salary && salary !== 0) return '0.000'
  return Number(salary).toFixed(3)
}

// 获取就业状态对应的标签颜色
const getStatusTagType = (status) => {
  const map = {
    '已就业': 'success',
    '升学': 'primary',
    '待就业': 'warning',
    '自主创业': 'info',
    '未就业': 'danger'
  }
  return map[status] || ''
}

// 加载学生详情
const loadStudentDetail = async (params) => {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getStatisticsStudents(params)
    if (res.code === 200) {
      studentDetailList.value = res.data || []
    }
  } catch (error) {
    console.error('获取学生详情失败:', error)
    studentDetailList.value = []
    ElMessage.error('获取学生详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 点击柱状图的某个柱子
const handleBarClick = (params) => {
  // 检查是否有学生管理权限
  if (!hasPermission('student')) {
    ElMessage.warning('您没有查看学生详情的权限，请联系管理员分配权限')
    return
  }
  if (params.name) {
    detailDialogTitle.value = `${params.name}专业学生详情（${selectedYear.value}届）`
    loadStudentDetail({
      year: selectedYear.value,
      major: params.name
    })
  }
}

// 点击单位类型表格行
const handleCompanyTypeClick = (row) => {
  // 检查是否有学生管理权限
  if (!hasPermission('student')) {
    ElMessage.warning('您没有查看学生详情的权限，请联系管理员分配权限')
    return
  }
  if (row.type) {
    detailDialogTitle.value = `${row.type}学生详情（${selectedYear.value}届）`
    loadStudentDetail({
      year: selectedYear.value,
      companyType: row.type
    })
  }
}

const handleYearChange = async () => {
  // 只重新加载数据，不重新获取年份列表
  await loadDataByYear()
}

const fetchYears = async () => {
  try {
    const res = await getStudentYears()
    if (res.code === 200 && res.data) {
      // 按降序排列，最新年份在前
      years.value = res.data.sort((a, b) => b - a)
      if (years.value.length > 0) {
        selectedYear.value = years.value[0] // 默认选中最新年份
      }
    }
  } catch (error) {
    console.error('获取年份数据失败', error)
    // 如果API失败，使用当前年份
    const currentYear = new Date().getFullYear()
    years.value = [currentYear]
    selectedYear.value = currentYear
  }
}

const fetchStatistics = async () => {
  if (!selectedYear.value) return
  try {
    const res = await getStatisticsByYear(selectedYear.value)
    if (res.code === 200) {
      statistics.value = {
        totalGraduates: res.data.totalGraduates || 0,
        employmentRate: res.data.employmentRate || 0,
        enrollmentRate: res.data.enrollmentRate || 0,
        averageSalary: res.data.averageSalary ? res.data.averageSalary / 1000 : 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
    statistics.value = {
      totalGraduates: 0,
      employmentRate: 0,
      enrollmentRate: 0,
      averageSalary: 0
    }
  }
}

const fetchCompanyTypes = async () => {
  if (!selectedYear.value) return
  try {
    const res = await getCompanyTypes(selectedYear.value)
    if (res.code === 200) {
      companyTypeData.value = res.data
    }
  } catch (error) {
    console.error('获取单位类型数据失败', error)
    companyTypeData.value = []
  }
}

const fetchMajorRates = async () => {
  if (!selectedYear.value) return
  try {
    const res = await getMajorRates(selectedYear.value)
    if (res.code === 200) {
      majorRateData.value = res.data
    }
  } catch (error) {
    console.error('获取专业就业率数据失败', error)
    majorRateData.value = []
  }
}

const fetchTrend = async () => {
  try {
    const res = await getStatisticsTrend()
    if (res.code === 200) {
      trendData.value = {
        years: res.data.years.map(y => y + '届'),
        employmentRates: res.data.employmentRates,
        enrollmentRates: res.data.enrollmentRates
      }
    }
  } catch (error) {
    console.error('获取趋势数据失败', error)
    trendData.value = {
      years: [],
      employmentRates: [],
      enrollmentRates: []
    }
  }
}

const initCharts = () => {
  // 销毁旧实例并重新创建
  if (majorChart.value) {
    const oldChart = echarts.getInstanceByDom(majorChart.value)
    if (oldChart) oldChart.dispose()
    const chart = echarts.init(majorChart.value)
    const majors = majorRateData.value.map(item => item.major)
    const majorCount = majors.length
    // 根据专业数量动态调整参数
    const barWidth = majorCount > 15 ? '35%' : majorCount > 10 ? '40%' : '50%'
    const labelFontSize = majorCount > 15 ? 11 : 12
    const rotate = majorCount > 15 ? 30 : majorCount > 8 ? 20 : 0
    const bottomMargin = majorCount > 15 ? '18%' : majorCount > 8 ? '15%' : '10%'
    
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
      grid: { left: '5%', right: '5%', bottom: bottomMargin, top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: majors,
        axisLabel: { 
          interval: 0,
          rotate: rotate,
          fontSize: labelFontSize,
          color: '#374151',
          fontWeight: '500',
          margin: 12
        },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { show: false }
      },
      yAxis: { 
        type: 'value', 
        max: 100, 
        axisLabel: { formatter: '{value}%', color: '#6b7280', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } }
      },
      series: [{
        name: '就业率',
        type: 'bar',
        data: majorRateData.value.map(item => item.employmentRate),
        barWidth: barWidth,
        itemStyle: { 
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#48CAE4' },
            { offset: 1, color: '#0096C7' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7DD3E8' },
              { offset: 1, color: '#0077B6' }
            ])
          }
        },
        label: {
          show: false
        }
      }]
    })
    // 绑定点击事件
    chart.on('click', handleBarClick)
  }
  
  if (trendChart.value) {
    const oldChart = echarts.getInstanceByDom(trendChart.value)
    if (oldChart) oldChart.dispose()
    const chart = echarts.init(trendChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['就业率', '升学率'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: trendData.value.years },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        {
          name: '就业率',
          type: 'line',
          data: trendData.value.employmentRates,
          smooth: true,
          color: '#48CAE4'
        },
        {
          name: '升学率',
          type: 'line',
          data: trendData.value.enrollmentRates,
          smooth: true,
          color: '#0096C7'
        }
      ]
    })
  }
}

// 根据当前选中年份加载数据（不重新获取年份列表）
const loadDataByYear = async () => {
  await Promise.all([
    fetchStatistics(),
    fetchCompanyTypes(),
    fetchMajorRates(),
    fetchTrend()
  ])
  nextTick(() => {
    initCharts()
  })
}

// 初始化：先获取年份列表，再加载数据
const initPage = async () => {
  await fetchYears() // 获取年份列表并设置默认选中
  if (selectedYear.value) {
    await loadDataByYear() // 根据选中的年份加载数据
  }
}

onMounted(() => {
  initPage()
  fetchUserPermissions()
})
</script>

<style scoped>
.statistics-page {
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

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.stat-icon {
  font-size: 48px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
}

.chart-card-full {
  width: 100%;
}

.chart-container {
  height: 300px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-container:hover {
  opacity: 0.9;
}

.chart-container-major {
  height: 500px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-container-major:hover {
  opacity: 0.9;
}

.chart-container-full {
  height: 350px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.chart-tip {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.detail-summary {
  margin-bottom: 16px;
  padding: 10px 16px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #48CAE4;
}

.detail-summary strong {
  color: #48CAE4;
  font-size: 16px;
}

.chart-card :deep(.el-card__header),
.chart-card-full :deep(.el-card__header) {
  display: flex;
  align-items: center;
  font-weight: 600;
}
</style>
