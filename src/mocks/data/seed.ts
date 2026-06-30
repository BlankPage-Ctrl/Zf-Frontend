import type { UIMessage } from 'ai'
import mockMessagesRaw from './mock-messages.json'

export const mockMessages = mockMessagesRaw as UIMessage[]

export const MOCK_IDS = {
    workspace: '550e8400-e29b-41d4-a716-446655440001',
    provider: '550e8400-e29b-41d4-a716-446655440002',
    model: '550e8400-e29b-41d4-a716-446655440003',
    chat: '550e8400-e29b-41d4-a716-446655440004',
} as const

const now = new Date().toISOString()

export interface MockWorkspace {
    id: string
    name: string
    description: string | null
    projectPath: string
    createdAt: string
    updatedAt: string
}

export interface MockProvider {
    id: string
    name: string
    type: string
    apiKey: string | undefined
    baseURL: string | null
    createdAt: string
    updatedAt: string
}

export interface MockModel {
    id: string
    modelId: string
    displayName: string | null
    providerId: string
    createdAt: string
    updatedAt: string
}

export interface MockChat {
    id: string
    title: string
    providerId: string | null
    modelId: string | null
    systemPrompt: string | null
    workspaceId: string
    createdAt: string
    updatedAt: string
}

export interface MockSetting {
    key: string
    value: string
    createdAt: string
    updatedAt: string
}

function ts(): string {
    return new Date().toISOString()
}

class Collection<T extends { id: string }> {
    private items: T[]

    constructor(initial: T[]) {
        this.items = [...initial]
    }

    findAll(): T[] {
        return this.items
    }

    findById(id: string): T | undefined {
        return this.items.find((i) => i.id === id)
    }

    create(item: T): T {
        this.items.push(item)
        return item
    }

    update(id: string, data: Partial<T>): T | null {
        const idx = this.items.findIndex((i) => i.id === id)
        if (idx < 0) return null
        this.items[idx] = Object.assign({}, this.items[idx], data, { updatedAt: ts() }) as T
        return this.items[idx]
    }

    remove(id: string): void {
        this.items = this.items.filter((i) => i.id !== id)
    }

    filter(predicate: (item: T) => boolean): T[] {
        return this.items.filter(predicate)
    }
}

const nowStr = now

export const store = {
    workspaces: new Collection<MockWorkspace>([
        {
            id: MOCK_IDS.workspace,
            name: 'Test Project',
            description: 'A mock workspace for development',
            projectPath: '/home/user/projects/test',
            createdAt: nowStr,
            updatedAt: nowStr,
        },
    ]),

    providers: new Collection<MockProvider>([
        {
            id: MOCK_IDS.provider,
            name: 'OpenAI',
            type: 'openai',
            apiKey: 'sk-***mock',
            baseURL: null,
            createdAt: nowStr,
            updatedAt: nowStr,
        },
    ]),

    models: new Collection<MockModel>([
        {
            id: MOCK_IDS.model,
            modelId: 'gpt-4o',
            displayName: 'GPT-4o',
            providerId: MOCK_IDS.provider,
            createdAt: nowStr,
            updatedAt: nowStr,
        },
    ]),

    chats: new Collection<MockChat>([
        {
            id: MOCK_IDS.chat,
            title: 'Test Chat',
            providerId: MOCK_IDS.provider,
            modelId: MOCK_IDS.model,
            systemPrompt: null,
            workspaceId: MOCK_IDS.workspace,
            createdAt: nowStr,
            updatedAt: nowStr,
        },
    ]),

    settings: {
        _items: [
            {
                key: 'defaultProviderId',
                value: MOCK_IDS.provider,
                createdAt: nowStr,
                updatedAt: nowStr,
            },
            { key: 'defaultModelId', value: MOCK_IDS.model, createdAt: nowStr, updatedAt: nowStr },
        ] as MockSetting[],

        get(key: string): MockSetting | undefined {
            return this._items.find((s) => s.key === key)
        },

        set(key: string, value: string): MockSetting {
            const idx = this._items.findIndex((s) => s.key === key)
            const entry: MockSetting = { key, value, createdAt: nowStr, updatedAt: ts() }
            if (idx < 0) this._items.push(entry)
            else this._items[idx] = entry
            return entry
        },
    },
}
