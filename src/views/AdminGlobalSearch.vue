<template>
  <div class="global-search-page">
    <div class="page-header">
      <h2>全局搜索</h2>
      <p class="sub">跨学生 / 去向字段模糊检索；优先 Elasticsearch，不可用时自动回退 MySQL</p>
    </div>

    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          placeholder="输入姓名、学号、公司、学校、专业、城市等"
          clearable
          style="max-width: 420px"
          @keyup.enter="doSearch"
        />
        <el-input-number v-model="year" :controls="true" placeholder="年份" :min="2015" :max="2035" />
        <el-button type="primary" :loading="searching" @click="doSearch">搜索</el-button>
        <el-button :loading="syncing" @click="doSync">同步到 ES</el-button>
        <el-tag v-if="statusText" type="info" effect="plain">{{ statusText }}</el-tag>
        <el-tag v-if="lastSource" :type="lastSource === 'elasticsearch' ? 'success' : 'warning'">
          本次来源：{{ lastSource }}
        </el-tag>
      </div>
      <p v-if="hint" class="hint">{{ hint }}</p>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="list" stripe v-loading="searching" empty-text="暂无结果，可先同步 ES 或换关键词">
        <el-table-column prop="studentId" label="学号" width="130" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="year" label="届别" width="80" />
        <el-table-column prop="department" label="学院" min-width="120" />
        <el-table-column prop="major" label="专业" min-width="120" />
        <el-table-column prop="companyName" label="公司" min-width="140" />
        <el-table-column prop="jobTitle" label="职位" min-width="110" />
        <el-table-column prop="schoolName" label="升学学校" min-width="140" />
        <el-table-column prop="province" label="省份" width="90" />
        <el-table-column prop="city" label="城市" width="90" />
        <el-table-column prop="industry" label="行业" min-width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { globalSearch, getSearchStatus, syncSearchIndex } from '../api/admin'

const keyword = ref('')
const year = ref(null)
const list = ref([])
const searching = ref(false)
const syncing = ref(false)
const lastSource = ref('')
const hint = ref('')
const statusText = ref('')

const refreshStatus = async () => {
  try {
    const res = await getSearchStatus()
    if (res.code === 200 && res.data) {
      const d = res.data
      statusText.value = d.esEnabled
        ? `ES ${d.esAvailable ? '可用' : '不可用'} · 索引约 ${d.indexedCount} 条`
        : 'ES 未启用（将走 MySQL LIKE）'
    }
  } catch (e) {
    statusText.value = '状态获取失败'
  }
}

const doSearch = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  searching.value = true
  hint.value = ''
  try {
    const res = await globalSearch({
      q: keyword.value.trim(),
      year: year.value || undefined,
      limit: 50
    })
    if (res.code === 200 && res.data) {
      list.value = res.data.list || []
      lastSource.value = res.data.source || ''
      hint.value = res.data.hint || ''
      if (!list.value.length) {
        ElMessage.info('无匹配结果')
      }
    } else {
      ElMessage.error(res.message || '搜索失败')
    }
  } catch (e) {
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

const doSync = async () => {
  syncing.value = true
  try {
    const res = await syncSearchIndex(year.value || undefined)
    if (res.code === 200 && res.data?.ok) {
      ElMessage.success(`同步完成：${res.data.synced} 条（${res.data.costMs} ms）`)
      await refreshStatus()
    } else {
      ElMessage.warning(res.data?.message || res.message || '同步失败，请确认已启用 ES')
    }
  } catch (e) {
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(refreshStatus)
</script>

<style scoped>
.global-search-page {
  padding: 8px 4px 24px;
}
.page-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1b4f72;
}
.sub {
  margin: 0 0 16px;
  color: #6b7c8f;
  font-size: 13px;
}
.toolbar-card,
.table-card {
  margin-bottom: 16px;
  border-radius: 10px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.hint {
  margin: 10px 0 0;
  color: #c47a00;
  font-size: 13px;
}
</style>
