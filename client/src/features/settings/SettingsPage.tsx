import { useEffect, useState } from 'react';
import { REPEAT_COUNT_PRESETS, SPEED_PRESETS, type RepeatCountPreset, type SpeedPreset } from '@jp-listening-app/shared';
import type { GapMode } from '../../shared/audio/RepeatController';
import { Button } from '../../shared/ui/Button';
import { clearAudioCache, getAudioCacheUsageBytes } from '../../shared/tts/audioCache';
import { useSettingsStore } from './settingsStore';
import { useEnsureDefaultVoices } from './useEnsureDefaultVoices';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatRepeatCount(count: RepeatCountPreset): string {
  return count === Infinity ? '무한' : `${count}회`;
}

export function SettingsPage() {
  const { voices, loading: voicesLoading, error: voicesError } = useEnsureDefaultVoices();
  const usableVoices = voices.filter((v) => v.supportsSpeakingRate);

  const speed = useSettingsStore((s) => s.speed);
  const repeatCount = useSettingsStore((s) => s.repeatCount);
  const gapMode = useSettingsStore((s) => s.gapMode);
  const gapSeconds = useSettingsStore((s) => s.gapSeconds);
  const speakerAVoice = useSettingsStore((s) => s.speakerAVoice);
  const speakerBVoice = useSettingsStore((s) => s.speakerBVoice);
  const bookVoice = useSettingsStore((s) => s.bookVoice);
  const setSpeed = useSettingsStore((s) => s.setSpeed);
  const setRepeatCount = useSettingsStore((s) => s.setRepeatCount);
  const setGapMode = useSettingsStore((s) => s.setGapMode);
  const setGapSeconds = useSettingsStore((s) => s.setGapSeconds);
  const setSpeakerAVoice = useSettingsStore((s) => s.setSpeakerAVoice);
  const setSpeakerBVoice = useSettingsStore((s) => s.setSpeakerBVoice);
  const setBookVoice = useSettingsStore((s) => s.setBookVoice);

  const [cacheUsage, setCacheUsage] = useState(0);

  async function refreshCacheUsage() {
    setCacheUsage(await getAudioCacheUsageBytes());
  }

  useEffect(() => {
    void refreshCacheUsage();
  }, []);

  async function handleClearCache() {
    await clearAudioCache();
    await refreshCacheUsage();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-xl font-bold text-slate-900">설정</h1>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">기본 재생 설정</h2>

        <label className="flex items-center justify-between text-sm">
          <span>기본 속도</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as SpeedPreset)}
          >
            {SPEED_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}배속
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between text-sm">
          <span>기본 반복 횟수</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={repeatCount === Infinity ? 'infinite' : repeatCount}
            onChange={(e) =>
              setRepeatCount(
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

        <label className="flex items-center justify-between text-sm">
          <span>기본 반복 간격 방식</span>
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={gapMode}
            onChange={(e) => setGapMode(e.target.value as GapMode)}
          >
            <option value="fixed">고정 간격</option>
            <option value="shadowing">쉐도잉</option>
          </select>
        </label>

        {gapMode === 'fixed' && (
          <label className="flex items-center justify-between text-sm">
            <span>간격(초): {gapSeconds}</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={gapSeconds}
              onChange={(e) => setGapSeconds(Number(e.target.value))}
            />
          </label>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">음성 설정</h2>
        {voicesLoading && <p className="text-sm text-slate-500">음성 목록을 불러오는 중…</p>}
        {voicesError && <p className="text-sm text-red-600">{voicesError}</p>}

        {!voicesLoading && !voicesError && (
          <>
            <VoiceSelect label="화자 A 음성" value={speakerAVoice} onChange={setSpeakerAVoice} voices={usableVoices} />
            <VoiceSelect label="화자 B 음성" value={speakerBVoice} onChange={setSpeakerBVoice} voices={usableVoices} />
            <VoiceSelect label="책 읽기 음성" value={bookVoice} onChange={setBookVoice} voices={usableVoices} />
          </>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800">오디오 캐시</h2>
        <p className="text-sm text-slate-600">사용 중인 용량: {formatBytes(cacheUsage)} / 약 300 MB</p>
        <Button variant="danger" onClick={handleClearCache}>
          캐시 전체 삭제
        </Button>
      </section>
    </div>
  );
}

function VoiceSelect({
  label,
  value,
  onChange,
  voices,
}: {
  label: string;
  value: string;
  onChange: (voiceName: string) => void;
  voices: { name: string; family: string; ssmlGender: string }[];
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <select
        className="rounded-md border border-slate-300 px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {voices.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.name} ({voice.family}/{voice.ssmlGender})
          </option>
        ))}
      </select>
    </label>
  );
}
