import { localGet, localSet, localDelete } from './indexeddb';
import { getDb } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const KEYS = ['expenses', 'incomes', 'expCats', 'incCats', 'expCatActive', 'incCatActive', 'budgets', 'goals'];

function userDocRef(uid, key) {
  return doc(getDb(), 'users', uid, 'data', key);
}

export function createStorage(mode, user) {
  if (mode === 'local') {
    return {
      get: (key) => localGet(key),
      set: (key, value) => localSet(key, value),
      delete: (key) => localDelete(key),
      clearAll: async () => {
        for (const k of KEYS) await localDelete(k);
      },
    };
  } else if (mode === 'firebase' && user) {
    return {
      get: async (key) => {
        const snap = await getDoc(userDocRef(user.uid, key));
        return snap.exists() ? snap.data().value : null;
      },
      set: async (key, value) => {
        await setDoc(userDocRef(user.uid, key), { value, updatedAt: Date.now() });
      },
      delete: async (key) => {
        await deleteDoc(userDocRef(user.uid, key));
      },
      clearAll: async () => {
        for (const k of KEYS) {
          try { await deleteDoc(userDocRef(user.uid, k)); } catch {}
        }
      },
    };
  }
  throw new Error('Invalid storage mode or missing user');
}
