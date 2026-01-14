import { db } from './database';
import { Resource, StudyProgress } from '@/types';
import { generateId, calculateContentHashSync } from '@/lib/utils';

export class ResourceService {
  async createResource(
    type: Resource['type'],
    url: string,
    title: string,
    content?: string,
    metadata: Partial<Resource['metadata']> = {}
  ): Promise<Resource> {
    const contentHash = calculateContentHashSync(content || title + url);
    
    // Check if resource already exists
    const existing = await db.resources.where('contentHash').equals(contentHash).first();
    if (existing) {
      return existing;
    }

    const resource: Resource = {
      id: generateId(),
      type,
      url,
      title,
      content,
      metadata: {
        domain: new URL(url).hostname,
        wordCount: content?.split(' ').length || 0,
        ...metadata,
      },
      contentHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      studyProgress: {
        timeSpent: 0,
        lastVisited: new Date(),
        completionPercentage: 0,
        reviewCount: 0,
      },
    };

    await db.resources.add(resource);
    return resource;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return db.resources.get(id);
  }

  async getResourceByUrl(url: string): Promise<Resource | undefined> {
    return db.resources.where('url').equals(url).first();
  }

  async getAllResources(): Promise<Resource[]> {
    return db.resources.toArray().then(resources => 
      resources.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  }

  async updateProgress(
    resourceId: string,
    progress: Partial<StudyProgress>
  ): Promise<void> {
    await db.resources.update(resourceId, {
      'studyProgress.timeSpent': progress.timeSpent,
      'studyProgress.lastVisited': progress.lastVisited || new Date(),
      'studyProgress.completionPercentage': progress.completionPercentage,
      'studyProgress.reviewCount': progress.reviewCount,
    });
  }

  async deleteResource(id: string): Promise<void> {
    await db.transaction('rw', db.resources, db.highlights, db.flashcards, async () => {
      // Delete associated highlights
      await db.highlights.where('resourceId').equals(id).delete();
      
      // Delete associated flashcards
      await db.flashcards.where('resourceId').equals(id).delete();
      
      // Delete the resource
      await db.resources.delete(id);
    });
  }

  async searchResources(query: string): Promise<Resource[]> {
    const lowerQuery = query.toLowerCase();
    return db.resources
      .filter(resource => 
        resource.title.toLowerCase().includes(lowerQuery) ||
        (resource.content && resource.content.toLowerCase().includes(lowerQuery)) ||
        resource.url.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async getResourcesByType(type: Resource['type']): Promise<Resource[]> {
    return db.resources.where('type').equals(type).toArray();
  }
}