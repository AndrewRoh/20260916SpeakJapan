import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JlptLevel } from '@jp-listening-app/shared';
import { Button } from '../../shared/ui/Button';
import { saveLesson } from '../../shared/db/repositories';
import { useGenerateLesson } from './useGenerateLesson';

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function LessonGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<JlptLevel>('N5');
  const [lineCount, setLineCount] = useState(8);
  const { generate, loading, error } = useGenerateLesson();
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const lesson = await generate({ topic: topic.trim(), level, lineCount });
    if (!lesson) return;
    await saveLesson(lesson);
    navigate(`/listening/${lesson.id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">새 레슨 만들기</h1>
      <p className="text-sm text-slate-600">
        주제와 난이도를 입력하면 AI가 짧은 일본어 회화 대본을 만들어줍니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">주제</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="예: 편의점, 길 묻기"
            value={topic}
            maxLength={100}
            required
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">JLPT 레벨</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={level}
            onChange={(e) => setLevel(e.target.value as JlptLevel)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            대사 줄 수: {lineCount}
          </span>
          <input
            type="range"
            min={4}
            max={16}
            value={lineCount}
            onChange={(e) => setLineCount(Number(e.target.value))}
            className="w-full"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading || topic.trim().length === 0} className="w-full">
          {loading ? '생성 중…' : '레슨 생성하기'}
        </Button>
      </form>
    </div>
  );
}
