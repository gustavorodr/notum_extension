import '@testing-library/jest-dom';

// Polyfill structuredClone for environments where Jest/jsdom doesn't expose it.
// Must be defined before importing fake-indexeddb (it uses structuredClone internally).
if (typeof (globalThis as any).structuredClone !== 'function') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const v8 = require('v8') as typeof import('v8');
    // @ts-expect-error - global typing may not include structuredClone
    globalThis.structuredClone = (value: unknown) => v8.deserialize(v8.serialize(value));
  } catch {
    // @ts-expect-error - global typing may not include structuredClone
    globalThis.structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
  }
}

import 'fake-indexeddb/auto';

// Ensure WebCrypto is available for calculateContentHash (jsdom may not provide subtle in some envs)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { webcrypto } = require('crypto');
if (!globalThis.crypto?.subtle) {
  // @ts-expect-error - Node webcrypto type differs slightly from DOM Crypto
  globalThis.crypto = webcrypto;
}

// Common browser globals used in UI
globalThis.confirm = jest.fn(() => true);
globalThis.open = jest.fn();
// @ts-expect-error - jsdom window typing
window.open = globalThis.open;

// Mock Chrome APIs for testing
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  sidePanel: {
    open: jest.fn(),
    setPanelBehavior: jest.fn(),
  },
} as any;