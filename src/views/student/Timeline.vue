<template>
  <div class="timeline-page">
    <el-card shadow="hover">
      <template #header><span>📅 我的成长时间线</span></template>
      <el-timeline>
        <el-timeline-item
          v-for="(item, idx) in timeline"
          :key="idx"
          :timestamp="formatDate(item.date)"
          :type="getTypeColor(item.type)"
          placement="top"
        >
          <el-card shadow="hover" class="time-item">
            <h4>{{ item.title }}</h4>
            <p v-if="item.description" class="desc">{{ item.description }}</p>
            <el-tag v-if="item.level" size="small">{{ item.level }}</el-tag>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyTimeline } from '@/api/student'

const timeline = ref([])

onMounted(async () => {
  const res = await getMyTimeline()
  if (res.code === 200) {
    timeline.value = res.data
  }
})

const formatDate = (d) => d ? d.substring(0, 10) : ''
const getTypeColor = (t) => ({
  enrollment: 'primary', graduation: 'danger', honor: 'warning',
  competition: 'success', scholarship: 'success', cadre: 'info', party: 'danger'
}[t] || 'primary')
</script>

<style scoped>
.timeline-page { }
.time-item h4 { margin: 0 0 8px 0; }
.desc { color: #606266; margin: 8px 0; font-size: 13px; }
</style>
