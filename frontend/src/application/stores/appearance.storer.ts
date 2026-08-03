import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { APPEARANCE_PRESETS } from '@/core/entities'

export const useAppearanceStorer = defineStore('appearance', () => {
    const fontSize = ref(14)

    const lineHeight = computed(() => 1.0 + fontSize.value / 20)
    const contentWidth = computed(() => 500 + fontSize.value * 20)

    const preset = computed(() => {
        const match = APPEARANCE_PRESETS.find((p) => p.fontSize === fontSize.value)
        return match ? match.label : 'Custom'
    })

    function setFontSize(v: number): void {
        fontSize.value = v
    }

    return {
        fontSize,
        lineHeight,
        contentWidth,
        preset,
        setFontSize,
    }
})

export type AppearanceStorer = ReturnType<typeof useAppearanceStorer>
