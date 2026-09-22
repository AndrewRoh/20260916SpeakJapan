import type { DialogueLine } from '@jp-listening-app/shared';
import { RubyText } from '../../../shared/ui/RubyText';

export interface DialogueLineViewProps {
  line: DialogueLine;
  isActive: boolean;
  showFurigana: boolean;
  showRomaji: boolean;
  showTranslation: boolean;
  blindMode: boolean;
  revealed: boolean;
  onTap: () => void;
}

export function DialogueLineView({
  line,
  isActive,
  showFurigana,
  showRomaji,
  showTranslation,
  blindMode,
  revealed,
  onTap,
}: DialogueLineViewProps) {
  const hidden = blindMode && !revealed;

  return (
    <button
      type="button"
      onClick={onTap}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        isActive ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:bg-slate-50'
      } ${line.speaker === 'A' ? 'items-start' : 'items-end'}`}
    >
      <span className="mb-1 inline-block rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
        화자 {line.speaker}
      </span>

      {hidden ? (
        <p className="text-lg text-slate-400">탭해서 문장 보기</p>
      ) : (
        <>
          <p className="text-lg leading-relaxed">
            <RubyText tokens={line.tokens} showFurigana={showFurigana} />
          </p>
          {showRomaji && <p className="mt-1 text-sm text-slate-500">{line.romaji}</p>}
          {showTranslation && <p className="mt-1 text-sm text-slate-600">{line.translationKo}</p>}
        </>
      )}
    </button>
  );
}
