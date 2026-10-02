import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateLesson } from '../services/geminiLessonGenerator.js';

vi.mock('../services/geminiLessonGenerator.js', () => ({
  generateLesson: vi.fn(),
}));

const testEnv = {
  GOOGLE_APPLICATION_CREDENTIALS: './fake.json',
  GEMINI_MODEL: 'gemini-2.5-flash',
  PORT: 0,
};

function validGeneratedLesson() {
  return {
    title: '편의점에서',
    lines: [
      {
        speaker: 'A' as const,
        text: 'こんにちは',
        tokens: [{ surface: 'こんにちは' }],
        romaji: 'konnichiwa',
        translationKo: '안녕하세요',
      },
      {
        speaker: 'B' as const,
        text: 'いらっしゃいませ',
        tokens: [{ surface: 'いらっしゃいませ' }],
        romaji: 'irasshaimase',
        translationKo: '어서 오세요',
      },
    ],
  };
}

describe('POST /api/lessons/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for an invalid body', async () => {
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '', level: 'N5', lineCount: 4, apiKey: 'test-key' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when lineCount is out of range', async () => {
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '편의점', level: 'N5', lineCount: 100, apiKey: 'test-key' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when apiKey is missing', async () => {
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '편의점', level: 'N5', lineCount: 4 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 201 with a validated lesson on success', async () => {
    vi.mocked(generateLesson).mockResolvedValue(validGeneratedLesson());
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '편의점', level: 'N5', lineCount: 4, apiKey: 'test-key' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('편의점에서');
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.lines[0].id).toBeTruthy();
    expect(res.body.id).toBeTruthy();
    expect(vi.mocked(generateLesson)).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'test-key' }),
    );
  });

  it('returns 422 when the generator keeps failing schema validation', async () => {
    vi.mocked(generateLesson).mockRejectedValue(new Error('invalid json from gemini'));
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '편의점', level: 'N5', lineCount: 4, apiKey: 'test-key' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LESSON_GENERATION_FAILED');
  });

  it('returns 401 when the API key is rejected by Gemini', async () => {
    vi.mocked(generateLesson).mockRejectedValue(new Error('API key not valid. Please pass a valid API key.'));
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/lessons/generate')
      .send({ topic: '편의점', level: 'N5', lineCount: 4, apiKey: 'bad-key' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_API_KEY');
  });
});
