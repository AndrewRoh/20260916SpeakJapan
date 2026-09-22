import { useCallback, useEffect, useRef, useState } from 'react';
import type { BookSentence, RepeatCountPreset, SpeedPreset } from '@jp-listening-app/shared';
import { SentenceQueuePlayer, type PlayerStatus } from '../../../shared/audio/SentenceQueuePlayer';
import type { GapMode } from '../../../shared/audio/RepeatController';
import { fetchSentenceAudio } from '../../../shared/tts/ttsClient';
import { bindMediaSession } from '../../../shared/audio/mediaSession';
import { getReadingProgress, saveReadingProgress } from '../../../shared/db/repositories';
import { useSettingsStore } from '../../settings/settingsStore';

export function useBookPlayer(bookId: string, bookTitle: string, sentences: BookSentence[]) {
  const initialSpeed = useSettingsStore((s) => s.speed);
  const initialRepeatCount = useSettingsStore((s) => s.repeatCount);
  const initialGapMode = useSettingsStore((s) => s.gapMode);
  const initialGapSeconds = useSettingsStore((s) => s.gapSeconds);
  const bookVoice = useSettingsStore((s) => s.bookVoice);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeedState] = useState<SpeedPreset>(initialSpeed);
  const [repeatCount, setRepeatCountState] = useState<RepeatCountPreset>(initialRepeatCount);
  const [gapMode, setGapModeState] = useState<GapMode>(initialGapMode);
  const [gapSeconds, setGapSecondsState] = useState(initialGapSeconds);
  const [ready, setReady] = useState(false);

  const playerRef = useRef<SentenceQueuePlayer | undefined>(undefined);
  const bookVoiceRef = useRef(bookVoice);
  bookVoiceRef.current = bookVoice;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const progress = await getReadingProgress(bookId);
      if (cancelled) return;

      const player = new SentenceQueuePlayer({
        sentences: sentences.map((s) => ({ id: String(s.index), text: s.text })),
        fetchAudio: ({ index, speed: currentSpeed, signal }) => {
          const sentence = sentences[index];
          if (!sentence) return Promise.reject(new Error('문장을 찾을 수 없습니다.'));
          return fetchSentenceAudio({
            text: sentence.text,
            voiceName: bookVoiceRef.current,
            speakingRate: currentSpeed,
            bookId,
            signal,
          });
        },
        config: {
          speed: initialSpeed,
          repeatCount: initialRepeatCount,
          gapMode: initialGapMode,
          gapSeconds: initialGapSeconds,
        },
        onStatusChange: (nextStatus, index) => {
          setStatus(nextStatus);
          setCurrentIndex(index);
          void saveReadingProgress({ bookId, sentenceIndex: index, updatedAt: Date.now() });
        },
      });

      if (progress) player.controller.jumpTo(progress.sentenceIndex);
      playerRef.current = player;
      setCurrentIndex(player.controller.getState().currentIndex);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    if (!playerRef.current) return;
    return bindMediaSession(playerRef.current, { title: bookTitle });
  }, [bookTitle, ready]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const current = player.getStatus();
    if (current === 'playing' || current === 'loading') {
      player.pause();
    } else {
      void player.play();
    }
  }, []);

  const next = useCallback(() => void playerRef.current?.next(), []);
  const previous = useCallback(() => void playerRef.current?.previous(), []);
  const jumpTo = useCallback((index: number) => void playerRef.current?.jumpTo(index), []);
  const repeatCurrent = useCallback(() => void playerRef.current?.play(), []);

  const changeSpeed = useCallback((value: SpeedPreset) => {
    playerRef.current?.controller.setSpeed(value);
    setSpeedState(value);
  }, []);

  const changeRepeatCount = useCallback((value: RepeatCountPreset) => {
    playerRef.current?.controller.setRepeatCount(value);
    setRepeatCountState(value);
  }, []);

  const changeGapMode = useCallback((value: GapMode) => {
    playerRef.current?.controller.setGapMode(value);
    setGapModeState(value);
  }, []);

  const changeGapSeconds = useCallback((value: number) => {
    playerRef.current?.controller.setGapSeconds(value);
    setGapSecondsState(value);
  }, []);

  return {
    ready,
    status,
    currentIndex,
    speed,
    repeatCount,
    gapMode,
    gapSeconds,
    togglePlay,
    next,
    previous,
    jumpTo,
    repeatCurrent,
    changeSpeed,
    changeRepeatCount,
    changeGapMode,
    changeGapSeconds,
  };
}
