import type { Book, BookSentence, Lesson, ReadingProgress } from '@jp-listening-app/shared';
import { db } from './schema';
import { deleteAudioCacheByBookId, deleteAudioCacheByLessonId } from '../tts/audioCache';

export class DeleteBundledBookError extends Error {
  constructor() {
    super('내장 책은 삭제할 수 없습니다.');
    this.name = 'DeleteBundledBookError';
  }
}

// ── Lessons ─────────────────────────────────────────────

export async function listLessons(): Promise<Lesson[]> {
  return db.lessons.orderBy('createdAt').reverse().toArray();
}

export async function getLesson(id: string): Promise<Lesson | undefined> {
  return db.lessons.get(id);
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  await db.lessons.put(lesson);
}

export async function deleteLesson(id: string): Promise<void> {
  await db.lessons.delete(id);
  await deleteAudioCacheByLessonId(id);
}

// ── Books ───────────────────────────────────────────────

export async function listBooks(): Promise<Book[]> {
  return db.books.orderBy('addedAt').reverse().toArray();
}

export async function getBook(id: string): Promise<Book | undefined> {
  return db.books.get(id);
}

export async function getBookSentences(bookId: string): Promise<BookSentence[]> {
  const record = await db.bookContents.get(bookId);
  return record?.sentences ?? [];
}

export async function saveBook(book: Book, sentences: BookSentence[]): Promise<void> {
  await db.transaction('rw', db.books, db.bookContents, async () => {
    await db.books.put(book);
    await db.bookContents.put({ bookId: book.id, sentences });
  });
}

/** 내장 책은 저장소 계층에서 삭제를 거부한다. */
export async function deleteBook(id: string): Promise<void> {
  const book = await db.books.get(id);
  if (!book) return;
  if (book.source === 'bundled') {
    throw new DeleteBundledBookError();
  }

  await db.transaction('rw', db.books, db.bookContents, db.readingProgress, async () => {
    await db.books.delete(id);
    await db.bookContents.delete(id);
    await db.readingProgress.delete(id);
  });
  await deleteAudioCacheByBookId(id);
}

// ── Reading progress ────────────────────────────────────

export async function getReadingProgress(bookId: string): Promise<ReadingProgress | undefined> {
  return db.readingProgress.get(bookId);
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  await db.readingProgress.put(progress);
}
