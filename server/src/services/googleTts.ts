import textToSpeech, { protos } from '@google-cloud/text-to-speech';
import type { JapaneseVoice, VoiceFamily } from '@jp-listening-app/shared';

export type { JapaneseVoice, VoiceFamily };

const FAMILY_PRIORITY: Record<VoiceFamily, number> = {
  Neural2: 0,
  WaveNet: 1,
  Standard: 2,
  Studio: 3,
  Other: 4,
};

function detectFamily(voiceName: string): VoiceFamily {
  if (voiceName.includes('Neural2')) return 'Neural2';
  if (voiceName.includes('Wavenet')) return 'WaveNet';
  if (voiceName.includes('Standard')) return 'Standard';
  if (voiceName.includes('Studio')) return 'Studio';
  return 'Other';
}

let cachedClient: InstanceType<typeof textToSpeech.TextToSpeechClient> | undefined;

function getClient() {
  cachedClient ??= new textToSpeech.TextToSpeechClient();
  return cachedClient;
}

export async function listJapaneseVoices(): Promise<JapaneseVoice[]> {
  const client = getClient();
  const [response] = await client.listVoices({ languageCode: 'ja-JP' });
  const voices = response.voices ?? [];

  return voices
    .filter((voice) => voice.name && voice.languageCodes?.includes('ja-JP'))
    .map((voice) => {
      const family = detectFamily(voice.name ?? '');
      return {
        name: voice.name ?? '',
        ssmlGender: ssmlGenderToString(voice.ssmlGender),
        family,
        supportsSpeakingRate: family !== 'Studio',
      } satisfies JapaneseVoice;
    })
    .sort((a, b) => FAMILY_PRIORITY[a.family] - FAMILY_PRIORITY[b.family]);
}

function ssmlGenderToString(gender: unknown): JapaneseVoice['ssmlGender'] {
  const value = String(gender);
  if (value === 'MALE' || value === String(protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE)) {
    return 'MALE';
  }
  if (value === 'FEMALE' || value === String(protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE)) {
    return 'FEMALE';
  }
  if (value === 'NEUTRAL' || value === String(protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL)) {
    return 'NEUTRAL';
  }
  return 'UNSPECIFIED';
}

export interface SynthesizeOptions {
  text: string;
  voiceName: string;
  speakingRate: number;
}

export async function synthesizeSpeech({
  text,
  voiceName,
  speakingRate,
}: SynthesizeOptions): Promise<Buffer> {
  const client = getClient();
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode: 'ja-JP', name: voiceName },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
    },
  });

  if (!response.audioContent) {
    throw new Error('TTS 응답에 오디오 콘텐츠가 없습니다.');
  }

  return Buffer.from(response.audioContent);
}
