<template>
  <div class="risk-page">
    <header class="page-header">
      <h2>AI 风控管理</h2>
      <p>正常对话在 chat_message；异常拦截写入 chat_message_abnormal。短词：DB / core.txt；漏拦由 LLM 语义复审补位。</p>
    </header>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="异常对话" name="abnormal">
        <div class="toolbar">
          <el-select v-model="filterUserType" clearable placeholder="用户类型" style="width: 140px" @change="loadAbnormal">
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
            <el-option label="访客" value="guest" />
          </el-select>
          <el-input
            v-model="keyword"
            placeholder="搜索内容 / 危险词 / 学号"
            clearable
            style="width: 260px"
            @keyup.enter="loadAbnormal"
          />
          <el-button type="primary" @click="loadAbnormal">查询</el-button>
        </div>

        <el-table
          :data="abnormalList"
          v-loading="loadingAbnormal"
          stripe
          border
          :default-sort="{ prop: 'id', order: 'ascending' }"
          @sort-change="onAbnormalSortChange"
        >
          <el-table-column prop="id" label="ID" width="90" sortable="custom" />
          <el-table-column prop="userType" label="类型" width="100" sortable="custom">
            <template #default="{ row }">
              <el-tag size="small">{{ row.userType || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="学号" width="140" sortable="custom" />
          <el-table-column prop="adminId" label="管理员ID" width="110" sortable="custom" />
          <el-table-column prop="hitType" label="拦截方式" width="120" sortable="custom">
            <template #default="{ row }">
              <el-tag :type="row.hitType === 'semantic' ? 'warning' : 'danger'" size="small">
                {{ row.hitType === 'semantic' ? '语义审核' : '关键词' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskWord" label="命中词" width="130" sortable="custom">
            <template #default="{ row }">
              <el-tag type="danger" size="small">{{ row.riskWord || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="原始内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="180" sortable="custom">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link @click="removeAbnormal(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="危险词库" name="words">
        <div class="toolbar">
          <el-button type="primary" @click="openWordDialog()">新增自定义词</el-button>
          <el-button @click="loadWords">刷新自定义词</el-button>
          <el-button type="success" plain @click="reloadLexicon" :loading="reloading">重载 Sensitive-lexicon</el-button>
          <el-tag v-if="lexiconTotal != null" type="info">内存词库约 {{ lexiconTotal }} 条</el-tag>
        </div>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
          title="说明：大词库来自开源 Sensitive-lexicon（classpath:sensitive/*.txt），不会全部写入数据库。下方表格仅管理你自定义补充的词。"
        />

        <el-table
          :data="wordList"
          v-loading="loadingWords"
          stripe
          border
          :default-sort="{ prop: 'id', order: 'ascending' }"
          @sort-change="onWordSortChange"
        >
          <el-table-column prop="id" label="ID" width="90" sortable="custom" />
          <el-table-column prop="word" label="危险词" width="160" sortable="custom" />
          <el-table-column prop="category" label="分类" width="120" sortable="custom" />
          <el-table-column prop="enabled" label="状态" width="110" sortable="custom">
            <template #default="{ row }">
              <el-switch
                v-model="row.enabled"
                @change="(val) => toggleWord(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createdBy" label="创建人" width="110" sortable="custom" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openWordDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeWord(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="wordDialogVisible" :title="editingWord?.id ? '编辑危险词' : '新增危险词'" width="420px">
      <el-form label-width="80px">
        <el-form-item label="危险词">
          <el-input v-model="wordForm.word" placeholder="请输入危险词" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="wordForm.category" style="width: 100%">
            <el-option label="通用" value="general" />
            <el-option label="暴力" value="violence" />
            <el-option label="色情" value="porn" />
            <el-option label="欺诈" value="fraud" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="wordForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="wordForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingWord" @click="saveWord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAbnormalChats,
  deleteAbnormalChat,
  getRiskWords,
  addRiskWord,
  updateRiskWord,
  deleteRiskWord,
  reloadSensitiveLexicon,
  getSensitiveLexiconStats
} from '../api/admin'
import { useAuth } from '../stores/auth'

const auth = useAuth()
const activeTab = ref('abnormal')
const loadingAbnormal = ref(false)
const loadingWords = ref(false)
const reloading = ref(false)
const lexiconTotal = ref(null)
const abnormalList = ref([])
const wordList = ref([])
const filterUserType = ref('')
const keyword = ref('')
const abnormalSort = ref({ sortBy: 'id', sortOrder: 'asc' })
const wordSort = ref({ sortBy: 'id', sortOrder: 'asc' })

const wordDialogVisible = ref(false)
const savingWord = ref(false)
const editingWord = ref(null)
const wordForm = ref({
  word: '',
  category: 'general',
  remark: '',
  enabled: true
})

const formatTime = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

const onAbnormalSortChange = ({ prop, order }) => {
  if (!order) {
    abnormalSort.value = { sortBy: 'id', sortOrder: 'asc' }
  } else {
    abnormalSort.value = {
      sortBy: prop || 'id',
      sortOrder: order === 'ascending' ? 'asc' : 'desc'
    }
  }
  loadAbnormal()
}

const onWordSortChange = ({ prop, order }) => {
  if (!order) {
    wordSort.value = { sortBy: 'id', sortOrder: 'asc' }
  } else {
    wordSort.value = {
      sortBy: prop || 'id',
      sortOrder: order === 'ascending' ? 'asc' : 'desc'
    }
  }
  loadWords()
}

const loadAbnormal = async () => {
  loadingAbnormal.value = true
  try {
    const res = await getAbnormalChats({
      userType: filterUserType.value || undefined,
      keyword: keyword.value || undefined,
      sortBy: abnormalSort.value.sortBy,
      sortOrder: abnormalSort.value.sortOrder
    })
    if (res.code === 200) {
      abnormalList.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载异常对话失败')
  } finally {
    loadingAbnormal.value = false
  }
}

const removeAbnormal = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除这条异常记录？', '提示', { type: 'warning' })
    const res = await deleteAbnormalChat(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadAbnormal()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // cancel
  }
}

const loadWords = async () => {
  loadingWords.value = true
  try {
    const res = await getRiskWords({
      sortBy: wordSort.value.sortBy,
      sortOrder: wordSort.value.sortOrder
    })
    if (res.code === 200) {
      wordList.value = (res.data || []).map(item => ({
        ...item,
        enabled: item.enabled === true || item.enabled === 1
      }))
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载危险词失败')
  } finally {
    loadingWords.value = false
  }
}

const openWordDialog = (row = null) => {
  editingWord.value = row
  wordForm.value = row
    ? {
        word: row.word,
        category: row.category || 'general',
        remark: row.remark || '',
        enabled: row.enabled !== false
      }
    : { word: '', category: 'general', remark: '', enabled: true }
  wordDialogVisible.value = true
}

const saveWord = async () => {
  if (!wordForm.value.word?.trim()) {
    ElMessage.warning('请输入危险词')
    return
  }
  savingWord.value = true
  try {
    const payload = {
      ...wordForm.value,
      createdBy: auth.state.user?.username || 'admin'
    }
    const res = editingWord.value?.id
      ? await updateRiskWord(editingWord.value.id, payload)
      : await addRiskWord(payload)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      wordDialogVisible.value = false
      loadWords()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingWord.value = false
  }
}

const toggleWord = async (row, val) => {
  try {
    const res = await updateRiskWord(row.id, { enabled: val })
    if (res.code !== 200) {
      row.enabled = !val
      ElMessage.error(res.message || '更新失败')
    }
  } catch {
    row.enabled = !val
    ElMessage.error('更新失败')
  }
}

const removeWord = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除危险词「${row.word}」？`, '提示', { type: 'warning' })
    const res = await deleteRiskWord(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadWords()
      loadLexiconStats()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // cancel
  }
}

const loadLexiconStats = async () => {
  try {
    const res = await getSensitiveLexiconStats()
    if (res.code === 200) {
      lexiconTotal.value = res.data?.total ?? null
    }
  } catch {
    // ignore
  }
}

const reloadLexicon = async () => {
  reloading.value = true
  try {
    const res = await reloadSensitiveLexicon()
    if (res.code === 200) {
      lexiconTotal.value = res.data?.total ?? null
      ElMessage.success(`词库已重载，共约 ${lexiconTotal.value} 条`)
    } else {
      ElMessage.error(res.message || '重载失败')
    }
  } catch {
    ElMessage.error('重载失败')
  } finally {
    reloading.value = false
  }
}

onMounted(() => {
  loadAbnormal()
  loadWords()
  loadLexiconStats()
})
</script>

<style scoped>
.risk-page {
  padding: 8px 4px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: #2d5a7a;
  line-height: 1.35;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 400;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
</style>
