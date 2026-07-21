import { request } from './client.js'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Note {
    id: string
    name: string
    category_id: string
    desc: string
    details: string
    rank: string
    priority: Priority
    created_at: string
    updated_at: string
    version: number
}

export interface NoteDto {
    name: string
    category_id?: string
    desc?: string
    details?: string
    priority?: Priority
    position?: { before?: string; after?: string }
}

export interface NoteUpdateDto {
    name?: string
    category_id?: string
    desc?: string
    details?: string
    priority?: Priority
    version: number
}

export interface NoteFilter {
    category?: string
    priority?: string
    search?: string
}

export interface NoteListOpts {
    sort?: 'rank' | 'priority' | 'updated_at' | 'created_at' | 'name'
    order?: 'asc' | 'desc'
    limit?: number
    offset?: number
}

export interface Category {
    id: string
    name: string
    color: string | null
    is_default: boolean
    created_at: string
}

export interface CategoryDto {
    name: string
    color?: string
}

function buildQuery(params: Record<string, string | number | undefined>): string {
    const parts: string[] = []
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) parts.push(`${k}=${encodeURIComponent(v)}`)
    }
    return parts.length ? `?${parts.join('&')}` : ''
}

export const notesApi = {
    list: (filter?: NoteFilter, opts?: NoteListOpts) => {
        const qs = buildQuery({ ...filter, ...opts })
        return request<Note[]>(`/notes${qs}`)
    },

    get: (id: string) => request<Note>(`/notes/${id}`),

    create: (dto: NoteDto) =>
        request<Note>('/notes', { method: 'POST', body: JSON.stringify(dto) }),

    update: (id: string, dto: NoteUpdateDto) =>
        request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

    remove: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),

    move: (id: string, position: { before?: string; after?: string }) =>
        request<Note>(`/notes/${id}/move`, {
            method: 'POST',
            body: JSON.stringify(position),
        }),

    renumber: () => request<{ ok: boolean }>('/notes-renumber', { method: 'POST' }),
}

export const categoriesApi = {
    list: () => request<Category[]>('/categories'),

    create: (dto: CategoryDto) =>
        request<Category>('/categories', {
            method: 'POST',
            body: JSON.stringify(dto),
        }),

    rename: (id: string, name: string) =>
        request<Category>(`/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        }),

    remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
}
