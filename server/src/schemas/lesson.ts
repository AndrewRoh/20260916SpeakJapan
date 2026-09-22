import { z } from 'zod';
import { jlptLevelSchema, tokenSchema } from '@jp-listening-app/shared';

/**
 * Gemini가 실제로 생성하는 원본 형태. id는 서버에서 채우므로 요구하지 않는다.
 * Gemini 출력은 신뢰할 수 없는 입력이므로 반드시 이 스키마로 재검증한다.
 */
export const geminiDialogueLineSchema = z
  .object({
    speaker: z.enum(['A', 'B']),
    text: z.string().min(1),
    tokens: z.array(tokenSchema).min(1),
    romaji: z.string().min(1),
    translationKo: z.string().min(1),
  })
  .superRefine((line, ctx) => {
    const joined = line.tokens.map((t) => t.surface).join('');
    if (joined !== line.text) {
      ctx.addIssue({
        code: 'custom',
        message: 'tokens를 이어붙인 결과가 text와 일치해야 합니다.',
        path: ['tokens'],
      });
    }
  });

export const geminiLessonSchema = z.object({
  title: z.string().min(1),
  lines: z.array(geminiDialogueLineSchema).min(1),
});

export type GeminiLesson = z.infer<typeof geminiLessonSchema>;

/** Gemini에게 보낼 responseSchema (application/json 구조화 출력용). */
export const lessonResponseSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: '레슨 제목 (한국어)' },
    lines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          speaker: { type: 'STRING', enum: ['A', 'B'] },
          text: { type: 'STRING', description: '일본어 원문' },
          tokens: {
            type: 'ARRAY',
            description: 'text를 이어붙이면 text와 동일해야 하는 토큰 배열. 한자에만 reading(히라가나)을 채운다.',
            items: {
              type: 'OBJECT',
              properties: {
                surface: { type: 'STRING' },
                reading: { type: 'STRING' },
              },
              required: ['surface'],
            },
          },
          romaji: { type: 'STRING' },
          translationKo: { type: 'STRING', description: '한국어 번역' },
        },
        required: ['speaker', 'text', 'tokens', 'romaji', 'translationKo'],
      },
    },
  },
  required: ['title', 'lines'],
} as const;

export const levelSchema = jlptLevelSchema;
