import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Lesson } from '@jp-listening-app/shared';
import { getLesson } from '../../shared/db/repositories';
import { PlaybackControls } from '../../shared/ui/PlaybackControls';
import { Toggle } from '../../shared/ui/Toggle';
import { useAudioKeyboardShortcuts } from '../../shared/audio/useAudioKeyboardShortcuts';
import { useEnsureDefaultVoices } from '../settings/useEnsureDefaultVoices';
import { useLessonPlayer } from './hooks/useLessonPlayer';
import { DialogueLineView } from './components/DialogueLineView';

export function ListeningPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [blindMode, setBlindMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const lineRefs = useRef(new Map<string, HTMLDivElement>());

  useEnsureDefaultVoices();

  useEffect(() => {
    if (!lessonId) return;
    getLesson(lessonId).then((found) => {
      if (!found) setNotFound(true);
      setLesson(found);
    });
  }, [lessonId]);

  return lesson ? (
    <LessonPlaybackView
      lesson={lesson}
      showFurigana={showFurigana}
      showRomaji={showRomaji}
      showTranslation={showTranslation}
      blindMode={blindMode}
      revealedIds={revealedIds}
      lineRefs={lineRefs}
      onToggleFurigana={setShowFurigana}
      onToggleRomaji={setShowRomaji}
      onToggleTranslation={setShowTranslation}
      onToggleBlindMode={setBlindMode}
      onReveal={(id) =>
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        })
      }
    />
  ) : (
    <div className="p-6 text-slate-600">
      {notFound ? '레슨을 찾을 수 없습니다.' : '불러오는 중…'}
    </div>
  );
}

interface LessonPlaybackViewProps {
  lesson: Lesson;
  showFurigana: boolean;
  showRomaji: boolean;
  showTranslation: boolean;
  blindMode: boolean;
  revealedIds: Set<string>;
  lineRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onToggleFurigana: (v: boolean) => void;
  onToggleRomaji: (v: boolean) => void;
  onToggleTranslation: (v: boolean) => void;
  onToggleBlindMode: (v: boolean) => void;
  onReveal: (id: string) => void;
}

function LessonPlaybackView({
  lesson,
  showFurigana,
  showRomaji,
  showTranslation,
  blindMode,
  revealedIds,
  lineRefs,
  onToggleFurigana,
  onToggleRomaji,
  onToggleTranslation,
  onToggleBlindMode,
  onReveal,
}: LessonPlaybackViewProps) {
  const player = useLessonPlayer(lesson);

  useAudioKeyboardShortcuts({
    onTogglePlay: player.togglePlay,
    onPrevious: player.previous,
    onNext: player.next,
    onRepeatCurrent: player.repeatCurrent,
  });

  useEffect(() => {
    const activeLine = lesson.lines[player.currentIndex];
    if (!activeLine) return;
    lineRefs.current.get(activeLine.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [player.currentIndex, lesson.lines, lineRefs]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-bold text-slate-900">{lesson.title}</h1>

      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-3">
        <Toggle label="후리가나" checked={showFurigana} onChange={onToggleFurigana} />
        <Toggle label="로마자" checked={showRomaji} onChange={onToggleRomaji} />
        <Toggle label="한국어 번역" checked={showTranslation} onChange={onToggleTranslation} />
        <Toggle label="블라인드 모드" checked={blindMode} onChange={onToggleBlindMode} />
      </div>

      <div className="space-y-2">
        {lesson.lines.map((line, index) => (
          <div key={line.id} ref={(el) => void (el ? lineRefs.current.set(line.id, el) : undefined)}>
            <DialogueLineView
              line={line}
              isActive={index === player.currentIndex}
              showFurigana={showFurigana}
              showRomaji={showRomaji}
              showTranslation={showTranslation}
              blindMode={blindMode}
              revealed={revealedIds.has(line.id)}
              onTap={() => {
                if (blindMode && !revealedIds.has(line.id)) {
                  onReveal(line.id);
                  return;
                }
                void player.jumpTo(index);
              }}
            />
          </div>
        ))}
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
