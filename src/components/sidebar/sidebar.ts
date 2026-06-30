export type SidebarSide = 'left' | 'right'

export interface SidebarConfig {
    minWidth: number
    maxWidth: number
    defaultWidth: number
    side: SidebarSide
}

export const SIDEBAR_DEFAULTS = {
    minWidth: 180,
    maxWidth: 480,
    defaultWidth: 240,
    side: 'left' as SidebarSide,
} as const satisfies SidebarConfig
