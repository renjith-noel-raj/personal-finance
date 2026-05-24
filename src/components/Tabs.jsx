import React from 'react';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Database, Landmark } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'debts', label: 'Debts', icon: Landmark },
  { id: 'data', label: 'Data', icon: Database },
];

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <>
      {/* Tablet / desktop: top pill nav */}
      <div className="hidden md:flex gap-1 mb-6 card p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const on = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`btn btn-sm gap-2 ${on ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Mobile: fixed bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Primary"
      >
        {TABS.map(t => {
          const Icon = t.icon;
          const on = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              aria-label={t.label} aria-current={on ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold transition ${on ? 'text-brand-700' : 'text-slate-400'}`}>
              <span className={`px-4 py-1 rounded-lg transition ${on ? 'bg-brand-100' : ''}`}><Icon size={20} /></span>
              {t.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
