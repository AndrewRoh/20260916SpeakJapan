import { useState } from 'react';
import { signInWithGoogle, signOutUser } from '../../shared/firebase/auth';
import { useAuthStore } from './authStore';

export function LoginButton() {
  const user = useAuthStore((state) => state.user);
  const initializing = useAuthStore((state) => state.initializing);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      if (user) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.warn('[auth] 로그인/로그아웃 실패', error);
    } finally {
      setBusy(false);
    }
  }

  if (initializing) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={user ? '클릭하면 로그아웃됩니다' : undefined}
      className="ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      {user ? (
        <>
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span>{user.displayName ?? '로그아웃'}</span>
        </>
      ) : (
        <span>Google 로그인</span>
      )}
    </button>
  );
}
