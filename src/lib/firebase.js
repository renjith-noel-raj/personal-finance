import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;

export function initFirebase(config) {
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
}

export function getAuthInstance() {
  if (!auth) throw new Error('Firebase not initialized');
  return auth;
}

export function getDb() {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getAuthInstance(), provider);
}

export function signOutUser() {
  return signOut(getAuthInstance());
}

export function listenToAuth(callback) {
  return onAuthStateChanged(getAuthInstance(), callback);
}
