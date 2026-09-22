export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

export type FileValidationResult = { ok: true } | { ok: false; message: string };

/** .txt 확장자, 2MB 이하만 허용한다. */
export function validateUploadFile(file: File): FileValidationResult {
  if (!file.name.toLowerCase().endsWith('.txt')) {
    return { ok: false, message: '.txt 파일만 업로드할 수 있습니다.' };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { ok: false, message: '파일 크기는 2MB를 넘을 수 없습니다.' };
  }
  return { ok: true };
}

export function fileNameToTitle(fileName: string): string {
  return fileName.replace(/\.txt$/i, '');
}

/** 이름이 같으면 "(2)", "(3)" ... 을 붙여 중복을 피한다. */
export function resolveDuplicateTitle(existingTitles: string[], title: string): string {
  if (!existingTitles.includes(title)) return title;

  let suffix = 2;
  while (existingTitles.includes(`${title}(${suffix})`)) {
    suffix += 1;
  }
  return `${title}(${suffix})`;
}
