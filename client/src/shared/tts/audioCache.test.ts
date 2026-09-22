// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/schema';
import {
  clearAudioCache,
  computeCacheKey,
  deleteAudioCacheByBookId,
  deleteAudioCacheByLessonId,
  getAudioCacheUsageBytes,
  getCachedAudio,
  putCachedAudio,
} from './audioCache';

function makeBlob(sizeBytes: number): Blob {
  return new Blob([new Uint8Array(sizeBytes)]);
}

beforeEach(async () => {
  await db.audioCache.clear();
});

afterEach(async () => {
  await db.audioCache.clear();
});

describe('computeCacheKey', () => {
  it('produces the same key for identical inputs', async () => {
    const params = { voiceName: 'ja-JP-Neural2-B', speakingRate: 0.7, text: 'こんにちは' };
    const key1 = await computeCacheKey(params);
    const key2 = await computeCacheKey(params);
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different keys when any input differs', async () => {
    const base = { voiceName: 'ja-JP-Neural2-B', speakingRate: 0.7, text: 'こんにちは' };
    const byVoice = await computeCacheKey({ ...base, voiceName: 'ja-JP-Standard-A' });
    const bySpeed = await computeCacheKey({ ...base, speakingRate: 1.0 });
    const byText = await computeCacheKey({ ...base, text: 'さようなら' });
    const original = await computeCacheKey(base);

    expect(byVoice).not.toBe(original);
    expect(bySpeed).not.toBe(original);
    expect(byText).not.toBe(original);
  });
});

describe('getCachedAudio / putCachedAudio', () => {
  it('returns undefined on a cache miss', async () => {
    const result = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: '없음' });
    expect(result).toBeUndefined();
  });

  it('returns the stored blob on a cache hit without needing extra params', async () => {
    const params = { voiceName: 'ja-JP-Neural2-B', speakingRate: 0.5, text: 'ただいま' };
    await putCachedAudio({ ...params, blob: makeBlob(10) });

    const result = await getCachedAudio(params);
    expect(result).toBeInstanceOf(Blob);
    expect(result?.size).toBe(10);
  });
});

describe('LRU eviction', () => {
  it('evicts the least recently accessed entries once the size cap is exceeded', async () => {
    const maxBytes = 250;
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'one', blob: makeBlob(100) }, maxBytes);
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'two', blob: makeBlob(100) }, maxBytes);

    // 'one'을 다시 조회해서 lastAccessedAt을 최신으로 갱신한다.
    await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'one' });

    // 세 번째 항목을 넣으면 총 용량이 300 > 250이 되어 LRU(=two)가 제거되어야 한다.
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'three', blob: makeBlob(100) }, maxBytes);

    const one = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'one' });
    const two = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'two' });
    const three = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'three' });

    expect(one).toBeDefined();
    expect(two).toBeUndefined();
    expect(three).toBeDefined();
  });
});

describe('origin-scoped deletion', () => {
  it('deletes only entries belonging to the given bookId', async () => {
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'a', blob: makeBlob(1), bookId: 'book-1' });
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'b', blob: makeBlob(1), bookId: 'book-2' });

    await deleteAudioCacheByBookId('book-1');

    const a = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'a' });
    const b = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'b' });
    expect(a).toBeUndefined();
    expect(b).toBeDefined();
  });

  it('deletes only entries belonging to the given lessonId', async () => {
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'a', blob: makeBlob(1), lessonId: 'lesson-1' });
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'b', blob: makeBlob(1), lessonId: 'lesson-2' });

    await deleteAudioCacheByLessonId('lesson-1');

    const a = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'a' });
    const b = await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'b' });
    expect(a).toBeUndefined();
    expect(b).toBeDefined();
  });

  it('clearAudioCache removes everything and resets usage to zero', async () => {
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'a', blob: makeBlob(50) });
    await putCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'b', blob: makeBlob(50) });

    await clearAudioCache();

    expect(await getAudioCacheUsageBytes()).toBe(0);
  });
});
