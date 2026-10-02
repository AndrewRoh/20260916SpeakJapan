import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { lessonGenerateRequestSchema, lessonSchema, type DialogueLine, type Lesson } from '@jp-listening-app/shared';
import { generateLesson } from '../services/geminiLessonGenerator.js';
import type { GeminiLesson } from '../schemas/lesson.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { Env } from '../config/env.js';

/** Gemini SDK가 던지는 에러 메시지에서 잘못된/권한 없는 API Key 여부를 구분한다. */
function isInvalidApiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /api key not valid|api_key_invalid|permission_denied|401|403/i.test(error.message);
}

export function createLessonsRouter(env: Env): Router {
  const router = Router();

  router.post('/lessons/generate', async (req, res, next) => {
    try {
      const parsed = lessonGenerateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, 'INVALID_REQUEST', '요청 형식이 올바르지 않습니다.');
      }
      const { topic, level, lineCount, apiKey } = parsed.data;

      let generated: GeminiLesson;
      try {
        generated = await generateLesson({
          topic,
          level,
          lineCount,
          apiKey,
          model: env.GEMINI_MODEL,
        });
      } catch (error) {
        console.error('[lessons/generate] Gemini 호출 실패:', error);
        if (isInvalidApiKeyError(error)) {
          throw new ApiError(401, 'INVALID_API_KEY', 'Gemini API Key가 올바르지 않습니다. 설정에서 확인해주세요.');
        }
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
