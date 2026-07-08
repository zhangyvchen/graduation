import request from './request'

export function getBatchList(params) {
  return request({
    url: '/batch',
    method: 'get',
    params
  })
}

export function getBatchById(id) {
  return request({
    url: `/batch/${id}`,
    method: 'get'
  })
}

export function saveBatch(data) {
  return request({
    url: '/batch',
    method: 'post',
    data
  })
}

export function updateBatch(data) {
  return request({
    url: '/batch',
    method: 'put',
    data
  })
}

export function deleteBatch(id) {
  return request({
    url: `/batch/${id}`,
    method: 'delete'
  })
}

export function toggleBatchStatus(id) {
  return request({
    url: `/batch/${id}/status`,
    method: 'patch'
  })
}