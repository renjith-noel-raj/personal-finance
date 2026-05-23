import React, { useState } from 'react';
import { Plus, Trash2, PiggyBank, Target } from 'lucide-react';
import { formatINR } from './shared';

export default function GoalsTab({ goals, setGoals, netSavings }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [deadline, setDeadline] = useState('');

  const add = () => {
    if (!name.trim() || !target) return;
    setGoals([...goals, { id: Date.now().toString(), name, target: Number(target), saved: Number(saved) || 0, deadline }]);
    setName(''); setTarget(''); setSaved(''); setDeadline(''); setShowForm(false);
  };

  const updateSaved = (id, amount) => setGoals(goals.map(g => g.id === id ? { ...g, saved: Number(amount) } : g));
  const remove = (id) => setGoals(goals.filter(g => g.id !== id));

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title flex items-center gap-2"><Target size={16} className="text-brand-600" /> Savings Goals</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={14} /> Goal
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Goal name" value={name} onChange={e => setName(e.target.value)} className="input md:col-span-2" />
            <input type="number" placeholder="Target (₹)" value={target} onChange={e => setTarget(e.target.value)} className="input" />
            <input type="number" placeholder="Already saved (₹)" value={saved} onChange={e => setSaved(e.target.value)} className="input" />
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input md:col-span-2" />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button onClick={add} className="btn-primary">Add Goal</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">No goals yet.</div>
          ) : goals.map(g => {
            const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
            let monthsLeft = null, monthlyNeed = null;
            if (g.deadline) {
              const d = new Date(g.deadline), now = new Date();
              monthsLeft = Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
              monthlyNeed = Math.max(0, (g.target - g.saved) / monthsLeft);
            }
            return (
              <div key={g.id} className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{g.name}</div>
                    <div className="text-xs text-slate-500">{formatINR(g.saved)} of {formatINR(g.target)} ({pct.toFixed(0)}%)</div>
                  </div>
                  <button onClick={() => remove(g.id)} className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {g.deadline && <span>Deadline: {g.deadline}</span>}
                  {monthlyNeed !== null && <span>Need {formatINR(monthlyNeed)}/mo for {monthsLeft} mo</span>}
                  <div className="flex items-center gap-1 ml-auto">
                    <span>Update saved:</span>
                    <input type="number" value={g.saved} onChange={e => updateSaved(g.id, e.target.value)} className="input w-24 px-2 py-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
        <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2"><PiggyBank size={16} /> This Month's Savings</h3>
        <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(netSavings)}</div>
      </div>
    </div>
  );
}
