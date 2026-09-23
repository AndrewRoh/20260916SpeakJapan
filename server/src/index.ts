import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

// npm workspace로 실행하면 cwd가 server/가 되어 dotenv의 기본 cwd 기준 탐색으로는
// 모노레포 루트의 .env를 찾지 못한다. 이 파일 위치 기준 절대경로로 명시한다.
const currentDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(currentDir, '../../.env') });

const env = loadEnv();
const app = createApp(env);

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
