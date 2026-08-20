export { default as Markdown } from './MarkdownView.vue'

export * from './types'

export { defaultRendererRegistry } from './components/nodes'

export { createMarkdownPipeline } from './engine/pipeline'
export { createRenderChunks } from './engine/model'
export { splitStableBlocks } from './engine/splitter'
export { patchStreamingTail } from './engine/tail-fixers'
export { parseMarkdownAst } from './engine/ast'

export { resolveMarkdownSchema } from './resolver/resolveMarkdownSchema'
export { useMarkdownRender } from './composables/useMarkdownRender'
export {
    useCodeHighlighter,
    toTokensCached,
    preloadCommonLanguages,
    resolveLanguage,
    disposeSharedHighlighter,
    DEFAULT_LIGHT_THEME,
    DEFAULT_DARK_THEME,
} from './composables/useCodeHighlighter'