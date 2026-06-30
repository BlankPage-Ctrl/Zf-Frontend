const BASE = ''

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
    })
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ''}`)
    }
    if (res.status === 204) return undefined as T
    const text = await res.text()
    if (!text) return undefined as T
    return JSON.parse(text)
}

export { request }
