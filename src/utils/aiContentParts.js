import { formatAIContent } from './formatAIContent'

/**
 * 尝试修复被截断的 JSON（流式/max_tokens 截断常见）
 */
export function tryRepairJson(raw) {
  let s = String(raw || '').trim()
  if (!s) return null
  // 去掉可能的语言标记残留
  s = s.replace(/^json\s*/i, '').trim()

  const attempts = [s]
  // 截到最后一个完整的 } 或 ]
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === '}' || s[i] === ']') {
      attempts.push(s.slice(0, i + 1))
      break
    }
  }
  // 补全括号
  const patched = balanceBrackets(s)
  if (patched && patched !== s) attempts.push(patched)

  for (const candidate of attempts) {
    try {
      const obj = JSON.parse(candidate)
      if (obj && typeof obj === 'object') return obj
    } catch (_) {
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, '$1')
        const obj = JSON.parse(cleaned)
        if (obj && typeof obj === 'object') return obj
      } catch (e2) {
        // continue
      }
    }
  }
  return null
}

function balanceBrackets(input) {
  let s = input
  // 去掉末尾残缺的键值（如 ,"互联网/IT","value": ）
  s = s.replace(/,\s*\{[^}]*$/g, '')
  s = s.replace(/,\s*"[^"]*$/g, '')
  s = s.replace(/:\s*"[^"]*$/g, ':""')
  s = s.replace(/:\s*-?\d+(\.\d*)?$/g, (m) => m) // 数字残缺时尽量保留已写完的
  s = s.replace(/:\s*$/g, ':null')
  s = s.replace(/,\s*$/g, '')

  const stack = []
  let inStr = false
  let escape = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{' || ch === '[') stack.push(ch)
    else if (ch === '}' || ch === ']') {
      const open = stack.pop()
      if (!open) return null
      if ((ch === '}' && open !== '{') || (ch === ']' && open !== '[')) return null
    }
  }
  if (inStr) s += '"'
  while (stack.length) {
    const open = stack.pop()
    s += open === '{' ? '}' : ']'
  }
  return s
}

/**
 * 拆分 AI 回复：普通 Markdown 文本段 + echarts JSON 段
 */
export function splitAiContent(content) {
  const text = String(content || '')
  const parts = []
  // 完整围栏
  const re = /```\s*echarts\s*([\s\S]*?)```/gi
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    }
    pushChartOrText(parts, match[1], match[0])
    last = match.index + match[0].length
  }

  // 未闭合的 ```echarts ...（截断）
  const openIdx = text.toLowerCase().lastIndexOf('```echarts')
  const hasCloseAfter = openIdx >= 0 && text.indexOf('```', openIdx + 10) !== -1
  if (openIdx >= last && !hasCloseAfter) {
    if (openIdx > last) {
      parts.push({ type: 'text', content: text.slice(last, openIdx) })
    }
    const raw = text.slice(openIdx).replace(/^```\s*echarts\s*/i, '')
    const option = tryRepairJson(raw)
    if (option) {
      parts.push({ type: 'chart', option: normalizeChartOption(option) })
    } else {
      parts.push({ type: 'text', content: '（图表数据未完整生成，请让我再画一张图）' })
    }
    last = text.length
  }

  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }
  return parts
}

function pushChartOrText(parts, rawInner, fallbackRaw) {
  const option = tryRepairJson(rawInner)
  if (option) {
    parts.push({ type: 'chart', option: normalizeChartOption(option) })
  } else {
    parts.push({ type: 'text', content: fallbackRaw })
  }
}

/** 补全常见缺失字段，避免 ECharts 空白 */
function normalizeChartOption(option) {
  const opt = { ...option }
  if (!opt.tooltip) opt.tooltip = { trigger: 'item' }
  const series = opt.series
  if (Array.isArray(series) && series[0]?.type === 'pie') {
    if (!opt.legend) {
      const names = (series[0].data || []).map(d => d.name).filter(Boolean)
      if (names.length) opt.legend = { orient: 'vertical', left: 'left', data: names }
    }
    series[0] = {
      radius: '55%',
      center: ['55%', '50%'],
      ...series[0]
    }
  }
  return opt
}

export function formatTextPart(content) {
  // 避免把残留的 echarts 围栏当正文刷屏
  const cleaned = String(content || '')
    .replace(/```\s*echarts[\s\S]*?(```|$)/gi, '')
    .trim()
  return formatAIContent(cleaned)
}

/**
 * 复制用纯文本：去掉 echarts 围栏与常见 Markdown 标记，便于贴进报告/Word
 */
export function toPlainAiText(content) {
  let text = String(content || '')
    .replace(/\r\n/g, '\n')
    // 完整或截断的 echarts 代码块
    .replace(/```\s*echarts[\s\S]*?(```|$)/gi, '')
    // 其它代码围栏，保留内文
    .replace(/```[\w]*\s*([\s\S]*?)```/g, '$1')
    .replace(/```[\w]*\s*([\s\S]*)$/g, '$1')

  const lines = text.split('\n').map((line) => {
    let s = line.replace(/^[\u200B\uFEFF\u00A0]+/, '')
    s = s.replace(/^#{1,6}\s*/, '')
    s = s.replace(/^[-*•]\s+/, '')
    s = s.replace(/^\d+[\.、]\s+/, '')
    s = s.replace(/\*\*(.+?)\*\*/g, '$1')
    s = s.replace(/`([^`]+)`/g, '$1')
    return s
  })

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
