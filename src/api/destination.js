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

// ========== 新增统计接口 ==========
export function getProvinceStats(year) {
  return request({
    url: '/destination-data/stats/province',
    method: 'get',
    params: { year }
  })
}

export function getIndustryStats(year) {
  return request({
    url: '/destination-data/stats/industry',
    method: 'get',
    params: { year }
  })
}

export function getYearStats() {
  return request({
    url: '/destination-data/stats/year',
    method: 'get'
  })
}

export function getDestinationYears() {
  return request({
    url: '/destination-data/years',
    method: 'get'
  })
}

export function getDestinationTotalCount() {
  return request({
    url: '/destination-data/count',
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