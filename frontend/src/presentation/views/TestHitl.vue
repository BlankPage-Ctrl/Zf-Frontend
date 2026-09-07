<script setup lang="ts">
import { ref, computed } from 'vue'
import { HitlDock } from '@/presentation/components/hitl'
import { createHitlDockSchema } from '@/presentation/schemas'
import type { HitlItemState } from '@/application/stores'
import type { FEHitlRequest, FEHitlRequestType } from '@/core/entities'

const items = ref<HitlItemState[]>([])
let seq = 0

function base(type: FEHitlRequestType, title: string): FEHitlRequest {
    seq += 1
    const now = new Date()
    return {
        id: `dev-${type}-${seq}`,
        type,
        title,
        description: null,
        correlationId: null,
        workspaceId: null,
        chatId: 'dev-chat',
        executionId: `dev-tool-${seq}`,
        metadata: { source: 'dev-preview' },
        status: 'pending',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        payload: {},
    }
}

function push(request: FEHitlRequest) {
    items.value = [...items.value, { request, submitting: false, error: null }]
}

function previewApproval() {
    push({
        ...base('approval', 'Shell approval: rm -rf /tmp/cache'),
        description: '"rm" blocked by "rm -rf *" (restricted) — destructive command needs approval',
        metadata: {
            source: 'shell',
            command: 'rm -rf /tmp/cache',
            cwd: '/home/user/project',
            matchedPattern: 'rm -rf *',
            matchedTier: 'restricted',
        },
        payload: {
            contextPreview: {
                command: 'rm -rf /tmp/cache',
                cwd: '/home/user/project',
                matched: { pattern: 'rm -rf *', tier: 'restricted' },
                reason: 'destructive command needs approval',
            },
        },
    })
}

function previewAsk() {
    push({
        ...base('ask', 'What should I call this function?'),
        description: 'The agent needs a name for the new helper before continuing.',
        payload: { placeholder: 'e.g. formatCurrency', minLength: 2, maxLength: 40 },
    })
}

function previewChoiceSingle() {
    push({
        ...base('choice', 'Pick a package manager'),
        description: 'Which package manager should the agent use to install dependencies?',
        payload: {
            mode: 'single',
            options: [
                { id: 'npm', title: 'npm', description: 'Default Node.js package manager' },
                {
                    id: 'pnpm',
                    title: 'pnpm',
                    description: 'Fast, disk-efficient installs',
                    recommended: true,
                },
                { id: 'yarn', title: 'yarn', description: 'Classic alternative' },
            ],
            defaultSelection: ['pnpm'],
        },
    })
}

function previewChoiceMulti() {
    push({
        ...base('choice', 'Select lint rules to enable'),
        description: 'Choose every rule set the agent should enforce.',
        payload: {
            mode: 'multi',
            minSelect: 1,
            maxSelect: 2,
            allowOther: true,
            options: [
                { id: 'a11y', title: 'Accessibility', description: 'eslint-plugin-jsx-a11y' },
                { id: 'security', title: 'Security', description: 'eslint-plugin-security' },
                { id: 'perf', title: 'Performance', description: 'Custom perf rules' },
            ],
        },
    })
}

function clear() {
    items.value = []
}

/** Simulate a backend round-trip: flash submitting, then resolve locally. */
function simulateResolve(id: string) {
    items.value = items.value.map((item) =>
        item.request.id === id ? { ...item, submitting: true, error: null } : item,
    )
    setTimeout(() => {
        items.value = items.value.filter((item) => item.request.id !== id)
    }, 600)
}

const schema = computed(() =>
    createHitlDockSchema({
        items: items.value,
        onApprove: (id) => simulateResolve(id),
        onDeny: (id) => simulateResolve(id),
        onAskSubmit: (id) => simulateResolve(id),
        onChoiceSubmit: (id) => simulateResolve(id),
        onDismiss: (id) => simulateResolve(id),
    }),
)

const buttonClass =
    'cursor-pointer rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm text-text-primary transition hover:brightness-125'
</script>

<template>
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div class="flex flex-wrap gap-2">
            <button type="button" :class="buttonClass" @click="previewApproval">approval</button>
            <button type="button" :class="buttonClass" @click="previewAsk">ask</button>
            <button type="button" :class="buttonClass" @click="previewChoiceSingle">
                choice
            </button>
            <button type="button" :class="buttonClass" @click="previewChoiceMulti">multi</button>
            <button type="button" :class="buttonClass" @click="clear">clear</button>
        </div>
        <div class="min-h-30 rounded-2xl border border-dashed border-border p-3">
            <HitlDock :schema="schema" />
            <p v-if="!items.length" class="px-6 py-6 text-center text-sm text-text-primary/50">
                No pending requests — click a button above to preview a card.
            </p>
        </div>
    </div>
</template>
