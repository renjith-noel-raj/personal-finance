import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle, Repeat } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { formatINR, NECESSITY_COLORS } from './shared';
import StatCard from './StatCard.jsx';
import FiftyBlock from './FiftyBlock.jsx';
import ChartCard from './ChartCard.jsx';
import NecessityGroupedView from './NecessityGroupedView.jsx';

export default function Overview({
  totalIncome, reinvested, availableIncome, totalExpense, netSavings, consumedPct,
  recurringTotal, expenseBreakdown, incomeBreakdown, trendData, insights, fiftyThirtyTwenty,
  netBySource, necessityGrouped, categoryByNecessity,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Income" value={formatINR(totalIncome)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Reinvested" value={formatINR(reinvested)} icon={Repeat} color="bg-blue-500" />
        <StatCard label="Available" value={formatINR(availableIncome)} icon={Wallet} color="bg-indigo-500" sub="Income − Reinvested" />
        <StatCard label="Expenses" value={formatINR(totalExpense)} icon={TrendingDown} color="bg-rose-500" sub={`Fixed: ${formatINR(recurringTotal)}`} />
        <StatCard label="Net Savings" value={formatINR(netSavings)} icon={PiggyBank} color={netSavings >= 0 ? "bg-emerald-500" : "bg-rose-500"} />
      </div>

      {insights.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><AlertCircle size={16} /> Insights</h3>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-lg ${ins.type === 'good' ? 'bg-emerald-50 text-emerald-800' : ins.type === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700'}`}>
                {ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Income Consumed by Expenses</h3>
          <span className="text-sm font-medium text-slate-600">{consumedPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${consumedPct > 100 ? 'bg-rose-500' : consumedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, consumedPct)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Spent: {formatINR(totalExpense)}</span>
          <span>Available: {formatINR(availableIncome)}</span>
        </div>
      </div>

      {fiftyThirtyTwenty && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">50 / 30 / 20 Rule</h3>
          <div className="grid grid-cols-3 gap-3">
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Net by Income Source</h3>
          <div className="space-y-2">
            {netBySource.map(s => (
              <div key={s.catId} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-slate-700 truncate">{s.name}</span>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-1">Categories by Necessity</h3>
          <p className="text-xs text-slate-500 mb-3">See hidden discretionary spending — e.g., Food split into Need vs Want</p>
          <ResponsiveContainer width="100%" height={Math.max(200, categoryByNecessity.length * 35)}>
            <BarChart data={categoryByNecessity} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => formatINR(v)} />
              <Legend />
              <Bar dataKey="Need" stackId="a" fill={NECESSITY_COLORS.Need} />
              <Bar dataKey="Want" stackId="a" fill={NECESSITY_COLORS.Want} />
              <Bar dataKey="Impulse" stackId="a" fill={NECESSITY_COLORS.Impulse} />
              <Bar dataKey="Untagged" stackId="a" fill="#cbd5e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">6-Month Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} />
            <Tooltip formatter={v => formatINR(v)} />
            <Legend />
            <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
