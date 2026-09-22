import { describe, expect, it } from 'vitest';
import { splitJapaneseSentences } from './japaneseSentenceSplitter';

describe('splitJapaneseSentences', () => {
  it('splits on 。！？ boundaries', () => {
    const result = splitJapaneseSentences('今日はいい天気です。散歩に行きませんか？はい、行きましょう!');
    expect(result).toEqual(['今日はいい天気です。', '散歩に行きませんか？', 'はい、行きましょう!']);
  });

  it('does not split on 。 inside 「」 quotes', () => {
    const result = splitJapaneseSentences('彼は「今日は晴れだ。」と言った。');
    expect(result).toEqual(['彼は「今日は晴れだ。」と言った。']);
  });

  it('includes a trailing closing bracket in the same sentence', () => {
    const result = splitJapaneseSentences('母は「気をつけてね。」と言った。');
    expect(result).toEqual(['母は「気をつけてね。」と言った。']);
  });

  it('treats a blank line as a sentence boundary', () => {
    const result = splitJapaneseSentences('これは一段落目\n\nこれは二段落目');
    expect(result).toEqual(['これは一段落目', 'これは二段落目']);
  });

  it('splits a sentence longer than 500 characters on 、 boundaries', () => {
    const clause = 'あ'.repeat(50) + '、';
    const longSentence = clause.repeat(12) + 'おわり。';
    const result = splitJapaneseSentences(longSentence);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
    expect(result.join('')).toBe(longSentence);
  });
});
