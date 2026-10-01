import { getUserDoc, setUserDoc } from '../../shared/firebase/firestoreSync';
import { getCurrentUserId } from '../auth/authStore';
import { useSettingsStore, type SettingsState } from './settingsStore';

type SyncableSettings = Pick<
  SettingsState,
  'speed' | 'repeatCount' | 'gapMode' | 'gapSeconds' | 'speakerAVoice' | 'speakerBVoice' | 'bookVoice'
>;

function extractSyncable(state: SettingsState): SyncableSettings {
  const { speed, repeatCount, gapMode, gapSeconds, speakerAVoice, speakerBVoice, bookVoice } = state;
  return { speed, repeatCount, gapMode, gapSeconds, speakerAVoice, speakerBVoice, bookVoice };
}

/** 로그인 시 클라우드에 저장된 설정이 있으면 그걸로 덮어쓰고, 없으면 현재 로컬 설정을 올려 보낸다. */
export async function pullSettingsFromCloud(uid: string): Promise<void> {
  const cloudSettings = await getUserDoc<SyncableSettings>(uid, 'settings', 'preferences');
  if (cloudSettings) {
    useSettingsStore.setState(cloudSettings);
  } else {
    await pushSettingsToCloud();
  }
}

export async function pushSettingsToCloud(): Promise<void> {
  const uid = getCurrentUserId();
  if (!uid) return;
  await setUserDoc(uid, 'settings', 'preferences', extractSyncable(useSettingsStore.getState())).catch(
    (error) => console.warn('[cloudSync] 설정 동기화 실패', error),
  );
}

let started = false;

/** 앱 시작 시 한 번만 호출한다(main.tsx). 로그인 중일 때 설정 변경을 클라우드로 미러링한다. */
export function initSettingsCloudSync(): void {
  if (started) return;
  started = true;

  useSettingsStore.subscribe(() => {
    if (getCurrentUserId()) {
      void pushSettingsToCloud();
    }
  });
}
