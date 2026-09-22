import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { lessonGenerateRequestSchema, lessonSchema, type DialogueLine, type Lesson } from '@jp-listening-app/shared';
import { generateLesson } from '../services/geminiLessonGenerator.js';
import type { GeminiLesson } from '../schemas/lesson.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { Env } from '../config/env.js';

export function createLessonsRouter(env: Env): Router {
  const router = Router();

  router.post('/lessons/generate', async (req, res, next) => {
    try {
      const parsed = lessonGenerateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', '요청 형식이 올바르지 않습니다.');
      }
      const { topic, level, lineCount } = parsed.data;

      let generated: GeminiLesson;
      try {
        generated = await generateLesson({
          topic,
          level,
          lineCount,
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL,
        });
      } catch {
        throw new ApiError(422, 'LESSON_GENERATION_FAILED', '레슨 생성 결과가 올바르지 않습니다. 다시 시도해주세요.');
      }

      const lines: DialogueLine[] = generated.lines.map((line) => ({
        id: randomUUID(),
        ...line,
      }));

      const lesson: Lesson = {
        id: randomUUID(),
        title: generated.title,
        topic,
        level,
        createdAt: Date.now(),
        lines,
      };

      const finalCheck = lessonSchema.safeParse(lesson);
      if (!finalCheck.success) {
        throw new ApiError(422, 'LESSON_GENERATION_FAILED', '레슨 생성 결과가 올바르지 않습니다. 다시 시도해주세요.');
      }

      res.status(201).json(finalCheck.data);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
