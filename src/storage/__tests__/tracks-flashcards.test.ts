import { db, studyTrackService, resourceService } from '@/storage';
import { flashcardService } from '@/storage/FlashcardService';

async function clearDb() {
  await db.transaction(
    'rw',
    db.users,
    db.resources,
    db.highlights,
    db.studyTracks,
    db.flashcards,
    db.assets,
    db.translations,
    db.storageVersion,
    async () => {
      await db.users.clear();
      await db.resources.clear();
      await db.highlights.clear();
      await db.studyTracks.clear();
      await db.flashcards.clear();
      await db.assets.clear();
      await db.translations.clear();
      await db.storageVersion.clear();
    }
  );
}

describe('storage: tracks + flashcards', () => {
  beforeAll(async () => {
    await db.open();
  });

  beforeEach(async () => {
    await clearDb();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    db.close();
  });

  test('createTrack and addResourceToTrack', async () => {
    const track = await studyTrackService.createTrack('T1', 'desc', 'obj', [], false);
    const res = await resourceService.createResource('page', 'https://example.com/t', 'Title');

    await studyTrackService.addResourceToTrack(track.id, res.id);

    const updated = await studyTrackService.getTrack(track.id);
    expect(updated?.resources).toContain(res.id);
  });

  test('duplicateTemplate creates non-template track', async () => {
    const template = await studyTrackService.createTrack('Template', 'd', 'o', [], true);
    const newTrack = await studyTrackService.duplicateTemplate(template.id, 'From template');

    expect(newTrack.isTemplate).toBe(false);
    expect(newTrack.name).toBe('From template');
  });

  test('flashcard review updates reviewCount and nextReview', async () => {
    const res = await resourceService.createResource('page', 'https://example.com/f', 'Flash');
    const card = await flashcardService.createFlashcard(res.id, 'front', 'back');

    await flashcardService.reviewFlashcard(card.id, true);

    const updated = await flashcardService.getFlashcard(card.id);
    expect(updated?.reviewCount).toBe(1);
    expect(updated?.nextReview.getTime()).toBeGreaterThan(new Date('2026-01-01T00:00:00.000Z').getTime());
  });
});
