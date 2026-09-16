const STORAGE_KEY = 'appearance'

export interface AppearanceBusinessLogic {
    load(): Promise<number | null>
    save(fontSize: number): Promise<void>
}

export function createAppearanceBusinessLogic(): AppearanceBusinessLogic {
    async function load(): Promise<number | null> {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (typeof parsed.fontSize === 'number') {
                    return parsed.fontSize
                }
            }
        } catch {
            /* ignore */
        }
        return null
    }

    async function save(fontSize: number): Promise<void> {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize }))
        } catch {
            /* ignore */
        }
    }

    return {
        load,
        save,
    }
}
