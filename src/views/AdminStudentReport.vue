<template>
  <div class="student-report-page">
    <header class="report-header">
      <el-button v-if="isAdmin" @click="goBack" class="back-btn">
        <span>←</span>
        <span>返回名单管理</span>
      </el-button>
      <div class="header-info">
        <h2>{{ studentInfo.name || '我' }} 的毕业报告</h2>
        <p class="subtitle">学号：{{ studentInfo.studentId }} | {{ studentInfo.className }}</p>
      </div>
      <div class="header-actions">
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

      <div class="template-selector">
        <h4>📋 选择报告模板</h4>
        <el-select v-model="templateId" placeholder="选择模板" style="width: 200px" @change="renderReport">
          <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
        </el-select>
        <div v-if="selectedTemplate" class="template-preview">
          <div class="template-info">
            <div class="template-name">{{ selectedTemplate.name }}</div>
            <div class="template-desc">{{ selectedTemplate.description }}</div>
          </div>
          <div class="template-sections">
            <span class="sections-title">包含章节:</span>
            <div class="sections-list">
              <span v-for="(section, idx) in selectedTemplate.sections" :key="idx" class="section-tag">
                {{ getSectionIcon(section) }} {{ section }}
              </span>
            </div>
          </div>
          <div
            v-if="selectedTemplate.sections?.includes('未来建议')"
            class="ai-advice-actions"
          >
            <el-button
              type="primary"
              size="small"
              :loading="adviceLoading"
              :disabled="adviceEditing"
              @click="generateFutureAdvice"
            >
              AI 一键生成未来建议
            </el-button>
            <el-button
              v-if="!adviceEditing"
              size="small"
              @click="startEditAdvice"
            >
              编辑建议
            </el-button>
            <el-button
              v-if="adviceEditing"
              type="primary"
              size="small"
              :loading="adviceSaving"
              @click="saveEditedAdvice"
            >
              保存建议
            </el-button>
            <el-button
              v-if="adviceEditing"
              size="small"
              @click="cancelEditAdvice"
            >
              取消
            </el-button>
            <el-button size="small" @click="copyAdviceText">
              复制建议全文
            </el-button>
            <el-button
              v-if="aiAdvice && !adviceEditing"
              size="small"
              @click="resetFutureAdvice"
            >
              恢复默认文案
            </el-button>
            <span v-if="aiAdvice" class="ai-advice-tip">
              已保存 · {{ studentInfo.name || '该生' }}
              <template v-if="aiAdvice.source === 'fallback'">（规则兜底）</template>
              <template v-else-if="aiAdvice.source === 'manual'">（手动编辑）</template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { getStudentReportData } from '../api/student'
import { generateStudentFutureAdvice, getStudentFutureAdvice, deleteStudentFutureAdvice, updateStudentFutureAdvice } from '../api/admin'
import { useAuth } from '../stores/auth'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const isAdmin = computed(() => auth.state.role?.toUpperCase() === 'ADMIN')

const schoolName = ref('')
const studentInfo = ref({})
const destinationData = ref([])
const growthTrajectories = ref([])
const learningProfiles = ref([])
const templates = ref([])
const templateId = ref('')
const selectedTemplate = ref(null)
const loading = ref(true)
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
  const sections = []
  const template = selectedTemplate.value
  
  if (!template?.sections?.length) {
    return getDefaultSections()
  }

  template.sections.forEach(sectionName => {
    switch (sectionName) {
      case '基本信息':
        sections.push({
          title: '基本信息',
          icon: '👤',
          items: [
            { label: '学号', value: studentInfo.value.studentId },
            { label: '姓名', value: studentInfo.value.name },
            { label: '性别', value: studentInfo.value.gender === 'male' || studentInfo.value.gender === '男' ? '男' : '女' },
            { label: '学院', value: studentInfo.value.department },
            { label: '专业', value: studentInfo.value.major },
            { label: '班级', value: studentInfo.value.className },
            { label: '批次', value: studentInfo.value.year + '届' },
            { label: '手机号', value: studentInfo.value.phone },
            { label: '邮箱', value: studentInfo.value.email },
            { label: '入学日期', value: studentInfo.value.enrollmentDate || '暂无数据' },
            { label: '就业状态', value: getEmploymentLabel(studentInfo.value.employmentStatus) }
          ]
        })
        break
      case '成长轨迹':
        sections.push({
          title: '成长轨迹',
          icon: '📈',
          items: [
            { label: '入学年份', value: (studentInfo.value.year - 4) + '年' },
            { label: '毕业年份', value: studentInfo.value.year + '年' },
            { label: '在校时长', value: '4年' },
            { label: '所属批次', value: studentInfo.value.year + '届毕业生' }
          ],
          subItems: growthTrajectories.value.length > 0 ? growthTrajectories.value.map(growth => ({
            title: growth.year + '年成长记录',
            items: [
              { label: '荣誉类型', value: growth.honorType },
              { label: '荣誉名称', value: growth.honorName },
              { label: '奖学金类型', value: growth.scholarshipType },
              { label: '学生干部职务', value: growth.studentCadrePosition },
              { label: '政治面貌', value: growth.partyStatus }
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
        const dest = destinationData.value.length > 0 ? destinationData.value[0] : null
        sections.push({
          title: '就业去向',
          icon: '💼',
          items: [
            { label: '就业类型', value: getDestinationType(dest?.destinationType) || getEmploymentLabel(studentInfo.value.employmentStatus) },
            { label: '省份', value: dest?.province || '暂无数据' },
            { label: '城市', value: dest?.city || '暂无数据' },
            { label: '行业', value: dest?.industry || '暂无数据' },
            { label: '公司名称', value: dest?.companyName || studentInfo.value.companyName || '暂无数据' },
            { label: '公司类型', value: dest?.companyType || '暂无数据' },
            { label: '职位', value: dest?.jobTitle || studentInfo.value.position || '暂无数据' },
            { label: '薪资', value: dest?.salary || studentInfo.value.salary ? '¥' + (dest?.salary || studentInfo.value.salary) : '暂无数据' },
            { label: '工作地点', value: studentInfo.value.workLocation || '暂无数据' },
            { label: '升学学校', value: dest?.schoolName || '暂无数据' },
            { label: '升学专业', value: dest?.majorName || '暂无数据' }
          ],
          subItems: destinationData.value.length > 1 ? destinationData.value.slice(1).map(dest => ({
            title: dest.year + '年去向',
            items: [
              { label: '就业类型', value: getDestinationType(dest.destinationType) },
              { label: '省份', value: dest.province },
              { label: '城市', value: dest.city },
              { label: '行业', value: dest.industry },
              { label: '公司名称', value: dest.companyName },
              { label: '公司类型', value: dest.companyType },
              { label: '职位', value: dest.jobTitle },
              { label: '薪资', value: dest.salary ? '¥' + dest.salary : '暂无数据' },
              { label: '升学学校', value: dest.schoolName },
              { label: '升学专业', value: dest.majorName }
            ]
          })) : []
        })
        break
      case '综合素质':
        const honors = growthTrajectories.value.filter(g => g.honorName).map(g => `${g.year}年: ${g.honorType}${g.honorName}`).join('\n')
        const scholarships = growthTrajectories.value.filter(g => g.scholarshipType).map(g => `${g.year}年: ${g.scholarshipType}`).join('\n')
        const positions = growthTrajectories.value.filter(g => g.studentCadrePosition).map(g => `${g.year}年: ${g.studentCadrePosition}`).join('\n')
        const competitions = learningProfiles.value.filter(l => l.competitionAward).map(l => `${l.year}年: ${l.competitionAward}`).join('\n')
        
        sections.push({
          title: '综合素质',
          icon: '🏆',
          items: [
            { label: '荣誉获得', value: honors || '暂无' },
            { label: '奖学金获得', value: scholarships || '暂无' },
            { label: '学生干部经历', value: positions || '暂无' },
            { label: '政治面貌', value: growthTrajectories.value.length > 0 ? growthTrajectories.value[0].partyStatus : '暂无数据' },
            { label: '竞赛获奖', value: competitions || '暂无' },
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
      case '未来建议':
        sections.push({
          title: '未来建议',
          icon: '💡',
          items: futureAdviceItems.value
        })
        break
    }
  })

  return sections.length > 0 ? sections : getDefaultSections()
})

const getDefaultSections = () => {
  const dest = destinationData.value.length > 0 ? destinationData.value[0] : null
  return [
    {
      title: '基本信息',
      icon: '👤',
      items: [
        { label: '学号', value: studentInfo.value.studentId },
        { label: '姓名', value: studentInfo.value.name },
        { label: '性别', value: studentInfo.value.gender === 'male' || studentInfo.value.gender === '男' ? '男' : '女' },
        { label: '学院', value: studentInfo.value.department },
        { label: '专业', value: studentInfo.value.major },
        { label: '班级', value: studentInfo.value.className },
        { label: '批次', value: studentInfo.value.year + '届' },
        { label: '手机号', value: studentInfo.value.phone },
        { label: '邮箱', value: studentInfo.value.email },
        { label: '入学日期', value: studentInfo.value.enrollmentDate || '暂无数据' },
        { label: '就业状态', value: getEmploymentLabel(studentInfo.value.employmentStatus) }
      ]
    },
    {
      title: '成长轨迹',
      icon: '📈',
      items: [
        { label: '入学年份', value: (studentInfo.value.year - 4) + '年' },
        { label: '毕业年份', value: studentInfo.value.year + '年' },
        { label: '在校时长', value: '4年' },
        { label: '所属批次', value: studentInfo.value.year + '届毕业生' }
      ],
      subItems: growthTrajectories.value.length > 0 ? growthTrajectories.value.map(growth => ({
        title: growth.year + '年成长记录',
        items: [
          { label: '荣誉类型', value: growth.honorType },
          { label: '荣誉名称', value: growth.honorName },
          { label: '奖学金类型', value: growth.scholarshipType },
          { label: '学生干部职务', value: growth.studentCadrePosition },
          { label: '政治面貌', value: growth.partyStatus }
        ]
      })) : []
    },
    {
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
    },
    {
      title: '就业去向',
      icon: '💼',
      items: [
        { label: '就业类型', value: getDestinationType(dest?.destinationType) || getEmploymentLabel(studentInfo.value.employmentStatus) },
        { label: '省份', value: dest?.province || '暂无数据' },
        { label: '城市', value: dest?.city || '暂无数据' },
        { label: '行业', value: dest?.industry || '暂无数据' },
        { label: '公司名称', value: dest?.companyName || studentInfo.value.companyName || '暂无数据' },
        { label: '公司类型', value: dest?.companyType || '暂无数据' },
        { label: '职位', value: dest?.jobTitle || studentInfo.value.position || '暂无数据' },
        { label: '薪资', value: dest?.salary || studentInfo.value.salary ? '¥' + (dest?.salary || studentInfo.value.salary) : '暂无数据' },
        { label: '工作地点', value: studentInfo.value.workLocation || '暂无数据' },
        { label: '升学学校', value: dest?.schoolName || '暂无数据' },
        { label: '升学专业', value: dest?.majorName || '暂无数据' }
      ]
    },
    {
      title: '综合素质',
      icon: '🏆',
      items: [
        { label: '荣誉获得', value: growthTrajectories.value.filter(g => g.honorName).map(g => `${g.year}年: ${g.honorType}${g.honorName}`).join('\n') || '暂无' },
        { label: '奖学金获得', value: growthTrajectories.value.filter(g => g.scholarshipType).map(g => `${g.year}年: ${g.scholarshipType}`).join('\n') || '暂无' },
        { label: '学生干部经历', value: growthTrajectories.value.filter(g => g.studentCadrePosition).map(g => `${g.year}年: ${g.studentCadrePosition}`).join('\n') || '暂无' },
        { label: '政治面貌', value: growthTrajectories.value.length > 0 ? growthTrajectories.value[0].partyStatus : '暂无数据' },
        { label: '竞赛获奖', value: learningProfiles.value.filter(l => l.competitionAward).map(l => `${l.year}年: ${l.competitionAward}`).join('\n') || '暂无' },
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
    },
    {
      title: '未来建议',
      icon: '💡',
      items: futureAdviceItems.value
    }
  ]
}

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

const getSectionIcon = (section) => {
  const icons = {
    '基本信息': '👤',
    '成长轨迹': '📈',
    '学习画像': '📚',
    '就业去向': '💼',
    '综合素质': '🏆',
    '未来建议': '💡'
  }
  return icons[section] || '📄'
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

const resolveStudentId = () => {
  if (route.params.studentId) return route.params.studentId

  let studentId = auth.state.user?.studentId || localStorage.getItem('student_id')
  if (!studentId) {
    const studentInfoStr = localStorage.getItem('student_info')
    if (studentInfoStr) {
      try {
        studentId = JSON.parse(studentInfoStr).studentId
      } catch (_) {
        /* ignore */
      }
    }
  }
  return studentId
}

const fetchReportData = async () => {
  try {
    const studentId = resolveStudentId()
    console.log('[AdminStudentReport] 开始加载报告数据, studentId:', studentId)
    console.log('[AdminStudentReport] 当前角色:', auth.state.role)
    console.log('[AdminStudentReport] 是否已登录:', auth.state.isLoggedIn)

    if (!studentId) {
      ElMessage.error('无法获取学号，请重新登录')
      return
    }

    const res = await getStudentReportData(studentId)
    console.log('[AdminStudentReport] API响应:', res)
    if (res.code === 200) {
      studentInfo.value = res.data.student || {}
      destinationData.value = res.data.destinationData || []
      growthTrajectories.value = res.data.growthTrajectories || []
      learningProfiles.value = res.data.learningProfiles || []
      schoolName.value = res.data.schoolName || 'XX大学'
      aiAdvice.value = null
      await loadSavedFutureAdvice(studentInfo.value.studentId || studentId)
      
      console.log('growthTrajectories:', growthTrajectories.value)
      console.log('learningProfiles:', learningProfiles.value)
      
      templates.value = (res.data.templates || []).map(template => {
        let sections = []
        try {
          sections = template.sections ? JSON.parse(template.sections) : []
        } catch (e) {
          console.error('Failed to parse sections:', template.sections, e)
          sections = ['基本信息', '成长轨迹', '学习画像', '就业去向', '综合素质', '未来建议']
        }
        console.log('Template:', template.name, 'sections:', sections)
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
        console.log('Selected template:', selectedTemplate.value)
      }
    }
  } catch (error) {
    ElMessage.error('获取报告数据失败')
    console.error(error)
  }
}

const renderReport = () => {
  const template = templates.value.find(t => t.id === templateId.value)
  if (template) {
    selectedTemplate.value = template
  }
}

const buildAdviceProfile = () => ({
  student: { ...studentInfo.value },
  destinationData: destinationData.value || [],
  learningProfiles: learningProfiles.value || [],
  growthTrajectories: growthTrajectories.value || []
})

const generateFutureAdvice = async () => {
  const studentId = studentInfo.value.studentId || resolveStudentId()
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
  const studentId = studentInfo.value.studentId || resolveStudentId()
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
  const studentId = studentInfo.value.studentId || resolveStudentId()
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

const reportCardRef = ref(null)

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

watch(
  () => route.params.studentId,
  async (nextId, prevId) => {
    if (!nextId || nextId === prevId) return
    loading.value = true
    await fetchReportData()
    loading.value = false
  }
)
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
  background: #EDF5F3;
  border-color: #E8EEED;
  border-radius: 10px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #B6DDDC;
  border-color: #B6DDDC;
}

.header-info {
  flex: 1;
  text-align: center;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  color: #2D5A7A;
  font-weight: 600;
}

.subtitle {
  margin: 6px 0 0 0;
  font-size: 14px;
  color: #8BA4C4;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E8EEED;
  border-top-color: #B6DDDC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: #8BA4C4;
  font-size: 14px;
}

.report-content {
  display: flex;
  gap: 24px;
}

.report-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(45, 90, 122, 0.08);
}

.card-header {
  padding: 32px;
  text-align: center;
  border-bottom: 3px solid;
  background: linear-gradient(135deg, #F8FAF9 0%, #EDF5F3 100%);
}

.card-header.full {
  border-color: #667eea;
}

.card-header.simple {
  border-color: #4ecdc4;
}

.card-header.employment {
  border-color: #ff9a9e;
}

.school-info h1 {
  margin: 0;
  font-size: 28px;
  color: #2D5A7A;
  font-weight: 700;
}

.school-name {
  margin: 8px 0 0 0;
  font-size: 16px;
  color: #8BA4C4;
}

.student-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 10px 24px;
  background: #FFFFFF;
  border-radius: 30px;
  box-shadow: 0 2px 12px rgba(45, 90, 122, 0.08);
}

.badge-icon {
  font-size: 20px;
}

.student-badge span:last-child {
  font-size: 16px;
  font-weight: 600;
  color: #2D5A7A;
}

.dean-message {
  margin-top: 24px;
  padding: 20px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 16px;
  border-left: 4px solid #667eea;
  position: relative;
}

.dean-message .quote-start,
.dean-message .quote-end {
  position: absolute;
  font-size: 32px;
  color: rgba(102, 126, 234, 0.3);
}

.dean-message .quote-start {
  top: 10px;
  left: 15px;
}

.dean-message .quote-end {
  bottom: 10px;
  right: 15px;
}

.dean-message p {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  font-style: italic;
  line-height: 1.8;
}

.custom-content {
  margin: 24px;
  padding: 20px;
  background: rgba(78, 205, 196, 0.06);
  border-radius: 16px;
  border: 1px solid rgba(78, 205, 196, 0.15);
}

.custom-content-header {
  font-size: 14px;
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 12px;
}

.custom-content-body {
  font-size: 14px;
  color: #4a5568;
  line-height: 2;
  white-space: pre-line;
}

.report-body {
  padding: 32px;
}

.report-section {
  margin-bottom: 28px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(182, 221, 220, 0.08) 0%, rgba(182, 221, 220, 0.03) 100%);
  border: 1px solid rgba(182, 221, 220, 0.2);
}

.report-section.info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(37, 99, 235, 0.03) 100%);
  border-color: rgba(59, 130, 246, 0.15);
}

.report-section.success {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.06) 0%, rgba(22, 163, 74, 0.03) 100%);
  border-color: rgba(78, 205, 196, 0.15);
}

.report-section.warning {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(217, 119, 6, 0.03) 100%);
  border-color: rgba(251, 191, 36, 0.15);
}

.report-section.primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(126, 34, 206, 0.03) 100%);
  border-color: rgba(139, 92, 246, 0.15);
}

.report-section.danger {
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.06) 0%, rgba(220, 38, 38, 0.03) 100%);
  border-color: rgba(255, 154, 158, 0.15);
}

.report-section.purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(147, 51, 234, 0.03) 100%);
  border-color: rgba(168, 85, 247, 0.15);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(203, 213, 224, 0.4);
}

.section-icon {
  font-size: 22px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2D5A7A;
}

.section-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
}

.info-label {
  font-size: 13px;
  color: #8BA4C4;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #2D5A7A;
  font-weight: 500;
  word-break: break-all;
  white-space: normal;
  max-width: 200px;
}

.sub-items {
  margin-top: 16px;
  grid-column: 1 / -1;
}

.sub-item {
  margin-bottom: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border-left: 3px solid #B6DDDC;
}

.sub-item:last-child {
  margin-bottom: 0;
}

.sub-item-header {
  font-size: 13px;
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 10px;
}

.sub-item .info-item {
  background: transparent;
  padding: 6px 0;
}

.alumni-message,
.future-message {
  margin: 0 32px 24px;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  gap: 16px;
}

.alumni-message {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(126, 34, 206, 0.03) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.future-message {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(217, 119, 6, 0.03) 100%);
  border: 1px solid rgba(251, 191, 36, 0.15);
}

.message-icon {
  font-size: 28px;
}

.message-content {
  flex: 1;
}

.message-title {
  font-size: 13px;
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 6px;
}

.message-content p {
  margin: 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.8;
}

.report-footer {
  padding: 24px 32px;
  background: #F8FAF9;
  border-top: 1px solid #E8EEED;
}

.footer-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, #B6DDDC, transparent);
  margin-bottom: 16px;
}

.footer-info {
  text-align: center;
}

.footer-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #8BA4C4;
}

.template-selector {
  width: 280px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(45, 90, 122, 0.06);
}

.template-selector h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #2D5A7A;
  font-weight: 600;
}

.template-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #E8EEED;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 6px;
}

.template-desc {
  font-size: 13px;
  color: #8BA4C4;
  margin-bottom: 12px;
}

.sections-title {
  font-size: 12px;
  color: #8BA4C4;
}

.sections-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.ai-advice-actions {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.advice-edit-item {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.ai-advice-tip {
  font-size: 12px;
  color: #67c23a;
}

.section-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(182, 221, 220, 0.15);
  border-radius: 12px;
  color: #2D5A7A;
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .report-content {
    flex-direction: column;
  }

  .template-selector {
    width: 100%;
  }

  .section-body {
    grid-template-columns: 1fr;
  }
}
</style>