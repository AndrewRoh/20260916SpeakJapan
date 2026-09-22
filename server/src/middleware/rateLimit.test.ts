import { describe, expect, it } from 'vitest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

function buildTestApp() {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 2,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      });
    },
  });
  app.use('/api', limiter);
  app.get('/api/ping', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('apiRateLimiter', () => {
  it('allows requests under the limit and blocks with 429 once exceeded', async () => {
    const app = buildTestApp();

    const first = await request(app).get('/api/ping');
    const second = await request(app).get('/api/ping');
    const third = await request(app).get('/api/ping');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });
});
