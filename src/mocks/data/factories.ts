import type { MockWorkspace, MockProvider, MockModel, MockChat } from './seed'

export function createWorkspace(overrides?: Partial<MockWorkspace>): MockWorkspace {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'New Workspace',
    description: null,
    projectPath: '/home/user/projects/new',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createProvider(overrides?: Partial<MockProvider>): MockProvider {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'New Provider',
    type: 'openai',
    apiKey: undefined,
    baseURL: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createModel(overrides?: Partial<MockModel>): MockModel {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    modelId: 'gpt-4o',
    displayName: null,
    providerId: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createChat(overrides?: Partial<MockChat>): MockChat {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    providerId: null,
    modelId: null,
    systemPrompt: null,
    workspaceId: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function maskApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  if (key.length <= 4) return '****'
  return `***${key.slice(-4)}`
}
