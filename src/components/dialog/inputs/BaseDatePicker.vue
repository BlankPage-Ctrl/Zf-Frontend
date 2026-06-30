<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  inheritAttrs: false
});

type Props = {
  modelValue: unknown;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  dense?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  required: false,
  disabled: false,
  dense: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

const inputValue = computed({
  get: () => {
    const v = props.modelValue;
    if (v == null) return '';
    return String(v);
  },
  set: (val: unknown) => emit('update:modelValue', val)
});

const handleBlur = (e: FocusEvent) => {
  emit('blur', e);
};

const handleFocus = (e: FocusEvent) => {
  emit('focus', e);
};
</script>

<template>
  <div class="date-field-group">
    <label v-if="label" class="base-label" :class="{ 'label-error': !!error }">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>

    <div class="date-wrapper">
      <input
        type="date"
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @blur="handleBlur"
        @focus="handleFocus"
        v-bind="$attrs"
        class="base-date-input"
        :class="{
          'date-dense': dense,
          'date-error': !!error,
          'date-disabled': disabled
        }"
      />
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
.date-field-group {
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

.date-wrapper {
  position: relative;
  width: 100%;
}

.base-date-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid rgba(var(--third-color), 0.3);
  background: rgb(var(--primary-color));
  color: rgb(var(--text-color));
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.base-date-input:hover:not(:disabled) {
  border-color: rgba(var(--third-color), 0.6);
}

.base-date-input:focus:not(:disabled) {
  border-color: rgb(var(--third-color));
  box-shadow: 0 0 0 2px rgba(var(--third-color), 0.15);
  background: rgb(var(--primary-color));
}

/* Custom Calendar Icon styling */
.base-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 150ms ease;
}

.base-date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 0.8;
}

.date-dense {
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
}

.date-error {
  border-color: rgb(var(--red-color)) !important;
}

.date-error:focus:not(:disabled) {
  box-shadow: 0 0 0 2px rgba(var(--red-color), 0.15) !important;
}

.date-disabled {
  background-color: rgba(var(--secondary-color), 0.4);
  color: rgba(var(--text-color), 0.45);
  cursor: not-allowed;
  border-color: rgba(var(--third-color), 0.15);
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
