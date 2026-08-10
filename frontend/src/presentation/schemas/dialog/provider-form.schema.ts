import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const providerFormSchema: DialogGridSchema = {
    row: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Name',
                placeholder: 'e.g. OpenAI',
                span: 6,
                metadata: { require: true },
            },
            type: {
                type: 'select',
                label: 'Type',
                span: 6,
                metadata: {
                    require: true,
                    options: [
                        { label: 'OpenAI', value: 'openai' },
                        { label: 'OpenAI Compatible', value: 'openai-compatible' },
                        { label: 'OpenRouter', value: 'openrouter' },
                    ],
                },
            },
            apiKey: { type: 'text-short', label: 'API key', placeholder: 'sk-...', span: 12 },
            baseURL: {
                type: 'text-short',
                label: 'Base URL',
                placeholder: 'https://api.example.com/v1',
                span: 12,
            },
        },
    },
}
