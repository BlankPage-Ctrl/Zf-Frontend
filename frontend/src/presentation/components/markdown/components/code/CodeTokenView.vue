<script setup lang="ts">
import type { ThemedToken } from 'shiki'

defineProps<{ lines: ThemedToken[][] }>()
</script>

<template>
    <span
        v-for="(line, lineIndex) in lines"
        :key="lineIndex"
        class="markdown-code-line"
    >
        <span
            v-for="(token, tokenIndex) in line"
            :key="tokenIndex"
            :style="token.color ? { color: token.color } : undefined"
        >{{ token.content }}</span>{{ lineIndex < lines.length - 1 ? '\n' : '' }}
    </span>
</template>