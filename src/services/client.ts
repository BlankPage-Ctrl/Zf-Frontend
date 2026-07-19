const BASE = ''

const DEFAULT_CLIENT_ID = 'dev-client'
const DEFAULT_SECRET_KEY = 'dev-secret-key'

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function sortQueryString(qs: string): string {
  if (!qs) return ''
  return qs.split('&').filter(Boolean).sort((a, b) => a.localeCompare(b)).join('&')
}

async function buildAuthHeaders(method: string, url: string, body: string): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const qIdx = url.indexOf('?')
  const pathPart = qIdx === -1 ? url : url.slice(0, qIdx)
  const queryString = qIdx === -1 ? '' : url.slice(qIdx + 1)
  const canonicalPath = pathPart.startsWith('/') ? pathPart : '/' + pathPart

  const bodyHash = await sha256Hex(body)
  const sortedQuery = sortQueryString(queryString)

  const canonicalString = [method.toUpperCase(), canonicalPath, sortedQuery, timestamp, bodyHash].join('\n')
  const stringToSign = 'HMAC-SHA256\n' + await sha256Hex(canonicalString)
  const signature = await hmacSha256Hex(DEFAULT_SECRET_KEY, stringToSign)

  return {
    'X-Client-Id': DEFAULT_CLIENT_ID,
    'X-Timestamp': timestamp,
    'X-Signature': `HMAC-SHA256=${signature}`,
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET'
  const body = (init?.body as string) ?? ''

  const ah = await buildAuthHeaders(method, url, body)
  const clientId = ah['X-Client-Id']!
  const ts = ah['X-Timestamp']!
  const sig = ah['X-Signature']!

  const mergedHeaders = new Headers(init?.headers)
  mergedHeaders.set('X-Client-Id', clientId)
  mergedHeaders.set('X-Timestamp', ts)
  mergedHeaders.set('X-Signature', sig)
  if (init?.body && !mergedHeaders.has('Content-Type') && !(init?.body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: mergedHeaders,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  if (!text) return undefined as T

  const parsed: unknown = JSON.parse(text)

  if (!res.ok) {
    const msg = parsed && typeof parsed === 'object' && 'error' in parsed
      ? String((parsed as Record<string, unknown>).error)
      : `Request failed (${res.status})`
    throw new Error(msg)
  }

  return parsed as T
}

export { request, buildAuthHeaders, DEFAULT_CLIENT_ID, DEFAULT_SECRET_KEY }
