import { afterEach, describe, expect, it, vi } from 'vitest';
import { sha256Hex } from './sha256';

describe('sha256Hex', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches known SHA-256 test vectors using the native crypto.subtle path', async () => {
    expect(await sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('produces the same result via the pure-JS fallback when crypto.subtle is unavailable', async () => {
    const originalSubtle = crypto.subtle;
    vi.stubGlobal('crypto', { ...crypto, subtle: undefined });

    try {
      expect(await sha256Hex('')).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
      expect(await sha256Hex('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      );
      expect(await sha256Hex('こんにちは')).toBe(await nativeSha256('こんにちは', originalSubtle));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('handles input longer than one 64-byte block (fallback path)', async () => {
    const longText = 'あ'.repeat(200);
    const nativeResult = await sha256Hex(longText);

    vi.stubGlobal('crypto', { ...crypto, subtle: undefined });
    const fallbackResult = await sha256Hex(longText);

    expect(fallbackResult).toBe(nativeResult);
  });
});

async function nativeSha256(text: string, subtle: SubtleCrypto): Promise<string> {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
