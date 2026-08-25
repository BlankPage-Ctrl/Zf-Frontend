export type {
    BlockPartVariant,
    BlockPartViewMode,
    BlockPartSourceFormat,
    BlockPartStatus,
    BlockPartPreviewConfig,
    BlockPartSourceConfig,
    BlockPartSchema,
    ResolvedBlockPart,
} from './types/schema'

export { resolveBlockPartSchema } from './resolver/resolveBlockPartSchema'
export { default as BlockPart } from './BlockPart.vue'
