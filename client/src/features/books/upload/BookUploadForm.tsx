import { useState } from 'react';
import type { Book } from '@jp-listening-app/shared';
import { Button } from '../../../shared/ui/Button';
import { fileNameToTitle } from './validateUpload';
import { uploadBook } from './uploadBook';

export interface BookUploadFormProps {
  onUploaded: (book: Book) => void;
  onCancel: () => void;
}

export function BookUploadForm({ onUploaded, onCancel }: BookUploadFormProps) {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setFile(selected);
    setError(undefined);
    if (selected) setTitle(fileNameToTitle(selected.name));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(undefined);
    try {
      const { book } = await uploadBook({ file, title });
      onUploaded(book);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">일본어 텍스트 파일(.txt)</span>
        <input type="file" accept=".txt" onChange={handleFileChange} required />
      </label>

      {file && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">제목</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={!file || loading}>
          {loading ? '업로드 중…' : '업로드'}
        </Button>
      </div>
    </form>
  );
}
