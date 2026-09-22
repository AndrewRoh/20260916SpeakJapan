import rateLimit from 'express-rate-limit';

/** 분당 IP당 60회. 초과 시 공통 오류 응답 형식으로 429를 내려준다. */
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
    });
  },
});
