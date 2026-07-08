import request from './request'

export function verifyCode(code) {
  return request({
    url: '/verify',
    method: 'post',
    data: { code }
  })
}

export function getVerifyHistory(params) {
  return request({
    url: '/verify/history',
    method: 'get',
    params
  })
}

export function getStudentQRCode() {
  return request({
    url: '/verify/qrcode',
    method: 'get'
  })
}

export function getStudentVerifyStatus() {
  return request({
    url: '/verify/status',
    method: 'get'
  })
}

export function verifyByAdmin(data) {
  return request({
    url: '/verify/admin',
    method: 'post',
    data
  })
}

export function getMyVerifyHistory() {
  return request({
    url: '/verify/my-history',
    method: 'get'
  })
}
