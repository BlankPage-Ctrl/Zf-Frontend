export { default as FileExplorer } from './FileExplorer.vue'

export type {
  FEFileNode,
  FEListDirData,
  FEMeta,
  FEWatchEvent,
  FEWatchEventType,
  FELoadState,
  FETreeItem,
} from './file-explorer.types.ts'

export { useFileExplorerStore } from '../../stores/file-explorer.ts'
