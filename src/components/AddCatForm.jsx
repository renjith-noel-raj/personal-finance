import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AddCatForm({ onAdd, prefix, withReinvest }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#64748b');
  const [reinvest, setReinvest] = useState(false);
  const submit = () => {
    if (!name.trim()) return;
    const cat = { id: `${prefix}_${Date.now()}`, name: name.trim(), color };
    if (withReinvest) cat.defaultReinvest = reinvest;
    onAdd(cat);
    setName(''); setColor('#64748b'); setReinvest(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="New category"
        className="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-300 rounded-md" />
      <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
      {withReinvest && (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" checked={reinvest} onChange={e => setReinvest(e.target.checked)} className="rounded" /> Reinvest
        </label>
      )}
      <button onClick={submit} className="px-2 py-1 text-sm bg-slate-900 text-white rounded-md"><Plus size={14} /></button>
    </div>
  );
}
