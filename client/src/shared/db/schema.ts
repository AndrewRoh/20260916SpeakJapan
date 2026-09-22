import Dexie, { type EntityTable } from 'dexie';
import type { Book, BookSentence, Lesson, ReadingProgress } from '@jp-listening-app/shared';

export interface BookContentRecord {
  bookId: string;
  sentences: BookSentence[];
}

export interface AudioCacheEntry {
  /** SHA-256(voiceName|speakingRate|text) */
  key: string;
  blob: Blob;
  sizeBytes: number;
  createdAt: number;
  lastAccessedAt: number;
  lessonId?: string;
  bookId?: string;
}

export class AppDatabase extends Dexie {
  lessons!: EntityTable<Lesson, 'id'>;
  books!: EntityTable<Book, 'id'>;
  bookContents!: EntityTable<BookContentRecord, 'bookId'>;
  readingProgress!: EntityTable<ReadingProgress, 'bookId'>;
  audioCache!: EntityTable<AudioCacheEntry, 'key'>;

  constructor(name = 'jp-listening-app') {
    super(name);
    this.version(1).stores({
      lessons: 'id, createdAt, level',
      books: 'id, source, addedAt',
      bookContents: 'bookId',
      readingProgress: 'bookId, updatedAt',
      audioCache: 'key, lastAccessedAt, bookId, lessonId',
    });
  }
}

export const db = new AppDatabase();
