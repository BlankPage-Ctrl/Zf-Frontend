export type CodeRendererStatus = 'idle' | 'streaming' | 'done'

export interface CodeRendererSchema {
    readonly code: string
    readonly lang?: string
    readonly status?: CodeRendererStatus
    readonly isDark?: boolean
    readonly theme?: {
        light?: string
        dark?: string
    }
    readonly fontSize?: number
    readonly lineHeight?: number
}

export interface ResolvedCodeRendererSchema {
    readonly code: string
    readonly lang: string
    readonly status: CodeRendererStatus
    readonly isDark: boolean
    readonly theme: {
        light: string
        dark: string
    }
    readonly fontSize: number
    readonly lineHeight: number
}
