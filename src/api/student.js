import request from './request'

export function login(data) {
  return request({
    url: '/student/login',
    method: 'post',
    data
  })
}

export function getStudentList(params) {
  return request({
    url: '/student',
    method: 'get',
    params
  })
}

export function getStudentByStudentId(studentId) {
  return request({
    url: `/student/${studentId}`,
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