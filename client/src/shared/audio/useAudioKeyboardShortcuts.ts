import { useEffect } from 'react';

export interface AudioKeyboardHandlers {
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRepeatCurrent: () => void;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

/** Space 재생/정지, ←/→ 문장 이동, R 현재 문장 반복 */
export function useAudioKeyboardShortcuts(handlers: AudioKeyboardHandlers, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          handlers.onTogglePlay();
          break;
        case 'ArrowLeft':
          handlers.onPrevious();
          break;
        case 'ArrowRight':
          handlers.onNext();
          break;
        case 'r':
        case 'R':
          handlers.onRepeatCurrent();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers]);
}
