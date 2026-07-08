<template>
  <div class="data-story" v-if="text">
    <div class="story-icon">🎙️</div>
    <div class="story-content">
      <div class="story-text" v-html="displayText"></div>
      <div class="story-actions">
        <el-button size="small" type="primary" link @click="speak">
          🔊 播报
        </el-button>
        <el-button size="small" type="primary" link @click="regenerate">
          🔄 重新解说
        </el-button>
        <el-button size="small" type="primary" link @click="copyText">
          📋 复制
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // 故事文本（支持Markdown加粗 **文本**）
  text: {
    type: String,
    default: ''
  },
  // 是否自动播放语音
  autoSpeak: {
    type: Boolean,
    default: false
  },
  // 打字速度（毫秒/字）
  typingSpeed: {
    type: Number,
    default: 30
  }
})

const emit = defineEmits(['regenerate'])

const displayChars = ref([])
const isTyping = ref(false)
let typeTimer = null
let speechSynth = null

// 格式化显示文本（处理Markdown加粗）
const displayText = computed(() => {
  let html = displayChars.value.join('')
  // 处理 **粗体**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  return html
})

// 打字机效果
const typeWriter = (text) => {
  if (typeTimer) clearInterval(typeTimer)
  displayChars.value = []
  isTyping.value = true

  const chars = text.split('')
  let index = 0

  typeTimer = setInterval(() => {
    if (index < chars.length) {
      displayChars.value.push(chars[index])
      index++
    } else {
      clearInterval(typeTimer)
      typeTimer = null
      isTyping.value = false
      // 打字完成后自动播报
      if (props.autoSpeak) {
        speak()
      }
    }
  }, props.typingSpeed)
}

// 语音播报
const speak = () => {
  if (!window.speechSynthesis) {
    ElMessage.warning('浏览器不支持语音播报')
    return
  }

  // 取消正在播放的语音
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
  }

  const fullText = displayChars.value.join('')
  if (!fullText) return

  const utterance = new SpeechSynthesisUtterance(fullText)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1.1
  utterance.volume = 1

  // 选择中文语音
  const voices = window.speechSynthesis.getVoices()
  const zhVoice = voices.find(v => v.lang.includes('zh'))
  if (zhVoice) utterance.voice = zhVoice

  window.speechSynthesis.speak(utterance)
  ElMessage.success('🔊 开始播报')
}

// 重新解说
const regenerate = () => {
  if (typeTimer) clearInterval(typeTimer)
  emit('regenerate')
}

// 复制文本
const copyText = async () => {
  const text = displayChars.value.join('')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('📋 已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// 监听文本变化，重新打字
watch(() => props.text, (newText) => {
  if (newText) {
    typeWriter(newText)
  }
}, { immediate: true })

// 组件卸载时清理
onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer)
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
  }
})
</script>

<style scoped>
.data-story {
  display: flex;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 16px;
  border-left: 4px solid #667eea;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.data-story:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

.story-icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}

.story-content {
  flex: 1;
  min-width: 0;
}

.story-text {
  font-size: 15px;
  line-height: 1.8;
  color: #2c3e50;
  font-family: 'Microsoft YaHei', sans-serif;
  word-break: break-word;
}

.story-text :deep(strong) {
  color: #667eea;
  font-weight: 700;
  background: rgba(102, 126, 234, 0.12);
  padding: 0 6px;
  border-radius: 4px;
}

.story-actions {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.story-actions :deep(.el-button) {
  font-size: 13px;
  color: #667eea;
}

.story-actions :deep(.el-button:hover) {
  color: #764ba2;
}
</style>