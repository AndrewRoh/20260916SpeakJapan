import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY가 설정되어야 합니다.'),
  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .min(1, 'GOOGLE_APPLICATION_CREDENTIALS가 설정되어야 합니다.'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
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
