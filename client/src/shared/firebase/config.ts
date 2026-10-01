import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase 클라이언트 설정값은 비밀값이 아니다(공식 문서 기준) — 접근 제어는
 * Firestore 보안 규칙과 Authentication으로 하므로 여기 그대로 둬도 안전하다.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyAFWe9bdxZ0SOchkDAtruFtZymujY4ABtI',
  authDomain: 'speaknihongo1.firebaseapp.com',
  projectId: 'speaknihongo1',
  storageBucket: 'speaknihongo1.firebasestorage.app',
  messagingSenderId: '1021713131548',
  appId: '1:1021713131548:web:194386d4e513fa3944d7d9',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);
