<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration, formatExitBadge, shortCwd } from '../utils/format'

const props = defineProps<{
    command: string
    cwd: string
    exitCode: number | null
    timedOut: boolean
    signal: string | null
    durationMs: number | null
    status: string
    truncated: boolean
    spillPath: string | null
}>()

const badge = computed(() => formatExitBadge(props.exitCode, props.timedOut, props.signal))
const dur = computed(() => formatDuration(props.durationMs))
const cwdLabel = computed(() => shortCwd(props.cwd))

const emit = defineEmits<{ copy: [] }>()

function onCopy() {
    emit('copy')
}
</script>

<template>
    <div class="terminal-header">
        <div class="terminal-header__left">
            <span class="terminal-header__dots" aria-hidden="true">
                <span class="dot dot--red"></span><span class="dot dot--yellow"></span><span class="dot dot--green"></span>
            </span>
            <span v-if="cwdLabel" class="terminal-header__cwd" :title="cwd">{{ cwdLabel }}</span>
        </div>
        <div class="terminal-header__right">
            <span v-if="dur" class="terminal-header__meta">{{ dur }}</span>
            <span v-if="badge" class="terminal-header__badge" :class="`terminal-header__badge--${badge.kind}`">{{ badge.label }}</span>
            <span v-if="status === 'running'" class="terminal-header__badge terminal-header__badge--running">running</span>
            <button class="terminal-header__copy" type="button" title="Copy output" @click="onCopy">Copy</button>
        </div>
    </div>
    <div class="terminal-prompt">
        <span class="terminal-prompt__dollar">$</span>
        <span class="terminal-prompt__cmd">{{ command }}</span>
        <span v-if="truncated" class="terminal-prompt__trunc" :title="spillPath ?? ''"> — truncated<span v-if="spillPath"> · {{ spillPath }}</span></span>
    </div>
</template>

<style scoped>
.terminal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--term-border);
    background: var(--term-header-bg);
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.2;
}
.terminal-header__left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
.terminal-header__dots {
    display: inline-flex;
    gap: 4px;
}
.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}
.dot--red { background: #ff5f56; }
.dot--yellow { background: #ffbd2e; }
.dot--green { background: #27c93f; }
.terminal-header__cwd {
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.terminal-header__right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.terminal-header__meta { opacity: 0.6; }
.terminal-header__badge {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid currentColor;
}
.terminal-header__badge--ok { color: #2da44e; background: rgba(45,164,78,0.12); }
.terminal-header__badge--err { color: #cf222e; background: rgba(207,34,46,0.12); }
.terminal-header__badge--warn { color: #9a6700; background: rgba(154,103,0,0.12); }
.terminal-header__badge--running { color: #8250df; background: rgba(130,80,223,0.12); }
.terminal-header__copy {
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--term-border);
    background: transparent;
    font: inherit;
    cursor: pointer;
    opacity: 0.7;
}
.terminal-header__copy:hover { opacity: 1; background: var(--term-border); }
.terminal-prompt {
    padding: 6px 10px 0 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    gap: 6px;
    align-items: baseline;
    flex-wrap: wrap;
    word-break: break-all;
}
.terminal-prompt__dollar {
    color: #2da44e;
    font-weight: 700;
    user-select: none;
}
.terminal-prompt__cmd { color: var(--term-cmd); }
.terminal-prompt__trunc { opacity: 0.6; font-size: 11px; }
</style>
