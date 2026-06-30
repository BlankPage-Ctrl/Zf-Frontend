import type { ButtonSize } from '../types/schema'

export interface SizingTokens {
  readonly paddingX: number
  readonly paddingY: number
  readonly fontSize: string
  readonly iconSize: number
  readonly gap: number
}

export interface IconOnlySizing {
  readonly padding: number
  readonly iconSize: number
}

export const BUTTON_SIZE_MAP = {
  xs: { paddingX: 2,    paddingY: 1,   fontSize: 'xs', iconSize: 12, gap: 1 },
  sm: { paddingX: 3,    paddingY: 1.5, fontSize: 'sm', iconSize: 14, gap: 1.5 },
  md: { paddingX: 4,    paddingY: 2,   fontSize: 'sm', iconSize: 16, gap: 2 },
  lg: { paddingX: 5,    paddingY: 2.5, fontSize: 'md', iconSize: 18, gap: 2 },
  xl: { paddingX: 6,    paddingY: 3,   fontSize: 'lg', iconSize: 20, gap: 2.5 },
} as const satisfies Record<ButtonSize, SizingTokens>

export const ICON_ONLY_SIZE_MAP = {
  xs: { padding: 1.5, iconSize: 12 },
  sm: { padding: 2,   iconSize: 14 },
  md: { padding: 2.5, iconSize: 16 },
  lg: { padding: 3,   iconSize: 18 },
  xl: { padding: 3.5, iconSize: 20 },
} as const satisfies Record<ButtonSize, IconOnlySizing>
