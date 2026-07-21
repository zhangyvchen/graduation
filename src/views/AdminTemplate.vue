<template>
  <div class="template-page">
    <div class="floating-bg">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="circle circle-4"></div>
      <div class="circle circle-5"></div>
    </div>
    
    <header class="content-header">
      <div class="header-info">
        <div class="header-badge">✨</div>
        <h2>报告模板工坊</h2>
        <p class="header-desc">打造独一无二的毕业报告风格</p>
      </div>
      <el-button type="primary" @click="handleAdd" class="add-btn">
        <span>✨</span>
        <span>创意新增</span>
      </el-button>
    </header>
    
    <div class="template-list">
      <el-card v-for="(template, index) in templateList" :key="template.id" class="template-card" :class="template.type" :style="{ animationDelay: index * 0.1 + 's' }">
        <div class="card-decoration">
          <div class="ribbon" :class="template.type">
            <span v-if="template.isDefault">⭐</span>
            <span>{{ template.isDefault ? '精选' : '' }}</span>
          </div>
          <div class="floating-icon" :class="template.type">
            <span v-if="template.type === 'full'">👑</span>
            <span v-else-if="template.type === 'simple'">✨</span>
            <span v-else>🚀</span>
          </div>
        </div>
        
        <div class="template-header">
          <div class="template-icon" :class="template.type">
            <span v-if="template.type === 'full'">📄</span>
            <span v-else-if="template.type === 'simple'">📝</span>
            <span v-else>📊</span>
          </div>
          <div class="template-info">
            <h3>{{ template.name }}</h3>
            <div class="template-tags">
              <span class="template-type" :class="template.type">
                {{ template.type === 'full' ? '🌟 完整版' : template.type === 'simple' ? '🍃 精简版' : '🚀 就业版' }}
              </span>
              <span class="template-status-tag" :class="template.status">
                {{ template.status === 'active' ? '▶️ 运行中' : '⏸️ 已暂停' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="template-description">
          <div class="description-icon">
            <span>ℹ️</span>
          </div>
          <p>{{ template.description }}</p>
        </div>
        
        <div class="template-sections">
          <div class="sections-label">
            <span>📋</span>
            章节概览
          </div>
          <div class="sections-chips">
            <span v-for="section in template.sections" :key="section" class="section-chip" :class="getSectionColor(section)">
              {{ getSectionIcon(section) }} {{ section }}
            </span>
          </div>
        </div>
        
        <div class="template-actions">
          <el-button size="small" @click="handlePreview(template)" class="action-btn preview-btn">
            <span>👁️</span>
            <span>预览</span>
          </el-button>
          <el-button size="small" @click="handleEdit(template)" class="action-btn edit-btn">
            <span>✏️</span>
            <span>编辑</span>
          </el-button>
          <el-button size="small" @click="handleToggle(template)" class="action-btn toggle-btn" :class="template.status">
            <span>🔄</span>
            <span>{{ template.status === 'active' ? '暂停' : '启用' }}</span>
          </el-button>
          <el-button size="small" @click="handleSetDefault(template)" :disabled="template.isDefault" class="action-btn default-btn" :class="{ disabled: template.isDefault }">
            <span>⭐</span>
            <span>{{ template.isDefault ? '精选' : '设精选' }}</span>
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(template.id)" :disabled="template.isDefault" class="action-btn delete-btn">
            <span>🗑️</span>
            <span>删除</span>
          </el-button>
        </div>
      </el-card>
    </div>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '✨ 新增创意模板'" width="800px" class="template-dialog">
      <div class="dialog-decoration">
        <div class="star star-1">⭐</div>
        <div class="star star-2">🌟</div>
        <div class="star star-3">✨</div>
      </div>
      <el-form :model="formData" label-width="130px" class="template-form">
        <el-form-item label="模板名称" required>
          <div class="input-with-icon">
            <span class="input-icon">🎨</span>
            <el-input v-model="formData.name" placeholder="给你的模板起个酷名字" size="large" />
          </div>
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="formData.type" placeholder="选择模板风格" size="large">
            <el-option label="🌟 完整版 - 内容丰富全面" value="full" />
            <el-option label="🍃 精简版 - 简洁清新" value="simple" />
            <el-option label="🚀 就业版 - 专业职场风" value="employment" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="描述一下这个模板的特点..." />
        </el-form-item>
        <el-form-item label="包含章节">
          <el-checkbox-group v-model="formData.sections" class="sections-group">
            <el-checkbox label="基本信息">👤 基本信息</el-checkbox>
            <el-checkbox label="成长轨迹">📈 成长轨迹</el-checkbox>
            <el-checkbox label="学习画像">📚 学习画像</el-checkbox>
            <el-checkbox label="就业去向">💼 就业去向</el-checkbox>
            <el-checkbox label="综合素质">🏆 综合素质</el-checkbox>
            <el-checkbox label="未来建议">💡 未来建议</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input v-model="formData.content" type="textarea" :rows="8" placeholder="编写报告模板内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="footer-btn cancel-btn">取消</el-button>
        <el-button type="primary" @click="handleSubmit" class="footer-btn confirm-btn">
            <span>✅</span>
            <span>确认保存</span>
          </el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="previewVisible" title="🎨 模板预览" width="900px" class="preview-dialog">
      <div class="preview-content">
        <div class="preview-header" :class="previewTemplate.type">
          <div class="preview-icon" :class="previewTemplate.type">
            <span v-if="previewTemplate.type === 'full'">📄</span>
            <span v-else-if="previewTemplate.type === 'simple'">📝</span>
            <span v-else>📊</span>
          </div>
          <h2>{{ previewTemplate.name }}</h2>
          <p>风格：{{ previewTemplate.type === 'full' ? '🌟 完整版' : previewTemplate.type === 'simple' ? '🍃 精简版' : '🚀 就业分析版' }}</p>
          <div v-if="previewTemplate.isDefault" class="default-badge">
            <span>👑</span>
            <span>官方精选</span>
          </div>
        </div>
        
        <div class="preview-body">
          <div v-for="(section, index) in previewTemplate.sections" :key="index" class="preview-section" :class="getSectionBg(section)">
            <div class="section-icon-wrapper">
              <span v-if="section === '基本信息'">👤</span>
              <span v-else-if="section === '成长轨迹'">📈</span>
              <span v-else-if="section === '学习画像'">📚</span>
              <span v-else-if="section === '就业去向'">💼</span>
              <span v-else-if="section === '综合素质'">🏆</span>
              <span v-else>💡</span>
            </div>
            <div class="section-content">
              <h3>{{ section }}</h3>
              <div class="section-lines">
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="preview-footer">
          <div class="footer-decoration">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>
          <p>报告仅供参考，如有疑问请联系学院</p>
          <div class="footer-date">生成时间：{{ new Date().toLocaleDateString('zh-CN') }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false" class="footer-btn">关闭预览</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTemplateList, saveTemplate, updateTemplate, deleteTemplate, setDefaultTemplate, toggleTemplateStatus } from '../api/template'

const getSectionColor = (section) => {
  const colors = {
    '基本信息': 'info',
    '成长轨迹': 'success',
    '学习画像': 'warning',
    '就业去向': 'primary',
    '综合素质': 'danger',
    '未来建议': 'purple'
  }
  return colors[section] || 'info'
}

const getSectionIcon = (section) => {
  const icons = {
    '基本信息': '👤',
    '成长轨迹': '📈',
    '学习画像': '📚',
    '就业去向': '💼',
    '综合素质': '🏆',
    '未来建议': '💡'
  }
  return icons[section] || '📄'
}

const getSectionBg = (section) => {
  const bgs = {
    '基本信息': 'bg-info',
    '成长轨迹': 'bg-success',
    '学习画像': 'bg-warning',
    '就业去向': 'bg-primary',
    '综合素质': 'bg-danger',
    '未来建议': 'bg-purple'
  }
  return bgs[section] || 'bg-info'
}

const templateList = ref([])

const fetchTemplates = async () => {
  try {
    console.log('开始获取模板列表...')
    const res = await getTemplateList({ all: true })
    console.log('模板列表响应:', res)
    if (res.code === 200) {
      templateList.value = (res.data || []).map(template => ({
        ...template,
        sections: template.sections ? JSON.parse(template.sections) : [],
        status: template.status === 'ENABLED' || template.status === 'active' ? 'active' : 'inactive'
      }))
      console.log('模板列表处理后:', templateList.value)
    } else {
      console.error('获取模板列表失败，code:', res.code)
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

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
const loadingMap = ref({})

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
  let sections = []
  if (template.sections) {
    if (Array.isArray(template.sections)) {
      sections = [...template.sections]
    } else if (typeof template.sections === 'string') {
      try {
        sections = JSON.parse(template.sections)
      } catch {
        sections = template.sections.split(',').filter(s => s.trim())
      }
    }
  }
  formData.value = {
    ...template,
    sections
  }
  dialogVisible.value = true
}

const handlePreview = (template) => {
  previewTemplate.value = template
  previewVisible.value = true
}

const handleToggle = async (template) => {
  loadingMap.value[template.id] = true
  try {
    const res = await toggleTemplateStatus(template.id)
    console.log('toggle response:', res)
    if (res.code === 200) {
      await fetchTemplates()
    } else {
      alert('操作失败: ' + (res.message || '未知错误'))
    }
  } catch (error) {
    console.error('切换模板状态失败:', error)
    alert('操作失败，请检查控制台')
  } finally {
    loadingMap.value[template.id] = false
  }
}

const handleSetDefault = async (template) => {
  loadingMap.value[template.id] = true
  try {
    const res = await setDefaultTemplate(template.id)
    console.log('setDefault response:', res)
    if (res.code === 200) {
      await fetchTemplates()
    } else {
      alert('操作失败: ' + (res.message || '未知错误'))
    }
  } catch (error) {
    console.error('设置精选模板失败:', error)
    alert('操作失败，请检查控制台')
  } finally {
    loadingMap.value[template.id] = false
  }
}

const handleDelete = async (id) => {
  if (confirm('确定删除该模板？')) {
    try {
      await deleteTemplate(id)
      templateList.value = templateList.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('删除模板失败:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!formData.value.name) {
    alert('请填写模板名称')
    return
  }
  
  try {
    const submitData = {
      ...formData.value,
      sections: JSON.stringify(formData.value.sections || []),
      status: formData.value.status === 'active' ? 'ENABLED' : 'DISABLED'
    }
    
    if (isEdit.value) {
      await updateTemplate(submitData)
      await fetchTemplates()
    } else {
      submitData.status = 'ENABLED'
      submitData.isDefault = false
      await saveTemplate(submitData)
      await fetchTemplates()
    }
    dialogVisible.value = false
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.template-page {
  padding: 40px 30px;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 40%, #e8f5e9 70%, #fce4ec 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.floating-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  animation: float 15s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #ffcdd2 0%, transparent 70%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #c8e6c9 0%, transparent 70%);
  bottom: -50px;
  right: -50px;
  animation-delay: -5s;
}

.circle-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #fff9c4 0%, transparent 70%);
  top: 50%;
  left: 20%;
  animation-delay: -10s;
}

.circle-4 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #e1bee7 0%, transparent 70%);
  top: 20%;
  right: 30%;
  animation-delay: -3s;
}

.circle-5 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, #b3e5fc 0%, transparent 70%);
  bottom: 30%;
  left: 50%;
  animation-delay: -8s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(50px, -50px) scale(1.1); }
  50% { transform: translate(-30px, 30px) scale(0.9); }
  75% { transform: translate(40px, 20px) scale(1.05); }
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-badge {
  font-size: 32px;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.header-info h2 {
  margin: 0;
  font-size: 28px;
  color: #2d3748;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-desc {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #718096;
}

.add-btn {
  padding: 14px 28px;
  font-size: 15px;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.add-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  color: #fff;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 28px;
  position: relative;
  z-index: 1;
}

.template-card {
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.template-card.full::before {
  background: linear-gradient(90deg, #667eea, #a29bfe);
}

.template-card.simple::before {
  background: linear-gradient(90deg, #4ecdc4, #44a08d);
}

.template-card.employment::before {
  background: linear-gradient(90deg, #ff6b6b, #fd79a8);
}

.template-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 36px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.2);
}

.card-decoration {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  pointer-events: none;
}

.ribbon {
  position: absolute;
  top: 10px;
  right: -50px;
  width: 120px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  transform: rotate(45deg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.ribbon.full {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ribbon.simple {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.ribbon.employment {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.floating-icon {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: floatIcon 3s infinite ease-in-out;
}

.floating-icon.full {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.floating-icon.simple {
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.floating-icon.employment {
  background: rgba(255, 154, 158, 0.1);
  color: #ff9a9e;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.template-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.template-icon {
  margin-right: 20px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
  transition: all 0.3s ease;
}

.template-card:hover .template-icon {
  transform: scale(1.1);
}

.template-icon.full {
  color: #667eea;
}

.template-icon.simple {
  color: #4ecdc4;
}

.template-icon.employment {
  color: #ff9a9e;
}

.template-info {
  flex: 1;
}

.template-info h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #2d3748;
  font-weight: 600;
}

.template-tags {
  display: flex;
  gap: 10px;
}

.template-type {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 500;
}

.template-type.full {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.template-type.simple {
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.template-type.employment {
  background: rgba(255, 154, 158, 0.1);
  color: #ff9a9e;
}

.template-status-tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 500;
}

.template-status-tag.active {
  background: rgba(78, 205, 196, 0.15);
  color: #4ecdc4;
}

.template-status-tag.inactive {
  background: rgba(203, 213, 224, 0.3);
  color: #94a3b8;
}

.template-description {
  font-size: 14px;
  color: #718096;
  margin-bottom: 20px;
  line-height: 1.7;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.description-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  flex-shrink: 0;
}

.template-description p {
  margin: 0;
}

.template-sections {
  margin-bottom: 24px;
}

.sections-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sections-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.section-chip {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.section-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-chip.info {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.15);
}

.section-chip.success {
  background: rgba(78, 205, 196, 0.08);
  color: #10b981;
  border-color: rgba(78, 205, 196, 0.15);
}

.section-chip.warning {
  background: rgba(251, 191, 36, 0.08);
  color: #f59e0b;
  border-color: rgba(251, 191, 36, 0.15);
}

.section-chip.primary {
  background: rgba(139, 92, 246, 0.08);
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.15);
}

.section-chip.danger {
  background: rgba(255, 154, 158, 0.08);
  color: #ef4444;
  border-color: rgba(255, 154, 158, 0.15);
}

.section-chip.purple {
  background: rgba(168, 85, 247, 0.08);
  color: #a855f7;
  border-color: rgba(168, 85, 247, 0.15);
}

.template-actions {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px dashed rgba(203, 213, 224, 0.5);
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.preview-btn {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}

.preview-btn:hover {
  background: rgba(59, 130, 246, 0.15);
}

.edit-btn {
  background: rgba(78, 205, 196, 0.08);
  color: #10b981;
  border-color: rgba(78, 205, 196, 0.2);
}

.edit-btn:hover {
  background: rgba(78, 205, 196, 0.15);
}

.toggle-btn.active {
  background: rgba(251, 191, 36, 0.08);
  color: #f59e0b;
  border-color: rgba(251, 191, 36, 0.2);
}

.toggle-btn.inactive {
  background: rgba(78, 205, 196, 0.08);
  color: #10b981;
  border-color: rgba(78, 205, 196, 0.2);
}

.default-btn {
  background: rgba(251, 191, 36, 0.08);
  color: #f59e0b;
  border-color: rgba(251, 191, 36, 0.2);
}

.default-btn.disabled {
  background: rgba(203, 213, 224, 0.2);
  color: #94a3b8;
  border-color: rgba(203, 213, 224, 0.3);
  cursor: not-allowed;
}

.delete-btn {
  background: rgba(255, 154, 158, 0.08);
  color: #ef4444;
  border-color: rgba(255, 154, 158, 0.2);
}

.delete-btn:hover {
  background: rgba(255, 154, 158, 0.15);
}

.template-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.template-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #fdfbfb 0%, #f5f5f5 100%);
  padding: 24px 32px;
  border-bottom: 1px solid rgba(203, 213, 224, 0.5);
}

.template-dialog :deep(.el-dialog__title) {
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
}

.template-dialog :deep(.el-dialog__body) {
  background: #ffffff;
  padding: 32px;
}

.template-dialog :deep(.el-dialog__footer) {
  background: #fafafa;
  padding: 20px 32px;
  border-top: 1px solid rgba(203, 213, 224, 0.5);
}

.dialog-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  pointer-events: none;
}

.star {
  position: absolute;
  font-size: 20px;
  animation: twinkle 2s infinite;
}

.star-1 {
  top: 20px;
  right: 40px;
  animation-delay: 0s;
}

.star-2 {
  top: 60px;
  right: 80px;
  animation-delay: 0.5s;
}

.star-3 {
  top: 100px;
  right: 30px;
  animation-delay: 1s;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.template-form {
  padding: 0;
}

.template-form :deep(.el-form-item__label) {
  color: #4a5568;
  font-weight: 500;
}

.template-form :deep(.el-input__wrapper) {
  background: rgba(247, 248, 250, 0.8);
  border-color: rgba(203, 213, 224, 0.6);
  border-radius: 12px;
}

.template-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4);
}

.template-form :deep(.el-input__inner) {
  color: #2d3748;
}

.template-form :deep(.el-textarea__inner) {
  background: rgba(247, 248, 250, 0.8);
  border-color: rgba(203, 213, 224, 0.6);
  color: #2d3748;
  border-radius: 12px;
}

.template-form :deep(.el-select__wrapper) {
  background: rgba(247, 248, 250, 0.8);
  border-color: rgba(203, 213, 224, 0.6);
  border-radius: 12px;
}

.template-form :deep(.el-select__inner) {
  color: #2d3748;
}

.input-with-icon {
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #a0aec0;
}

.template-form :deep(.el-input__wrapper) {
  padding-left: 44px;
}

.sections-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.template-form :deep(.el-checkbox) {
  color: #4a5568;
}

.template-form :deep(.el-checkbox__inner) {
  background: rgba(247, 248, 250, 0.8);
  border-color: rgba(203, 213, 224, 0.6);
}

.template-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #B6DDDC;
  border-color: #B6DDDC;
}

.template-form :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #2D5A7A;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.footer-btn.cancel-btn {
  background: rgba(203, 213, 224, 0.2);
  color: #4a5568;
  border-color: rgba(203, 213, 224, 0.4);
}

.footer-btn.cancel-btn:hover {
  background: rgba(203, 213, 224, 0.3);
}

.footer-btn.confirm-btn {
  background: #B6DDDC;
  color: #2D5A7A;
  border: none;
  box-shadow: 0 4px 15px rgba(182, 221, 220, 0.4);
}

.footer-btn.confirm-btn:hover {
  background: #A3D4D2;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(182, 221, 220, 0.5);
}

.preview-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.preview-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #fdfbfb 0%, #f5f5f5 100%);
  padding: 24px 32px;
  border-bottom: 1px solid rgba(203, 213, 224, 0.5);
}

.preview-dialog :deep(.el-dialog__title) {
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
}

.preview-dialog :deep(.el-dialog__body) {
  background: #ffffff;
  padding: 0;
}

.preview-dialog :deep(.el-dialog__footer) {
  background: #fafafa;
  padding: 20px 32px;
  border-top: 1px solid rgba(203, 213, 224, 0.5);
}

.preview-content {
  padding: 40px;
  font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
}

.preview-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 3px solid;
}

.preview-header.full {
  border-color: #667eea;
}

.preview-header.simple {
  border-color: #4ecdc4;
}

.preview-header.employment {
  border-color: #ff9a9e;
}

.preview-icon {
  margin-bottom: 20px;
}

.preview-icon.full {
  color: #667eea;
}

.preview-icon.simple {
  color: #4ecdc4;
}

.preview-icon.employment {
  color: #ff9a9e;
}

.preview-header h2 {
  margin: 0 0 12px 0;
  font-size: 30px;
  color: #2d3748;
  font-weight: 700;
}

.preview-header p {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #718096;
}

.default-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.preview-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.preview-section {
  padding: 24px;
  border-radius: 16px;
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.preview-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.preview-section.bg-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(37, 99, 235, 0.03) 100%);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.preview-section.bg-success {
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.06) 0%, rgba(22, 163, 74, 0.03) 100%);
  border: 1px solid rgba(78, 205, 196, 0.15);
}

.preview-section.bg-warning {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(217, 119, 6, 0.03) 100%);
  border: 1px solid rgba(251, 191, 36, 0.15);
}

.preview-section.bg-primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(126, 34, 206, 0.03) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.preview-section.bg-danger {
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.06) 0%, rgba(220, 38, 38, 0.03) 100%);
  border: 1px solid rgba(255, 154, 158, 0.15);
}

.preview-section.bg-purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(147, 51, 234, 0.03) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.section-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-section.bg-info .section-icon-wrapper {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.preview-section.bg-success .section-icon-wrapper {
  background: rgba(78, 205, 196, 0.1);
  color: #10b981;
}

.preview-section.bg-warning .section-icon-wrapper {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.preview-section.bg-primary .section-icon-wrapper {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.preview-section.bg-danger .section-icon-wrapper {
  background: rgba(255, 154, 158, 0.1);
  color: #ef4444;
}

.preview-section.bg-purple .section-icon-wrapper {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.section-content {
  flex: 1;
}

.section-content h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
}

.section-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-lines .line {
  height: 4px;
  border-radius: 2px;
  background: rgba(203, 213, 224, 0.5);
}

.section-lines .line:nth-child(1) { width: 100%; }
.section-lines .line:nth-child(2) { width: 80%; }
.section-lines .line:nth-child(3) { width: 60%; }

.preview-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 25px;
  border-top: 1px dashed rgba(203, 213, 224, 0.5);
}

.footer-decoration {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.footer-decoration span {
  color: #cbd5e1;
  font-size: 16px;
  animation: floatText 3s infinite ease-in-out;
}

.footer-decoration span:nth-child(2) {
  animation-delay: 0.5s;
}

.footer-decoration span:nth-child(3) {
  animation-delay: 1s;
}

@keyframes floatText {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.preview-footer p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #718096;
}

.footer-date {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .template-page {
    padding: 20px 15px;
  }
  
  .content-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .template-list {
    grid-template-columns: 1fr;
  }
  
  .template-card {
    padding: 24px;
  }
  
  .template-actions {
    justify-content: center;
  }
  
  .preview-body {
    grid-template-columns: 1fr;
  }
}
</style>
