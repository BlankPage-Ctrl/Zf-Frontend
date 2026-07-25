import { reactive } from 'vue'

export const settingsDialog = reactive({
    visible: false,
    show() {
        this.visible = true
    },
    hide() {
        this.visible = false
    },
})

export function useSettingsDialog() {
    return settingsDialog
}