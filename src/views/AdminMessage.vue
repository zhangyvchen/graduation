<template>
  <div class="admin-message">
    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="⏳ 待审核" :value="0" />
            <el-option label="✅ 已通过" :value="1" />
            <el-option label="❌ 已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="公开性">
          <el-select v-model="filters.visibility" placeholder="全部" clearable style="width: 160px">
            <el-option label="公开（展示在尾页）" :value="0" />
            <el-option label="仅管理员可见" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="filters.studentId" placeholder="按学号搜索" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filters.studentName" placeholder="按姓名搜索" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="filters.keyword" placeholder="按留言内容搜索" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="'Search'">查询</el-button>
          <el-button @click="handleReset" :icon="'Refresh'">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>💬 校友寄语审核（共 {{ total }} 条，待审核 {{ pendingCount }} 条）</span>
        </div>
      </template>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="studentId" label="学号" width="130" />
        <el-table-column prop="studentName" label="姓名" width="100">
          <template #default="{ row }">
            <span v-if="row.isAnonymous === 1" class="anon">匿名</span>
            <span v-else>{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="留言内容" min-width="280">
          <template #default="{ row }">
            <div class="msg-content">{{ row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="visibility" label="公开性" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visibility === 0 ? 'success' : 'info'" size="small">
              {{ row.visibility === 0 ? '公开' : '仅管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
              {{ row.status === 0 ? '⏳ 待审核' : row.status === 1 ? '✅ 已通过' : '❌ 已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="160">
          <template #default="{ row }">
            <span v-if="row.reviewRemark" class="remark">{{ row.reviewRemark }}</span>
            <span v-else class="empty">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" size="small" @click="openReview(row, 1)">通过</el-button>
              <el-button type="danger" size="small" @click="openReview(row, 2)">拒绝</el-button>
            </template>
            <template v-else>
              <el-button type="primary" size="small" plain @click="openReview(row, row.status === 1 ? 2 : 1)">
                改为{{ row.status === 1 ? '拒绝' : '通过' }}
              </el-button>
            </template>
            <el-popconfirm
                title="确认删除此条留言？删除后不可恢复。"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" size="small" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
            v-model:current-page="pageNum"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadData"
            @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog
        v-model="reviewDialog.visible"
        :title="reviewDialog.title"
        width="500px"
        :close-on-click-modal="false"
    >
      <el-form :model="reviewDialog.form" label-width="80px">
        <el-form-item label="留言内容">
          <div class="dialog-content">{{ reviewDialog.content }}</div>
        </el-form-item>
        <el-form-item :label="reviewDialog.status === 1 ? '通过备注' : '拒绝理由'">
          <el-input
              v-model="reviewDialog.form.reviewRemark"
              type="textarea"
              :rows="3"
              :placeholder="reviewDialog.status === 1 ? '（可选）' : '请填写拒绝理由，将展示给提交者'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialog.visible = false">取消</el-button>
        <el-button
            :type="reviewDialog.status === 1 ? 'success' : 'danger'"
            @click="submitReview"
        >确认{{ reviewDialog.status === 1 ? '通过' : '拒绝' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMessagePage,
  getPendingMessageCount,
  reviewMessage,
  deleteMessage
} from '@/api/admin'

const filters = ref({
  status: null,
  visibility: null,
  studentId: '',
  studentName: '',
  keyword: ''
})
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const pendingCount = ref(0)
const rows = ref([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMessagePage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...filters.value
    })
    if (res.code === 200) {
      rows.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

const loadPendingCount = async () => {
  try {
    const res = await getPendingMessageCount()
    if (res.code === 200) pendingCount.value = res.data
  } catch (e) { /* 忽略 */ }
}

const handleSearch = () => {
  pageNum.value = 1
  loadData()
}

const handleReset = () => {
  filters.value = { status: null, visibility: null, studentId: '', studentName: '', keyword: '' }
  pageNum.value = 1
  loadData()
}

const reviewDialog = reactive({
  visible: false,
  title: '',
  status: 1,
  content: '',
  form: { id: null, reviewRemark: '', status: 1, adminId: null, adminName: '' }
})

const openReview = (row, status) => {
  reviewDialog.visible = true
  reviewDialog.status = status
  reviewDialog.content = row.content
  reviewDialog.title = status === 1 ? '审核通过' : '审核拒绝'
  // 切换审核状态时清空原备注，避免复用"通过"时的备注
  reviewDialog.form = {
    id: row.id,
    status,
    reviewRemark: '',
    adminId: null,
    adminName: ''
  }
}

const submitReview = async () => {
  if (reviewDialog.status === 2 && !reviewDialog.form.reviewRemark.trim()) {
    ElMessage.warning('拒绝时必须填写理由')
    return
  }
  try {
    const res = await reviewMessage(reviewDialog.form)
    if (res.code === 200) {
      ElMessage.success(reviewDialog.status === 1 ? '已通过' : '已拒绝')
      reviewDialog.visible = false
      loadData()
      loadPendingCount()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const handleDelete = async (row) => {
  try {
    const res = await deleteMessage(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadData()
      loadPendingCount()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const formatDate = (d) => d ? d.substring(0, 19).replace('T', ' ') : ''

onMounted(() => {
  loadData()
  loadPendingCount()
})
</script>

<style scoped>
.admin-message { padding: 0; }
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.msg-content { line-height: 1.5; color: #303133; word-break: break-all; }
.anon { color: #909399; font-style: italic; }
.time-text { color: #606266; font-size: 13px; }
.remark { color: #f56c6c; font-size: 13px; }
.empty { color: #c0c4cc; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.dialog-content {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #303133;
  line-height: 1.6;
  max-height: 160px;
  overflow-y: auto;
}
</style>
