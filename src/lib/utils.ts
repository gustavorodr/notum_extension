/**
 * Generate a unique ID using timestamp and random values
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate SHA-256 hash of content for caching and deduplication
 */
export async function calculateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous version for immediate use (less secure but faster)
 */
export function calculateContentHashSync(content: string): string {
  let hash = 0;
  if (content.length === 0) return hash.toString();
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Format time duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check if code is running in extension context
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Get text selection info from DOM
 */
export function getSelectionInfo() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  
  if (!text) return null;

  // Get context around the selection
  const contextRange = range.cloneRange();
  // Expand context manually since Range.expand doesn't exist in all browsers
  const container = range.commonAncestorContainer;
  const fullText = container.textContent || '';
  const context = fullText.substring(
    Math.max(0, range.startOffset - 50),
    Math.min(fullText.length, range.endOffset + 50)
  );

  return {
    text,
    context,
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    containerElement: range.commonAncestorContainer,
  };
}

/**
 * Create CSS selector for an element
 */
export function createSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  const path = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    
    if (current.className) {
      selector += '.' + current.className.split(' ').join('.');
    }
    
    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
    
    if (current?.id) {
      path.unshift(`#${current.id}`);
      break;
    }
  }
  
  return path.join(' > ');
}

/**
 * Download data as file
 */
export function downloadFile(data: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}