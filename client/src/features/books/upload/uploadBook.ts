import type { Book } from '@jp-listening-app/shared';
import { decodeJapaneseText } from '../../../shared/text/textDecoder';
import { buildBookSentences } from '../../../shared/text/bookIngestion';
import { listBooks, saveBook } from '../../../shared/db/repositories';
import { fileNameToTitle, resolveDuplicateTitle, validateUploadFile } from './validateUpload';

export interface UploadBookResult {
  book: Book;
}

export interface UploadBookOptions {
  file: File;
  /** 사용자가 기본값(파일명)에서 수정한 제목. 비어 있으면 파일명을 쓴다. */
  title?: string;
}

/** 확장자/크기 검증 → 인코딩 판별 → 靑空文庫 파싱 → 중복 제목 처리 → 저장까지 수행한다. */
export async function uploadBook({ file, title }: UploadBookOptions): Promise<UploadBookResult> {
  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const buffer = await file.arrayBuffer();
  const decoded = decodeJapaneseText(buffer);
  if (!decoded.ok) {
    throw new Error(decoded.message);
  }

  const sentences = buildBookSentences(decoded.text);
  if (sentences.length === 0) {
    throw new Error('본문에서 문장을 찾을 수 없습니다.');
  }

  const existingBooks = await listBooks();
  const existingTitles = existingBooks.map((b) => b.title);
  const baseTitle = title?.trim() || fileNameToTitle(file.name);
  const finalTitle = resolveDuplicateTitle(existingTitles, baseTitle);

  const book: Book = {
    id: crypto.randomUUID(),
    title: finalTitle,
    source: 'user',
    encoding: decoded.encoding,
    sizeBytes: file.size,
    addedAt: Date.now(),
  };

  await saveBook(book, sentences);
  return { book };
}
