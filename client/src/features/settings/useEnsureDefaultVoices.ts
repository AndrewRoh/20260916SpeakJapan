import { useEffect } from 'react';
import { useJapaneseVoices } from '../../shared/tts/useJapaneseVoices';
import { useSettingsStore } from './settingsStore';

/** 화자 A/B, 책 읽기용 음성이 아직 선택되지 않았으면 서버가 준 목록에서 기본값을 채운다. */
export function useEnsureDefaultVoices() {
  const { voices, loading, error } = useJapaneseVoices();
  const speakerAVoice = useSettingsStore((s) => s.speakerAVoice);
  const speakerBVoice = useSettingsStore((s) => s.speakerBVoice);
  const bookVoice = useSettingsStore((s) => s.bookVoice);
  const setSpeakerAVoice = useSettingsStore((s) => s.setSpeakerAVoice);
  const setSpeakerBVoice = useSettingsStore((s) => s.setSpeakerBVoice);
  const setBookVoice = useSettingsStore((s) => s.setBookVoice);

  useEffect(() => {
    if (voices.length === 0) return;
    const usable = voices.filter((v) => v.supportsSpeakingRate);
    const pool = usable.length > 0 ? usable : voices;

    if (!speakerAVoice && pool[0]) setSpeakerAVoice(pool[0].name);
    if (!speakerBVoice) setSpeakerBVoice((pool[1] ?? pool[0])?.name ?? '');
    if (!bookVoice && pool[0]) setBookVoice(pool[0].name);
  }, [voices, speakerAVoice, speakerBVoice, bookVoice, setSpeakerAVoice, setSpeakerBVoice, setBookVoice]);

  return { voices, loading, error };
}
