const BOM = '\uFEFF';
const REPLACEMENT_CHAR = '\uFFFD';
/** 대체 문자 비율이 이 값을 넘으면 디코딩 실패로 간주한다. */
const MAX_REPLACEMENT_RATIO = 0.01;

export type SupportedTextEncoding = 'utf-8' | 'shift_jis';

export type DecodeResult =
  | { ok: true; text: string; encoding: SupportedTextEncoding }
  | { ok: false; message: string };

function normalize(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function replacementRatio(text: string): number {
  if (text.length === 0) return 0;
  let count = 0;
  for (const ch of text) {
    if (ch === REPLACEMENT_CHAR) count += 1;
  }
  return count / text.length;
}

/**
 * 일본어 텍스트 파일은 UTF-8뿐 아니라 Shift_JIS(예: 靑空文庫 배포본)인 경우가 많다.
 * UTF-8을 엄격 모드로 먼저 시도하고, 실패하면 Shift_JIS로 재시도한다.
 */
export function decodeJapaneseText(buffer: ArrayBuffer): DecodeResult {
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const text = utf8Decoder.decode(buffer);
    return { ok: true, text: normalize(text), encoding: 'utf-8' };
  } catch {
    // UTF-8이 아니면 Shift_JIS로 재시도한다.
  }

  try {
    const sjisDecoder = new TextDecoder('shift_jis', { fatal: false });
    const text = sjisDecoder.decode(buffer);
    if (replacementRatio(text) > MAX_REPLACEMENT_RATIO) {
      return { ok: false, message: 'UTF-8 또는 Shift_JIS 텍스트만 지원합니다.' };
    }
    return { ok: true, text: normalize(text), encoding: 'shift_jis' };
  } catch {
    return { ok: false, message: 'UTF-8 또는 Shift_JIS 텍스트만 지원합니다.' };
  }
}

export function stripBom(text: string): string {
  return text.startsWith(BOM) ? text.slice(1) : text;
}
