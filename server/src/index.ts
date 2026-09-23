import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, resolve } from 'node:path';
import { config } from 'dotenv';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

// npm workspace로 실행하면 cwd가 server/가 되어 dotenv의 기본 cwd 기준 탐색으로는
// 모노레포 루트의 .env를 찾지 못한다. 이 파일 위치 기준 절대경로로 명시한다.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: resolve(repoRoot, '.env') });

// GOOGLE_APPLICATION_CREDENTIALS(상대경로)도 google-auth-library가 cwd(server/) 기준으로
// 해석하므로, .env에 상대경로로 적혀 있으면 저장소 루트 기준 절대경로로 바꿔준다.
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(
    repoRoot,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
