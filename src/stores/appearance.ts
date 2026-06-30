import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { settingsApi } from '@/services/settings';

const STORAGE_KEY = 'appearance';

const PRESETS = [
  { label: 'Small', fontSize: 13 },
  { label: 'Medium', fontSize: 14 },
  { label: 'Large', fontSize: 18 },
] as const;

let loaded = false;

export const useAppearanceStore = defineStore('appearance', () => {
  const fontSize = ref(14);

  const lineHeight = computed(() => 1.0 + fontSize.value / 20);
  const contentWidth = computed(() => 500 + fontSize.value * 20);

  const preset = computed(() => {
    const match = PRESETS.find(p => p.fontSize === fontSize.value);
    return match ? match.label : 'Custom';
  });

  function setPreset(label: string) {
    const match = PRESETS.find(p => p.label === label);
    if (match) fontSize.value = match.fontSize;
  }

  async function load() {
    try {
      const res = await settingsApi.getValue(STORAGE_KEY);
      if (res.value) {
        const parsed = JSON.parse(res.value);
        if (typeof parsed.fontSize === 'number') {
          fontSize.value = parsed.fontSize;
        }
      }
    } catch { /* ignore */ }
    loaded = true;
  }

  watch(fontSize, async (v) => {
    if (!loaded) return;
    try {
      await settingsApi.setValue(STORAGE_KEY, JSON.stringify({ fontSize: v }));
    } catch { /* ignore */ }
  });

  return { fontSize, lineHeight, contentWidth, preset, setPreset, load, PRESETS };
});
