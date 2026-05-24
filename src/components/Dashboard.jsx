import React, { useState, useMemo } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useApp } from '../context/AppContext.jsx';
import { formatINR, monthKey, currentMonth, NECESSITY_COLORS } from './shared';
import Header from './Header.jsx';
import Tabs from './Tabs.jsx';
import Overview from './Overview.jsx';
import ExpensesTab from './ExpensesTab.jsx';
import IncomeTab from './IncomeTab.jsx';
import GoalsTab from './GoalsTab.jsx';
import DataTab from './DataTab.jsx';
import { DashboardSkeleton } from './Skeleton.jsx';
import HelpPage from './HelpPage.jsx';

export default function Dashboard() {
  const data = useFinanceData();
  const { user } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [activeTab, setActiveTab] = useState('overview');

  if (data.loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-red-600 font-medium">Couldn't load your data.</div>
        <div className="text-slate-500 text-sm max-w-md">
          To protect your existing data, nothing was saved over it. Check your connection / Firestore
          rules and retry — your data has not been changed.
        </div>
        <div className="text-xs text-slate-400 break-all max-w-md">
          {data.loadError?.code || data.loadError?.message || String(data.loadError)}
        </div>
        <button onClick={data.reload} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!data.loaded) {
    return <DashboardSkeleton />;
  }

  return <DashboardInner data={data} user={user} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function DashboardInner({ data, user, selectedMonth, setSelectedMonth, activeTab, setActiveTab }) {
  const {
    expenses, setExpenses, incomes, setIncomes,
    expCats, setExpCats, incCats, setIncCats,
    expCatActive, setExpCatActive, incCatActive, setIncCatActive,
    budgets, setBudgets, goals, setGoals,
  } = data;

  const [showHelp, setShowHelp] = useState(false);
  const isExpCatActive = (id) => expCatActive[id] !== false;
  const isIncCatActive = (id) => incCatActive[id] !== false;

  const monthExpenses = useMemo(() => expenses.filter(e => monthKey(e.date) === selectedMonth), [expenses, selectedMonth]);
  const monthIncomes = useMemo(() => incomes.filter(i => monthKey(i.date) === selectedMonth), [incomes, selectedMonth]);
  const activeExpenses = useMemo(() => monthExpenses.filter(e => isExpCatActive(e.catId)), [monthExpenses, expCatActive]);
  const activeIncomes = useMemo(() => monthIncomes.filter(i => isIncCatActive(i.catId)), [monthIncomes, incCatActive]);

  const totalIncome = activeIncomes.reduce((s, i) => s + (i.isLoss ? -Number(i.amount) : Number(i.amount)), 0);
  const reinvested = activeIncomes.filter(i => i.reinvest).reduce((s, i) => s + (i.isLoss ? -Number(i.amount) : Number(i.amount)), 0);
  const availableIncome = totalIncome - reinvested;
  const totalExpense = activeExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const netSavings = availableIncome - totalExpense;
  const consumedPct = availableIncome > 0 ? Math.min(100, (totalExpense / availableIncome) * 100) : 0;

  const allMonths = useMemo(() => {
    const s = new Set([currentMonth()]);
    expenses.forEach(e => s.add(monthKey(e.date)));
    incomes.forEach(i => s.add(monthKey(i.date)));
    return Array.from(s).sort().reverse();
  }, [expenses, incomes]);

  const expenseBreakdown = useMemo(() => {
    const m = {};
    activeExpenses.forEach(e => { m[e.catId] = (m[e.catId] || 0) + Number(e.amount); });
    return Object.entries(m).map(([catId, value]) => {
      const cat = expCats.find(c => c.id === catId) || { name: catId, color: '#64748b' };
      return { name: cat.name, value, color: cat.color, catId };
    }).sort((a, b) => b.value - a.value);
  }, [activeExpenses, expCats]);

  const incomeBreakdown = useMemo(() => {
    const m = {};
    activeIncomes.forEach(i => {
      const v = i.isLoss ? -Number(i.amount) : Number(i.amount);
      m[i.catId] = (m[i.catId] || 0) + v;
    });
    return Object.entries(m).map(([catId, value]) => {
      const cat = incCats.find(c => c.id === catId) || { name: catId, color: '#64748b' };
      return { name: cat.name, value, color: cat.color, catId };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [activeIncomes, incCats]);

  const necessityGrouped = useMemo(() => {
    const groups = { Need: { total: 0, cats: {} }, Want: { total: 0, cats: {} }, Impulse: { total: 0, cats: {} } };
    activeExpenses.forEach(e => {
      const tag = e.necessity || 'Untagged';
      if (!groups[tag]) groups[tag] = { total: 0, cats: {} };
      groups[tag].total += Number(e.amount);
      const catName = (expCats.find(c => c.id === e.catId)?.name) || 'Other';
      if (!groups[tag].cats[catName]) groups[tag].cats[catName] = { value: 0, entries: [] };
      groups[tag].cats[catName].value += Number(e.amount);
      groups[tag].cats[catName].entries.push(e);
    });
    return Object.entries(groups).filter(([_, g]) => g.total > 0).map(([tag, g]) => ({
      tag, total: g.total, color: NECESSITY_COLORS[tag] || '#64748b',
      cats: Object.entries(g.cats).map(([name, d]) => ({ name, value: d.value, entries: d.entries.sort((a,b) => b.date.localeCompare(a.date)) })).sort((a,b) => b.value - a.value),
    }));
  }, [activeExpenses, expCats]);

  const categoryByNecessity = useMemo(() => {
    const m = {};
    activeExpenses.forEach(e => {
      const catName = (expCats.find(c => c.id === e.catId)?.name) || 'Other';
      if (!m[catName]) m[catName] = { name: catName, Need: 0, Want: 0, Impulse: 0, Untagged: 0, total: 0 };
      const tag = e.necessity || 'Untagged';
      m[catName][tag] = (m[catName][tag] || 0) + Number(e.amount);
      m[catName].total += Number(e.amount);
    });
    return Object.values(m).sort((a,b) => b.total - a.total);
  }, [activeExpenses, expCats]);

  const trendData = useMemo(() => {
    const months = [];
    const now = new Date(selectedMonth + '-01');
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = d.toISOString().slice(0,7);
      const monthExp = expenses.filter(e => monthKey(e.date) === mk && isExpCatActive(e.catId)).reduce((s,e)=>s+Number(e.amount),0);
      const monthInc = incomes.filter(i => monthKey(i.date) === mk && isIncCatActive(i.catId)).reduce((s,i)=>s+(i.isLoss?-Number(i.amount):Number(i.amount)),0);
      const monthReinv = incomes.filter(i => monthKey(i.date) === mk && isIncCatActive(i.catId) && i.reinvest).reduce((s,i)=>s+(i.isLoss?-Number(i.amount):Number(i.amount)),0);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        Income: monthInc - monthReinv,
        Expense: monthExp,
        Savings: (monthInc - monthReinv) - monthExp,
      });
    }
    return months;
  }, [expenses, incomes, expCatActive, incCatActive, selectedMonth]);

  const avgMonthlySavings = useMemo(
    () => trendData.length ? trendData.reduce((s, m) => s + m.Savings, 0) / trendData.length : 0,
    [trendData]
  );

  // All-time savings pool = (all available income) − (all expenses), across every month.
  const lifetimeSavings = useMemo(() => {
    const inc = incomes.filter(i => isIncCatActive(i.catId));
    const signed = (i) => (i.isLoss ? -Number(i.amount) : Number(i.amount));
    const available = inc.reduce((s, i) => s + signed(i), 0) - inc.filter(i => i.reinvest).reduce((s, i) => s + signed(i), 0);
    const exp = expenses.filter(e => isExpCatActive(e.catId)).reduce((s, e) => s + Number(e.amount), 0);
    return available - exp;
  }, [incomes, expenses, incCatActive, expCatActive]);

  const budgetProgress = useMemo(() => {
    return Object.entries(budgets).filter(([_, v]) => v > 0).map(([catId, limit]) => {
      const spent = activeExpenses.filter(e => e.catId === catId).reduce((s,e)=>s+Number(e.amount),0);
      const cat = expCats.find(c => c.id === catId);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { catId, name: cat?.name || catId, color: cat?.color || '#64748b', spent, limit, pct };
    }).sort((a,b) => b.pct - a.pct);
  }, [budgets, activeExpenses, expCats]);

  const recurringTotal = useMemo(() => activeExpenses.filter(e => e.recurring).reduce((s,e)=>s+Number(e.amount),0), [activeExpenses]);

  // Fixed/predictable monthly income (recurring, available) and the resulting reliable surplus.
  const fixedIncome = useMemo(() => {
    const rec = activeIncomes.filter(i => i.recurring && !i.isLoss);
    return rec.reduce((s, i) => s + Number(i.amount), 0) - rec.filter(i => i.reinvest).reduce((s, i) => s + Number(i.amount), 0);
  }, [activeIncomes]);
  const predictableSurplus = fixedIncome - recurringTotal;

  const netBySource = useMemo(() => {
    const m = {};
    activeIncomes.forEach(i => {
      if (!m[i.catId]) m[i.catId] = { profit: 0, loss: 0, net: 0 };
      if (i.isLoss) m[i.catId].loss += Number(i.amount);
      else m[i.catId].profit += Number(i.amount);
      m[i.catId].net += i.isLoss ? -Number(i.amount) : Number(i.amount);
    });
    return Object.entries(m).map(([catId, stats]) => {
      const cat = incCats.find(c => c.id === catId) || { name: catId, color: '#64748b' };
      return { catId, name: cat.name, color: cat.color, ...stats };
    }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [activeIncomes, incCats]);

  const insights = useMemo(() => {
    const arr = [];
    const lossesThisMonth = activeIncomes.filter(i => i.isLoss);
    if (lossesThisMonth.length > 0) {
      const byCategory = {};
      lossesThisMonth.forEach(l => {
        const cat = incCats.find(c => c.id === l.catId);
        const name = cat?.name || 'Unknown';
        byCategory[name] = (byCategory[name] || 0) + Number(l.amount);
      });
      Object.entries(byCategory).forEach(([name, amt]) => {
        arr.push({ type: 'warn', text: `${name} down ${formatINR(amt)} this month.` });
      });
    }
    if (trendData.length >= 2) {
      const prev = trendData[trendData.length - 2].Expense;
      const curr = trendData[trendData.length - 1].Expense;
      if (prev > 0) {
        const change = ((curr - prev) / prev) * 100;
        if (Math.abs(change) >= 10) {
          arr.push({ type: change < 0 ? 'good' : 'warn',
            text: change < 0 ? `You spent ${Math.abs(change).toFixed(0)}% less than last month — nice!` : `Spending is up ${change.toFixed(0)}% vs last month.` });
        }
      }
    }
    if (expenseBreakdown.length > 0) {
      arr.push({ type: 'info', text: `Top categories: ${expenseBreakdown.slice(0, 3).map(c => c.name).join(', ')}` });
    }
    if (netSavings > 0 && availableIncome > 0) {
      arr.push({ type: 'good', text: `You're saving ${((netSavings / availableIncome) * 100).toFixed(0)}% of available income.` });
    } else if (netSavings < 0) {
      arr.push({ type: 'warn', text: `Overspending by ${formatINR(Math.abs(netSavings))} this month.` });
    }
    return arr;
  }, [trendData, expenseBreakdown, netSavings, availableIncome, totalExpense, activeIncomes, incCats]);

  const fiftyThirtyTwenty = useMemo(() => {
    if (availableIncome <= 0) return null;
    const needs = activeExpenses.filter(e => e.necessity === 'Need').reduce((s,e)=>s+Number(e.amount),0);
    const wants = activeExpenses.filter(e => e.necessity === 'Want' || e.necessity === 'Impulse').reduce((s,e)=>s+Number(e.amount),0);
    const untagged = activeExpenses.filter(e => !e.necessity).reduce((s,e)=>s+Number(e.amount),0);
    const savings = Math.max(0, netSavings);
    return {
      needsAmt: needs, wantsAmt: wants, untaggedAmt: untagged, savingsAmt: savings,
      needsPct: (needs / availableIncome) * 100,
      wantsPct: (wants / availableIncome) * 100,
      savingsPct: (savings / availableIncome) * 100,
    };
  }, [activeExpenses, availableIncome, netSavings]);

  return (
    <div className="min-h-screen p-4 pb-24 md:p-6 md:pb-6">
      <div className="max-w-7xl mx-auto">
        <Header selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} allMonths={allMonths} user={user} onHelp={() => setShowHelp(true)} />
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'overview' && (
          <Overview
            totalIncome={totalIncome} reinvested={reinvested} availableIncome={availableIncome}
            totalExpense={totalExpense} netSavings={netSavings} consumedPct={consumedPct}
            recurringTotal={recurringTotal}
            expenseBreakdown={expenseBreakdown} incomeBreakdown={incomeBreakdown}
            trendData={trendData}
            insights={insights} fiftyThirtyTwenty={fiftyThirtyTwenty}
            netBySource={netBySource} necessityGrouped={necessityGrouped}
            categoryByNecessity={categoryByNecessity}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={monthExpenses} setExpenses={setExpenses} allExpenses={expenses}
            cats={expCats} setCats={setExpCats}
            catActive={expCatActive} setCatActive={setExpCatActive}
            budgets={budgets} setBudgets={setBudgets}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === 'income' && (
          <IncomeTab
            incomes={monthIncomes} setIncomes={setIncomes} allIncomes={incomes}
            cats={incCats} setCats={setIncCats}
            catActive={incCatActive} setCatActive={setIncCatActive}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === 'goals' && <GoalsTab goals={goals} setGoals={setGoals} netSavings={netSavings} avgMonthlySavings={avgMonthlySavings} lifetimeSavings={lifetimeSavings} predictableSurplus={predictableSurplus} fixedIncome={fixedIncome} fixedExpenses={recurringTotal} />}
        {activeTab === 'data' && (
          <DataTab
            expenses={expenses} setExpenses={setExpenses}
            incomes={incomes} setIncomes={setIncomes}
            expCats={expCats} setExpCats={setExpCats}
            incCats={incCats} setIncCats={setIncCats}
            budgets={budgets} setBudgets={setBudgets}
            goals={goals} setGoals={setGoals}
            expCatActive={expCatActive} setExpCatActive={setExpCatActive}
            incCatActive={incCatActive} setIncCatActive={setIncCatActive}
          />
        )}

        {showHelp && <HelpPage onClose={() => setShowHelp(false)} />}
      </div>
    </div>
  );
}
