import {
    bundledLanguagesInfo,
    createHighlighter,
    createJavaScriptRegexEngine,
    type BundledLanguage,
    type Highlighter,
    type RegexEngine,
    type SpecialLanguage,
    type TokensResult,
} from 'shiki'

export const DEFAULT_LIGHT_THEME = 'github-light'
export const DEFAULT_DARK_THEME = 'github-dark'

export type HighlightLanguage = BundledLanguage | SpecialLanguage

const TOKEN_CACHE_MAX = 100
const PRELOAD_LANGUAGES: HighlightLanguage[] = [
    'plaintext',
    'markdown',
    'json',
    'yaml',
    'bash',
    'javascript',
    'typescript',
    'jsx',
    'tsx',
    'css',
    'html',
    'python',
    'go',
    'rust',
    'sql',
]

let highlighterPromise: Promise<Highlighter> | null = null

const languageLoads = new Map<string, Promise<void>>()
const themeLoads = new Map<string, Promise<void>>()
const tokenCache = new Map<string, TokensResult>()

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

function createTokenRegexEngine(): RegexEngine {
    return createJavaScriptRegexEngine({ forgiving: true })
}

function getHighlighter(): Promise<Highlighter> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: [DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME],
            langs: [],
            engine: createTokenRegexEngine(),
        })
    }
    return highlighterPromise
}

function loadLanguageOnce(highlighter: Highlighter, language: HighlightLanguage): Promise<void> {
    if (highlighter.getLoadedLanguages().includes(language)) return Promise.resolve()
    let pending = languageLoads.get(language)
    if (!pending) {
        pending = highlighter.loadLanguage(language).finally(() => languageLoads.delete(language))
        languageLoads.set(language, pending)
    }
    return pending
}

function loadThemeOnce(highlighter: Highlighter, theme: string): Promise<void> {
    if (highlighter.getLoadedThemes().includes(theme)) return Promise.resolve()
    let pending = themeLoads.get(theme)
    if (!pending) {
        pending = highlighter
            .loadTheme(theme as Parameters<typeof highlighter.loadTheme>[0])
            .finally(() => themeLoads.delete(theme))
        themeLoads.set(theme, pending)
    }
    return pending
}

function cacheKey(language: HighlightLanguage, theme: string, code: string): string {
    return `${theme}|${language}|${code}`
}

function cacheTokens(key: string, result: TokensResult): void {
    tokenCache.set(key, result)
    if (tokenCache.size > TOKEN_CACHE_MAX) {
        const oldest = tokenCache.keys().next()
        if (!oldest.done) tokenCache.delete(oldest.value)
    }
}

export async function toTokensCached(
    code: string,
    lang: string,
    theme: string,
): Promise<TokensResult> {
    const language = resolveLanguage(lang)
    const key = cacheKey(language, theme, code)

    const cached = tokenCache.get(key)
    if (cached) return cached

    const highlighter = await getHighlighter()
    await Promise.all([loadLanguageOnce(highlighter, language), loadThemeOnce(highlighter, theme)])

    const result = highlighter.codeToTokens(code, { lang: language, theme })
    cacheTokens(key, result)
    return result
}

export function useCodeHighlighter() {
    async function toTokens(code: string, lang: string, theme: string): Promise<TokensResult> {
        return toTokensCached(code, lang, theme)
    }

    async function preload(): Promise<void> {
        await getHighlighter()
    }

    return { toTokens, preload }
}

export async function preloadCommonLanguages(): Promise<void> {
    const highlighter = await getHighlighter()
    await Promise.all(PRELOAD_LANGUAGES.map((language) => loadLanguageOnce(highlighter, language)))
}

export function disposeSharedHighlighter(): void {
    const promise = highlighterPromise
    highlighterPromise = null
    languageLoads.clear()
    themeLoads.clear()
    tokenCache.clear()
    if (promise) {
        void promise.then((highlighter) => highlighter.dispose())
    }
}
