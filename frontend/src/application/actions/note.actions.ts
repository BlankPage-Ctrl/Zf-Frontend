import type { NoteStoreLogic } from '../store-logic/note.logic'
import type { NoteBusinessLogic } from '../business-logic/note.logic'
import type { Note, NoteDto, NoteUpdateDto, CategoryDto } from '@/core/entities'
import { toMessage } from '@/shared/utils/error.utils'

export interface NoteActions {
    fetchNotes(): Promise<void>
    createNote(dto: NoteDto): Promise<string>
    updateNote(id: string, dto: NoteUpdateDto): Promise<void>
    deleteNote(id: string): Promise<void>
    fetchCategories(): Promise<void>
    createCategory(dto: CategoryDto): Promise<string>
    upsertLocalNote(note: Note): void
    removeLocalNote(id: string): void
}

export function createNoteActions(
    storeLogic: NoteStoreLogic,
    businessLogic: NoteBusinessLogic,
): NoteActions {
    async function fetchNotes(): Promise<void> {
        storeLogic.beginLoad()
        try {
            storeLogic.setNotes(await businessLogic.list())
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load notes')
        } finally {
            storeLogic.endLoad()
        }
    }

    async function createNote(dto: NoteDto): Promise<string> {
        storeLogic.clearError()
        try {
            const note = await businessLogic.create(dto)
            storeLogic.upsertNote(note)
            return note.id
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create note')
            throw e
        }
    }

    async function updateNote(id: string, dto: NoteUpdateDto): Promise<void> {
        storeLogic.clearError()
        try {
            storeLogic.upsertNote(await businessLogic.update(id, dto))
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to update note')
            throw e
        }
    }

    async function deleteNote(id: string): Promise<void> {
        storeLogic.clearError()
        try {
            await businessLogic.remove(id)
            storeLogic.removeNote(id)
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to delete note')
            throw e
        }
    }

    async function fetchCategories(): Promise<void> {
        try {
            storeLogic.setCategories(await businessLogic.listCategories())
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to load categories')
        }
    }

    async function createCategory(dto: CategoryDto): Promise<string> {
        storeLogic.clearError()
        try {
            const category = await businessLogic.createCategory(dto)
            storeLogic.upsertCategory(category)
            return category.id
        } catch (e: unknown) {
            storeLogic.setError(toMessage(e) || 'Failed to create category')
            throw e
        }
    }

    function upsertLocalNote(note: Note): void {
        storeLogic.upsertNote(note)
    }

    function removeLocalNote(id: string): void {
        storeLogic.removeNote(id)
    }

    return {
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        fetchCategories,
        createCategory,
        upsertLocalNote,
        removeLocalNote,
    }
}