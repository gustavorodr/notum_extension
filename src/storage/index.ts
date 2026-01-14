import { ResourceService } from './ResourceService';
import { HighlightService } from './HighlightService';
import { StudyTrackService } from './StudyTrackService';

// Export services as singletons
export const resourceService = new ResourceService();
export const highlightService = new HighlightService();
export const studyTrackService = new StudyTrackService();

// Re-export database
export { db } from './database';

// Re-export types
export * from '@/types';