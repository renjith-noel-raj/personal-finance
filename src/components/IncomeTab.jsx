import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Filter, X, Repeat } from 'lucide-react';
import { formatINR } from './shared';
import EntryForm from './EntryForm.jsx';
import AddCatForm from './AddCatForm.jsx';

export default function IncomeTab({ incomes, setIncomes, allIncomes, cats, setCats, catActive, setCatActive, selectedMonth }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCatMgr, setShowCatMgr] = useState(false);

  const addOrUpdate = (i) => {
    if (editing) {
      setIncomes(allIncomes.map(x => x.id === editing.id ? { ...i, id: editing.id } : x));
      setEditing(null);
    } else {
      setIncomes([...allIncomes, { ...i, id: Date.now().toString() }]);
    }
    setShowForm(false);
  };

  const remove = (id) => setIncomes(allIncomes.filter(x => x.id !== id));
  const toggleCat = (id) => setCatActive({ ...catActive, [id]: catActive[id] === false ? true : false });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title flex items-center gap-2"><Filter size={16} className="text-brand-600" /> Income Sources</h3>
          <button onClick={() => setShowCatMgr(!showCatMgr)} className="link text-xs">{showCatMgr ? 'Done' : 'Manage'}</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {cats.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-2 border border-slate-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input type="checkbox" checked={catActive[c.id] !== false} onChange={() => toggleCat(c.id)} className="rounded accent-brand-600 flex-shrink-0" />
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-sm text-slate-700 truncate">{c.name}</span>
                {c.defaultReinvest && <Repeat size={12} className="text-brand-500 flex-shrink-0" />}
              </label>
              {showCatMgr && cats.length > 1 && (
                <button onClick={() => setCats(cats.filter(x => x.id !== c.id))} className="text-rose-500 hover:text-rose-600 p-1 flex-shrink-0"><X size={14} /></button>
              )}
            </div>
          ))}
        </div>
        {showCatMgr && <div className="mt-3"><AddCatForm onAdd={(c) => setCats([...cats, c])} prefix="inc" withReinvest /></div>}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="panel-title">Income Entries</h3>
          <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="btn-primary">
            <Plus size={14} /> Add
          </button>
        </div>

        {showForm && <EntryForm cats={cats} initial={editing} onSubmit={addOrUpdate}
          onCancel={() => { setShowForm(false); setEditing(null); }} type="income" defaultMonth={selectedMonth} />}

        <div className="space-y-1 max-h-96 overflow-y-auto -mx-1 px-1">
          {incomes.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">No income for this month.</div>
          ) : incomes.sort((a,b) => b.date.localeCompare(a.date)).map(i => {
            const cat = cats.find(c => c.id === i.catId);
            return (
              <div key={i.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 ${catActive[i.catId] === false ? 'opacity-40' : ''}`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                    <span className="truncate">{i.description || cat?.name}</span>
                    {i.isLoss && <span className="chip text-white bg-rose-500 flex-shrink-0">Loss</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-1 items-center">
                    <span>{i.date}</span><span>· {cat?.name}</span>
                    {i.reinvest && <span className="text-brand-600 flex items-center gap-1"><Repeat size={10} /> {i.isLoss ? 'From capital' : 'Reinvested'}</span>}
                  </div>
                </div>
                <div className={`text-sm font-semibold flex-shrink-0 ${i.isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {i.isLoss ? '−' : '+'}{formatINR(i.amount)}
                </div>
                <button onClick={() => { setEditing(i); setShowForm(true); }} className="text-slate-400 hover:text-brand-600 p-1 flex-shrink-0"><Edit2 size={14} /></button>
                <button onClick={() => remove(i.id)} className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
