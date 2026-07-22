/** AI 对话头像：有存档用存档，否则学生/管理员各一套默认；游客不强制 */

export const AI_CHAT_AVATAR = '/static/AI_3.png'
export const AI_CHAT_HEADER_AVATAR = '/static/AI_2.png'

/** 学生默认头像（青绿系） */
export const STUDENT_DEFAULT_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="32" fill="#D8F3EF"/>
  <circle cx="32" cy="26" r="11" fill="#2A9D8F"/>
  <path d="M12 54c4-12 14-18 20-18s16 6 20 18" fill="#2A9D8F"/>
</svg>`)

/** 管理员默认头像（石板蓝） */
export const ADMIN_DEFAULT_AVATAR =
  'data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="32" fill="#E8EEF7"/>
  <circle cx="32" cy="26" r="11" fill="#3D5A80"/>
  <path d="M12 54c4-12 14-18 20-18s16 6 20 18" fill="#3D5A80"/>
  <path d="M44 18l3 6h7l-5.5 4 2 7L44 31l-6.5 4 2-7L34 24h7l3-6z" fill="#F4A261"/>
</svg>`)

function readStudentInfoAvatar() {
  try {
    const raw = localStorage.getItem('student_info')
    if (!raw) return ''
    const info = JSON.parse(raw)
    return info?.avatar || ''
  } catch {
    return ''
  }
}

/**
 * @param {{ isLoggedIn?: boolean, user?: object, role?: string }|null} authState
 * @returns {string} 用户侧头像 URL；游客返回空串（组件用内置占位）
 */
export function resolveUserChatAvatar(authState) {
  if (!authState?.isLoggedIn) return ''

  const role = String(authState.role || authState.user?.role || '').toUpperCase()
  const stored = authState.user?.avatar || ''

  if (role === 'ADMIN' || role === 'ASSISTANT') {
    return stored || ADMIN_DEFAULT_AVATAR
  }

  if (role === 'STUDENT') {
    return stored || readStudentInfoAvatar() || STUDENT_DEFAULT_AVATAR
  }

  return ''
}
