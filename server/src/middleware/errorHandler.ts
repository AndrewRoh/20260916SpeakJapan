import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error: { code: string; message: string };
}

function toErrorBody(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(toErrorBody('NOT_FOUND', '요청한 경로를 찾을 수 없습니다.'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(toErrorBody(err.code, err.message));
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json(toErrorBody('VALIDATION_ERROR', '입력값 검증에 실패했습니다.'));
    return;
  }

  console.error(err);
  res.status(500).json(toErrorBody('INTERNAL_ERROR', '서버 내부 오류가 발생했습니다.'));
}
