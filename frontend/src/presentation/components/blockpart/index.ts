export type {
    BlockPartVariant,
    BlockPartViewMode,
    BlockPartSourceFormat,
    BlockPartStatus,
    BlockPartPreviewConfig,
    BlockPartSourceConfig,
    BlockPartSchema,
    ResolvedBlockPart,
    BlockPartAction,
} from './types/schema'

export { resolveBlockPartSchema } from './resolver/resolveBlockPartSchema'
export { default as BlockPart } from './BlockPart.vue'
