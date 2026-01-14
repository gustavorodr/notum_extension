import { WorkerBridge } from '@/lib/messaging';
import { Translation } from '@/types';
import { calculateContentHashSync } from '@/lib/utils';

/**
 * Translation Service - Handles text translation with caching
 */
export class TranslationService {
  private worker: WorkerBridge | null = null;
  private cache: Map<string, Translation> = new Map();
  
  constructor() {
    this.initializeWorker();
    this.loadCache();
  }

  private async initializeWorker() {
    try {
      this.worker = new WorkerBridge('workers/translation.js');
    } catch (error) {
      console.error('Failed to initialize translation worker:', error);
    }
  }

  private async loadCache() {
    // Load cached translations from storage
    try {
      const cachedData = await chrome.storage.local.get(['translationCache']);
      if (cachedData.translationCache) {
        const translations: Translation[] = JSON.parse(cachedData.translationCache);
        translations.forEach(translation => {
          this.cache.set(translation.contentHash, translation);
        });
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
  }

  private async saveCache() {
    try {
      const translations = Array.from(this.cache.values());
      await chrome.storage.local.set({
        translationCache: JSON.stringify(translations)
      });
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<string> {
    if (!this.worker) {
      throw new Error('Translation worker not available');
    }

    // Check cache first
    const cacheKey = calculateContentHashSync(`${text}-${sourceLanguage}-${targetLanguage}`);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached.translatedText;
    }

    // Translate using worker
    const translatedText = await this.worker.sendMessage('TRANSLATE', {
      text,
      sourceLanguage,
      targetLanguage,
    });

    // Cache the result
    const translation: Translation = {
      id: `tr_${Date.now()}`,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      contentHash: cacheKey,
      createdAt: new Date(),
    };

    this.cache.set(cacheKey, translation);
    await this.saveCache();

    return translatedText;
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.worker) {
      throw new Error('Translation worker not available');
    }

    return await this.worker.sendMessage('DETECT_LANGUAGE', { text });
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    if (!this.worker) {
      return [];
    }

    return await this.worker.sendMessage('GET_SUPPORTED_LANGUAGES', {});
  }

  getCachedTranslations(): Translation[] {
    return Array.from(this.cache.values());
  }

  clearCache(): void {
    this.cache.clear();
    chrome.storage.local.remove(['translationCache']);
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}

// Export singleton instance
export const translationService = new TranslationService();