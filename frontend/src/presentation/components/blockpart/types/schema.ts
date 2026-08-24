import type { Component } from 'vue'

export type BlockPartVariant = 'default' | 'compact' | 'detailed'
export type BlockPartViewMode = 'preview' | 'source'
export type BlockPartSourceFormat = 'json' | 'text'

export interface BlockPartPreviewConfig {
    component: Component
    props?: Record<string, unknown>
}

export interface BlockPartSourceConfig {
    component?: Component
    props?: Record<string, unknown>
    data?: unknown
    format?: BlockPartSourceFormat
}

export interface BlockPartSchema {
    title?: string
    icon?: Component | string
    variant?: BlockPartVariant
    collapsible?: boolean
    defaultExpanded?: boolean
    viewToggle?: boolean
    defaultView?: BlockPartViewMode
    preview?: BlockPartPreviewConfig
    source?: BlockPartSourceConfig
}

export interface ResolvedBlockPart {
    title: string
    icon?: Component | string
    variant: BlockPartVariant
    collapsible: boolean
    expanded: boolean
    viewToggle: boolean
    viewMode: BlockPartViewMode
    hasPreview: boolean
    hasSource: boolean
    preview?: BlockPartPreviewConfig
    source?: BlockPartSourceConfig
}
