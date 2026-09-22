const SENTENCE_END_CHARS = new Set(['。', '！', '？', '!', '?']);
const TRAILING_CLOSING_CHARS = new Set(['」', '』', '）', ')']);
const QUOTE_OPEN = '「';
const QUOTE_CLOSE = '」';

/** TTS 요청 한도(5000바이트, 일본어 약 3바이트/자)를 고려한 문장 최대 길이 */
export const MAX_SENTENCE_LENGTH = 500;

function splitIntoBlocks(text: string): string[] {
  return text
    .split(/\n[ \t]*\n+/)
    .map((block) => block.replace(/\n/g, ''))
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

/**
 * 「」 안의 。！？는 문장을 끊지 않는다. 문장 끝 부호 뒤에 닫는 괄호/따옴표가
 * 바로 이어지면 그 괄호까지 같은 문장에 포함한다.
 */
function splitBlockIntoSentences(block: string): string[] {
  const chars = Array.from(block);
  const sentences: string[] = [];
  let buffer = '';
  let quoteDepth = 0;
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i] as string;
    buffer += ch;

    if (ch === QUOTE_OPEN) quoteDepth += 1;
    else if (ch === QUOTE_CLOSE) quoteDepth = Math.max(0, quoteDepth - 1);

    if (SENTENCE_END_CHARS.has(ch) && quoteDepth === 0) {
      let j = i + 1;
      while (j < chars.length && TRAILING_CLOSING_CHARS.has(chars[j] as string)) {
        buffer += chars[j];
        j += 1;
      }
      sentences.push(buffer.trim());
      buffer = '';
      i = j;
      continue;
    }

    i += 1;
  }

  if (buffer.trim().length > 0) {
    sentences.push(buffer.trim());
  }

  return sentences;
}

/** 500자를 넘는 문장은 읽점(、) 기준으로 여러 조각으로 나눈다. */
function splitLongSentence(sentence: string, maxLength: number): string[] {
  if (sentence.length <= maxLength) return [sentence];

  const parts = sentence.split(/(?<=、)/);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (current.length > 0 && current.length + part.length > maxLength) {
      chunks.push(current);
      current = part;
    } else {
      current += part;
    }
  }
  if (current.length > 0) chunks.push(current);

  return chunks;
}

/**
 * 일본어 텍스트를 문장 단위로 분리한다.
 * 경계: 。！？!? 및 빈 줄. 「」 내부의 문장부호에서는 끊지 않는다.
 * Intl.Segmenter는 쓰지 않고 위 규칙만으로 처리한다(규칙이 항상 우선).
 */
export function splitJapaneseSentences(
  text: string,
  maxSentenceLength: number = MAX_SENTENCE_LENGTH,
): string[] {
  const blocks = splitIntoBlocks(text);
  const sentences = blocks.flatMap(splitBlockIntoSentences);
  return sentences.flatMap((sentence) => splitLongSentence(sentence, maxSentenceLength));
}
