import { useFileExplorerStore } from '../stores/file-explorer'

export function useFileTree(onRequestChildren: (path: string) => void) {
    const store = useFileExplorerStore()

    function handleFolderClick(path: string): void {
        const node = store.getNode(path)
        if (!node?.isDirectory) return

        const loadState = store.getLoadState(path)

        if (loadState === 'idle') {
            store.setLoadState(path, 'loading')
            store.toggleExpand(path)
            onRequestChildren(path)
        } else {
            store.toggleExpand(path)
        }
    }

    function handleNodeClick(path: string): void {
        const node = store.getNode(path)
        if (!node) return

        store.selectNode(path)
        if (node.isDirectory) {
            handleFolderClick(path)
        }
    }

    return { handleFolderClick, handleNodeClick }
}
