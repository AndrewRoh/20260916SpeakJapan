import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ttsRouter } from './routes/tts.js';
import { createLessonsRouter } from './routes/lessons.js';
import { serveClientIfBuilt } from './staticClient.js';

export function createApp(env: Env): Express {
  const app = express();

  app.use(
    helmet({
      // upgrade-insecure-requests가 켜져 있으면 HTTP로만 서빙하는 배포(예: NAS 내부망)에서
      // 브라우저가 정적 자산을 https://로 요청하다 연결 실패로 화면이 비게 된다.
      // media-src 기본값은 blob: URL을 허용하지 않아, TTS 오디오(Blob → blob: URL)를
      // <audio>에 넣으면 CSP 위반으로 재생이 막힌다.
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          upgradeInsecureRequests: null,
          mediaSrc: ["'self'", 'blob:'],
        },
      },
      // COOP는 HTTPS에서만 의미가 있고, HTTP 배포에서는 무시되며 콘솔 경고만 남긴다.
      crossOriginOpenerPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', apiRateLimiter);

  app.use('/api', ttsRouter);
  app.use('/api', createLessonsRouter(env));

  serveClientIfBuilt(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
