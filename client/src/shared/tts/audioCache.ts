import { db, type AudioCacheEntry } from '../db/schema';

/** 오디오 캐시가 차지할 수 있는 최대 용량(약 300MB) */
export const MAX_CACHE_BYTES = 300 * 1024 * 1024;

export interface CacheKeyParams {
  voiceName: string;
  speakingRate: number;
  text: string;
}

/** 키는 SHA-256(voiceName|speakingRate|text)의 16진 문자열이다. */
export async function computeCacheKey({ voiceName, speakingRate, text }: CacheKeyParams): Promise<string> {
  const raw = `${voiceName}|${speakingRate}|${text}`;
  const data = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function getCachedAudio(params: CacheKeyParams): Promise<Blob | undefined> {
  const key = await computeCacheKey(params);
  const entry = await db.audioCache.get(key);
  if (!entry) return undefined;

  await db.audioCache.update(key, { lastAccessedAt: Date.now() });
  return entry.blob;
}

export interface PutCachedAudioParams extends CacheKeyParams {
  blob: Blob;
  bookId?: string;
  lessonId?: string;
}

export async function putCachedAudio(
  params: PutCachedAudioParams,
  maxBytes: number = MAX_CACHE_BYTES,
): Promise<void> {
  const key = await computeCacheKey(params);
  const now = Date.now();
  const entry: AudioCacheEntry = {
    key,
    blob: params.blob,
    sizeBytes: params.blob.size,
    createdAt: now,
    lastAccessedAt: now,
    ...(params.bookId !== undefined ? { bookId: params.bookId } : {}),
    ...(params.lessonId !== undefined ? { lessonId: params.lessonId } : {}),
  };
  await db.audioCache.put(entry);
  await enforceCacheLimit(maxBytes);
}

/** lastAccessedAt이 오래된(LRU) 항목부터 제거해서 용량 상한을 지킨다. */
async function enforceCacheLimit(maxBytes: number): Promise<void> {
  const entries = await db.audioCache.orderBy('lastAccessedAt').toArray();
  let total = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  if (total <= maxBytes) return;

  const keysToDelete: string[] = [];
  for (const entry of entries) {
    if (total <= maxBytes) break;
    keysToDelete.push(entry.key);
    total -= entry.sizeBytes;
  }
  await db.audioCache.bulkDelete(keysToDelete);
}

export async function deleteAudioCacheByBookId(bookId: string): Promise<void> {
  const keys = await db.audioCache.where('bookId').equals(bookId).primaryKeys();
  await db.audioCache.bulkDelete(keys);
}

export async function deleteAudioCacheByLessonId(lessonId: string): Promise<void> {
  const keys = await db.audioCache.where('lessonId').equals(lessonId).primaryKeys();
  await db.audioCache.bulkDelete(keys);
}

export async function clearAudioCache(): Promise<void> {
  await db.audioCache.clear();
}

export async function getAudioCacheUsageBytes(): Promise<number> {
  const entries = await db.audioCache.toArray();
  return entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
}
