import { useEffect, useState } from 'react';
import type { JapaneseVoice } from '@jp-listening-app/shared';
import { fetchJapaneseVoices } from './ttsClient';

export interface UseJapaneseVoicesResult {
  voices: JapaneseVoice[];
  loading: boolean;
  error: string | undefined;
}

export function useJapaneseVoices(): UseJapaneseVoicesResult {
  const [voices, setVoices] = useState<JapaneseVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJapaneseVoices()
      .then((result) => {
        if (!cancelled) setVoices(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '음성 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { voices, loading, error };
}
