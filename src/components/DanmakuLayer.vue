<template>
  <div class="danmaku-container" v-if="enabled">
    <!-- 弹幕列表 -->
    <div
        v-for="(item, index) in danmakuList"
        :key="index"
        class="danmaku-item"
        :style="{
        top: item.top + '%',
        color: item.color,
        fontSize: item.size + 'px',
        animationDuration: item.duration + 's',
        animationDelay: item.delay + 's',
        opacity: item.opacity || 0.85
      }"
    >
      {{ item.text }}
    </div>

    <!-- 底部控制区 -->
    <div class="danmaku-control">
      <div class="danmaku-input-group">
        <el-icon class="control-icon"><ChatDotRound /></el-icon>
        <el-input
            v-model="newDanmaku"
            placeholder="留下一句毕业祝福..."
            size="small"
            maxlength="50"
            @keyup.enter="sendDanmaku"
            :style="{ width: '240px' }"
        />
        <el-button size="small" type="primary" @click="sendDanmaku" :disabled="!newDanmaku.trim()">
          <el-icon class="btn-icon"><Promotion /></el-icon>
          发送
        </el-button>
        <el-button
            size="small"
            :type="enabled ? 'warning' : 'success'"
            @click="toggleDanmaku"
        >
          <el-icon class="btn-icon"><CircleClose v-if="enabled" /><ChatLineRound v-else /></el-icon>
          {{ enabled ? '关闭弹幕' : '开启弹幕' }}
        </el-button>
      </div>
    </div>
  </div>

  <!-- 弹幕关闭时的提示条 -->
  <div v-else class="danmaku-closed">
    <div class="closed-info">
      <el-icon class="closed-icon"><ChatLineRound /></el-icon>
      <span>弹幕已关闭</span>
    </div>
    <el-button size="small" type="primary" @click="toggleDanmaku">
      <el-icon class="btn-icon"><RefreshRight /></el-icon>
      重新开启
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Promotion, CircleClose, ChatLineRound, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  presets: {
    type: Array,
    default: () => [
      '毕业快乐，前程似锦',
      '愿此去繁花似锦',
      '奔赴下一场山海',
      '保持热爱，奔赴未来',
      '山水万程，皆有好运',
      '以梦为马，不负韶华',
      '青春不散场，未来皆可期',
      '感谢遇见，后会有期',
      '愿你眼里有光，心中有爱',
      '乘风破浪，未来可期',
      '愿归来仍是少年',
      '逐梦远行，顶峰相见'
    ]
  },
  autoInterval: {
    type: Number,
    default: 3500
  }
})

const emit = defineEmits(['send'])

const danmakuList = ref([])
const newDanmaku = ref('')
const enabled = ref(true)
let autoTimer = null
let idCounter = 0

// 克制配色：主色、强调色、辅助色的低饱和版本
const colors = [
  'rgba(30, 41, 59, 0.75)',
  'rgba(217, 119, 6, 0.85)',
  'rgba(79, 70, 229, 0.8)',
  'rgba(13, 148, 136, 0.8)',
  'rgba(2, 132, 199, 0.8)',
  'rgba(5, 150, 105, 0.8)'
]

const addDanmaku = (text, isUser = false) => {
  if (!enabled.value) return
  if (!text || !text.trim()) return

  const item = {
    id: idCounter++,
    text: text.trim(),
    top: Math.random() * 70 + 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 16,
    duration: Math.random() * 6 + 8,
    delay: Math.random() * 1.5,
    opacity: Math.random() * 0.2 + 0.75
  }

  danmakuList.value.push(item)

  if (danmakuList.value.length > 120) {
    danmakuList.value.splice(0, 30)
  }

  if (isUser) {
    ElMessage.success('弹幕已发送')
    emit('send', text)
  }
}

const sendDanmaku = () => {
  const text = newDanmaku.value.trim()
  if (!text) return
  addDanmaku(text, true)
  newDanmaku.value = ''
}

const toggleDanmaku = () => {
  enabled.value = !enabled.value
  if (enabled.value) {
    ElMessage.success('弹幕已开启')
    setTimeout(() => {
      addDanmaku('弹幕已开启，欢迎留下你的祝福')
    }, 300)
  } else {
    ElMessage.info('弹幕已关闭')
    danmakuList.value = []
  }
}

const startAutoDanmaku = () => {
  if (autoTimer) clearInterval(autoTimer)
  autoTimer = setInterval(() => {
    if (!enabled.value) return
    const msg = props.presets[Math.floor(Math.random() * props.presets.length)]
    addDanmaku(msg)
  }, props.autoInterval)
}

onMounted(() => {
  startAutoDanmaku()
})

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer)
})
</script>

<style scoped>
.danmaku-container {
  position: relative;
  width: 100%;
  min-height: 64px;
  overflow: hidden;
  pointer-events: none;
  margin-bottom: 16px;
}

.danmaku-item {
  position: fixed;
  left: 0;
  white-space: nowrap;
  animation: danmakuMove linear infinite;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
  z-index: 999;
  pointer-events: none;
  user-select: none;
  letter-spacing: 0.5px;
  will-change: transform;
}

@keyframes danmakuMove {
  from {
    transform: translateX(100vw) translateZ(0);
  }
  to {
    transform: translateX(-100%) translateZ(0);
  }
}

.danmaku-control {
  position: relative;
  z-index: 1000;
  pointer-events: auto;
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  margin-top: 12px;
  box-shadow: var(--shadow);
}

.danmaku-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-icon {
  color: var(--accent);
  font-size: 18px;
}

.btn-icon {
  margin-right: 4px;
  font-size: 14px;
}

.danmaku-input-group :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--border) inset;
}

.danmaku-input-group :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}

/* ===== 弹幕关闭时的提示条 ===== */
.danmaku-closed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  color: var(--text-3);
  font-size: 14px;
}

.closed-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.closed-icon {
  color: var(--accent);
  font-size: 18px;
}

.danmaku-closed :deep(.el-button) {
  border-radius: 999px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .danmaku-control {
    justify-content: center;
  }

  .danmaku-input-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .danmaku-input-group :deep(.el-input) {
    flex: 1;
    min-width: 160px;
  }

  .danmaku-closed {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
