<template>
  <div class="ai-float-container">
    <div 
      class="ai-float-btn" 
      :class="{ 'active': isOpen }"
      @click="toggleChat"
    >
      <span class="ai-icon">🤖</span>
      <span class="ai-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
    </div>
    
    <transition name="slide-up">
      <div v-if="isOpen" class="ai-chat-panel">
        <div class="chat-header">
          <div class="chat-title">
            <span class="chat-icon">🤖</span>
            <span>AI 助手</span>
          </div>
          <button class="close-btn" @click="toggleChat">✕</button>
        </div>
        
        <div class="chat-messages">
          <div class="message ai-message" v-for="msg in messages" :key="msg.id">
            <span class="message-avatar">{{ msg.role === 'ai' ? '🤖' : '👤' }}</span>
            <span class="message-text">{{ msg.content }}</span>
          </div>
          <div v-if="isLoading" class="loading-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
        
        <div class="chat-input">
          <input 
            v-model="inputText" 
            placeholder="输入问题..." 
            @keyup.enter="sendMessage"
            class="input-field"
          />
          <button class="send-btn" @click="sendMessage" :disabled="isLoading">
            <span>发送</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { aiChat, getChatHistory } from '../api/admin'

const isOpen = ref(false)
const isLoading = ref(false)
const unreadCount = ref(0)
const inputText = ref('')
const userId = ref('admin_' + new Date().getTime())

const messages = ref([
  {
    id: 1,
    role: 'ai',
    content: '您好！我是毕业数据报告系统的 AI 助手，有什么可以帮您的？'
  }
])

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    loadChatHistory()
  }
}

const loadChatHistory = async () => {
  try {
    const response = await getChatHistory(userId.value)
    if (response.code === 200 && response.data && response.data.length > 0) {
      messages.value = response.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.role === 'ai' ? msg.response || msg.content : msg.content
      }))
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: inputText.value
  })
  
  inputText.value = ''
  isLoading.value = true
  
  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'ai',
    content: ''
  })
  
  try {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId.value,
        content: messages.value[messages.value.length - 2].content,
        messageType: 'general'
      })
    })
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.includes('[DONE]') && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('data:')) {
          const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
          if (aiMsgIndex !== -1) {
            messages.value[aiMsgIndex].content += trimmedLine
          }
        }
      }
    }
    
    isLoading.value = false
    
  } catch (error) {
    console.error('AI聊天失败:', error)
    isLoading.value = false
    const aiMsgIndex = messages.value.findIndex(m => m.id === aiMessageId)
    if (aiMsgIndex !== -1) {
      messages.value[aiMsgIndex].content = '网络连接异常，请稍后重试。'
    }
  }
}

onMounted(() => {
  loadChatHistory()
})
</script>

<style scoped>
.ai-float-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
}

.ai-float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, background 0.2s ease;
  position: relative;
  z-index: 10000;
}

.ai-float-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 8px 35px rgba(102, 126, 234, 0.5);
}

.ai-float-btn.active {
  transform: scale(1.1) rotate(135deg);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.ai-icon {
  font-size: 28px;
}

.ai-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 20px;
  height: 20px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.ai-chat-panel {
  width: 320px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 15px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
}

.chat-icon {
  font-size: 20px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 75%;
}

.ai-message .message-text {
  background: #f5f7fa;
  color: #333;
  border-radius: 0 12px 12px 12px;
}

.user-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  margin-left: auto;
  border-radius: 12px 0 12px 12px;
}

.loading-indicator {
  display: flex;
  gap: 5px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 0 12px 12px 12px;
  align-self: flex-start;
}

.loading-indicator .dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: loading-dot 1.4s infinite ease-in-out both;
}

.loading-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-indicator .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading-dot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.input-field {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #667eea;
}

.send-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
