import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RepeatCountPreset, SpeedPreset } from '@jp-listening-app/shared';
import type { GapMode } from '../../shared/audio/RepeatController';

export interface SettingsState {
  speed: SpeedPreset;
  repeatCount: RepeatCountPreset;
  gapMode: GapMode;
  gapSeconds: number;
  speakerAVoice: string;
  speakerBVoice: string;
  bookVoice: string;
  setSpeed: (speed: SpeedPreset) => void;
  setRepeatCount: (repeatCount: RepeatCountPreset) => void;
  setGapMode: (gapMode: GapMode) => void;
  setGapSeconds: (gapSeconds: number) => void;
  setSpeakerAVoice: (voiceName: string) => void;
  setSpeakerBVoice: (voiceName: string) => void;
  setBookVoice: (voiceName: string) => void;
}

/** localStorage에는 이런 작은 UI 설정값만 저장한다(책 본문/오디오/레슨은 IndexedDB). */
const jsonStorage = createJSONStorage<SettingsState>(() => localStorage, {
  replacer: (_key, value) => (value === Infinity ? '__Infinity__' : value),
  reviver: (_key, value) => (value === '__Infinity__' ? Infinity : value),
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      speed: 1.0,
      repeatCount: 2,
      gapMode: 'fixed',
      gapSeconds: 1,
      speakerAVoice: '',
      speakerBVoice: '',
      bookVoice: '',
      setSpeed: (speed) => set({ speed }),
      setRepeatCount: (repeatCount) => set({ repeatCount }),
      setGapMode: (gapMode) => set({ gapMode }),
      setGapSeconds: (gapSeconds) => set({ gapSeconds }),
      setSpeakerAVoice: (speakerAVoice) => set({ speakerAVoice }),
      setSpeakerBVoice: (speakerBVoice) => set({ speakerBVoice }),
      setBookVoice: (bookVoice) => set({ bookVoice }),
    }),
    { name: 'jp-listening-app:settings', storage: jsonStorage },
  ),
);
