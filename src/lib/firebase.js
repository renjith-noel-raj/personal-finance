import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

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
  // ignoreUndefinedProperties lets Firestore drop undefined fields instead of
  // rejecting the whole write. The data model intentionally stores blank
  // apr/emi (and other optional fields) as undefined; without this, every
  // debt created with a blank APR/EMI makes setDoc throw and never persists.
  try {
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    // Already initialized (e.g. re-init on settings change) — reuse it.
    db = getFirestore(app);
  }
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
