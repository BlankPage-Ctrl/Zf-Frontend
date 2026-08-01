import type { FileRepository, FileWatchPort } from '@/core/repositories'
import type { FEListDirData, FEWatchEvent } from '@/core/entities'

export interface FileExplorerBusinessLogicDeps {
    fileRepo: FileRepository
    watch: FileWatchPort
}

export interface FileExplorerBusinessLogic {
    listDir(workspaceId: string, path: string): Promise<FEListDirData>
    createWatchConnection(
        workspaceId: string,
        onEvent: (event: FEWatchEvent) => void,
        onError?: (error: Event) => void,
    ): () => void
}

export function createFileExplorerBusinessLogic(
    deps: FileExplorerBusinessLogicDeps,
): FileExplorerBusinessLogic {
    return {
        listDir: (workspaceId, path) => deps.fileRepo.listDir(workspaceId, path),
        createWatchConnection: (workspaceId, onEvent, onError) =>
            deps.watch.createWatchConnection(workspaceId, onEvent, onError),
    }
}
