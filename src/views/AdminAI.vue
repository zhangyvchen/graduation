<template>
  <div class="ai-page ai-chat-scope" :class="{ 'sidebar-collapsed': sessionCollapsed }">
    <aside class="session-sidebar" :aria-hidden="sessionCollapsed">
      <button type="button" class="new-session-btn" :disabled="isStreaming" @click="handleNewSession">
        <span class="new-session-icon">+</span>
        新对话
      </button>

      <div class="session-list" v-loading="sessionsLoading">
        <div
          v-for="s in sessions"
          :key="s.sessionKey"
          class="session-item"
          :class="{ active: s.sessionKey === currentSessionKey }"
          @click="handleSwitchSession(s.sessionKey)"
        >
          <div class="session-title" :title="s.title">{{ s.title || '新对话' }}</div>
          <div class="session-actions" @click.stop>
            <button type="button" class="session-action" @click="handleRenameSession(s)">改名</button>
            <button type="button" class="session-action danger" @click="handleRemoveSession(s)">删除</button>
          </div>
        </div>
        <el-empty v-if="!sessionsLoading && sessions.length === 0" description="暂无会话" :image-size="48" />
      </div>

      <div class="sidebar-foot">
        <button type="button" class="foot-link" @click="$router.push('/admin/ai-history')">历史管理</button>
        <button type="button" class="foot-link danger" @click="clearChatHistory">清除记忆</button>
      </div>
    </aside>

    <section class="chat-main">
      <div class="chat-top">
        <div class="chat-top-meta">
          <button
            type="button"
            class="sidebar-toggle"
            :title="sessionCollapsed ? '展开会话栏' : '收起会话栏'"
            :aria-expanded="!sessionCollapsed"
            @click="sessionCollapsed = !sessionCollapsed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" stroke="currentColor" stroke-width="1.7" />
              <path d="M9 5v14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </button>
          <strong>{{ currentSessionTitle }}</strong>
          <span>{{ currentModelLabel }} · {{ visionEnabled ? '识图已开' : '纯文本' }}</span>
        </div>
        <div class="tool-row">
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="generateAnalysis('employment')">就业分析</button>
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="generateAnalysis('major')">专业分析</button>
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="generateAnalysis('prediction')">趋势预测</button>
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="generateAnalysis('report')">年度报告</button>
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="openPeriodBrief('weekly')">一键周报</button>
          <button type="button" class="tool-chip" :disabled="isStreaming" @click="openPeriodBrief('monthly')">一键月报</button>
        </div>
      </div>

      <AiChatShell
        class="admin-shell"
        variant="page"
        :page-size="6"
        :messages="messages"
        :is-loading="isLoading"
        :is-streaming="isStreaming"
        :suggestions="shellSuggestions"
        empty-hi=""
        empty-title="毕业数据助手"
        empty-desc="输入问题或使用上方工具。回答支持一键复制，方便贴进报告与周报。"
        :ai-avatar-url="aiAvatarMsgUrl"
        :user-avatar-url="userAvatarUrl"
        @suggest="onShellSuggest"
        @regenerate="onRegenerate"
      />

      <AiChatComposer
        v-model="inputMessage"
        v-model:selected-model="selectedModelProxy"
        floating
        :pending-images="pendingImages"
        :is-streaming="isStreaming"
        :vision-enabled="visionEnabled"
        :model-options="modelOptions"
        :show-model-select="true"
        placeholder="输入分析问题，Enter 发送…"
        @send="handleSend"
        @stop="stopStreaming"
        @pick-images="onPickImages"
        @remove-image="removePendingImage"
      />
    </section>

    <PeriodBriefDialog
      v-model="periodBriefVisible"
      :default-year="currentYear"
      :initial-period-type="periodBriefInitialType"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAiChat } from '../composables/useAiChat'
import AiChatShell from '../components/AiChatShell.vue'
import AiChatComposer from '../components/AiChatComposer.vue'
import PeriodBriefDialog from '../components/PeriodBriefDialog.vue'
import { useAuth } from '../stores/auth'
import {
  AI_CHAT_AVATAR,
  resolveUserChatAvatar
} from '../utils/chatAvatars'

const aiAvatarMsgUrl = AI_CHAT_AVATAR
const { state: authState } = useAuth()
const userAvatarUrl = computed(() => resolveUserChatAvatar(authState))
const sessionCollapsed = ref(false)
const periodBriefVisible = ref(false)
const periodBriefInitialType = ref('weekly')

const openPeriodBrief = (type) => {
  periodBriefInitialType.value = type || 'weekly'
  periodBriefVisible.value = true
}

const {
  messages,
  inputText: inputMessage,
  isLoading,
  isStreaming,
  currentYear,
  sessions,
  currentSessionKey,
  currentSession,
  sessionsLoading,
  pendingImages,
  modelOptions,
  selectedModel,
  visionEnabled,
  currentModelMeta,
  setSelectedModel,
  initIdentityTracking,
  loadChatHistory,
  createSession,
  switchSession,
  renameSession,
  removeSession,
  sendMessage,
  regenerateLast,
  addImages,
  removePendingImage,
  stopGeneration: stopStreaming,
  clearMemory
} = useAiChat({
  welcomeMessage:
    '您好！我是毕业数据报告系统的 AI 助手。我可以帮您分析毕业数据、生成统计报告、预测就业趋势；也支持上传图片解析，并用图表展示结果。请问有什么我可以帮助您的？',
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

const selectedModelProxy = computed({
  get: () => selectedModel.value,
  set: (v) => setSelectedModel(v)
})

const currentSessionTitle = computed(
  () => currentSession.value?.title || '新对话'
)

const currentModelLabel = computed(
  () => currentModelMeta.value?.label || selectedModel.value || '—'
)

const quickQuestions = computed(() => [
  `${currentYear.value}届就业率是多少？`,
  '分析各专业就业情况',
  `生成${currentYear.value}年度数据分析报告`,
  '预测下一年就业趋势',
  '主要就业行业有哪些？',
  '各学院就业率对比怎么样？',
  '升学与就业比例分别是多少？',
  '帮我梳理一份周报要点'
])

const shellSuggestions = computed(() =>
  quickQuestions.value.map((q) => ({ label: q, prompt: q }))
)

const onPickImages = async (files) => {
  await addImages(files)
}

const handleNewSession = async () => {
  try {
    await createSession('新对话')
    ElMessage.success('已新建对话')
  } catch {
    ElMessage.error('新建对话失败')
  }
}

const handleSwitchSession = async (key) => {
  if (isStreaming.value) {
    ElMessage.warning('请先停止当前生成')
    return
  }
  await switchSession(key)
}

const handleRenameSession = async (s) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入会话标题', '重命名', {
      inputValue: s.title || '新对话',
      confirmButtonText: '保存',
      cancelButtonText: '取消'
    })
    if (value?.trim()) {
      await renameSession(s.sessionKey, value.trim())
      ElMessage.success('已重命名')
    }
  } catch {
    // cancel
  }
}

const handleRemoveSession = async (s) => {
  try {
    await ElMessageBox.confirm(
      `确定删除会话「${s.title || '新对话'}」？相关记忆与记录将一并清除。`,
      '提示',
      { type: 'warning' }
    )
    await removeSession(s.sessionKey)
    ElMessage.success('已删除')
  } catch {
    // cancel
  }
}

const handleSend = async () => {
  if (isStreaming.value) return
  if (!inputMessage.value.trim() && !pendingImages.value.length) return
  const text = inputMessage.value
  inputMessage.value = ''
  await sendMessage(text, currentYear.value)
}

const handleQuickQuestion = (question) => {
  const updatedQuestion = question.replace(/\d{4}/, currentYear.value.toString())
  inputMessage.value = updatedQuestion
  handleSend()
}

const onShellSuggest = (item) => {
  const prompt = item?.prompt || item?.label || item
  if (!prompt) return
  handleQuickQuestion(String(prompt))
}

const onRegenerate = async () => {
  await regenerateLast()
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

const clearChatHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定清空当前会话的 AI 记忆与落库记录？此操作不可恢复。',
      '提示',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await clearMemory({
      deleteDb: true,
      resetText: '本会话记忆已清空。您好！我是毕业数据报告系统的 AI 助手，请问有什么可以帮您的？'
    })
    ElMessage.success('本会话记忆已清空')
  } catch {
    // cancel
  }
}

onMounted(async () => {
  await initIdentityTracking()
  await loadChatHistory()
})
</script>

<style scoped>
/* 贴边铺满：侧栏浅灰 / 主区白，无外层卡片 */
.ai-page {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  background: #fff;
  overflow: hidden;
  --ai-bg: #fff;
  --ai-glow: none;
  --ai-shadow: 0 8px 28px rgba(17, 24, 39, 0.08);
  --ai-shadow-soft: 0 2px 10px rgba(17, 24, 39, 0.05);
  --ai-accent: #2563eb;
  --ai-accent-soft: rgba(37, 99, 235, 0.08);
}

.session-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px 12px;
  background: #f5f6f8;
  min-height: 0;
  overflow: hidden;
  transition:
    width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.ai-page.sidebar-collapsed .session-sidebar {
  width: 0;
  padding-left: 0;
  padding-right: 0;
  opacity: 0;
  pointer-events: none;
}

.sidebar-toggle {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-right: 2px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-toggle:hover {
  background: #f3f4f6;
  color: #111827;
}

.ai-page.sidebar-collapsed .sidebar-toggle {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.new-session-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  color: #1a1d24;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
  transition: background 0.15s ease, transform 0.15s ease;
}

.new-session-btn:hover:not(:disabled) {
  background: #eef0f3;
  transform: translateY(-1px);
}

.new-session-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.new-session-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #eef0f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  color: #4b5563;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-top: 4px;
}

.session-item {
  padding: 10px 12px 8px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.15s ease;
}

.session-item:hover {
  background: rgba(17, 24, 39, 0.04);
}

.session-item.active {
  background: rgba(17, 24, 39, 0.07);
}

.session-title {
  font-size: 13px;
  color: #1a1d24;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  line-height: 1.4;
}

.session-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.session-item:hover .session-actions,
.session-item.active .session-actions {
  opacity: 1;
}

.session-action {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
}

.session-action:hover {
  color: #2563eb;
}

.session-action.danger:hover {
  color: #e57373;
}

.sidebar-foot {
  display: flex;
  gap: 8px;
  padding-top: 8px;
}

.foot-link {
  flex: 1;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.foot-link:hover {
  background: rgba(17, 24, 39, 0.05);
  color: #1a1d24;
}

.foot-link.danger:hover {
  color: #e57373;
}

.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  overflow: hidden;
}

.chat-top {
  flex-shrink: 0;
  padding: 14px 28px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-top-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chat-top-meta strong {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-top-meta span {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.tool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-chip {
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tool-chip:hover:not(:disabled) {
  background: #e5e7eb;
  color: #111827;
}

.tool-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.admin-shell {
  flex: 1;
  min-height: 0;
}

@media (max-width: 960px) {
  .ai-page {
    flex-direction: column;
  }

  .session-sidebar {
    width: 100%;
    max-height: 160px;
  }
}
</style>
