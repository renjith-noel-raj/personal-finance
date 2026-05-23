import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { signOutUser } from '../lib/firebase';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { currentMonth } from './shared';
import Modal from './Modal.jsx';

export default function Header({ selectedMonth, setSelectedMonth, allMonths, user }) {
  const { storageMode, resetSetup } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const doSwitch = async () => {
    if (storageMode === 'firebase') await signOutUser().catch(() => {});
    setConfirmOpen(false);
    resetSetup();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Finance Dashboard</h1>
        <p className="text-sm text-slate-500 truncate">
          {storageMode === 'firebase' && user ? `Signed in as ${user.email}` : 'Local mode'}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1 shadow-card">
          <button onClick={() => shift(-1)} className="icon-btn" aria-label="Previous month"><ChevronLeft size={16} /></button>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            aria-label="Select month"
            className="bg-transparent px-1.5 py-1 text-sm font-medium text-slate-700 focus:outline-none cursor-pointer text-center max-w-[150px]">
            {monthOptions.map(m => {
              const dd = new Date(m + '-01');
              return <option key={m} value={m}>{dd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
          <button onClick={() => shift(1)} className="icon-btn" aria-label="Next month"><ChevronRight size={16} /></button>
          {selectedMonth !== currentMonth() && (
            <button onClick={() => setSelectedMonth(currentMonth())}
              className="px-2 py-1 rounded-md text-xs text-brand-700 font-semibold hover:bg-brand-50 whitespace-nowrap">Today</button>
          )}
        </div>
        <button onClick={() => setConfirmOpen(true)}
          className="icon-btn border border-slate-200 bg-white shadow-card"
          title="Switch setup / Sign out" aria-label="Switch setup or sign out">
          <LogOut size={16} />
        </button>
      </div>

      <Modal
        open={confirmOpen}
        title="Switch setup?"
        message="This returns to storage selection (and signs you out of Firebase). Your data stays saved — you can reconnect anytime."
        confirmLabel="Switch setup"
        cancelLabel="Cancel"
        onConfirm={doSwitch}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
