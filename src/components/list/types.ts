import type { Component } from 'vue'

export type ListVariant = 'sidebar' | 'content' | 'compact'
export type ListSize = 'xs' | 'sm' | 'md'

export interface ListItemField {
  key: string
  label?: string
  format?: (value: any, item: any) => string
  class?: string
  visible?: (item: any) => boolean
}

export interface ListItemAction {
  icon: Component | string
  ariaLabel: string
  variant?: 'ghost' | 'danger'
  size?: 'xs' | 'sm'
  onClick: (item: any) => void
}

export interface ListEmptyAction {
  label: string
  onClick: () => void
}

export interface ListSchema {
  variant?: ListVariant
  size?: ListSize
  activeKey?: string
  activeId?: string | null
  fields: ListItemField[]
  actions?: ListItemAction[]
  emptyMessage?: string
  emptyAction?: ListEmptyAction
  onSelect?: (item: any) => void
  class?: string
}

export interface ListClasses {
  root: string
  item: string
  itemActive: string
  itemBody: string
  itemField: string
  itemActions: string
  empty: string
  emptyMessage: string
}
