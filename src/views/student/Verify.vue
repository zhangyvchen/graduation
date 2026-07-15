<template>
  <div class="verify-page">
    <div class="page-header">
      <h2>📱 扫码核销 · 毕业周边</h2>
      <p class="subtitle">出示下方二维码给工作人员核销，核销通过后即可领取毕业纪念礼包</p>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：我的二维码 -->
      <el-col :xs="24" :md="12">
        <div class="glass-card qr-card" :class="{ 'is-verified': isVerified }">
          <div class="card-header">
            <span class="title">我的核销二维码</span>
            <span class="status-pill" :class="isVerified ? 'ok' : 'pending'">
              <span class="dot"></span>
              {{ isVerified ? '已核销' : '待核销' }}
            </span>
          </div>

          <div class="qr-content">
            <div class="qr-wrapper" :class="{ 'verified': isVerified }">
              <canvas ref="qrCanvas" class="qr-canvas"></canvas>
              <div v-if="isVerified" class="qr-overlay">
                <div class="check-ring">
                  <span class="check">✓</span>
                </div>
                <div class="overlay-text">核销成功</div>
              </div>
            </div>

            <div class="qr-info">
              <p class="verify-code">{{ verifyCode }}</p>
              <p class="qr-tip">
                <el-icon><InfoFilled /></el-icon>
                请将此二维码出示给现场工作人员
              </p>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">学号</span>
                <span class="info-value">{{ studentInfo.studentId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ studentInfo.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学院</span>
                <span class="info-value">{{ studentInfo.college || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">专业</span>
                <span class="info-value">{{ studentInfo.major || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">班级</span>
                <span class="info-value">{{ studentInfo.className || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">届数</span>
                <span class="info-value highlight">{{ studentInfo.batchYear }}届</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：核销记录 + 周边 -->
      <el-col :xs="24" :md="12">
        <div class="glass-card history-card">
          <div class="card-header">
            <span class="title">核销记录</span>
            <el-button type="primary" size="small" text @click="loadData" :icon="Refresh">刷新</el-button>
          </div>
          <div v-loading="loading.records" class="record-list">
            <div v-if="verifyRecords.length === 0" class="empty">
              <span>📋</span>
              <p>暂无核销记录</p>
            </div>
            <div v-else class="record-items">
              <div v-for="(r, i) in verifyRecords" :key="i" class="record-item" :class="{ 'is-verified': r.verified }">
                <div class="record-icon">{{ r.verified ? '✅' : '⏳' }}</div>
                <div class="record-body">
                  <div class="record-code">{{ r.verificationCode }}</div>
                  <div class="record-time">{{ r.verifiedAt || '尚未核销' }}</div>
                </div>
                <div class="record-tag" :class="r.verified ? 'ok' : 'pending'">
                  {{ r.verified ? '已核销' : '未核销' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周边领取卡 -->
        <div class="glass-card gift-card" :class="{ 'gift-opened': giftReceived }">
          <div class="card-header">
            <span class="title">🎁 毕业周边领取</span>
            <span class="status-pill" :class="giftReceived ? 'ok' : (isVerified ? 'ready' : 'pending')">
              <span class="dot"></span>
              {{ giftReceived ? '已领取' : (isVerified ? '可领取' : '需先核销') }}
            </span>
          </div>

          <div v-if="!isVerified" class="gift-block gift-locked">
            <div class="gift-box locked">🔒</div>
            <h3>请先完成二维码核销</h3>
            <p>核销通过后即可领取专属毕业纪念礼包</p>
          </div>

          <div v-else-if="!giftReceived" class="gift-block gift-ready">
            <div class="gift-box shake" @click="handleReceiveGift">
              <div class="box-lid"></div>
              <div class="box-body">
                <div class="ribbon-v"></div>
                <div class="ribbon-h"></div>
              </div>
            </div>
            <h3>毕业纪念礼包</h3>
            <p class="gift-desc">点击礼盒或下方按钮领取你的专属周边</p>
            <el-button
              type="primary"
              size="large"
              round
              :loading="loading.gift"
              @click="handleReceiveGift"
              class="receive-btn"
            >
              立即领取
            </el-button>
          </div>

          <div v-else class="gift-block gift-success">
            <div class="gift-box opened">🎁</div>
            <h3>恭喜！领取成功</h3>
            <p class="gift-name">{{ giftRecord.giftName || '毕业纪念礼包' }}</p>
            <p class="gift-time">领取时间：{{ formatDateTime(giftRecord.receivedAt) }}</p>
            <div class="success-tip">
              <el-icon><Promotion /></el-icon>
              请凭此页面到指定地点领取实体周边
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 核销成功庆祝彩纸 -->
    <div v-if="showConfetti" class="confetti-layer" @click="showConfetti = false">
      <div v-for="i in 60" :key="i" class="confetti" :style="confettiStyle(i)"></div>
      <div class="confetti-banner">
        <div class="banner-icon">🎉</div>
        <div class="banner-text">核销成功！</div>
        <div class="banner-sub">现在可以去领取毕业纪念礼包了</div>
      </div>
    </div>

    <!-- 领取庆祝礼花 -->
    <div v-if="showFireworks" class="fireworks-layer" @click="showFireworks = false">
      <div class="fireworks-banner">
        <div class="fw-icon">🏆</div>
        <div class="fw-title">领取成功！</div>
        <div class="fw-sub">毕业纪念礼包属于你了</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled, Promotion } from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { getStudentQRCode, getMyVerifyRecords, getGiftStatus, receiveGift } from '@/api/studentVerify'

const qrCanvas = ref(null)
const verifyCode = ref('')
const isVerified = ref(false)
const verifyRecords = ref([])
const giftReceived = ref(false)
const giftRecord = ref({})
const studentInfo = ref({
  studentId: '', name: '', college: '', major: '', className: '', batchYear: ''
})
const loading = ref({ records: false, gift: false })
const showConfetti = ref(false)
const showFireworks = ref(false)

let pollTimer = null

const confettiColors = ['#0ea5e9', '#10b981', '#fbbf24', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b']
function confettiStyle(i) {
  const left = Math.random() * 100
  const delay = Math.random() * 0.4
  const duration = 2 + Math.random() * 2
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)]
  const size = 6 + Math.random() * 8
  const rotate = Math.random() * 360
  return {
    left: `${left}%`,
    background: color,
    width: `${size}px`,
    height: `${size * 0.4}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    transform: `rotate(${rotate}deg)`
  }
}

onMounted(() => {
  initStudentInfo()
  loadData()
  pollTimer = setInterval(() => {
    if (giftReceived.value) {
      clearInterval(pollTimer)
      pollTimer = null
      return
    }
    refreshStatus()
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const initStudentInfo = () => {
  const infoStr = localStorage.getItem('student_info')
  if (infoStr) {
    try {
      const info = JSON.parse(infoStr)
      studentInfo.value = {
        studentId: info.studentId || '',
        name: info.name || '',
        college: info.college || '',
        major: info.major || '',
        className: info.className || '',
        batchYear: info.batchYear || ''
      }
    } catch (e) { console.error(e) }
  }
}

const loadData = async () => {
  await loadQRCode()
  await loadRecords()
  await loadGiftStatus()
}

const refreshStatus = async () => {
  try {
    const [statusRes, recordsRes, giftRes] = await Promise.all([
      getStudentQRCode(),
      getMyVerifyRecords(),
      getGiftStatus()
    ])
    if (statusRes.code === 200 && statusRes.data) {
      const newVerified = statusRes.data.verified || false
      if (newVerified && !isVerified.value) {
        triggerConfetti()
      }
      isVerified.value = newVerified
    }
    if (recordsRes.code === 200 && recordsRes.data) {
      verifyRecords.value = recordsRes.data.map(item => ({
        ...item,
        verifiedAt: item.verifiedAt ? formatDateTime(item.verifiedAt) : '-'
      }))
      if (verifyRecords.value.some(r => r.verified) && !isVerified.value) {
        isVerified.value = true
        triggerConfetti()
      }
    }
    if (giftRes.code === 200 && giftRes.data) {
      giftRecord.value = giftRes.data
      const received = giftRes.data.received === true || giftRes.data.received === 1
      if (received && !giftReceived.value) {
        giftReceived.value = true
        triggerFireworks()
      } else {
        giftReceived.value = received
      }
    }
  } catch (e) {}
}

const loadQRCode = async () => {
  try {
    const res = await getStudentQRCode()
    if (res.code === 200 && res.data) {
      verifyCode.value = res.data.code || ''
      const newVerified = res.data.verified || false
      if (newVerified && !isVerified.value) triggerConfetti()
      isVerified.value = newVerified
      Object.assign(studentInfo.value, {
        studentId: res.data.studentId || studentInfo.value.studentId,
        name: res.data.name || studentInfo.value.name,
        college: res.data.college || studentInfo.value.college,
        major: res.data.major || studentInfo.value.major,
        className: res.data.className || studentInfo.value.className,
        batchYear: res.data.batchYear || studentInfo.value.batchYear
      })
      nextTick(() => generateQRCode())
    }
  } catch (error) {
    const sid = studentInfo.value.studentId
    verifyCode.value = sid ? `VERIFY:${sid}` : `VERIFY:${Date.now()}`
    nextTick(() => generateQRCode())
  }
}

const generateQRCode = async () => {
  if (!qrCanvas.value || !verifyCode.value) return
  try {
    await QRCode.toCanvas(qrCanvas.value, verifyCode.value, {
      width: 200,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
  } catch (error) { console.error(error) }
}

const loadRecords = async () => {
  loading.value.records = true
  try {
    const res = await getMyVerifyRecords()
    if (res.code === 200 && res.data) {
      verifyRecords.value = res.data.map(item => ({
        ...item,
        verifiedAt: item.verifiedAt ? formatDateTime(item.verifiedAt) : '-'
      }))
      if (verifyRecords.value.some(r => r.verified) && !isVerified.value) {
        isVerified.value = true
        triggerConfetti()
      }
    }
  } catch (error) {
    verifyRecords.value = []
  } finally {
    loading.value.records = false
  }
}

const loadGiftStatus = async () => {
  try {
    const res = await getGiftStatus()
    if (res.code === 200 && res.data) {
      giftRecord.value = res.data
      giftReceived.value = res.data.received === true || res.data.received === 1
    }
  } catch (error) {
    giftReceived.value = false
  }
}

const handleReceiveGift = async () => {
  if (!isVerified.value) {
    ElMessage.warning('请先完成核销')
    return
  }
  loading.value.gift = true
  try {
    const res = await receiveGift()
    if (res.code === 200 && res.data) {
      giftRecord.value = res.data
      giftReceived.value = true
      triggerFireworks()
    } else {
      ElMessage.error(res.message || '领取失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '领取失败')
  } finally {
    loading.value.gift = false
  }
}

function triggerConfetti() {
  showConfetti.value = true
  setTimeout(() => { showConfetti.value = false }, 4500)
}
function triggerFireworks() {
  showFireworks.value = true
  setTimeout(() => { showFireworks.value = false }, 3000)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
</script>

<style scoped>
.verify-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #0369a1, #047857);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

/* ============ 通用玻璃卡 ============ */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 22px 24px;
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.06);
  transition: all 0.3s;
}
.glass-card:hover {
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.12);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.1);
}
.card-header .title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}
.status-pill.ok { background: rgba(16, 185, 129, 0.12); color: #059669; }
.status-pill.ready { background: rgba(14, 165, 233, 0.12); color: #0369a1; }
.status-pill.pending { background: rgba(245, 158, 11, 0.12); color: #d97706; }

/* ============ 二维码卡 ============ */
.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.qr-wrapper {
  position: relative;
  display: inline-block;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #0ea5e9, #10b981);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.25);
  transition: all 0.4s;
}
.qr-wrapper.verified {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3);
}
.qr-canvas {
  display: block;
  border-radius: 12px;
  background: #fff;
  padding: 8px;
}
.qr-wrapper.verified .qr-canvas {
  opacity: 0.5;
  filter: blur(1px);
}
.qr-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 20px;
  background: rgba(16, 185, 129, 0.92);
  animation: overlayIn 0.5s ease-out;
}
@keyframes overlayIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
.check-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.check {
  font-size: 48px;
  color: #10b981;
  font-weight: 800;
}
.overlay-text {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.qr-info {
  text-align: center;
  width: 100%;
}
.verify-code {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #0369a1, #047857);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 6px;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}
.qr-tip {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ============ 信息网格 ============ */
.info-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(14, 165, 233, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(14, 165, 233, 0.1);
}
.info-label { font-size: 11px; color: #94a3b8; }
.info-value { font-size: 14px; color: #0f172a; font-weight: 600; }
.info-value.highlight { color: #047857; }

/* ============ 核销记录 ============ */
.record-list { min-height: 80px; }
.empty {
  text-align: center;
  padding: 30px 0;
  color: #94a3b8;
}
.empty span { font-size: 36px; display: block; margin-bottom: 6px; }
.empty p { margin: 0; font-size: 13px; }
.record-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(14, 165, 233, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}
.record-item.is-verified {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.06));
  border-color: rgba(16, 185, 129, 0.2);
}
.record-icon { font-size: 22px; }
.record-body { flex: 1; min-width: 0; }
.record-code {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  font-family: 'Courier New', monospace;
}
.record-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.record-tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.record-tag.ok { background: rgba(16, 185, 129, 0.15); color: #059669; }
.record-tag.pending { background: rgba(245, 158, 11, 0.15); color: #d97706; }

/* ============ 周边卡 ============ */
.gift-card {
  margin-top: 18px;
  position: relative;
}
.gift-block {
  text-align: center;
  padding: 20px 0 10px;
}
.gift-block h3 {
  margin: 16px 0 8px;
  color: #0f172a;
  font-size: 18px;
}
.gift-block p {
  margin: 0 0 14px;
  color: #64748b;
  font-size: 13px;
}

/* 礼盒 */
.gift-box {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  cursor: pointer;
  transition: transform 0.3s;
}
.gift-box.locked { filter: grayscale(0.5); opacity: 0.6; }
.gift-box.shake { animation: shake 2s ease-in-out infinite; }
.gift-box.shake:hover { animation: shake 0.5s ease-in-out infinite; }
.gift-box.opened { animation: bounce 0.6s ease-out; }
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-5deg); }
  40% { transform: rotate(5deg); }
  60% { transform: rotate(-3deg); }
  80% { transform: rotate(3deg); }
}
@keyframes bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.box-lid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  border-radius: 8px 8px 4px 4px;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}
.box-body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(135deg, #f43f5e, #be123c);
  border-radius: 6px;
  z-index: 1;
  box-shadow: 0 8px 20px rgba(190, 18, 60, 0.3);
}
.ribbon-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 14px;
  margin-left: -7px;
  background: linear-gradient(180deg, #fbbf24, #f59e0b);
  z-index: 3;
}
.ribbon-h {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 14px;
  margin-top: -7px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  z-index: 3;
  display: none;
}
.gift-box.shake .box-lid,
.gift-box.shake .ribbon-v {
  animation: lidShake 2s ease-in-out infinite;
}
@keyframes lidShake {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.gift-name {
  font-size: 18px;
  font-weight: 700;
  color: #047857 !important;
  margin-bottom: 6px !important;
}
.gift-time {
  font-size: 12px !important;
  color: #94a3b8 !important;
  margin-bottom: 14px !important;
}
.success-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(14, 165, 233, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  color: #059669;
  font-size: 12px;
}
.receive-btn {
  background: linear-gradient(135deg, #0ea5e9, #10b981) !important;
  border: none !important;
  padding: 12px 32px !important;
  font-weight: 600 !important;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3) !important;
}

/* ============ 庆祝彩纸 ============ */
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  z-index: 9999;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s;
}
.confetti {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confettiFall 3s linear forwards;
}
@keyframes confettiFall {
  0% { top: -20px; opacity: 1; transform: translateY(0) rotate(0); }
  100% { top: 110vh; opacity: 0.8; transform: translateY(0) rotate(720deg); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.confetti-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #10b981, #0ea5e9);
  color: #fff;
  padding: 40px 60px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.4);
  animation: bannerIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes bannerIn {
  0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); }
  100% { transform: translate(-50%, -50%) scale(1) rotate(0); }
}
.banner-icon { font-size: 80px; margin-bottom: 12px; }
.banner-text {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.banner-sub { font-size: 14px; opacity: 0.95; }

/* ============ 领取庆祝 ============ */
.fireworks-layer {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  z-index: 9998;
  cursor: pointer;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2), transparent 70%);
  animation: fadeIn 0.3s;
}
.fireworks-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  color: #fff;
  padding: 40px 60px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(245, 158, 11, 0.4);
  animation: bannerIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fw-icon { font-size: 80px; margin-bottom: 12px; }
.fw-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.fw-sub { font-size: 14px; opacity: 0.95; }
</style>
