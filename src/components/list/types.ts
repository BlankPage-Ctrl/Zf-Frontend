import type { Component } from 'vue'

export type ListVariant = 'sidebar' | 'content' | 'compact'
export type ListSize = 'xs' | 'sm' | 'md'

export interface ListItemField<T = unknown> {
  key: string
  label?: string
  format?: (value: unknown, item: T) => string
  class?: string
  visible?: (item: T) => boolean
}

export interface ListItemAction<T = unknown> {
  icon: Component | string
  ariaLabel: string
  variant?: 'ghost' | 'danger'
  size?: 'xs' | 'sm'
  onClick: (item: T) => void
}

export interface ListEmptyAction {
  label: string
  onClick: () => void
}

export interface ListSchema<T = unknown> {
  variant?: ListVariant
  size?: ListSize
  activeKey?: string
  activeId?: string | null
  fields: ListItemField<T>[]
  actions?: ListItemAction<T>[]
  emptyMessage?: string
  emptyAction?: ListEmptyAction
  onSelect?: (item: T) => void
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
