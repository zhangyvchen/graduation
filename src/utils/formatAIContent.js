function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

/**
 * 将 AI 返回的 Markdown 风格文本转为可展示的 HTML
 * 兼容中文模型常见写法：###标题（# 后无空格）、• 列表等
 */
export function formatAIContent(content) {
  if (!content) return ''

  const normalized = String(content)
    .replace(/\r\n/g, '\n')
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')
    .replace(/\n{3,}/g, '\n\n')

  const lines = normalized.split('\n')
  const parts = []
  let inUl = false
  let inOl = false
  let pendingBreak = false

  const closeList = () => {
    if (inUl) {
      parts.push('</ul>')
      inUl = false
    }
    if (inOl) {
      parts.push('</ol>')
      inOl = false
    }
  }

  for (const line of lines) {
    // 去掉行首不可见字符，避免干扰 Markdown 识别
    const trimmed = line.replace(/^[\u200B\uFEFF\u00A0]+/, '').trim()

    if (!trimmed) {
      closeList()
      pendingBreak = true
      continue
    }

    if (pendingBreak && parts.length > 0) {
      parts.push('<br>')
      pendingBreak = false
    }

    // 标题：### 标题 或 ###标题（允许无空格）
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.+)$/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()
      const tag = level <= 2 ? 'h3' : 'h4'
      parts.push(`<${tag}>${inlineFormat(title)}</${tag}>`)
      continue
    }

    // 无序列表：- / * / • ，允许符号后无空格
    const ulMatch = trimmed.match(/^[-*•]\s*(.+)$/)
    if (ulMatch && !trimmed.startsWith('**')) {
      if (inOl) {
        parts.push('</ol>')
        inOl = false
      }
      if (!inUl) {
        parts.push('<ul>')
        inUl = true
      }
      parts.push(`<li>${inlineFormat(ulMatch[1].trim())}</li>`)
      continue
    }

    // 有序列表：1. / 1、
    const olMatch = trimmed.match(/^(\d+)[\.、]\s*(.+)$/)
    if (olMatch) {
      if (inUl) {
        parts.push('</ul>')
        inUl = false
      }
      if (!inOl) {
        parts.push('<ol>')
        inOl = true
      }
      parts.push(`<li>${inlineFormat(olMatch[2].trim())}</li>`)
      continue
    }

    closeList()
    parts.push(`<p>${inlineFormat(trimmed)}</p>`)
  }

  closeList()
  return parts.join('')
}
