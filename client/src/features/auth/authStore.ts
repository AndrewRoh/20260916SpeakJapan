import { create } from 'zustand';
import type { User } from '../../shared/firebase/auth';

export interface AuthState {
  user: User | null;
  /** 앱 시작 시 Firebase가 로그인 상태를 복원하는 동안 true */
  initializing: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user, initializing: false }),
}));

export function getCurrentUserId(): string | undefined {
  return useAuthStore.getState().user?.uid;
}
