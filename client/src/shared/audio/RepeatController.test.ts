import { describe, expect, it } from 'vitest';
import { RepeatController } from './RepeatController';

describe('RepeatController - repeat count', () => {
  it('repeats the same sentence until repeatCount is reached, then advances', () => {
    const controller = new RepeatController(3, { repeatCount: 3, gapSeconds: 1 });

    const first = controller.reportSentenceFinished(1000);
    expect(first).toEqual({ type: 'repeat', index: 0, gapMs: 1000 });

    const second = controller.reportSentenceFinished(1000);
    expect(second).toEqual({ type: 'repeat', index: 0, gapMs: 1000 });

    const third = controller.reportSentenceFinished(1000);
    expect(third).toEqual({ type: 'advance', index: 1, gapMs: 1000 });
    expect(controller.getState().currentIndex).toBe(1);
    expect(controller.getState().repeatsDone).toBe(0);
  });

  it('advances immediately when repeatCount is 1', () => {
    const controller = new RepeatController(3, { repeatCount: 1 });
    const action = controller.reportSentenceFinished(500);
    expect(action).toEqual({ type: 'advance', index: 1, gapMs: 0 });
  });
});

describe('RepeatController - shadowing gap', () => {
  it('uses 1.2x of the last sentence duration as the gap when gapMode is shadowing', () => {
    const controller = new RepeatController(2, { repeatCount: 2, gapMode: 'shadowing' });
    const action = controller.reportSentenceFinished(2000);
    expect(action).toEqual({ type: 'repeat', index: 0, gapMs: 2400 });
  });
});

describe('RepeatController - range repeat', () => {
  it('loops back to rangeStart when reaching rangeEnd with loopRange enabled', () => {
    const controller = new RepeatController(5, {
      repeatCount: 1,
      rangeStart: 1,
      rangeEnd: 3,
      loopRange: true,
    });
    expect(controller.getState().currentIndex).toBe(1);

    controller.reportSentenceFinished(0); // 1 -> 2
    controller.reportSentenceFinished(0); // 2 -> 3
    const atEnd = controller.reportSentenceFinished(0); // 3 -> loop back to 1
    expect(atEnd).toEqual({ type: 'advance', index: 1, gapMs: 0 });
  });

  it('stops at rangeEnd when loopRange is disabled', () => {
    const controller = new RepeatController(5, {
      repeatCount: 1,
      rangeStart: 0,
      rangeEnd: 1,
      loopRange: false,
    });

    controller.reportSentenceFinished(0); // 0 -> 1
    const stopAction = controller.reportSentenceFinished(0); // at rangeEnd, no loop
    expect(stopAction).toEqual({ type: 'stop' });
  });

  it('setFullRangeLoop repeats the entire sentence list from the beginning', () => {
    const controller = new RepeatController(3, { repeatCount: 1 });
    controller.setFullRangeLoop(true);
    controller.jumpTo(2);

    const action = controller.reportSentenceFinished(0);
    expect(action).toEqual({ type: 'advance', index: 0, gapMs: 0 });
  });
});

describe('RepeatController - infinite repeat with manual navigation', () => {
  it('keeps repeating the same sentence when repeatCount is Infinity', () => {
    const controller = new RepeatController(3, { repeatCount: Infinity });
    for (let i = 0; i < 10; i += 1) {
      const action = controller.reportSentenceFinished(100);
      expect(action).toEqual({ type: 'repeat', index: 0, gapMs: 0 });
    }
    expect(controller.getState().currentIndex).toBe(0);
  });

  it('lets the user manually move to the next sentence even during infinite repeat', () => {
    const controller = new RepeatController(3, { repeatCount: Infinity });
    controller.reportSentenceFinished(100);
    controller.reportSentenceFinished(100);

    controller.next();

    expect(controller.getState().currentIndex).toBe(1);
    expect(controller.getState().repeatsDone).toBe(0);
  });
});

describe('RepeatController - speed change takes effect from the next sentence', () => {
  it('does not change speed mid-repeat, only once the index advances', () => {
    const controller = new RepeatController(3, { repeatCount: 2, speed: 1.0 });
    controller.setSpeed(0.5);

    // still on sentence 0, first repeat pending -> speed should remain 1.0
    expect(controller.getState().config.speed).toBe(1.0);

    controller.reportSentenceFinished(0); // repeat (still same sentence)
    expect(controller.getState().config.speed).toBe(1.0);

    controller.reportSentenceFinished(0); // advances to sentence 1 -> pending speed applies
    expect(controller.getState().config.speed).toBe(0.5);
    expect(controller.getState().currentIndex).toBe(1);
  });
});

describe('RepeatController - jump to a specific sentence', () => {
  it('resets repeatsDone when jumping to a tapped sentence', () => {
    const controller = new RepeatController(5, { repeatCount: 3 });
    controller.reportSentenceFinished(0);
    expect(controller.getState().repeatsDone).toBe(1);

    controller.jumpTo(4);
    expect(controller.getState().currentIndex).toBe(4);
    expect(controller.getState().repeatsDone).toBe(0);
  });
});
