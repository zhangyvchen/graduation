<template>
  <div class="home-page fade-in-up">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-pattern"></div>
        <div class="hero-glow glow-1"></div>
        <div class="hero-glow glow-2"></div>
      </div>
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <el-icon><Trophy /></el-icon>
            <span>{{ selectedYear }}届毕业数据报告</span>
          </div>
          <h1 class="hero-title">
            <span class="title-line">数据见证成长</span>
            <span class="title-line accent">时光镌刻青春</span>
          </h1>
          <p class="hero-desc">
            汇聚历届毕业生就业、升学、学习与成长数据，
            以可视化方式呈现青春最真实的模样。
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="scrollToCharts">
              探索数据
              <el-icon class="btn-icon"><ArrowRight /></el-icon>
            </el-button>
            <el-button size="large" @click="goToVerify">
              <el-icon class="btn-icon"><Cellphone /></el-icon>
              毕业生专区
            </el-button>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-stats-ring">
            <div ref="heroRingRef" class="ring-chart"></div>
            <div class="ring-center">
              <div class="ring-value">{{ animatedTotal }}</div>
              <div class="ring-label">毕业生</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心数据卡片 -->
    <section class="stats-section">
      <div class="section-header">
        <h3 class="section-title">核心指标</h3>
        <span class="section-sub">本届毕业生关键数据一览</span>
      </div>
      <div class="stats-grid">
        <div class="stat-card stagger-1" v-loading="loading">
          <div class="stat-decor"></div>
          <div class="stat-icon-wrap" style="--icon-color: #4f46e5; --icon-bg: rgba(79, 70, 229, 0.1);">
            <el-icon class="stat-icon"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedTotal }}</div>
            <div class="stat-label">总毕业生数</div>
          </div>
        </div>

        <div class="stat-card stagger-2" v-loading="loading">
          <div class="stat-decor"></div>
          <div class="stat-icon-wrap" style="--icon-color: #0d9488; --icon-bg: rgba(13, 148, 136, 0.1);">
            <el-icon class="stat-icon"><Briefcase /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedEmployment }}<span class="unit">%</span></div>
            <div class="stat-label">就业率</div>
          </div>
        </div>

        <div class="stat-card stagger-3" v-loading="loading">
          <div class="stat-decor"></div>
          <div class="stat-icon-wrap" style="--icon-color: #d97706; --icon-bg: rgba(217, 119, 6, 0.1);">
            <el-icon class="stat-icon"><Reading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedEnrollment }}<span class="unit">%</span></div>
            <div class="stat-label">升学率</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速导航 -->
    <section class="nav-section">
      <div class="section-header">
        <h3 class="section-title">数据全景</h3>
        <span class="section-sub">点击卡片深入探索</span>
      </div>
      <div class="nav-grid">
        <div class="nav-card nav-growth" @click="goToPage('growth')">
          <div class="nav-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="nav-info">
            <h4>成长轨迹</h4>
            <p>学业成绩 · 能力发展 · 综合素养</p>
          </div>
          <div class="nav-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nav-bg-pattern"></div>
        </div>

        <div class="nav-card nav-dest" @click="goToPage('destination')">
          <div class="nav-icon">
            <el-icon><Location /></el-icon>
          </div>
          <div class="nav-info">
            <h4>去向地图</h4>
            <p>就业城市 · 行业分布 · 薪资水平</p>
          </div>
          <div class="nav-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nav-bg-pattern"></div>
        </div>

        <div class="nav-card nav-profile" @click="goToPage('profile')">
          <div class="nav-icon">
            <el-icon><Avatar /></el-icon>
          </div>
          <div class="nav-info">
            <h4>学习画像</h4>
            <p>成绩分析 · 借阅统计 · 能力雷达</p>
          </div>
          <div class="nav-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nav-bg-pattern"></div>
        </div>

        <div class="nav-card nav-grad" @click="goToPage('graduation')">
          <div class="nav-icon">
            <el-icon><Present /></el-icon>
          </div>
          <div class="nav-info">
            <h4>毕业纪念</h4>
            <p>寄语留言 · 明信片 · 时光印记</p>
          </div>
          <div class="nav-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
          <div class="nav-bg-pattern"></div>
        </div>
      </div>
    </section>

    <!-- 数据可视化区域 -->
    <section class="charts-section" ref="chartsSection">
      <div class="section-header">
        <h3 class="section-title">数据洞察</h3>
        <div class="section-tools">
          <el-select v-model="selectedYear" size="default" @change="onYearChange">
            <el-option v-for="year in years" :key="year" :label="year + '届'" :value="year" />
          </el-select>
          <el-button type="primary" @click="refreshData" :loading="loading" circle>
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="charts-grid">
        <!-- 毕业去向 - 玫瑰图 -->
        <div class="chart-card stagger-1" v-loading="loading">
          <div class="chart-header">
            <span class="chart-title">毕业去向分布</span>
            <span class="chart-tag tag-indigo">玫瑰图</span>
          </div>
          <div ref="pieChartRef" class="chart-box"></div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="dot" style="background: #4f46e5;"></span>
              <span>就业 {{ overview.employmentRate || 0 }}%</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #0d9488;"></span>
              <span>升学 {{ overview.enrollmentRate || 0 }}%</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background: #d97706;"></span>
              <span>其他 {{ Math.max(0, 100 - (overview.employmentRate||0) - (overview.enrollmentRate||0)) }}%</span>
            </div>
          </div>
        </div>

        <!-- 历年趋势 - 面积图 -->
        <div class="chart-card stagger-2" v-loading="loading">
          <div class="chart-header">
            <span class="chart-title">历年趋势对比</span>
            <span class="chart-tag tag-teal">面积图</span>
          </div>
          <div ref="trendChartRef" class="chart-box"></div>
        </div>
      </div>
    </section>

    <!-- 毕业生专区入口 -->
    <section class="cta-section">
      <div class="cta-card">
        <div class="cta-content">
          <div class="cta-icon">
            <el-icon><MagicStick /></el-icon>
          </div>
          <div class="cta-text">
            <h3>生成你的专属毕业报告</h3>
            <p>登录后查看个人数据分析、生成定制明信片，留下独一无二的青春印记</p>
          </div>
          <el-button type="primary" size="large" @click="goToVerify">
            立即体验
            <el-icon class="btn-icon"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="cta-decoration">
          <div class="cta-circle c1"></div>
          <div class="cta-circle c2"></div>
          <div class="cta-circle c3"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { getOverview } from '../api/graduationData'
import { getGrowthYears } from '../api/growth'
import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import {
  Trophy, ArrowRight, Cellphone, User, Briefcase, Reading,
  TrendCharts, Location, Avatar, Present, RefreshRight, MagicStick
} from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuth()

const selectedYear = ref(null)
const years = ref([])
const loading = ref(false)

const pieChartRef = ref(null)
const trendChartRef = ref(null)
const heroRingRef = ref(null)
const chartsSection = ref(null)

let pieChart = null
let trendChart = null
let heroRingChart = null
let animationFrame = null

// 数字滚动动画
const animatedTotal = ref(0)
const animatedEmployment = ref(0)
const animatedEnrollment = ref(0)

const overview = ref({
  totalGraduates: 0,
  employmentRate: 0,
  enrollmentRate: 0
})
const allYearData = ref([])
let isMounted = false

const hasOverviewData = computed(() => {
  const d = overview.value
  return d.totalGraduates > 0 || d.employmentRate > 0 || d.enrollmentRate > 0
})

const animateNumber = (target, current, duration = 1500) => {
  const start = performance.now()
  const startValue = current.value
  const animate = (now) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    current.value = Math.round(startValue + (target - startValue) * easeOut)
    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate)
    }
  }
  animationFrame = requestAnimationFrame(animate)
}

const loadYears = async () => {
  try {
    const res = await getGrowthYears()
    if (isMounted && res.code === 200 && res.data && res.data.length > 0) {
      years.value = res.data
      selectedYear.value = res.data[0]
    }
  } catch (e) {
    console.warn('获取年份列表失败', e)
  }
}

const loadOverview = async () => {
  if (!selectedYear.value) return
  loading.value = true
  try {
    const res = await getOverview(selectedYear.value)
    if (isMounted && res.code === 200 && res.data) {
      overview.value = res.data
      nextTick(() => {
        animateNumber(res.data.totalGraduates || 0, animatedTotal)
        animateNumber(res.data.employmentRate || 0, animatedEmployment)
        animateNumber(res.data.enrollmentRate || 0, animatedEnrollment)
      })
    }
  } finally {
    loading.value = false
  }
}

const loadAllYears = async () => {
  const data = []
  for (const year of years.value) {
    const res = await getOverview(year)
    if (isMounted && res.code === 200 && res.data) data.push(res.data)
  }
  allYearData.value = data
}

const onYearChange = async () => {
  await loadOverview()
  updatePieChart()
  updateHeroRing()
}

const refreshData = async () => {
  await loadOverview()
  await loadAllYears()
  nextTick(() => {
    updatePieChart()
    updateTrendChart()
    updateHeroRing()
  })
}

const initCharts = () => {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    updatePieChart()
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }
  if (heroRingRef.value) {
    heroRingChart = echarts.init(heroRingRef.value)
    updateHeroRing()
  }
}

const updateHeroRing = () => {
  if (!heroRingChart) return
  const emp = overview.value.employmentRate || 0
  const enr = overview.value.enrollmentRate || 0
  heroRingChart.setOption({
    series: [{
      type: 'pie',
      radius: ['70%', '85%'],
      center: ['50%', '50%'],
      silent: true,
      label: { show: false },
      data: [
        { value: emp, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#4f46e5' },
          { offset: 1, color: '#818cf8' }
        ]) } },
        { value: enr, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: '#0d9488' },
          { offset: 1, color: '#2dd4bf' }
        ]) } },
        { value: Math.max(0, 100 - emp - enr), itemStyle: { color: '#e2e8f0' } }
      ]
    }]
  })
}

const updatePieChart = () => {
  if (!pieChart) return
  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['30%', '75%'],
      center: ['50%', '50%'],
      roseType: 'radius',
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}%',
        color: '#334155',
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 18
      },
      labelLine: {
        length: 15,
        length2: 20,
        smooth: true
      },
      data: [
        { value: overview.value.employmentRate || 0, name: '就业率',
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#4f46e5' }
          ]) } },
        { value: overview.value.enrollmentRate || 0, name: '升学率',
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#14b8a6' },
            { offset: 1, color: '#0d9488' }
          ]) } },
        { value: Math.max(0, 100 - (overview.value.employmentRate||0) - (overview.value.enrollmentRate||0)), name: '其他',
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#fbbf24' },
            { offset: 1, color: '#d97706' }
          ]) } }
      ]
    }]
  }, true)
}

const updateTrendChart = () => {
  if (!trendChart || allYearData.value.length === 0) return
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['就业率', '升学率'],
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allYearData.value.map(d => d.year + '届'),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [
      {
        name: '就业率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: allYearData.value.map(d => d.employmentRate||0),
        lineStyle: { color: '#4f46e5', width: 3 },
        itemStyle: { color: '#4f46e5', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 70, 229, 0.25)' },
            { offset: 1, color: 'rgba(79, 70, 229, 0.02)' }
          ])
        }
      },
      {
        name: '升学率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: allYearData.value.map(d => d.enrollmentRate||0),
        lineStyle: { color: '#0d9488', width: 3 },
        itemStyle: { color: '#0d9488', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(13, 148, 136, 0.25)' },
            { offset: 1, color: 'rgba(13, 148, 136, 0.02)' }
          ])
        }
      }
    ]
  }, true)
}

const goToVerify = () => {
  if (auth.state.isLoggedIn && auth.state.role?.toUpperCase() === 'STUDENT') {
    router.push('/student/verify')
  } else {
    router.push('/login?redirect=/student/verify')
  }
}

const goToPage = (page) => {
  const routes = {
    growth: '/growth',
    destination: '/destination',
    profile: '/learning',
    graduation: '/ending'
  }
  router.push(routes[page] || '/')
}

const scrollToCharts = () => {
  chartsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const handleResize = () => {
  pieChart?.resize()
  trendChart?.resize()
  heroRingChart?.resize()
}

onMounted(async () => {
  isMounted = true
  await loadYears()
  await loadOverview()
  await loadAllYears()
  nextTick(() => initCharts())
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  isMounted = false
  window.removeEventListener('resize', handleResize)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  ;[pieChart, trendChart, heroRingChart].forEach(c => c?.dispose())
})
</script>

<style scoped>
.home-page {
  padding: 0;
}

/* ===== Hero 区域 ===== */
.hero-section {
  position: relative;
  padding: 60px 40px 80px;
  overflow: hidden;
  margin: -24px -24px 32px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  z-index: 0;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(217, 119, 6, 0.12) 0%, transparent 50%),
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 8s ease-in-out infinite;
}

.glow-1 {
  width: 300px;
  height: 300px;
  background: #4f46e5;
  top: -100px;
  right: 10%;
}

.glow-2 {
  width: 250px;
  height: 250px;
  background: #d97706;
  bottom: -80px;
  left: 15%;
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.1); }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 60px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: 999px;
  color: #fbbf24;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 20px;
  color: #fff;
}

.title-line {
  display: block;
}

.title-line.accent {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 16px;
  line-height: 1.8;
  color: #94a3b8;
  margin: 0 0 32px;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.hero-actions :deep(.el-button) {
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  height: auto;
}

.btn-icon {
  margin-left: 4px;
}

.hero-right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-stats-ring {
  position: relative;
  width: 280px;
  height: 280px;
}

.ring-chart {
  width: 100%;
  height: 100%;
}

.ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-value {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin-bottom: 8px;
}

.ring-label {
  font-size: 14px;
  color: #94a3b8;
}

/* ===== Section 通用 ===== */
.stats-section,
.nav-section,
.charts-section,
.cta-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 4px;
}

.section-sub {
  font-size: 13px;
  color: var(--text-3);
}

.section-tools {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-tools :deep(.el-select) {
  width: 140px;
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  position: relative;
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.stat-decor {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: var(--icon-bg, rgba(79, 70, 229, 0.05));
  border-radius: 0 16px 0 100%;
}

.stat-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-bg);
  color: var(--icon-color);
  font-size: 28px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.1;
  margin-bottom: 6px;
}

.stat-value .unit {
  font-size: 20px;
  font-weight: 600;
  margin-left: 2px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-3);
  margin-bottom: 12px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
}

.stat-trend.up {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-trend.down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* ===== 快速导航 ===== */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.nav-card {
  position: relative;
  padding: 24px;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
  color: #fff;
}

.nav-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.nav-growth { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }
.nav-dest { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); }
.nav-profile { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); }
.nav-grad { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); }

.nav-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.nav-info h4 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
}

.nav-info p {
  font-size: 13px;
  opacity: 0.85;
  margin: 0;
  line-height: 1.5;
}

.nav-arrow {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-fast), background var(--duration-fast);
}

.nav-card:hover .nav-arrow {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.3);
}

.nav-bg-pattern {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

/* ===== 图表区域 ===== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast);
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.chart-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.tag-indigo { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
.tag-teal { background: rgba(13, 148, 136, 0.1); color: #0d9488; }

.chart-box {
  height: 300px;
  width: 100%;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.legend-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* ===== CTA 区域 ===== */
.cta-card {
  position: relative;
  padding: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
}

.cta-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24px;
}

.cta-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  flex-shrink: 0;
}

.cta-text {
  flex: 1;
  color: #fff;
}

.cta-text h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
}

.cta-text p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.cta-card :deep(.el-button) {
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  height: auto;
  flex-shrink: 0;
}

.cta-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cta-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.cta-circle.c1 {
  width: 300px;
  height: 300px;
  background: #4f46e5;
  top: -150px;
  right: -50px;
}

.cta-circle.c2 {
  width: 200px;
  height: 200px;
  background: #d97706;
  bottom: -100px;
  left: 30%;
}

.cta-circle.c3 {
  width: 150px;
  height: 150px;
  background: #0d9488;
  top: 50%;
  right: 20%;
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
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }

  .hero-badge {
    justify-content: center;
    margin: 0 auto 24px;
  }

  .hero-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .stats-grid,
  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .cta-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 40px 20px 60px;
    margin: -24px -16px 24px;
  }

  .hero-title {
    font-size: 32px;
  }

  .stats-grid,
  .nav-grid {
    grid-template-columns: 1fr;
  }

  .hero-stats-ring {
    width: 220px;
    height: 220px;
  }

  .ring-value {
    font-size: 32px;
  }

  .cta-card {
    padding: 28px 20px;
  }
}
</style>
