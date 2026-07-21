<template>
  <div class="permission-page">
    <div class="page-header">
      <h2>管理员权限管理</h2>
    </div>
    <div class="top-bar">
      <el-button type="primary" @click="showAdminDialog = true">新增管理员</el-button>
    </div>
    <el-table :data="adminList" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色" width="140">
        <template #default="{ row }">
          <el-tag :type="row.role === 'ADMIN' ? 'primary' : 'success'">
            {{ row.role === 'ADMIN' ? '超级管理员' : '协助管理员' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="editAdmin(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="assignAdminPermissions(row)" v-if="row.role !== 'ADMIN'">分配权限</el-button>
          <el-button size="small" type="danger" @click="handleDeleteAdmin(row)" v-if="row.id !== currentAdminId">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新增管理员" v-model="showAdminDialog" width="400px">
      <el-form :model="adminForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="adminForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" v-if="!adminForm.id">
          <el-input v-model="adminForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="adminForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="adminForm.role" placeholder="请选择角色">
            <el-option label="超级管理员" value="ADMIN" />
            <el-option label="协助管理员" value="ASSISTANT" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdminDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAdmin">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="'分配权限 - ' + currentAdminName" v-model="showAdminPermissionDialog" width="500px">
      <div class="permission-tree">
        <div v-for="(permissions, module) in groupedPermissions" :key="module" class="permission-group">
          <div class="group-title">{{ moduleNames[module] || module }}</div>
          <div class="permission-items">
            <el-checkbox-group v-model="selectedAdminPermissionIds">
              <el-checkbox v-for="perm in permissions" :key="perm.id" :value="perm.id">
                {{ perm.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAdminPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAdminPermissions">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuth } from '../stores/auth'
import { 
  getAdminList, saveAdmin, updateAdmin, deleteAdmin,
  getPermissionList,
  getAdminPermissionIds,
  saveAdminPermissions
} from '../api/admin'

const auth = useAuth()

const adminList = ref([])
const permissionList = ref([])

const showAdminDialog = ref(false)
const showAdminPermissionDialog = ref(false)

const adminForm = ref({
  id: null,
  username: '',
  password: '',
  name: '',
  role: 'ASSISTANT'
})

const currentAdminId = ref(null)
const currentAdminName = ref('')
const selectedAdminPermissionIds = ref([])

const currentAdminIdGlobal = computed(() => auth.state.user?.id)

const moduleNames = {
  'dashboard': '管理首页',
  'student': '学生管理',
  'batch': '批次管理',
  'message': '留言审核',
  'template': '报告模板',
  'verify': '核销管理',
  'statistics': '数据统计',
  'import': '数据导入',
  'ai': 'AI助手',
  'admin': '管理员管理',
  'permission': '权限管理'
}

const groupedPermissions = computed(() => {
  const groups = {}
  permissionList.value.forEach(perm => {
    if (!groups[perm.module]) {
      groups[perm.module] = []
    }
    groups[perm.module].push(perm)
  })
  return groups
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fetchAdminList = async () => {
  try {
    const res = await getAdminList()
    if (res.code === 200) {
      adminList.value = res.data
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error)
  }
}

const fetchPermissionList = async () => {
  try {
    const res = await getPermissionList()
    if (res.code === 200) {
      permissionList.value = res.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}

const handleSaveAdmin = async () => {
  if (!adminForm.value.username || !adminForm.value.name) {
    ElMessage.error('请填写完整信息')
    return
  }
  if (!adminForm.value.id && !adminForm.value.password) {
    ElMessage.error('请输入密码')
    return
  }
  try {
    if (adminForm.value.id) {
      await updateAdmin(adminForm.value)
      ElMessage.success('管理员更新成功')
    } else {
      await saveAdmin(adminForm.value)
      ElMessage.success('管理员新增成功')
    }
    showAdminDialog.value = false
    adminForm.value = { id: null, username: '', password: '', name: '', role: 'ASSISTANT' }
    fetchAdminList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const editAdmin = (row) => {
  adminForm.value = { ...row, password: '' }
  showAdminDialog.value = true
}

const handleDeleteAdmin = async (row) => {
  if (!confirm(`确定要删除管理员 ${row.name} 吗？`)) return
  try {
    await deleteAdmin(row.id)
    ElMessage.success('删除成功')
    fetchAdminList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const assignAdminPermissions = async (row) => {
  currentAdminId.value = row.id
  currentAdminName.value = row.name
  selectedAdminPermissionIds.value = []
  showAdminPermissionDialog.value = false
  
  await nextTick()
  showAdminPermissionDialog.value = true
  
  try {
    const res = await getAdminPermissionIds(row.id)
    if (res.code === 200) {
      selectedAdminPermissionIds.value = (res.data || []).map(id => Number(id))
    }
  } catch (error) {
    console.error('获取管理员权限失败:', error)
    selectedAdminPermissionIds.value = []
  }
}

const handleSaveAdminPermissions = async () => {
  try {
    const res = await saveAdminPermissions(currentAdminId.value, { permissionIds: selectedAdminPermissionIds.value })
    if (res.code === 200) {
      ElMessage.success('权限分配成功')
      showAdminPermissionDialog.value = false
    } else {
      ElMessage.error(res.msg || '权限分配失败')
    }
  } catch (error) {
    ElMessage.error('权限分配失败')
    console.error(error)
  }
}

onMounted(() => {
  fetchAdminList()
  fetchPermissionList()
})
</script>

<style scoped>
.permission-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  color: #2D5A7A;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.top-bar :deep(.el-button--primary) {
  background: #B6DDDC;
  border-color: #B6DDDC;
  color: #2D5A7A;
}

.top-bar :deep(.el-button--primary:hover) {
  background: #A3D4D2;
  border-color: #A3D4D2;
}

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
}

.permission-group {
  margin-bottom: 20px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.group-title {
  font-weight: 600;
  color: #2D5A7A;
  margin-bottom: 12px;
  font-size: 14px;
}

.permission-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.el-checkbox {
  margin-bottom: 0;
}

:deep(.el-button--primary) {
  background: #B6DDDC;
  border-color: #B6DDDC;
  color: #2D5A7A;
}

:deep(.el-button--primary:hover) {
  background: #A3D4D2;
  border-color: #A3D4D2;
}

:deep(.el-tag--primary) {
  background: rgba(182, 221, 220, 0.3);
  border-color: #B6DDDC;
  color: #2D5A7A;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  transform: rotate(180deg);
  color: #F56C6C;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
