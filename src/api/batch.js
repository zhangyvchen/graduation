import request from './request'

export function getBatchList(params) {
  return request({
    url: '/batch/list',
    method: 'get',
    params
  })
}

export function getBatchById(id) {
  return request({
    url: `/batch/${id}`,
    method: 'get'
  })
}

export function saveBatch(data) {
  return request({
    url: '/batch',
    method: 'post',
    data
  })
}

export function updateBatch(data) {
  return request({
    url: '/batch',
    method: 'put',
    data
  })
}

export function deleteBatch(id) {
  return request({
    url: `/batch/${id}`,
    method: 'delete'
  })
}

export function toggleBatchStatus(id) {
  return request({
    url: `/batch/${id}/status`,
    method: 'post'
  })
}

export function getAllBatch() {
  return request({
    url: '/batch/all',
    method: 'get'
  })
}

export function recalculateBatch() {
  return request({
    url: '/batch/recalculate',
    method: 'post'
  })
}

export function getBatchAll() {
  return request({
    url: '/batch/all',
    method: 'get'
  })
}

export function getGraduationDataAll() {
  return request({
    url: '/graduation-data/all',
    method: 'get'
  })
}

export function getStatisticsByYear(year) {
  return request({
    url: `/statistics/year/${year}`,
    method: 'get'
  })
}

export function getStatisticsOverview() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getStatisticsTrend() {
  return request({
    url: '/statistics/trend',
    method: 'get'
  })
}

export function getCompanyTypes(year) {
  return request({
    url: '/statistics/company-types',
    method: 'get',
    params: year ? { year } : {}
  })
}

export function getMajorRates(year) {
  return request({
    url: '/statistics/major-rates',
    method: 'get',
    params: year ? { year } : {}
  })
}

export function getEmploymentDistribution(year) {
  return request({
    url: '/statistics/employment-distribution',
    method: 'get',
    params: year ? { year } : {}
  })
}

export function getStudentYears() {
  return request({
    url: '/admin/student/years',
    method: 'get'
  })
}

export function getStatisticsStudents(params) {
  return request({
    url: '/statistics/students',
    method: 'get',
    params
  })
}