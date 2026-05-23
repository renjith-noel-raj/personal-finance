import React from 'react';

export default function StatCard({ label, value, icon: Icon, color, sub, hero = false, tone = 'brand' }) {
  if (hero) {
    const grad = tone === 'rose'
      ? 'from-rose-600 to-rose-700'
      : 'from-brand-600 to-brand-700';
    return (
      <div className={`rounded-2xl p-4 bg-gradient-to-br ${grad} text-white shadow-hero`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/85">{label}</span>
          <div className="p-1.5 rounded-lg bg-white/20"><Icon size={14} className="text-white" /></div>
        </div>
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-white/80 mt-1">{sub}</div>}
      </div>
    );
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <div className={`p-1.5 rounded-lg ${color}`}><Icon size={14} className="text-white" /></div>
      </div>
      <div className="text-xl md:text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
