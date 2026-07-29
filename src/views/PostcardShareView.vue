<template>
  <div class="postcard-share-page">
    <div class="share-header">
      <el-icon class="header-icon"><CollectionTag /></el-icon>
      <span class="title">毕业纪念 · 分享明信片</span>
    </div>

    <div class="share-content" v-if="payload">
      <div class="share-card" :style="{ background: templates[payload.t ?? 0]?.bg || templates[0].bg }">
        <div class="card-overlay">
          <div class="card-badge">毕业快乐</div>
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
        <el-button type="primary" @click="downloadCard">
          <el-icon><Download /></el-icon>
          <span>保存明信片</span>
        </el-button>
        <el-button @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          <span>我也生成一张</span>
        </el-button>
      </div>

      <div class="share-footer">
        <p>来自同学的毕业纪念</p>
        <p class="tip">愿你们前程似锦，未来可期</p>
      </div>
    </div>

    <div v-else class="share-error">
      <el-icon class="error-icon"><Warning /></el-icon>
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
  { name: '午夜靛蓝', bg: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)' },
  { name: '琥珀金辉', bg: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)' },
  { name: '深海碧蓝', bg: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)' },
  { name: '森林翠影', bg: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)' },
  { name: '玫瑰余晖', bg: 'linear-gradient(135deg, #881337 0%, #e11d48 100%)' }
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
  background:
    radial-gradient(circle at 12% 18%, rgba(217, 119, 6, 0.08) 0%, transparent 28%),
    radial-gradient(circle at 88% 82%, rgba(79, 70, 229, 0.06) 0%, transparent 28%),
    linear-gradient(180deg, var(--bg) 0%, #f1f5f9 100%);
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
}

.postcard-share-page::before,
.postcard-share-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.postcard-share-page::before {
  width: 280px;
  height: 280px;
  background: rgba(217, 119, 6, 0.08);
  top: -80px;
  right: -60px;
}

.postcard-share-page::after {
  width: 240px;
  height: 240px;
  background: rgba(79, 70, 229, 0.06);
  bottom: -60px;
  left: -40px;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0 24px;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  position: relative;
  z-index: 1;
}

.share-header .header-icon {
  font-size: 26px;
  color: var(--accent);
}

.share-content {
  max-width: 460px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.share-card {
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 24px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  position: relative;
  overflow: hidden;
}

.share-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%);
  pointer-events: none;
}

.card-overlay {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-inverse);
  border: 1px solid rgba(255, 255, 255, 0.22);
  position: relative;
}

.card-badge {
  position: absolute;
  top: 28px;
  right: 28px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  color: var(--text-inverse);
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);
}

.card-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.45);
  overflow: hidden;
  margin-bottom: 18px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-name {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 6px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  letter-spacing: -0.01em;
}

.card-college {
  font-size: 15px;
  opacity: 0.88;
  margin-bottom: 3px;
  font-weight: 500;
}

.card-year {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 22px;
  letter-spacing: 0.5px;
}

.card-stats {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 22px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.card-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
}

.card-stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 2px;
  line-height: 1.2;
}

.card-stat-label {
  font-size: 10px;
  opacity: 0.75;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.card-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.25);
}

.card-motto {
  font-size: 18px;
  font-style: italic;
  opacity: 0.95;
  margin-bottom: 8px;
  padding: 0 8px;
  font-family: 'Georgia', serif;
  line-height: 1.55;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.card-sign {
  font-size: 13px;
  opacity: 0.72;
  letter-spacing: 0.3px;
}

.share-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.share-actions .el-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 20px;
  padding-right: 20px;
}

.share-footer {
  text-align: center;
  margin-top: 28px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.6;
}

.share-footer p {
  margin: 4px 0;
}

.share-footer .tip {
  color: var(--text-3);
  font-size: 13px;
}

.share-error {
  max-width: 360px;
  margin: 80px auto;
  text-align: center;
  color: var(--text-2);
  position: relative;
  z-index: 1;
}

.share-error .error-icon {
  font-size: 56px;
  color: var(--text-3);
  margin-bottom: 14px;
}

.share-error p {
  margin-bottom: 18px;
}

@media (max-width: 480px) {
  .share-card {
    padding: 20px;
  }
  .card-overlay {
    padding: 24px 18px;
  }
  .card-name {
    font-size: 26px;
  }
  .share-actions {
    flex-direction: column;
  }
  .share-actions .el-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

<!-- redesigned 2026-07-28 -->
