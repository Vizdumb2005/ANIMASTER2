/// <reference types="vite/client" />

declare global {
  interface Window {
    advanceAnimationFrame: (time?: number) => void;
  }

  var __TEST__: boolean;
}

export {};