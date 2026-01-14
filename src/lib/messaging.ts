import { Message, WorkerMessage, WorkerResponse } from '@/types';

/**
 * Extension messaging utilities
 */
export class MessageBus {
  private static listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Send message to background script
   */
  static async sendToBackground<T = any>(message: Message): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Send message to active tab
   */
  static async sendToActiveTab<T = any>(message: Message): Promise<T> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabs[0].id!, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Send message to specific tab
   */
  static async sendToTab<T = any>(tabId: number, message: Message): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Add message listener
   */
  static addListener(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Set up Chrome runtime listener if this is the first listener
    if (this.listeners.size === 1) {
      chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
        const callbacks = this.listeners.get(message.type);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              const result = callback(message.data);
              if (result != null && typeof result === 'object' && 'then' in result) {
                (result as Promise<any>).then(sendResponse).catch(error => {
                  console.error('Message handler error:', error);
                  sendResponse({ error: error.message });
                });
                return true; // Will respond asynchronously
              } else {
                sendResponse(result);
              }
            } catch (error) {
              console.error('Message handler error:', error);
              sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
            }
          });
        }
      });
    }
  }

  /**
   * Remove message listener
   */
  static removeListener(type: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(type);
      }
    }
  }
}

/**
 * Web Worker communication utilities
 */
export class WorkerBridge {
  private worker: Worker;
  private messageHandlers: Map<string, (response: WorkerResponse) => void> = new Map();

  constructor(workerScript: string) {
    this.worker = new Worker(chrome.runtime.getURL(workerScript));
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }

  /**
   * Send message to worker and wait for response
   */
  async sendMessage<T = any>(type: string, data: any): Promise<T> {
    const id = `msg_${Date.now()}_${Math.random()}`;
    const message: WorkerMessage = { id, type, data };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error('Worker message timeout'));
      }, 30000); // 30 second timeout

      this.messageHandlers.set(id, (response: WorkerResponse) => {
        clearTimeout(timeout);
        this.messageHandlers.delete(id);
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });

      this.worker.postMessage(message);
    });
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const response = event.data;
    const handler = this.messageHandlers.get(response.id);
    
    if (handler) {
      handler(response);
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);
  }

  /**
   * Terminate the worker
   */
  terminate() {
    this.worker.terminate();
    this.messageHandlers.clear();
  }
}

/**
 * Storage utilities for extension storage
 */
export class StorageUtil {
  /**
   * Get data from Chrome storage
   */
  static async get<T>(keys: string | string[]): Promise<T> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (items) => resolve(items as T));
    });
  }

  /**
   * Set data in Chrome storage
   */
  static async set(items: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve);
    });
  }

  /**
   * Remove data from Chrome storage
   */
  static async remove(keys: string | string[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  /**
   * Clear all data from Chrome storage
   */
  static async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}

/**
 * Convenience function for sending messages
 */
export const sendMessage = MessageBus.sendToBackground;