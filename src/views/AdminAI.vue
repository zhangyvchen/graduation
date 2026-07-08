<template>
  <div class="ai-page">
    <header class="content-header">
      <h2>AI 助手</h2>
    </header>
    
    <div class="ai-container">
      <el-card class="ai-card">
        <div class="chat-header">
          <div class="ai-avatar">🤖</div>
          <div class="ai-info">
            <h3>毕业数据报告 AI 助手</h3>
            <p>基于大数据分析，为您提供智能决策支持</p>
          </div>
        </div>
        
        <div class="chat-body">
          <div class="message-list">
            <div class="message ai-message" v-for="msg in messages" :key="msg.id">
              <div class="message-avatar">{{ msg.role === 'ai' ? '🤖' : '👤' }}</div>
              <div class="message-content">
                <div class="message-text">{{ msg.content }}</div>
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
          />
          <el-button type="primary" @click="handleSend" :loading="isLoading">发送</el-button>
        </div>
      </el-card>
      
      <div class="quick-actions">
        <h4>快捷问题</h4>
        <div class="quick-buttons">
          <el-button 
            v-for="question in quickQuestions" 
            :key="question" 
            @click="handleQuickQuestion(question)"
            size="small"
          >
            {{ question }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="ai-features">
      <h4>AI 能力</h4>
      <div class="feature-grid">
        <el-card class="feature-card">
          <div class="feature-icon">📊</div>
          <h5>数据分析</h5>
          <p>基于历史数据进行趋势分析和预测</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">📈</div>
          <h5>统计报告</h5>
          <p>自动生成数据统计和可视化报告</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">🎯</div>
          <h5>智能推荐</h5>
          <p>根据数据特征提供个性化建议</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">📝</div>
          <h5>文案生成</h5>
          <p>自动生成数据分析报告和总结</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([
  {
    id: 1,
    role: 'ai',
    content: '您好！我是毕业数据报告系统的 AI 助手。我可以帮您分析毕业数据、生成统计报告、预测就业趋势等。请问有什么我可以帮助您的？',
    time: new Date().toLocaleTimeString()
  }
])

const inputMessage = ref('')
const isLoading = ref(false)

const quickQuestions = [
  '2024届就业率是多少？',
  '各专业就业分布情况',
  '生成年度数据分析报告',
  '预测下一届升学趋势',
  '哪些班级就业率最高？'
]

const handleSend = async () => {
  if (!inputMessage.value.trim()) return
  
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: inputMessage.value,
    time: new Date().toLocaleTimeString()
  })
  
  const tempMessage = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  isLoading.value = false
  
  const responses = [
    `好的，关于"${tempMessage}"，我来为您分析...\n\n基于数据分析，2024届总体就业率达到95.5%，较去年提升了1.3个百分点。其中软件工程专业就业率最高，达到98.2%。建议关注计算机科学专业，该专业升学率增长明显，已达到42%。`,
    `根据您的问题，以下是分析结果：\n\n1. 就业率趋势：近三年持续上升，年均增长约1.5%\n2. 行业分布：互联网占比35%，金融占比25%，制造业占比20%\n3. 地域分布：一线城市占比60%，新一线城市占比25%\n\n如需详细报告，我可以为您生成完整的数据分析文档。`,
    `分析完成！\n\n综合来看，当前毕业生就业形势良好，但仍有以下几点值得关注：\n- 自主创业比例偏低，仅占5%\n- 部分专业存在结构性就业困难\n- 升学竞争日益激烈\n\n建议加大创业扶持力度，优化专业设置。`,
    `收到您的请求！\n\n根据历史数据预测，下一届毕业生就业率预计将保持在95%以上，升学率有望突破40%。主要增长点可能来自人工智能、大数据等新兴领域。`
  ]
  
  messages.value.push({
    id: Date.now() + 1,
    role: 'ai',
    content: responses[Math.floor(Math.random() * responses.length)],
    time: new Date().toLocaleTimeString()
  })
}

const handleQuickQuestion = (question) => {
  inputMessage.value = question
  handleSend()
}
</script>

<style scoped>
.ai-page {
  padding: 20px;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
}

.ai-container {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.ai-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
}

.ai-avatar {
  font-size: 48px;
}

.ai-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.ai-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.chat-body {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  gap: 12px;
}

.message-avatar {
  font-size: 32px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.ai-message .message-text {
  background: #f5f7fa;
  color: #333;
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
}

.loading-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 12px;
  color: #666;
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

@keyframes loading {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
  margin-top: 15px;
}

.chat-input :deep(.el-input) {
  flex: 1;
}

.quick-actions {
  width: 300px;
}

.quick-actions h4 {
  margin-bottom: 15px;
  color: #333;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-buttons :deep(.el-button) {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
}

.ai-features {
  margin-top: 30px;
}

.ai-features h4 {
  margin-bottom: 20px;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  text-align: center;
  padding: 25px;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.feature-card h5 {
  margin: 0 0 10px 0;
  color: #333;
}

.feature-card p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
</style>
