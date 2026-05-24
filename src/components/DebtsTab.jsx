import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Landmark, TrendingDown, Wallet, Repeat, CalendarCheck, Percent } from 'lucide-react';
import {
  formatINR, todayStr, monthKey, debtRemaining, monthsToClear, projectedInterest,
  payoffDateLabel, paymentSplit, PAYOFF_ORDERS, simulateFocusedPayoff,
} from './shared';
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

const monthsUntil = (deadline) => {
  const d = new Date(deadline), now = new Date();
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
};

const ORDER_LABELS = { avalanche: 'highest APR', snowball: 'smallest balance', deadline: 'earliest deadline' };

export default function DebtsTab({
  debts, setDebts, pace = 0, avgMonthlySavings = 0, netSavings = 0,
  fixedIncome = 0, fixedExpenses = 0, expenses = [], setExpenses, expCats = [],
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [paid, setPaid] = useState('');
  const [apr, setApr] = useState('');
  const [emi, setEmi] = useState('');
  const [startDate, setStartDate] = useState(todayStr());
  const [deadline, setDeadline] = useState('');
  const [mode, setMode] = useState('focused');   // 'focused' | 'planned'
  const [order, setOrder] = useState('avalanche'); // avalanche | snowball | deadline
  const [payDebt, setPayDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [logExpense, setLogExpense] = useState(true);

  const planned = mode === 'planned';

  // ── aggregations ──
  const totalPrincipal = debts.reduce((s, d) => s + Number(d.principal || 0), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.paid || 0), 0);
  const totalRemaining = debts.reduce((s, d) => s + debtRemaining(d), 0);
  const overallPct = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;
  const totalEmi = debts.reduce((s, d) => s + (debtRemaining(d) > 0 ? Number(d.emi || 0) : 0), 0);
  const allCleared = debts.length > 0 && totalRemaining === 0;
  const usingFixed = fixedIncome > 0;
  const spare = Math.max(0, pace - totalEmi); // surplus beyond mandatory EMIs

  // priority queue (active debts first, then by chosen order)
  const cmp = PAYOFF_ORDERS[order] || PAYOFF_ORDERS.avalanche;
  const sortedDebts = [...debts].sort((a, b) => {
    const ar = debtRemaining(a) > 0, br = debtRemaining(b) > 0;
    if (ar !== br) return ar ? -1 : 1;
    return cmp(a, b);
  });

  // amortized monthly payment to clear by a deadline
  const reqMonthly = (d) => {
    const rem = debtRemaining(d);
    if (!d.deadline || rem <= 0) return 0;
    const m = Math.max(1, monthsUntil(d.deadline));
    const r = (Number(d.apr) || 0) / 12 / 100;
    if (r === 0) return rem / m;
    return (rem * r) / (1 - Math.pow(1 + r, -m));
  };
  const totalMonthlyNeed = debts.reduce((s, d) => s + reqMonthly(d), 0);

  // ── per-debt ETAs + planned totals ──
  const debtPlans = {};
  const debtEtas = {};
  let totalPlanned = 0;
  if (planned) {
    sortedDebts.forEach((d) => {
      const rem = debtRemaining(d);
      const plan = (d.monthlyPlan !== undefined && d.monthlyPlan !== null)
        ? Number(d.monthlyPlan)
        : (Number(d.emi) || reqMonthly(d));
      debtPlans[d.id] = plan;
      if (rem > 0) totalPlanned += plan;
      debtEtas[d.id] = rem > 0 ? payoffDateLabel(monthsToClear(rem, plan, d.apr), d.startDate) : null;
    });
  } else {
    sortedDebts.forEach((d) => {
      const rem = debtRemaining(d);
      const pay = (Number(d.emi) || 0) + spare; // "if you funnel all spare here"
      debtEtas[d.id] = rem > 0 ? payoffDateLabel(monthsToClear(rem, pay, d.apr), d.startDate) : null;
    });
  }
  const planLeftover = pace - totalPlanned;

  // ── overall debt-free date + interest saved ──
  let overallEta = null;
  let interestSaved = null;
  let cantCoverEmis = false;
  if (!allCleared && debts.length > 0) {
    if (planned) {
      const remDebts = sortedDebts.filter((d) => debtRemaining(d) > 0);
      const allSet = remDebts.length > 0 &&
        remDebts.every((d) => debtPlans[d.id] > 0 && isFinite(monthsToClear(debtRemaining(d), debtPlans[d.id], d.apr)));
      if (allSet) {
        const maxMonths = Math.max(...remDebts.map((d) => monthsToClear(debtRemaining(d), debtPlans[d.id], d.apr)));
        overallEta = payoffDateLabel(maxMonths, null);
      }
    } else {
      cantCoverEmis = pace - totalEmi < 0;
      const sim = simulateFocusedPayoff(debts, pace, cmp);
      // When the surplus can't even cover mandatory EMIs, the simulation still pays them,
      // so its date would contradict the over-committed warning — suppress it.
      overallEta = (!cantCoverEmis && sim.months > 0 && sim.months < 1200) ? payoffDateLabel(sim.months, null) : null;
      // Only compare interest when every active debt clears on its EMI alone — otherwise
      // the EMI-only baseline is understated and "interest saved" would mislead.
      const activeDebts = debts.filter((d) => debtRemaining(d) > 0);
      const emiOnlyFinite = activeDebts.every((d) => isFinite(projectedInterest(debtRemaining(d), Number(d.emi) || 0, d.apr)));
      const emiOnly = activeDebts.reduce((s, d) => s + projectedInterest(debtRemaining(d), Number(d.emi) || 0, d.apr), 0);
      if (!cantCoverEmis && emiOnlyFinite && isFinite(sim.totalInterest) && emiOnly > 0) {
        interestSaved = Math.max(0, Math.round(emiOnly - sim.totalInterest));
      }
    }
  }

  // ── handlers ──
  const resetForm = () => {
    setName(''); setPrincipal(''); setPaid(''); setApr(''); setEmi('');
    setStartDate(todayStr()); setDeadline(''); setEditingId(null); setShowForm(false);
  };
  const startAdd = () => {
    if (showForm && !editingId) { setShowForm(false); return; }
    resetForm(); setShowForm(true);
  };
  const startEdit = (d) => {
    setEditingId(d.id);
    setName(d.name);
    setPrincipal(String(d.principal ?? ''));
    setPaid(String(d.paid ?? ''));
    setApr(d.apr != null ? String(d.apr) : '');
    setEmi(d.emi != null ? String(d.emi) : '');
    setStartDate(d.startDate || todayStr());
    setDeadline(d.deadline || '');
    setShowForm(true);
  };
  const save = () => {
    if (!name.trim() || !principal) return;
    const rec = {
      name: name.trim(),
      principal: Number(principal),
      paid: Number(paid) || 0,
      apr: apr === '' ? undefined : Number(apr),
      emi: emi === '' ? undefined : Number(emi),
      startDate: startDate || todayStr(),
      deadline,
    };
    if (editingId) setDebts(debts.map((d) => (d.id === editingId ? { ...d, ...rec } : d)));
    else setDebts([...debts, { id: Date.now().toString(), ...rec }]);
    resetForm();
  };
  const remove = (id) => setDebts(debts.filter((d) => d.id !== id));
  const updatePlan = (id, value) =>
    setDebts(debts.map((d) => (d.id === id ? { ...d, monthlyPlan: value === '' ? undefined : Number(value) } : d)));
  const autoSplit = () => {
    let budget = pace;
    const plans = {};
    sortedDebts.forEach((d) => {
      if (debtRemaining(d) > 0) { const e = Math.min(Number(d.emi) || 0, budget); plans[d.id] = e; budget -= e; }
    });
    sortedDebts.forEach((d) => {
      if (debtRemaining(d) <= 0 || budget <= 0) return;
      const give = Math.min(debtRemaining(d), budget);
      plans[d.id] = (plans[d.id] || 0) + give;
      budget -= give;
    });
    setDebts(debts.map((d) => (d.id in plans ? { ...d, monthlyPlan: Math.round(plans[d.id]) } : d)));
  };

  const openPay = (d) => {
    setPayDebt(d);
    setLogExpense(true);
    // Pre-fill the EMI when set; otherwise leave blank so the user types the actual
    // amount paid (avoids accidentally logging the whole balance as one expense).
    setPayAmount(Number(d.emi) ? String(d.emi) : '');
  };
  const doPay = () => {
    if (!payDebt) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayDebt(null); return; }
    const rem = debtRemaining(payDebt);
    const month = monthKey(todayStr());
    // Interest accrues once per month: the first payment in a month bears it; any
    // further payment that month is a prepayment that reduces principal in full.
    const interestDue = payDebt.lastInterestMonth === month ? 0 : paymentSplit(rem, amt, payDebt.apr).interest;
    const applied = Math.max(0, Math.min(rem, amt - interestDue));
    setDebts(debts.map((d) => (d.id === payDebt.id
      ? { ...d, paid: Number(d.paid || 0) + applied, lastInterestMonth: month }
      : d)));
    if (logExpense && setExpenses) {
      // Land payments in the EMI category; if it was deleted, keep the 'emi' id (renders
      // under its own label) rather than silently polluting an unrelated category.
      const emiCat = expCats.find((c) => c.id === 'emi');
      const newId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setExpenses([...expenses, {
        id: newId,
        date: todayStr(),
        amount: amt,
        catId: emiCat ? emiCat.id : 'emi',
        description: `Payment: ${payDebt.name}`,
        necessity: 'Need',
        debtId: payDebt.id,
        recurring: false,
      }]);
    }
    setPayDebt(null);
  };

  // ── feasibility banner ──
  const basis = usingFixed
    ? `fixed income ${formatINR(fixedIncome)} − fixed bills ${formatINR(fixedExpenses)} = ${formatINR(pace)}/mo`
    : `your ~${formatINR(avgMonthlySavings)}/mo average savings`;
  let feasibility = null;
  if (debts.length > 0 && !allCleared) {
    if (pace <= 0) {
      feasibility = { tone: 'info', text: 'Tag your salary as recurring income (or build some history) so we can gauge how fast you can clear these.' };
    } else if (cantCoverEmis) {
      feasibility = { tone: 'warn', text: `Your surplus ${formatINR(pace)}/mo doesn't cover your mandatory EMIs of ${formatINR(totalEmi)}/mo — you're over-committed.` };
    } else if (totalMonthlyNeed > 0) {
      const diff = pace - totalMonthlyNeed;
      feasibility = diff >= 0
        ? { tone: 'good', text: `Based on ${basis}, you're on track — deadlines need ${formatINR(totalMonthlyNeed)}/mo, ${formatINR(diff)}/mo to spare. 🎯` }
        : { tone: 'warn', text: `Based on ${basis}, deadlines need ${formatINR(totalMonthlyNeed)}/mo but you have ${formatINR(pace)}/mo — ${formatINR(Math.abs(diff))}/mo short. Extend a target or trim spending.` };
    } else {
      feasibility = { tone: 'info', text: 'Add target dates to your debts to see whether your surplus can keep up.' };
    }
  }
  const feasClass = {
    good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const payRem = payDebt ? debtRemaining(payDebt) : 0;
  // Interest is only charged on the first payment of the month — a later payment
  // that same month goes entirely to principal.
  const payInterestCharged = payDebt ? payDebt.lastInterestMonth === monthKey(todayStr()) : false;
  const paySplit = payDebt
    ? (payInterestCharged
        ? { interest: 0, principal: Number(payAmount) || 0 }
        : paymentSplit(payRem, Number(payAmount), payDebt.apr))
    : { interest: 0, principal: 0 };

  return (
    <div className="space-y-4">
      {/* Portfolio summary */}
      {debts.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={overallPct} size={84} stroke={9} color={overallPct >= 100 ? '#16a34a' : '#0891b2'}>
              <span className="text-lg font-bold text-slate-900">{overallPct.toFixed(0)}%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">cleared</span>
            </ProgressRing>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid</div><div className="text-base font-bold text-slate-900">{formatINR(totalPaid)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total owed</div><div className="text-base font-bold text-slate-900">{formatINR(totalPrincipal)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Remaining</div><div className="text-base font-bold text-slate-900">{formatINR(totalRemaining)}</div></div>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Needed / mo</div><div className="text-base font-bold text-brand-700">{formatINR(totalMonthlyNeed)}</div></div>
            </div>
          </div>
          {(allCleared || overallEta) && (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-800 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
              <CalendarCheck size={16} className="text-brand-600 flex-shrink-0" />
              {allCleared ? (
                <span>All debts cleared 🎉</span>
              ) : (
                <span>
                  Debt-free by <strong>~{overallEta}</strong>{' '}
                  <span className="text-brand-700/70">({planned ? 'at your planned amounts' : `EMIs + spare to ${ORDER_LABELS[order]} first`})</span>
                  {interestSaved ? <> · saving <strong>{formatINR(interestSaved)}</strong> in interest</> : null}
                </span>
              )}
            </div>
          )}
          {feasibility && (
            <div className={`mt-3 text-sm px-3 py-2 rounded-lg border ${feasClass[feasibility.tone]}`}>{feasibility.text}</div>
          )}
        </div>
      )}

      {/* Debt list + add */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title flex items-center gap-2"><Landmark size={16} className="text-brand-600" /> Debts</h3>
          <button onClick={startAdd} className="btn-primary"><Plus size={14} /> Debt</button>
        </div>

        {debts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
              <button onClick={() => setMode('focused')} className={`px-3 py-1.5 rounded-md transition ${!planned ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Focused</button>
              <button onClick={() => setMode('planned')} className={`px-3 py-1.5 rounded-md transition ${planned ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Planned</button>
            </div>
            {!planned && (
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <span>Attack:</span>
                <select value={order} onChange={(e) => setOrder(e.target.value)} className="input w-auto px-2 py-1">
                  <option value="avalanche">Highest APR (avalanche)</option>
                  <option value="snowball">Smallest balance (snowball)</option>
                  <option value="deadline">Earliest deadline</option>
                </select>
              </label>
            )}
            <span className="text-xs text-slate-500">{planned ? 'Set a monthly amount per debt from your surplus.' : 'Pays every EMI, then funnels spare surplus to one debt.'}</span>
          </div>
        )}

        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 text-xs font-semibold text-slate-500">{editingId ? 'Edit debt' : 'New debt'}</div>
            <input type="text" placeholder="Debt name (e.g. Car loan)" value={name} onChange={(e) => setName(e.target.value)} className="input md:col-span-2" />
            <input type="number" placeholder="Total owed (₹)" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="input" />
            <input type="number" placeholder="Already paid (₹)" value={paid} onChange={(e) => setPaid(e.target.value)} className="input" />
            <input type="number" placeholder="Interest rate % p.a. (optional)" value={apr} onChange={(e) => setApr(e.target.value)} className="input" />
            <input type="number" placeholder="Mandatory EMI ₹/mo (optional)" value={emi} onChange={(e) => setEmi(e.target.value)} className="input" />
            <label className="text-xs text-slate-500 flex flex-col gap-1">Start date<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></label>
            <label className="text-xs text-slate-500 flex flex-col gap-1">Target clear-by (optional)<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" /></label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button onClick={resetForm} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary">{editingId ? 'Update Debt' : 'Add Debt'}</button>
            </div>
          </div>
        )}

        {planned && debts.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700">Planned {formatINR(totalPlanned)} / {formatINR(pace)} monthly surplus</span>
              <span className={planLeftover >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                {planLeftover >= 0 ? `${formatINR(planLeftover)} left` : `over by ${formatINR(Math.abs(planLeftover))}`}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full ${planLeftover < 0 ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${pace > 0 ? Math.min(100, (totalPlanned / pace) * 100) : 0}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Surplus = {usingFixed ? 'fixed income − fixed bills' : '6-month average savings'}</span>
              {pace > 0 && <button onClick={autoSplit} className="text-xs link">Auto-split (EMIs + extra by priority)</button>}
            </div>
            {planLeftover < 0 && <p className="text-[11px] text-rose-600 mt-1">Your planned payments exceed your monthly surplus.</p>}
          </div>
        )}

        <div className="space-y-3">
          {debts.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">No debts yet. Add one to start tracking your payoff.</div>
          ) : sortedDebts.map((d) => {
            const rem = debtRemaining(d);
            const pct = d.principal > 0 ? (Number(d.paid || 0) / d.principal) * 100 : 0;
            const done = rem <= 0;
            const monthsLeft = d.deadline ? monthsUntil(d.deadline) : null;
            const overdue = d.deadline && monthsLeft <= 0 && !done;
            const need = reqMonthly(d);
            const monthlyInterest = paymentSplit(rem, 0, d.apr).interest;
            const planAmt = planned ? debtPlans[d.id] : (Number(d.emi) || 0) + spare;
            const wontClear = !done && planAmt > 0 && planAmt <= monthlyInterest;

            let badge = null;
            if (done) badge = { label: 'Cleared', cls: 'bg-emerald-100 text-emerald-700' };
            else if (wontClear) badge = { label: "Won't clear", cls: 'bg-rose-100 text-rose-700' };
            else if (overdue) badge = { label: 'Overdue', cls: 'bg-rose-100 text-rose-700' };
            else if (d.deadline && pace > 0) {
              if (need <= pace) badge = { label: 'On track', cls: 'bg-emerald-100 text-emerald-700' };
              else if (need <= pace * 1.5) badge = { label: 'Tight', cls: 'bg-amber-100 text-amber-700' };
              else badge = { label: 'Ambitious', cls: 'bg-rose-100 text-rose-700' };
            }
            const eta = !done ? debtEtas[d.id] : null;

            return (
              <div key={d.id} className="border border-slate-200 rounded-xl p-3 flex gap-3">
                <ProgressRing value={pct} size={60} stroke={6} color={done ? '#16a34a' : '#0891b2'}>
                  <span className="text-xs font-bold text-slate-900">{pct.toFixed(0)}%</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        <span className="truncate">{d.name}</span>
                        {Number(d.apr) > 0 && <span className="chip bg-slate-100 text-slate-600 inline-flex items-center gap-0.5"><Percent size={10} />{d.apr}</span>}
                        {badge && <span className={`chip ${badge.cls}`}>{badge.label}</span>}
                      </div>
                      <div className="text-xs text-slate-500">{formatINR(d.paid)} paid of {formatINR(d.principal)} · {formatINR(rem)} left</div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button onClick={() => startEdit(d)} className="text-slate-400 hover:text-brand-600 p-1" aria-label="Edit debt"><Edit2 size={14} /></button>
                      <button onClick={() => remove(d.id)} className="text-slate-400 hover:text-rose-600 p-1" aria-label="Delete debt"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
                    {d.deadline && <span>Target: {d.deadline}</span>}
                    {Number(d.emi) > 0 && <span>EMI {formatINR(d.emi)}/mo</span>}
                    {need > 0 && !done && <span className="text-slate-700 font-medium">Need {formatINR(need)}/mo{monthsLeft > 0 ? ` · ${monthsLeft} mo left` : ''}</span>}
                    {eta && <span className="text-brand-700">≈ {eta}{!planned ? ' if focused' : ''}*</span>}
                    {planned && !done && (
                      <label className="flex items-center gap-1">
                        <span>Plan ₹/mo:</span>
                        <input type="number" value={(d.monthlyPlan !== undefined && d.monthlyPlan !== null) ? d.monthlyPlan : ''}
                          onChange={(e) => updatePlan(d.id, e.target.value)}
                          placeholder={String(Math.round((Number(d.emi) || need) || 0))} className="input w-20 px-2 py-1" />
                      </label>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                      {!done && <button onClick={() => openPay(d)} className="text-brand-700 font-semibold hover:text-brand-800">+ Make payment</button>}
                    </div>
                  </div>
                  {planned && !done && Number(d.emi) > 0 && debtPlans[d.id] > 0 && debtPlans[d.id] < Number(d.emi) && (
                    <p className="text-[11px] text-amber-700 mt-1">Plan is below the EMI of {formatINR(d.emi)} — that's an underpayment.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {debts.length > 0 && pace > 0 && (
          <p className="text-[11px] text-slate-400 mt-3">
            {planned
              ? '*Each debt\'s date uses your planned ₹/mo for it. Amounts draw from your monthly surplus (fixed income − fixed bills, or 6-month average).'
              : `*Each debt's date assumes its EMI plus your entire spare surplus goes to that one debt. The "debt-free by" date instead pays every EMI and funnels spare to ${ORDER_LABELS[order]} first.`}
          </p>
        )}
      </div>

      {/* Surplus summary */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <h3 className="font-semibold text-brand-900 mb-1 flex items-center gap-2"><Wallet size={16} /> Surplus for debt</h3>
            <div className={`text-2xl font-bold ${pace >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(pace)}/mo</div>
            <div className="text-[11px] text-brand-700/70">{usingFixed ? 'fixed income − fixed bills' : '6-month average savings'}</div>
          </div>
          <div>
            <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><TrendingDown size={15} /> Mandatory EMIs</h3>
            <div className="text-lg font-bold text-brand-900">{formatINR(totalEmi)}/mo</div>
          </div>
          <div>
            <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><Repeat size={15} /> Spare to accelerate</h3>
            <div className={`text-lg font-bold ${spare >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(spare)}/mo</div>
          </div>
          {netSavings !== 0 && (
            <div>
              <h3 className="font-semibold text-brand-900/80 mb-1 flex items-center gap-2"><Wallet size={15} /> This month saved</h3>
              <div className={`text-lg font-bold ${netSavings >= 0 ? 'text-brand-900' : 'text-rose-600'}`}>{formatINR(netSavings)}</div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!payDebt}
        title={payDebt ? `Make payment · ${payDebt.name}` : ''}
        confirmLabel="Record payment"
        onConfirm={doPay}
        onCancel={() => setPayDebt(null)}
      >
        {payDebt && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-slate-500">
              Outstanding: {formatINR(payRem)}
              {Number(payDebt.apr) > 0
                ? (payInterestCharged
                    ? ' · interest already covered this month — this goes fully to principal'
                    : ` · interest this month ${formatINR(paymentSplit(payRem, 0, payDebt.apr).interest)}`)
                : ''}
            </div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Amount (₹)</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input" />
            {Number(payAmount) > 0 && (
              <div className="text-[11px] text-slate-500">
                {paySplit.principal > 0 ? (
                  <>
                    Reduces balance by <strong>{formatINR(Math.min(payRem, paySplit.principal))}</strong>
                    {paySplit.interest > 0 ? <> · {formatINR(paySplit.interest)} covers interest</> : null}
                    {Number(payDebt.emi) > 0 && Number(payAmount) > Number(payDebt.emi)
                      ? <> · {formatINR(Number(payAmount) - Number(payDebt.emi))} extra</> : null}
                  </>
                ) : (
                  <span className="text-amber-700">This is less than the {formatINR(paySplit.interest)} interest due — the balance won't go down.</span>
                )}
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <input type="checkbox" checked={logExpense} onChange={(e) => setLogExpense(e.target.checked)} />
              Also log this as an expense
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
