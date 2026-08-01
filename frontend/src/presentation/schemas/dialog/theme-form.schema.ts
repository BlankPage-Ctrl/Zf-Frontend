import type { DialogGridSchema } from '@/presentation/components/dialog/types'

const rgbPattern = '^\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}$'

export const themeFormSchema: DialogGridSchema = {
    row: {
        columns: {
            name: {
                type: 'text-short',
                label: 'Theme Name',
                span: 12,
                metadata: { require: true },
            },
            description: {
                type: 'text-short',
                label: 'Description',
                span: 12,
            },
            bgPrimary: {
                type: 'text-short',
                label: 'Background (R, G, B)',
                span: 6,
                placeholder: '255, 250, 243',
                metadata: { require: true, pattern: rgbPattern },
            },
            bgSecondary: {
                type: 'text-short',
                label: 'Surface (R, G, B)',
                span: 6,
                placeholder: '255, 242, 219',
                metadata: { require: true, pattern: rgbPattern },
            },
            border: {
                type: 'text-short',
                label: 'Border (R, G, B)',
                span: 6,
                placeholder: '255, 229, 191',
                metadata: { require: true, pattern: rgbPattern },
            },
            textPrimary: {
                type: 'text-short',
                label: 'Text (R, G, B)',
                span: 6,
                placeholder: '19, 16, 16',
                metadata: { require: true, pattern: rgbPattern },
            },
            success: {
                type: 'text-short',
                label: 'Success (R, G, B)',
                span: 6,
                placeholder: '34, 197, 93',
                metadata: { require: true, pattern: rgbPattern },
            },
            danger: {
                type: 'text-short',
                label: 'Danger (R, G, B)',
                span: 6,
                placeholder: '246, 36, 64',
                metadata: { require: true, pattern: rgbPattern },
            },
            shadow: {
                type: 'text-short',
                label: 'Shadow (R, G, B)',
                span: 6,
                placeholder: '200, 180, 150',
                metadata: { require: true, pattern: rgbPattern },
            },
        },
    },
}
