<script setup lang="ts">
import { computed } from 'vue';
import type { OptionItem } from '../types';

defineOptions({
  inheritAttrs: false
});

type Props = {
  modelValue: any;
  label?: string;
  options: OptionItem[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  dense?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih opsi...',
  required: false,
  disabled: false,
  dense: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
    emit('change', val);
  }
});
</script>

<template>
  <div class="select-field-group">
    <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>

    <div class="select-wrapper">
      <select
        v-model="selectedValue"
        :disabled="disabled"
        v-bind="$attrs"
        class="base-select"
        :class="{
          'select-dense': dense,
          'select-error': !!error,
          'select-disabled': disabled,
          'select-placeholder': selectedValue === undefined || selectedValue === null || selectedValue === ''
        }"
      >
        <option value="" disabled selected>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <div class="select-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>

    <div class="message-container">
      <transition name="slide-fade" mode="out-in">
        <span v-if="error" class="error-text" :key="error">{{ error }}</span>
        <span v-else-if="helperText" class="helper-text" :key="helperText">{{ helperText }}</span>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.select-field-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.base-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--text-color));
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  user-select: none;
  transition: color 150ms ease;
}

.label-error {
  color: rgb(var(--red-color));
  opacity: 0.8;
}

.required-indicator {
  color: rgb(var(--red-color));
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.base-select {
  width: 100%;
  height: 32px;
  padding: 0 32px 0 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid rgba(var(--third-color), 0.3);
  background: rgb(var(--primary-color));
  color: rgb(var(--text-color));
  appearance: none;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.base-select:hover:not(:disabled) {
  border-color: rgba(var(--third-color), 0.6);
}

.base-select:focus:not(:disabled) {
  border-color: rgb(var(--third-color));
  box-shadow: 0 0 0 2px rgba(var(--third-color), 0.15);
  outline: none;
}

.select-dense {
  height: 28px;
  padding: 0 28px 0 8px;
  font-size: 11px;
}

.select-placeholder {
  color: rgba(var(--text-color), 0.3);
}

.select-error {
  border-color: rgb(var(--red-color)) !important;
}

.select-error:focus:not(:disabled) {
  box-shadow: 0 0 0 2px rgba(var(--red-color), 0.15) !important;
}

.select-disabled {
  background-color: rgba(var(--secondary-color), 0.4);
  color: rgba(var(--text-color), 0.45);
  cursor: not-allowed;
  border-color: rgba(var(--third-color), 0.15);
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: rgba(var(--text-color), 0.4);
  pointer-events: none;
  display: flex;
  align-items: center;
  transition: color 150ms ease;
}

.base-select:focus ~ .select-arrow {
  color: rgb(var(--third-color));
}

.message-container {
  min-height: 18px;
  margin-top: 4px;
}

.error-text {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: rgb(var(--red-color));
  line-height: 1.2;
}

.helper-text {
  display: block;
  font-size: 11px;
  color: rgb(var(--text-color));
  opacity: 0.45;
  line-height: 1.2;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 120ms ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-2px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(2px);
}
</style>
