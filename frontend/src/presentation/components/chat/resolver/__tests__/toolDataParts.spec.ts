import { describe, it, expect } from 'vitest'
import type { UIMessage } from 'ai'
import { resolveMessageParts } from '../resolvePartsSchema'
import { isToolDataPartType } from '../../types/schema'
import { isKnownToolName } from '../../helpers/knownTools'

describe('tool data parts', () => {
    it('recognizes data-edit_file as a tool data part', () => {
        expect(isToolDataPartType('data-edit_file')).toBe(true)
        expect(isToolDataPartType('data-nope')).toBe(false)
    })

    it('registers edit_file as a known tool', () => {
        expect(isKnownToolName('edit_file')).toBe(true)
    })

    it('attaches data-edit_file as frontend on the matching tool-call', () => {
        const parts: UIMessage['parts'] = [
            {
                type: 'dynamic-tool',
                toolName: 'edit_file',
                toolCallId: 'c1',
                state: 'output-available',
                input: { raw: 'src/a.ts' },
                output: 'done',
            },
            {
                type: 'data-edit_file',
                id: 'c1:frontend:edit_file',
                data: {
                    toolCallId: 'c1',
                    path: 'src/a.ts',
                    appliedEdits: 1,
                    content: 'new\n',
                    encoding: 'utf-8',
                    size: 4,
                    totalLines: 1,
                    diff: '@@ -1,1 +1,1 @@\n-old\n+new',
                },
            },
        ]
        const resolved = resolveMessageParts(parts)
        expect(resolved).toHaveLength(1)
        const first = resolved[0]
        if (first?.type !== 'tool-call') throw new Error('expected a tool-call part')
        expect(first.toolName).toBe('edit_file')
        const frontend = first.frontend
        if (!frontend || !('path' in frontend) || !('diff' in frontend)) {
            throw new Error('expected edit file tool data')
        }
        expect(frontend.path).toBe('src/a.ts')
        expect(frontend.diff).toContain('+new')
    })
})
