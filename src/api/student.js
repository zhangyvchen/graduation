import request from './request'

// 学生登录
export const studentLogin = (data) => request({
  url: '/student/auth/login',
  method: 'post',
  data
})

// 修改密码
export const changePassword = (data) => request({
  url: '/student/auth/change-password',
  method: 'post',
  data
})

// 初始化学生用户
export const initStudentUsers = () => request({
  url: '/student/auth/init',
  method: 'post'
})

// 个人总览
export const getMyProfile = () => request({
  url: '/student/profile/info',
  method: 'get'
})

// 成绩画像
export const getMyGrades = () => request({
  url: '/student/grade/data',
  method: 'get'
})

// 成就中心
export const getMyAchievements = (params) => request({
  url: '/student/achievement/list',
  method: 'get',
  params
})

// ====================== 学生报告模块 ======================
// 删除学生(普通学生端)
export function deleteStudentNormal(id) {
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

// ====================== 学生前台功能模块 ======================
// 横向对比
export const getComparison = (params) => request({
  url: '/student/comparison/data',
  method: 'get',
  params
})

// 成长轨迹
export const getMyTimeline = () => request({
  url: '/student/timeline/list',
  method: 'get'
})

// 提交留言
export const submitMessage = (data) => request({
  url: '/student/message/submit',
  method: 'post',
  data
})

// 我的留言
export const getMyMessages = () => request({
  url: '/student/message/my',
  method: 'get'
})

// 根据学号查询学生信息（复用个人总览接口，仅查询当前登录学生）
export const getStudentByStudentId = (studentId) => request({
  url: '/student/profile/info',
  method: 'get',
  params: { studentId }
})

// ====================== 管理员后台学生管理模块 ======================
// 查询学生总数（管理端使用）
export const getAllStudents = () => request({
  url: '/admin/student/count',
  method: 'get'
})

// 学生分页列表（管理端使用）
export const getStudentList = (params) => request({
  url: '/admin/student/page',
  method: 'get',
  params
})

// 新增学生
export const saveStudent = (data) => request({
  url: '/admin/student',
  method: 'post',
  data
})

// 更新学生
export const updateStudent = (data) => request({
  url: '/admin/student',
  method: 'put',
  data
})

// 删除学生(管理员后台)
export const deleteStudent = (id) => request({
  url: `/admin/student/${id}`,
  method: 'delete'
})