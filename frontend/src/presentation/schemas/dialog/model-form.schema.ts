import type { DialogGridSchema } from '@/presentation/components/dialog/types'

export const modelFormSchema: DialogGridSchema = {
    row: {
        columns: {
            modelId: {
                type: 'text-short',
                label: 'Model ID',
                placeholder: 'e.g. gpt-4o',
                span: 6,
                metadata: { require: true },
            },
            displayName: {
                type: 'text-short',
                label: 'Display name',
                placeholder: 'e.g. GPT-4o',
                span: 6,
            },
        },
    },
}
