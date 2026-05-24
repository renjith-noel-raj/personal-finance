import React, { useState } from 'react';
import { Landmark, Target, CalendarCheck } from 'lucide-react';
import { formatINR, payoffDateLabel } from './shared';

export default function GoalsDebtsSummary({ summary }) {
  const [priority, setPriority] = useState('debts'); // 'debts' | 'goals'
  if (!summary || !summary.hasAny) return null;

  const { debt, goal, surplus } = summary;
  const hasDebt = debt.total > 0;
  const hasGoal = goal.total > 0;
  const sim = priority === 'goals' ? summary.goalsFirst : summary.debtsFirst;

  const allDone = sim.combinedMonth === 0; // nothing left to pay or fund
  const milestone = (text, month) =>
    month === 0
      ? <>{text} <strong>done ✓</strong></>
      : <>{text} ~<strong>{payoffDateLabel(month, null) || '—'}</strong></>;
  const allDoneText = hasDebt && hasGoal
    ? "You're debt-free and fully funded 🎉"
    : hasDebt ? "You're debt-free 🎉" : 'All goals funded 🎉';

  let message = null;
  if (!allDone && surplus <= 0) message = 'Tag recurring income or build savings history to project a date.';
  else if (!allDone && !isFinite(sim.combinedMonth)) message = "On your current surplus this isn't reachable — increase income, cut fixed bills, or extend targets.";

  return (
    <div className="card p-4 border-l-4 border-l-brand-400">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-title flex items-center gap-2">
          Goals &amp; Debts <span className="text-[11px] font-normal text-slate-400">· outlook</span>
        </h3>
        {hasDebt && hasGoal && (
          <div role="group" aria-label="Payoff priority" className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
            <button onClick={() => setPriority('debts')} className={`px-2.5 py-1 rounded-md transition ${priority === 'debts' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Debts first</button>
            <button onClick={() => setPriority('goals')} className={`px-2.5 py-1 rounded-md transition ${priority === 'goals' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Goals first</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hasDebt && (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-600"><Landmark size={14} className="text-brand-600" /> Debts left</span>
              <span className="font-semibold text-slate-900">{formatINR(debt.remaining)}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(0, Math.min(100, debt.pct))}%` }} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{debt.pct.toFixed(0)}% cleared</div>
          </div>
        )}
        {hasGoal && (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-600"><Target size={14} className="text-brand-600" /> Goals left</span>
              <span className="font-semibold text-slate-900">{formatINR(goal.remaining)}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, goal.pct))}%` }} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{goal.pct.toFixed(0)}% funded</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 text-sm bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 text-brand-800">
        <CalendarCheck size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
        {message ? (
          <span className="text-slate-600">{message}</span>
        ) : allDone ? (
          <span>{allDoneText}</span>
        ) : (
          <span>
            {hasDebt && <>{milestone('Debt-free', sim.debtFreeMonth)}{hasGoal ? '  ·  ' : ''}</>}
            {hasGoal && milestone('Goals funded', sim.goalsFundedMonth)}
            {hasDebt && hasGoal && <>{'  ·  '}{milestone('everything done', sim.combinedMonth)}</>}
          </span>
        )}
      </div>
    </div>
  );
}
