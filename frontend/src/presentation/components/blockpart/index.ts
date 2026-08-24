export type {
    BlockPartVariant,
    BlockPartViewMode,
    BlockPartSourceFormat,
    BlockPartPreviewConfig,
    BlockPartSourceConfig,
    BlockPartSchema,
    ResolvedBlockPart,
} from './types/schema'

export { resolveBlockPartSchema } from './resolver/resolveBlockPartSchema'
export { default as BlockPart } from './BlockPart.vue'
