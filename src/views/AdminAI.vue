<template>
  <div class="ai-page">
    <header class="content-header">
      <h2>AI 助手</h2>
      <div class="header-actions">
        <el-select v-model="currentYear" @change="changeYear" size="small" style="width: 120px; margin-right: 10px;">
          <el-option
            v-for="year in availableYears"
            :key="year"
            :label="year + '年'"
            :value="year"
          />
        </el-select>
        <el-button size="small" @click="exportChatHistory">
          <el-icon><Download /></el-icon> 导出记录
        </el-button>
        <el-button size="small" type="danger" @click="clearChatHistory">
          <el-icon><Delete /></el-icon> 清除记忆
        </el-button>
      </div>
    </header>

    <div class="ai-container">
      <el-card class="ai-card">
        <div class="chat-header">
          <div class="ai-avatar">
            <img :src="aiAvatarHeaderUrl" alt="AI助手" />
            <span class="status-dot"></span>
          </div>
          <div class="ai-info">
            <h3>AI 智能助手</h3>
            <p>基于大数据分析，为您提供智能决策支持</p>
            <div class="ai-status">
              <el-tag size="small" type="success" effect="dark">
                <el-icon><Monitor /></el-icon> 在线
              </el-tag>
              <span style="margin-left: 10px; color: #f0f0f0;">
                当前年份：{{ currentYear }}年
              </span>
            </div>
          </div>
        </div>

        <div class="chat-body">
          <div class="message-list">
            <div
              class="message"
              v-for="msg in messages"
              :key="msg.id"
              :class="msg.role === 'ai' ? 'ai-message' : 'user-message'"
            >
              <div class="message-avatar" v-if="msg.role === 'ai'">
                <img :src="aiAvatarMsgUrl" alt="AI助手" />
              </div>
              <div class="message-avatar" v-else>
                <svg viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" fill="#e8eef5"/>
                  <circle cx="16" cy="14" r="5" fill="#667eea"/>
                  <path d="M8 26 Q16 30 24 26" stroke="#667eea" stroke-width="2" stroke-linecap="round" fill="none"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div class="message-time">{{ msg.time }}</div>
              </div>
            </div>
            <div v-if="isLoading" class="loading-message">
              <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <span>AI 正在思考中...</span>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            placeholder="输入您的问题，例如：2024届就业率趋势分析"
            @keyup.enter="handleSend"
            size="large"
            :disabled="isStreaming"
            clearable
          />
          <el-button
            v-if="!isStreaming"
            type="primary"
            @click="handleSend"
            :disabled="!inputMessage.trim()"
          >
            <el-icon><Send /></el-icon> 发送
          </el-button>
          <el-button
            v-else
            type="danger"
            @click="stopStreaming"
          >
            停止
          </el-button>
        </div>
      </el-card>

      <div class="quick-actions">
        <div class="quick-section">
          <h4>
            <el-icon><Question /></el-icon> 快捷问题
          </h4>
          <div class="quick-buttons">
            <el-button
              v-for="question in quickQuestions"
              :key="question"
              @click="handleQuickQuestion(question)"
              size="small"
            >
              <el-icon><ChatDotRound /></el-icon> {{ question }}
            </el-button>
          </div>
        </div>

        <div class="quick-section">
          <h4>
            <el-icon><DataAnalysis /></el-icon> 快速分析
          </h4>
          <div class="quick-buttons">
            <el-button
              size="small"
              @click="generateAnalysis('employment')"
              :loading="isStreaming"
            >
              <el-icon><PieChart /></el-icon> 就业分析
            </el-button>
            <el-button
              size="small"
              @click="generateAnalysis('major')"
              :loading="isStreaming"
            >
              <el-icon><School /></el-icon> 专业分析
            </el-button>
            <el-button
              size="small"
              @click="generateAnalysis('prediction')"
              :loading="isStreaming"
            >
              <el-icon><TrendCharts /></el-icon> 趋势预测
            </el-button>
            <el-button
              size="small"
              @click="generateAnalysis('report')"
              :loading="isStreaming"
            >
              <el-icon><Document /></el-icon> 年度报告
            </el-button>
          </div>
        </div>

        <div class="tips-section">
          <h4>
            <el-icon><InfoFilled /></el-icon> 使用提示
          </h4>
          <div class="tips-content">
            <p>• 使用自然语言提问，如"2024届就业率如何？"</p>
            <p>• 可以要求生成特定类型的分析报告</p>
            <p>• 支持切换不同年份的数据进行分析</p>
            <p>• 聊天记录可以导出保存</p>
          </div>
        </div>

        <div class="quick-section">
          <h4>
            <el-icon><History /></el-icon> 数据统计
          </h4>
          <div class="stats-content">
            <el-progress type="circle" :percentage="chatCount" :width="60">
              <template #default="{ percentage }">
                <span class="progress-text">{{ chatCount }}</span>
              </template>
            </el-progress>
            <div class="stats-label">对话条数</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { getChatHistoryByYear } from '../api/admin'
import { useAiChat } from '../composables/useAiChat'

const {
  Download,
  Delete,
  Monitor,
  Send,
  Question,
  ChatDotRound,
  DataAnalysis,
  PieChart,
  School,
  TrendCharts,
  Document,
  InfoFilled,
  History
} = ElementPlusIconsVue

const availableYears = ref([2022, 2023, 2024, 2025, 2026])

/** 与悬浮窗共用同一套头像资源 */
const aiAvatarHeaderUrl = '/static/AI_2.png'
const aiAvatarMsgUrl = '/static/AI_3.png'

const {
  messages,
  inputText: inputMessage,
  isLoading,
  isStreaming,
  currentYear,
  chatCount,
  formatMessage,
  initIdentityTracking,
  loadChatHistory,
  sendMessage,
  stopGeneration: stopStreaming,
  clearMemory
} = useAiChat({
  welcomeMessage:
    '您好！我是毕业数据报告系统的 AI 助手。我可以帮您分析毕业数据、生成统计报告、预测就业趋势等。请问有什么我可以帮助您的？',
  onError: () => ElMessage.error('AI聊天失败，请稍后重试'),
  onRiskBlocked: ({ riskWord, message }) => {
    ElMessageBox.alert(
      `${message}<br/><br/>命中词：<b>${riskWord || '敏感词'}</b><br/>该记录已写入异常对话，可在「AI 风控」中查看。`,
      '内容安全提示',
      {
        dangerouslyUseHTMLString: true,
        type: 'warning',
        confirmButtonText: '知道了'
      }
    )
  }
})

const quickQuestions = [
  `${currentYear.value}届就业率是多少？`,
  '分析各专业就业情况',
  `生成${currentYear.value}年度数据分析报告`,
  '预测下一年就业趋势',
  '主要就业行业有哪些？'
]

const handleSend = async () => {
  if (!inputMessage.value.trim() || isStreaming.value) return
  const text = inputMessage.value
  inputMessage.value = ''
  await sendMessage(text, currentYear.value)
}

const handleQuickQuestion = (question) => {
  const updatedQuestion = question.replace(/\d{4}/, currentYear.value.toString())
  inputMessage.value = updatedQuestion
  handleSend()
}

const generateAnalysis = async (type) => {
  const analysisNames = {
    employment: '就业分析',
    major: '专业分析',
    prediction: '趋势预测',
    report: '年度报告'
  }
  await sendMessage(`生成${currentYear.value}年${analysisNames[type]}`, currentYear.value)
}

const changeYear = async (year) => {
  try {
    const response = await getChatHistoryByYear(year)
    if (response.code === 200) {
      messages.value = (response.data || []).map(msg => ({
        id: msg.id,
        role: msg.role === 'ai' ? 'ai' : 'user',
        content: msg.role === 'ai' ? (msg.response || msg.content) : msg.content,
        time: msg.createTime
          ? new Date(msg.createTime).toLocaleTimeString()
          : new Date().toLocaleTimeString()
      }))
      currentYear.value = year
      ElMessage.success(`已切换到${year}年的数据`)
    }
  } catch (error) {
    console.error('切换年份失败:', error)
    ElMessage.error('切换年份失败')
  }
}

const exportChatHistory = () => {
  const chatContent = messages.value.map(msg => {
    return `[${msg.time}] ${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`
  }).join('\n\n')

  const blob = new Blob([chatContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AI聊天记录_${new Date().toLocaleDateString()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const clearChatHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空聊天记录和 AI 记忆吗？将同时删除数据库中的历史记录，此操作不可恢复！',
      '提示',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await clearMemory({
      deleteDb: true,
      resetText: '记忆与聊天记录已清空。您好！我是毕业数据报告系统的 AI 助手，请问有什么可以帮您的？'
    })
    ElMessage.success('聊天记录与 AI 记忆已清空')
  } catch {
    // 用户取消或请求失败
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    const chatBody = document.querySelector('.chat-body')
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight
    }
  }, 100)
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  initIdentityTracking()
  loadChatHistory()
})
</script>

<style scoped>
.ai-page {
  padding: 16px 20px;
  background: #f8f9fa;
  height: calc(100vh - 48px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 0 12px 0;
  border-bottom: 2px solid #e9ecef;
  flex-shrink: 0;
}

.content-header h2 {
  color: #2c3e50;
  font-size: 24px;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-container {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  margin-bottom: 0;
}

.ai-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.ai-card :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.ai-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: visible;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ai-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.ai-avatar .status-dot {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #67c23a;
  border: 2px solid #fff;
}

.ai-info h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
}

.ai-info p {
  margin: 0 0 10px 0;
  opacity: 0.9;
  font-size: 14px;
}

.ai-status {
  display: flex;
  align-items: center;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  background: white;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  align-self: flex-start;
}

.message-avatar img,
.message-avatar svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.message-content {
  max-width: 70%;
  width: fit-content;
  height: fit-content;
  align-self: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-content {
  align-self: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-text :deep(p) {
  margin: 0 0 8px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 10px 0 6px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h3:first-child),
.message-text :deep(h4:first-child) {
  margin-top: 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 20px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.ai-message .message-text {
  background: #f5f7fa;
  color: #333;
  border: 1px solid #e9ecef;
}

.user-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  margin-left: auto;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 12px;
  color: #666;
  justify-content: center;
}

.loading-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: loading 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes loading {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.chat-input :deep(.el-input) {
  flex: 1;
}

.quick-actions {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 100%;
}

.quick-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quick-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-section h4::before {
  content: '';
  width: 4px;
  height: 20px;
  background: #667eea;
  border-radius: 2px;
}

.quick-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-buttons :deep(.el-button) {
  background: #f8f9fa;
  border-color: #e9ecef;
  color: #495057;
  font-size: 13px;
}

.quick-buttons :deep(.el-button:hover) {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

.tips-section {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 15px;
  border-radius: 8px;
}

.tips-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.tips-content {
  font-size: 13px;
  line-height: 1.6;
}

.tips-content p {
  margin: 0 0 5px 0;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-container {
    flex-direction: column;
  }

  .quick-actions {
    width: 100%;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .chat-body {
    max-height: 400px;
  }
}

/* 滚动条样式 */
.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
