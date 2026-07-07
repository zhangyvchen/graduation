import request from './request'

export function getLearningByStudentId(studentId) {
  return request({
    url: `/learning-profile/student/${studentId}`,
    method: 'get'
  })
}

export function getLearningByYear(year) {
  return request({
    url: `/learning-profile/year/${year}`,
    method: 'get'
  })
}

export function saveLearning(data) {
  return request({
    url: '/learning-profile',
    method: 'post',
    data
  })
}