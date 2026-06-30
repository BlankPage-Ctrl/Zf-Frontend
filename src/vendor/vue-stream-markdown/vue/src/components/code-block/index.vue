<script setup lang="ts">
import type { Component } from 'vue'
import type { CodeNodeRendererProps, Control, SelectOption } from '../../types'
import {
  createCodeBlockControlDescriptors,
  createCodeBlockModel,
  handleCodeBlockControlAction,
  resolveCodePreviewComponent,
  save,
} from '@stream-markdown/core'
import { createReusableTemplate, useClipboard } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useContext, useControls, useI18n, useMermaid } from '../../composables'
import { CODE_PREVIEWERS } from '../previewers'
import Actions from './actions.vue'
import { LANGUAGE_ICONS } from './language-icons'
import LanguageTitle from './language-title.vue'
import PreviewSegmented from './preview-segmented.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CodeNodeRendererProps>(), {})

const {
  beforeDownload,
  cdnOptions,
  codeOptions,
  controls,
  icons: commonIcons,
  isDark,
  mermaidOptions,
  onCopied,
  previewers,
  shikiOptions,
  uiComponents: UI,
} = useContext()

const CodeNode = defineAsyncComponent(() => import('../renderers/code/index.vue'))

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const { t } = useI18n()

const { isControlEnabled, resolveControls } = useControls({
  controls,
})

const { copy, copied } = useClipboard({
  legacy: true,
})

const { installed: hasMermaid, saveMermaid } = useMermaid({
  mermaidOptions,
  cdnOptions,
  shikiOptions,
  isDark,
})

const collapsed = ref<boolean>(false)
const fullscreen = ref<boolean>(false)
const mode = ref<'preview' | 'source'>('source')

const codeBlockModel = computed(() => createCodeBlockModel<Component>({
  node: props.node,
  codeOptions: codeOptions.value,
  controls: controls.value,
  previewers: previewers.value,
  hasMermaid: hasMermaid.value,
  mode: mode.value,
  isPreviewComponent: isVueComponent,
}))

const language = computed(() => codeBlockModel.value.language)
const showLanguageIcon = computed(() => codeBlockModel.value.showLanguageIcon)
const showLanguageName = computed(() => codeBlockModel.value.showLanguageName)
const showLanguageTitle = computed(() => codeBlockModel.value.showLanguageTitle)

const showCopy = computed(() => isControlEnabled('code.copy'))

const icon = computed(() => {
  const custom = codeOptions.value?.language?.[language.value]?.languageIcon
  // Custom language icon component
  if (typeof custom === 'object')
    return custom
  return LANGUAGE_ICONS[language.value as keyof typeof LANGUAGE_ICONS] || commonIcons.value.code
})

const previewPlacement = computed(() => codeBlockModel.value.previewPlacement)
const previewable = computed(() => codeBlockModel.value.previewable)

const PreviewComponent = computed((): Component | undefined => {
  return resolveCodePreviewComponent<Component>(
    language.value,
    previewers.value,
    CODE_PREVIEWERS,
    isVueComponent,
  )
})

const inlineInteractive = computed(() => codeBlockModel.value.inlineInteractive)
const maxHeight = computed(() => codeBlockModel.value.maxHeight)
const downloadOptions = computed(() => codeBlockModel.value.downloadOptions)

const builtinControls = computed((): Control[] => createCodeBlockControlDescriptors({
  collapsed: collapsed.value,
  fullscreen: fullscreen.value,
  copied: copied.value,
  language: language.value,
  showCollapse: false,
  showCopy: showCopy.value,
  showDownload: false,
  showFullscreen: false,
  downloadOptions: downloadOptions.value,
}).map(item => ({
  ...item,
  name: t(item.labelKey ?? ''),
  onClick: (_event: MouseEvent, select?: SelectOption) => handleControlClick(item.key, select),
  visible: () => item.visible ?? true,
})))

const headerControls = computed(
  () => resolveControls<CodeNodeRendererProps>('code', builtinControls.value, props),
)

const modalControls = computed(
  () => resolveControls<CodeNodeRendererProps>('code', headerControls.value, props)
    .filter(i => i.key !== 'collapse'),
)

watch(
  () => previewable.value,
  () => {
    if (previewable.value)
      mode.value = 'preview'
  },
  { immediate: true },
)

function isVueComponent(component: unknown) {
  return !!component && typeof component !== 'boolean'
}

async function handleControlClick(key: string, item?: SelectOption) {
  const state = await handleCodeBlockControlAction({
    key,
    select: item,
    state: {
      collapsed: collapsed.value,
      fullscreen: fullscreen.value,
    },
    node: props.node,
    language: language.value,
    beforeDownload,
    copyText: copy,
    onCopied,
    saveFile: save,
    saveMermaid,
  })

  collapsed.value = state.collapsed
  fullscreen.value = state.fullscreen
}
</script>

<template>
  <DefineTemplate v-slot="{ showPreview }">
    <LanguageTitle
      v-if="showLanguageTitle"
      :icon="icon"
      :language="language"
      :show-icon="showLanguageIcon"
      :show-name="showLanguageName"
    />
    <PreviewSegmented
      v-else-if="previewable && showPreview"
      v-model:mode="mode"
      v-model:collapsed="collapsed"
    />
    <div v-else />
  </DefineTemplate>

  <div
    data-stream-markdown="code-block"
    :data-collapsed="collapsed"
    class="code-block-wrapper"
    :class="[
      { 'code-loading': props.node.loading },
    ]"
  >
    <header
      data-stream-markdown="code-block-header"
      class="code-block-header"
    >
      <slot name="title">
        <ReuseTemplate :show-preview="previewPlacement === 'left'" />
      </slot>

      <slot name="header-center">
        <PreviewSegmented
          v-if="previewable && previewPlacement === 'center'"
          v-model:mode="mode"
          v-model:collapsed="collapsed"
        />
        <div v-else />
      </slot>

      <slot name="actions">
        <div
          data-stream-markdown="actions"
          class="flex gap-1 items-center"
        >
          <PreviewSegmented
            v-if="previewable && previewPlacement === 'right'"
            v-model:mode="mode"
            v-model:collapsed="collapsed"
          />
          <Actions :actions="headerControls" />
          <button
            class="details-toggle"
            @click="collapsed = !collapsed"
            type="button"
          >
            {{ collapsed ? 'Show Detail' : 'Hide' }}
          </button>
        </div>
      </slot>
    </header>

    <main
      v-show="!collapsed"
      data-stream-markdown="code-block-content"
      class="overflow-auto"
      :style="{ maxHeight }"
    >
      <component
        :is="PreviewComponent"
        v-if="previewable"
        v-show="mode === 'preview'"
        v-bind="props"
        :interactive="inlineInteractive"
      />
      <main v-show="mode === 'source'">
        <slot />
      </main>
    </main>

    <component
      :is="UI.Modal"
      v-model:open="fullscreen"
      :header-style="{
        backgroundColor: 'color-mix(in oklab, var(--muted) 80%, transparent)',
        color: 'var(--muted-foreground)',
        borderBottom: '1px solid var(--border)',
      }"
    >
      <template #title>
        <ReuseTemplate :show-preview="previewPlacement === 'left'" />
      </template>

      <template #header-center>
        <PreviewSegmented
          v-if="previewable && previewPlacement === 'center'"
          v-model:mode="mode"
          v-model:collapsed="collapsed"
        />
      </template>

      <template #actions>
        <div
          data-stream-markdown="actions"
          class="flex gap-1 items-center"
        >
          <PreviewSegmented
            v-if="previewable && previewPlacement === 'right'"
            v-model:mode="mode"
            v-model:collapsed="collapsed"
          />
          <Actions :actions="modalControls" />
        </div>
      </template>

      <component
        :is="PreviewComponent"
        v-if="previewable"
        v-show="mode === 'preview'"
        v-bind="props"
        :immediate-render="true"
        container-height="100%"
      />
      <CodeNode
        v-show="mode === 'source'"
        v-bind="props"
        :show-header="false"
      />
    </component>
  </div>
</template>

<style scoped>
.code-block-wrapper {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(var(--third-color), 0.12);
  border-radius: 8px;
  overflow: clip;
}

.code-block-wrapper[data-collapsed="true"] .code-block-header {
  border-bottom: none;
}

.code-block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 12px;
  height: 39px;
  min-height: 39px;
  box-sizing: border-box;
  background: rgba(var(--primary-color), 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(var(--third-color), 0.12);
  position: sticky;
  top: -8px;
  z-index: 5;
}

.code-block-header > :first-child {
  flex: 1;
  display: flex;
  align-items: center;
}

.code-block-header > :last-child {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.code-block-header > :nth-child(2) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.details-toggle {
  padding: 2px 8px;
  border: 1px solid rgba(var(--third-color), 0.15);
  border-radius: 4px;
  background: transparent;
  font-size: 11px;
  color: rgb(var(--text-color));
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
  margin-left: 8px;
}

.details-toggle:hover {
  opacity: 0.8;
}
</style>
