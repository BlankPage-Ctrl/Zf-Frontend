import type { FeedBlock, FeedEvent, FeedMessage, FeedWorkBlock } from '@/core/entities'
import { toFeedRole } from '@/core/entities'

function cloneMessage(msg: FeedMessage): FeedMessage {
    return { ...msg, blocks: msg.blocks.map((b) => ({ ...b })) }
}

function ensureMessage(
    messages: FeedMessage[],
    id: string,
    role: 'user' | 'assistant',
    runId?: string,
): { list: FeedMessage[]; message: FeedMessage } {
    const idx = messages.findIndex((m) => m.id === id)
    if (idx >= 0) {
        const message = cloneMessage(messages[idx]!)
        if (runId !== undefined && message.runId === undefined) message.runId = runId
        const list = [...messages]
        list[idx] = message
        return { list, message }
    }
    const message: FeedMessage = { id, role, blocks: [] }
    if (runId !== undefined) message.runId = runId
    return { list: [...messages, message], message }
}

function findBlock(message: FeedMessage, sliceId: string): FeedBlock | undefined {
    return message.blocks.find((b) => 'sliceId' in b && b.sliceId === sliceId)
}

/**
 * Reduces one chat-feed event into the message list. Pure: never mutates
 * its input. Used for both live stream chunks and replayed history
 * (history events are completed open+delta+close triples with `role`).
 */
export function applyFeedEvent(messages: FeedMessage[], event: FeedEvent): FeedMessage[] {
    switch (event.type) {
        case 'run-open': {
            const id = event.assistantMessageId ?? event.messageId
            if (!id) return messages
            const { list } = ensureMessage(messages, id, 'assistant', event.runId)
            return list
        }

        case 'run-close':
        case 'oops':
            return messages

        case 'text-open':
        case 'text-delta':
        case 'text-close':
        case 'think-open':
        case 'think-delta':
        case 'think-close': {
            const id = event.messageId
            const sliceId = event.sliceId
            if (!id || !sliceId) return messages
            const isThink = event.type.startsWith('think')
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            const existing = findBlock(message, sliceId)
            if (!existing) {
                message.blocks.push({
                    kind: isThink ? 'think' : 'text',
                    sliceId,
                    text: event.type.endsWith('delta') ? (event.delta ?? '') : '',
                    closed: event.type.endsWith('close'),
                } as FeedBlock)
            } else if (existing.kind === 'text' || existing.kind === 'think') {
                if (event.type.endsWith('delta')) existing.text += event.delta ?? ''
                if (event.type.endsWith('close')) existing.closed = true
            }
            return list
        }

        case 'work-queued':
        case 'work-active':
        case 'work-ok':
        case 'work-bad': {
            const id = event.messageId
            const sliceId = event.sliceId ?? event.callId
            const callId = event.callId ?? event.sliceId
            if (!id || !sliceId || !callId) return messages
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            let work = findBlock(message, sliceId)
            if (!work || work.kind !== 'work') {
                const block: FeedWorkBlock = {
                    kind: 'work',
                    sliceId,
                    callId,
                    implement: event.implement ?? 'unknown',
                    state: 'queued',
                    notices: [],
                }
                if (event.title !== undefined) block.title = event.title
                message.blocks.push(block)
                work = block
            }
            const w = work as FeedWorkBlock
            w.callId = callId
            if (event.implement !== undefined) w.implement = event.implement
            if (event.title !== undefined) w.title = event.title
            if (event.type === 'work-active') {
                w.state = 'active'
                if (event.input !== undefined) w.input = event.input
            } else if (event.type === 'work-ok') {
                w.state = 'ok'
                if (event.input !== undefined) w.input = event.input
                if (event.output !== undefined) w.output = event.output
            } else if (event.type === 'work-bad') {
                w.state = 'bad'
                if (event.input !== undefined) w.input = event.input
                if (event.errorText !== undefined) w.errorText = event.errorText
            }
            return list
        }

        case 'stage-open': {
            const id = event.messageId
            if (!id || event.stage === undefined) return messages
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            message.blocks.push({ kind: 'stage', stage: event.stage })
            return list
        }

        case 'stage-close': {
            const id = event.messageId
            if (!id || event.stage === undefined) return messages
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            const stage = message.blocks.find(
                (b) => b.kind === 'stage' && b.stage === event.stage && b.landed === undefined,
            )
            if (stage && stage.kind === 'stage') stage.landed = event.landed
            else message.blocks.push({ kind: 'stage', stage: event.stage, landed: event.landed })
            return list
        }

        case 'asset': {
            const id = event.messageId
            const sliceId = event.sliceId
            if (!id || !sliceId) return messages
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            if (!findBlock(message, sliceId)) {
                message.blocks.push({
                    kind: 'asset',
                    sliceId,
                    assetKind: event.kind ?? 'link',
                    ...(event.url !== undefined ? { url: event.url } : {}),
                    ...(event.title !== undefined ? { title: event.title } : {}),
                    ...(event.mediaType !== undefined ? { mediaType: event.mediaType } : {}),
                    ...(event.filename !== undefined ? { filename: event.filename } : {}),
                })
            }
            return list
        }

        case 'notice': {
            const id = event.messageId
            const callId = event.callId
            if (!id || !callId) return messages
            const { list, message } = ensureMessage(messages, id, toFeedRole(event.role))
            const work = message.blocks.find(
                (b) => b.kind === 'work' && (b.callId === callId || b.sliceId === callId),
            )
            if (work && work.kind === 'work') {
                work.notices = [...work.notices, event.body]
            } else {
                message.blocks.push({
                    kind: 'work',
                    sliceId: callId,
                    callId,
                    implement: event.implement ?? 'unknown',
                    state: 'queued',
                    notices: [event.body],
                })
            }
            return list
        }

        default:
            return messages
    }
}
