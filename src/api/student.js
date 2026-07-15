import request from './request'

export function getStudentList(params) {
  return request({
    url: '/student',
    method: 'get',
    params
  })
}

export function getAllStudents() {
  return request({
    url: '/student/all',
    method: 'get'
  })
}

export function getStudentById(id) {
  return request({
    url: `/student/${id}`,
    method: 'get'
  })
}

export function getStudentByStudentId(studentId) {
  return request({
    url: `/student/student-id/${studentId}`,
    method: 'get'
  })
}

export function saveStudent(data) {
  return request({
    url: '/student',
    method: 'post',
    data
  })
}

export function updateStudent(data) {
  return request({
    url: '/student',
    method: 'put',
    data
  })
}

export function deleteStudent(id) {
  return request({
    url: `/student/${id}`,
    method: 'delete'
  })
}

export function getStudentReportData(studentId) {
  return request({
    url: `/student-report/${studentId}`,
    method: 'get'
  })
}

export function generateStudentReport(studentId, templateId) {
  return request({
    url: `/student-report/generate/${studentId}/${templateId}`,
    method: 'get'
  })
}
