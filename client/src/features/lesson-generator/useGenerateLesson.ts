import { useState } from 'react';
import { lessonSchema, type JlptLevel, type Lesson } from '@jp-listening-app/shared';
import { apiUrl } from '../../shared/api/apiBaseUrl';
import { useSettingsStore } from '../settings/settingsStore';

export interface GenerateLessonParams {
  topic: string;
  level: JlptLevel;
  lineCount: number;
}

interface ErrorBody {
  error?: { code?: string; message?: string };
}

export function useGenerateLesson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function generate(params: GenerateLessonParams): Promise<Lesson | undefined> {
    const apiKey = useSettingsStore.getState().geminiApiKey;
    if (!apiKey) {
      setError('설정 화면에서 Gemini API Key를 먼저 입력해주세요.');
      return undefined;
    }

    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(apiUrl('/api/lessons/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, apiKey }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => undefined)) as ErrorBody | undefined;
        if (body?.error?.code === 'INVALID_API_KEY') {
          throw new Error('Gemini API Key가 올바르지 않습니다. 설정에서 확인해주세요.');
        }
        throw new Error(body?.error?.message ?? '레슨 생성에 실패했습니다.');
      }

      const data: unknown = await response.json();
      // 서버가 이미 검증했지만, 신뢰할 수 없는 출력이므로 클라이언트에서도 다시 검증한다.
      return lessonSchema.parse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '레슨 생성에 실패했습니다.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
