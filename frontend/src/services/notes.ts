import {
    List as ListNotes,
    Get as GetNote,
    Create as CreateNote,
    Update as UpdateNote,
    Delete as DeleteNote,
    Move as MoveNote,
    Renumber as RenumberNotes,
} from '../../wailsjs/go/notes/Service'
import {
    List as ListCategories,
    Create as CreateCategory,
    Delete as DeleteCategory,
    Rename as RenameCategory,
} from '../../wailsjs/go/categories/Service'

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

export const notesApi = {
    list: (filter?: NoteFilter, opts?: NoteListOpts) => {
        const query = { ...filter, ...opts } as Record<string, string | number | undefined>
        const filterArg: Record<string, any> = {}
        for (const [k, v] of Object.entries(query)) {
            if (v !== undefined) filterArg[k] = v
        }
        return ListNotes(filterArg) as Promise<Note[]>
    },

    get: (id: string) => GetNote(id) as Promise<Note>,

    create: (dto: NoteDto) => CreateNote(dto) as Promise<Note>,

    update: (id: string, dto: Record<string, unknown>) =>
        UpdateNote(id, dto) as Promise<Note>,

    remove: (id: string) => DeleteNote(id) as Promise<void>,

    move: (id: string, position: { before?: string; after?: string }) =>
        MoveNote(id, position) as Promise<Note>,

    renumber: () => RenumberNotes() as Promise<{ ok: boolean }>,
}

export const categoriesApi = {
    list: () => ListCategories() as Promise<Category[]>,
    create: (dto: CategoryDto) => CreateCategory(dto) as Promise<Category>,
    rename: (id: string, name: string) => RenameCategory(id, name) as Promise<Category>,
    remove: (id: string) => DeleteCategory(id) as Promise<void>,
}
