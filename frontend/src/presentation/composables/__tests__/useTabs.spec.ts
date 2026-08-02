import { describe, it, expect } from 'vitest'
import { useTabs } from '../useTabs'

describe('useTabs', () => {
    it('starts empty with no active tab', () => {
        const tabs = useTabs<string>()
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('uses the first initial tab as active', () => {
        const tabs = useTabs(['a', 'b'])
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('opens a tab and activates it', () => {
        const tabs = useTabs<string>()
        tabs.open('a')
        tabs.open('b')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('opening an existing tab only re-activates it', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.open('a')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('isOpen reflects opened tabs', () => {
        const tabs = useTabs<string>()
        tabs.open('a')
        expect(tabs.isOpen('a')).toBe(true)
        expect(tabs.isOpen('b')).toBe(false)
    })

    it('activate switches without reordering', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        expect(tabs.activeId.value).toBe('b')
        expect(tabs.order.value).toEqual(['a', 'b'])
    })

    it('activate is a no-op for unopened tabs', () => {
        const tabs = useTabs(['a'])
        tabs.activate('b')
        expect(tabs.activeId.value).toBe('a')
    })

    it('closing an inactive tab keeps the active tab', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('b')
        tabs.close('a')
        expect(tabs.order.value).toEqual(['b', 'c'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('closing the active tab activates the right neighbor', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('b')
        tabs.close('b')
        expect(tabs.order.value).toEqual(['a', 'c'])
        expect(tabs.activeId.value).toBe('c')
    })

    it('closing the rightmost active tab activates the left neighbor', () => {
        const tabs = useTabs(['a', 'b', 'c'])
        tabs.activate('c')
        tabs.close('c')
        expect(tabs.order.value).toEqual(['a', 'b'])
        expect(tabs.activeId.value).toBe('b')
    })

    it('closing the last tab leaves no active tab', () => {
        const tabs = useTabs(['a'])
        tabs.close('a')
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('closing an unknown tab is a no-op', () => {
        const tabs = useTabs(['a'])
        tabs.close('zzz')
        expect(tabs.order.value).toEqual(['a'])
        expect(tabs.activeId.value).toBe('a')
    })

    it('reset clears everything', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        tabs.reset()
        expect(tabs.order.value).toEqual([])
        expect(tabs.activeId.value).toBeNull()
    })

    it('activeTab computed follows activeId', () => {
        const tabs = useTabs(['a', 'b'])
        tabs.activate('b')
        expect(tabs.activeTab.value).toBe('b')
    })
})
