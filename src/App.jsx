import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import SetupScreen from './components/SetupScreen.jsx';
import FirebaseSetup from './components/FirebaseSetup.jsx';
import SignIn from './components/SignIn.jsx';
import Dashboard from './components/Dashboard.jsx';

function AppShell() {
  const { storageMode, firebaseConfig, user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!storageMode) return <SetupScreen />;
  if (storageMode === 'firebase' && !firebaseConfig) return <FirebaseSetup />;
  if (storageMode === 'firebase' && firebaseConfig && !user) return <SignIn />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
