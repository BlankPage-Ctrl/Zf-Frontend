<script setup lang="ts">
import { computed } from 'vue'
import type { MentionItem } from '@/core/entities/mention'
import MentionItemRow from './MentionItem.vue'

const props = defineProps<{
    items: MentionItem[]
    activeIndex: number
    grouped?: boolean
    emptyMessage: string
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'select', item: MentionItem): void
}>()

interface Group { kind: string; items: MentionItem[] }

const groups = computed<Group[]>(() => {
    if (!props.grouped) return [{ kind: 'all', items: props.items }]
    const map = new Map<string, MentionItem[]>()
    for (const it of props.items) {
        const arr = map.get(it.kind) ?? []
        arr.push(it)
        map.set(it.kind, arr)
    }
    return Array.from(map.entries()).map(([kind, items]) => ({ kind, items }))
})

function isActive(globalIdx: number): boolean {
    return globalIdx === props.activeIndex
}

function itemGlobalIndex(localIdx: number, groupIdx: number): number {
    if (!props.grouped) return localIdx
    let offset = 0
    for (let i = 0; i < groupIdx; i++) offset += (groups.value[i]?.items.length ?? 0)
    return offset + localIdx
}
</script>

<template>
    <div class="mention-menu" role="listbox">
        <div v-if="loading" class="mention-loading">Loading…</div>
        <template v-else-if="items.length === 0">
            <div class="mention-empty">{{ emptyMessage }}</div>
        </template>
        <template v-else>
            <template v-for="(group, gIdx) in groups" :key="group.kind">
                <div v-if="grouped && groups.length > 1" class="mention-group-label">{{ group.kind }}</div>
                <MentionItemRow
                    v-for="(item, idx) in group.items"
                    :key="item.id"
                    :item="item"
                    :active="isActive(itemGlobalIndex(idx, gIdx))"
                    @click="emit('select', item)"
                />
            </template>
        </template>
    </div>
</template>
