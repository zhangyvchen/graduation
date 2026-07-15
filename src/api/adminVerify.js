import request from './request'

// 管理员核销
export function adminVerify(data) {
  return request({
    url: '/admin/verify',
    method: 'post',
    data
  })
}

// 管理员核销记录分页
export function getAdminVerifyRecords(params) {
  return request({
    url: '/admin/verify/records',
    method: 'get',
    params
  })
}

// 管理员根据学号查询学生核销信息
export function getStudentVerifyInfo(studentId) {
  return request({
    url: `/admin/verify/student/${studentId}`,
    method: 'get'
  })
}
