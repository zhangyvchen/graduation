<template>
  <div class="postcard-generator">
    <div class="postcard-header">
      <span class="header-icon">🎓</span>
      <span>毕业明信片 · 专属记忆</span>
      <el-tag size="small" type="info" round>分享你的高光时刻</el-tag>
    </div>

    <div class="generator-body">
      <!-- 左：表单 -->
      <div class="form-panel">
        <el-form :model="form" label-width="80px" size="default">
          <el-form-item label="学号">
            <el-input v-model="form.studentId" placeholder="请输入学号" @keyup.enter="generate" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="学院">
            <el-input v-model="form.college" placeholder="如：计算机科学与技术" />
          </el-form-item>
          <el-form-item label="毕业年份">
            <el-select v-model="form.year" placeholder="选择年份">
              <el-option v-for="y in [2024,2023,2022,2021]" :key="y" :label="y + '届'" :value="y" />
            </el-select>
          </el-form-item>
          <el-form-item label="座右铭">
            <el-input v-model="form.motto" placeholder="你的人生信条" maxlength="30" show-word-limit />
          </el-form-item>
          <el-form-item label="背景模板">
            <div class="template-selector">
              <div
                  v-for="(t, idx) in templates"
                  :key="idx"
                  class="template-option"
                  :class="{ active: form.template === idx }"
                  @click="form.template = idx"
                  :style="{ background: t.bg }"
              >
                <span>{{ t.name }}</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="generate" :loading="generating" style="width: 100%">
              🎨 生成明信片
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右：预览 -->
      <div class="preview-panel">
        <div class="preview-wrapper" ref="postcardRef" v-if="showPreview">
          <!-- 明信片内容 -->
          <div class="postcard" :style="{ background: templates[form.template].bg }">
            <div class="postcard-overlay">
              <div class="postcard-badge">🎓 毕业快乐</div>

              <div class="postcard-avatar">
                <img :src="avatarUrl" alt="头像" />
              </div>

              <div class="postcard-name">{{ form.name || '毕业生' }}</div>
              <div class="postcard-college">{{ form.college || '某某学院' }}</div>
              <div class="postcard-year">{{ form.year || '2024' }}届毕业生</div>

              <div class="postcard-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ form.gpa || '3.8' }}</span>
                  <span class="stat-label">GPA</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-value">{{ form.awards || '7' }}</span>
                  <span class="stat-label">奖项</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-value">{{ form.destination || '深造' }}</span>
                  <span class="stat-label">去向</span>
                </div>
              </div>

              <div class="postcard-motto">"{{ form.motto || '代码有Bug，人生无Bug' }}"</div>
              <div class="postcard-sign">—— {{ form.name || '毕业生' }}</div>
            </div>
          </div>

          <div class="postcard-actions">
            <el-button type="primary" @click="downloadPostcard" :loading="downloading">
              📥 保存图片
            </el-button>
            <el-button type="success" @click="shareDialogVisible = true">
              📤 分享明信片
            </el-button>
            <el-button @click="resetForm">
              🔄 重新生成
            </el-button>
          </div>
        </div>

        <div v-else class="preview-placeholder">
          <div class="placeholder-icon">🎴</div>
          <p>输入你的信息，生成专属毕业明信片</p>
          <p class="placeholder-hint">留下珍贵的毕业纪念</p>
        </div>
      </div>
    </div>

    <!-- ===== 分享对话框 ===== -->
    <el-dialog
      v-model="shareDialogVisible"
      title="🎓 分享我的毕业明信片"
      width="520px"
      center
      :close-on-click-modal="false"
    >
      <div class="share-dialog-body">
        <div class="share-preview">
          <img v-if="sharePreviewUrl" :src="sharePreviewUrl" alt="明信片预览" />
          <div v-else class="share-preview-loading">🎨 明信片生成中...</div>
        </div>

        <div class="share-platforms">
          <div class="platform-item" @click="shareToWechat">
            <div class="platform-icon wechat">💬</div>
            <div class="platform-name">微信好友</div>
            <div class="platform-tip">{{ isMobile() ? '一键唤起微信' : '扫码发送给朋友' }}</div>
          </div>
          <div class="platform-item" @click="shareToMoments">
            <div class="platform-icon wechat-moments">🌐</div>
            <div class="platform-name">朋友圈</div>
            <div class="platform-tip">长按识别二维码</div>
          </div>
          <div class="platform-item" @click="shareToQQ">
            <div class="platform-icon qq">🐧</div>
            <div class="platform-name">QQ好友</div>
            <div class="platform-tip">{{ isMobile() ? 'URL Scheme 唤起' : '扫码发送给好友' }}</div>
          </div>
          <div class="platform-item" @click="shareToQzone">
            <div class="platform-icon qzone">⭐</div>
            <div class="platform-name">QQ空间</div>
            <div class="platform-tip">{{ isMobile() ? 'URL Scheme 唤起' : '扫码分享到空间' }}</div>
          </div>
          <div class="platform-item" @click="systemShare" v-if="isMobile()">
            <div class="platform-icon system">📲</div>
            <div class="platform-name">系统分享</div>
            <div class="platform-tip">调起系统分享面板</div>
          </div>
          <div class="platform-item" @click="copyPostcardImage">
            <div class="platform-icon copy">📋</div>
            <div class="platform-name">复制图片</div>
            <div class="platform-tip">粘贴到任何地方</div>
          </div>
          <div class="platform-item" @click="copyShareLink">
            <div class="platform-icon link">🔗</div>
            <div class="platform-name">复制链接</div>
            <div class="platform-tip">分享专属链接</div>
          </div>
        </div>

        <div class="share-tip">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              提示：使用微信/QQ <strong>"扫一扫"</strong> 扫描二维码即可查看明信片，
              对方无需登录即可浏览你的毕业纪念。
            </template>
          </el-alert>
        </div>
      </div>
    </el-dialog>

    <!-- ===== 二维码弹窗 ===== -->
    <el-dialog
      v-model="qrDialogVisible"
      :title="qrDialogTitle"
      width="380px"
      center
      append-to-body
    >
      <div class="qr-dialog-body">
        <div class="qr-image-wrapper">
          <img v-if="qrImageUrl" :src="qrImageUrl" alt="二维码" class="qr-image" />
        </div>
        <p class="qr-tip">{{ qrDialogTip }}</p>
        <div class="qr-actions">
          <el-button size="small" @click="downloadQrCode">保存二维码</el-button>
          <el-button size="small" type="primary" @click="copyShareLink">复制链接</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

// ===== 模板配置 =====
const templates = [
  { name: '极光紫', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '落日橙', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '海洋蓝', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '森林绿', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: '星空夜', bg: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 100%)' }
]

// ===== 表单 =====
const form = reactive({
  studentId: '',
  name: '',
  college: '',
  year: 2024,
  motto: '',
  template: 0,
  gpa: '3.8',
  awards: '7',
  destination: '深造'
})

const avatarUrl = computed(() => {
  const seed = form.name || 'anonymous'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`
})

const showPreview = ref(false)
const generating = ref(false)
const downloading = ref(false)
const postcardRef = ref(null)

// ===== 分享对话框状态 =====
const shareDialogVisible = ref(false)
const sharePreviewUrl = ref('')
const qrDialogVisible = ref(false)
const qrDialogTitle = ref('分享二维码')
const qrDialogTip = ref('使用微信扫一扫')
const qrImageUrl = ref('')
const cachedPostcardBlob = ref(null)

// ===== 生成明信片 =====
const generate = async () => {
  if (!form.studentId || !form.name) {
    ElMessage.warning('请至少填写学号和姓名')
    return
  }

  generating.value = true

  // 模拟加载数据（实际可以调用API）
  await new Promise(resolve => setTimeout(resolve, 800))

  // 随机生成一些数据，让每次生成不同
  form.gpa = (3.2 + Math.random() * 0.7).toFixed(2)
  form.awards = Math.floor(Math.random() * 10) + 2
  const dests = ['深造 🎓', '就业 💼', '创业 🚀', '留学 🌍']
  form.destination = dests[Math.floor(Math.random() * dests.length)]

  showPreview.value = true
  generating.value = false
  ElMessage.success('🎉 明信片生成成功！')
}

// ===== 下载图片 =====
const downloadPostcard = async () => {
  if (!postcardRef.value) return

  downloading.value = true
  try {
    await nextTick()
    const canvas = await html2canvas(postcardRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      width: 600,
      height: 800
    })

    const link = document.createElement('a')
    link.download = `毕业明信片_${form.name || '校友'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    ElMessage.success('📥 明信片已保存！')
  } catch (e) {
    console.error('下载失败', e)
    ElMessage.error('下载失败，请重试')
  }
  downloading.value = false
}

// ===== 生成明信片图片（共享逻辑）=====
const generatePostcardCanvas = async () => {
  if (!postcardRef.value) throw new Error('明信片未生成')
  await nextTick()
  return await html2canvas(postcardRef.value, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    width: 600,
    height: 800
  })
}

// 打开分享对话框时预先生成预览图
watch(shareDialogVisible, async (val) => {
  if (val) {
    try {
      const canvas = await generatePostcardCanvas()
      sharePreviewUrl.value = canvas.toDataURL('image/png')
      // 缓存 blob 供后续分享使用
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      cachedPostcardBlob.value = blob
    } catch (e) {
      console.error('生成预览失败', e)
      ElMessage.error('明信片预览生成失败')
    }
  }
})

// 生成分享链接：只放明信片"配方"，不放图片（QR Code 容量限制）
const buildShareLink = async () => {
  const payload = {
    n: form.name,           // 姓名
    y: form.year,           // 年份
    c: form.college,        // 学院
    m: form.motto,          // 座右铭
    t: form.template,       // 模板编号 0-4
    g: form.gpa,            // GPA
    a: form.awards,         // 奖项数
    d: form.destination,    // 去向
    s: form.studentId       // 学号
  }
  // 用单字母 key 压缩字段名，整体约 200-400 字节，远小于 QR Code 容量（2953 字节）
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  const baseUrl = `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}#/postcard-share?d=${encoded}`
}

// 通用：根据 URL 显示二维码弹窗
const showQrFor = async (title, tip, url) => {
  try {
    qrDialogTitle.value = title
    qrDialogTip.value = tip
    qrImageUrl.value = await QRCode.toDataURL(url, {
      width: 260,
      margin: 1,
      color: { dark: '#2c3e50', light: '#ffffff' }
    })
    qrDialogVisible.value = true
  } catch (e) {
    console.error('二维码生成失败', e)
    ElMessage.error('二维码生成失败')
  }
}

// ===== 各平台分享 =====

// ===== 移动端环境检测 =====
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

// ===== URL Scheme 唤起 =====
const launchScheme = (schemeUrl) => {
  // 通过隐藏 iframe 唤起，避免页面跳转
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = schemeUrl
  document.body.appendChild(iframe)
  setTimeout(() => document.body.removeChild(iframe), 1500)
}

// ===== 构建各平台分享参数 =====
const buildSharePayload = async () => {
  const link = await buildShareLink()
  const text = `🎓 ${form.name || '同学'}的毕业明信片 - ${form.year || '2024'}届`
  return { link, text }
}

// ===== 微信好友（URL Scheme 唤起 / 移动端）=====
const shareToWechat = async () => {
  // 移动端直接尝试唤起微信
  if (isMobile()) {
    ElMessage.info('正在唤起微信...')
    launchScheme('weixin://')
    // 微信没有公开 URL Scheme 让外部传入分享内容，但可以唤起微信
    // 然后用户手动选择好友/群发送
    setTimeout(() => {
      ElMessage.success({
        message: '✅ 微信已唤起，请选择好友发送刚才复制的内容（明信片链接已自动复制）',
        duration: 5000
      })
    }, 800)
    await copyShareLink() // 同时复制链接
    return
  }
  // PC 端走二维码流程
  ElMessage.info('正在生成微信分享二维码...')
  const link = await buildShareLink()
  await showQrFor(
    '💬 微信好友',
    '打开微信 → 扫一扫 → 扫描此二维码 → 发送给好友',
    link
  )
}

// 朋友圈
const shareToMoments = async () => {
  ElMessage.info('正在生成朋友圈分享二维码...')
  const link = await buildShareLink()
  await showQrFor(
    '🌐 朋友圈',
    '打开微信 → 扫一扫 → 扫描此二维码 → 长按图片分享到朋友圈',
    link
  )
}

// QQ 好友（公开 URL Scheme，PC + 移动端都可用）
const shareToQQ = async () => {
  const { link, text } = await buildSharePayload()
  if (isMobile()) {
    ElMessage.info('正在唤起 QQ...')
    // QQ 公开协议：mqqapi://share/to_fri
    const scheme = `mqqapi://share/to_fri?src_type=web&version=1&file_type=news&url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}&description=${encodeURIComponent('我的毕业纪念，分享给你')}`
    launchScheme(scheme)
    setTimeout(() => {
      ElMessage.success({
        message: '✅ QQ 已唤起，请选择好友发送',
        duration: 4000
      })
    }, 800)
    return
  }
  // PC 端走二维码
  ElMessage.info('正在生成 QQ 分享二维码...')
  await showQrFor(
    '🐧 QQ 好友',
    '打开 QQ → 扫一扫 → 扫描此二维码 → 发送给好友',
    link
  )
}

// QQ 空间（公开 URL Scheme）
const shareToQzone = async () => {
  const { link, text } = await buildSharePayload()
  if (isMobile()) {
    ElMessage.info('正在唤起 QQ 空间...')
    const scheme = `mqqapi://share/to_qzone?src_type=web&version=1&file_type=news&url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}&description=${encodeURIComponent('我的毕业纪念')}`
    launchScheme(scheme)
    setTimeout(() => {
      ElMessage.success({
        message: '✅ QQ 空间已唤起，请编辑后发布',
        duration: 4000
      })
    }, 800)
    return
  }
  // PC 端走二维码
  ElMessage.info('正在生成 QQ 空间分享二维码...')
  await showQrFor(
    '⭐ QQ 空间',
    '打开 QQ → 扫一扫 → 扫描此二维码 → 分享到 QQ 空间动态',
    link
  )
}

// ===== Web Share API（移动端系统级分享，含微信/QQ/钉钉等所有 App）=====
const systemShare = async () => {
  try {
    let blob = cachedPostcardBlob.value
    if (!blob) {
      const canvas = await generatePostcardCanvas()
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      cachedPostcardBlob.value = blob
    }
    const file = new File([blob], '毕业明信片.png', { type: 'image/png' })
    const { link, text } = await buildSharePayload()

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      // 支持文件分享（如部分 Android Chrome）
      await navigator.share({
        title: '我的毕业明信片',
        text: text,
        files: [file]
      })
      ElMessage.success('✅ 分享成功')
    } else if (navigator.share) {
      // 仅支持文本
      await navigator.share({
        title: '我的毕业明信片',
        text: `${text}\n${link}`
      })
      ElMessage.success('✅ 分享成功')
    } else {
      throw new Error('浏览器不支持分享 API')
    }
  } catch (e) {
    if (e.name === 'AbortError') return // 用户主动取消
    console.warn('系统分享失败，降级为复制', e)
    ElMessage.warning('当前设备不支持系统分享，已复制链接')
    await copyShareLink()
  }
}

// 复制图片到剪贴板
const copyPostcardImage = async () => {
  try {
    let blob = cachedPostcardBlob.value
    if (!blob) {
      const canvas = await generatePostcardCanvas()
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      cachedPostcardBlob.value = blob
    }
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      ElMessage.success('� 图片已复制，可直接粘贴到微信/QQ 聊天框')
    } else {
      throw new Error('浏览器不支持图片复制')
    }
  } catch (e) {
    console.warn('复制图片失败，降级为保存图片', e)
    ElMessage.warning('当前浏览器不支持图片复制，已自动保存图片，请手动分享')
    downloadPostcard()
  }
}

// 复制分享链接
const copyShareLink = async () => {
  try {
    const link = await buildShareLink()
    await navigator.clipboard.writeText(link)
    ElMessage.success('🔗 分享链接已复制到剪贴板')
  } catch (e) {
    console.error('复制链接失败', e)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 保存二维码到本地
const downloadQrCode = () => {
  if (!qrImageUrl.value) return
  const link = document.createElement('a')
  link.download = `毕业明信片_分享二维码.png`
  link.href = qrImageUrl.value
  link.click()
  ElMessage.success('二维码已保存')
}

// ===== 重置 =====
const resetForm = () => {
  showPreview.value = false
  form.studentId = ''
  form.name = ''
  form.college = ''
  form.motto = ''
}
</script>

<style scoped>
.postcard-generator {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-top: 24px;
}

.postcard-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
  margin-bottom: 20px;
}

.header-icon {
  font-size: 28px;
}

.generator-body {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 30px;
}

/* ===== 表单 ===== */
.form-panel {
  padding-right: 10px;
}

.form-panel :deep(.el-form-item) {
  margin-bottom: 18px;
}

.template-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-option {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.template-option:hover {
  transform: scale(1.05);
}

.template-option.active {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

/* ===== 预览 ===== */
.preview-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.preview-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-placeholder {
  text-align: center;
  color: #bbb;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.placeholder-hint {
  font-size: 13px;
  color: #ddd;
}

/* ===== 明信片 ===== */
.postcard {
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  position: relative;
  overflow: hidden;
}

.postcard:hover {
  transform: scale(1.01);
}

.postcard-overlay {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.postcard-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}

.postcard-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.4);
  overflow: hidden;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.postcard-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.postcard-name {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.postcard-college {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 2px;
}

.postcard-year {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 16px;
}

.postcard-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-label {
  font-size: 11px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
}

.postcard-motto {
  font-size: 18px;
  font-style: italic;
  opacity: 0.9;
  margin-bottom: 4px;
  padding: 0 8px;
  font-family: 'Georgia', serif;
}

.postcard-sign {
  font-size: 13px;
  opacity: 0.6;
}

/* ===== 操作按钮 ===== */
.postcard-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 900px) {
  .generator-body {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .preview-wrapper {
    max-width: 320px;
  }
}

@media (max-width: 480px) {
  .postcard-stats {
    flex-direction: column;
    gap: 8px;
  }
  .stat-divider {
    display: none;
  }
}

/* ===== 分享对话框 ===== */
.share-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.share-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 16px;
}

.share-preview img {
  max-width: 200px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.share-preview-loading {
  padding: 60px 0;
  color: #909399;
  font-size: 14px;
}

.share-platforms {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.platform-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border-radius: 12px;
  background: #f8f9fb;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 2px solid transparent;
}

.platform-item:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #e6f0ff;
}

.platform-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.platform-icon.wechat { background: linear-gradient(135deg, #07c160 0%, #00b853 100%); }
.platform-icon.wechat-moments { background: linear-gradient(135deg, #07c160 0%, #20bf6b 100%); }
.platform-icon.qq { background: linear-gradient(135deg, #12b7f5 0%, #0e9bd8 100%); }
.platform-icon.qzone { background: linear-gradient(135deg, #f9cb00 0%, #ffb700 100%); }
.platform-icon.copy { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.platform-icon.link { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.platform-icon.system { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.platform-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.platform-tip {
  font-size: 11px;
  color: #909399;
  text-align: center;
}

.share-tip {
  margin-top: 4px;
}

/* ===== 二维码弹窗 ===== */
.qr-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.qr-image-wrapper {
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.qr-image {
  display: block;
  width: 260px;
  height: 260px;
}

.qr-tip {
  text-align: center;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.qr-actions {
  display: flex;
  gap: 12px;
}
</style>