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
            <el-button @click="sharePostcard">
              📤 分享
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'

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

// ===== 分享 =====
const sharePostcard = async () => {
  try {
    if (navigator.share) {
      // 先下载再分享
      const canvas = await html2canvas(postcardRef.value, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 600,
        height: 800
      })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const file = new File([blob], '毕业明信片.png', { type: 'image/png' })

      await navigator.share({
        title: '我的毕业明信片',
        text: `🎓 ${form.name}的毕业明信片，祝大家前程似锦！`,
        files: [file]
      })
    } else {
      // 降级方案：复制链接
      const text = `🎓 我生成了一张毕业明信片！`
      await navigator.clipboard.writeText(text)
      ElMessage.success('📤 已复制分享文案，快去朋友圈分享吧！')
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      ElMessage.warning('分享取消或失败')
    }
  }
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
</style>