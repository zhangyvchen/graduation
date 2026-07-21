<template>
  <div class="student-report-page">
    <header class="report-header">
      <el-button v-if="isAdmin" @click="goBack" class="back-btn">
        <span>←</span>
        <span>返回</span>
      </el-button>
      <div class="header-info">
        <h2>{{ studentInfo.name }} 的毕业报告</h2>
        <p class="subtitle">学号：{{ studentInfo.studentId }} | {{ studentInfo.className }}</p>
      </div>
      <div class="header-actions">
        <el-button
          v-if="hasFutureAdviceSection"
          type="success"
          plain
          :loading="adviceLoading"
          :disabled="adviceEditing"
          @click="generateFutureAdvice"
        >
          AI 一键生成未来建议
        </el-button>
        <el-button
          v-if="hasFutureAdviceSection && !adviceEditing"
          plain
          @click="startEditAdvice"
        >
          编辑建议
        </el-button>
        <el-button
          v-if="adviceEditing"
          type="primary"
          plain
          :loading="adviceSaving"
          @click="saveEditedAdvice"
        >
          保存建议
        </el-button>
        <el-button
          v-if="adviceEditing"
          plain
          @click="cancelEditAdvice"
        >
          取消
        </el-button>
        <el-button
          v-if="hasFutureAdviceSection"
          plain
          @click="copyAdviceText"
        >
          复制建议全文
        </el-button>
        <el-button
          v-if="aiAdvice && !adviceEditing"
          plain
          @click="resetFutureAdvice"
        >
          恢复默认
        </el-button>
        <el-dropdown @command="handleDownload">
          <el-button type="primary">
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
    </header>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在生成报告...</p>
    </div>

    <div v-else class="report-content">
      <div ref="reportCardRef" class="report-card" :class="selectedTemplate?.type || 'full'">
        <div class="card-header" :class="selectedTemplate?.type || 'full'">
          <div class="school-info">
            <h1>毕业数据报告</h1>
            <p class="school-name">{{ schoolName }}</p>
          </div>
          <div class="student-badge">
            <span class="badge-icon">🎓</span>
            <span>{{ studentInfo.name }}</span>
          </div>
          <div v-if="selectedTemplate?.deanMessage" class="dean-message">
            <span class="quote-start">「</span>
            <p>{{ selectedTemplate.deanMessage }}</p>
            <span class="quote-end">」</span>
          </div>
        </div>

        <div v-if="selectedTemplate?.content" class="custom-content">
          <div class="custom-content-header">📋 报告摘要</div>
          <div class="custom-content-body">{{ renderCustomContent(selectedTemplate.content) }}</div>
        </div>

        <div class="report-body">
          <div v-for="(section, index) in reportSections" :key="index" class="report-section" :class="getSectionClass(section.title)">
            <div class="section-header">
              <span class="section-icon">{{ section.icon }}</span>
              <h3>{{ section.title }}</h3>
            </div>
            <div class="section-body">
              <template v-if="section.title === '未来建议' && adviceEditing">
                <div v-for="field in adviceEditFields" :key="field.key" class="info-item advice-edit-item">
                  <span class="info-label">{{ field.label }}</span>
                  <el-input
                    v-model="adviceDraft[field.key]"
                    type="textarea"
                    :rows="3"
                    maxlength="800"
                    show-word-limit
                  />
                </div>
              </template>
              <template v-else>
                <div v-for="(item, itemIndex) in section.items" :key="itemIndex" class="info-item">
                  <span class="info-label">{{ item.label }}</span>
                  <span class="info-value">{{ item.value || '-' }}</span>
                </div>
              </template>
              <div v-if="section.subItems && section.subItems.length > 0" class="sub-items">
                <div v-for="(subItem, subIndex) in section.subItems" :key="subIndex" class="sub-item">
                  <div class="sub-item-header">{{ subItem.title }}</div>
                  <div v-for="(subItemInfo, infoIndex) in subItem.items" :key="infoIndex" class="info-item">
                    <span class="info-label">{{ subItemInfo.label }}</span>
                    <span class="info-value">{{ subItemInfo.value || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedTemplate?.alumniMessage" class="alumni-message">
          <div class="message-icon">💬</div>
          <div class="message-content">
            <div class="message-title">校友寄语</div>
            <p>{{ selectedTemplate.alumniMessage }}</p>
          </div>
        </div>

        <div v-if="selectedTemplate?.futureMessage" class="future-message">
          <div class="message-icon">🌟</div>
          <div class="message-content">
            <div class="message-title">未来寄语</div>
            <p>{{ selectedTemplate.futureMessage }}</p>
          </div>
        </div>

        <div class="report-footer">
          <div class="footer-line"></div>
          <div class="footer-info">
            <p>报告生成时间：{{ new Date().toLocaleString('zh-CN') }}</p>
            <p>数据来源：毕业生管理系统</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { getStudentReportData } from '../api/student'
import { generateStudentFutureAdvice, getStudentFutureAdvice, deleteStudentFutureAdvice, updateStudentFutureAdvice } from '../api/admin'
import { useAuth } from '../stores/auth'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const isAdmin = computed(() => auth.state.role?.toUpperCase() === 'ADMIN')

const loading = ref(true)
const schoolName = ref('')
const studentInfo = ref({})
const destinationData = ref([])
const growthTrajectories = ref([])
const learningProfiles = ref([])
const templates = ref([])
const templateId = ref(null)
const selectedTemplate = ref(null)
const reportCardRef = ref(null)
const aiAdvice = ref(null)
const adviceLoading = ref(false)
const adviceEditing = ref(false)
const adviceSaving = ref(false)
const adviceDraft = ref({
  career: '',
  furtherStudy: '',
  employment: '',
  personal: ''
})

const adviceEditFields = [
  { key: 'career', label: '职业发展建议' },
  { key: 'furtherStudy', label: '继续深造建议' },
  { key: 'employment', label: '就业指导建议' },
  { key: 'personal', label: '个人发展建议' }
]

const dest = computed(() => destinationData.value.length > 0 ? destinationData.value[0] : null)

const hasFutureAdviceSection = computed(() =>
  !!selectedTemplate.value?.sections?.includes('未来建议')
)

const defaultFutureAdviceItems = () => ([
  { label: '职业发展建议', value: '根据您的专业背景，建议关注相关行业动态，持续提升专业技能。' },
  { label: '继续深造建议', value: '如有深造意向，建议尽早准备相关考试和材料。' },
  { label: '就业指导建议', value: '建议充分利用学校就业指导中心资源，完善求职材料。' },
  { label: '个人发展建议', value: '保持学习热情，积极拓展人脉，勇于尝试新的机会。' }
])

const futureAdviceItems = computed(() => {
  if (aiAdvice.value?.items?.length) return aiAdvice.value.items
  return defaultFutureAdviceItems()
})

const reportSections = computed(() => {
  if (!selectedTemplate.value) return []
  
  const sections = []
  const templateSections = selectedTemplate.value.sections || []
  
  for (const sectionName of templateSections) {
    switch (sectionName) {
      case '基本信息':
        sections.push({
          title: '基本信息',
          icon: '👤',
          items: [
            { label: '学号', value: studentInfo.value.studentId },
            { label: '姓名', value: studentInfo.value.name },
            { label: '性别', value: studentInfo.value.gender },
            { label: '班级', value: studentInfo.value.className },
            { label: '专业', value: studentInfo.value.major },
            { label: '学院', value: studentInfo.value.department },
            { label: '毕业年份', value: studentInfo.value.year ? studentInfo.value.year + '届' : '' },
            { label: '就业状态', value: getEmploymentLabel(studentInfo.value.employmentStatus) }
          ]
        })
        break
      case '成长轨迹':
        sections.push({
          title: '成长轨迹',
          icon: '📈',
          items: [
            { label: '政治面貌', value: growthTrajectories.value.length > 0 ? growthTrajectories.value[0].partyStatus : '暂无数据' },
            { label: '平均绩点等级', value: learningProfiles.value.length > 0 ? getGpaLevel(learningProfiles.value[0].averageGpa) : '暂无数据' },
            { label: '图书馆活跃度', value: learningProfiles.value.length > 0 ? getLibraryLevel(learningProfiles.value[0].libraryBorrowCount) : '暂无数据' },
            { label: '实验室参与度', value: learningProfiles.value.length > 0 ? getLabLevel(learningProfiles.value[0].labParticipationCount) : '暂无数据' }
          ],
          subItems: growthTrajectories.value.length > 0 ? growthTrajectories.value.map(growth => ({
            title: growth.year + '年荣誉记录',
            items: [
              { label: '荣誉类型', value: growth.honorType },
              { label: '荣誉名称', value: growth.honorName },
              { label: '奖学金', value: growth.scholarshipType },
              { label: '学生干部', value: growth.studentCadrePosition }
            ]
          })) : []
        })
        break
      case '学习画像':
        sections.push({
          title: '学习画像',
          icon: '📚',
          items: learningProfiles.value.length > 0 ? [
            { label: '平均绩点', value: learningProfiles.value[0].averageGpa },
            { label: '图书馆借阅次数', value: learningProfiles.value[0].libraryBorrowCount },
            { label: '实验室参与次数', value: learningProfiles.value[0].labParticipationCount },
            { label: '竞赛获奖情况', value: learningProfiles.value[0].competitionAward }
          ] : [
            { label: '平均绩点', value: '暂无数据' },
            { label: '图书馆借阅次数', value: '暂无数据' },
            { label: '实验室参与次数', value: '暂无数据' },
            { label: '竞赛获奖情况', value: '暂无数据' }
          ],
          subItems: learningProfiles.value.length > 1 ? learningProfiles.value.slice(1).map(learning => ({
            title: learning.year + '年学习数据',
            items: [
              { label: '平均绩点', value: learning.averageGpa },
              { label: '图书馆借阅次数', value: learning.libraryBorrowCount },
              { label: '实验室参与次数', value: learning.labParticipationCount },
              { label: '竞赛获奖情况', value: learning.competitionAward }
            ]
          })) : []
        })
        break
      case '就业去向':
        sections.push({
          title: '就业去向',
          icon: '💼',
          items: [
            { label: '就业类型', value: getDestinationType(dest.value?.destinationType) || getEmploymentLabel(studentInfo.value.employmentStatus) },
            { label: '省份', value: dest.value?.province || '暂无数据' },
            { label: '城市', value: dest.value?.city || '暂无数据' },
            { label: '行业', value: dest.value?.industry || '暂无数据' },
            { label: '公司名称', value: dest.value?.companyName || studentInfo.value.companyName || '暂无数据' },
            { label: '公司类型', value: dest.value?.companyType || '暂无数据' },
            { label: '职位', value: dest.value?.jobTitle || studentInfo.value.position || '暂无数据' },
            { label: '薪资', value: dest.value?.salary || studentInfo.value.salary ? '¥' + (dest.value?.salary || studentInfo.value.salary) : '暂无数据' },
            { label: '工作地点', value: studentInfo.value.workLocation || '暂无数据' },
            { label: '升学学校', value: dest.value?.schoolName || '暂无数据' },
            { label: '升学专业', value: dest.value?.majorName || '暂无数据' }
          ]
        })
        break
      case '综合素质':
        sections.push({
          title: '综合素质',
          icon: '🏆',
          items: [
            { label: '荣誉获得', value: growthTrajectories.value.filter(g => g.honorName).map(g => `${g.year}年: ${g.honorType}${g.honorName}`).join('\n') || '暂无' },
            { label: '奖学金获得', value: growthTrajectories.value.filter(g => g.scholarshipType).map(g => `${g.year}年: ${g.scholarshipType}`).join('\n') || '暂无' },
            { label: '学生干部经历', value: growthTrajectories.value.filter(g => g.studentCadrePosition).map(g => `${g.year}年: ${g.studentCadrePosition}`).join('\n') || '暂无' },
            { label: '政治面貌', value: growthTrajectories.value.length > 0 ? growthTrajectories.value[0].partyStatus : '暂无数据' },
            { label: '竞赛获奖', value: learningProfiles.value.filter(l => l.competitionAward).map(l => `${l.year}年: ${l.competitionAward}`).join('\n') || '暂无' },
            { label: '平均绩点等级', value: learningProfiles.value.length > 0 ? getGpaLevel(learningProfiles.value[0].averageGpa) : '暂无数据' }
          ]
        })
        break
      case '未来建议':
        sections.push({
          title: '未来建议',
          icon: '💡',
          items: futureAdviceItems.value
        })
        break
    }
  }
  return sections
})

const getEmploymentLabel = (status) => {
  const labels = {
    employed: '已就业',
    enrolled: '升学',
    unemployed: '待就业',
    entrepreneur: '自主创业',
    '已就业': '已就业',
    '升学': '升学',
    '待就业': '待就业',
    '自主创业': '自主创业'
  }
  return labels[status] || status || '待就业'
}

const getDestinationType = (type) => {
  const labels = {
    employed: '已就业',
    enrolled: '升学',
    unemployed: '待就业',
    entrepreneur: '自主创业',
    '已就业': '已就业',
    '升学': '升学',
    '待就业': '待就业',
    '自主创业': '自主创业',
    '就业': '就业',
    '考研': '考研',
    '出国': '出国'
  }
  return labels[type] || type || '待就业'
}

const getGpaLevel = (gpa) => {
  if (!gpa) return '暂无数据'
  if (gpa >= 3.5) return '优秀'
  if (gpa >= 3.0) return '良好'
  if (gpa >= 2.5) return '中等'
  return '需努力'
}

const getLibraryLevel = (count) => {
  if (!count) return '暂无数据'
  if (count >= 50) return '非常活跃'
  if (count >= 20) return '活跃'
  if (count >= 5) return '一般'
  return '较少'
}

const getLabLevel = (count) => {
  if (!count) return '暂无数据'
  if (count >= 20) return '积极参与'
  if (count >= 10) return '参与较多'
  if (count >= 3) return '有参与'
  return '较少'
}

const getSectionClass = (title) => {
  const classes = {
    '基本信息': 'info',
    '成长轨迹': 'success',
    '学习画像': 'warning',
    '就业去向': 'primary',
    '综合素质': 'danger',
    '未来建议': 'purple'
  }
  return classes[title] || 'info'
}

const renderCustomContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\{\{studentId\}\}/g, studentInfo.value.studentId || '')
    .replace(/\{\{name\}\}/g, studentInfo.value.name || '')
    .replace(/\{\{className\}\}/g, studentInfo.value.className || '')
    .replace(/\{\{major\}\}/g, studentInfo.value.major || '')
    .replace(/\{\{department\}\}/g, studentInfo.value.department || '')
    .replace(/\{\{year\}\}/g, studentInfo.value.year || '')
    .replace(/\{\{employmentStatus\}\}/g, getEmploymentLabel(studentInfo.value.employmentStatus) || '')
    .replace(/\{\{companyName\}\}/g, studentInfo.value.companyName || '')
    .replace(/\{\{position\}\}/g, studentInfo.value.position || '')
    .replace(/\{\{salary\}\}/g, studentInfo.value.salary ? '¥' + studentInfo.value.salary : '')
}

const goBack = () => {
  router.push('/admin/student')
}

const buildAdviceProfile = () => ({
  student: { ...studentInfo.value },
  destinationData: destinationData.value || [],
  learningProfiles: learningProfiles.value || [],
  growthTrajectories: growthTrajectories.value || []
})

const generateFutureAdvice = async () => {
  const studentId = studentInfo.value.studentId || route.params.studentId
  if (!studentId) {
    ElMessage.warning('无法获取学号')
    return
  }
  adviceLoading.value = true
  try {
    const res = await generateStudentFutureAdvice({
      studentId,
      userRole: isAdmin.value ? 'admin' : 'student',
      userId: isAdmin.value
        ? (auth.state.user?.username || 'admin')
        : studentId,
      profile: buildAdviceProfile()
    })
    if (res.code === 200 && res.data) {
      aiAdvice.value = res.data
      ElMessage.success('已生成并保存到数据库')
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } catch (e) {
    ElMessage.error(e?.message || '生成失败')
  } finally {
    adviceLoading.value = false
  }
}

const resetFutureAdvice = async () => {
  const studentId = studentInfo.value.studentId || route.params.studentId
  if (!studentId) {
    aiAdvice.value = null
    return
  }
  try {
    await deleteStudentFutureAdvice({
      studentId,
      userRole: isAdmin.value ? 'admin' : 'student',
      userId: isAdmin.value
        ? (auth.state.user?.username || 'admin')
        : studentId
    })
    aiAdvice.value = null
    adviceEditing.value = false
    ElMessage.success('已清除保存的建议，恢复默认文案')
  } catch (e) {
    ElMessage.error(e?.message || '清除失败')
  }
}

const fillAdviceDraftFromCurrent = () => {
  const items = futureAdviceItems.value || []
  const byLabel = Object.fromEntries(items.map(i => [i.label, i.value || '']))
  adviceDraft.value = {
    career: aiAdvice.value?.career || byLabel['职业发展建议'] || '',
    furtherStudy: aiAdvice.value?.furtherStudy || byLabel['继续深造建议'] || '',
    employment: aiAdvice.value?.employment || byLabel['就业指导建议'] || '',
    personal: aiAdvice.value?.personal || byLabel['个人发展建议'] || ''
  }
}

const startEditAdvice = () => {
  fillAdviceDraftFromCurrent()
  adviceEditing.value = true
}

const cancelEditAdvice = () => {
  adviceEditing.value = false
}

const saveEditedAdvice = async () => {
  const studentId = studentInfo.value.studentId || route.params.studentId
  if (!studentId) {
    ElMessage.warning('无法获取学号')
    return
  }
  adviceSaving.value = true
  try {
    const res = await updateStudentFutureAdvice({
      studentId,
      userRole: isAdmin.value ? 'admin' : 'student',
      userId: isAdmin.value
        ? (auth.state.user?.username || 'admin')
        : studentId,
      career: adviceDraft.value.career,
      furtherStudy: adviceDraft.value.furtherStudy,
      employment: adviceDraft.value.employment,
      personal: adviceDraft.value.personal
    })
    if (res.code === 200 && res.data) {
      aiAdvice.value = res.data
      adviceEditing.value = false
      ElMessage.success('建议已保存')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    adviceSaving.value = false
  }
}

const copyAdviceText = async () => {
  const items = adviceEditing.value
    ? adviceEditFields.map(f => ({ label: f.label, value: adviceDraft.value[f.key] }))
    : futureAdviceItems.value
  const text = (items || [])
    .map(i => `${i.label}：${i.value || ''}`)
    .join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制建议全文')
  } catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

const loadSavedFutureAdvice = async (studentId) => {
  if (!studentId) return
  try {
    const res = await getStudentFutureAdvice({
      studentId,
      userRole: isAdmin.value ? 'admin' : 'student',
      userId: isAdmin.value
        ? (auth.state.user?.username || 'admin')
        : studentId
    })
    if (res.code === 200 && res.data) {
      aiAdvice.value = res.data
    } else {
      aiAdvice.value = null
    }
  } catch {
    aiAdvice.value = null
  }
}

const fetchReportData = async () => {
  try {
    let studentId = route.params.studentId
    
    if (!studentId && !isAdmin.value) {
      studentId = auth.state.user?.studentId || localStorage.getItem('student_id')
      
      if (!studentId) {
        const studentInfoStr = localStorage.getItem('student_info')
        if (studentInfoStr) {
          const studentInfoData = JSON.parse(studentInfoStr)
          studentId = studentInfoData.studentId
        }
      }
    }
    
    console.log('[StudentReport] 开始加载报告数据, studentId:', studentId)
    console.log('[StudentReport] 当前角色:', auth.state.role)
    console.log('[StudentReport] 是否已登录:', auth.state.isLoggedIn)
    
    if (!studentId) {
      ElMessage.error('无法获取学号，请重新登录')
      return
    }
    
    const res = await getStudentReportData(studentId)
    console.log('[StudentReport] API响应:', res)
    
    if (res.code === 200) {
      studentInfo.value = res.data.student || {}
      destinationData.value = res.data.destinationData || []
      growthTrajectories.value = res.data.growthTrajectories || []
      learningProfiles.value = res.data.learningProfiles || []
      schoolName.value = res.data.schoolName || 'XX大学'
      aiAdvice.value = null
      await loadSavedFutureAdvice(studentInfo.value.studentId || studentId)
      
      templates.value = (res.data.templates || []).map(template => {
        let sections = []
        try {
          sections = template.sections ? JSON.parse(template.sections) : []
        } catch (e) {
          console.error('Failed to parse sections:', template.sections, e)
          sections = ['基本信息', '成长轨迹', '学习画像', '就业去向', '综合素质', '未来建议']
        }
        return {
          ...template,
          sections,
          status: template.status === 'ENABLED' || template.status === 'active' ? 'active' : 'inactive'
        }
      }).filter(t => t.status === 'active')
      
      if (templates.value.length > 0) {
        const defaultTemplate = templates.value.find(t => t.isDefault) || templates.value[0]
        templateId.value = defaultTemplate.id
        selectedTemplate.value = defaultTemplate
      }
    } else {
      ElMessage.error('获取报告数据失败')
    }
  } catch (error) {
    ElMessage.error('获取报告数据失败')
    console.error(error)
  }
}

const handleDownload = async (format) => {
  const card = reportCardRef.value
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

onMounted(async () => {
  loading.value = true
  await fetchReportData()
  loading.value = false
})
</script>

<style scoped>
.student-report-page {
  padding: 24px;
  background: #F8FAF9;
  min-height: calc(100vh - 60px);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(45, 90, 122, 0.06);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #2D5A7A;
}

.header-info h2 {
  margin: 0;
  font-size: 20px;
  color: #2D5A7A;
}

.subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #8892A0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E8F4F8;
  border-top-color: #2D5A7A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.report-content {
  max-width: 800px;
  margin: 0 auto;
}

.report-card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(45, 90, 122, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #2D5A7A 0%, #4A7C9B 100%);
  color: #FFFFFF;
  padding: 40px 60px;
  text-align: center;
}

.card-header h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: bold;
}

.school-name {
  margin: 0 0 30px 0;
  font-size: 18px;
  opacity: 0.9;
}

.student-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.badge-icon {
  font-size: 28px;
}

.dean-message {
  background: rgba(255, 255, 255, 0.15);
  padding: 20px 30px;
  border-radius: 12px;
  font-style: italic;
  font-size: 16px;
  line-height: 1.8;
}

.quote-start, .quote-end {
  font-size: 32px;
  opacity: 0.6;
}

.custom-content {
  padding: 30px;
  background: #F8FAF9;
  border-bottom: 1px solid #E8EEF2;
}

.custom-content-header {
  font-size: 16px;
  font-weight: bold;
  color: #2D5A7A;
  margin-bottom: 15px;
}

.custom-content-body {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

.report-body {
  padding: 30px;
}

.report-section {
  margin-bottom: 30px;
}

.report-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #E8EEF2;
}

.section-icon {
  font-size: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2D5A7A;
}

.section-body {
  background: #FAFBFC;
  border-radius: 12px;
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #E0E6EC;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  color: #2D5A7A;
  font-weight: 600;
}

.advice-edit-item {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.advice-edit-item .info-label {
  margin-bottom: 0;
}

.sub-items {
  margin-top: 15px;
  border-top: 1px solid #E0E6EC;
  padding-top: 15px;
}

.sub-item {
  margin-bottom: 15px;
}

.sub-item:last-child {
  margin-bottom: 0;
}

.sub-item-header {
  font-weight: bold;
  color: #2D5A7A;
  margin-bottom: 10px;
  font-size: 14px;
}

.alumni-message, .future-message {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 30px;
  background: #F8FAF9;
  border-top: 1px solid #E8EEF2;
}

.message-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-title {
  font-weight: bold;
  color: #2D5A7A;
  margin-bottom: 10px;
  font-size: 16px;
}

.message-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

.report-footer {
  padding: 30px;
  text-align: center;
  background: #F8FAF9;
  border-top: 1px solid #E8EEF2;
}

.footer-line {
  width: 60px;
  height: 3px;
  background: #2D5A7A;
  margin: 0 auto 20px auto;
  border-radius: 2px;
}

.footer-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #999;
}

.info { border-left: 4px solid #2D5A7A; }
.success { border-left: 4px solid #52c41a; }
.warning { border-left: 4px solid #faad14; }
.primary { border-left: 4px solid #1890ff; }
.danger { border-left: 4px solid #f5222d; }
.purple { border-left: 4px solid #722ed1; }
</style>
