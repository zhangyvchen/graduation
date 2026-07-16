/**
 * 解析 SSE 事件文本，保留换行结构
 */
function parseSSEEvent(eventText) {
  if (!eventText) return ''

  const dataLines = []
  for (const line of eventText.split('\n')) {
    if (line.startsWith('data:')) {
      const value = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
      dataLines.push(value)
    }
  }

  if (dataLines.length > 0) {
    return dataLines.join('\n')
  }

  // 兼容非标准 SSE 纯文本
  const trimmed = eventText.trim()
  return trimmed.startsWith('data:')
    ? (trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5))
    : trimmed
}

/**
 * AI 流式对话（SSE）
 */
export async function streamAIChat({
  content,
  userId,
  year,
  messageType = 'general',
  userRole = 'guest',
  signal,
  onChunk
}) {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      content,
      year,
      messageType,
      userRole
    }),
    signal
  })

  if (!response.ok) {
    throw new Error(`AI 请求失败 (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    let eventEnd = buffer.indexOf('\n\n')
    while (eventEnd !== -1) {
      const eventText = buffer.slice(0, eventEnd)
      buffer = buffer.slice(eventEnd + 2)

      const text = parseSSEEvent(eventText)
      if (text && !text.includes('[DONE]')) {
        onChunk(text)
      }

      eventEnd = buffer.indexOf('\n\n')
    }
  }

  const remaining = parseSSEEvent(buffer)
  if (remaining && !remaining.includes('[DONE]')) {
    onChunk(remaining)
  }
}
