import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { signOutUser } from '../lib/firebase';
import { LogOut } from 'lucide-react';
import { currentMonth } from './shared';

export default function Header({ selectedMonth, setSelectedMonth, allMonths, user }) {
  const { storageMode, resetSetup } = useApp();

  const shift = (delta) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const monthOptions = useMemo(() => {
    const set = new Set(allMonths);
    set.add(selectedMonth);
    const [cy, cm] = currentMonth().split('-').map(Number);
    for (let i = -60; i <= 60; i++) {
      const d = new Date(cy, cm - 1 + i, 1);
      set.add(d.toISOString().slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [allMonths, selectedMonth]);

  const handleSignOut = async () => {
    if (storageMode === 'firebase') await signOutUser().catch(() => {});
    if (confirm('Switch to a different setup? (Your data stays in storage)')) {
      resetSetup();
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Finance Dashboard</h1>
        <p className="text-sm text-slate-500">
          {storageMode === 'firebase' && user ? `Signed in as ${user.email}` : 'Local mode'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
          <button onClick={() => shift(-1)} className="px-2 py-1 hover:bg-slate-100 rounded-md text-slate-700 font-bold">‹</button>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="bg-transparent px-2 py-1 text-sm font-medium focus:outline-none cursor-pointer min-w-[140px] text-center">
            {monthOptions.map(m => {
              const dd = new Date(m + '-01');
              return <option key={m} value={m}>{dd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
          <button onClick={() => shift(1)} className="px-2 py-1 hover:bg-slate-100 rounded-md text-slate-700 font-bold">›</button>
          {selectedMonth !== currentMonth() && (
            <button onClick={() => setSelectedMonth(currentMonth())} className="px-2 py-1 hover:bg-slate-100 rounded-md text-xs text-indigo-600 font-medium">Today</button>
          )}
        </div>
        <button onClick={handleSignOut} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100" title="Switch setup / Sign out">
          <LogOut size={14} className="text-slate-600" />
        </button>
      </div>
    </div>
  );
}
