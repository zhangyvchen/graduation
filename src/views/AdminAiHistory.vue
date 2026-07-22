<template>
  <div class="history-page">
    <header class="page-header">
      <h2>AI 聊天历史</h2>
      <p>与对话界面分离：以表格管理正常聊天记录与会话，支持增删改查</p>
    </header>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="消息记录" name="messages">
        <div class="toolbar">
          <el-select v-model="msgFilter.userType" clearable placeholder="用户类型" style="width: 130px" @change="onMsgSearch">
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
            <el-option label="访客" value="guest" />
          </el-select>
          <el-select v-model="msgFilter.year" clearable placeholder="年份" style="width: 110px" @change="onMsgSearch">
            <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
          </el-select>
          <el-input
            v-model="msgFilter.keyword"
            placeholder="搜索内容 / 回复 / 学号"
            clearable
            style="width: 240px"
            @keyup.enter="onMsgSearch"
          />
          <el-button type="primary" @click="onMsgSearch">查询</el-button>
          <el-button type="success" @click="openMsgDialog()">新增记录</el-button>
        </div>

        <el-table
          :data="messageList"
          v-loading="loadingMsg"
          stripe
          border
          height="520"
          :default-sort="{ prop: 'id', order: 'ascending' }"
          @sort-change="onMsgSortChange"
        >
          <el-table-column prop="id" label="ID" width="80" sortable="custom" />
          <el-table-column prop="userType" label="类型" width="100" sortable="custom">
            <template #default="{ row }">
              <el-tag size="small">{{ row.userType || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="学号" width="130" show-overflow-tooltip sortable="custom" />
          <el-table-column prop="adminId" label="管理员ID" width="110" sortable="custom" />
          <el-table-column prop="sessionId" label="会话ID" width="100" sortable="custom" />
          <el-table-column prop="role" label="角色" width="90" sortable="custom" />
          <el-table-column prop="year" label="年份" width="90" sortable="custom" />
          <el-table-column prop="content" label="用户内容" min-width="180" show-overflow-tooltip />
          <el-table-column prop="response" label="AI 回复" min-width="200" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="180" sortable="custom">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openPreview(row)">预览</el-button>
              <el-button link type="primary" @click="openMsgDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeMessage(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="msgPage.page"
            v-model:page-size="msgPage.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="msgPage.total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadMessages"
            @current-change="loadMessages"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="会话列表" name="sessions">
        <div class="toolbar">
          <el-select v-model="sessionFilter.userType" clearable placeholder="用户类型" style="width: 130px" @change="onSessionSearch">
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-input
            v-model="sessionFilter.keyword"
            placeholder="搜索标题 / 学号 / sessionKey"
            clearable
            style="width: 260px"
            @keyup.enter="onSessionSearch"
          />
          <el-button type="primary" @click="onSessionSearch">查询</el-button>
        </div>

        <el-table
          :data="sessionList"
          v-loading="loadingSession"
          stripe
          border
          height="520"
          :default-sort="{ prop: 'id', order: 'ascending' }"
          @sort-change="onSessionSortChange"
        >
          <el-table-column prop="id" label="ID" width="80" sortable="custom" />
          <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip sortable="custom" />
          <el-table-column prop="userType" label="类型" width="100" sortable="custom" />
          <el-table-column prop="userId" label="学号" width="130" sortable="custom" />
          <el-table-column prop="adminId" label="管理员ID" width="110" sortable="custom" />
          <el-table-column prop="sessionKey" label="SessionKey" min-width="180" show-overflow-tooltip />
          <el-table-column prop="lastMessageAt" label="最后消息" width="180" sortable="custom">
            <template #default="{ row }">{{ formatTime(row.lastMessageAt) }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" sortable="custom">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="renameSessionRow(row)">改名</el-button>
              <el-button link type="primary" @click="viewSessionMessages(row)">看消息</el-button>
              <el-button link type="danger" @click="removeSessionRow(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="sessionPage.page"
            v-model:page-size="sessionPage.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="sessionPage.total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadSessions"
            @current-change="loadSessions"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-drawer
      v-model="previewVisible"
      title="消息预览"
      size="480px"
      destroy-on-close
    >
      <div v-if="previewRow" class="preview-drawer ai-chat-scope">
        <div class="preview-meta">
          <el-tag size="small">{{ previewRow.userType || '-' }}</el-tag>
          <el-tag size="small" type="info">{{ previewRow.role || '-' }}</el-tag>
          <span class="preview-time">{{ formatTime(previewRow.createTime) }}</span>
        </div>
        <section v-if="previewRow.content" class="preview-block">
          <h4>用户内容</h4>
          <div class="preview-bubble is-user">{{ previewRow.content }}</div>
        </section>
        <section v-if="previewRow.response" class="preview-block">
          <h4>AI 回复</h4>
          <div class="preview-bubble is-ai">
            <ChatRichBody :content="previewRow.response" />
          </div>
        </section>
        <el-empty v-if="!previewRow.content && !previewRow.response" description="无内容" />
      </div>
    </el-drawer>

    <el-dialog v-model="msgDialogVisible" :title="editingMsg?.id ? '编辑消息' : '新增消息'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="用户类型" v-if="!editingMsg?.id">
          <el-select v-model="msgForm.userType" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="学生" value="student" />
            <el-option label="访客" value="guest" />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" v-if="!editingMsg?.id && msgForm.userType === 'student'">
          <el-input v-model="msgForm.userId" />
        </el-form-item>
        <el-form-item label="管理员ID" v-if="!editingMsg?.id && msgForm.userType === 'admin'">
          <el-input v-model="msgForm.adminId" />
        </el-form-item>
        <el-form-item label="会话ID">
          <el-input v-model="msgForm.sessionId" placeholder="可选" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="msgForm.role" style="width: 100%">
            <el-option label="user" value="user" />
            <el-option label="ai" value="ai" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="msgForm.year" :min="2020" :max="2035" />
        </el-form-item>
        <el-form-item label="用户内容">
          <el-input v-model="msgForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="AI 回复">
          <el-input v-model="msgForm.response" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="msgDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingMsg" @click="saveMessage">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  manageListMessages,
  manageCreateMessage,
  manageUpdateMessage,
  deleteChatMessage,
  manageListSessions,
  renameAiSession,
  deleteAiSession
} from '../api/admin'
import { useAuth } from '../stores/auth'
import ChatRichBody from '../components/ChatRichBody.vue'

const auth = useAuth()
const activeTab = ref('messages')
const years = [2022, 2023, 2024, 2025, 2026]

const loadingMsg = ref(false)
const loadingSession = ref(false)
const messageList = ref([])
const sessionList = ref([])
const msgFilter = ref({ userType: '', year: null, keyword: '', sessionId: null })
const sessionFilter = ref({ userType: '', keyword: '' })
const msgPage = ref({ page: 1, size: 10, total: 0 })
const sessionPage = ref({ page: 1, size: 10, total: 0 })
const msgSort = ref({ sortBy: 'id', sortOrder: 'asc' })
const sessionSort = ref({ sortBy: 'id', sortOrder: 'asc' })

const msgDialogVisible = ref(false)
const previewVisible = ref(false)
const previewRow = ref(null)
const savingMsg = ref(false)
const editingMsg = ref(null)
const msgForm = ref({
  userType: 'admin',
  userId: '',
  adminId: '',
  sessionId: '',
  role: 'user',
  year: new Date().getFullYear(),
  content: '',
  response: ''
})

const formatTime = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

const onMsgSearch = () => {
  msgPage.value.page = 1
  msgFilter.value.sessionId = null
  loadMessages()
}

const onSessionSearch = () => {
  sessionPage.value.page = 1
  loadSessions()
}

const onMsgSortChange = ({ prop, order }) => {
  if (!order) {
    msgSort.value = { sortBy: 'id', sortOrder: 'asc' }
  } else {
    msgSort.value = {
      sortBy: prop || 'id',
      sortOrder: order === 'ascending' ? 'asc' : 'desc'
    }
  }
  msgPage.value.page = 1
  loadMessages()
}

const onSessionSortChange = ({ prop, order }) => {
  if (!order) {
    sessionSort.value = { sortBy: 'id', sortOrder: 'asc' }
  } else {
    sessionSort.value = {
      sortBy: prop || 'id',
      sortOrder: order === 'ascending' ? 'asc' : 'desc'
    }
  }
  sessionPage.value.page = 1
  loadSessions()
}

const loadMessages = async () => {
  loadingMsg.value = true
  try {
    const res = await manageListMessages({
      userType: msgFilter.value.userType || undefined,
      year: msgFilter.value.year || undefined,
      keyword: msgFilter.value.keyword || undefined,
      sessionId: msgFilter.value.sessionId || undefined,
      page: msgPage.value.page,
      size: msgPage.value.size,
      sortBy: msgSort.value.sortBy,
      sortOrder: msgSort.value.sortOrder
    })
    if (res.code === 200) {
      const data = res.data || {}
      messageList.value = data.records || []
      msgPage.value.total = Number(data.total || 0)
      if (data.current) msgPage.value.page = Number(data.current)
      if (data.size) msgPage.value.size = Number(data.size)
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch {
    ElMessage.error('加载消息失败')
  } finally {
    loadingMsg.value = false
  }
}

const loadSessions = async () => {
  loadingSession.value = true
  try {
    const res = await manageListSessions({
      userType: sessionFilter.value.userType || undefined,
      keyword: sessionFilter.value.keyword || undefined,
      page: sessionPage.value.page,
      size: sessionPage.value.size,
      sortBy: sessionSort.value.sortBy,
      sortOrder: sessionSort.value.sortOrder
    })
    if (res.code === 200) {
      const data = res.data || {}
      sessionList.value = data.records || []
      sessionPage.value.total = Number(data.total || 0)
      if (data.current) sessionPage.value.page = Number(data.current)
      if (data.size) sessionPage.value.size = Number(data.size)
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch {
    ElMessage.error('加载会话失败')
  } finally {
    loadingSession.value = false
  }
}

const openPreview = (row) => {
  previewRow.value = row
  previewVisible.value = true
}

const openMsgDialog = (row = null) => {
  editingMsg.value = row
  msgForm.value = row
    ? {
        userType: row.userType || 'admin',
        userId: row.userId || '',
        adminId: row.adminId != null ? String(row.adminId) : '',
        sessionId: row.sessionId != null ? String(row.sessionId) : '',
        role: row.role || 'user',
        year: row.year || new Date().getFullYear(),
        content: row.content || '',
        response: row.response || ''
      }
    : {
        userType: 'admin',
        userId: '',
        adminId: auth.state.user?.id != null ? String(auth.state.user.id) : '',
        sessionId: '',
        role: 'user',
        year: new Date().getFullYear(),
        content: '',
        response: ''
      }
  msgDialogVisible.value = true
}

const saveMessage = async () => {
  if (!msgForm.value.content?.trim() && !msgForm.value.response?.trim()) {
    ElMessage.warning('请至少填写内容或回复')
    return
  }
  savingMsg.value = true
  try {
    let res
    if (editingMsg.value?.id) {
      res = await manageUpdateMessage(editingMsg.value.id, {
        content: msgForm.value.content,
        response: msgForm.value.response,
        role: msgForm.value.role,
        year: msgForm.value.year
      })
    } else {
      res = await manageCreateMessage({
        userType: msgForm.value.userType,
        userId: msgForm.value.userId || undefined,
        adminId: msgForm.value.adminId ? Number(msgForm.value.adminId) : undefined,
        sessionId: msgForm.value.sessionId ? Number(msgForm.value.sessionId) : undefined,
        content: msgForm.value.content,
        response: msgForm.value.response,
        role: msgForm.value.role,
        year: msgForm.value.year
      })
    }
    if (res.code === 200) {
      ElMessage.success('保存成功')
      msgDialogVisible.value = false
      loadMessages()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  } finally {
    savingMsg.value = false
  }
}

const removeMessage = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除消息 #${row.id}？`, '提示', { type: 'warning' })
    const res = await deleteChatMessage(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadMessages()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // cancel
  }
}

const renameSessionRow = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新标题', '重命名会话', {
      inputValue: row.title || '新对话'
    })
    if (!value?.trim()) return
    const res = await renameAiSession(row.sessionKey, {
      userRole: row.userType,
      userId: row.userId,
      adminId: row.adminId,
      title: value.trim()
    })
    if (res.code === 200) {
      ElMessage.success('已重命名')
      loadSessions()
    } else {
      ElMessage.error(res.message || '重命名失败')
    }
  } catch {
    // cancel
  }
}

const viewSessionMessages = (row) => {
  activeTab.value = 'messages'
  msgFilter.value.keyword = ''
  msgFilter.value.userType = row.userType || ''
  msgFilter.value.sessionId = row.id
  msgPage.value.page = 1
  loadMessages().then(() => {
    ElMessage.success(`已加载会话「${row.title || row.id}」的消息`)
  })
}

const removeSessionRow = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定删除会话「${row.title || row.id}」？将同时清除该会话记忆与消息。`,
      '提示',
      { type: 'warning' }
    )
    const res = await deleteAiSession(row.sessionKey, {
      userType: row.userType,
      userId: row.userId,
      adminId: row.adminId,
      clearMemory: true
    })
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadSessions()
      loadMessages()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // cancel
  }
}

onMounted(() => {
  loadMessages()
  loadSessions()
})
</script>

<style scoped>
.history-page {
  padding: 8px 4px 20px;
}
.page-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
  color: #2d5a7a;
  line-height: 1.35;
}
.page-header p {
  margin: 0 0 16px;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 400;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.preview-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.preview-time {
  font-size: 12px;
  color: #909399;
}
.preview-block h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #606266;
}
.preview-bubble {
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}
.preview-bubble.is-user {
  background: #3d5a80;
  color: #fff;
}
.preview-bubble.is-ai {
  background: #f1f3f6;
  border: 1px solid #e5e7eb;
  color: #1a1d24;
}
</style>
