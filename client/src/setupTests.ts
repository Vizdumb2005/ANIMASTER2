// Client test setup file
// This file runs before each test file

// Mock browser APIs as needed
import { vi } from 'vitest';

// Mock ResizeObserver for Three.js and other libraries
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

// Mock matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getComputedStyle for layout calculations
window.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn().mockReturnValue(''),
  // Add other commonly used properties
  width: '0px',
  height: '0px',
  position: 'static',
  display: 'block',
  visibility: 'visible',
}));

// Mock requestAnimationFrame for animations
let rafCallbacks: ((time: number) => void)[] = [];
let rafTime = 0;

window.requestAnimationFrame = vi.fn().mockImplementation((callback) => {
  rafCallbacks.push(callback);
  return rafCallbacks.length;
});

window.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  if (id <= rafCallbacks.length) {
    rafCallbacks[id - 1] = () => {};
  }
});

// Advance animation frames for testing
window.advanceAnimationFrame = vi.fn().mockImplementation((time = 16) => {
  rafTime += time;
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(callback => callback(rafTime));
});

// Mock performance API
window.performance = {
  now: vi.fn().mockImplementation(() => Date.now()),
  // Add other performance API methods as needed
} as unknown as Performance;

// Mock navigator APIs
Object.defineProperty(window.navigator, 'userAgent', {
  value: 'vitest',
  configurable: true
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Add global test utilities
globalThis.__TEST__ = true;

console.info('Test setup completed successfully');