import request from './request'

export function login(data) {
  return request({
    url: '/admin/login',
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
export function aiChat(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    data
  })
}

export function getChatHistory(userId) {
  return request({
    url: `/ai/chat-history/${userId}`,
    method: 'get'
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