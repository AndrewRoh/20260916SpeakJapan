import { Router } from 'express';
import { ttsRequestSchema } from '@jp-listening-app/shared';
import { listJapaneseVoices, synthesizeSpeech, type JapaneseVoice } from '../services/googleTts.js';
import { ApiError } from '../middleware/errorHandler.js';

export const ttsRouter = Router();

let voicesCache: { voices: JapaneseVoice[]; fetchedAt: number } | undefined;
const VOICES_CACHE_TTL_MS = 60 * 60 * 1000;

ttsRouter.post('/tts', async (req, res, next) => {
  try {
    const parsed = ttsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_REQUEST', '요청 형식이 올바르지 않습니다.');
    }

    const audio = await synthesizeSpeech(parsed.data);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(audio);
  } catch (error) {
    next(error);
  }
});

ttsRouter.get('/tts/voices', async (_req, res, next) => {
  try {
    const now = Date.now();
    if (!voicesCache || now - voicesCache.fetchedAt > VOICES_CACHE_TTL_MS) {
      const voices = await listJapaneseVoices();
      voicesCache = { voices, fetchedAt: now };
    }
    res.json({ voices: voicesCache.voices });
  } catch (error) {
    next(error);
  }
});
