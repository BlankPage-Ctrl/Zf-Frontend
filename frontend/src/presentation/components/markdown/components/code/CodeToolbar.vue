<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ lang: string; code: string }>()

const emit = defineEmits<{ copy: [] }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const displayLang = computed(() =>
    props.lang === 'text' || props.lang === 'plaintext' ? 'plain text' : props.lang,
)

async function copy(): Promise<void> {
    emit('copy')
    try {
        await navigator.clipboard.writeText(props.code)
    } catch {
        return
    }
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
        copied.value = false
    }, 1600)
}
</script>

<template>
    <div class="markdown-code-toolbar">
        <span class="markdown-code-lang">{{ displayLang }}</span>
        <button type="button" class="markdown-code-copy" @click="copy">
            {{ copied ? 'Copied' : 'Copy' }}
        </button>
    </div>
</template>
