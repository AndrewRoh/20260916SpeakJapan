import type { SpeedPreset } from '@jp-listening-app/shared';
import { RepeatController, type RepeatControllerConfig } from './RepeatController';

export interface QueueSentence {
  id: string;
  text: string;
}

export interface FetchAudioParams {
  index: number;
  speed: SpeedPreset;
  signal: AbortSignal;
}

/** 문장 오디오 Blob을 가져오는 함수. 캐시 조회/네트워크 호출은 ttsClient가 담당한다. */
export type FetchSentenceAudio = (params: FetchAudioParams) => Promise<Blob>;

export interface AudioElementLike {
  src: string;
  currentTime: number;
  duration: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export type CreateAudioElement = () => AudioElementLike;

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped';

export interface SentenceQueuePlayerOptions {
  sentences: QueueSentence[];
  fetchAudio: FetchSentenceAudio;
  config?: Partial<RepeatControllerConfig>;
  createAudioElement?: CreateAudioElement;
  prefetchCount?: number;
  onStatusChange?: (status: PlayerStatus, sentenceIndex: number) => void;
}

const defaultCreateAudioElement: CreateAudioElement = () => new Audio();

/**
 * 문장 배열을 순서대로(반복 포함) 재생하는 엔진. 회화 레슨과 책 읽기가 공유해서 쓴다.
 * play()/next()/previous()/jumpTo()는 재생을 "시작"하면 바로 resolve된다 — 문장이
 * 끝나기를 기다렸다가 resolve되지 않는다. 다음 문장으로의 전환은 'ended' 이벤트로
 * 트리거되어 내부적으로(백그라운드) 이어진다.
 */
export class SentenceQueuePlayer {
  readonly controller: RepeatController;
  private readonly sentences: QueueSentence[];
  private readonly fetchAudio: FetchSentenceAudio;
  private readonly createAudioElement: CreateAudioElement;
  private readonly prefetchCount: number;
  private readonly onStatusChange?: (status: PlayerStatus, sentenceIndex: number) => void;

  private audioElement: AudioElementLike | undefined;
  private currentObjectUrl: string | undefined;
  private abortController: AbortController | undefined;
  private gapTimer: ReturnType<typeof setTimeout> | undefined;
  private prefetchCache = new Map<string, Blob>();
  private status: PlayerStatus = 'idle';
  private destroyed = false;

  constructor(options: SentenceQueuePlayerOptions) {
    this.sentences = options.sentences;
    this.fetchAudio = options.fetchAudio;
    this.createAudioElement = options.createAudioElement ?? defaultCreateAudioElement;
    this.prefetchCount = options.prefetchCount ?? 2;
    this.onStatusChange = options.onStatusChange;
    this.controller = new RepeatController(this.sentences.length, options.config);
  }

  getStatus(): PlayerStatus {
    return this.status;
  }

  getCurrentSentence(): QueueSentence | undefined {
    return this.sentences[this.controller.getState().currentIndex];
  }

  /** 자동재생 정책상 사용자 제스처(클릭 등) 안에서 호출되어야 한다. */
  async play(): Promise<void> {
    this.clearGapTimer();
    await this.startPlaybackForCurrentIndex();
  }

  pause(): void {
    this.audioElement?.pause();
    this.clearGapTimer();
    this.setStatus('paused');
  }

  stop(): void {
    this.abortController?.abort();
    this.audioElement?.pause();
    this.clearGapTimer();
    this.revokeCurrentUrl();
    this.setStatus('stopped');
  }

  async next(): Promise<void> {
    this.controller.next();
    await this.play();
  }

  async previous(): Promise<void> {
    this.controller.previous();
    await this.play();
  }

  async jumpTo(index: number): Promise<void> {
    this.controller.jumpTo(index);
    await this.play();
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.prefetchCache.clear();
  }

  private setStatus(status: PlayerStatus): void {
    this.status = status;
    this.onStatusChange?.(status, this.controller.getState().currentIndex);
  }

  private cacheKey(index: number, speed: SpeedPreset): string {
    return `${index}:${speed}`;
  }

  private async getBlob(index: number, speed: SpeedPreset, signal: AbortSignal): Promise<Blob> {
    const key = this.cacheKey(index, speed);
    const cached = this.prefetchCache.get(key);
    if (cached) return cached;

    const blob = await this.fetchAudio({ index, speed, signal });
    this.prefetchCache.set(key, blob);
    return blob;
  }

  /** 현재 인덱스의 오디오를 불러와 재생을 "시작"만 하고 바로 반환한다. */
  private async startPlaybackForCurrentIndex(): Promise<void> {
    if (this.destroyed) return;
    const { currentIndex, config } = this.controller.getState();
    const sentence = this.sentences[currentIndex];
    if (!sentence) {
      this.setStatus('stopped');
      return;
    }

    this.setStatus('loading');
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    let blob: Blob;
    try {
      blob = await this.getBlob(currentIndex, config.speed, signal);
    } catch (error) {
      if (signal.aborted) return;
      throw error;
    }
    if (signal.aborted || this.destroyed) return;

    this.revokeCurrentUrl();
    this.currentObjectUrl = URL.createObjectURL(blob);

    this.audioElement?.pause();
    const audio = this.createAudioElement();
    this.audioElement = audio;
    audio.src = this.currentObjectUrl;
    audio.addEventListener('ended', this.handleEnded);

    this.setStatus('playing');
    await audio.play();

    this.prefetchUpcoming(currentIndex, config.speed);
  }

  private handleEnded = (): void => {
    if (this.destroyed) return;
    const durationMs = (this.audioElement?.duration ?? 0) * 1000;
    const action = this.controller.reportSentenceFinished(durationMs);

    if (action.type === 'stop') {
      this.setStatus('stopped');
      return;
    }

    this.gapTimer = setTimeout(() => {
      void this.startPlaybackForCurrentIndex();
    }, action.gapMs);
  };

  private prefetchUpcoming(fromIndex: number, speed: SpeedPreset): void {
    for (let offset = 1; offset <= this.prefetchCount; offset += 1) {
      const targetIndex = fromIndex + offset;
      if (targetIndex >= this.sentences.length) break;
      const key = this.cacheKey(targetIndex, speed);
      if (this.prefetchCache.has(key)) continue;

      const controller = new AbortController();
      void this.fetchAudio({ index: targetIndex, speed, signal: controller.signal })
        .then((blob) => this.prefetchCache.set(key, blob))
        .catch(() => {
          // 미리 가져오기 실패는 무시한다 — 실제 재생 시점에 다시 시도한다.
        });
    }
  }

  private clearGapTimer(): void {
    if (this.gapTimer) {
      clearTimeout(this.gapTimer);
      this.gapTimer = undefined;
    }
  }

  private revokeCurrentUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = undefined;
    }
  }
}
