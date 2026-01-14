import { db } from './database';
import { StudyTrack, TrackProgress, Milestone } from '@/types';
import { generateId } from '@/lib/utils';

export class StudyTrackService {
  async createTrack(
    name: string,
    description: string,
    objective: string,
    prerequisites: string[] = [],
    isTemplate: boolean = false
  ): Promise<StudyTrack> {
    const track: StudyTrack = {
      id: generateId(),
      name,
      title: name, // Set title same as name for compatibility
      description,
      objective,
      prerequisites,
      resources: [],
      lessons: [], // Add empty lessons array
      difficulty: 'beginner', // Set default difficulty
      milestones: [],
      isTemplate,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        currentMilestone: 0,
        completedResources: [],
        completedLessons: 0,
        totalTimeSpent: 0,
      },
    };

    await db.studyTracks.add(track);
    return track;
  }

  async getTrack(id: string): Promise<StudyTrack | undefined> {
    return db.studyTracks.get(id);
  }

  async getAllTracks(): Promise<StudyTrack[]> {
    return db.studyTracks.toArray().then(tracks => 
      tracks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  }

  async getTemplates(): Promise<StudyTrack[]> {
    return db.studyTracks.toArray().then(tracks => 
      tracks.filter(track => track.isTemplate)
    );
  }

  async getUserTracks(): Promise<StudyTrack[]> {
    return db.studyTracks.toArray().then(tracks => 
      tracks.filter(track => !track.isTemplate)
    );
  }

  async addResourceToTrack(trackId: string, resourceId: string): Promise<void> {
    const track = await db.studyTracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    if (!track.resources.includes(resourceId)) {
      track.resources.push(resourceId);
      await db.studyTracks.update(trackId, {
        resources: track.resources,
        updatedAt: new Date(),
      });
    }
  }

  async removeResourceFromTrack(trackId: string, resourceId: string): Promise<void> {
    const track = await db.studyTracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.resources = track.resources.filter(id => id !== resourceId);
    await db.studyTracks.update(trackId, {
      resources: track.resources,
      updatedAt: new Date(),
    });
  }

  async addMilestone(
    trackId: string,
    name: string,
    description: string,
    requiredResources: string[] = []
  ): Promise<void> {
    const track = await db.studyTracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const milestone: Milestone = {
      id: generateId(),
      name,
      description,
      requiredResources,
      order: track.milestones.length,
      completed: false,
    };

    track.milestones.push(milestone);
    await db.studyTracks.update(trackId, {
      milestones: track.milestones,
      updatedAt: new Date(),
    });
  }

  async completeMilestone(trackId: string, milestoneId: string): Promise<void> {
    const track = await db.studyTracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const milestoneIndex = track.milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      throw new Error('Milestone not found');
    }

    track.milestones[milestoneIndex].completed = true;
    track.milestones[milestoneIndex].completedAt = new Date();

    // Update progress
    track.progress.currentMilestone = Math.max(
      track.progress.currentMilestone,
      milestoneIndex + 1
    );

    // Check if track is completed
    if (track.milestones.every(m => m.completed) && !track.progress.completedAt) {
      track.progress.completedAt = new Date();
    }

    await db.studyTracks.update(trackId, {
      milestones: track.milestones,
      progress: track.progress,
      updatedAt: new Date(),
    });
  }

  async updateProgress(
    trackId: string,
    progress: Partial<TrackProgress>
  ): Promise<void> {
    const track = await db.studyTracks.get(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    track.progress = { ...track.progress, ...progress };
    
    if (!track.progress.startedAt && progress.totalTimeSpent && progress.totalTimeSpent > 0) {
      track.progress.startedAt = new Date();
    }

    await db.studyTracks.update(trackId, {
      progress: track.progress,
      updatedAt: new Date(),
    });
  }

  async deleteTrack(id: string): Promise<void> {
    await db.studyTracks.delete(id);
  }

  async duplicateTemplate(templateId: string, name: string): Promise<StudyTrack> {
    const template = await db.studyTracks.get(templateId);
    if (!template || !template.isTemplate) {
      throw new Error('Template not found');
    }

    const newTrack: StudyTrack = {
      ...template,
      id: generateId(),
      name,
      title: name, // Set title same as name for compatibility
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        currentMilestone: 0,
        completedResources: [],
        completedLessons: 0,
        totalTimeSpent: 0,
      },
      milestones: template.milestones.map(milestone => ({
        ...milestone,
        id: generateId(),
        completed: false,
        completedAt: undefined,
      })),
    };

    await db.studyTracks.add(newTrack);
    return newTrack;
  }
}