import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateId } from './uuid';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a v4 UUID via the native crypto.randomUUID path', () => {
    expect(generateId()).toMatch(UUID_V4_PATTERN);
  });

  it('returns distinct ids on repeated calls', () => {
    expect(generateId()).not.toBe(generateId());
  });

  it('falls back to a getRandomValues-based v4 UUID when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', { ...crypto, randomUUID: undefined });
    expect(generateId()).toMatch(UUID_V4_PATTERN);
  });
});
