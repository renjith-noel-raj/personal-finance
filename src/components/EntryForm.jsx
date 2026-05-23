import React, { useState } from 'react';
import { NECESSITY_TAGS, NECESSITY_COLORS, todayStr } from './shared';

export default function EntryForm({ cats, initial, onSubmit, onCancel, type, defaultMonth }) {
  const defaultDate = defaultMonth ? `${defaultMonth}-${String(new Date().getDate()).padStart(2,'0')}` : todayStr();
  const [amount, setAmount] = useState(initial?.amount || '');
  const [catId, setCatId] = useState(initial?.catId || cats[0]?.id || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || defaultDate);
  const [necessity, setNecessity] = useState(initial?.necessity || 'Need');
  const [recurring, setRecurring] = useState(initial?.recurring || false);
  const [reinvest, setReinvest] = useState(initial?.reinvest ?? (cats.find(c => c.id === (initial?.catId || cats[0]?.id))?.defaultReinvest || false));
  const [isLoss, setIsLoss] = useState(initial?.isLoss || false);

  const handleCatChange = (id) => {
    setCatId(id);
    if (type === 'income') {
      const c = cats.find(x => x.id === id);
      setReinvest(c?.defaultReinvest || false);
    }
  };

  const submit = () => {
    if (!amount || Number(amount) <= 0) return;
    const data = { amount: Number(amount), catId, description, date };
    if (type === 'expense') Object.assign(data, { necessity, recurring });
    else Object.assign(data, { reinvest, isLoss });
    onSubmit(data);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
      {type === 'income' && (
        <div className="flex gap-1 mb-3 p-1 bg-white rounded-lg border border-slate-200 w-fit">
          <button onClick={() => setIsLoss(false)} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${!isLoss ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}>+ Profit</button>
          <button onClick={() => setIsLoss(true)} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${isLoss ? 'bg-rose-500 text-white' : 'text-slate-600'}`}>− Loss</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Amount (₹) {type === 'income' && isLoss && <span className="text-rose-600">— loss</span>}</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="input" autoFocus />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Category</label>
          <select value={catId} onChange={e => handleCatChange(e.target.value)} className="input">
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Description (optional)</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        {type === 'expense' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Necessity</label>
              <div className="flex gap-1">
                {NECESSITY_TAGS.map(t => (
                  <button key={t} onClick={() => setNecessity(t)}
                    className={`flex-1 px-2 py-2 text-xs rounded-lg font-medium transition ${necessity === t ? 'text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    style={necessity === t ? { backgroundColor: NECESSITY_COLORS[t] } : {}}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded accent-brand-600" />
                <span className="text-sm text-slate-700">Recurring monthly expense</span>
              </label>
            </div>
          </>
        )}
        {type === 'income' && (
          <div className="md:col-span-2 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reinvest} onChange={e => setReinvest(e.target.checked)} className="rounded accent-brand-600" />
              <span className="text-sm text-slate-700">{isLoss ? 'Loss came from reinvested capital' : 'Reinvest this income'}</span>
            </label>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={submit} className="btn-primary">{initial ? 'Update' : 'Add'}</button>
      </div>
    </div>
  );
}
