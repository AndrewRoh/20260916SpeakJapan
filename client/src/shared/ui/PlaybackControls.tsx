import { REPEAT_COUNT_PRESETS, SPEED_PRESETS, type RepeatCountPreset, type SpeedPreset } from '@jp-listening-app/shared';
import type { GapMode } from '../audio/RepeatController';
import type { PlayerStatus } from '../audio/SentenceQueuePlayer';
import { Button } from './Button';

export interface PlaybackControlsProps {
  status: PlayerStatus;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  speed: SpeedPreset;
  onSpeedChange: (speed: SpeedPreset) => void;
  repeatCount: RepeatCountPreset;
  onRepeatCountChange: (repeatCount: RepeatCountPreset) => void;
  gapMode: GapMode;
  onGapModeChange: (gapMode: GapMode) => void;
  gapSeconds: number;
  onGapSecondsChange: (gapSeconds: number) => void;
}

function formatRepeatCount(count: RepeatCountPreset): string {
  return count === Infinity ? '무한' : `${count}회`;
}

export function PlaybackControls({
  status,
  onPlayPause,
  onPrevious,
  onNext,
  speed,
  onSpeedChange,
  repeatCount,
  onRepeatCountChange,
  gapMode,
  onGapModeChange,
  gapSeconds,
  onGapSecondsChange,
}: PlaybackControlsProps) {
  const isPlaying = status === 'playing' || status === 'loading';

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={onPrevious} aria-label="이전 문장">
          ◀ 이전
        </Button>
        <Button onClick={onPlayPause} aria-label={isPlaying ? '일시정지' : '재생'}>
          {status === 'loading' ? '불러오는 중…' : isPlaying ? '⏸ 일시정지' : '▶ 재생'}
        </Button>
        <Button variant="secondary" onClick={onNext} aria-label="다음 문장">
          다음 ▶
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-slate-500">재생 속도</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value) as SpeedPreset)}
          >
            {SPEED_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}배속
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-500">문장 반복 횟수</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={repeatCount === Infinity ? 'infinite' : repeatCount}
            onChange={(e) =>
              onRepeatCountChange(
                (e.target.value === 'infinite' ? Infinity : Number(e.target.value)) as RepeatCountPreset,
              )
            }
          >
            {REPEAT_COUNT_PRESETS.map((preset) => (
              <option key={String(preset)} value={preset === Infinity ? 'infinite' : preset}>
                {formatRepeatCount(preset)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-500">반복 간격</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={gapMode}
            onChange={(e) => onGapModeChange(e.target.value as GapMode)}
          >
            <option value="fixed">고정 간격</option>
            <option value="shadowing">쉐도잉(문장 길이 × 1.2)</option>
          </select>
        </label>

        {gapMode === 'fixed' && (
          <label className="flex flex-col gap-1">
            <span className="text-slate-500">간격(초): {gapSeconds}</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={gapSeconds}
              onChange={(e) => onGapSecondsChange(Number(e.target.value))}
            />
          </label>
        )}
      </div>
    </div>
  );
}
