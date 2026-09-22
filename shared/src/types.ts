export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

/** 한자에만 reading(히라가나)이 붙는다. surface만 있으면 히라가나/가타카나/기호 등. */
export interface Token {
  surface: string;
  reading?: string;
}

export type Speaker = 'A' | 'B';

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  /** 일본어 원문 */
  text: string;
  /** 후리가나 렌더링용. tokens의 surface를 이으면 text와 같아야 한다. */
  tokens: Token[];
  romaji: string;
  translationKo: string;
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  level: JlptLevel;
  createdAt: number;
  lines: DialogueLine[];
}

export type BookSource = 'bundled' | 'user';
export type TextEncodingKind = 'utf-8' | 'shift_jis';

export interface Book {
  id: string;
  title: string;
  source: BookSource;
  encoding: TextEncodingKind;
  sizeBytes: number;
  addedAt: number;
}

export interface BookSentence {
  index: number;
  text: string;
  /** 靑空文庫 루비가 있으면 tokens[].reading에 반영된다. */
  tokens: Token[];
}

export interface ReadingProgress {
  bookId: string;
  sentenceIndex: number;
  updatedAt: number;
}

export type VoiceFamily = 'Neural2' | 'WaveNet' | 'Standard' | 'Studio' | 'Other';

export interface JapaneseVoice {
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL' | 'UNSPECIFIED';
  family: VoiceFamily;
  /** Studio 계열은 speakingRate 커스터마이즈를 지원하지 않는다. */
  supportsSpeakingRate: boolean;
}

/** 속도 프리셋. TTS speakingRate로 그대로 전달한다. */
export const SPEED_PRESETS = [0.5, 0.7, 0.85, 1.0] as const;
export type SpeedPreset = (typeof SPEED_PRESETS)[number];

/** 문장별 반복 횟수. Infinity는 무한 반복을 의미한다. */
export const REPEAT_COUNT_PRESETS = [1, 2, 3, 5, Infinity] as const;
export type RepeatCountPreset = (typeof REPEAT_COUNT_PRESETS)[number];
