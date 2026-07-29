<template>
  <div class="message-wall">
    <!-- 标题 -->
    <div class="wall-header">
      <div class="wall-title-area">
        <div class="wall-title page-title">致母校 · 毕业留言墙</div>
        <el-tag size="small" type="info" round>{{ messages.length }} 条留言</el-tag>
      </div>
      <div class="wall-actions">
        <el-button size="small" @click="goToWriteMessage" type="primary">
          <el-icon><Edit /></el-icon>
          <span>写留言</span>
        </el-button>
        <el-button size="small" @click="refreshMessages" :loading="loading">
          <el-icon><RefreshRight /></el-icon>
          <span>刷新</span>
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && messages.length === 0" description="暂无留言，快来留下第一条毕业感言吧～" />

    <!-- 留言卡片网格 -->
    <div v-else class="wall-grid">
      <div
          v-for="(msg, idx) in messages"
          :key="msg.id"
          class="message-card hover-lift"
          :style="{ animationDelay: (idx * 0.05) + 's' }"
      >
        <div class="card-header">
          <div class="avatar-wrap">
            <div class="avatar-placeholder">{{ avatarLetter(msg.displayName) }}</div>
          </div>
          <div class="card-user">
            <div class="username">{{ msg.displayName }}</div>
            <div class="user-year">{{ msg.studentId ? '学号：' + msg.studentId : '校友' }}</div>
          </div>
          <div class="card-time">{{ formatDate(msg.createdAt) }}</div>
        </div>

        <div class="card-content">{{ msg.content }}</div>

        <div v-if="msg.images && msg.images.length > 0" class="card-images">
          <img v-for="(img, i) in msg.images.slice(0, 3)" :key="i" :src="img" class="msg-img" alt="图片" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, RefreshRight } from '@element-plus/icons-vue'
import { getPublicMessages } from '../api/student'

const router = useRouter()
const messages = ref([])
const loading = ref(false)

const avatarLetter = (name) => {
  if (!name) return '校'
  return name.charAt(0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await getPublicMessages(50)
    if (res && res.code === 200 && res.data) {
      messages.value = res.data
    } else {
      messages.value = []
    }
  } catch (e) {
    console.warn('加载留言失败', e)
    messages.value = []
  } finally {
    loading.value = false
  }
}

const refreshMessages = () => {
  loadMessages()
  ElMessage.success('已刷新')
}

const goToWriteMessage = () => {
  router.push('/student/message')
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.message-wall {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
}

.wall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.wall-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wall-title {
  font-size: 22px;
  margin: 0;
}

.wall-title::before {
  height: 24px;
}

.wall-actions {
  display: flex;
  gap: 8px;
}

.wall-actions .el-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.message-card {
  background: var(--surface);
  border-radius: 16px;
  padding: 18px 20px 16px;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  position: relative;
  animation: flyIn 0.5s ease both;
}

.message-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border);
}

@keyframes flyIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar-wrap {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-placeholder {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.card-user {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: 600;
  color: var(--primary);
  font-size: 14px;
}

.user-year {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

.card-time {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}

.card-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-2);
  word-break: break-word;
  min-height: 40px;
}

.card-images {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.msg-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.msg-img:hover {
  transform: scale(1.05);
}
</style>
