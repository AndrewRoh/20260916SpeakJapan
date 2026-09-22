import type { RepeatCountPreset, SpeedPreset } from '@jp-listening-app/shared';

export type GapMode = 'fixed' | 'shadowing';

export interface RepeatControllerConfig {
  speed: SpeedPreset;
  repeatCount: RepeatCountPreset;
  gapMode: GapMode;
  /** gapMode === 'fixed'일 때 사용하는 반복 사이 간격(초), 0~5 */
  gapSeconds: number;
  rangeStart: number;
  rangeEnd: number;
  /** 구간(또는 전체)의 끝에 도달했을 때 rangeStart로 되돌아갈지 여부 */
  loopRange: boolean;
}

export interface RepeatControllerState {
  currentIndex: number;
  /** 현재 문장에서 지금까지 재생을 마친 횟수 */
  repeatsDone: number;
  config: RepeatControllerConfig;
}

export type RepeatControllerAction =
  | { type: 'repeat'; index: number; gapMs: number }
  | { type: 'advance'; index: number; gapMs: number }
  | { type: 'stop' };

const DEFAULT_GAP_SECONDS = 0;
const SHADOWING_GAP_MULTIPLIER = 1.2;

function clampIndex(index: number, total: number): number {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

/**
 * 문장 반복 재생의 상태 전이만 담당하는 순수 상태 머신.
 * 오디오 재생이나 UI에는 전혀 관여하지 않는다 — SentenceQueuePlayer가 이 클래스의
 * 지시(action)를 받아 실제 오디오 재생을 수행한다.
 */
export class RepeatController {
  private index: number;
  private repeatsDone = 0;
  private config: RepeatControllerConfig;
  /** setSpeed()는 다음 문장으로 넘어갈 때에만 적용된다. */
  private pendingSpeed: SpeedPreset | undefined;

  constructor(
    private readonly totalSentences: number,
    config: Partial<RepeatControllerConfig> = {},
  ) {
    this.config = {
      speed: config.speed ?? 1.0,
      repeatCount: config.repeatCount ?? 1,
      gapMode: config.gapMode ?? 'fixed',
      gapSeconds: config.gapSeconds ?? DEFAULT_GAP_SECONDS,
      rangeStart: clampIndex(config.rangeStart ?? 0, totalSentences),
      rangeEnd: clampIndex(config.rangeEnd ?? totalSentences - 1, totalSentences),
      loopRange: config.loopRange ?? false,
    };
    this.index = clampIndex(this.config.rangeStart, totalSentences);
  }

  getState(): RepeatControllerState {
    return {
      currentIndex: this.index,
      repeatsDone: this.repeatsDone,
      config: { ...this.config },
    };
  }

  /** 재생 중 속도를 바꿔도 현재 문장의 남은 반복에는 적용하지 않고, 다음 문장부터 적용한다. */
  setSpeed(speed: SpeedPreset): void {
    this.pendingSpeed = speed;
  }

  setRepeatCount(repeatCount: RepeatCountPreset): void {
    this.config = { ...this.config, repeatCount };
  }

  setGapMode(gapMode: GapMode): void {
    this.config = { ...this.config, gapMode };
  }

  setGapSeconds(gapSeconds: number): void {
    this.config = { ...this.config, gapSeconds: Math.min(Math.max(gapSeconds, 0), 5) };
  }

  setRange(rangeStart: number, rangeEnd: number, loopRange = this.config.loopRange): void {
    const start = clampIndex(rangeStart, this.totalSentences);
    const end = clampIndex(rangeEnd, this.totalSentences);
    this.config = {
      ...this.config,
      rangeStart: Math.min(start, end),
      rangeEnd: Math.max(start, end),
      loopRange,
    };
  }

  /** 전체 반복: 범위를 문장 전체로 설정한다. */
  setFullRangeLoop(loopRange = true): void {
    this.setRange(0, this.totalSentences - 1, loopRange);
  }

  jumpTo(index: number): void {
    this.index = clampIndex(index, this.totalSentences);
    this.repeatsDone = 0;
  }

  next(): void {
    this.jumpTo(this.index + 1);
    this.applyPendingSpeed();
  }

  previous(): void {
    this.jumpTo(this.index - 1);
    this.applyPendingSpeed();
  }

  private applyPendingSpeed(): void {
    if (this.pendingSpeed !== undefined) {
      this.config = { ...this.config, speed: this.pendingSpeed };
      this.pendingSpeed = undefined;
    }
  }

  private computeGapMs(lastSentenceDurationMs: number): number {
    if (this.config.gapMode === 'shadowing') {
      return lastSentenceDurationMs * SHADOWING_GAP_MULTIPLIER;
    }
    return this.config.gapSeconds * 1000;
  }

  /**
   * 현재 문장의 재생이 한 번 끝났을 때 호출한다. 반복 횟수를 다 채우지 못했으면
   * 같은 문장을 다시 재생(repeat)하고, 다 채웠으면 다음 문장으로 넘어가거나(advance)
   * 구간의 끝이면 loopRange 여부에 따라 처음으로 되돌아가거나 멈춘다(stop).
   */
  reportSentenceFinished(lastSentenceDurationMs: number): RepeatControllerAction {
    this.repeatsDone += 1;
    const gapMs = this.computeGapMs(lastSentenceDurationMs);

    if (this.repeatsDone < this.config.repeatCount) {
      return { type: 'repeat', index: this.index, gapMs };
    }

    if (this.index < this.config.rangeEnd) {
      this.jumpTo(this.index + 1);
      this.applyPendingSpeed();
      return { type: 'advance', index: this.index, gapMs };
    }

    if (this.config.loopRange) {
      this.jumpTo(this.config.rangeStart);
      this.applyPendingSpeed();
      return { type: 'advance', index: this.index, gapMs };
    }

    return { type: 'stop' };
  }
}
