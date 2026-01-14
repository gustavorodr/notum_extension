import { db } from './database';
import { Highlight, HighlightPosition } from '@/types';
import { generateId } from '@/lib/utils';

export class HighlightService {
  async createHighlight(
    resourceId: string,
    url: string,
    text: string,
    context: string,
    position: HighlightPosition,
    color: string = '#ffff00',
    note?: string
  ): Promise<Highlight> {
    const highlight: Highlight = {
      id: generateId(),
      resourceId,
      url,
      text,
      context,
      position,
      color,
      note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.highlights.add(highlight);
    return highlight;
  }

  async getHighlight(id: string): Promise<Highlight | undefined> {
    return db.highlights.get(id);
  }

  async getHighlightsByResource(resourceId: string): Promise<Highlight[]> {
    return db.highlights
      .where('resourceId')
      .equals(resourceId)
      .toArray()
      .then(highlights => highlights.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  }

  async getAllHighlights(): Promise<Highlight[]> {
    return db.highlights.toArray().then(highlights => 
      highlights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  }

  async updateHighlight(
    id: string,
    updates: Partial<Pick<Highlight, 'text' | 'note' | 'color'>>
  ): Promise<void> {
    await db.highlights.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteHighlight(id: string): Promise<void> {
    await db.transaction('rw', db.highlights, db.flashcards, async () => {
      // Delete associated flashcards
      await db.flashcards.where('highlightId').equals(id).delete();
      
      // Delete the highlight
      await db.highlights.delete(id);
    });
  }

  async searchHighlights(query: string): Promise<Highlight[]> {
    const lowerQuery = query.toLowerCase();
    return db.highlights
      .filter(highlight => 
        highlight.text.toLowerCase().includes(lowerQuery) ||
        (highlight.note && highlight.note.toLowerCase().includes(lowerQuery)) ||
        highlight.context.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async getHighlightsByColor(color: string): Promise<Highlight[]> {
    return db.highlights.where('color').equals(color).toArray();
  }
}