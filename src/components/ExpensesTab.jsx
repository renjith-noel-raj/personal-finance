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
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Filter size={16} /> Categories</h3>
            <button onClick={() => setShowCatMgr(!showCatMgr)} className="text-xs text-indigo-600 hover:underline">{showCatMgr ? 'Done' : 'Manage'}</button>
          </div>
          <div className="space-y-1.5">
            {cats.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input type="checkbox" checked={catActive[c.id] !== false} onChange={() => toggleCat(c.id)} className="rounded" />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-slate-700">{c.name}</span>
                </label>
                {showCatMgr && cats.length > 1 && (
                  <button onClick={() => setCats(cats.filter(x => x.id !== c.id))} className="text-rose-500"><X size={14} /></button>
                )}
              </div>
            ))}
            {showCatMgr && <AddCatForm onAdd={(c) => setCats([...cats, c])} prefix="exp" />}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Target size={16} /> Budgets</h3>
          <div className="space-y-2">
            {cats.map(c => {
              const limit = budgets[c.id] || 0;
              const spent = expenses.filter(e => e.catId === c.id && catActive[c.id] !== false).reduce((s,e)=>s+Number(e.amount),0);
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-28">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-slate-700 truncate">{c.name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {limit > 0 ? (
                      <div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 100 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatINR(spent)} / {formatINR(limit)} ({pct.toFixed(0)}%)</div>
                      </div>
                    ) : <span className="text-xs text-slate-400">No budget set</span>}
                  </div>
                  <input type="number" placeholder="₹" value={budgets[c.id] || ''}
                    onChange={e => setBudgets({ ...budgets, [c.id]: Number(e.target.value) })}
                    className="w-24 px-2 py-1 text-sm border border-slate-200 rounded-md" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Expense Entries</h3>
          <button onClick={() => { setEditing(null); setShowForm(!showForm); }}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        </div>

        {showForm && <EntryForm cats={cats} initial={editing} onSubmit={addOrUpdate}
          onCancel={() => { setShowForm(false); setEditing(null); }} type="expense" defaultMonth={selectedMonth} />}

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {expenses.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">No expenses for this month.</div>
          ) : expenses.sort((a,b) => b.date.localeCompare(a.date)).map(e => {
            const cat = cats.find(c => c.id === e.catId);
            return (
              <div key={e.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 ${catActive[e.catId] === false ? 'opacity-40' : ''}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{e.description || cat?.name}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2 items-center">
                    <span>{e.date}</span><span>· {cat?.name}</span>
                    {e.necessity && <span className="px-1.5 py-0.5 rounded text-white text-xs" style={{ backgroundColor: NECESSITY_COLORS[e.necessity] }}>{e.necessity}</span>}
                    {e.recurring && <span className="text-indigo-600">· Recurring</span>}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatINR(e.amount)}</div>
                <button onClick={() => { setEditing(e); setShowForm(true); }} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                <button onClick={() => remove(e.id)} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
