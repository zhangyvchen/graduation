import request from './request'

export function getGraduationDataByYear(year) {
  return request({
    url: '/graduation-data/list',
    method: 'get',
    params: { year }
  })
}

export function getOverview(year) {
  return request({
    url: `/graduation-data/overview/${year}`,
    method: 'get'
  })
}

export function saveGraduationData(data) {
  return request({
    url: '/graduation-data',
    method: 'post',
    data
  })
}

export function updateGraduationData(data) {
  return request({
    url: '/graduation-data',
    method: 'put',
    data
  })
}

export function deleteGraduationData(id) {
  return request({
    url: `/graduation-data/${id}`,
    method: 'delete'
  })
}