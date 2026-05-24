import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle, Repeat } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { formatINR, NECESSITY_COLORS, TREND_COLORS, CHART_GRID, CHART_AXIS } from './shared';
import StatCard from './StatCard.jsx';
import FiftyBlock from './FiftyBlock.jsx';
import ChartCard from './ChartCard.jsx';
import NecessityGroupedView from './NecessityGroupedView.jsx';
import GoalsDebtsSummary from './GoalsDebtsSummary.jsx';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.12)',
  fontSize: 12,
};

export default function Overview({
  totalIncome, reinvested, availableIncome, totalExpense, netSavings, consumedPct,
  recurringTotal, expenseBreakdown, incomeBreakdown, trendData, insights, fiftyThirtyTwenty,
  netBySource, necessityGrouped, categoryByNecessity, goalsDebts,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Income" value={formatINR(totalIncome)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Reinvested" value={formatINR(reinvested)} icon={Repeat} color="bg-indigo-500" />
        <StatCard label="Available" value={formatINR(availableIncome)} icon={Wallet} color="bg-brand-500" sub="Income − Reinvested" />
        <StatCard label="Expenses" value={formatINR(totalExpense)} icon={TrendingDown} color="bg-rose-500" sub={`Fixed: ${formatINR(recurringTotal)}`} />
        <StatCard label="Net Savings" value={formatINR(netSavings)} icon={PiggyBank} hero tone={netSavings >= 0 ? 'brand' : 'rose'} />
      </div>

      {insights.length > 0 && (
        <div className="card p-4">
          <h3 className="panel-title mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-brand-600" /> Insights</h3>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-lg ${ins.type === 'good' ? 'bg-emerald-50 text-emerald-800' : ins.type === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700'}`}>
                {ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <GoalsDebtsSummary summary={goalsDebts} />

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title">Income Consumed by Expenses</h3>
          <span className="text-sm font-semibold text-slate-700">{consumedPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${consumedPct > 100 ? 'bg-rose-500' : consumedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, consumedPct)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Spent: {formatINR(totalExpense)}</span>
          <span>Available: {formatINR(availableIncome)}</span>
        </div>
      </div>

      {fiftyThirtyTwenty && (
        <div className="card p-4">
          <h3 className="panel-title mb-3">50 / 30 / 20 Rule</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <FiftyBlock label="Needs" target={50} actual={fiftyThirtyTwenty.needsPct} />
            <FiftyBlock label="Wants" target={30} actual={fiftyThirtyTwenty.wantsPct} />
            <FiftyBlock label="Savings" target={20} actual={fiftyThirtyTwenty.savingsPct} />
          </div>
          <div className="text-xs text-slate-500 mt-3 space-y-1">
            <div>Needs: {formatINR(fiftyThirtyTwenty.needsAmt)} · Wants+Impulse: {formatINR(fiftyThirtyTwenty.wantsAmt)} · Savings: {formatINR(fiftyThirtyTwenty.savingsAmt)}</div>
            {fiftyThirtyTwenty.untaggedAmt > 0 && (
              <div className="text-amber-700">⚠ {formatINR(fiftyThirtyTwenty.untaggedAmt)} of expenses are untagged.</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Expense Breakdown" data={expenseBreakdown} empty="No expenses yet for this month." />
        <ChartCard title="Income Breakdown" data={incomeBreakdown} empty="No income yet for this month." />
      </div>

      {netBySource.some(s => s.loss > 0) && (
        <div className="card p-4">
          <h3 className="panel-title mb-3">Net by Income Source</h3>
          <div className="space-y-3">
            {netBySource.map(s => (
              <div key={s.catId} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="flex items-center gap-2 sm:w-32 sm:flex-shrink-0 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-slate-700 truncate">{s.name}</span>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs min-w-0">
                  <div className="text-emerald-700">+{formatINR(s.profit)}</div>
                  <div className="text-rose-700">−{formatINR(s.loss)}</div>
                  <div className={`font-semibold ${s.net >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>Net: {formatINR(s.net)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {necessityGrouped.length > 0 && <NecessityGroupedView groups={necessityGrouped} total={totalExpense} />}

      {categoryByNecessity.length > 0 && categoryByNecessity.some(c => c.Need + c.Want + c.Impulse > 0) && (
        <div className="card p-4">
          <h3 className="panel-title mb-1">Categories by Necessity</h3>
          <p className="text-xs text-slate-500 mb-3">See hidden discretionary spending — e.g., Food split into Need vs Want</p>
          <ResponsiveContainer width="100%" height={Math.max(200, categoryByNecessity.length * 35)}>
            <BarChart data={categoryByNecessity} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis type="number" tick={{ fontSize: 11, fill: CHART_AXIS }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: CHART_AXIS }} width={90} />
              <Tooltip formatter={v => formatINR(v)} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Need" stackId="a" fill={NECESSITY_COLORS.Need} radius={[0,0,0,0]} />
              <Bar dataKey="Want" stackId="a" fill={NECESSITY_COLORS.Want} />
              <Bar dataKey="Impulse" stackId="a" fill={NECESSITY_COLORS.Impulse} />
              <Bar dataKey="Untagged" stackId="a" fill="#cbd5e1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-4">
        <h3 className="panel-title mb-3">6-Month Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: CHART_AXIS }} />
            <YAxis tick={{ fontSize: 12, fill: CHART_AXIS }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
            <Tooltip formatter={v => formatINR(v)} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Income" stroke={TREND_COLORS.Income} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Expense" stroke={TREND_COLORS.Expense} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Savings" stroke={TREND_COLORS.Savings} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
