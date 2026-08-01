import type { FEListDirData, FEMeta } from '@/core/entities'
import type { FileRepository, FileWatchPort } from '@/core/repositories'
import type { FileExplorerStorer } from '../stores/file-explorer.storer'

export interface FileExplorerLogicDeps {
    fileRepo: FileRepository
    watch: FileWatchPort
}

export interface FileExplorerStoreLogic {
    loadRoot(workspaceId: string, meta?: FEMeta): Promise<void>
    loadChildren(workspaceId: string, path: string): Promise<void>
    startWatch(workspaceId: string): void
    stopWatch(): void
    toggleExpand(path: string): Promise<void>
    select(path: string | null): Promise<void>
    reset(data: FEListDirData, meta?: FEMeta): void
    dispose(): void
}

export function createFileExplorerLogic(
    getStorer: () => FileExplorerStorer,
    deps: FileExplorerLogicDeps,
): FileExplorerStoreLogic {
    let workspaceId: string | null = null
    let cleanupWatch: (() => void) | null = null

    async function loadRoot(id: string, meta?: FEMeta): Promise<void> {
        workspaceId = id
        try {
            const data = await deps.fileRepo.listDir(id, '.')
            getStorer().reset(data, meta)
        } catch (e) {
            console.error('[FileExplorer] failed to load root:', e)
        }
    }

    async function loadChildren(id: string, path: string): Promise<void> {
        const storer = getStorer()
        storer.setLoadState(path, 'loading')
        try {
            const data = await deps.fileRepo.listDir(id, path)
            storer.loadChildren(data)
        } catch (e) {
            console.error('[FileExplorer] failed to list dir:', path, e)
            storer.setLoadState(path, 'error')
        }
    }

    function startWatch(id: string): void {
        stopWatch()
        cleanupWatch = deps.watch.createWatchConnection(
            id,
            (event) => {
                getStorer().applyWatchEvent(event)
            },
            () => {
                console.error('[FileExplorer] watch connection error')
            },
        )
    }

    function stopWatch(): void {
        cleanupWatch?.()
        cleanupWatch = null
    }

    async function toggleExpand(path: string): Promise<void> {
        const storer = getStorer()
        const node = storer.getNode(path)
        if (!node?.isDirectory) return

        if (storer.getLoadState(path) === 'idle' && workspaceId) {
            storer.setLoadState(path, 'loading')
            storer.toggleExpand(path)
            await loadChildren(workspaceId, path)
            return
        }
        storer.toggleExpand(path)
    }

    async function select(path: string | null): Promise<void> {
        const storer = getStorer()
        storer.selectNode(path)
        if (path) {
            const node = storer.getNode(path)
            if (node?.isDirectory) {
                await toggleExpand(path)
            }
        }
    }

    function reset(data: FEListDirData, meta?: FEMeta): void {
        getStorer().reset(data, meta)
    }

    function dispose(): void {
        stopWatch()
    }

    return {
        loadRoot,
        loadChildren,
        startWatch,
        stopWatch,
        toggleExpand,
        select,
        reset,
        dispose,
    }
}
