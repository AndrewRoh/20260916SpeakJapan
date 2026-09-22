import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SentenceQueuePlayer, type AudioElementLike, type FetchSentenceAudio } from './SentenceQueuePlayer';

class FakeAudioElement implements AudioElementLike {
  src = '';
  currentTime = 0;
  duration = 1;
  private listeners = new Map<string, Set<() => void>>();

  play(): Promise<void> {
    return Promise.resolve();
  }

  pause(): void {}

  addEventListener(type: string, listener: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emitEnded(): void {
    this.listeners.get('ended')?.forEach((listener) => listener());
  }
}

describe('SentenceQueuePlayer', () => {
  let createdAudioElements: FakeAudioElement[];
  let fetchAudio: FetchSentenceAudio;

  beforeEach(() => {
    createdAudioElements = [];
    vi.useFakeTimers();
    fetchAudio = vi.fn(async ({ index }) => new Blob([`audio-${index}`]));
    (globalThis as { URL: typeof URL }).URL.createObjectURL = vi.fn(() => 'blob:fake');
    (globalThis as { URL: typeof URL }).URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createPlayer(sentenceCount: number, repeatCount = 1) {
    return new SentenceQueuePlayer({
      sentences: Array.from({ length: sentenceCount }, (_, i) => ({ id: `s${i}`, text: `文${i}` })),
      fetchAudio,
      config: { repeatCount, gapSeconds: 0 },
      createAudioElement: () => {
        const el = new FakeAudioElement();
        createdAudioElements.push(el);
        return el;
      },
    });
  }

  it('plays the first sentence and fetches its audio', async () => {
    const player = createPlayer(3);
    await player.play();

    expect(fetchAudio).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0 }),
    );
    expect(player.getStatus()).toBe('playing');
  });

  it('advances to the next sentence once playback ends and repeats are exhausted', async () => {
    const player = createPlayer(3, 1);
    await player.play();

    createdAudioElements[0]?.emitEnded();
    // gapMs가 0이라도 setTimeout을 거치므로 타이머를 진행시킨다
    await vi.runOnlyPendingTimersAsync();

    expect(player.controller.getState().currentIndex).toBe(1);
  });

  it('stops after the last sentence with no loop configured', async () => {
    const player = createPlayer(2, 1);
    await player.play();
    createdAudioElements[0]?.emitEnded();
    await vi.runOnlyPendingTimersAsync();

    createdAudioElements[1]?.emitEnded();
    await vi.runOnlyPendingTimersAsync();

    expect(player.getStatus()).toBe('stopped');
  });

  it('jumpTo plays the tapped sentence immediately', async () => {
    const player = createPlayer(5);
    await player.play();
    await player.jumpTo(3);

    expect(player.controller.getState().currentIndex).toBe(3);
    expect(fetchAudio).toHaveBeenCalledWith(expect.objectContaining({ index: 3 }));
  });
});
