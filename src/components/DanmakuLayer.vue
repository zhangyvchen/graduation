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
        <el-input
            v-model="newDanmaku"
            placeholder="发送毕业祝福..."
            size="small"
            maxlength="50"
            @keyup.enter="sendDanmaku"
            :style="{ width: '220px' }"
        />
        <el-button size="small" type="primary" @click="sendDanmaku" :disabled="!newDanmaku.trim()">
          🚀 发射
        </el-button>
        <!-- 开关按钮改成更明显的样式 -->
          <el-button
                  size="small"
                  :type="enabled ? 'warning' : 'success'"
                  @click="toggleDanmaku"
          >
              <span style="font-size: 14px;">{{ enabled ? '✖' : '💬' }}</span>
              {{ enabled ? '关闭弹幕' : '开启弹幕' }}
          </el-button>

      </div>
    </div>
  </div>

  <!-- 弹幕关闭时的提示条 -->
  <div v-else class="danmaku-closed">
    <span>💬 弹幕已关闭</span>
    <el-button size="small" type="primary" @click="toggleDanmaku">
      🔄 点击重新开启
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  presets: {
    type: Array,
    default: () => [
      '🎓 毕业快乐！', '🚀 前程似锦！', '💪 加油2024！',
      '🌟 未来可期！', '📚 感谢母校！', '🌈 青春不散场！',
      '❤️ 我爱新大！', '🔥 人生巅峰！', '💫 星辰大海！',
      '👋 再见青春！', '🎉 我们毕业啦！', '✨ 闪闪发光！',
      '🏆 做最好的自己！', '🌊 乘风破浪！', '🎯 梦想成真！'
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

const colors = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff6bff', '#ff9f43', '#00d2d3', '#f368e0',
  '#54a0ff', '#5f27cd', '#01a3a4', '#f8a5c2'
]

const addDanmaku = (text, isUser = false) => {
  if (!enabled.value) return
  if (!text || !text.trim()) return

  const item = {
    id: idCounter++,
    text: text.trim(),
    top: Math.random() * 75 + 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 18,
    duration: Math.random() * 6 + 6,
    delay: Math.random() * 1.5,
    opacity: Math.random() * 0.3 + 0.6
  }

  danmakuList.value.push(item)

  if (danmakuList.value.length > 120) {
    danmakuList.value.splice(0, 30)
  }

  if (isUser) {
    ElMessage.success('💬 弹幕已发射！')
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
    ElMessage.success('💬 弹幕已开启')
    // 立即生成一条欢迎弹幕
    setTimeout(() => {
      addDanmaku('🎉 弹幕回来啦！继续嗨起来！')
    }, 300)
  } else {
    ElMessage.info('💬 弹幕已关闭')
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
  min-height: 60px;
  overflow: hidden;
  pointer-events: none;
  margin-bottom: 10px;
}

.danmaku-item {
  position: fixed;
  left: 0;
  white-space: nowrap;
  animation: danmakuMove linear infinite;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
  pointer-events: none;
  user-select: none;
  font-family: 'Microsoft YaHei', sans-serif;
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
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  margin-top: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.danmaku-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.danmaku-input-group :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.danmaku-input-group :deep(.el-button) {
  border-radius: 20px;
}

/* ===== 弹幕关闭时的提示条 ===== */
.danmaku-closed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  margin-bottom: 10px;
  border: 2px dashed #ddd;
  color: #999;
  font-size: 14px;
}

.danmaku-closed :deep(.el-button) {
  border-radius: 20px;
}

.danmaku-closed span {
  font-weight: 500;
}
</style>