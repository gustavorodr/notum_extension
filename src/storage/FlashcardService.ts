import { db } from '@/storage/database';
import { Flashcard } from '@/types';
import { generateId } from '@/lib/utils';

export class FlashcardService {
  async createFlashcard(
    resourceId: string,
    front: string,
    back: string,
    highlightId?: string
  ): Promise<Flashcard> {
    const flashcard: Flashcard = {
      id: generateId(),
      resourceId,
      highlightId,
      front,
      back,
      difficulty: 3,
      nextReview: new Date(),
      reviewCount: 0,
      correctCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.flashcards.add(flashcard);
    return flashcard;
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    return db.flashcards.get(id);
  }

  async getFlashcardsByResource(resourceId: string): Promise<Flashcard[]> {
    return db.flashcards
      .where('resourceId')
      .equals(resourceId)
      .toArray()
      .then(flashcards => flashcards.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
  }

  async getDueFlashcards(): Promise<Flashcard[]> {
    const now = new Date();
    return db.flashcards
      .where('nextReview')
      .belowOrEqual(now)
      .toArray()
      .then(flashcards => flashcards.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime()));
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    return db.flashcards.toArray().then(flashcards => 
      flashcards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  }

  async updateFlashcard(
    id: string,
    updates: Partial<Pick<Flashcard, 'front' | 'back' | 'difficulty'>>
  ): Promise<void> {
    await db.flashcards.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async reviewFlashcard(id: string, correct: boolean): Promise<void> {
    const flashcard = await db.flashcards.get(id);
    if (!flashcard) {
      throw new Error('Flashcard not found');
    }

    const reviewCount = flashcard.reviewCount + 1;
    const correctCount = flashcard.correctCount + (correct ? 1 : 0);
    
    // Calculate next review date using spaced repetition algorithm
    const nextReview = this.calculateNextReview(
      flashcard.difficulty,
      correct,
      flashcard.reviewCount
    );

    // Adjust difficulty based on performance
    let newDifficulty = flashcard.difficulty;
    if (correct && flashcard.reviewCount > 0) {
      newDifficulty = Math.min(5, Math.round((newDifficulty + 0.1) * 10) / 10) as 1 | 2 | 3 | 4 | 5;
    } else if (!correct) {
      newDifficulty = Math.max(1, Math.round((newDifficulty - 0.5) * 10) / 10) as 1 | 2 | 3 | 4 | 5;
    }

    await db.flashcards.update(id, {
      reviewCount,
      correctCount,
      difficulty: newDifficulty,
      nextReview,
      updatedAt: new Date(),
    });
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.flashcards.delete(id);
  }

  private calculateNextReview(difficulty: number, correct: boolean, reviewCount: number): Date {
    const now = new Date();
    let intervalDays: number;

    if (!correct) {
      // If incorrect, review again soon
      intervalDays = 1;
    } else {
      // Spaced repetition intervals based on difficulty and review count
      const baseInterval = Math.pow(2.5, reviewCount) * difficulty;
      intervalDays = Math.min(365, Math.max(1, Math.round(baseInterval)));
    }

    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + intervalDays);
    return nextReview;
  }
}

export const flashcardService = new FlashcardService();