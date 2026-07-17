/**
 * 解析 SSE 事件文本，保留换行结构；支持 event 名
 */
function parseSSEEvent(eventText) {
  if (!eventText) return { event: 'message', data: '' }

  let eventName = 'message'
  const dataLines = []
  for (const line of eventText.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || 'message'
    } else if (line.startsWith('data:')) {
      const value = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
      dataLines.push(value)
    }
  }

  if (dataLines.length > 0) {
    return { event: eventName, data: dataLines.join('\n') }
  }

  const trimmed = eventText.trim()
  const data = trimmed.startsWith('data:')
    ? (trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5))
    : trimmed
  return { event: eventName, data }
}

/**
 * AI 流式对话（SSE）
 */
export async function streamAIChat({
  content,
  userId,
  adminId,
  year,
  messageType = 'general',
  userRole = 'guest',
  signal,
  onChunk,
  onBlocked
}) {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      adminId,
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

      const { event, data } = parseSSEEvent(eventText)
      if (!data || data.includes('[DONE]')) {
        eventEnd = buffer.indexOf('\n\n')
        continue
      }

      if (event === 'blocked') {
        let payload = { message: data }
        try {
          payload = JSON.parse(data)
        } catch (_) {
          // ignore
        }
        onBlocked?.(payload)
        return
      }

      if (event !== 'error') {
        onChunk?.(data)
      }

      eventEnd = buffer.indexOf('\n\n')
    }
  }

  const remaining = parseSSEEvent(buffer)
  if (remaining.data && !remaining.data.includes('[DONE]')) {
    if (remaining.event === 'blocked') {
      let payload = { message: remaining.data }
      try {
        payload = JSON.parse(remaining.data)
      } catch (_) {
        // ignore
      }
      onBlocked?.(payload)
      return
    }
    onChunk?.(remaining.data)
  }
}
