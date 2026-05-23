import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, ExternalLink, AlertTriangle, Copy, Check } from 'lucide-react';

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

export default function FirebaseSetup() {
  const { setFirebaseConfigAndInit, chooseStorageMode } = useApp();
  const [configText, setConfigText] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyRules = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const submit = () => {
    setError(null);
    try {
      let text = configText.trim();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No config object found. Paste the firebaseConfig from Firebase Console.');
      let config;
      try {
        config = JSON.parse(match[0]);
      } catch {
        const jsonified = match[0]
          .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        config = JSON.parse(jsonified);
      }
      const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
      for (const f of required) {
        if (!config[f]) throw new Error(`Missing field: ${f}`);
      }
      setFirebaseConfigAndInit(config);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => chooseStorageMode(null)}
          className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Connect your Firebase</h1>
          <p className="text-sm text-slate-600 mb-4">Set up your free Firebase project (~10 min), then paste the configuration below. Your data lives in your project — no one else can read it.</p>

          <ol className="text-sm text-slate-700 space-y-2 mb-4 list-decimal list-inside">
            <li>Open the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-1">Firebase Console <ExternalLink size={12} /></a> → <strong>Add project</strong> (you can disable Analytics).</li>
            <li>Build → <strong>Firestore Database</strong> → <strong>Create database</strong> → <strong>Production mode</strong> → pick a region.</li>
            <li><strong className="text-amber-700">Publish the security rules</strong> — Firestore → <strong>Rules</strong> tab → paste the rules below → <strong>Publish</strong>.</li>
            <li>Build → <strong>Authentication</strong> → Sign-in method → enable <strong>Google</strong>.</li>
            <li>Project settings (gear) → Your apps → web icon <code className="text-xs bg-slate-100 px-1 rounded">&lt;/&gt;</code> → register an app.</li>
            <li>Copy the <code className="text-xs bg-slate-100 px-1 rounded">firebaseConfig</code> object and paste it below.</li>
          </ol>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Step 3 is the one people skip.</strong> Production mode blocks all access until you publish these rules. Without them the app connects but <strong>your data silently won't save.</strong>
              </p>
            </div>
            <div className="relative">
              <pre className="text-[11px] leading-snug bg-white border border-amber-200 rounded-md p-2 overflow-x-auto text-slate-700">{FIRESTORE_RULES}</pre>
              <button onClick={copyRules}
                className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1 text-[11px] bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600">
                {copied ? <><Check size={11} className="text-emerald-600" /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-amber-700 mt-2">Paste these into the Firestore <strong>Rules</strong> tab and click <strong>Publish</strong>.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Paste your firebaseConfig</label>
          <textarea
            value={configText}
            onChange={e => setConfigText(e.target.value)}
            placeholder={'{\n  "apiKey": "AIza...",\n  "authDomain": "myproject.firebaseapp.com",\n  "projectId": "myproject",\n  "appId": "1:1234:web:abc"\n}'}
            className="w-full h-44 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
          />
          {error && <div className="mt-2 text-sm text-rose-600 bg-rose-50 p-2 rounded">{error}</div>}
          <button onClick={submit}
            className="mt-3 w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800">
            Connect Firebase
          </button>
          <p className="text-xs text-slate-400 mt-3">Your config is stored locally on this device. The apiKey is safe to expose — your data is protected by the rules above.</p>
          <p className="text-xs text-slate-500 mt-2">Connected but nothing saving afterward? You almost certainly skipped the <strong>Rules</strong> step — see SETUP.md for the full walkthrough &amp; troubleshooting.</p>
        </div>
      </div>
    </div>
  );
}
