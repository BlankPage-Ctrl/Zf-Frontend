import type {
    Note,
    NoteDto,
    NoteFilter,
    NoteListOpts,
    Category,
    CategoryDto,
} from '../entities/note'

export interface NoteRepository {
    list(filter?: NoteFilter, opts?: NoteListOpts): Promise<Note[]>
    get(id: string): Promise<Note>
    create(dto: NoteDto): Promise<Note>
    update(id: string, dto: Record<string, unknown>): Promise<Note>
    remove(id: string): Promise<void>
    move(id: string, position: { before?: string; after?: string }): Promise<Note>
    renumber(): Promise<{ ok: boolean }>
}

export interface CategoryRepository {
    list(): Promise<Category[]>
    create(dto: CategoryDto): Promise<Category>
    rename(id: string, name: string): Promise<Category>
    remove(id: string): Promise<void>
}
