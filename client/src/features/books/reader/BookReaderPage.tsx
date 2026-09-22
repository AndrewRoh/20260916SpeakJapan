import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Book, BookSentence } from '@jp-listening-app/shared';
import { getBook, getBookSentences } from '../../../shared/db/repositories';
import { PlaybackControls } from '../../../shared/ui/PlaybackControls';
import { RubyText } from '../../../shared/ui/RubyText';
import { Toggle } from '../../../shared/ui/Toggle';
import { Button } from '../../../shared/ui/Button';
import { useAudioKeyboardShortcuts } from '../../../shared/audio/useAudioKeyboardShortcuts';
import { useEnsureDefaultVoices } from '../../settings/useEnsureDefaultVoices';
import { useBookPlayer } from './useBookPlayer';

const PAGE_SIZE = 30;

export function BookReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | undefined>(undefined);
  const [sentences, setSentences] = useState<BookSentence[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEnsureDefaultVoices();

  useEffect(() => {
    if (!bookId) return;
    void (async () => {
      const [foundBook, foundSentences] = await Promise.all([getBook(bookId), getBookSentences(bookId)]);
      setBook(foundBook);
      setSentences(foundSentences);
      setLoaded(true);
    })();
  }, [bookId]);

  if (!loaded) return <div className="p-6 text-slate-600">불러오는 중…</div>;
  if (!book || !bookId) return <div className="p-6 text-slate-600">책을 찾을 수 없습니다.</div>;

  return <ReaderView book={book} bookId={bookId} sentences={sentences} />;
}

function ReaderView({ book, bookId, sentences }: { book: Book; bookId: string; sentences: BookSentence[] }) {
  const hasFurigana = useMemo(() => sentences.some((s) => s.tokens.some((t) => t.reading)), [sentences]);
  const [showFurigana, setShowFurigana] = useState(hasFurigana);
  const [blindMode, setBlindMode] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const sentenceRefs = useRef(new Map<number, HTMLDivElement>());

  const player = useBookPlayer(bookId, book.title, sentences);

  useAudioKeyboardShortcuts({
    onTogglePlay: player.togglePlay,
    onPrevious: player.previous,
    onNext: player.next,
    onRepeatCurrent: player.repeatCurrent,
  });

  const totalPages = Math.max(1, Math.ceil(sentences.length / PAGE_SIZE));

  useEffect(() => {
    setPage(Math.floor(player.currentIndex / PAGE_SIZE));
  }, [player.currentIndex]);

  useEffect(() => {
    sentenceRefs.current.get(player.currentIndex)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [player.currentIndex]);

  const pageSentences = sentences.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold text-slate-900">{book.title}</h1>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
        {hasFurigana && <Toggle label="후리가나" checked={showFurigana} onChange={setShowFurigana} />}
        <Toggle label="블라인드 모드" checked={blindMode} onChange={setBlindMode} />
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ◀
          </Button>
          {page + 1} / {totalPages} 페이지
          <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            ▶
          </Button>
        </div>
      </div>

      <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-4">
        {pageSentences.map((sentence) => {
          const hidden = blindMode && !revealedIndices.has(sentence.index);
          return (
            <div
              key={sentence.index}
              ref={(el) => void (el ? sentenceRefs.current.set(sentence.index, el) : undefined)}
            >
              <button
                type="button"
                onClick={() => {
                  if (hidden) {
                    setRevealedIndices((prev) => new Set(prev).add(sentence.index));
                    return;
                  }
                  void player.jumpTo(sentence.index);
                }}
                className={`block w-full rounded px-2 py-1 text-left leading-loose ${
                  sentence.index === player.currentIndex ? 'bg-slate-100 font-medium' : ''
                }`}
              >
                {hidden ? (
                  <span className="text-slate-400">████████</span>
                ) : (
                  <RubyText tokens={sentence.tokens} showFurigana={showFurigana} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <PlaybackControls
        status={player.status}
        onPlayPause={player.togglePlay}
        onPrevious={player.previous}
        onNext={player.next}
        speed={player.speed}
        onSpeedChange={player.changeSpeed}
        repeatCount={player.repeatCount}
        onRepeatCountChange={player.changeRepeatCount}
        gapMode={player.gapMode}
        onGapModeChange={player.changeGapMode}
        gapSeconds={player.gapSeconds}
        onGapSecondsChange={player.changeGapSeconds}
      />
    </div>
  );
}
