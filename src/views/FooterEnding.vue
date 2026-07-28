<template>
  <div class="graduation-page fade-in-up">
    <!-- Hero 区域 -->
    <section class="grad-hero">
      <div class="hero-bg-layer">
        <div class="confetti" v-for="i in 20" :key="i" :style="getConfettiStyle(i)"></div>
      </div>
      <div class="hero-content">
        <div class="hero-inner">
          <div class="hero-badge">
            <el-icon><Star /></el-icon>
            <span>{{ currentYear }}届 · 青春不散场</span>
          </div>
          <h1 class="hero-title">
            <span class="grad-text">毕</span>
            <span class="grad-text">业</span>
            <span class="grad-text">快</span>
            <span class="grad-text">乐</span>
          </h1>
          <p class="hero-desc">愿你出走半生，归来仍是少年</p>
          <div class="countdown-row">
            <div class="countdown-item">
              <div class="countdown-value">{{ daysSinceGraduation > 0 ? daysSinceGraduation : daysUntilGraduation }}</div>
              <div class="countdown-label">{{ daysSinceGraduation > 0 ? '毕业天数' : '距离毕业' }}</div>
            </div>
            <div class="countdown-divider"></div>
            <div class="countdown-item">
              <div class="countdown-value">{{ totalMessages }}</div>
              <div class="countdown-label">毕业寄语</div>
            </div>
            <div class="countdown-divider"></div>
            <div class="countdown-item">
              <div class="countdown-value">{{ currentYear }}</div>
              <div class="countdown-label">毕业年份</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 寄语卡片 - 3D翻转效果 -->
    <section class="wishes-section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><EditPen /></el-icon>
          青春寄语
        </h3>
        <span class="section-sub">点击卡片翻转查看</span>
      </div>
      <div class="wishes-grid">
        <div
          v-for="(wish, index) in wishes"
          :key="index"
          class="wish-card-wrap stagger-1"
          :class="'stagger-' + ((index % 4) + 1)"
          @click="flipCard(index)"
        >
          <div class="wish-card" :class="{ flipped: flippedCards[index] }">
            <div class="wish-front" :style="{ background: wish.frontBg }">
              <div class="wish-icon">
                <el-icon><component :is="wish.icon" /></el-icon>
              </div>
              <div class="wish-label">{{ wish.label }}</div>
              <div class="wish-hint">
                <el-icon><RefreshRight /></el-icon>
                点击翻转
              </div>
            </div>
            <div class="wish-back" :style="{ background: wish.backBg }">
              <div class="wish-quote">"</div>
              <p class="wish-content">{{ wish.content }}</p>
              <div class="wish-author">{{ wish.author }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 时光胶囊 -->
    <section class="capsule-section">
      <div class="capsule-card">
        <div class="capsule-left">
          <div class="capsule-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="capsule-info">
            <h3>时光胶囊</h3>
            <p>给未来的自己写一封信，约定下一次重聚的时刻</p>
            <div class="capsule-stats">
              <div class="capsule-stat">
                <div class="stat-num">365</div>
                <div class="stat-text">天后开启</div>
              </div>
              <div class="capsule-stat">
                <div class="stat-num">1,024</div>
                <div class="stat-text">封存量</div>
              </div>
            </div>
          </div>
        </div>
        <div class="capsule-right">
          <el-button type="primary" size="large" @click="showCapsuleModal = true">
            <el-icon><DocumentAdd /></el-icon>
            写一封信
          </el-button>
        </div>
        <div class="capsule-decor">
          <div class="capsule-ring r1"></div>
          <div class="capsule-ring r2"></div>
          <div class="capsule-ring r3"></div>
        </div>
      </div>
    </section>

    <!-- 留言墙 -->
    <MessageWall ref="messageWallRef" />

    <!-- 明信片生成器 -->
    <PostcardGenerator />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import MessageWall from '../components/MessageWall.vue'
import PostcardGenerator from '../components/PostcardGenerator.vue'
import {
  Star, EditPen, RefreshRight, Clock, DocumentAdd,
  Trophy, User, Reading, Briefcase, School, Sunny, Moon, Medal
} from '@element-plus/icons-vue'

const messageWallRef = ref(null)
const currentYear = new Date().getFullYear()
const flippedCards = reactive({})
const showCapsuleModal = ref(false)

const totalMessages = computed(() => {
  try {
    const saved = localStorage.getItem('graduation_messages')
    if (saved) return JSON.parse(saved).length
  } catch (e) {}
  return 4
})

const daysSinceGraduation = computed(() => {
  const graduationDate = new Date(currentYear, 5, 20)
  const now = new Date()
  const diff = now - graduationDate
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

const daysUntilGraduation = computed(() => {
  const graduationDate = new Date(currentYear, 5, 20)
  const now = new Date()
  const diff = graduationDate - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const wishes = [
  {
    icon: 'Trophy',
    label: '院长寄语',
    frontBg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    backBg: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
    content: '愿你们以梦为马，不负韶华。在未来的道路上，保持学习的热情，坚守初心的力量，成为社会的栋梁之才。',
    author: '—— 院长'
  },
  {
    icon: 'User',
    label: '校友寄语',
    frontBg: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    backBg: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
    content: '毕业不是终点，而是新的起点。感谢母校的培养，愿学弟学妹们在更广阔的天地中绽放光彩。',
    author: '—— 校友代表'
  },
  {
    icon: 'Reading',
    label: '教师寄语',
    frontBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    backBg: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    content: '你们是我教过最棒的一届学生！带着知识和勇气出发吧，无论走多远，母校永远是你们的港湾。',
    author: '—— 毕业班班主任'
  },
  {
    icon: 'Medal',
    label: '同窗寄语',
    frontBg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    backBg: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)',
    content: '四年同窗，一生挚友。愿我们在各自的领域闪闪发光，山顶相见时，还是少年模样。',
    author: '—— 全体毕业生'
  },
  {
    icon: 'Sunny',
    label: '未来展望',
    frontBg: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
    backBg: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
    content: '愿每一位毕业生都能在时代的浪潮中找准方向，用智慧和汗水书写属于自己的精彩篇章。',
    author: '—— 致未来'
  },
  {
    icon: 'School',
    label: '母校嘱托',
    frontBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    backBg: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    content: '常回家看看。母校的大门永远为你们敞开，愿你们带着母校的荣光，一路向前，前程似锦。',
    author: '—— 母校'
  },
  {
    icon: 'Briefcase',
    label: '职场建议',
    frontBg: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
    backBg: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
    content: '保持好奇，持续学习。职场是新的课堂，每一次挑战都是成长的机会。相信自己，你比想象中更强大。',
    author: '—— 就业指导中心'
  },
  {
    icon: 'Moon',
    label: '深夜感悟',
    frontBg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    backBg: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
    content: '那些熬过的夜、刷过的题、跑过的操场，都会变成你人生路上的光。青春没有白走的路，每一步都算数。',
    author: '—— 深夜图书馆'
  }
]

const flipCard = (index) => {
  flippedCards[index] = !flippedCards[index]
}

const getConfettiStyle = (i) => {
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 4 + Math.random() * 4
  const size = 6 + Math.random() * 8
  const colors = ['#4f46e5', '#0d9488', '#d97706', '#e11d48', '#0284c7']
  const color = colors[i % colors.length]
  return {
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    width: size + 'px',
    height: size + 'px',
    background: color
  }
}

onMounted(() => {
})
</script>

<style scoped>
.graduation-page {
  padding: 0;
}

/* ===== Hero ===== */
.grad-hero {
  position: relative;
  padding: 80px 40px;
  overflow: hidden;
  margin: -24px -24px 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.hero-bg-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  opacity: 0.6;
  animation: confettiFall linear infinite;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(600px) rotate(720deg);
    opacity: 0;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 999px;
  color: #fbbf24;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 28px;
}

.hero-title {
  font-size: 72px;
  font-weight: 900;
  margin: 0 0 20px;
  letter-spacing: 8px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.grad-text {
  display: inline-block;
  background: linear-gradient(180deg, #fff 0%, #fbbf24 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: bounceIn 0.8s ease backwards;
}

.grad-text:nth-child(1) { animation-delay: 0.1s; }
.grad-text:nth-child(2) { animation-delay: 0.2s; }
.grad-text:nth-child(3) { animation-delay: 0.3s; }
.grad-text:nth-child(4) { animation-delay: 0.4s; }

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translateY(-40px) scale(0.6);
  }
  60% {
    transform: translateY(10px) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hero-desc {
  font-size: 20px;
  color: #94a3b8;
  margin: 0 0 40px;
  font-style: italic;
}

.countdown-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.countdown-item {
  text-align: center;
}

.countdown-value {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  margin-bottom: 6px;
}

.countdown-label {
  font-size: 13px;
  color: #94a3b8;
}

.countdown-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, #475569, transparent);
}

/* ===== Section 通用 ===== */
.wishes-section,
.capsule-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.section-sub {
  font-size: 13px;
  color: var(--text-3);
}

/* ===== 寄语卡片 - 3D翻转 ===== */
.wishes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.wish-card-wrap {
  perspective: 1000px;
  cursor: pointer;
}

.wish-card {
  position: relative;
  width: 100%;
  height: 220px;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.wish-card.flipped {
  transform: rotateY(180deg);
}

.wish-front,
.wish-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.wish-front {
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.wish-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  backdrop-filter: blur(10px);
}

.wish-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.wish-hint {
  position: absolute;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.7;
}

.wish-back {
  transform: rotateY(180deg);
  justify-content: center;
}

.wish-quote {
  font-size: 48px;
  font-family: Georgia, serif;
  line-height: 1;
  opacity: 0.3;
  margin-bottom: 8px;
}

.wish-content {
  font-size: 14px;
  line-height: 1.8;
  margin: 0 0 16px;
  flex: 1;
  display: flex;
  align-items: center;
}

.wish-author {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.85;
  text-align: right;
}

/* ===== 时光胶囊 ===== */
.capsule-card {
  position: relative;
  padding: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.capsule-left {
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 1;
}

.capsule-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36px;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
}

.capsule-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.capsule-info p {
  font-size: 14px;
  color: #a5b4fc;
  margin: 0 0 16px;
}

.capsule-stats {
  display: flex;
  gap: 32px;
}

.capsule-stat {
  text-align: center;
}

.capsule-stat .stat-num {
  font-size: 24px;
  font-weight: 800;
  color: #fbbf24;
  line-height: 1.2;
}

.capsule-stat .stat-text {
  font-size: 12px;
  color: #a5b4fc;
  margin-top: 2px;
}

.capsule-right {
  z-index: 1;
  flex-shrink: 0;
}

.capsule-right :deep(.el-button) {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 14px;
  height: auto;
}

.capsule-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.capsule-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.capsule-ring.r1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: 10%;
}

.capsule-ring.r2 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: 5%;
}

.capsule-ring.r3 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: 0;
}

/* ===== 动效 ===== */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }

.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.7s var(--ease-out) forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .wishes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .capsule-card {
    flex-direction: column;
    text-align: center;
  }

  .capsule-left {
    flex-direction: column;
  }

  .capsule-stats {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .grad-hero {
    padding: 50px 20px;
    margin: -24px -16px 32px;
  }

  .hero-title {
    font-size: 42px;
    letter-spacing: 4px;
    gap: 6px;
  }

  .countdown-row {
    gap: 20px;
  }

  .countdown-value {
    font-size: 28px;
  }

  .wishes-grid {
    grid-template-columns: 1fr;
  }

  .wish-card {
    height: 200px;
  }

  .capsule-card {
    padding: 28px 20px;
  }

  .capsule-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }

  .capsule-info h3 {
    font-size: 20px;
  }
}
</style>
