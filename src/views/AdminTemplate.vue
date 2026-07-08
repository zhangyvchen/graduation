<template>
  <div class="template-page">
    <header class="content-header">
      <h2>报告模板配置</h2>
      <el-button type="primary" @click="handleAdd">新增模板</el-button>
    </header>
    
    <div class="template-list">
      <el-card v-for="template in templateList" :key="template.id" class="template-card">
        <div class="template-header">
          <div class="template-info">
            <h3>{{ template.name }}</h3>
            <span class="template-type">{{ template.type === 'full' ? '完整版' : template.type === 'simple' ? '精简版' : '就业分析版' }}</span>
          </div>
          <div class="template-status">
            <el-tag :type="template.status === 'active' ? 'success' : 'info'">
              {{ template.status === 'active' ? '启用' : '停用' }}
            </el-tag>
            <el-tag v-if="template.isDefault" type="warning">默认模板</el-tag>
          </div>
        </div>
        
        <div class="template-description">
          {{ template.description }}
        </div>
        
        <div class="template-sections">
          <el-tag v-for="section in template.sections" :key="section" size="small" type="info">{{ section }}</el-tag>
        </div>
        
        <div class="template-actions">
          <el-button size="small" @click="handlePreview(template)">预览</el-button>
          <el-button size="small" @click="handleEdit(template)">编辑</el-button>
          <el-button size="small" @click="handleToggle(template)">
            {{ template.status === 'active' ? '停用' : '启用' }}
          </el-button>
          <el-button size="small" @click="handleSetDefault(template)" :disabled="template.isDefault">
            {{ template.isDefault ? '已设为默认' : '设为默认' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(template.id)" :disabled="template.isDefault">删除</el-button>
        </div>
      </el-card>
    </div>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="700px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="formData.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="formData.type" placeholder="选择模板类型">
            <el-option label="完整版" value="full" />
            <el-option label="精简版" value="simple" />
            <el-option label="就业分析版" value="employment" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入模板描述" />
        </el-form-item>
        <el-form-item label="包含章节">
          <el-checkbox-group v-model="formData.sections">
            <el-checkbox label="基本信息" />
            <el-checkbox label="成长轨迹" />
            <el-checkbox label="学习画像" />
            <el-checkbox label="就业去向" />
            <el-checkbox label="综合素质" />
            <el-checkbox label="未来建议" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input v-model="formData.content" type="textarea" :rows="10" placeholder="请输入模板内容，支持占位符如 {{studentId}}, {{name}} 等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="previewVisible" title="模板预览" width="800px">
      <div class="preview-content">
        <div class="preview-header">
          <h2>{{ previewTemplate.name }}</h2>
          <p>类型：{{ previewTemplate.type === 'full' ? '完整版' : previewTemplate.type === 'simple' ? '精简版' : '就业分析版' }}</p>
        </div>
        <div class="preview-body">
          <div v-for="(section, index) in previewTemplate.sections" :key="index" class="preview-section">
            <h3>{{ section }}</h3>
            <p class="placeholder-text">此处为{{ section }}内容区域</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const templateList = ref([
  {
    id: 1,
    name: '标准版个人发展报告',
    type: 'full',
    description: '包含学生在校期间的完整信息，适合全面展示个人发展情况',
    sections: ['基本信息', '成长轨迹', '学习画像', '就业去向', '综合素质', '未来建议'],
    content: '个人发展报告\n学号：{{studentId}}\n姓名：{{name}}\n班级：{{className}}\n...',
    status: 'active',
    isDefault: true
  },
  {
    id: 2,
    name: '精简版报告',
    type: 'simple',
    description: '精简版报告，包含核心信息，适合快速浏览',
    sections: ['基本信息', '学习画像', '就业去向'],
    content: '个人发展报告（精简版）\n学号：{{studentId}}\n姓名：{{name}}\n...',
    status: 'active',
    isDefault: false
  },
  {
    id: 3,
    name: '就业分析报告',
    type: 'employment',
    description: '专注于就业数据的分析报告，适合招聘和就业指导使用',
    sections: ['基本信息', '就业去向', '综合素质', '未来建议'],
    content: '就业分析报告\n学号：{{studentId}}\n姓名：{{name}}\n就业状态：{{employmentStatus}}\n...',
    status: 'inactive',
    isDefault: false
  }
])

const dialogVisible = ref(false)
const previewVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  name: '',
  type: 'full',
  description: '',
  sections: [],
  content: ''
})

const previewTemplate = ref({})

const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    name: '',
    type: 'full',
    description: '',
    sections: [],
    content: ''
  }
  dialogVisible.value = true
}

const handleEdit = (template) => {
  isEdit.value = true
  formData.value = { ...template }
  dialogVisible.value = true
}

const handlePreview = (template) => {
  previewTemplate.value = template
  previewVisible.value = true
}

const handleToggle = (template) => {
  template.status = template.status === 'active' ? 'inactive' : 'active'
}

const handleSetDefault = (template) => {
  templateList.value.forEach(item => {
    item.isDefault = item.id === template.id
  })
}

const handleDelete = (id) => {
  if (confirm('确定删除该模板？')) {
    templateList.value = templateList.value.filter(item => item.id !== id)
  }
}

const handleSubmit = () => {
  if (!formData.value.name) {
    alert('请填写模板名称')
    return
  }
  
  if (isEdit.value) {
    const index = templateList.value.findIndex(item => item.id === formData.value.id)
    if (index !== -1) {
      templateList.value[index] = { ...formData.value }
    }
  } else {
    formData.value.id = Date.now()
    formData.value.status = 'active'
    formData.value.isDefault = false
    templateList.value.unshift({ ...formData.value })
  }
  
  dialogVisible.value = false
}
</script>

<style scoped>
.template-page {
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.template-card {
  padding: 20px;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.template-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.template-type {
  font-size: 12px;
  color: #667eea;
}

.template-status {
  display: flex;
  gap: 8px;
}

.template-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.template-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.template-actions {
  display: flex;
  gap: 8px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.preview-content {
  padding: 20px;
}

.preview-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #667eea;
}

.preview-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.preview-header p {
  color: #666;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-section h3 {
  font-size: 16px;
  color: #333;
  padding-left: 10px;
  border-left: 4px solid #667eea;
  margin-bottom: 10px;
}

.placeholder-text {
  color: #999;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}
</style>