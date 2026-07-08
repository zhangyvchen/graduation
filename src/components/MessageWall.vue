<template>
  <div class="message-wall">
    <!-- 标题 -->
    <div class="wall-header">
      <div class="wall-title">
        <span class="title-icon">💬</span>
        <span>致母校 · 毕业留言墙</span>
        <el-tag size="small" type="info" round>{{ messages.length }} 条留言</el-tag>
      </div>
      <div class="wall-actions">
        <el-button size="small" @click="sortByLikes">
          ❤️ 最热
        </el-button>
        <el-button size="small" @click="sortByTime">
          🕐 最新
        </el-button>
        <el-button size="small" @click="refreshMessages">
          🔄 刷新
        </el-button>
      </div>
    </div>

    <!-- 留言卡片瀑布流 -->
    <div class="wall-grid" ref="wallGridRef">
      <div
          v-for="msg in sortedMessages"
          :key="msg.id"
          class="message-card"
          :class="{ 'pinned': msg.isPinned }"
          @mouseenter="hoveredId = msg.id"
          @mouseleave="hoveredId = null"
      >
        <!-- 置顶标签 -->
        <div v-if="msg.isPinned" class="pinned-badge">📌 置顶</div>

        <div class="card-header">
          <img :src="msg.avatar" class="avatar" alt="头像" />
          <div class="card-user">
            <div class="username">{{ msg.nickname }}</div>
            <div class="user-year">{{ msg.year }}</div>
          </div>
          <div class="card-time">{{ msg.time }}</div>
        </div>

        <div class="card-content">{{ msg.content }}</div>

        <div class="card-footer">
          <button class="like-btn" :class="{ liked: msg.liked }" @click="toggleLike(msg.id)">
            <span class="like-icon">{{ msg.liked ? '❤️' : '🤍' }}</span>
            <span class="like-count">{{ msg.likes }}</span>
          </button>
          <button class="reply-btn" @click="showReplyInput(msg.id)">
            💬 回复
          </button>
        </div>

        <!-- 回复区域 -->
        <div v-if="replyTargetId === msg.id" class="reply-area">
          <el-input
              v-model="replyContent"
              placeholder="写下你的回复..."
              size="small"
              @keyup.enter="submitReply(msg.id)"
          />
          <el-button size="small" @click="submitReply(msg.id)">发送</el-button>
          <el-button size="small" @click="replyTargetId = null">取消</el-button>
        </div>

        <!-- 回复列表 -->
        <div v-if="msg.replies && msg.replies.length > 0" class="reply-list">
          <div v-for="(reply, idx) in msg.replies" :key="idx" class="reply-item">
            <span class="reply-name">{{ reply.nickname }}</span>
            <span class="reply-text">：{{ reply.content }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布留言 -->
    <div class="publish-area">
      <div class="publish-row">
        <el-input
            v-model="newMessage.nickname"
            placeholder="你的昵称（选填）"
            size="default"
            style="width: 140px; flex-shrink: 0"
            maxlength="12"
        />
        <el-input
            v-model="newMessage.content"
            placeholder="写下你想对母校/同窗说的话..."
            size="default"
            maxlength="200"
            @keyup.enter="publishMessage"
            show-word-limit
        />
        <el-button type="primary" @click="publishMessage" :disabled="!newMessage.content.trim()">
          🚀 发布留言
        </el-button>
      </div>
      <div class="publish-hint">💡 留下你的毕业感言，让温暖传递下去</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

// ===== 状态 =====
const messages = ref([])
const newMessage = ref({ nickname: '', content: '' })
const hoveredId = ref(null)
const replyTargetId = ref(null)
const replyContent = ref('')
const sortMode = ref('time') // time | likes

// 从 localStorage 加载
const loadMessages = () => {
  try {
    const saved = localStorage.getItem('graduation_messages')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 为旧数据补充字段
      messages.value = parsed.map(m => ({
        ...m,
        liked: m.liked || false,
        replies: m.replies || []
      }))
    } else {
      // 初始示例数据
      messages.value = getInitialMessages()
    }
  } catch (e) {
    messages.value = getInitialMessages()
  }
}

// 初始示例留言
const getInitialMessages = () => {
  const now = new Date()
  const timeStr = (offset) => {
    const d = new Date(now)
    d.setHours(d.getHours() - offset)
    return d.toLocaleString()
  }
  return [
    {
      id: Date.now() - 100000,
      nickname: '小明',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=小明`,
      year: '2024届',
      content: '感谢母校四年的培养，在这里我遇到了最好的老师和同学。愿我们都能成为更好的自己！🌟',
      likes: 89,
      liked: false,
      time: timeStr(2),
      isPinned: true,
      replies: [
        { nickname: '小华', content: '说得太好了！一起加油！' }
      ]
    },
    {
      id: Date.now() - 80000,
      nickname: '小红',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=小红`,
      year: '2024届',
      content: '永远记得图书馆的灯光和实验室的日夜。青春不散场，我们更高处见！📚✨',
      likes: 127,
      liked: false,
      time: timeStr(3),
      isPinned: false,
      replies: []
    },
    {
      id: Date.now() - 60000,
      nickname: '小刚',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=小刚`,
      year: '2023届',
      content: '毕业一年了，依然想念在学校的每一天。学弟学妹们，珍惜校园时光，好好学习，天天向上！💪',
      likes: 56,
      liked: false,
      time: timeStr(5),
      isPinned: false,
      replies: []
    },
    {
      id: Date.now() - 40000,
      nickname: '小丽',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=小丽`,
      year: '2024届',
      content: '从大一到大四，从懵懂到成熟。感谢所有老师的谆谆教诲，感谢室友的陪伴。爱母校，爱你们！❤️',
      likes: 203,
      liked: false,
      time: timeStr(1),
      isPinned: false,
      replies: [
        { nickname: '小美', content: '同感！' },
        { nickname: '小强', content: '毕业快乐！' }
      ]
    }
  ]
}

// 保存到 localStorage
const saveMessages = () => {
  try {
    localStorage.setItem('graduation_messages', JSON.stringify(messages.value))
  } catch (e) {
    console.warn('保存留言失败', e)
  }
}

// ===== 计算属性 =====
const sortedMessages = computed(() => {
  const list = [...messages.value]
  if (sortMode.value === 'likes') {
    list.sort((a, b) => b.likes - a.likes)
  } else {
    list.sort((a, b) => b.id - a.id)
  }
  // 置顶优先
  return list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
})

// ===== 方法 =====
// 生成随机头像
const getRandomAvatar = (seed) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || Math.random().toString(36).substring(7)}`
}

// 发布留言
const publishMessage = () => {
  const content = newMessage.value.content.trim()
  if (!content) {
    ElMessage.warning('写点什么吧～')
    return
  }

  const msg = {
    id: Date.now(),
    nickname: newMessage.value.nickname.trim() || '匿名校友',
    avatar: getRandomAvatar(newMessage.value.nickname || undefined),
    year: '2024届',
    content: content,
    likes: 0,
    liked: false,
    time: new Date().toLocaleString(),
    isPinned: false,
    replies: []
  }

  messages.value.unshift(msg)
  saveMessages()

  // 清空输入
  newMessage.value.content = ''
  // 保留昵称

  ElMessage.success('💚 留言已发布！感谢你的分享 🎉')

  // 触发彩蛋效果（简单版）
  triggerPublishEffect()
}

// 点赞切换
const toggleLike = (id) => {
  const msg = messages.value.find(m => m.id === id)
  if (!msg) return

  if (msg.liked) {
    msg.likes--
    msg.liked = false
  } else {
    msg.likes++
    msg.liked = true
    // 点赞时触发小动画（通过class改变）
    triggerLikeEffect(id)
  }
  saveMessages()
}

// 显示回复输入
const showReplyInput = (id) => {
  replyTargetId.value = replyTargetId.value === id ? null : id
  replyContent.value = ''
}

// 提交回复
const submitReply = (id) => {
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入回复内容')
    return
  }

  const msg = messages.value.find(m => m.id === id)
  if (!msg) return

  if (!msg.replies) msg.replies = []
  msg.replies.push({
    nickname: '校友',
    content: content
  })

  replyContent.value = ''
  replyTargetId.value = null
  saveMessages()
  ElMessage.success('💬 回复已发送')
}

// 排序
const sortByLikes = () => { sortMode.value = 'likes' }
const sortByTime = () => { sortMode.value = 'time' }

// 刷新
const refreshMessages = () => {
  loadMessages()
  ElMessage.success('🔄 已刷新')
}

// ===== 特效（简单版） =====
const triggerPublishEffect = () => {
  // 简单视觉反馈
  const cards = document.querySelectorAll('.message-card')
  if (cards.length > 0) {
    cards[0].style.animation = 'none'
    setTimeout(() => {
      cards[0].style.animation = 'flyIn 0.6s ease'
    }, 10)
  }
}

const triggerLikeEffect = (id) => {
  // 找到对应的点赞按钮并添加动画
  const el = document.querySelector(`[data-msg-id="${id}"] .like-btn`)
  if (el) {
    el.classList.add('liked-anim')
    setTimeout(() => el.classList.remove('liked-anim'), 600)
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadMessages()
  // 每隔30秒自动刷新（但只在页面可见时）
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      // 只刷新本地数据，不重载
    }
  }, 30000)
  // 清理
  return () => clearInterval(interval)
})

// 监听消息变化自动保存
watch(messages, () => {
  saveMessages()
}, { deep: true })
</script>

<style scoped>
.message-wall {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

/* ===== 标题 ===== */
.wall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.wall-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.title-icon {
  font-size: 24px;
}

.wall-actions {
  display: flex;
  gap: 8px;
}

/* ===== 瀑布流 ===== */
.wall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.message-card {
  background: #fafbfc;
  border-radius: 16px;
  padding: 18px 20px 16px;
  transition: all 0.3s ease;
  border: 1px solid #f0f2f5;
  position: relative;
  animation: flyIn 0.5s ease;
}

.message-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.message-card.pinned {
  border-color: #ffd93d;
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
}

.pinned-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: #ffd93d;
  color: #333;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(255, 217, 61, 0.4);
}

@keyframes flyIn {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== 卡片内容 ===== */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e8ecf1;
  flex-shrink: 0;
}

.card-user {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.user-year {
  font-size: 12px;
  color: #999;
}

.card-time {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}

.card-content {
  font-size: 15px;
  line-height: 1.7;
  color: #444;
  margin-bottom: 14px;
  word-break: break-word;
  min-height: 40px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  padding: 4px 10px;
  border-radius: 20px;
  transition: all 0.3s ease;
  color: #999;
}

.like-btn:hover {
  background: #f0f2f5;
}

.like-btn.liked {
  color: #e74c3c;
}

.like-btn.liked .like-icon {
  animation: heartBeat 0.4s ease;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.2); }
}

.like-count {
  font-size: 14px;
  font-weight: 500;
}

.reply-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 4px 10px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.reply-btn:hover {
  background: #f0f2f5;
  color: #667eea;
}

/* ===== 回复 ===== */
.reply-area {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
}

.reply-area :deep(.el-input) {
  flex: 1;
}

.reply-list {
  margin-top: 10px;
  padding-left: 12px;
  border-left: 2px solid #667eea;
}

.reply-item {
  font-size: 13px;
  color: #666;
  padding: 4px 0;
}

.reply-name {
  font-weight: 600;
  color: #667eea;
}

/* ===== 发布区域 ===== */
.publish-area {
  padding-top: 20px;
  border-top: 2px solid #f0f2f5;
}

.publish-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.publish-row :deep(.el-input) {
  flex: 1;
  min-width: 120px;
}

.publish-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .wall-grid {
    grid-template-columns: 1fr;
  }
  .wall-header {
    flex-direction: column;
    align-items: stretch;
  }
  .publish-row {
    flex-direction: column;
  }
  .publish-row :deep(.el-input) {
    width: 100% !important;
  }
}
</style>