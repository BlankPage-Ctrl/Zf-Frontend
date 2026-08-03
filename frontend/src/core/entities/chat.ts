export interface ChatDto {
    title: string
    modelId?: string
    providerId?: string
    systemPrompt?: string
}

export interface Chat {
    id: string
    title: string
    providerId?: string
    modelId?: string
    systemPrompt?: string
    workspaceId: string
    createdAt: string
    updatedAt: string
}
