import React from 'react';

export default function FiftyBlock({ label, target, actual }) {
  const onTrack = label === 'Savings' ? actual >= target : actual <= target;
  const display = actual === 0 ? '0' : actual < 1 ? actual.toFixed(2) : actual < 10 ? actual.toFixed(1) : actual.toFixed(0);
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{display}%</div>
      <div className="text-xs text-slate-400">target {target}%</div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${onTrack ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, actual)}%` }} />
      </div>
    </div>
  );
}
