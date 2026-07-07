import request from './request'

export function getGrowthByStudentId(studentId) {
  return request({
    url: `/growth-trajectory/student/${studentId}`,
    method: 'get'
  })
}

export function getGrowthByYear(year) {
  return request({
    url: `/growth-trajectory/year/${year}`,
    method: 'get'
  })
}

export function saveGrowth(data) {
  return request({
    url: '/growth-trajectory',
    method: 'post',
    data
  })
}