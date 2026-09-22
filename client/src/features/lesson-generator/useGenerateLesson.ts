import { useState } from 'react';
import { lessonSchema, type JlptLevel, type Lesson } from '@jp-listening-app/shared';

export interface GenerateLessonParams {
  topic: string;
  level: JlptLevel;
  lineCount: number;
}

interface ErrorBody {
  error?: { message?: string };
}

export function useGenerateLesson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function generate(params: GenerateLessonParams): Promise<Lesson | undefined> {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => undefined)) as ErrorBody | undefined;
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
