import request from './request'

export function getTemplateList(params) {
  return request({
    url: '/template',
    method: 'get',
    params
  })
}

export function getTemplateById(id) {
  return request({
    url: `/template/${id}`,
    method: 'get'
  })
}

export function saveTemplate(data) {
  return request({
    url: '/template',
    method: 'post',
    data
  })
}

export function updateTemplate(data) {
  return request({
    url: '/template',
    method: 'put',
    data
  })
}

export function deleteTemplate(id) {
  return request({
    url: `/template/${id}`,
    method: 'delete'
  })
}

export function setDefaultTemplate(id) {
  return request({
    url: `/template/${id}/default`,
    method: 'patch'
  })
}

export function toggleTemplateStatus(id) {
  return request({
    url: `/template/${id}/status`,
    method: 'patch'
  })
}