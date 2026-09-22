import type { JapaneseVoice } from '@jp-listening-app/shared';
import { getCachedAudio, putCachedAudio } from './audioCache';

export interface FetchSentenceAudioParams {
  text: string;
  voiceName: string;
  speakingRate: number;
  bookId?: string;
  lessonId?: string;
  signal?: AbortSignal;
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error?.message ?? 'TTS 요청이 실패했습니다.';
  } catch {
    return 'TTS 요청이 실패했습니다.';
  }
}

/** 캐시에 있으면 네트워크를 호출하지 않고 즉시 반환한다. */
export async function fetchSentenceAudio(params: FetchSentenceAudioParams): Promise<Blob> {
  const cached = await getCachedAudio(params);
  if (cached) return cached;

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: params.text,
      voiceName: params.voiceName,
      speakingRate: params.speakingRate,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const blob = await response.blob();
  await putCachedAudio({ ...params, blob });
  return blob;
}

export async function fetchJapaneseVoices(): Promise<JapaneseVoice[]> {
  const response = await fetch('/api/tts/voices');
  if (!response.ok) {
    throw new Error('음성 목록을 불러오지 못했습니다.');
  }
  const data = (await response.json()) as { voices: JapaneseVoice[] };
  return data.voices;
}
