import request from './request'

export function generateReport(data) {
  return request({
    url: '/report/generate',
    method: 'post',
    data
  })
}

export function downloadReport(studentId, type) {
  return request({
    url: '/report/download',
    method: 'get',
    params: { studentId, type },
    responseType: 'blob'
  })
}

export function getReportList(params) {
  return request({
    url: '/report',
    method: 'get',
    params
  })
}

export function deleteReport(id) {
  return request({
    url: `/report/${id}`,
    method: 'delete'
  })
}