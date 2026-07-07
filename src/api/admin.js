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