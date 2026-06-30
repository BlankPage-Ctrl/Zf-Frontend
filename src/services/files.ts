import { request } from './client.js'
import type {
    ListDirData,
    ReadFileData,
    GetStatData,
    WatchEvent,
} from '../../../src/fm/types/index.js'
import type { FEListDirData, FEFileNode, FEWatchEvent } from '@/components/file-explorer'

function toFEFileNode(n: ListDirData['nodes'][number]): FEFileNode {
    return {
        id: n.id,
        name: n.name,
        path: n.path,
        type: n.type.toLowerCase() as FEFileNode['type'],
        isDirectory: n.isDirectory,
        size: n.size,
        lastModified: n.lastModified,
        hasChildren: n.hasChildren,
        children: n.children?.map((c) => c.path),
        symlink: n.meta?.symlinkTarget ? { target: n.meta.symlinkTarget } : undefined,
    }
}

function toFEListDirData(data: ListDirData): FEListDirData {
    return {
        requestedPath: data.requestedPath,
        nodes: data.nodes.map(toFEFileNode),
    }
}

function toFEWatchEvent(event: WatchEvent): FEWatchEvent {
    return {
        type: event.type as FEWatchEvent['type'],
        node: toFEFileNode(event.node),
        oldPath: event.oldPath,
        timestamp: event.timestamp,
    }
}

export const filesApi = {
    listDir: (workspaceId: string, path: string) =>
        request<ListDirData>(
            `/workspaces/${workspaceId}/files?path=${encodeURIComponent(path)}`,
        ).then(toFEListDirData),

    getStat: (workspaceId: string, path: string) =>
        request<GetStatData>(
            `/workspaces/${workspaceId}/files/stat?path=${encodeURIComponent(path)}`,
        ),

    readFile: (workspaceId: string, path: string, maxBytes?: number) => {
        let url = `/workspaces/${workspaceId}/files/read?path=${encodeURIComponent(path)}`
        if (maxBytes !== undefined) url += `&maxBytes=${maxBytes}`
        return request<ReadFileData>(url)
    },

    watchEvents: (workspaceId: string): EventSource =>
        new EventSource(`/workspaces/${workspaceId}/files/events`),

    createWatchConnection: (
        workspaceId: string,
        onEvent: (event: FEWatchEvent) => void,
        onError?: (error: Event) => void,
    ): (() => void) => {
        const source = new EventSource(`/workspaces/${workspaceId}/files/events`)
        source.onmessage = (e: MessageEvent) => {
            try {
                const raw = JSON.parse(e.data)
                onEvent(toFEWatchEvent(raw))
            } catch {
                /* skip malformed events */
            }
        }
        if (onError) source.onerror = onError
        return () => source.close()
    },
}

export { toFEWatchEvent }
