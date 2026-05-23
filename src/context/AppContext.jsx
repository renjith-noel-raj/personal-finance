import React, { createContext, useContext, useState, useEffect } from 'react';
import { initFirebase, listenToAuth, signOutUser } from '../lib/firebase';

const AppContext = createContext(null);

const SETTINGS_KEY = 'pf_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function AppProvider({ children }) {
  const [storageMode, setStorageMode] = useState(null);
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = loadSettings();
    if (s.storageMode) setStorageMode(s.storageMode);
    if (s.firebaseConfig) {
      setFirebaseConfig(s.firebaseConfig);
      try {
        initFirebase(s.firebaseConfig);
        const unsub = listenToAuth((u) => {
          setUser(u);
          setLoading(false);
        });
        return () => unsub && unsub();
      } catch (err) {
        console.error('Firebase init failed:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const chooseStorageMode = (mode) => {
    setStorageMode(mode);
    saveSettings({ ...loadSettings(), storageMode: mode });
  };

  const setFirebaseConfigAndInit = (config) => {
    initFirebase(config);
    setFirebaseConfig(config);
    saveSettings({ ...loadSettings(), firebaseConfig: config });
    const unsub = listenToAuth((u) => setUser(u));
    return unsub;
  };

  const resetSetup = () => {
    if (user) signOutUser().catch(() => {});
    localStorage.removeItem(SETTINGS_KEY);
    setStorageMode(null);
    setFirebaseConfig(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{
      storageMode, chooseStorageMode,
      firebaseConfig, setFirebaseConfigAndInit,
      user, setUser, resetSetup,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
