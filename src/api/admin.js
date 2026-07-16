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

export function getChatHistory(userId, options = {}) {
  const { userType = 'student', adminId } = options
  return request({
    url: '/ai/chat-history',
    method: 'get',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined
    }
  })
}

export function clearAiMemory(payload = {}) {
  const { userType = 'student', userId, adminId } = payload
  return request({
    url: '/ai/memory',
    method: 'delete',
    params: {
      userType,
      userId: userType === 'student' ? userId : undefined,
      adminId: userType === 'admin' ? adminId : undefined
    }
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