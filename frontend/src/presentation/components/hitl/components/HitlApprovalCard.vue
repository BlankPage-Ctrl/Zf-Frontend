<script setup lang="ts">
import { computed, ref } from 'vue'
import { WarningTriangle } from '@iconoir/vue'
import type { HitlApprovalCardSchema } from '../types/schema'

const props = defineProps<{
    schema: HitlApprovalCardSchema
}>()

const showRejectReason = ref(false)
const rejectReason = ref('')

const submitting = computed(() => props.schema.submitting)

function approve(always: boolean): void {
    props.schema.onApprove(props.schema.id, always)
}

function deny(): void {
    if (props.schema.requireReasonOnReject && !showRejectReason.value) {
        showRejectReason.value = true
        return
    }
    const reason = rejectReason.value.trim()
    props.schema.onDeny(props.schema.id, reason ? reason : undefined)
}
</script>

<template>
    <div class="hitl-card" data-testid="hitl-approval-card">
        <div class="hitl-card__header">
            <span class="hitl-card__icon">
                <WarningTriangle width="16" height="16" />
            </span>
            <span class="hitl-card__title">{{ schema.title }}</span>
            <span class="hitl-card__type">approval</span>
        </div>
        <p v-if="schema.description" class="hitl-card__desc">{{ schema.description }}</p>
        <div v-if="schema.details.length" class="hitl-card__detail">
            <div v-for="row in schema.details" :key="row.key" class="hitl-card__detail-row">
                <span class="hitl-card__detail-key">{{ row.key }}</span>
                <span>{{ row.value }}</span>
            </div>
        </div>
        <textarea
            v-if="showRejectReason"
            v-model="rejectReason"
            class="hitl-card__input"
            rows="2"
            placeholder="Reason for rejection (required)"
            :disabled="submitting"
        />
        <p v-if="schema.error" class="hitl-card__error">{{ schema.error }}</p>
        <div class="hitl-card__actions">
            <button
                class="hitl-btn hitl-btn--ghost"
                type="button"
                :disabled="submitting"
                @click="deny"
            >
                {{ showRejectReason ? 'Confirm deny' : 'Deny' }}
            </button>
            <button
                class="hitl-btn hitl-btn--secondary"
                type="button"
                :disabled="submitting"
                @click="approve(true)"
            >
                Allow always
            </button>
            <button
                class="hitl-btn hitl-btn--primary"
                type="button"
                :disabled="submitting"
                @click="approve(false)"
            >
                Allow once
            </button>
        </div>
    </div>
</template>

<style scoped src="../styles/index.css"></style>
