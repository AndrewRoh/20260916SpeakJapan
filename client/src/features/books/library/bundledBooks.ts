import { bookManifestSchema, type Book } from '@jp-listening-app/shared';
import { buildBookSentences } from '../../../shared/text/bookIngestion';
import { getBook, saveBook } from '../../../shared/db/repositories';

/** client/public/books/manifest.json에 실린 내장 책을 아직 없으면 IndexedDB에 불러온다. */
export async function ensureBundledBooksImported(): Promise<void> {
  const manifestResponse = await fetch('/books/manifest.json');
  if (!manifestResponse.ok) return;

  const manifest = bookManifestSchema.parse(await manifestResponse.json());

  for (const entry of manifest) {
    const existing = await getBook(entry.id);
    if (existing) continue;

    const textResponse = await fetch(`/books/${entry.file}`);
    if (!textResponse.ok) continue;
    const rawText = await textResponse.text();
    const sentences = buildBookSentences(rawText);

    const book: Book = {
      id: entry.id,
      title: entry.title,
      source: 'bundled',
      encoding: 'utf-8',
      sizeBytes: new TextEncoder().encode(rawText).length,
      addedAt: Date.now(),
    };
    await saveBook(book, sentences);
  }
}
