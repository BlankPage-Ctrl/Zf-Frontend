# Comment Rule for Code

## JSDoc / Function Comment
- Use `/** */`
- **Concise**: Describe what it does, not how it works
- Add `@example` when needed
- Don't over-explain

```typescript
/**
 * Register multiple shortcuts at once
 *
 * @example
 * ```ts
 * useShortcutGroup([
 *   { key: 's', modifiers: { ctrl: true }, handler: save },
 *   { key: 'z', modifiers: { ctrl: true }, handler: undo },
 * ])
 * ```
 */
```

---

## One-Line Code Comment
- Use `// @` for inline comments
- **Only for important context**, not obvious code
- Position: at end of line or line before

```typescript
const instances = shortcuts.map((config) => useShortcut(config)) // @ Lazy init shortcuts

return {
    disableAll: () => instances.forEach((s) => s.disable()), // @ Batch disable
    enableAll: () => instances.forEach((s) => s.enable()),
    destroyAll: () => instances.forEach((s) => s.destroy()),
    instances,
}
```

---

## Multi-Line Code Comment
- Use `/* @ */` for complex logic
- **One logic = one comment**, don't split it up
- Position: before block starts, in same nested scope
- Never nest comments within comments

```typescript
watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            previouslyFocusedElement = document.activeElement as HTMLElement

            /* @ Focus first input when open; skip close button, prioritize actual input */
            setTimeout(() => {
                const focusables = getFocusableElements()
                if (focusables.length > 0) {
                    const firstInput = dialogRef.value?.querySelector(
                        'input, select, textarea',
                    ) as HTMLElement
                    
                    if (firstInput) {
                        firstInput.focus()
                    } else {
                        focusables[0]?.focus()
                    }
                }
            }, 120)
        } else {
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus()
            }
        }
    },
)
```

---

## Avoid
- ❌ Long explanations of obvious code
- ❌ Comments in the middle of nested logic (run logic first, comment after)
- ❌ "// Disable all shortcut" on a simple one-liner
- ❌ Nested comments `// /* blah */ //`
- ❌ Outdated comments when code changes

---

## Principle
**Concise + `// @` and `/* @ */` signature** = Important context, no noise.