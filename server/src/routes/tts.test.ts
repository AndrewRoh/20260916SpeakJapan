import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

vi.mock('../services/googleTts.js', () => ({
  synthesizeSpeech: vi.fn(async () => Buffer.from('fake-mp3-bytes')),
  listJapaneseVoices: vi.fn(async () => [
    { name: 'ja-JP-Neural2-B', ssmlGender: 'FEMALE', family: 'Neural2', supportsSpeakingRate: true },
    { name: 'ja-JP-Standard-A', ssmlGender: 'FEMALE', family: 'Standard', supportsSpeakingRate: true },
  ]),
}));

const testEnv = {
  GEMINI_API_KEY: 'test-key',
  GOOGLE_APPLICATION_CREDENTIALS: './fake.json',
  GEMINI_MODEL: 'gemini-2.5-flash',
  PORT: 0,
};

describe('POST /api/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when text is missing', async () => {
    const app = createApp(testEnv);
    const res = await request(app).post('/api/tts').send({ voiceName: 'ja-JP-Neural2-B', speakingRate: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when speakingRate is out of range', async () => {
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/tts')
      .send({ text: 'こんにちは', voiceName: 'ja-JP-Neural2-B', speakingRate: 3 });
    expect(res.status).toBe(400);
  });

  it('returns audio/mpeg on a valid request', async () => {
    const app = createApp(testEnv);
    const res = await request(app)
      .post('/api/tts')
      .send({ text: 'こんにちは', voiceName: 'ja-JP-Neural2-B', speakingRate: 0.7 });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('audio/mpeg');
    expect(res.headers['cache-control']).toBe('private, max-age=86400');
  });
});

describe('GET /api/tts/voices', () => {
  it('returns the ja-JP voice list', async () => {
    const app = createApp(testEnv);
    const res = await request(app).get('/api/tts/voices');
    expect(res.status).toBe(200);
    expect(res.body.voices).toHaveLength(2);
    expect(res.body.voices[0].family).toBe('Neural2');
  });
});
