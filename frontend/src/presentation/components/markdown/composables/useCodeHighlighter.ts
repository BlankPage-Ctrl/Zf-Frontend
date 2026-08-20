import {
    bundledLanguagesInfo,
    createHighlighter,
    type BundledLanguage,
    type Highlighter,
    type SpecialLanguage,
    type TokensResult,
} from 'shiki'

export const DEFAULT_LIGHT_THEME = 'github-light'
export const DEFAULT_DARK_THEME = 'github-dark'

export type HighlightLanguage = BundledLanguage | SpecialLanguage

let highlighterPromise: Promise<Highlighter> | null = null

function resolveBundledLanguage(lang: string): BundledLanguage | undefined {
    if (!lang) return undefined
    const normalized = lang.toLowerCase()
    const found = bundledLanguagesInfo.find(
        (info) => info.id === normalized || info.aliases?.includes(normalized),
    )
    return found?.id as BundledLanguage | undefined
}

export function resolveLanguage(lang: string): HighlightLanguage {
    return resolveBundledLanguage(lang) ?? ('plaintext' as SpecialLanguage)
}

async function getHighlighter(): Promise<Highlighter> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: [DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME],
            langs: [],
        })
    }
    return highlighterPromise
}

export function useCodeHighlighter() {
    async function toTokens(code: string, lang: string, theme: string): Promise<TokensResult> {
        const highlighter = await getHighlighter()
        const language = resolveLanguage(lang)

        if (!highlighter.getLoadedLanguages().includes(language)) {
            await highlighter.loadLanguage(language)
        }
        if (!highlighter.getLoadedThemes().includes(theme)) {
            await highlighter.loadTheme(theme as Parameters<typeof highlighter.loadTheme>[0])
        }

        return highlighter.codeToTokens(code, { lang: language, theme })
    }

    async function preload(): Promise<void> {
        await getHighlighter()
    }

    return { toTokens, preload }
}

export function disposeSharedHighlighter(): void {
    const promise = highlighterPromise
    highlighterPromise = null
    if (promise) {
        void promise.then((highlighter) => highlighter.dispose())
    }
}