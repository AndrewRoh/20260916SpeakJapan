import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@jp-listening-app/shared';
import { deleteBook, listBooks } from '../../../shared/db/repositories';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { ensureBundledBooksImported } from './bundledBooks';
import { BookUploadForm } from '../upload/BookUploadForm';

export function BookLibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setBooks(await listBooks());
  }

  useEffect(() => {
    void (async () => {
      await ensureBundledBooksImported();
      await reload();
      setLoading(false);
    })();
  }, []);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await deleteBook(pendingDeleteId);
    setPendingDeleteId(undefined);
    await reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">일본어 책 읽기</h1>
        <Button onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? '닫기' : '+ 책 업로드'}
        </Button>
      </div>

      {showUpload && (
        <BookUploadForm
          onUploaded={() => {
            setShowUpload(false);
            void reload();
          }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {loading && <p className="text-sm text-slate-500">불러오는 중…</p>}

      <ul className="space-y-2">
        {books.map((book) => (
          <li
            key={book.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <Link to={`/books/${book.id}`} className="flex-1">
              <p className="font-medium text-slate-900">{book.title}</p>
              <p className="text-xs text-slate-500">
                {book.source === 'bundled' ? '내장 책' : '내가 추가한 책'} · {book.encoding}
              </p>
            </Link>
            {book.source === 'user' && (
              <Button variant="danger" onClick={() => setPendingDeleteId(book.id)}>
                삭제
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog
        open={pendingDeleteId !== undefined}
        title="책을 삭제할까요?"
        description="본문, 읽기 진행 위치, 오디오 캐시가 모두 삭제됩니다."
        danger
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(undefined)}
      />
    </div>
  );
}
