import JSZip from 'jszip';
import { ExportData } from '@/types';
import { resourceService, studyTrackService, highlightService } from '@/storage';
import { flashcardService } from '@/storage/FlashcardService';
import { WorkerBridge } from '@/lib/messaging';
import { downloadFile } from '@/lib/utils';

export class ExportImportService {
  private processingWorker: WorkerBridge | null = null;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker() {
    try {
      this.processingWorker = new WorkerBridge('workers/processing.js');
    } catch (error) {
      console.error('Failed to initialize processing worker:', error);
    }
  }

  async exportToMarkdown(trackIds?: string[]): Promise<void> {
    try {
      // Get data to export
      const tracks = trackIds 
        ? await Promise.all(trackIds.map(id => studyTrackService.getTrack(id)))
        : await studyTrackService.getAllTracks();

      const validTracks = tracks.filter(Boolean);
      
      // Get associated resources and highlights
      const resourceIds = new Set(validTracks.flatMap(track => track!.resources));
      const resources = await Promise.all(
        Array.from(resourceIds).map(id => resourceService.getResource(id))
      );
      
      const highlights = await Promise.all(
        Array.from(resourceIds).map(async (resourceId) => {
          return highlightService.getHighlightsByResource(resourceId);
        })
      );
      
      const allHighlights = highlights.flat();
      
      // Process tracks for markdown using worker
      const markdownFiles = this.processingWorker 
        ? await this.processingWorker.sendMessage('PROCESS_MARKDOWN', { tracks: validTracks })
        : this.processMarkdownLocal(validTracks);

      // Create ZIP file
      const zip = new JSZip();
      
      // Add track markdown files
      Object.entries(markdownFiles).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      
      // Add resources markdown
      if (resources.length > 0) {
        let resourcesContent = '# Resources\n\n';
        resources.forEach(resource => {
          if (resource) {
            resourcesContent += `## ${resource.title}\n\n`;
            resourcesContent += `**URL:** ${resource.url}\n\n`;
            resourcesContent += `**Type:** ${resource.type}\n\n`;
            if (resource.content) {
              resourcesContent += `**Content:**\n\n${resource.content}\n\n`;
            }
            resourcesContent += '---\n\n';
          }
        });
        zip.file('Resources.md', resourcesContent);
      }
      
      // Add highlights markdown
      if (allHighlights.length > 0) {
        let highlightsContent = '# Highlights\n\n';
        allHighlights.forEach(highlight => {
          highlightsContent += `## ${highlight.text.substring(0, 50)}...\n\n`;
          highlightsContent += `> ${highlight.text}\n\n`;
          if (highlight.note) {
            highlightsContent += `**Note:** ${highlight.note}\n\n`;
          }
          highlightsContent += `**Context:** ${highlight.context}\n\n`;
          highlightsContent += '---\n\n';
        });
        zip.file('Highlights.md', highlightsContent);
      }
      
      // Add metadata
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        trackCount: validTracks.length,
        resourceCount: resources.filter(Boolean).length,
        highlightCount: allHighlights.length,
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      
      // Generate and download ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      
      const filename = trackIds && trackIds.length === 1 
        ? `${validTracks[0]?.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.zip`
        : `notum_export_${new Date().toISOString().split('T')[0]}.zip`;
      
      downloadFile(url, filename, 'application/zip');
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async exportToJSON(trackIds?: string[]): Promise<void> {
    try {
      const exportData = await this.createExportData(trackIds);
      const jsonString = JSON.stringify(exportData, null, 2);
      
      const filename = `notum_data_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(jsonString, filename, 'application/json');
      
    } catch (error) {
      console.error('JSON export failed:', error);
      throw error;
    }
  }

  async importFromJSON(jsonString: string): Promise<void> {
    try {
      const importData: ExportData = JSON.parse(jsonString);
      
      // Validate import data structure
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import data format');
      }
      
      // Import data with conflict resolution
      await this.importData(importData);
      
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async importFromFile(file: File): Promise<void> {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const text = await file.text();
      await this.importFromJSON(text);
    } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      await this.importFromZIP(file);
    } else {
      throw new Error('Unsupported file type. Please use JSON or ZIP files.');
    }
  }

  private async importFromZIP(file: File): Promise<void> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    // Look for metadata file
    const metadataFile = contents.file('metadata.json');
    if (metadataFile) {
      const metadataContent = await metadataFile.async('text');
      const metadata = JSON.parse(metadataContent);
      console.log('Import metadata:', metadata);
    }
    
    // For now, just log the contents - full ZIP import would need more complex parsing
    console.log('ZIP contents:', Object.keys(contents.files));
    throw new Error('ZIP import not fully implemented yet');
  }

  private async createExportData(trackIds?: string[]): Promise<ExportData> {
    const tracks = trackIds 
      ? await Promise.all(trackIds.map(id => studyTrackService.getTrack(id)))
      : await studyTrackService.getAllTracks();

    const validTracks = tracks.filter(Boolean);
    
    // Get all associated data
    const resourceIds = new Set(validTracks.flatMap(track => track!.resources));
    const resources = await Promise.all(
      Array.from(resourceIds).map(id => resourceService.getResource(id))
    );
    
    const highlights = await Promise.all(
      Array.from(resourceIds).map(async (resourceId) => {
        return highlightService.getHighlightsByResource(resourceId);
      })
    );
    
    const flashcards = await Promise.all(
      Array.from(resourceIds).map(async (resourceId) => {
        return flashcardService.getFlashcardsByResource(resourceId);
      })
    );

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      user: {
        id: 'local-user',
        name: 'Local User',
        preferences: {
          theme: 'light',
          language: 'en',
          autoTranslate: false,
          studyReminders: true,
          exportFormat: 'markdown',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      resources: resources.filter(Boolean) as any[],
      highlights: highlights.flat(),
      studyTracks: validTracks as any[],
      flashcards: flashcards.flat(),
      assets: [],
      translations: [],
    };
  }

  private async importData(importData: ExportData): Promise<void> {
    // Import resources first
    const resourceIdMap = new Map<string, string>();
    for (const resource of importData.resources) {
      try {
        // Check if resource already exists by content hash
        const existingResource = await resourceService.getResourceByUrl(resource.url);
        
        if (existingResource) {
          resourceIdMap.set(resource.id, existingResource.id);
        } else {
          const newResource = await resourceService.createResource(
            resource.type,
            resource.url,
            resource.title,
            resource.content,
            resource.metadata
          );
          resourceIdMap.set(resource.id, newResource.id);
        }
      } catch (error) {
        console.error('Failed to import resource:', resource.title, error);
      }
    }
    
    // Import highlights
    for (const highlight of importData.highlights) {
      try {
        const newResourceId = resourceIdMap.get(highlight.resourceId);
        if (newResourceId) {
          await highlightService.createHighlight(
            newResourceId,
            highlight.url,
            highlight.text,
            highlight.context,
            highlight.position,
            highlight.color,
            highlight.note
          );
        }
      } catch (error) {
        console.error('Failed to import highlight:', error);
      }
    }
    
    // Import study tracks
    for (const track of importData.studyTracks) {
      try {
        if (!track.isTemplate) {
          // Map resource IDs to new IDs
          const mappedResources = track.resources.map(id => resourceIdMap.get(id)).filter(Boolean) as string[];
          
          const newTrack = await studyTrackService.createTrack(
            track.name,
            track.description,
            track.objective,
            track.prerequisites,
            track.isTemplate
          );
          
          // Add resources to track
          for (const resourceId of mappedResources) {
            await studyTrackService.addResourceToTrack(newTrack.id, resourceId);
          }
        }
      } catch (error) {
        console.error('Failed to import track:', track.name, error);
      }
    }
  }

  private validateImportData(data: any): data is ExportData {
    return (
      data &&
      typeof data.version === 'string' &&
      Array.isArray(data.resources) &&
      Array.isArray(data.highlights) &&
      Array.isArray(data.studyTracks)
    );
  }

  private processMarkdownLocal(tracks: any[]): { [filename: string]: string } {
    const markdownFiles: { [filename: string]: string } = {};
    
    for (const track of tracks) {
      let content = `# ${track.name}\n\n`;
      content += `**Description:** ${track.description}\n\n`;
      content += `**Objective:** ${track.objective}\n\n`;
      
      if (track.prerequisites && track.prerequisites.length > 0) {
        content += `**Prerequisites:**\n`;
        track.prerequisites.forEach((prereq: string) => {
          content += `- ${prereq}\n`;
        });
        content += '\n';
      }
      
      const filename = `${track.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
      markdownFiles[filename] = content;
    }
    
    return markdownFiles;
  }

  destroy() {
    if (this.processingWorker) {
      this.processingWorker.terminate();
    }
  }
}

export const exportImportService = new ExportImportService();