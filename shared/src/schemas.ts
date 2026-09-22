import { z } from 'zod';

export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);

export const tokenSchema = z.object({
  surface: z.string().min(1),
  reading: z.string().min(1).optional(),
});

export const speakerSchema = z.enum(['A', 'B']);

export const dialogueLineSchema = z
  .object({
    id: z.string().min(1),
    speaker: speakerSchema,
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

export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().min(1).max(100),
  level: jlptLevelSchema,
  createdAt: z.number().int().nonnegative(),
  lines: z.array(dialogueLineSchema).min(1),
});

/** Gemini가 만들어내는 원본 형태(id/createdAt 제외) — 서버에서 id/createdAt을 채운다. */
export const generatedLessonSchema = lessonSchema.omit({ id: true, createdAt: true });

export const lessonGenerateRequestSchema = z.object({
  topic: z.string().trim().min(1).max(100),
  level: jlptLevelSchema,
  lineCount: z.number().int().min(4).max(16),
});

export const ttsRequestSchema = z.object({
  text: z.string().min(1).max(500),
  voiceName: z.string().min(1),
  speakingRate: z.number().min(0.25).max(2.0),
});

export const bookSourceSchema = z.enum(['bundled', 'user']);
export const textEncodingKindSchema = z.enum(['utf-8', 'shift_jis']);

export const bookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source: bookSourceSchema,
  encoding: textEncodingKindSchema,
  sizeBytes: z.number().int().nonnegative(),
  addedAt: z.number().int().nonnegative(),
});

export const bookSentenceSchema = z.object({
  index: z.number().int().nonnegative(),
  text: z.string().min(1),
  tokens: z.array(tokenSchema),
});

export const readingProgressSchema = z.object({
  bookId: z.string().min(1),
  sentenceIndex: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export const bookManifestEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  file: z.string().min(1),
  level: jlptLevelSchema.optional(),
});

export const bookManifestSchema = z.array(bookManifestEntrySchema);

export type LessonGenerateRequest = z.infer<typeof lessonGenerateRequestSchema>;
export type TtsRequest = z.infer<typeof ttsRequestSchema>;
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>;
export type BookManifestEntry = z.infer<typeof bookManifestEntrySchema>;
