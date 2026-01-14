import '@testing-library/jest-dom';

// Mock Chrome APIs for testing
global.chrome = {
  runtime: {
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