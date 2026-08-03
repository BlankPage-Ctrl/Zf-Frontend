<script setup lang="ts">
import type { UITableProps } from '../types'

const props = withDefaults(defineProps<UITableProps>(), {})

function getAlign(index: number) {
    return props.getAlign?.(index) || 'left'
}
</script>

<template>
    <table
        data-stream-markdown="table"
        class="border rounded-lg w-full overflow-hidden border-collapse [&_p]:m-0 [&_tr]:border-b"
    >
        <thead
            data-stream-markdown="table-header"
            class="relative [&_th]:text-sm [&_th]:px-4 [&_th]:py-2 [&_th]:whitespace-nowrap"
        >
            <tr>
                <th
                    v-for="(cell, index) in headers"
                    :key="`header-${index}`"
                    :style="{
                        textAlign: getAlign(index),
                    }"
                >
                    <slot name="header-cell" v-bind="{ cell, cellIndex: index }" />
                </th>
            </tr>
        </thead>
        <tbody
            data-stream-markdown="table-body"
            class="font-semibold relative [&_td]:text-sm [&_td]:px-4 [&_td]:py-2"
        >
            <tr v-for="(row, rowIndex) in rows" :key="`${row}-${rowIndex}`">
                <td
                    v-for="(cell, cellIndex) in row.children"
                    :key="cellIndex"
                    :style="{
                        textAlign: getAlign(cellIndex),
                    }"
                >
                    <slot name="body-cell" v-bind="{ cell, rowIndex, cellIndex }" />
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
[data-stream-markdown='table'] {
    border: 1px solid var(--markdown-border);
    border-radius: 8px;
}

[data-stream-markdown='table'] tr {
    border-bottom: 1px solid var(--markdown-border);
}

[data-stream-markdown='table-header'] {
    background-color: color-mix(in srgb, var(--markdown-muted) 80%, transparent);
}

[data-stream-markdown='table-body'] {
    border-top: 1px solid var(--markdown-border);
    border-bottom: 1px solid var(--markdown-border);
    background-color: color-mix(in srgb, var(--markdown-muted) 40%, transparent);
}
</style>
