<template>
  <div class="report-page">
    <div class="report-form">
      <el-card>
        <template #header>
          <span>生成个人发展报告</span>
        </template>
        
        <el-form :model="reportForm" label-width="100px">
          <el-form-item label="学号">
            <el-input v-model="reportForm.studentId" placeholder="请输入学号" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="reportForm.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="报告类型">
            <el-select v-model="reportForm.type" placeholder="请选择报告类型">
              <el-option label="完整版" value="full" />
              <el-option label="精简版" value="simple" />
              <el-option label="就业分析版" value="employment" />
            </el-select>
          </el-form-item>
          <el-form-item>
           <el-button type="primary" @click="generateReport" :loading="loading">生成报告</el-button>
           <el-button @click="downloadReport" :disabled="!reportGenerated" :loading="downloading">下载报告</el-button>
          <el-button @click="printReport" :disabled="!reportGenerated" type="warning">打印报告</el-button>
         </el-form-item>
        </el-form>
      </el-card>
      
      <el-card v-if="reportGenerated" class="report-preview">
        <template #header>
          <span>报告预览</span>
          <el-button size="small" type="success" @click="downloadReport">立即下载</el-button>
        </template>
        <div class="preview-content">
          <div class="report-header">
            <h2>个人发展报告</h2>
            <div class="report-meta">
              <span>学号：{{ reportForm.studentId }}</span>
              <span>姓名：{{ reportForm.name }}</span>
              <span>类型：{{ reportTypeLabel }}</span>
              <span>生成时间：{{ new Date().toLocaleString() }}</span>
            </div>
          </div>
          <div class="report-body">
            <div class="report-section">
              <h3>一、基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">学号</span>
                  <span class="value">{{ reportData.studentId }}</span>
                </div>
                <div class="info-item">
                  <span class="label">姓名</span>
                  <span class="value">{{ reportData.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">班级</span>
                  <span class="value">{{ reportData.className }}</span>
                </div>
                <div class="info-item">
                  <span class="label">专业</span>
                  <span class="value">{{ reportData.major }}</span>
                </div>
                <div class="info-item">
                  <span class="label">入学时间</span>
                  <span class="value">{{ reportData.enrollYear }}年</span>
                </div>
                <div class="info-item">
                  <span class="label">毕业时间</span>
                  <span class="value">{{ reportData.graduationYear }}年</span>
                </div>
              </div>
            </div>
            <div class="report-section">
              <h3>二、成长轨迹</h3>
              <div class="timeline">
                <div class="timeline-item" v-for="(item, index) in reportData.growth" :key="index">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-year">{{ item.year }}</div>
                    <div class="timeline-desc">{{ item.description }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="report-section">
              <h3>三、学习画像</h3>
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
              <h3>四、就业去向</h3>
              <div class="employment-info">
                <div class="employment-item">
                  <span class="label">就业状态</span>
                  <span class="value">{{ reportData.employmentStatus }}</span>
                </div>
                <div class="employment-item">
                  <span class="label">工作单位</span>
                  <span class="value">{{ reportData.company }}</span>
                </div>
                <div class="employment-item">
                  <span class="label">岗位</span>
                  <span class="value">{{ reportData.position }}</span>
                </div>
                <div class="employment-item">
                  <span class="label">薪资</span>
                  <span class="value">{{ reportData.salary }}</span>
                </div>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { getStudentByStudentId } from '../api/student'
import { getGrowthByStudentId } from '../api/growth'
import { getLearningByStudentId } from '../api/learning'
import { getDestinationByStudentId } from '../api/destination'

const reportForm = ref({
  studentId: '',
  name: '',
  type: 'full'
})
const reportGenerated = ref(false)
const loading = ref(false)
const downloading = ref(false)

const reportTypeLabel = computed(() => {
  const types = { full: '完整版', simple: '精简版', employment: '就业分析版' }
  return types[reportForm.value.type] || '完整版'
})

const reportData = ref({
  studentId: '',
  name: '',
  className: '',
  major: '',
  enrollYear: '',
  graduationYear: '',
  gpa: '',
  rank: '',
  awards: '',
  employmentStatus: '',
  company: '',
  position: '',
  salary: '',
  growth: []
})

const generateReport = async () => {
  if (!reportForm.value.studentId || !reportForm.value.name) {
    alert('请填写学号和姓名')
    return
  }
  
  loading.value = true
  try {
    const studentRes = await getStudentByStudentId(reportForm.value.studentId)
    const student = studentRes.code === 200 ? studentRes.data : null
    const growthRes = await getGrowthByStudentId(reportForm.value.studentId)
    const growthList = growthRes.code === 200 ? growthRes.data : []
    const learnRes = await getLearningByStudentId(reportForm.value.studentId)
    const learnData = learnRes.code === 200 ? learnRes.data : []
    const destRes = await getDestinationByStudentId(reportForm.value.studentId)
    const destData = destRes.code === 200 ? destRes.data : []

    reportData.value = {
      studentId: reportForm.value.studentId,
      name: student?.name || reportForm.value.name,
      className: student?.className || '未知班级',
      major: student?.major || '未知专业',
      enrollYear: student?.graduationYear ? student.graduationYear - 4 : 2020,
      graduationYear: student?.graduationYear || 2024,
      gpa: learnData[0]?.averageGpa ? learnData[0].averageGpa.toFixed(2) : '暂无',
      rank: learnData.length > 0 ? '有学习记录' : '暂无',
      awards: learnData.filter(d => d.competitionAward).length + '项',
      employmentStatus: destData.length > 0 ? '已就业/升学' : '待确认',
      company: destData[0]?.companyName || '暂无',
      position: destData[0]?.jobTitle || '暂无',
      salary: '待确认',
      growth: growthList.map(g => ({
        year: g.year + '年',
        description: [g.honorName, g.scholarshipType, g.studentCadrePosition, g.partyStatus].filter(Boolean).join('，') || '有成长记录'
      }))
    }
  } catch (e) {
    reportData.value = { ...reportData.value, name: reportForm.value.name }
  }
  reportGenerated.value = true
  loading.value = false
}

const downloadReport = async () => {
  downloading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const content = `个人发展报告
学号：${reportData.value.studentId}
姓名：${reportData.value.name}
班级：${reportData.value.className}
专业：${reportData.value.major}
入学时间：${reportData.value.enrollYear}年
毕业时间：${reportData.value.graduationYear}年

一、成长轨迹
${reportData.value.growth.map(g => `${g.year}：${g.description}`).join('\n')}

二、学习画像
平均绩点：${reportData.value.gpa}
专业排名：${reportData.value.rank}
获奖次数：${reportData.value.awards}

三、就业去向
就业状态：${reportData.value.employmentStatus}
工作单位：${reportData.value.company}
岗位：${reportData.value.position}
薪资：${reportData.value.salary}

报告生成时间：${new Date().toLocaleString()}
`
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${reportData.value.name}_个人发展报告.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  downloading.value = false
}

const printReport = () => {
  window.print()
}
</script>

<style scoped>
.report-page {
  display: flex;
  justify-content: center;
}

.report-form {
  width: 800px;
}

.report-preview {
  margin-top: 20px;
}

.preview-content {
  padding: 30px;
  font-family: 'SimSun', 'Microsoft YaHei', sans-serif;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #667eea;
}

.report-header h2 {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.info-item .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.info-item .value {
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

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 5px;
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
}

.timeline-content {
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.timeline-year {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.timeline-desc {
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

.employment-item .label {
  width: 100px;
  color: #999;
  font-weight: 500;
}

.employment-item .value {
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
