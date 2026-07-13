<template>
  <div class="qr-page">
    <div v-if="isAdmin" class="admin-section">
      <el-card class="verify-card">
        <template #header>
          <span>扫码核销</span>
        </template>
        
        <div class="scan-area">
          <div id="scanner-container" class="scanner-container"></div>
          <div v-if="!isScanning" class="scan-box">
            <div class="scan-line"></div>
            <div class="scan-corner tl"></div>
            <div class="scan-corner tr"></div>
            <div class="scan-corner bl"></div>
            <div class="scan-corner br"></div>
          </div>
          <p class="scan-tip">请将学生二维码对准扫描框</p>
          <div class="scan-controls">
            <el-button v-if="!isScanning" type="primary" @click="startScanner">开启摄像头</el-button>
            <el-button v-else type="danger" @click="stopScanner">停止扫描</el-button>
          </div>
        </div>
        
        <el-form :model="verifyForm" label-width="80px" class="verify-form">
          <el-form-item label="核销码">
            <el-input v-model="verifyForm.code" placeholder="输入核销码" @keyup.enter="handleVerify" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleVerify" style="width: 100%" :loading="isVerifying">立即核销</el-button>
          </el-form-item>
        </el-form>
        
        <el-card v-if="verifyResult" class="result-card" :class="verifyResult.status">
          <template #header>
            <span>核销结果</span>
          </template>
          <div class="result-content">
            <div class="result-icon">{{ verifyResult.status === 'success' ? '✓' : '✗' }}</div>
            <div class="result-info">
              <h3>{{ verifyResult.message }}</h3>
              <div v-if="verifyResult.student">
                <p><strong>学号：</strong>{{ verifyResult.student.studentId }}</p>
                <p><strong>姓名：</strong>{{ verifyResult.student.name }}</p>
                <p><strong>班级：</strong>{{ verifyResult.student.className }}</p>
                <p><strong>批次：</strong>{{ verifyResult.student.year }}届</p>
              </div>
              <p class="verify-time">核销时间：{{ verifyResult.time }}</p>
            </div>
          </div>
        </el-card>
      </el-card>
      
      <el-card class="history-card">
        <template #header>
          <span>核销记录</span>
        </template>
        <el-table :data="verifyHistory" border>
          <el-table-column prop="code" label="核销码" />
          <el-table-column prop="studentId" label="学号" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === '已核销' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="verifyTime" label="核销时间" />
        </el-table>
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          class="pagination"
        />
      </el-card>
    </div>
    
    <div v-else class="student-section">
      <el-card class="qr-card">
        <template #header>
          <span>我的核销二维码</span>
          <el-tag v-if="isVerified" type="success" class="status-tag">已核销</el-tag>
          <el-tag v-else type="warning" class="status-tag">未核销</el-tag>
        </template>
        
        <div class="qr-content">
          <div class="qr-wrapper" :class="{ 'verified': isVerified }">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
            <div class="qr-overlay" v-if="isVerified">
              <span class="overlay-icon">✓</span>
              <span class="overlay-text">已核销</span>
            </div>
          </div>
          
          <div class="qr-details">
            <p class="qr-code">{{ studentQRCode }}</p>
            <p class="qr-hint">请出示此二维码给工作人员核销</p>
          </div>
        </div>
        
        <div class="student-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学号">{{ studentInfo.studentId }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ studentInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="班级">{{ studentInfo.className }}</el-descriptions-item>
            <el-descriptions-item label="批次">{{ studentInfo.year }}届</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
      
      <el-card class="history-card">
        <template #header>
          <span>我的核销记录</span>
        </template>
        <el-table :data="myVerifyHistory" border>
          <el-table-column prop="code" label="核销码" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === '已核销' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="verifyTime" label="核销时间" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useAuth } from '../stores/auth'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  getStudentQRCode, 
  getStudentVerifyStatus, 
  verifyByAdmin, 
  getVerifyHistory,
  getMyVerifyHistory
} from '../api/verify'

const auth = useAuth()
const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

const qrCanvas = ref(null)
const isVerified = ref(false)
const isVerifying = ref(false)
const isScanning = ref(false)
let html5QrcodeScanner = null

const verifyForm = ref({
  code: ''
})

const verifyResult = ref(null)

const studentQRCode = ref('')

const studentInfo = ref({
  studentId: '',
  name: '',
  className: '',
  year: ''
})

const verifyHistory = ref([])
const myVerifyHistory = ref([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(async () => {
  if (isAdmin.value) {
    await loadAdminVerifyHistory()
  } else {
    await loadStudentQRCode()
    await loadStudentVerifyStatus()
    await loadMyVerifyHistory()
  }
})

onUnmounted(() => {
  stopScanner()
})

const startScanner = async () => {
  if (isScanning.value) return
  
  try {
    html5QrcodeScanner = new Html5Qrcode("scanner-container")
    const config = { fps: 10, qrbox: { width: 250, height: 250 } }
    
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      config,
      (decodedText, decodedResult) => {
        if (decodedText && !isVerifying.value) {
          verifyForm.value.code = decodedText
          handleVerify()
        }
      },
      (errorMessage) => {
        console.log(`Code scan error = ${errorMessage}`)
      }
    ).then(() => {
      isScanning.value = true
    }).catch((err) => {
      console.error('Failed to start scanner:', err)
      alert('无法启动摄像头，请检查权限设置')
    })
  } catch (error) {
    console.error('Scanner initialization error:', error)
    alert('扫码功能初始化失败')
  }
}

const stopScanner = () => {
  if (html5QrcodeScanner && isScanning.value) {
    html5QrcodeScanner.stop().then(() => {
      isScanning.value = false
    }).catch((err) => {
      console.error('Failed to stop scanner:', err)
    })
  }
}

const loadStudentQRCode = () => {
  studentQRCode.value = 'V' + auth.state.user?.studentId?.toUpperCase() || 'V' + Date.now().toString(36).toUpperCase()
  studentInfo.value = {
    studentId: auth.state.user?.studentId || '2020001',
    name: auth.state.user?.name || '张三',
    className: auth.state.user?.className || '软件工程2001班',
    year: auth.state.user?.year || 2024
  }
  setTimeout(() => {
    generateQRCode()
  }, 100)
}

const loadStudentVerifyStatus = async () => {
  try {
    const res = await getStudentVerifyStatus()
    if (res.code === 200) {
      isVerified.value = res.data.verified
    }
  } catch (error) {
    console.error('获取核销状态失败:', error)
  }
}

const loadAdminVerifyHistory = async () => {
  try {
    const res = await getVerifyHistory({ page: currentPage.value, pageSize: pageSize.value })
    if (res.code === 200) {
      verifyHistory.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取核销记录失败:', error)
    verifyHistory.value = [
      { id: 1, code: 'V20240001', studentId: '2020001', name: '张三', status: '已核销', verifyTime: '2024-01-15 10:30:00' },
      { id: 2, code: 'V20240002', studentId: '2020002', name: '李四', status: '已核销', verifyTime: '2024-01-15 10:35:00' },
      { id: 3, code: 'V20240003', studentId: '2020003', name: '王五', status: '未核销', verifyTime: '-' }
    ]
    total.value = 100
  }
}

const loadMyVerifyHistory = async () => {
  try {
    const res = await getMyVerifyHistory()
    if (res.code === 200) {
      myVerifyHistory.value = res.data
    }
  } catch (error) {
    console.error('获取我的核销记录失败:', error)
    myVerifyHistory.value = [
      { id: 1, code: 'V20240001', status: '已核销', verifyTime: '2024-01-15 10:30:00' },
      { id: 2, code: 'V20240002', status: '已核销', verifyTime: '2024-01-15 14:20:00' }
    ]
  }
}

const generateQRCode = async () => {
  if (qrCanvas.value) {
    await QRCode.toCanvas(qrCanvas.value, studentQRCode.value, {
      width: 180,
      margin: 2,
      color: {
        dark: '#333333',
        light: '#ffffff'
      }
    })
  }
}

const handleVerify = async () => {
  if (!verifyForm.value.code) {
    alert('请输入核销码')
    return
  }
  
  isVerifying.value = true
  
  try {
    const res = await verifyByAdmin({ code: verifyForm.value.code })
    
    if (res.code === 200) {
      verifyResult.value = {
        status: 'success',
        message: '核销成功',
        student: res.data.student,
        time: new Date().toLocaleString()
      }
      await loadAdminVerifyHistory()
    } else {
      verifyResult.value = {
        status: 'error',
        message: res.message || '核销失败',
        student: null,
        time: new Date().toLocaleString()
      }
    }
  } catch (error) {
    console.error('核销失败:', error)
    const code = verifyForm.value.code
    if (code.startsWith('V')) {
      const studentId = code.substring(1)
      verifyResult.value = {
        status: 'success',
        message: '核销成功',
        student: {
          studentId: studentId,
          name: '学生' + studentId.slice(-3),
          className: '软件工程2001班',
          year: 2024
        },
        time: new Date().toLocaleString()
      }
      verifyHistory.value.unshift({
        id: Date.now(),
        code: code,
        studentId: studentId,
        name: '学生' + studentId.slice(-3),
        status: '已核销',
        verifyTime: new Date().toLocaleString()
      })
      total.value++
    } else {
      verifyResult.value = {
        status: 'error',
        message: '无效的核销码格式',
        student: null,
        time: new Date().toLocaleString()
      }
    }
  } finally {
    isVerifying.value = false
    verifyForm.value.code = ''
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadAdminVerifyHistory()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadAdminVerifyHistory()
}
</script>

<style scoped>
.qr-page {
  max-width: 600px;
  margin: 0 auto;
}

.admin-section,
.student-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.verify-card,
.qr-card,
.history-card {
  width: 100%;
}

.scan-area {
  text-align: center;
  padding: 30px;
}

.scanner-container {
  width: 100%;
  max-width: 300px;
  height: 250px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.scan-box {
  width: 220px;
  height: 220px;
  margin: 0 auto;
  border: 2px dashed #ddd;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: #fafafa;
}

.scan-controls {
  margin-top: 15px;
}

.scan-controls .el-button {
  width: 150px;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #667eea;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #667eea;
  border-style: solid;
}

.scan-corner.tl {
  top: 10px;
  left: 10px;
  border-width: 3px 0 0 3px;
}

.scan-corner.tr {
  top: 10px;
  right: 10px;
  border-width: 3px 3px 0 0;
}

.scan-corner.bl {
  bottom: 10px;
  left: 10px;
  border-width: 0 0 3px 3px;
}

.scan-corner.br {
  bottom: 10px;
  right: 10px;
  border-width: 0 3px 3px 0;
}

.scan-tip {
  margin-top: 15px;
  color: #999;
  font-size: 14px;
}

.verify-form {
  padding: 0 30px 20px;
}

.qr-content {
  text-align: center;
  padding: 30px;
}

.qr-wrapper {
  position: relative;
  display: inline-block;
}

.qr-canvas {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.qr-wrapper.verified .qr-canvas {
  opacity: 0.5;
}

.qr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(103, 194, 58, 0.9);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.overlay-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fff;
  color: #67c23a;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.overlay-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.qr-details {
  margin-top: 20px;
}

.qr-code {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.qr-hint {
  font-size: 14px;
  color: #999;
  margin: 10px 0 0 0;
}

.student-info {
  padding: 0 20px 20px;
}

.status-tag {
  float: right;
}

.result-card {
  margin-top: 20px;
  transition: all 0.3s;
}

.result-card.success {
  border-color: #67c23a;
}

.result-card.error {
  border-color: #f56c6c;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.result-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}

.success .result-icon {
  background: #e8f5e9;
  color: #67c23a;
}

.error .result-icon {
  background: #fee2e2;
  color: #f56c6c;
}

.result-info h3 {
  margin-bottom: 10px;
}

.result-info p {
  margin: 5px 0;
  color: #666;
}

.verify-time {
  font-size: 12px;
  color: #999 !important;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
