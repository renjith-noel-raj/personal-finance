import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Wallet, Cloud, HardDrive, Sparkles } from 'lucide-react';
import { hasLocalData, seedLocalSampleData } from '../lib/sampleData';

export default function SetupScreen() {
  const { chooseStorageMode } = useApp();
  const [seeding, setSeeding] = useState(false);

  const exploreWithSampleData = async () => {
    if (seeding) return;
    // SetupScreen only shows before a backend is chosen, but a returning local
    // user could still have data here — don't silently overwrite it.
    if (await hasLocalData()) {
      const ok = window.confirm(
        'This will replace the data currently stored in this browser with a sample dataset. Continue?'
      );
      if (!ok) return;
    }
    setSeeding(true);
    try {
      await seedLocalSampleData();
      chooseStorageMode('local'); // local needs no sign-in → straight to the dashboard
    } catch (e) {
      console.error('[PF] sample-data seed failed:', e);
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-hero">
            <Wallet size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Personal Finance</h1>
          <p className="text-slate-600">Choose how you want to store your data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => chooseStorageMode('local')}
            className="card p-6 text-left transition hover:shadow-cardMd hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
            <HardDrive className="mb-3 text-slate-700" size={28} />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Local only</h2>
            <p className="text-sm text-slate-600 mb-3">Data stays on this device. No signup. Won't sync to other devices.</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>✓ Instant start</li>
              <li>✓ Maximum privacy</li>
              <li>✗ Single device</li>
              <li>✗ No automatic backup</li>
            </ul>
          </button>

          <button onClick={() => chooseStorageMode('firebase')}
            className="card p-6 text-left transition border-brand-200 hover:shadow-cardMd hover:border-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
            <Cloud className="mb-3 text-brand-600" size={28} />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Firebase (your own)</h2>
            <p className="text-sm text-slate-600 mb-3">Syncs across all your devices. You set up your own free Firebase project (~10 min).</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>✓ Multi-device sync</li>
              <li>✓ Your data, your account</li>
              <li>✓ Cloud backup</li>
              <li>○ One-time setup needed</li>
            </ul>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button onClick={exploreWithSampleData} disabled={seeding}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg px-3 py-2">
            <Sparkles size={16} />
            {seeding ? 'Loading sample data…' : 'Explore with sample data'}
          </button>
          <p className="text-xs text-slate-400 mt-1">
            Loads a demo household locally so you can see the dashboard in action. Clearable anytime in Data → Danger zone.
          </p>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          You can switch modes later. CSV/JSON export is available in both.
        </p>
      </div>
    </div>
  );
}
