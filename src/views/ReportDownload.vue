<template>
  <div class="report-page">
    <div v-if="!isLoggedIn" class="login-overlay">
      <el-dialog
        v-model="showLoginDialog"
        :close-on-click-modal="true"
        :show-close="true"
        width="400px"
        center
        @close="goBack"
      >
        <div class="login-dialog-content">
          <div class="login-icon">🔒</div>
          <h2>请先登录</h2>
          <p>查看和下载报告需要登录系统</p>
          <div class="login-options">
            <el-button type="primary" size="large" @click="goToStudentLogin">
              🎓 学生登录
            </el-button>
            <el-button type="default" size="large" @click="goToAdminLogin">
              🔑 管理员登录
            </el-button>
          </div>
        </div>
        <template #footer>
          <div style="text-align: center;">
            <el-button type="text" @click="goBack">返回首页</el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <div v-else-if="isStudent" class="student-report">
      <div class="report-header">
        <h2>📄 我的个人发展报告</h2>
        <p>学号：{{ studentInfo.studentId }} | 姓名：{{ studentInfo.name }}</p>
      </div>
      <div class="report-content">
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item"><span>学号</span><span>{{ studentInfo.studentId }}</span></div>
            <div class="info-item"><span>姓名</span><span>{{ studentInfo.name }}</span></div>
            <div class="info-item"><span>班级</span><span>{{ studentInfo.className }}</span></div>
            <div class="info-item"><span>专业</span><span>{{ studentInfo.major }}</span></div>
            <div class="info-item"><span>学院</span><span>{{ studentInfo.college }}</span></div>
            <div class="info-item"><span>入学年份</span><span>{{ studentInfo.year - 4 }}年</span></div>
            <div class="info-item"><span>毕业年份</span><span>{{ studentInfo.year }}年</span></div>
            <div class="info-item"><span>邮箱</span><span>{{ studentInfo.email }}</span></div>
          </div>
        </div>

        <div class="info-section">
          <h3>成长轨迹</h3>
          <div v-if="growthTrajectories.length > 0" class="timeline">
            <div v-for="item in growthTrajectories" :key="item.id" class="timeline-item">
              <div class="timeline-year">{{ item.year }}年</div>
              <div class="timeline-content">
                <span v-if="item.honorName">🏆 {{ item.honorType }}{{ item.honorName }}</span>
                <span v-if="item.scholarshipType">💰 {{ item.scholarshipType }}</span>
                <span v-if="item.studentCadrePosition">📋 {{ item.studentCadrePosition }}</span>
                <span v-if="item.partyStatus">⭐ {{ item.partyStatus }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无成长轨迹数据</div>
        </div>

        <div class="info-section">
          <h3>学习画像</h3>
          <div v-if="learningProfiles.length > 0" class="learning-grid">
            <div v-for="item in learningProfiles" :key="item.id" class="learning-item">
              <div class="learning-year">{{ item.year }}年</div>
              <div class="learning-stats">
                <div>平均绩点：{{ item.averageGpa }}</div>
                <div>借阅次数：{{ item.libraryBorrowCount }}</div>
                <div>实验次数：{{ item.labParticipationCount }}</div>
                <div>竞赛获奖：{{ item.competitionAward }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无学习画像数据</div>
        </div>

        <div class="info-section">
          <h3>就业去向</h3>
          <div v-if="destinations.length > 0" class="dest-info">
            <div v-for="dest in destinations" :key="dest.id" class="dest-item">
              <div>就业状态：{{ dest.employmentStatus }}</div>
              <div>公司名称：{{ dest.companyName }}</div>
              <div>职位：{{ dest.jobTitle }}</div>
              <div>薪资：{{ dest.salary }}</div>
              <div>工作地点：{{ dest.workLocation }}</div>
            </div>
          </div>
          <div v-else class="no-data">暂无就业去向数据</div>
        </div>

        <div class="download-section">
          <el-dropdown @command="handleDownload">
            <el-button type="primary" size="large">
              📥 下载报告 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="png">🖼️ PNG 图片</el-dropdown-item>
                <el-dropdown-item command="pdf">📄 PDF 文档</el-dropdown-item>
                <el-dropdown-item command="jpg">🖼️ JPG 图片</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div v-else-if="isAdmin" class="admin-report">
      <div class="report-form">
        <el-card>
          <template #header>
            <span>📋 查询学生报告</span>
          </template>
          
          <el-form :model="reportForm" label-width="100px">
            <el-form-item label="学号">
              <el-input v-model="reportForm.studentId" placeholder="请输入学号" @keyup.enter="generateReport" />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="reportForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateReport" :loading="loading">查询报告</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card v-if="reportGenerated" class="report-preview">
          <template #header>
            <span>报告预览</span>
            <el-dropdown @command="handleAdminDownload">
              <el-button size="small" type="success">下载报告</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="png">PNG</el-dropdown-item>
                  <el-dropdown-item command="pdf">PDF</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <div ref="adminReportRef" class="preview-content">
            <div class="report-header">
              <h2>个人发展报告</h2>
              <div class="report-meta">
                <span>学号：{{ reportData.studentId }}</span>
                <span>姓名：{{ reportData.name }}</span>
                <span>生成时间：{{ new Date().toLocaleString() }}</span>
              </div>
            </div>
            <div class="report-body">
              <div class="report-section">
                <h3>基本信息</h3>
                <div class="info-grid">
                  <div class="info-item"><span>学号</span><span>{{ reportData.studentId }}</span></div>
                  <div class="info-item"><span>姓名</span><span>{{ reportData.name }}</span></div>
                  <div class="info-item"><span>班级</span><span>{{ reportData.className }}</span></div>
                  <div class="info-item"><span>专业</span><span>{{ reportData.major }}</span></div>
                  <div class="info-item"><span>入学时间</span><span>{{ reportData.enrollYear }}年</span></div>
                  <div class="info-item"><span>毕业时间</span><span>{{ reportData.graduationYear }}年</span></div>
                </div>
              </div>
              <div class="report-section">
                <h3>成长轨迹</h3>
                <div class="timeline">
                  <div v-for="(item, index) in reportData.growth" :key="index" class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="timeline-year">{{ item.year }}</div>
                      <div class="timeline-desc">{{ item.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="report-section">
                <h3>学习画像</h3>
                <div class="learning-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ reportData.gpa }}</span>
                    <span class="stat-label">平均绩点</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ reportData.rank }}</span>
                    <span class="stat-label">专业排名</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ reportData.awards }}</span>
                    <span class="stat-label">获奖次数</span>
                  </div>
                </div>
              </div>
              <div class="report-section">
                <h3>就业去向</h3>
                <div class="employment-info">
                  <div class="employment-item"><span>就业状态</span><span>{{ reportData.employmentStatus }}</span></div>
                  <div class="employment-item"><span>工作单位</span><span>{{ reportData.company }}</span></div>
                  <div class="employment-item"><span>岗位</span><span>{{ reportData.position }}</span></div>
                  <div class="employment-item"><span>薪资</span><span>{{ reportData.salary }}</span></div>
                </div>
              </div>
            </div>
            <div class="report-footer">
              <p>报告仅供参考，如有疑问请联系学院</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { checkStudentExists, getStudentByStudentId } from '../api/student'
import { getGrowthByStudentId } from '../api/growth'
import { getLearningByStudentId } from '../api/learning'
import { getDestinationByStudentId } from '../api/destination'
import { ElMessage, ElLoading } from 'element-plus'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const router = useRouter()
const auth = useAuth()

const isLoggedIn = computed(() => auth.state.isLoggedIn)
const isStudent = computed(() => auth.state.role?.toUpperCase() === 'STUDENT')
const isAdmin = computed(() => auth.state.role?.toUpperCase() === 'ADMIN')

const studentInfo = ref({})
const growthTrajectories = ref([])
const learningProfiles = ref([])
const destinations = ref([])

const reportForm = ref({
  studentId: '',
  name: ''
})
const reportGenerated = ref(false)
const loading = ref(false)
const reportData = ref({})
const showLoginDialog = ref(true)

const adminReportRef = ref(null)
const studentReportRef = ref(null)

const goToStudentLogin = () => {
  router.push('/student/login?redirect=/report')
}

const goToAdminLogin = () => {
  router.push('/admin/login?redirect=/report')
}

const goBack = () => {
  router.push('/')
}

const resetForm = () => {
  reportForm.value = { studentId: '', name: '' }
  reportGenerated.value = false
  reportData.value = {}
}

const fetchStudentReport = async (studentId) => {
  try {
    const studentRes = await getStudentByStudentId(studentId)
    if (studentRes.code === 200) {
      studentInfo.value = studentRes.data
    }
    
    const growthRes = await getGrowthByStudentId(studentId)
    if (growthRes.code === 200) {
      growthTrajectories.value = growthRes.data || []
    }
    
    const learnRes = await getLearningByStudentId(studentId)
    if (learnRes.code === 200) {
      learningProfiles.value = learnRes.data || []
    }
    
    const destRes = await getDestinationByStudentId(studentId)
    if (destRes.code === 200) {
      destinations.value = destRes.data || []
    }
  } catch (e) {
    console.error('获取报告数据失败:', e)
  }
}

onMounted(() => {
  if (isStudent.value) {
    const studentId = auth.state.user?.studentId || localStorage.getItem('student_id')
    if (studentId) {
      fetchStudentReport(studentId)
    }
  }
})

const generateReport = async () => {
  if (!reportForm.value.studentId) {
    ElMessage.warning('请输入学号')
    return
  }
  
  console.log('[ReportDownload] 开始查询学生, studentId=', reportForm.value.studentId)
  loading.value = true
  
  try {
    const res = await checkStudentExists(reportForm.value.studentId)
    console.log('[ReportDownload] 查询结果:', res)
    
    if (res.code === 200 && res.data) {
      console.log('[ReportDownload] 学生存在, 跳转报告页面:', `/admin/student-report/${reportForm.value.studentId}`)
      router.push(`/admin/student-report/${reportForm.value.studentId}`)
    } else {
      console.log('[ReportDownload] 学生不存在')
      ElMessage.error('学生不存在')
    }
  } catch (e) {
    console.error('[ReportDownload] 查询失败:', e)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleDownload = async (format) => {
  const card = document.querySelector('.student-report .report-content')
  if (!card) {
    ElMessage.error('报告内容未加载完成')
    return
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成报告...',
    background: 'rgba(0, 0, 0, 0.5)'
  })

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    })

    const fileName = `${studentInfo.value.studentId}_${studentInfo.value.name}_毕业报告`

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
    } else {
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
      const ext = format === 'jpg' ? 'jpg' : 'png'
      const link = document.createElement('a')
      link.download = `${fileName}.${ext}`
      link.href = canvas.toDataURL(mimeType)
      link.click()
    }

    ElMessage.success('报告下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('报告下载失败，请重试')
  } finally {
    loadingInstance.close()
  }
}

const handleAdminDownload = async (format) => {
  const card = adminReportRef.value
  if (!card) {
    ElMessage.error('报告内容未加载完成')
    return
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成报告...',
    background: 'rgba(0, 0, 0, 0.5)'
  })

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    })

    const fileName = `${reportData.value.studentId}_${reportData.value.name}_毕业报告`

    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
    } else {
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    ElMessage.success('报告下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('报告下载失败，请重试')
  } finally {
    loadingInstance.close()
  }
}
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  padding: 20px;
}

.login-overlay {
  min-height: 100vh;
  background: #F8FAF9;
}

.login-overlay :deep(.el-dialog__header) {
  background: #FFFFFF;
  padding: 0;
  margin-bottom: 0;
}

.login-overlay :deep(.el-dialog__headerbtn) {
  top: 12px;
  right: 12px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 24px;
}

.login-overlay :deep(.el-dialog__headerbtn:hover) {
  transform: rotate(180deg);
}

.login-overlay :deep(.el-dialog__close) {
  font-size: 24px;
}

.login-overlay :deep(.el-dialog__body) {
  padding: 0;
}

.login-dialog-content {
  text-align: center;
  padding: 16px 0;
}

.login-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.login-dialog-content h2 {
  margin: 0 0 6px 0;
  font-size: 20px;
  color: #2D5A7A;
  font-weight: 600;
}

.login-dialog-content p {
  color: #8BA4C4;
  font-size: 13px;
  margin: 0 0 24px 0;
}

.login-options {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.login-options .el-button {
  padding: 10px 28px;
  font-size: 14px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-options .el-button--primary {
  background-color: #B6DDDC;
  border-color: #B6DDDC;
  color: #2D5A7A;
  box-shadow: 0 2px 8px rgba(182, 221, 220, 0.4);
}

.login-options .el-button--primary:hover {
  background-color: #A6CCCC;
  border-color: #A6CCCC;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 16px rgba(182, 221, 220, 0.6);
}

.login-options .el-button--default {
  border-color: #E8EEED;
  color: #2D5A7A;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.login-options .el-button--default:hover {
  border-color: #B6DDDC;
  background-color: #EDF5F3;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 16px rgba(182, 221, 220, 0.3);
}

.student-report {
  max-width: 800px;
  margin: 0 auto;
}

.student-report .report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #667eea;
}

.student-report .report-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.student-report .report-header p {
  color: #666;
  font-size: 14px;
}

.info-section {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.info-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 10px;
}

.info-item span:first-child {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.info-item span:last-child {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ddd;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 5px;
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
}

.timeline-year {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.timeline-content span {
  font-size: 14px;
  color: #666;
}

.learning-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.learning-item {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
}

.learning-year {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10px;
}

.learning-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.learning-stats div {
  font-size: 14px;
  color: #666;
}

.dest-info {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 10px;
}

.dest-item {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.dest-item div {
  font-size: 14px;
  color: #666;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 10px;
}

.download-section {
  text-align: center;
  margin-top: 30px;
}

.download-section .el-button {
  padding: 14px 40px;
  font-size: 16px;
  border-radius: 12px;
}

.admin-report {
  max-width: 900px;
  margin: 0 auto;
}

.report-form {
  width: 100%;
}

.report-preview {
  margin-top: 20px;
}

.preview-content {
  padding: 30px;
  font-family: 'SimSun', 'Microsoft YaHei', sans-serif;
}

.preview-content .report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #667eea;
}

.preview-content .report-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 15px;
}

.report-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
  color: #666;
}

.report-body {
  margin-top: 30px;
}

.report-section {
  margin-bottom: 30px;
}

.report-section h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #667eea;
}

.preview-content .info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.preview-content .timeline {
  padding-left: 30px;
}

.preview-content .timeline-item {
  margin-bottom: 15px;
}

.preview-content .timeline-dot {
  position: absolute;
  left: -24px;
  top: 5px;
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
}

.preview-content .timeline-content {
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.preview-content .timeline-year {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.preview-content .timeline-desc {
  font-size: 14px;
  color: #666;
}

.learning-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-item .stat-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-item .stat-label {
  font-size: 14px;
  color: #666;
}

.employment-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.employment-item {
  display: flex;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.employment-item span:first-child {
  width: 100px;
  color: #999;
  font-weight: 500;
}

.employment-item span:last-child {
  flex: 1;
  color: #333;
}

.report-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
  margin-top: 30px;
}

.report-footer p {
  font-size: 12px;
  color: #999;
}
</style>