import React, { useState } from 'react';
import { Plus, Trash2, Edit2, PiggyBank, Target, TrendingUp, Wallet, Repeat } from 'lucide-react';
import { formatINR } from './shared';
import Modal from './Modal.jsx';

function ProgressRing({ value, size = 64, stroke = 7, color = '#0891b2', track = '#e2e8f0', children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">{children}</div>
    </div>
  );
}

const monthsBetween = (deadline) => {
  const d = new Date(deadline), now = new Date();
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
};
const monthLabelFromNow = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function GoalsTab({ goals, setGoals, netSavings, avgMonthlySavings = 0, lifetimeSavings = 0, predictableSurplus = 0, fixedIncome = 0, fixedExpenses = 0 }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeMode, setContributeMode] = useState('add'); // 'add' | 'withdraw'
  const [contributeAmount, setContributeAmount] = useState('');
  const [allocGoalId, setAllocGoalId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');

  // ---- aggregations + savings pool ----
  const totalTarget = goals.reduce((s, g) => s + Number(g.target || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
  const totalRemaining = goals.reduce((s, g) => s + Math.max(0, Number(g.target || 0) - Number(g.saved || 0)), 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const free = lifetimeSavings - totalSaved; // unallocated savings pool
  // Prefer fixed (predictable) surplus when the user has tagged recurring income; else fall back to history.
  const usingFixed = fixedIncome > 0;
  const pace = usingFixed ? predictableSurplus : avgMonthlySavings;

  const datedGoals = goals.filter(g => g.deadline);
  const totalMonthlyNeed = datedGoals.reduce((s, g) => {
    const monthsLeft = Math.max(1, monthsBetween(g.deadline));
    return s + Math.max(0, (Number(g.target || 0) - Number(g.saved || 0)) / monthsLeft);
  }, 0);

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  // ---- handlers ----
  const resetForm = () => { setName(''); setTarget(''); setSaved(''); setDeadline(''); setEditingId(null); setShowForm(false); };

  const startAdd = () => {
    if (showForm && !editingId) { setShowForm(false); return; }
    setEditingId(null); setName(''); setTarget(''); setSaved(''); setDeadline(''); setShowForm(true);
  };
  const startEdit = (g) => {
    setEditingId(g.id);
    setName(g.name); setTarget(String(g.target ?? '')); setSaved(String(g.saved ?? '')); setDeadline(g.deadline || '');
    setShowForm(true);
  };
  const save = () => {
    if (!name.trim() || !target) return;
    if (editingId) {
      setGoals(goals.map(g => g.id === editingId ? { ...g, name, target: Number(target), saved: Number(saved) || 0, deadline } : g));
    } else {
      setGoals([...goals, { id: Date.now().toString(), name, target: Number(target), saved: Number(saved) || 0, deadline }]);
    }
    resetForm();
  };
  const updateSaved = (id, amount) => setGoals(goals.map(g => g.id === id ? { ...g, saved: Number(amount) } : g));
  const remove = (id) => setGoals(goals.filter(g => g.id !== id));

  const move = (id, amount, mode) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setGoals(goals.map(g => {
      if (g.id !== id) return g;
      const cur = Number(g.saved || 0);
      return { ...g, saved: mode === 'withdraw' ? Math.max(0, cur - amt) : cur + amt };
    }));
  };
  const openMove = (g, mode = 'add') => {
    const remaining = Math.max(0, Number(g.target || 0) - Number(g.saved || 0));
    const suggested = mode === 'withdraw'
      ? Number(g.saved || 0)
      : Math.max(0, Math.min(free > 0 ? free : 0, remaining));
    setContributeMode(mode);
    setContributeGoal(g);
    setContributeAmount(suggested ? String(Math.round(suggested)) : '');
  };
  const doAllocate = () => {
    const id = allocGoalId || goals[0]?.id;
    if (!id) return;
    move(id, allocAmount, 'add');
    setAllocAmount('');
  };

  // ---- feasibility ----
  const basis = usingFixed
    ? `fixed income ${formatINR(fixedIncome)} − fixed bills ${formatINR(fixedExpenses)} = ${formatINR(predictableSurplus)}/mo`
    : `your ~${formatINR(avgMonthlySavings)}/mo average savings`;
  let feasibility = null;
  if (goals.length > 0) {
    if (datedGoals.length === 0) {
      feasibility = { tone: 'info', text: 'Add deadlines to your goals to see whether your savings can keep up.' };
    } else if (pace <= 0) {
      feasibility = { tone: 'info', text: `Your deadlines need about ${formatINR(totalMonthlyNeed)}/mo. Tag your salary as recurring income (or build some history) so we can gauge your pace.` };
    } else {
      const diff = pace - totalMonthlyNeed;
      feasibility = diff >= 0
        ? { tone: 'good', text: `Based on ${basis}, you're on track — deadlines need ${formatINR(totalMonthlyNeed)}/mo, ${formatINR(diff)}/mo to spare. 🎯` }
        : { tone: 'warn', text: `Based on ${basis}, deadlines need ${formatINR(totalMonthlyNeed)}/mo but you have ${formatINR(pace)}/mo — ${formatINR(Math.abs(diff))}/mo short. Extend a deadline or trim spending.` };
    }
  }
  const feasClass = { good: 'bg-emerald-50 text-emerald-800 border-emerald-200', warn: 'bg-amber-50 text-amber-800 border-amber-200', info: 'bg-slate-50 text-slate-600 border-slate-200' };

  const modalRemaining = contributeGoal ? Math.max(0, Number(contributeGoal.target || 0) - Number(contributeGoal.saved || 0)) : 0;
  const overAllocating = contributeMode === 'add' && Number(contributeAmount) > free;

  return (
    <div className="space-y-4">
      {/* Portfolio summary */}
      {goals.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={overallPct} size={84} stroke={9} color={overallPct >= 100 ? '#16a34a' : '#0891b2'}>
              <span className="text-lg font-bold text-slate-900">{overallPct.toFixed(0)}%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">overall</span>
            </ProgressRing>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Allocated</div><div className="text-base font-bold text-slate-900">{formatINR(totalSaved)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Target</div><div className="text-base font-bold text-slate-900">{formatINR(totalTarget)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Remaining</div><div className="text-base font-bold text-slate-900">{formatINR(totalRemaining)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Needed / mo</div><div className="text-base font-bold text-brand-700">{formatINR(totalMonthlyNeed)}</div></div>
            </div>
          </div>
          {feasibility && (
            <div className={`mt-3 text-sm px-3 py-2 rounded-lg border ${feasClass[feasibility.tone]}`}>{feasibility.text}</div>
          )}
        </div>
      )}

      {/* Goals list + add */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title flex items-center gap-2"><Target size={16} className="text-brand-600" /> Savings Goals</h3>
          <button onClick={startAdd} className="btn-primary">
            <Plus size={14} /> Goal
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 text-xs font-semibold text-slate-500">{editingId ? 'Edit goal' : 'New goal'}</div>
            <input type="text" placeholder="Goal name" value={name} onChange={e => setName(e.target.value)} className="input md:col-span-2" />
            <input type="number" placeholder="Target (₹)" value={target} onChange={e => setTarget(e.target.value)} className="input" />
            <input type="number" placeholder="Already saved (₹)" value={saved} onChange={e => setSaved(e.target.value)} className="input" />
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input md:col-span-2" />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={resetForm} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary">{editingId ? 'Update Goal' : 'Add Goal'}</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">No goals yet. Add one to start tracking.</div>
          ) : sortedGoals.map(g => {
            const remaining = Math.max(0, Number(g.target || 0) - Number(g.saved || 0));
            const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
            const done = pct >= 100;
            const monthsLeft = g.deadline ? monthsBetween(g.deadline) : null;
            const overdue = g.deadline && monthsLeft <= 0 && !done;
            const requiredMonthly = g.deadline ? remaining / Math.max(1, monthsLeft) : null;

            let badge = null;
            if (done) badge = { label: 'Complete', cls: 'bg-emerald-100 text-emerald-700' };
            else if (overdue) badge = { label: 'Overdue', cls: 'bg-rose-100 text-rose-700' };
            else if (g.deadline && pace > 0) {
              if (requiredMonthly <= pace) badge = { label: 'Achievable', cls: 'bg-emerald-100 text-emerald-700' };
              else if (requiredMonthly <= pace * 1.5) badge = { label: 'Tight', cls: 'bg-amber-100 text-amber-700' };
              else badge = { label: 'Ambitious', cls: 'bg-rose-100 text-rose-700' };
            }
            const soloFinish = (!done && pace > 0 && remaining > 0)
              ? monthLabelFromNow(remaining / pace) : null;

            return (
              <div key={g.id} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                <ProgressRing value={pct} size={60} stroke={6} color={done ? '#16a34a' : '#0891b2'}>
                  <span className="text-xs font-bold text-slate-900">{pct.toFixed(0)}%</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        <span className="truncate">{g.name}</span>
                        {badge && <span className={`chip ${badge.cls}`}>{badge.label}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{formatINR(g.saved)} of {formatINR(g.target)} · {formatINR(remaining)} to go</div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button onClick={() => startEdit(g)} className="text-slate-400 hover:text-brand-600 p-1" aria-label="Edit goal"><Edit2 size={14} /></button>
                      <button onClick={() => remove(g.id)} className="text-slate-400 hover:text-rose-600 p-1" aria-label="Delete goal"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
                    {g.deadline && <span>Deadline: {g.deadline}</span>}
                    {requiredMonthly !== null && !done && <span className="text-slate-700 font-medium">Need {formatINR(requiredMonthly)}/mo{monthsLeft > 0 ? ` · ${monthsLeft} mo left` : ''}</span>}
                    {soloFinish && <span className="text-brand-700">≈ {soloFinish} at your pace*</span>}
                    <div className="flex items-center gap-3 ml-auto">
                      {!done && <button onClick={() => openMove(g, 'add')} className="text-brand-700 font-semibold hover:text-brand-800">+ Contribute</button>}
                      {Number(g.saved || 0) > 0 && <button onClick={() => openMove(g, 'withdraw')} className="text-slate-500 font-medium hover:text-slate-700">Withdraw</button>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {goals.length > 0 && pace > 0 && (
          <p className="text-[11px] text-slate-400 mt-3">*Projected finish assumes your whole monthly surplus ({usingFixed ? 'fixed income − fixed bills' : '6-month average'}) goes to that goal — the app tracks total saved, not per-goal contributions.</p>
        )}
      </div>

      {/* Savings pool + allocate */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <h3 className="font-semibold text-brand-900 mb-1 flex items-center gap-2"><Wallet size={16} /> Unallocated savings</h3>
            <div className={`text-2xl font-bold ${free >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(free)}</div>
            <div className="text-[11px] text-brand-700/70">{formatINR(lifetimeSavings)} saved − {formatINR(totalSaved)} allocated</div>
          </div>
          <div>
            <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><PiggyBank size={15} /> This month</h3>
            <div className={`text-lg font-bold ${netSavings >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(netSavings)}</div>
          </div>
          <div>
            <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><TrendingUp size={15} /> Avg / month</h3>
            <div className={`text-lg font-bold ${avgMonthlySavings >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(avgMonthlySavings)}</div>
          </div>
          {fixedIncome > 0 && (
            <div>
              <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><Repeat size={15} /> Predictable / mo</h3>
              <div className={`text-lg font-bold ${predictableSurplus >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(predictableSurplus)}</div>
              <div className="text-[11px] text-brand-700/70">fixed income − fixed bills</div>
            </div>
          )}
        </div>
        {goals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-200">
            <span className="text-sm font-medium text-brand-900">Allocate to goal:</span>
            <select value={allocGoalId || goals[0]?.id || ''} onChange={e => setAllocGoalId(e.target.value)} className="input w-auto px-2 py-2 bg-white">
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input type="number" value={allocAmount} onChange={e => setAllocAmount(e.target.value)}
              placeholder={free > 0 ? `₹ ${Math.round(free)}` : '₹ amount'} className="input w-28 px-2 py-2 bg-white" />
            {free > 0 && <button onClick={() => setAllocAmount(String(Math.round(free)))} className="text-xs link">use ₹{Math.round(free)}</button>}
            <button onClick={doAllocate} className="btn-primary">Add</button>
          </div>
        )}
      </div>

      <Modal
        open={!!contributeGoal}
        title={contributeGoal ? `${contributeMode === 'withdraw' ? 'Withdraw from' : 'Contribute to'} ${contributeGoal.name}` : ''}
        confirmLabel={contributeMode === 'withdraw' ? 'Withdraw' : 'Add to goal'}
        danger={contributeMode === 'withdraw'}
        onConfirm={() => { move(contributeGoal.id, contributeAmount, contributeMode); setContributeGoal(null); }}
        onCancel={() => setContributeGoal(null)}
      >
        {contributeGoal && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-2">
              {contributeMode === 'withdraw'
                ? `Allocated to this goal: ${formatINR(contributeGoal.saved)} · returns to your unallocated savings`
                : `Available to allocate: ${formatINR(free)} · ${formatINR(modalRemaining)} left on this goal`}
            </div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Amount (₹)</label>
            <input type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} className="input" />
            {overAllocating && (
              <p className="text-[11px] text-amber-700 mt-1">This is more than your unallocated savings — your pool will go negative.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
