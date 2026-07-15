import request from './request'

// 获取学生核销二维码
export function getStudentQRCode() {
  return request({
    url: '/student/verify/qrcode',
    method: 'get'
  })
}

// 获取我的核销记录
export function getMyVerifyRecords() {
  return request({
    url: '/student/verify/records',
    method: 'get'
  })
}

// 获取核销状态
export function getStudentVerifyStatus() {
  return request({
    url: '/student/verify/status',
    method: 'get'
  })
}

// 获取毕业周边领取状态
export function getGiftStatus() {
  return request({
    url: '/student/verify/gift-status',
    method: 'get'
  })
}

// 领取毕业周边
export function receiveGift() {
  return request({
    url: '/student/verify/receive-gift',
    method: 'post'
  })
}
