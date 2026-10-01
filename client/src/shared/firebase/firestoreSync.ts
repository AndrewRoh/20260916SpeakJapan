import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { firestoreDb } from './config';

/** 모든 사용자 데이터는 users/{uid}/{collectionName}/{docId} 아래에 둔다. */
function userDocRef(uid: string, collectionName: string, docId: string) {
  return doc(firestoreDb, 'users', uid, collectionName, docId);
}

function userCollectionRef(uid: string, collectionName: string) {
  return collection(firestoreDb, 'users', uid, collectionName);
}

export async function setUserDoc(
  uid: string,
  collectionName: string,
  docId: string,
  data: object,
): Promise<void> {
  await setDoc(userDocRef(uid, collectionName, docId), data);
}

export async function getUserDoc<T>(
  uid: string,
  collectionName: string,
  docId: string,
): Promise<T | undefined> {
  const snapshot = await getDoc(userDocRef(uid, collectionName, docId));
  return snapshot.exists() ? (snapshot.data() as T) : undefined;
}

export async function getAllUserDocs<T>(uid: string, collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(userCollectionRef(uid, collectionName));
  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as T);
}

export async function deleteUserDoc(
  uid: string,
  collectionName: string,
  docId: string,
): Promise<void> {
  await deleteDoc(userDocRef(uid, collectionName, docId));
}
