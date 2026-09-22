import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson, RepeatCountPreset, SpeedPreset } from '@jp-listening-app/shared';
import { SentenceQueuePlayer, type PlayerStatus } from '../../../shared/audio/SentenceQueuePlayer';
import type { GapMode } from '../../../shared/audio/RepeatController';
import { fetchSentenceAudio } from '../../../shared/tts/ttsClient';
import { bindMediaSession } from '../../../shared/audio/mediaSession';
import { useSettingsStore } from '../../settings/settingsStore';

export function useLessonPlayer(lesson: Lesson) {
  const initialSpeed = useSettingsStore((s) => s.speed);
  const initialRepeatCount = useSettingsStore((s) => s.repeatCount);
  const initialGapMode = useSettingsStore((s) => s.gapMode);
  const initialGapSeconds = useSettingsStore((s) => s.gapSeconds);
  const speakerAVoice = useSettingsStore((s) => s.speakerAVoice);
  const speakerBVoice = useSettingsStore((s) => s.speakerBVoice);

  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeedState] = useState<SpeedPreset>(initialSpeed);
  const [repeatCount, setRepeatCountState] = useState<RepeatCountPreset>(initialRepeatCount);
  const [gapMode, setGapModeState] = useState<GapMode>(initialGapMode);
  const [gapSeconds, setGapSecondsState] = useState(initialGapSeconds);

  const playerRef = useRef<SentenceQueuePlayer | undefined>(undefined);
  const voicesRef = useRef({ speakerAVoice, speakerBVoice });
  voicesRef.current = { speakerAVoice, speakerBVoice };

  useEffect(() => {
    const player = new SentenceQueuePlayer({
      sentences: lesson.lines.map((line) => ({ id: line.id, text: line.text })),
      fetchAudio: ({ index, speed: currentSpeed, signal }) => {
        const line = lesson.lines[index];
        if (!line) return Promise.reject(new Error('문장을 찾을 수 없습니다.'));
        const voiceName =
          line.speaker === 'A' ? voicesRef.current.speakerAVoice : voicesRef.current.speakerBVoice;
        return fetchSentenceAudio({
          text: line.text,
          voiceName,
          speakingRate: currentSpeed,
          lessonId: lesson.id,
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
      },
    });
    playerRef.current = player;
    const unbindMediaSession = bindMediaSession(player, { title: lesson.title });

    return () => {
      unbindMediaSession();
      player.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

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
