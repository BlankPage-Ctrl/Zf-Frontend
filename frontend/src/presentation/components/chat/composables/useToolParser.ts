import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { UIMessage } from 'ai'
import {
    parseToolName,
    parseToolCallId,
    parseToolCall,
    isToolPart,
    getToolNamesFromMessages,
    getToolCallsFromMessages,
    getAllToolNamesFromMessages,
} from '../helpers/toolNameParser'
import { isKnownToolName } from '../helpers/knownTools'

export function useToolParser(messages: MaybeRefOrGetter<UIMessage[]>) {
    const toolNames = computed(() => getToolNamesFromMessages(toValue(messages)))
    const toolCalls = computed(() => getToolCallsFromMessages(toValue(messages)))
    const allToolNames = computed(() => getAllToolNamesFromMessages(toValue(messages)))

    function hasTool(name: string): boolean {
        return toolNames.value.includes(name)
    }

    function hasKnownTool(name: string): boolean {
        return isKnownToolName(name) && hasTool(name)
    }

    return {
        toolNames,
        toolCalls,
        allToolNames,
        hasTool,
        hasKnownTool,
        parseToolName,
        parseToolCallId,
        parseToolCall,
        isToolPart,
        isKnownToolName,
        getToolNamesFromMessages,
        getToolCallsFromMessages,
    }
}
