<template>
  <div class="message-page">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header><span>✏️ 撰写留言</span></template>
          <el-form :model="form" label-width="80px">
            <el-form-item label="留言内容">
              <el-input v-model="form.content" type="textarea" :rows="6" maxlength="200" show-word-limit placeholder="请输入留言内容..." />
            </el-form-item>
            <el-form-item label="署名">
              <el-radio-group v-model="form.isAnonymous">
                <el-radio :label="0">实名</el-radio>
                <el-radio :label="1">匿名</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="公开性">
              <el-radio-group v-model="form.visibility">
                <el-radio :label="0">公开（展示在尾页）</el-radio>
                <el-radio :label="1">仅管理员可见</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submit" :loading="submitting">提交留言</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="hover">
          <template #header><span>💡 留言须知</span></template>
          <ul class="tips">
            <li>留言提交后需要管理员审核</li>
            <li>审核通过后将展示在"校友寄语"模块</li>
            <li>请勿发表不当言论</li>
            <li>支持匿名留言,保护您的隐私</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" style="margin-top: 20px">
      <template #header><span>📜 我的留言历史</span></template>
      <el-empty v-if="messages.length === 0" description="暂无留言" />
      <div v-else>
        <div v-for="msg in messages" :key="msg.id" class="message-item">
          <div class="msg-header">
            <span class="msg-name">{{ msg.displayName }}</span>
            <span class="msg-time">{{ formatDate(msg.createdAt) }}</span>
            <el-tag :type="msg.status === 1 ? 'success' : msg.status === 2 ? 'danger' : 'info'" size="small">
              {{ msg.statusText }}
            </el-tag>
          </div>
          <p class="msg-content">{{ msg.content }}</p>
          <p v-if="msg.reviewRemark" class="msg-review">审核备注: {{ msg.reviewRemark }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { submitMessage, getMyMessages } from '@/api/student'

const form = ref({ content: '', isAnonymous: 0, visibility: 0 })
const messages = ref([])
const submitting = ref(false)

const loadMessages = async () => {
  const res = await getMyMessages()
  if (res.code === 200) messages.value = res.data
}

const submit = async () => {
  if (!form.value.content.trim()) return ElMessage.warning('请输入留言内容')
  if (form.value.content.length > 200) return ElMessage.warning('留言不能超过200字')
  submitting.value = true
  try {
    const res = await submitMessage(form.value)
    if (res.code === 200) {
      ElMessage.success(res.message)
      form.value = { content: '', isAnonymous: 0, visibility: 0 }
      loadMessages()
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    submitting.value = false
  }
}

const formatDate = (d) => d ? d.substring(0, 16).replace('T', ' ') : ''

onMounted(loadMessages)
</script>

<style scoped>
.message-page { }
.tips { padding-left: 20px; color: #606266; line-height: 2; }
.message-item { padding: 16px 0; border-bottom: 1px solid #ebeef5; }
.message-item:last-child { border-bottom: none; }
.msg-header { display: flex; align-items: center; gap: 12px; }
.msg-name { font-weight: bold; }
.msg-time { color: #909399; font-size: 13px; }
.msg-content { margin: 8px 0; line-height: 1.6; }
.msg-review { color: #f56c6c; font-size: 13px; margin: 4px 0 0 0; }
</style>
