import Dexie, { Table } from 'dexie';
import {
  User,
  Resource,
  Highlight,
  StudyTrack,
  Flashcard,
  Asset,
  Translation,
  StorageVersion,
} from '@/types';

export class NotumDatabase extends Dexie {
  users!: Table<User>;
  resources!: Table<Resource>;
  highlights!: Table<Highlight>;
  studyTracks!: Table<StudyTrack>;
  flashcards!: Table<Flashcard>;
  assets!: Table<Asset>;
  translations!: Table<Translation>;
  storageVersion!: Table<StorageVersion>;

  constructor() {
    super('NotumDatabase');

    this.version(1).stores({
      users: 'id, name, createdAt',
      resources: 'id, type, url, title, contentHash, createdAt, &url',
      highlights: 'id, resourceId, text, createdAt',
      studyTracks: 'id, name, isTemplate, createdAt',
      flashcards: 'id, resourceId, highlightId, nextReview, difficulty',
      assets: 'id, type, hash, createdAt',
      translations: 'id, contentHash, sourceLanguage, targetLanguage',
      storageVersion: 'version, migratedAt',
    });

    // Define hooks for automatic timestamps
    this.resources.hook('creating', (primaryKey, obj, trans) => {
      (obj as any).createdAt = new Date();
      (obj as any).updatedAt = new Date();
    });

    this.resources.hook('updating', (modifications, primaryKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.highlights.hook('creating', (primaryKey, obj, trans) => {
      (obj as any).createdAt = new Date();
      (obj as any).updatedAt = new Date();
    });

    this.highlights.hook('updating', (modifications, primaryKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.studyTracks.hook('creating', (primaryKey, obj, trans) => {
      (obj as any).createdAt = new Date();
      (obj as any).updatedAt = new Date();
    });

    this.studyTracks.hook('updating', (modifications, primaryKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.flashcards.hook('creating', (primaryKey, obj, trans) => {
      (obj as any).createdAt = new Date();
      (obj as any).updatedAt = new Date();
    });

    this.flashcards.hook('updating', (modifications, primaryKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });
  }
}

// Singleton instance
export const db = new NotumDatabase();