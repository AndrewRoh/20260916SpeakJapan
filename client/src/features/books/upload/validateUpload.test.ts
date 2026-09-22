import { describe, expect, it } from 'vitest';
import {
  MAX_UPLOAD_SIZE_BYTES,
  fileNameToTitle,
  resolveDuplicateTitle,
  validateUploadFile,
} from './validateUpload';

function makeFile(name: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name);
}

describe('validateUploadFile', () => {
  it('rejects a non-.txt extension', () => {
    const result = validateUploadFile(makeFile('novel.pdf', 100));
    expect(result).toEqual({ ok: false, message: '.txt 파일만 업로드할 수 있습니다.' });
  });

  it('rejects a file larger than 2MB', () => {
    const result = validateUploadFile(makeFile('novel.txt', MAX_UPLOAD_SIZE_BYTES + 1));
    expect(result.ok).toBe(false);
  });

  it('accepts a .txt file within the size limit', () => {
    const result = validateUploadFile(makeFile('novel.txt', 1024));
    expect(result).toEqual({ ok: true });
  });

  it('accepts a file exactly at the size limit', () => {
    const result = validateUploadFile(makeFile('novel.txt', MAX_UPLOAD_SIZE_BYTES));
    expect(result).toEqual({ ok: true });
  });
});

describe('fileNameToTitle', () => {
  it('strips the .txt extension', () => {
    expect(fileNameToTitle('吾輩は猫である.txt')).toBe('吾輩は猫である');
  });
});

describe('resolveDuplicateTitle', () => {
  it('returns the title unchanged when there is no conflict', () => {
    expect(resolveDuplicateTitle(['다른 책'], '나의 책')).toBe('나의 책');
  });

  it('appends (2) when the title already exists', () => {
    expect(resolveDuplicateTitle(['나의 책'], '나의 책')).toBe('나의 책(2)');
  });

  it('increments the suffix until it finds a free title', () => {
    expect(resolveDuplicateTitle(['나의 책', '나의 책(2)', '나의 책(3)'], '나의 책')).toBe('나의 책(4)');
  });
});
