import { GoogleGenAI } from '@google/genai';
import type { JlptLevel } from '@jp-listening-app/shared';
import { geminiLessonSchema, lessonResponseSchema, type GeminiLesson } from '../schemas/lesson.js';

export interface GenerateLessonParams {
  topic: string;
  level: JlptLevel;
  lineCount: number;
  apiKey: string;
  model: string;
}

function buildPrompt(topic: string, level: JlptLevel, lineCount: number): string {
  return [
    `당신은 일본어 회화 교재 작가입니다. 아래 조건에 맞는 두 사람(A, B)의 일본어 회화 대본을 만들어주세요.`,
    `- 주제: ${topic}`,
    `- JLPT 난이도: ${level} (해당 레벨의 어휘/문법 범위를 지켜주세요)`,
    `- 대사 줄 수: 정확히 ${lineCount}줄, A와 B가 번갈아 말합니다.`,
    `- 각 줄은 자연스러운 짧은 회화체 일본어여야 합니다.`,
    `- 각 줄의 tokens 배열은 text를 어절 단위가 아니라 표기 단위(한자/가나 묶음)로 나누고, 한자가 포함된 토큰에만 reading(히라가나)을 채워주세요. tokens의 surface를 순서대로 이어붙이면 text와 정확히 같아야 합니다.`,
    `- romaji는 헵번식 로마자 표기, translationKo는 자연스러운 한국어 번역입니다.`,
    `응답은 지정된 JSON 스키마 형식으로만 반환하세요.`,
  ].join('\n');
}

async function requestLesson(
  ai: GoogleGenAI,
  model: string,
  topic: string,
  level: JlptLevel,
  lineCount: number,
): Promise<unknown> {
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(topic, level, lineCount),
    config: {
      responseMimeType: 'application/json',
      responseSchema: lessonResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini 응답이 비어 있습니다.');
  }
  return JSON.parse(text);
}

/** 스키마 검증 실패 시 1회 재시도한다. 그래도 실패하면 예외를 던진다(호출부에서 422 처리). */
export async function generateLesson(params: GenerateLessonParams): Promise<GeminiLesson> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await requestLesson(ai, params.model, params.topic, params.level, params.lineCount);
      return geminiLessonSchema.parse(raw);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('레슨 생성에 실패했습니다.');
}
