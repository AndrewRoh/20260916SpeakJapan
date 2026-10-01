import type { Book, BookSentence, Lesson, ReadingProgress } from '@jp-listening-app/shared';
import {
  deleteUserDoc,
  getAllUserDocs,
  getUserDoc,
  setUserDoc,
} from '../../shared/firebase/firestoreSync';
import {
  getBookSentences,
  getReadingProgress,
  listBooks,
  listLessons,
  saveBook,
  saveLesson,
  saveReadingProgress,
} from '../../shared/db/repositories';
import { getCurrentUserId } from './authStore';

/** 로컬/클라우드 중 타임스탬프가 더 최신인 쪽을 고른다(둘 중 하나만 있으면 그걸 쓴다). */
export function pickNewer<T>(
  local: T | undefined,
  remote: T | undefined,
  getTimestamp: (item: T) => number,
): T | undefined {
  if (!local) return remote;
  if (!remote) return local;
  return getTimestamp(remote) >= getTimestamp(local) ? remote : local;
}

function warnSyncFailure(label: string) {
  return (error: unknown) => console.warn(`[cloudSync] ${label} 동기화 실패`, error);
}

// ── 로그인 상태에서 로컬 쓰기를 클라우드로 미러링한다 ──────────────

export async function mirrorLessonSave(lesson: Lesson): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await setUserDoc(uid, 'lessons', lesson.id, lesson).catch(warnSyncFailure('레슨 저장'));
}

export async function mirrorLessonDelete(lessonId: string): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await deleteUserDoc(uid, 'lessons', lessonId).catch(warnSyncFailure('레슨 삭제'));
}

/** 내장 책(bundled)은 동기화 대상이 아니다. */
export async function mirrorBookSave(book: Book, sentences: BookSentence[]): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid || book.source !== 'user') return;
  await Promise.all([
    setUserDoc(uid, 'books', book.id, book),
    setUserDoc(uid, 'bookContents', book.id, { sentences }),
  ]).catch(warnSyncFailure('책 저장'));
}

export async function mirrorBookDelete(bookId: string): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await Promise.all([
    deleteUserDoc(uid, 'books', bookId),
    deleteUserDoc(uid, 'bookContents', bookId),
    deleteUserDoc(uid, 'readingProgress', bookId),
  ]).catch(warnSyncFailure('책 삭제'));
}

export async function mirrorReadingProgressSave(progress: ReadingProgress): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await setUserDoc(uid, 'readingProgress', progress.bookId, progress).catch(
    warnSyncFailure('읽기 진행'),
  );
}

// ── 로그인 시 클라우드 ↔ 로컬 병합(pull) ──────────────────────────
// 주의: 로그아웃/오프라인 상태에서 삭제한 항목은 추적하지 않으므로, 클라우드에
// 남아 있던 옛 데이터가 다시 로컬로 복원될 수 있다(최신 버전 우선 병합이라
// "삭제"는 별도 신호가 없는 한 전파되지 않는다).

export async function pullCloudDataToLocal(uid: string): Promise<void> {
  await Promise.all([syncLessons(uid), syncBooks(uid), syncReadingProgress(uid)]);
}

async function syncLessons(uid: string): Promise<void> {
  const [localLessons, cloudLessons] = await Promise.all([
    listLessons(),
    getAllUserDocs<Lesson>(uid, 'lessons'),
  ]);
  const localById = new Map(localLessons.map((lesson) => [lesson.id, lesson]));
  const cloudById = new Map(cloudLessons.map((lesson) => [lesson.id, lesson]));

  for (const id of new Set([...localById.keys(), ...cloudById.keys()])) {
    const winner = pickNewer(localById.get(id), cloudById.get(id), (lesson) => lesson.createdAt);
    if (!winner) continue;
    await saveLesson(winner);
    await setUserDoc(uid, 'lessons', id, winner).catch(warnSyncFailure('레슨 병합'));
  }
}

async function syncBooks(uid: string): Promise<void> {
  const [localBooks, cloudBooks] = await Promise.all([
    listBooks(),
    getAllUserDocs<Book>(uid, 'books'),
  ]);
  const localById = new Map(
    localBooks.filter((book) => book.source === 'user').map((book) => [book.id, book]),
  );
  const cloudById = new Map(cloudBooks.map((book) => [book.id, book]));

  for (const id of new Set([...localById.keys(), ...cloudById.keys()])) {
    const local = localById.get(id);
    const cloud = cloudById.get(id);
    const winner = pickNewer(local, cloud, (book) => book.addedAt);
    if (!winner) continue;

    const sentences =
      winner === cloud
        ? ((await getUserDoc<{ sentences: BookSentence[] }>(uid, 'bookContents', id))?.sentences ??
          [])
        : await getBookSentences(id);

    await saveBook(winner, sentences);
    await Promise.all([
      setUserDoc(uid, 'books', id, winner),
      setUserDoc(uid, 'bookContents', id, { sentences }),
    ]).catch(warnSyncFailure('책 병합'));
  }
}

async function syncReadingProgress(uid: string): Promise<void> {
  const [localBooks, cloudProgressList] = await Promise.all([
    listBooks(),
    getAllUserDocs<ReadingProgress>(uid, 'readingProgress'),
  ]);
  const cloudById = new Map(cloudProgressList.map((progress) => [progress.bookId, progress]));
  const bookIds = new Set([...localBooks.map((book) => book.id), ...cloudById.keys()]);

  for (const bookId of bookIds) {
    const local = await getReadingProgress(bookId);
    const winner = pickNewer(local, cloudById.get(bookId), (progress) => progress.updatedAt);
    if (!winner) continue;
    await saveReadingProgress(winner);
    await setUserDoc(uid, 'readingProgress', bookId, winner).catch(
      warnSyncFailure('읽기 진행 병합'),
    );
  }
}
