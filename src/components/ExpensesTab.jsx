import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Filter, Target, X } from 'lucide-react';
import { formatINR, NECESSITY_COLORS } from './shared';
import EntryForm from './EntryForm.jsx';
import AddCatForm from './AddCatForm.jsx';

export default function ExpensesTab({ expenses, setExpenses, allExpenses, cats, setCats, catActive, setCatActive, budgets, setBudgets, selectedMonth }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCatMgr, setShowCatMgr] = useState(false);

  const addOrUpdate = (e) => {
    if (editing) {
      setExpenses(allExpenses.map(x => x.id === editing.id ? { ...e, id: editing.id } : x));
      setEditing(null);
    } else {
      setExpenses([...allExpenses, { ...e, id: Date.now().toString() }]);
    }
    setShowForm(false);
  };

  const remove = (id) => setExpenses(allExpenses.filter(x => x.id !== id));
  const toggleCat = (id) => setCatActive({ ...catActive, [id]: catActive[id] === false ? true : false });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="panel-title flex items-center gap-2"><Filter size={16} className="text-brand-600" /> Categories</h3>
            <button onClick={() => setShowCatMgr(!showCatMgr)} className="link text-xs">{showCatMgr ? 'Done' : 'Manage'}</button>
          </div>
          <div className="space-y-1.5">
            {cats.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input type="checkbox" checked={catActive[c.id] !== false} onChange={() => toggleCat(c.id)} className="rounded accent-brand-600" />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-slate-700 truncate">{c.name}</span>
                </label>
                {showCatMgr && cats.length > 1 && (
                  <button onClick={() => setCats(cats.filter(x => x.id !== c.id))} className="text-rose-500 hover:text-rose-600 p-1 flex-shrink-0"><X size={14} /></button>
                )}
              </div>
            ))}
            {showCatMgr && <AddCatForm onAdd={(c) => setCats([...cats, c])} prefix="exp" />}
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <h3 className="panel-title mb-3 flex items-center gap-2"><Target size={16} className="text-brand-600" /> Budgets</h3>
          <div className="space-y-2.5">
            {cats.map(c => {
              const limit = budgets[c.id] || 0;
              const spent = expenses.filter(e => e.catId === c.id && catActive[c.id] !== false).reduce((s,e)=>s+Number(e.amount),0);
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24 sm:w-28 flex-shrink-0 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-slate-700 truncate">{c.name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {limit > 0 ? (
                      <div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{formatINR(spent)} / {formatINR(limit)} ({pct.toFixed(0)}%)</div>
                      </div>
                    ) : <span className="text-xs text-slate-400">No budget set</span>}
                  </div>
                  <input type="number" placeholder="₹" value={budgets[c.id] || ''}
                    onChange={e => setBudgets({ ...budgets, [c.id]: Number(e.target.value) })}
                    className="input w-20 sm:w-24 flex-shrink-0 px-2 py-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title">Expense Entries</h3>
          <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="btn-primary">
            <Plus size={14} /> Add
          </button>
        </div>

        {showForm && <EntryForm cats={cats} initial={editing} onSubmit={addOrUpdate}
          onCancel={() => { setShowForm(false); setEditing(null); }} type="expense" defaultMonth={selectedMonth} />}

        <div className="space-y-1 max-h-96 overflow-y-auto -mx-1 px-1">
          {expenses.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">No expenses for this month.</div>
          ) : expenses.sort((a,b) => b.date.localeCompare(a.date)).map(e => {
            const cat = cats.find(c => c.id === e.catId);
            return (
              <div key={e.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 ${catActive[e.catId] === false ? 'opacity-40' : ''}`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{e.description || cat?.name}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1 items-center">
                    <span>{e.date}</span><span>· {cat?.name}</span>
                    {e.necessity && <span className="chip text-white" style={{ backgroundColor: NECESSITY_COLORS[e.necessity] }}>{e.necessity}</span>}
                    {e.recurring && <span className="text-brand-600">· Recurring</span>}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 flex-shrink-0">{formatINR(e.amount)}</div>
                <button onClick={() => { setEditing(e); setShowForm(true); }} className="text-slate-400 hover:text-brand-600 p-1 flex-shrink-0"><Edit2 size={14} /></button>
                <button onClick={() => remove(e.id)} className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
