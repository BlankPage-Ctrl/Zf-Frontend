import type { NoteRepository, CategoryRepository } from '@/core/repositories'
import type { Note, NoteDto, NoteUpdateDto, Category, CategoryDto } from '@/core/entities'

export interface NoteBusinessLogic {
    list(): Promise<Note[]>
    create(dto: NoteDto): Promise<Note>
    update(id: string, dto: NoteUpdateDto): Promise<Note>
    remove(id: string): Promise<void>
    listCategories(): Promise<Category[]>
    createCategory(dto: CategoryDto): Promise<Category>
}

export function createNoteBusinessLogic(repo: {
    notes: NoteRepository
    categories: CategoryRepository
}): NoteBusinessLogic {
    return {
        list: () => repo.notes.list(),
        create: (dto) => repo.notes.create(dto),
        update: (id, dto) => repo.notes.update(id, dto as unknown as Record<string, unknown>),
        remove: (id) => repo.notes.remove(id),
        listCategories: () => repo.categories.list(),
        createCategory: (dto) => repo.categories.create(dto),
    }
}
