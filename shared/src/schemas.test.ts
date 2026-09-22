import { describe, expect, it } from 'vitest';
import { dialogueLineSchema, lessonSchema } from './schemas';
import type { Token } from './types';

function validLine() {
  return {
    id: 'line-1',
    speaker: 'A' as const,
    text: 'こんにちは',
    tokens: [{ surface: 'こんにちは' }] as Token[],
    romaji: 'konnichiwa',
    translationKo: '안녕하세요',
  };
}

describe('dialogueLineSchema', () => {
  it('accepts a line whose tokens join back into text', () => {
    const result = dialogueLineSchema.safeParse(validLine());
    expect(result.success).toBe(true);
  });

  it('rejects a line whose tokens do not join back into text', () => {
    const line = validLine();
    line.tokens = [{ surface: '違う' }];
    const result = dialogueLineSchema.safeParse(line);
    expect(result.success).toBe(false);
  });

  it('keeps kanji reading as furigana on tokens', () => {
    const line = validLine();
    line.text = '漢字';
    line.tokens = [{ surface: '漢字', reading: 'かんじ' }];
    const result = dialogueLineSchema.safeParse(line);
    expect(result.success).toBe(true);
  });
});

describe('lessonSchema', () => {
  it('rejects a lesson with zero lines', () => {
    const result = lessonSchema.safeParse({
      id: 'l1',
      title: '제목',
      topic: '편의점',
      level: 'N5',
      createdAt: Date.now(),
      lines: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed lesson', () => {
    const result = lessonSchema.safeParse({
      id: 'l1',
      title: '제목',
      topic: '편의점',
      level: 'N5',
      createdAt: Date.now(),
      lines: [validLine()],
    });
    expect(result.success).toBe(true);
  });
});
