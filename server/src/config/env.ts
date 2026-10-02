import { z } from 'zod';

const envSchema = z.object({
  // Cloud Run/GCE처럼 서비스 계정이 이미 연결된 환경에서는 비워두면 ADC(메타데이터
  // 서버)가 자동으로 인증을 처리한다. 로컬/Docker처럼 키 파일로 인증할 때만 채운다.
  // (TTS에서만 사용 — Gemini API Key는 더 이상 서버가 보관하지 않고 요청마다 클라이언트가 보낸다)
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.5-flash-lite'),
  PORT: z.coerce.number().int().positive().default(8787),
});

export type Env = z.infer<typeof envSchema>;

/** 필수 환경변수가 없으면 서버 기동 자체를 실패시킨다. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`환경변수 검증 실패:\n${issues.join('\n')}`);
  }
  return result.data;
}
