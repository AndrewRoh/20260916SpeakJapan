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

  app.use(helmet());
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
