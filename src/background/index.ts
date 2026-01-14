import { MessageBus, WorkerBridge } from '@/lib/messaging';
import { resourceService, highlightService, studyTrackService } from '@/storage';
import { generateId } from '@/lib/utils';

class BackgroundService {
  private translationWorker: WorkerBridge | null = null;
  private processingWorker: WorkerBridge | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    console.log('Notum background service started');

    // Initialize workers
    try {
      this.translationWorker = new WorkerBridge('workers/translation.js');
      this.processingWorker = new WorkerBridge('workers/processing.js');
    } catch (error) {
      console.warn('Failed to initialize workers:', error);
    }

    // Set up message listeners
    this.setupMessageListeners();

    // Set up context menus
    this.setupContextMenus();

    // Set up side panel
    this.setupSidePanel();

    // Initialize default study tracks if none exist
    this.initializeDefaultTracks();
  }

  private setupMessageListeners() {
    MessageBus.addListener('SAVE_RESOURCE', this.handleSaveResource.bind(this));
    MessageBus.addListener('SAVE_HIGHLIGHT', this.handleSaveHighlight.bind(this));
    MessageBus.addListener('TRANSLATE_TEXT', this.handleTranslateText.bind(this));
    MessageBus.addListener('ADD_TO_TRACK', this.handleAddToTrack.bind(this));
    MessageBus.addListener('EXPORT_DATA', this.handleExportData.bind(this));
    MessageBus.addListener('IMPORT_DATA', this.handleImportData.bind(this));
  }

  private setupContextMenus() {
    chrome.contextMenus.create({
      id: 'notum-capture-text',
      title: 'Save to Notum',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'notum-translate-text',
      title: 'Translate with Notum',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'notum-capture-page',
      title: 'Capture Page',
      contexts: ['page'],
    });

    chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));
  }

  private setupSidePanel() {
    // Chrome-only: Firefox doesn't implement chrome.sidePanel.
    if (chrome?.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    }
  }

  private async initializeDefaultTracks() {
    try {
      const existingTracks = await studyTrackService.getAllTracks();
      if (existingTracks.length === 0) {
        // Create default study track templates
        await this.createDefaultTracks();
      }
    } catch (error) {
      console.error('Failed to initialize default tracks:', error);
    }
  }

  private async createDefaultTracks() {
    const defaultTracks = [
      {
        name: 'Web Development Fundamentals',
        description: 'Learn the basics of web development including HTML, CSS, and JavaScript',
        objective: 'Build solid foundation in web development technologies',
        prerequisites: ['Basic computer literacy'],
        isTemplate: true,
      },
      {
        name: 'Research Paper Study',
        description: 'Template for studying research papers and academic articles',
        objective: 'Understand and analyze academic research effectively',
        prerequisites: [],
        isTemplate: true,
      },
      {
        name: 'Language Learning',
        description: 'Organize resources for learning a new language',
        objective: 'Achieve conversational proficiency in target language',
        prerequisites: [],
        isTemplate: true,
      },
    ];

    for (const track of defaultTracks) {
      await studyTrackService.createTrack(
        track.name,
        track.description,
        track.objective,
        track.prerequisites,
        track.isTemplate
      );
    }

    console.log('Default study tracks created');
  }

  private async handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    if (!tab?.id) return;

    switch (info.menuItemId) {
      case 'notum-capture-text':
        if (info.selectionText) {
          await this.saveSelectionAsHighlight(info.selectionText, tab);
        }
        break;

      case 'notum-translate-text':
        if (info.selectionText) {
          await this.translateAndShow(info.selectionText, tab);
        }
        break;

      case 'notum-capture-page':
        await this.capturePageFromTab(tab);
        break;
    }
  }

  private async handleSaveResource(data: any) {
    try {
      const resource = await resourceService.createResource(
        data.type,
        data.url,
        data.title,
        data.content,
        data.metadata
      );

      console.log('Resource saved:', resource.id);
      return { success: true, resourceId: resource.id };
    } catch (error) {
      console.error('Failed to save resource:', error);
      throw error;
    }
  }

  private async handleSaveHighlight(data: any) {
    try {
      // First ensure we have a resource for this URL
      let resource = await resourceService.getResourceByUrl(data.url);
      
      if (!resource) {
        resource = await resourceService.createResource(
          'page',
          data.url,
          data.title,
          undefined, // Will be captured later if needed
          {
            domain: new URL(data.url).hostname,
          }
        );
      }

      const highlight = await highlightService.createHighlight(
        resource.id,
        resource.url, // Add the url parameter
        data.text,
        data.context,
        data.position,
        '#ffff00', // Default yellow color
        data.note
      );

      console.log('Highlight saved:', highlight.id);
      return { success: true, highlightId: highlight.id };
    } catch (error) {
      console.error('Failed to save highlight:', error);
      throw error;
    }
  }

  private async handleTranslateText(data: any) {
    try {
      if (!this.translationWorker) {
        throw new Error('Translation worker not available');
      }

      const translation = await this.translationWorker.sendMessage('TRANSLATE', {
        text: data.text,
        sourceLanguage: data.sourceLanguage || 'auto',
        targetLanguage: data.targetLanguage || 'en',
      });

      return { translatedText: translation };
    } catch (error) {
      console.error('Failed to translate text:', error);
      
      // Fallback to a simple mock translation for development
      return { 
        translatedText: `[Translation of: "${data.text.substring(0, 50)}..."]` 
      };
    }
  }

  private async handleAddToTrack(data: any) {
    try {
      await studyTrackService.addResourceToTrack(data.trackId, data.resourceId);
      console.log('Resource added to track:', data.trackId);
      return { success: true };
    } catch (error) {
      console.error('Failed to add resource to track:', error);
      throw error;
    }
  }

  private async handleExportData(data: any) {
    try {
      const exportData = await this.createExportData(data.trackIds);
      return { exportData };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  private async handleImportData(data: any) {
    try {
      await this.importFromData(data.exportData);
      return { success: true };
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  private async saveSelectionAsHighlight(text: string, tab: chrome.tabs.Tab) {
    try {
      await this.handleSaveHighlight({
        text,
        context: text, // Context same as text for context menu selections
        position: {
          startOffset: 0,
          endOffset: text.length,
          selector: 'body', // Generic selector for context menu selections
        },
        url: tab.url,
        title: tab.title,
      });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Notum',
        message: 'Text saved as highlight!',
      });
    } catch (error) {
      console.error('Failed to save selection:', error);
    }
  }

  private async translateAndShow(text: string, tab: chrome.tabs.Tab) {
    try {
      const result = await this.handleTranslateText({ text });
      
      // Send translation back to content script to show
      chrome.tabs.sendMessage(tab.id!, {
        type: 'SHOW_TRANSLATION',
        data: {
          originalText: text,
          translatedText: result.translatedText,
        },
      });
    } catch (error) {
      console.error('Failed to translate selection:', error);
    }
  }

  private async capturePageFromTab(tab: chrome.tabs.Tab) {
    try {
      // Send message to content script to capture page
      chrome.tabs.sendMessage(tab.id!, {
        type: 'CAPTURE_PAGE',
        data: {},
      });
    } catch (error) {
      console.error('Failed to capture page:', error);
    }
  }

  private async createExportData(trackIds?: string[]) {
    const tracks = trackIds ? 
      await Promise.all(trackIds.map(id => studyTrackService.getTrack(id))) :
      await studyTrackService.getAllTracks();

    const resources = await resourceService.getAllResources();
    const highlights = await highlightService.getAllHighlights();

    // Filter resources and highlights based on tracks if specified
    const relevantResourceIds = new Set(
      tracks.flatMap(track => track?.resources || [])
    );

    const filteredResources = trackIds ? 
      resources.filter(r => relevantResourceIds.has(r.id)) : 
      resources;

    const filteredHighlights = trackIds ?
      highlights.filter(h => relevantResourceIds.has(h.resourceId)) :
      highlights;

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      tracks: tracks.filter(Boolean),
      resources: filteredResources,
      highlights: filteredHighlights,
      flashcards: [], // TODO: Implement flashcards
      assets: [], // TODO: Implement assets
      translations: [], // TODO: Implement translations cache
    };
  }

  private async importFromData(exportData: any) {
    // TODO: Implement import functionality
    // This would involve:
    // 1. Validating the import data structure
    // 2. Handling conflicts (same content hash)
    // 3. Importing tracks, resources, highlights
    // 4. Updating references between entities
    console.log('Import functionality to be implemented');
  }
}

// Initialize the background service
new BackgroundService();