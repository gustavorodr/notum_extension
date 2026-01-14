// Core domain types for Notum extension

export interface User {
  id: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoTranslate: boolean;
  studyReminders: boolean;
  exportFormat: 'markdown' | 'json';
}

export interface Resource {
  id: string;
  type: 'page' | 'video' | 'pdf';
  url: string;
  title: string;
  content?: string;
  metadata: ResourceMetadata;
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
  studyProgress: StudyProgress;
}

export interface ResourceMetadata {
  domain: string;
  author?: string;
  publishedAt?: Date;
  duration?: number; // for videos in seconds
  wordCount?: number;
  language?: string;
}

export interface StudyProgress {
  timeSpent: number; // in seconds
  lastVisited: Date;
  completionPercentage: number;
  reviewCount: number;
}

export interface Highlight {
  id: string;
  resourceId: string;
  url: string; // Add url property
  text: string;
  context: string;
  position: HighlightPosition;
  color: string;
  note?: string;
  metadata?: { // Add metadata property
    title?: string;
    domain?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightPosition {
  startOffset: number;
  endOffset: number;
  selector: string; // CSS selector or similar
}

export interface StudyTrack {
  id: string;
  name: string;
  title: string; // Add title property for component compatibility
  description: string;
  objective: string;
  prerequisites: string[];
  resources: string[]; // Resource IDs
  lessons: string[]; // Add lessons property for component compatibility
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // Add difficulty property
  milestones: Milestone[];
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  progress: TrackProgress;
}

export interface TrackProgress {
  currentMilestone: number;
  completedResources: string[];
  completedLessons: number; // Add completedLessons property
  totalTimeSpent: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  requiredResources: string[];
  order: number;
  completed: boolean;
  completedAt?: Date;
}

export interface Flashcard {
  id: string;
  resourceId: string;
  highlightId?: string;
  front: string;
  back: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  nextReview: Date;
  reviewCount: number;
  correctCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  localPath?: string;
  contentType: string;
  size: number;
  hash: string;
  createdAt: Date;
}

// Translation types
export interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentHash: string;
  createdAt: Date;
}

// Export/Import types
export interface ExportData {
  version: string;
  exportedAt: Date;
  user: User;
  resources: Resource[];
  highlights: Highlight[];
  studyTracks: StudyTrack[];
  flashcards: Flashcard[];
  assets: Asset[];
  translations: Translation[];
}

// Message types for extension communication
export interface Message {
  type: string;
  data?: any;
}

export interface CaptureTextMessage extends Message {
  type: 'CAPTURE_TEXT';
  data: {
    text: string;
    url: string;
    title: string;
    selection: {
      start: number;
      end: number;
      context: string;
    };
  };
}

export interface TranslateTextMessage extends Message {
  type: 'TRANSLATE_TEXT';
  data: {
    text: string;
    sourceLanguage?: string;
    targetLanguage: string;
  };
}

export interface AddToTrackMessage extends Message {
  type: 'ADD_TO_TRACK';
  data: {
    resourceId: string;
    trackId: string;
  };
}

// Web Worker message types
export interface WorkerMessage {
  id: string;
  type: string;
  data: any;
}

export interface WorkerResponse {
  id: string;
  type: string;
  data: any;
  error?: string;
}

// Storage schema version for migrations
export interface StorageVersion {
  version: number;
  migratedAt: Date;
}