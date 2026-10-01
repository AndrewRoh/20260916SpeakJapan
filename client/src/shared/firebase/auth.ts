import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(firebaseAuth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  await signOut(firebaseAuth);
}

/** Firebase 인증 상태 변화를 구독한다. 반환값을 호출하면 구독을 해제한다. */
export function subscribeToAuthState(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, onChange);
}

export type { User };
