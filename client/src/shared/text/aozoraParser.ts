import type { Token } from '@jp-listening-app/shared';

const SEPARATOR_LINE = /^-{4,}\s*$/;
const ANNOTATION = /［＃[^］]*］/g;
/** ｜親字《よみ》(명시적 범위) 또는 漢字《よみ》(암묵적, 바로 앞 한자 연속열) */
const RUBY = /｜([^｜《]+)《([^》]+)》|([一-龠々〆ヶゝゞ]+)《([^》]+)》/g;

/**
 * 靑空文庫 형식 본문 앞뒤의 헤더/저작권 안내 블록을 제거한다.
 * 헤더는 "-------" 구분선 두 개 사이(제목/저자/주석 안내), 꼬리말은
 * 마지막 구분선부터 파일 끝까지(底本 정보 등)로 간주한다.
 */
export function stripAozoraHeaderFooter(rawText: string): string {
  const lines = rawText.split('\n');
  const separatorIndices: number[] = [];
  lines.forEach((line, index) => {
    if (SEPARATOR_LINE.test(line.trim())) separatorIndices.push(index);
  });

  let start = 0;
  let end = lines.length;

  if (separatorIndices.length >= 2) {
    start = (separatorIndices[1] as number) + 1;
  }
  if (separatorIndices.length >= 3) {
    end = separatorIndices[separatorIndices.length - 1] as number;
  }

  return lines
    .slice(start, end)
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export function removeAnnotations(text: string): string {
  return text.replace(ANNOTATION, '');
}

/**
 * ｜親字《よみ》 / 漢字《よみ》 루비 표기를 Token[]로 변환한다.
 * tokens의 surface를 이어붙이면 반환된 text(루비 기호가 제거된 원문 표시용 텍스트)와 같다.
 */
export function parseAozoraRuby(text: string): { text: string; tokens: Token[] } {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let plainText = '';

  for (const match of text.matchAll(RUBY)) {
    const matchIndex = match.index ?? 0;
    const before = text.slice(lastIndex, matchIndex);
    if (before.length > 0) {
      tokens.push({ surface: before });
      plainText += before;
    }

    const surface = match[1] ?? match[3] ?? '';
    const reading = match[2] ?? match[4] ?? '';
    tokens.push({ surface, reading });
    plainText += surface;

    lastIndex = matchIndex + match[0].length;
  }

  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push({ surface: rest });
    plainText += rest;
  }

  return { text: plainText, tokens };
}

export interface AozoraParseResult {
  text: string;
  tokens: Token[];
}

/** 헤더/꼬리말 제거 → 주석 제거 → 루비 파싱까지 한 번에 처리하는 순수 함수 */
export function parseAozoraDocument(rawText: string): AozoraParseResult {
  const body = stripAozoraHeaderFooter(rawText);
  const withoutAnnotations = removeAnnotations(body);
  return parseAozoraRuby(withoutAnnotations);
}
