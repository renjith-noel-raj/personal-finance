import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function SignIn() {
  const { resetSetup } = useApp();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full card p-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Sign in to continue</h1>
        <p className="text-sm text-slate-600 mb-6">Sign in with Google to access your data.</p>
        <button onClick={handleSignIn} disabled={loading} className="btn-primary w-full py-2.5">
          <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <div className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg text-left">{error}</div>}
        <button onClick={resetSetup} className="mt-4 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto">
          <ArrowLeft size={12} /> Use different setup
        </button>
      </div>
    </div>
  );
}
