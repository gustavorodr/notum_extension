import { db } from '@/storage';
import { resourceService } from '@/storage';
import { highlightService } from '@/storage';

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

describe('storage: resources + highlights', () => {
  beforeAll(async () => {
    await db.open();
  });

  beforeEach(async () => {
    await clearDb();
  });

  afterAll(() => {
    db.close();
  });

  test('createResource deduplicates by contentHash', async () => {
    const r1 = await resourceService.createResource('page', 'https://example.com', 'Example', 'Hello world');
    const r2 = await resourceService.createResource('page', 'https://example.com', 'Example', 'Hello world');

    expect(r2.id).toBe(r1.id);
    const all = await resourceService.getAllResources();
    expect(all).toHaveLength(1);
  });

  test('getResourceByUrl finds resource', async () => {
    const r = await resourceService.createResource('page', 'https://example.com/a', 'A');
    const byUrl = await resourceService.getResourceByUrl('https://example.com/a');
    expect(byUrl?.id).toBe(r.id);
  });

  test('createHighlight stores and retrieves highlights by resource', async () => {
    const r = await resourceService.createResource('page', 'https://example.com/h', 'H');

    const h = await highlightService.createHighlight(
      r.id,
      r.url,
      'Selected text',
      'Context text',
      { startOffset: 1, endOffset: 10, selector: 'p:nth-child(1)' },
      '#ffff00',
      'My note'
    );

    const byRes = await highlightService.getHighlightsByResource(r.id);
    expect(byRes.map(x => x.id)).toContain(h.id);
  });

  test('deleteResource cascades to highlights', async () => {
    const r = await resourceService.createResource('page', 'https://example.com/c', 'C');
    await highlightService.createHighlight(
      r.id,
      r.url,
      'Text',
      'Context',
      { startOffset: 0, endOffset: 4, selector: 'div:nth-child(1)' }
    );

    await resourceService.deleteResource(r.id);

    const remainingHighlights = await highlightService.getAllHighlights();
    expect(remainingHighlights).toHaveLength(0);
  });
});
