import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, resolve } from 'node:path';
import { config } from 'dotenv';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

// .env와 GOOGLE_APPLICATION_CREDENTIALS로 가리키는 키 파일은 server/ 아래에 둔다.
// 실행 위치(cwd)에 상관없이 항상 같은 곳을 보도록 이 파일 위치 기준 절대경로로 계산한다.
const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(serverDir, '.env') });

if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(
    serverDir,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
