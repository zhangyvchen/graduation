// src/api/import.js
import request from './request'

// ========== 去向数据 ==========
export function importDestinationAsync(filePath) {
    return request({
        url: '/destination-data/import-async',
        method: 'post',
        data: { filePath }
    })
}

export function getDestinationImportProgress(filePath) {
    return request({
        url: '/destination-data/import-progress',
        method: 'get',
        params: { filePath }
    })
}

// ========== 学习画像 ==========
export function importLearningAsync(filePath) {
    return request({
        url: '/learning-profile/import-async',
        method: 'post',
        data: { filePath }
    })
}

export function getLearningImportProgress(filePath) {
    return request({
        url: '/learning-profile/import-progress',
        method: 'get',
        params: { filePath }
    })
}

// ========== 成长轨迹 ==========
export function importGrowthAsync(filePath) {
    return request({
        url: '/growth-trajectory/import-async',
        method: 'post',
        data: { filePath }
    })
}

export function getGrowthImportProgress(filePath) {
    return request({
        url: '/growth-trajectory/import-progress',
        method: 'get',
        params: { filePath }
    })
}