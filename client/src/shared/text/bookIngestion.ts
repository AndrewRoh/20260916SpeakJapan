import type { BookSentence } from '@jp-listening-app/shared';
import { parseAozoraRuby, removeAnnotations, stripAozoraHeaderFooter } from './aozoraParser';
import { splitJapaneseSentences } from './japaneseSentenceSplitter';

/**
 * 원문 텍스트(靑空文庫 형식이든 평문이든)를 문장 단위 BookSentence[]로 변환한다.
 * 헤더/주석 제거 → 문장 분리 → 문장별 루비 파싱(tokens 생성) 순서로 처리하면
 * 문장 분리 후 오프셋을 다시 맞출 필요 없이 tokens와 text의 일치가 보장된다.
 */
export function buildBookSentences(rawText: string): BookSentence[] {
  const body = stripAozoraHeaderFooter(rawText);
  const withoutAnnotations = removeAnnotations(body);
  const sentenceTexts = splitJapaneseSentences(withoutAnnotations);

  return sentenceTexts.map((sentenceText, index) => {
    const { text, tokens } = parseAozoraRuby(sentenceText);
    return { index, text, tokens };
  });
}
