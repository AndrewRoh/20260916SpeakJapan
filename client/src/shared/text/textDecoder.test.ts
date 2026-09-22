import { describe, expect, it } from 'vitest';
import { decodeJapaneseText } from './textDecoder';

/** iconv-lite로 미리 인코딩해둔 'こんにちは、世界。'의 Shift_JIS 바이트 시퀀스 */
const SHIFT_JIS_SAMPLE_BYTES = [
  130, 177, 130, 241, 130, 201, 130, 191, 130, 205, 129, 65, 144, 162, 138, 69, 129, 66,
];

function toArrayBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe('decodeJapaneseText', () => {
  it('decodes a plain UTF-8 buffer', () => {
    const bytes = new TextEncoder().encode('こんにちは');
    const result = decodeJapaneseText(bytes.buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.encoding).toBe('utf-8');
      expect(result.text).toBe('こんにちは');
    }
  });

  it('strips a UTF-8 BOM and decodes as utf-8', () => {
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('おはよう')]);
    const result = decodeJapaneseText(withBom.buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.encoding).toBe('utf-8');
      expect(result.text).toBe('おはよう');
      expect(result.text.startsWith('\uFEFF')).toBe(false);
    }
  });

  it('falls back to Shift_JIS when UTF-8 strict decoding fails', () => {
    const result = decodeJapaneseText(toArrayBuffer(SHIFT_JIS_SAMPLE_BYTES));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.encoding).toBe('shift_jis');
      expect(result.text).toBe('こんにちは、世界。');
    }
  });

  it('normalizes CRLF to LF regardless of encoding', () => {
    const bytes = new TextEncoder().encode('一行目\r\n二行目');
    const result = decodeJapaneseText(bytes.buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe('一行目\n二行目');
    }
  });

  it('reports failure for garbage byte sequences', () => {
    const garbage = toArrayBuffer([0xff, 0xfe, 0xff, 0xfe, 0x00, 0x01, 0x02, 0xfd, 0xfc]);
    const result = decodeJapaneseText(garbage);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('UTF-8 또는 Shift_JIS');
    }
  });
});
