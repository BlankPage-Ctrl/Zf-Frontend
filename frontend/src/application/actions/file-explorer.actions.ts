import type { FileExplorerStoreLogic } from '../store-logic/file-explorer.logic'
import type { FEListDirData, FEMeta } from '@/core/entities'

export interface FileExplorerActions {
    loadRoot(workspaceId: string, meta?: FEMeta): Promise<void>
    loadChildren(workspaceId: string, path: string): Promise<void>
    startWatch(workspaceId: string): void
    stopWatch(): void
    toggleExpand(path: string): Promise<void>
    select(path: string | null): Promise<void>
    reset(data: FEListDirData, meta?: FEMeta): void
    dispose(): void
}

export function createFileExplorerActions(logic: FileExplorerStoreLogic): FileExplorerActions {
    return {
        loadRoot: logic.loadRoot,
        loadChildren: logic.loadChildren,
        startWatch: logic.startWatch,
        stopWatch: logic.stopWatch,
        toggleExpand: logic.toggleExpand,
        select: logic.select,
        reset: logic.reset,
        dispose: logic.dispose,
    }
}
