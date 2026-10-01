import { subscribeToAuthState } from '../../shared/firebase/auth';
import { pullSettingsFromCloud } from '../settings/settingsCloudSync';
import { useAuthStore } from './authStore';
import { pullCloudDataToLocal } from './cloudSync';

let started = false;

/** 앱 시작 시 한 번만 호출한다(main.tsx). 로그인되면 클라우드 데이터를 로컬로 병합한다. */
export function initAuthListener(): void {
  if (started) return;
  started = true;

  subscribeToAuthState((user) => {
    useAuthStore.getState().setUser(user);
    if (user) {
      pullCloudDataToLocal(user.uid).catch((error) =>
        console.warn('[cloudSync] 로그인 시 데이터 병합 실패', error),
      );
      pullSettingsFromCloud(user.uid).catch((error) =>
        console.warn('[cloudSync] 로그인 시 설정 병합 실패', error),
      );
    }
  });
}
