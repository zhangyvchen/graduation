import request from './request'

export function getDestinationByStudentId(studentId) {
  return request({
    url: `/destination-data/student/${studentId}`,
    method: 'get'
  })
}

export function getDestinationByYear(year) {
  return request({
    url: `/destination-data/year/${year}`,
    method: 'get'
  })
}

export function saveDestination(data) {
  return request({
    url: '/destination-data',
    method: 'post',
    data
  })
}