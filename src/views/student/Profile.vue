<template>
  <div class="profile-page">
    <!-- Hero 区：渐变背景 + 大头像 + 欢迎 -->
    <div class="hero">
      <div class="hero-bg">
        <div class="hero-circle c1"></div>
        <div class="hero-circle c2"></div>
        <div class="hero-circle c3"></div>
      </div>
      <div class="hero-content">
        <div class="hero-avatar">
          <el-avatar :size="100" :src="profile.avatar || defaultAvatar">
            {{ profile.name?.charAt(0) }}
          </el-avatar>
          <div class="hero-badge">🎓</div>
        </div>
        <div class="hero-info">
          <h1>
            你好，<span class="hero-name">{{ profile.name }}</span>
          </h1>
          <p class="hero-sub">欢迎回到你的个人发展中心 · 今天又是元气满满的一天</p>
          <div class="hero-tags">
            <span class="hero-tag">🏛 {{ profile.college }}</span>
            <span class="hero-tag">📚 {{ profile.major }}</span>
            <span class="hero-tag">👥 {{ profile.className }}</span>
            <span class="hero-tag">📅 {{ profile.batchYear }}级</span>
            <span class="hero-tag highlight">🎓 {{ profile.graduationYear }}届毕业生</span>
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-date">
            <div class="hero-date-num">{{ todayDay }}</div>
            <div class="hero-date-text">
              <div>{{ todayMonth }}月</div>
              <div>{{ todayWeek }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据卡片：4 个，数字滚动 -->
    <div class="stat-grid">
      <div class="stat-card stat-blue" v-for="(item, i) in stats" :key="i" :style="`--delay:${i * 80}ms`">
        <div class="stat-icon-wrap">
          <span class="stat-icon">{{ item.icon }}</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">
            <span class="num">{{ displayValue(i) }}</span>
            <small v-if="item.unit">{{ item.unit }}</small>
          </div>
        </div>
        <div class="stat-decoration"></div>
      </div>
    </div>

    <!-- 双栏：欢迎 + 快速入口 -->
    <div class="content-row">
      <div class="glass-card welcome-card">
        <h3>💌 一封信，致 {{ profile.name }} 同学</h3>
        <p>
          四年时光，从青涩到成熟。这里记录了你的成长足迹，展示了你与同学之间的差距，
          见证了每一个为之拼搏的瞬间。请珍藏这段旅程，继续勇往直前。
        </p>
        <div class="quick-grid">
          <div class="quick-item" @click="$router.push('/student/comparison')" v-for="q in quickLinks" :key="q.path">
            <div class="quick-icon" :style="`background:${q.bg}`">{{ q.icon }}</div>
            <div class="quick-text">
              <div class="quick-title">{{ q.title }}</div>
              <div class="quick-desc">{{ q.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card quote-card">
        <div class="quote-mark">"</div>
        <div class="quote-text">{{ todayQuote.text }}</div>
        <div class="quote-author">—— {{ todayQuote.author }}</div>
        <div class="quote-divider"></div>
        <div class="quote-tip">{{ todayQuote.tip }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getMyProfile } from '@/api/student'

const profile = ref({})
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const displayValues = ref([0, 0, 0, 0])

const stats = computed(() => [
  { icon: '📊', label: '当前 GPA', value: Number(profile.value.currentGpa) || 0, decimals: 2 },
  { icon: '🏆', label: '荣誉奖项', value: Number(profile.value.honorCount) || 0, decimals: 0 },
  { icon: '🥇', label: '竞赛获奖', value: Number(profile.value.competitionCount) || 0, decimals: 0 },
  { icon: '💰', label: '奖学金', value: Number(profile.value.scholarshipCount) || 0, decimals: 0 }
])

function displayValue(i) {
  const item = stats.value[i]
  if (!item) return '0'
  return displayValues.value[i].toFixed(item.decimals)
}

function animateCountUp() {
  stats.value.forEach((item, i) => {
    const from = 0
    const to = item.value
    const duration = 1200
    const start = performance.now()
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      displayValues.value[i] = from + (to - from) * eased
      if (t < 1) requestAnimationFrame(tick)
      else displayValues.value[i] = to
    }
    setTimeout(() => requestAnimationFrame(tick), i * 80)
  })
}

const quickLinks = [
  { path: '/student/comparison', icon: '📈', title: '横向对比', desc: '看清自己的位置', bg: 'linear-gradient(135deg,#0ea5e9,#3b82f6)' },
  { path: '/student/timeline', icon: '⏳', title: '成长轨迹', desc: '四年时光的回忆', bg: 'linear-gradient(135deg,#10b981,#22c55e)' },
  { path: '/student/achievement', icon: '🏆', title: '成就中心', desc: '每一份荣誉都闪耀', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { path: '/student/message', icon: '✉️', title: '母校留言', desc: '给母校留个话', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }
]

// 今日日期
const today = new Date()
const todayDay = today.getDate()
const todayMonth = today.getMonth() + 1
const todayWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]

// 每日一句
const quotes = [
  { text: '愿你以渺小启程，以伟大结束。', author: '毕业寄语', tip: '愿所有美好如期而至' },
  { text: '前路虽远，未来可期。', author: '毕业寄语', tip: '保持热爱，奔赴山海' },
  { text: '少年与爱永不老去，即使披荆斩棘。', author: '电影《燃烧》', tip: '青春不散场' },
  { text: '此去繁花似锦，归来仍是少年。', author: '毕业寄语', tip: '愿历尽千帆，归来仍少年' }
]
const todayQuote = quotes[today.getDate() % quotes.length]

onMounted(async () => {
  const res = await getMyProfile()
  if (res.code === 200) {
    profile.value = res.data
    await nextTick()
    animateCountUp()
  }
})
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ============ Hero ============ */
.hero {
  position: relative;
  border-radius: 24px;
  padding: 32px 36px;
  background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(14, 165, 233, 0.25);
  color: #fff;
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.hero-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: heroFloat 12s ease-in-out infinite;
}
.c1 { width: 300px; height: 300px; background: #a78bfa; top: -100px; right: 10%; }
.c2 { width: 250px; height: 250px; background: #fbbf24; bottom: -100px; left: 5%; animation-delay: 2s; }
.c3 { width: 200px; height: 200px; background: #34d399; top: 30%; left: 40%; animation-delay: 4s; }
@keyframes heroFloat {
  0%, 100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.1); }
}
.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 2;
}
.hero-avatar { position: relative; }
.hero-avatar :deep(.el-avatar) {
  border: 4px solid rgba(255,255,255,0.5);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.hero-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.hero-info { flex: 1; min-width: 0; }
.hero-info h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.hero-name {
  background: linear-gradient(135deg, #fbbf24, #fef3c7);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 32px;
}
.hero-sub {
  margin: 0 0 14px;
  font-size: 14px;
  opacity: 0.9;
}
.hero-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.hero-tag {
  padding: 4px 12px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(8px);
}
.hero-tag.highlight {
  background: rgba(255,255,255,0.9);
  color: #0369a1;
  font-weight: 600;
  border-color: transparent;
}
.hero-side { display: flex; align-items: center; }
.hero-date {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(8px);
}
.hero-date-num { font-size: 36px; font-weight: 800; line-height: 1; }
.hero-date-text {
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
}

/* ============ Stat 卡片 ============ */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  position: relative;
  padding: 22px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: statIn 0.6s ease-out backwards;
  animation-delay: var(--delay, 0ms);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.15);
}
@keyframes statIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(16, 185, 129, 0.15));
}
.stat-blue .stat-icon-wrap { background: linear-gradient(135deg, #dbeafe, #cffafe); }
.stat-green .stat-icon-wrap { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.stat-orange .stat-icon-wrap { background: linear-gradient(135deg, #fed7aa, #fef3c7); }
.stat-red .stat-icon-wrap { background: linear-gradient(135deg, #fecaca, #fed7aa); }
.stat-icon { font-size: 28px; }
.stat-info { flex: 1; min-width: 0; }
.stat-label { color: #64748b; font-size: 13px; font-weight: 500; }
.stat-value {
  font-size: 30px;
  font-weight: 800;
  margin-top: 4px;
  background: linear-gradient(135deg, #0369a1, #047857);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}
.stat-value small { font-size: 14px; color: #94a3b8; font-weight: 500; -webkit-text-fill-color: #94a3b8; }
.stat-decoration {
  position: absolute;
  right: -30px;
  top: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(16, 185, 129, 0.08));
}
.stat-card:nth-child(1) { --c1: #0ea5e9; --c2: #38bdf8; }
.stat-card:nth-child(2) { --c1: #10b981; --c2: #34d399; }
.stat-card:nth-child(3) { --c1: #f59e0b; --c2: #fbbf24; }
.stat-card:nth-child(4) { --c1: #ec4899; --c2: #f472b6; }

/* ============ 双栏 ============ */
.content-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
}
.glass-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.06);
}
.welcome-card h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #0f172a;
}
.welcome-card p {
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 20px;
}
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.quick-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(14, 165, 233, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
}
.quick-item:hover {
  transform: translateX(4px);
  background: rgba(14, 165, 233, 0.05);
  border-color: rgba(14, 165, 233, 0.3);
}
.quick-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.quick-title { font-size: 14px; font-weight: 600; color: #1e293b; }
.quick-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }

/* ============ 寄语卡 ============ */
.quote-card {
  position: relative;
  background: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
  color: #fff;
  border: none;
  overflow: hidden;
}
.quote-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E");
  opacity: 0.4;
}
.quote-mark {
  position: absolute;
  top: 10px;
  left: 20px;
  font-size: 100px;
  font-weight: 800;
  color: rgba(255,255,255,0.2);
  font-family: Georgia, serif;
  line-height: 1;
}
.quote-text {
  position: relative;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  margin: 40px 0 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.quote-author {
  position: relative;
  font-size: 12px;
  opacity: 0.85;
  text-align: right;
}
.quote-divider {
  position: relative;
  height: 1px;
  background: rgba(255,255,255,0.3);
  margin: 20px 0 12px;
}
.quote-tip {
  position: relative;
  font-size: 13px;
  text-align: center;
  opacity: 0.9;
  letter-spacing: 1px;
}

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .content-row { grid-template-columns: 1fr; }
  .hero-content { flex-direction: column; text-align: center; }
  .hero-side { display: none; }
  .hero-tags { justify-content: center; }
}
</style>
