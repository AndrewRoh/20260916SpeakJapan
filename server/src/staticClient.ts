import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const clientDistDir = resolve(serverDir, '../client/dist');

/**
 * 프로덕션 빌드(client/dist)가 존재하면 정적 파일을 서빙하고, API가 아닌
 * GET 요청은 index.html로 돌려보내 SPA 라우팅이 동작하게 한다(Docker 배포용).
 * 개발 모드(client/dist 없음, Vite dev server 사용)에서는 아무 것도 하지 않는다.
 */
export function serveClientIfBuilt(app: Express): void {
  if (!existsSync(clientDistDir)) return;

  app.use(express.static(clientDistDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(join(clientDistDir, 'index.html'));
  });
}
