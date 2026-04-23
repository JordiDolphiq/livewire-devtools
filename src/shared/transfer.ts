import * as devalue from 'devalue'

export function encode(value: unknown): string {
  try {
    return devalue.stringify(value)
  } catch {
    return devalue.stringify(sanitize(value))
  }
}

export function decode<T = unknown>(value: string): T {
  return devalue.parse(value) as T
}

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value
  const type = typeof value
  if (type === 'function') return `[function ${(value as any).name || 'anonymous'}]`
  if (type === 'symbol') return String(value)
  if (type !== 'object') return value

  if (seen.has(value as object)) return '[circular]'
  seen.add(value as object)

  if (Array.isArray(value)) {
    return value.map((v) => sanitize(v, seen))
  }

  if (value instanceof Map) {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of value) obj[String(k)] = sanitize(v, seen)
    return obj
  }

  if (value instanceof Set) {
    return Array.from(value).map((v) => sanitize(v, seen))
  }

  if (value instanceof Date) return value
  if (value instanceof Element) return `[element <${value.tagName.toLowerCase()}>]`

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>)) {
    try {
      out[key] = sanitize((value as Record<string, unknown>)[key], seen)
    } catch {
      out[key] = '[unserializable]'
    }
  }
  return out
}
