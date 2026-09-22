import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@jp-listening-app/shared';
import { deleteLesson, listLessons } from '../../shared/db/repositories';
import { Button } from '../../shared/ui/Button';
import { Dialog } from '../../shared/ui/Dialog';

export function LessonListPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | undefined>(undefined);

  async function reload() {
    setLessons(await listLessons());
  }

  useEffect(() => {
    void reload();
  }, []);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await deleteLesson(pendingDeleteId);
    setPendingDeleteId(undefined);
    await reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">듣기 레슨</h1>
        <Link to="/listening/new">
          <Button>+ 새 레슨</Button>
        </Link>
      </div>

      {lessons.length === 0 && <p className="text-sm text-slate-500">아직 만든 레슨이 없습니다.</p>}

      <ul className="space-y-2">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <Link to={`/listening/${lesson.id}`} className="flex-1">
              <p className="font-medium text-slate-900">{lesson.title}</p>
              <p className="text-xs text-slate-500">
                {lesson.level} · {new Date(lesson.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </Link>
            <Button variant="danger" onClick={() => setPendingDeleteId(lesson.id)}>
              삭제
            </Button>
          </li>
        ))}
      </ul>

      <Dialog
        open={pendingDeleteId !== undefined}
        title="레슨을 삭제할까요?"
        description="삭제하면 저장된 오디오 캐시도 함께 삭제됩니다."
        danger
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(undefined)}
      />
    </div>
  );
}
