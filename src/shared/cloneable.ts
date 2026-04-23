const MAX_DEPTH = 10

export function toCloneable(value: unknown): unknown {
  return walk(value, 0, new WeakSet())
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value
  if (depth > MAX_DEPTH) return '[depth-limit]'

  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') return value
  if (type === 'bigint') return `[bigint ${(value as bigint).toString()}]`
  if (type === 'function') return `[function ${(value as { name?: string }).name || 'anonymous'}]`
  if (type === 'symbol') return `[symbol ${String(value)}]`

  if (value instanceof Date) return new Date(value.getTime())
  if (value instanceof RegExp) return `[regexp ${value.toString()}]`
  if (value instanceof Error) return `[error ${value.name}: ${value.message}]`
  if (value instanceof Promise) return '[promise]'

  if (typeof Element !== 'undefined' && value instanceof Element) {
    return `[element <${value.tagName.toLowerCase()}${value.id ? ' #' + value.id : ''}>]`
  }
  if (typeof Node !== 'undefined' && value instanceof Node) {
    return `[node ${(value as Node).nodeName.toLowerCase()}]`
  }
  if (typeof Window !== 'undefined' && value instanceof Window) return '[window]'

  if (type !== 'object') return `[${type}]`

  const obj = value as object
  if (seen.has(obj)) return '[circular]'
  seen.add(obj)

  if (Array.isArray(value)) {
    return value.map((v) => walk(v, depth + 1, seen))
  }

  if (value instanceof Map) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of value) out[String(k)] = walk(v, depth + 1, seen)
    return out
  }

  if (value instanceof Set) {
    return Array.from(value, (v) => walk(v, depth + 1, seen))
  }

  const out: Record<string, unknown> = {}
  let keys: string[]
  try {
    keys = Object.keys(obj)
  } catch {
    return '[unreadable]'
  }
  for (const key of keys) {
    let next: unknown
    try {
      next = (obj as Record<string, unknown>)[key]
    } catch {
      out[key] = '[getter-threw]'
      continue
    }
    out[key] = walk(next, depth + 1, seen)
  }
  return out
}
