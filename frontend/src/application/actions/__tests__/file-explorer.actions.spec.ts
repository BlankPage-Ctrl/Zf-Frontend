import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFileExplorerActions } from '../file-explorer.actions'
import type { FileExplorerBusinessLogic } from '../../business-logic/file-explorer.logic'
import type { FileExplorerStoreLogic } from '../../store-logic/file-explorer.logic'
import type { FEFileNode, FEWatchEvent } from '@/core/entities'

function setup() {
    const storeLogic = {
        applyWatchEvent: vi.fn<(event: FEWatchEvent) => void>(),
        reset: vi.fn<() => void>(),
        loadChildren: vi.fn<() => void>(),
        setLoadState: vi.fn<() => void>(),
        getNode: vi.fn<() => void>(),
        toggleExpand: vi.fn<() => void>(),
        selectNode: vi.fn<() => void>(),
        getLoadState: vi.fn<() => string>(() => 'idle'),
        isExpanded: vi.fn<() => boolean>(() => false),
    } as unknown as FileExplorerStoreLogic

    const cleanupWatch = vi.fn<() => void>()
    const createWatchConnection = vi.fn<
        (
            id: string,
            onEvent: (event: FEWatchEvent) => void,
            onError?: (error: Event) => void,
        ) => () => void
    >((_id, _onEvent, _onError) => cleanupWatch)
    const businessLogic = {
        listDir: vi.fn<() => Promise<{ nodes: FEFileNode[] }>>(async () => ({ nodes: [] })),
        createWatchConnection,
    } as unknown as FileExplorerBusinessLogic

    const actions = createFileExplorerActions(storeLogic, businessLogic)
    return { actions, storeLogic, businessLogic, cleanupWatch, createWatchConnection }
}

describe('file-explorer actions watch lifecycle', () => {
    beforeEach(() => {
        vi.useRealTimers()
    })

    it('startWatch creates exactly one connection and does not reconnect on error', async () => {
        const { actions, createWatchConnection } = setup()

        actions.startWatch('ws-1')
        expect(createWatchConnection).toHaveBeenCalledTimes(1)

        const onError = createWatchConnection.mock.calls[0]![2]
        expect(onError).toBeTypeOf('function')
        onError?.(new Event('error'))

        await new Promise((resolve) => setTimeout(resolve, 30))
        expect(createWatchConnection).toHaveBeenCalledTimes(1)
    })

    it('startWatch replaces the previous connection', () => {
        const { actions, createWatchConnection } = setup()
        actions.startWatch('ws-1')
        actions.startWatch('ws-1')
        expect(createWatchConnection).toHaveBeenCalledTimes(2)
    })

    it('stopWatch tears down the active connection', () => {
        const { actions, cleanupWatch } = setup()
        actions.startWatch('ws-1')
        actions.stopWatch()
        expect(cleanupWatch).toHaveBeenCalledTimes(1)
    })
})
