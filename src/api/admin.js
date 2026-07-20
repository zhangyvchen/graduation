import request from './request'

export function login(data) {
  return request({
    url: '/admin/login',
    method: 'post',
    data
  })
}

export function resetPassword(data) {
  return request({
    url: '/admin/reset-password',
    method: 'post',
    data
  })
}

export function changePassword(data) {
  return request({
    url: '/admin/change-password',
    method: 'post',
    data
  })
}

export function getAdminList() {
  return request({
    url: '/admin',
    method: 'get'
  })
}


export function saveAdmin(data) {
  return request({
    url: '/admin',
    method: 'post',
    data
  })
}

// AI功能相关接口
export function aiChatStream(data) {
  return fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}

/** @deprecated 请使用 aiStreamChat 工具函数 */
export function aiChat(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    data
  })
}

export function getAiModels() {
  return request({
    url: '/ai/models',
    method: 'get'
  })
}

export function getChatHistory(userId, options = {}) {
  const { userType = 'student', adminId, sessionId } = options
  return request({
    url: '/ai/chat-history',
    method: 'get',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined,
      sessionId: sessionId || undefined
    }
  })
}

export function clearAiMemory(payload = {}) {
  const { userType = 'student', userId, adminId, sessionId, deleteDb = false } = payload
  return request({
    url: '/ai/memory',
    method: 'delete',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined,
      sessionId: sessionId || undefined,
      deleteDb
    }
  })
}

export function listAiSessions(params = {}) {
  const { userType = 'student', userId, adminId } = params
  return request({
    url: '/ai/sessions',
    method: 'get',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined
    }
  })
}

export function createAiSession(data = {}) {
  return request({
    url: '/ai/sessions',
    method: 'post',
    data
  })
}

export function renameAiSession(sessionKey, data = {}) {
  return request({
    url: `/ai/sessions/${sessionKey}`,
    method: 'put',
    data
  })
}

export function deleteAiSession(sessionKey, params = {}) {
  const { userType = 'student', userId, adminId, clearMemory = true } = params
  return request({
    url: `/ai/sessions/${sessionKey}`,
    method: 'delete',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined,
      clearMemory
    }
  })
}

export function deleteChatHistory(payload = {}) {
  const { userType = 'student', userId, adminId } = payload
  return request({
    url: '/ai/chat-history',
    method: 'delete',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined
    }
  })
}

export function deleteChatMessage(id) {
  return request({
    url: `/ai/chat-history/message/${id}`,
    method: 'delete'
  })
}

/** 管理端：聊天历史表格查询 */
export function manageListMessages(params = {}) {
  return request({
    url: '/ai/messages/manage',
    method: 'get',
    params
  })
}

export function manageCreateMessage(data) {
  return request({
    url: '/ai/messages/manage',
    method: 'post',
    data
  })
}

export function manageUpdateMessage(id, data) {
  return request({
    url: `/ai/messages/manage/${id}`,
    method: 'put',
    data
  })
}

export function manageListSessions(params = {}) {
  return request({
    url: '/ai/sessions/manage',
    method: 'get',
    params
  })
}

export function checkAiRisk(data) {
  return request({
    url: '/ai/risk-check',
    method: 'post',
    data
  })
}

export function getAbnormalChats(params = {}) {
  return request({
    url: '/ai/abnormal',
    method: 'get',
    params
  })
}

export function deleteAbnormalChat(id) {
  return request({
    url: `/ai/abnormal/${id}`,
    method: 'delete'
  })
}

export function getRiskWords(params = {}) {
  return request({
    url: '/admin/ai-risk/words',
    method: 'get',
    params
  })
}

export function addRiskWord(data) {
  return request({
    url: '/admin/ai-risk/words',
    method: 'post',
    data
  })
}

export function updateRiskWord(id, data) {
  return request({
    url: `/admin/ai-risk/words/${id}`,
    method: 'put',
    data
  })
}

export function deleteRiskWord(id) {
  return request({
    url: `/admin/ai-risk/words/${id}`,
    method: 'delete'
  })
}

export function getSensitiveLexiconStats() {
  return request({
    url: '/admin/ai-risk/lexicon/stats',
    method: 'get'
  })
}

export function reloadSensitiveLexicon() {
  return request({
    url: '/admin/ai-risk/lexicon/reload',
    method: 'post'
  })
}

export function getChatHistoryByYear(year) {
  return request({
    url: `/ai/chat-history/year/${year}`,
    method: 'get'
  })
}

export function generateEmploymentAnalysis(data) {
  return request({
    url: '/ai/employment-analysis',
    method: 'post',
    data
  })
}

export function generateMajorAnalysis(data) {
  return request({
    url: '/ai/major-analysis',
    method: 'post',
    data
  })
}

export function generatePredictionAnalysis(data) {
  return request({
    url: '/ai/prediction-analysis',
    method: 'post',
    data
  })
}

export function generateAnnualReport(data) {
  return request({
    url: '/ai/annual-report',
    method: 'post',
    data
  })
}

// ============= 留言审核 =============

export function getMessagePage(params) {
  return request({
    url: '/admin/message/page',
    method: 'get',
    params
  })
}

export function getPendingMessageCount() {
  return request({
    url: '/admin/message/pending-count',
    method: 'get'
  })
}

export function reviewMessage(data) {
  return request({
    url: '/admin/message/review',
    method: 'post',
    data
  })
}

export function deleteMessage(id) {
  return request({
    url: `/admin/message/${id}`,
    method: 'delete'
  })
}