// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import type { Book, BookSentence, Lesson } from '@jp-listening-app/shared';
import { db } from './schema';
import {
  DeleteBundledBookError,
  deleteBook,
  deleteLesson,
  getBookSentences,
  getReadingProgress,
  listBooks,
  listLessons,
  saveBook,
  saveLesson,
  saveReadingProgress,
} from './repositories';
import { getCachedAudio, putCachedAudio } from '../tts/audioCache';

afterEach(async () => {
  await db.books.clear();
  await db.bookContents.clear();
  await db.readingProgress.clear();
  await db.lessons.clear();
  await db.audioCache.clear();
});

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: '테스트 책',
    source: 'user',
    encoding: 'utf-8',
    sizeBytes: 100,
    addedAt: Date.now(),
    ...overrides,
  };
}

function makeSentences(): BookSentence[] {
  return [{ index: 0, text: 'こんにちは。', tokens: [{ surface: 'こんにちは。' }] }];
}

describe('deleteBook', () => {
  it('rejects deleting a bundled book and keeps it intact', async () => {
    const book = makeBook({ id: 'bundled-1', source: 'bundled' });
    await saveBook(book, makeSentences());

    await expect(deleteBook('bundled-1')).rejects.toBeInstanceOf(DeleteBundledBookError);
    const books = await listBooks();
    expect(books).toHaveLength(1);
  });

  it('deletes a user book along with its sentences, reading progress, and audio cache', async () => {
    const book = makeBook({ id: 'user-1', source: 'user' });
    await saveBook(book, makeSentences());
    await saveReadingProgress({ bookId: 'user-1', sentenceIndex: 3, updatedAt: Date.now() });
    await putCachedAudio({
      voiceName: 'v',
      speakingRate: 1,
      text: 'こんにちは。',
      blob: new Blob(['x']),
      bookId: 'user-1',
    });

    await deleteBook('user-1');

    expect(await listBooks()).toHaveLength(0);
    expect(await getBookSentences('user-1')).toEqual([]);
    expect(await getReadingProgress('user-1')).toBeUndefined();
    expect(
      await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'こんにちは。' }),
    ).toBeUndefined();
  });
});

describe('deleteLesson', () => {
  function makeLesson(): Lesson {
    return {
      id: 'lesson-1',
      title: '레슨',
      topic: '편의점',
      level: 'N5',
      createdAt: Date.now(),
      lines: [],
    };
  }

  it('removes the lesson and its lesson-scoped audio cache', async () => {
    await saveLesson(makeLesson());
    await putCachedAudio({
      voiceName: 'v',
      speakingRate: 1,
      text: 'いらっしゃいませ',
      blob: new Blob(['x']),
      lessonId: 'lesson-1',
    });

    await deleteLesson('lesson-1');

    expect(await listLessons()).toHaveLength(0);
    expect(
      await getCachedAudio({ voiceName: 'v', speakingRate: 1, text: 'いらっしゃいませ' }),
    ).toBeUndefined();
  });
});
