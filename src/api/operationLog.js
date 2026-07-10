import request from './request'

export function getOperationLogList(params) {
  return request({
    url: '/operation-log',
    method: 'get',
    params
  })
}

export function getRecentLogs(limit = 10) {
  return request({
    url: '/operation-log/recent',
    method: 'get',
    params: { limit }
  })
}

export function deleteOperationLog(id) {
  return request({
    url: `/operation-log/${id}`,
    method: 'delete'
  })
}