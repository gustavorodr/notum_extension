import { MessageBus } from '@/lib/messaging';
import { getSelectionInfo, createSelector } from '@/lib/utils';

class ContentScript {
  private selectionEnabled = false;
  private translationEnabled = false;
  private highlightOverlay: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from popup/background
    MessageBus.addListener('CAPTURE_PAGE', this.handleCapturePage.bind(this));
    MessageBus.addListener('ENABLE_TEXT_SELECTION', this.handleEnableSelection.bind(this));
    MessageBus.addListener('ENABLE_TRANSLATION', this.handleEnableTranslation.bind(this));
    MessageBus.addListener('DISABLE_CAPTURE_MODE', this.handleDisableCaptureMode.bind(this));

    // Listen for text selection
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Context menu for quick actions
    this.setupContextMenu();
  }

  private async handleCapturePage() {
    try {
      const pageData = this.extractPageData();
      
      // Send to background script for processing
      await MessageBus.sendToBackground({
        type: 'SAVE_RESOURCE',
        data: {
          type: 'page',
          url: window.location.href,
          title: document.title,
          content: pageData.content,
          metadata: {
            domain: window.location.hostname,
            author: pageData.author,
            publishedAt: pageData.publishedAt,
            wordCount: pageData.wordCount,
            language: document.documentElement.lang || 'en',
          },
        },
      });

      this.showNotification('Page captured successfully!', 'success');
    } catch (error) {
      console.error('Failed to capture page:', error);
      this.showNotification('Failed to capture page', 'error');
    }
  }

  private handleEnableSelection() {
    this.selectionEnabled = true;
    this.showNotification('Text selection mode enabled. Select text to save as highlight.', 'info');
    document.body.style.cursor = 'crosshair';
  }

  private handleEnableTranslation() {
    this.translationEnabled = true;
    this.showNotification('Translation mode enabled. Select text to translate.', 'info');
    document.body.style.cursor = 'help';
  }

  private handleDisableCaptureMode() {
    this.selectionEnabled = false;
    this.translationEnabled = false;
    document.body.style.cursor = '';
    this.hideNotification();
  }

  private async handleTextSelection(event: MouseEvent) {
    if (!this.selectionEnabled && !this.translationEnabled) return;

    const selectionInfo = getSelectionInfo();
    if (!selectionInfo) return;

    if (this.selectionEnabled) {
      await this.saveHighlight(selectionInfo);
    }

    if (this.translationEnabled) {
      await this.translateText(selectionInfo);
    }

    // Reset modes after action
    this.handleDisableCaptureMode();
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Escape key to cancel capture modes
    if (event.key === 'Escape') {
      this.handleDisableCaptureMode();
    }
  }

  private async saveHighlight(selectionInfo: any) {
    try {
      const selector = createSelector(selectionInfo.containerElement.parentElement);
      
      await MessageBus.sendToBackground({
        type: 'SAVE_HIGHLIGHT',
        data: {
          text: selectionInfo.text,
          context: selectionInfo.context,
          position: {
            startOffset: selectionInfo.startOffset,
            endOffset: selectionInfo.endOffset,
            selector: selector,
          },
          url: window.location.href,
          title: document.title,
        },
      });

      // Visual feedback - highlight the text
      this.createHighlightOverlay(selectionInfo);
      this.showNotification('Highlight saved!', 'success');
    } catch (error) {
      console.error('Failed to save highlight:', error);
      this.showNotification('Failed to save highlight', 'error');
    }
  }

  private async translateText(selectionInfo: any) {
    try {
      this.showNotification('Translating...', 'info');

      const translation = await MessageBus.sendToBackground({
        type: 'TRANSLATE_TEXT',
        data: {
          text: selectionInfo.text,
          targetLanguage: 'en', // Default to English, could be configurable
        },
      });

      this.showTranslationOverlay(selectionInfo, translation.translatedText);
    } catch (error) {
      console.error('Failed to translate text:', error);
      this.showNotification('Translation failed', 'error');
    }
  }

  private extractPageData() {
    // Extract main content from the page
    const content = this.extractMainContent();
    const author = this.extractAuthor();
    const publishedAt = this.extractPublishDate();
    const wordCount = content.split(/\s+/).length;

    return {
      content,
      author,
      publishedAt,
      wordCount,
    };
  }

  private extractMainContent(): string {
    // Try to find main content area
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      '.article-body',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanText(element.textContent || '');
      }
    }

    // Fallback to body content, but exclude navigation and footer
    const body = document.body.cloneNode(true) as HTMLElement;
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'nav',
      'header',
      'footer',
      '.navigation',
      '.menu',
      '.sidebar',
      '.comments',
      '.related',
      'script',
      'style',
      '.ads',
      '.advertisement',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = body.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    return this.cleanText(body.textContent || '');
  }

  private extractAuthor(): string | undefined {
    const selectors = [
      '[name="author"]',
      '[property="article:author"]',
      '.author',
      '.byline',
      '[rel="author"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content) return content.trim();
      }
    }

    return undefined;
  }

  private extractPublishDate(): Date | undefined {
    const selectors = [
      '[property="article:published_time"]',
      '[name="publish_date"]',
      'time[datetime]',
      '.publish-date',
      '.post-date',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const datetime = element.getAttribute('datetime') || 
                        element.getAttribute('content') || 
                        element.textContent;
        if (datetime) {
          const date = new Date(datetime);
          if (!isNaN(date.getTime())) return date;
        }
      }
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private createHighlightOverlay(selectionInfo: any) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(255, 255, 0, 0.3);
      pointer-events: none;
      z-index: 10000;
      border-radius: 2px;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(overlay);

    // Remove overlay after animation
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }, 1000);
  }

  private showTranslationOverlay(selectionInfo: any, translation: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      left: ${Math.min(rect.left, window.innerWidth - 300)}px;
      top: ${rect.bottom + 10}px;
      max-width: 280px;
      background: #1f2937;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.2s ease;
    `;

    overlay.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #60a5fa;">
        Translation:
      </div>
      <div>${translation}</div>
      <div style="margin-top: 8px; text-align: right;">
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: 1px solid #374151; color: #d1d5db; 
                       padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 10000);
  }

  private setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        // Could show custom context menu for quick actions
        // For now, we rely on browser's default context menu
      }
    });
  }

  private showNotification(message: string, type: 'info' | 'success' | 'error') {
    const notification = document.createElement('div');
    
    const colors = {
      info: { bg: '#3b82f6', border: '#2563eb' },
      success: { bg: '#10b981', border: '#059669' },
      error: { bg: '#ef4444', border: '#dc2626' },
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type].bg};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid ${colors[type].border};
      font-size: 14px;
      font-weight: 500;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 300px;
      animation: slideInRight 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);

    this.highlightOverlay = notification;
  }

  private hideNotification() {
    if (this.highlightOverlay && this.highlightOverlay.parentElement) {
      this.highlightOverlay.remove();
      this.highlightOverlay = null;
    }
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize content script
new ContentScript();