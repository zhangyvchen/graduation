function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineFormat(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

/**
 * 将 AI 返回的 Markdown 风格文本转为可展示的 HTML
 */
export function formatAIContent(content) {
  if (!content) return ''

  const lines = content.split('\n')
  const parts = []
  let inUl = false
  let inOl = false

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
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      parts.push('<br>')
      continue
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      closeList()
      const level = trimmed.match(/^#+/)[0].length
      const title = trimmed.replace(/^#+\s+/, '')
      const tag = level <= 2 ? 'h3' : 'h4'
      parts.push(`<${tag}>${inlineFormat(title)}</${tag}>`)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (inOl) {
        parts.push('</ol>')
        inOl = false
      }
      if (!inUl) {
        parts.push('<ul>')
        inUl = true
      }
      parts.push(`<li>${inlineFormat(trimmed.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (inUl) {
        parts.push('</ul>')
        inUl = false
      }
      if (!inOl) {
        parts.push('<ol>')
        inOl = true
      }
      parts.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s+/, ''))}</li>`)
      continue
    }

    closeList()
    parts.push(`<p>${inlineFormat(trimmed)}</p>`)
  }

  closeList()
  return parts.join('')
}
