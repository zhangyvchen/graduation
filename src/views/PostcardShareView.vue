<template>
  <div class="postcard-share-page">
    <div class="share-header">
      <span class="logo">🎓</span>
      <span class="title">毕业纪念 · 分享明信片</span>
    </div>

    <div class="share-content" v-if="payload">
      <div class="share-card" :style="{ background: templates[payload.t ?? 0]?.bg || templates[0].bg }">
        <div class="card-overlay">
          <div class="card-badge">🎓 毕业快乐</div>
          <div class="card-avatar">
            <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.n || 'anonymous'}&backgroundColor=b6e3f4`" alt="avatar" />
          </div>
          <div class="card-name">{{ payload.n || '毕业生' }}</div>
          <div class="card-college">{{ payload.c || '某某学院' }}</div>
          <div class="card-year">{{ payload.y || '2024' }}届毕业生</div>

          <div class="card-stats">
            <div class="card-stat-item">
              <span class="card-stat-value">{{ payload.g || '3.8' }}</span>
              <span class="card-stat-label">GPA</span>
            </div>
            <div class="card-stat-divider"></div>
            <div class="card-stat-item">
              <span class="card-stat-value">{{ payload.a || '7' }}</span>
              <span class="card-stat-label">奖项</span>
            </div>
            <div class="card-stat-divider"></div>
            <div class="card-stat-item">
              <span class="card-stat-value">{{ payload.d || '深造' }}</span>
              <span class="card-stat-label">去向</span>
            </div>
          </div>

          <div class="card-motto">"{{ payload.m || '代码有Bug，人生无Bug' }}"</div>
          <div class="card-sign">—— {{ payload.n || '毕业生' }}</div>
        </div>
      </div>

      <div class="share-actions">
        <el-button type="primary" @click="downloadCard">📥 保存明信片</el-button>
        <el-button @click="goHome">🏠 我也生成一张</el-button>
      </div>

      <div class="share-footer">
        <p>💌 来自同学的毕业纪念</p>
        <p class="tip">愿你们前程似锦，未来可期</p>
      </div>
    </div>

    <div v-else class="share-error">
      <div class="error-icon">😢</div>
      <p>明信片链接无效或已损坏</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'

const router = useRouter()
const payload = ref(null)
const cardRef = ref(null)

const templates = [
  { name: '极光紫', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '落日橙', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '海洋蓝', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '森林绿', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: '星空夜', bg: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)' }
]

const parsePayload = () => {
  // 兼容新（?d=）和旧（?data=）两种参数
  const query = router.currentRoute.value.query
  const raw = query.d || query.data
  if (!raw) return null
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(raw))))
    const data = JSON.parse(json)
    // 旧版可能含 img 字段，新版只含数据
    if (data.img) delete data.img
    return data
  } catch (e) {
    console.error('解析分享数据失败', e)
    return null
  }
}

onMounted(() => {
  payload.value = parsePayload()
})

// 用 html2canvas 截屏当前明信片，让接收方也能保存
const downloadCard = async () => {
  try {
    await nextTick()
    const el = document.querySelector('.share-card')
    if (!el) {
      ElMessage.error('明信片元素未找到')
      return
    }
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    })
    const link = document.createElement('a')
    link.download = `毕业明信片_${payload.value?.n || '校友'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('明信片已保存')
  } catch (e) {
    console.error('保存失败', e)
    ElMessage.error('保存失败，请重试')
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.postcard-share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px 16px;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.share-header .logo {
  font-size: 28px;
}

.share-content {
  max-width: 480px;
  margin: 0 auto;
}

.share-card {
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 24px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.card-overlay {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-badge {
  position: absolute;
  top: 32px;
  right: 32px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  padding: 6px 18px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

.card-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.2);
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 6px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-college {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 4px;
}

.card-year {
  font-size: 15px;
  opacity: 0.7;
  margin-bottom: 20px;
}

.card-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.card-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-stat-value {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 2px;
}

.card-stat-label {
  font-size: 11px;
  opacity: 0.7;
  letter-spacing: 0.5px;
}

.card-stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.25);
}

.card-motto {
  font-size: 20px;
  font-style: italic;
  opacity: 0.95;
  margin-bottom: 8px;
  padding: 0 8px;
  font-family: 'Georgia', serif;
  line-height: 1.5;
}

.card-sign {
  font-size: 14px;
  opacity: 0.7;
}

.share-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.share-footer {
  text-align: center;
  margin-top: 32px;
  color: #606266;
  font-size: 14px;
}

.share-footer p {
  margin: 4px 0;
}

.share-footer .tip {
  color: #909399;
  font-size: 13px;
}

.share-error {
  max-width: 360px;
  margin: 80px auto;
  text-align: center;
  color: #606266;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
</style>
