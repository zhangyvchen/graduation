<template>
  <div class="ai-mascot" :class="[`size-${size}`]" aria-hidden="true">
    <!-- 自定义动态图：把 GIF / 动图 WebP 放到 public/static/ai-mascot.webp 即可自动启用 -->
    <img
      v-if="resolvedSrc"
      class="mascot-media"
      :src="resolvedSrc"
      alt=""
      draggable="false"
      @error="onMediaError"
    />
    <!-- 默认：纯 CSS/SVG 动效形象，不依赖抠图素材 -->
    <div v-else class="mascot-svg-wrap">
      <svg class="mascot-svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="aiBlob" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop stop-color="#60a5fa" />
            <stop offset="0.55" stop-color="#2563eb" />
            <stop offset="1" stop-color="#1d4ed8" />
          </linearGradient>
          <filter id="aiSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse class="mascot-shadow" cx="60" cy="108" rx="28" ry="5" fill="rgba(37,99,235,0.18)" />
        <g class="mascot-body" filter="url(#aiSoft)">
          <path
            d="M60 14c22 0 40 16 40 38 0 18-10 30-22 38-6 4-12 8-18 8s-12-4-18-8C30 82 20 70 20 52 20 30 38 14 60 14Z"
            fill="url(#aiBlob)"
          />
          <ellipse cx="42" cy="40" rx="14" ry="9" fill="rgba(255,255,255,0.28)" />
          <g class="mascot-face">
            <ellipse class="eye left" cx="46" cy="54" rx="5.5" ry="6.5" fill="#0f172a" />
            <ellipse class="eye right" cx="74" cy="54" rx="5.5" ry="6.5" fill="#0f172a" />
            <circle cx="48" cy="52" r="1.6" fill="#fff" />
            <circle cx="76" cy="52" r="1.6" fill="#fff" />
            <path
              class="mouth"
              d="M52 68c3.5 4 12.5 4 16 0"
              stroke="#0f172a"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          </g>
          <circle class="spark a" cx="96" cy="28" r="3" fill="#93c5fd" />
          <circle class="spark b" cx="22" cy="34" r="2.2" fill="#bfdbfe" />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  /** 自定义动图地址，如 /static/ai-mascot.webp；留空则用内置 SVG 动效 */
  src: { type: String, default: '' },
  size: { type: String, default: 'md' } // sm | md | lg
})

const resolvedSrc = ref('')
const triedFallback = ref(false)

const CANDIDATES = [
  '/static/ai-mascot.webp',
  '/static/ai-mascot.gif',
  '/static/ai-mascot.png'
]

async function probe(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

async function resolveMedia() {
  if (props.src) {
    resolvedSrc.value = props.src
    return
  }
  for (const url of CANDIDATES) {
    if (await probe(url)) {
      resolvedSrc.value = url
      return
    }
  }
  resolvedSrc.value = ''
}

function onMediaError() {
  if (triedFallback.value) {
    resolvedSrc.value = ''
    return
  }
  triedFallback.value = true
  resolvedSrc.value = ''
}

onMounted(resolveMedia)
watch(() => props.src, resolveMedia)
</script>

<style scoped>
.ai-mascot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.ai-mascot.size-sm { width: 56px; height: 56px; }
.ai-mascot.size-md { width: 72px; height: 72px; }
.ai-mascot.size-lg { width: 96px; height: 96px; }

.mascot-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(37, 99, 235, 0.18));
}

.mascot-svg-wrap,
.mascot-svg {
  width: 100%;
  height: 100%;
}

.mascot-body {
  transform-origin: 60px 70px;
  animation: mascot-bob 2.8s ease-in-out infinite;
}

.mascot-shadow {
  transform-origin: 60px 108px;
  animation: mascot-shadow 2.8s ease-in-out infinite;
}

.eye {
  transform-origin: center;
  animation: mascot-blink 4.5s ease-in-out infinite;
}

.eye.right {
  animation-delay: 0.08s;
}

.mouth {
  animation: mascot-smile 3.6s ease-in-out infinite;
}

.spark.a {
  animation: mascot-spark 2.2s ease-in-out infinite;
}

.spark.b {
  animation: mascot-spark 2.2s ease-in-out infinite 0.7s;
}

@keyframes mascot-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes mascot-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.9; }
  50% { transform: scaleX(0.82); opacity: 0.55; }
}

@keyframes mascot-blink {
  0%, 42%, 48%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(0.12); }
}

@keyframes mascot-smile {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(1px); }
}

@keyframes mascot-spark {
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}
</style>
