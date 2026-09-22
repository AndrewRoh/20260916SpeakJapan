import type { SentenceQueuePlayer } from './SentenceQueuePlayer';

export interface MediaSessionMetadataInput {
  title: string;
  artist?: string;
}

/** 잠금화면/미디어 키에서 재생·일시정지·이전/다음 문장을 제어할 수 있도록 연결한다. */
export function bindMediaSession(player: SentenceQueuePlayer, metadata: MediaSessionMetadataInput): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return () => {};
  }

  const session = navigator.mediaSession;
  session.metadata = new MediaMetadata({
    title: metadata.title,
    artist: metadata.artist ?? '일본어 듣기 학습',
  });

  session.setActionHandler('play', () => void player.play());
  session.setActionHandler('pause', () => player.pause());
  session.setActionHandler('previoustrack', () => void player.previous());
  session.setActionHandler('nexttrack', () => void player.next());

  return () => {
    session.setActionHandler('play', null);
    session.setActionHandler('pause', null);
    session.setActionHandler('previoustrack', null);
    session.setActionHandler('nexttrack', null);
  };
}
