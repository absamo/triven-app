import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock browser APIs that are not available in jsdom
const { getComputedStyle } = window
window.getComputedStyle = (elt) => getComputedStyle(elt)
window.HTMLElement.prototype.scrollIntoView = () => { }

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

window.ResizeObserver = ResizeObserver

// Mock react-router navigation - this needs to be done differently
Object.defineProperty(globalThis, 'vi', {
    value: vi,
    writable: false,
    configurable: false,
})
