import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { pickCategoryColor } from './shared';

export default function AddCatForm({ onAdd, prefix, withReinvest }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(pickCategoryColor());
  const [reinvest, setReinvest] = useState(false);
  const submit = () => {
    if (!name.trim()) return;
    const cat = { id: `${prefix}_${Date.now()}`, name: name.trim(), color };
    if (withReinvest) cat.defaultReinvest = reinvest;
    onAdd(cat);
    setName(''); setColor(pickCategoryColor()); setReinvest(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="New category"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="input flex-1 min-w-0 px-2 py-1.5" />
      <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 bg-white p-0.5 flex-shrink-0" />
      {withReinvest && (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" checked={reinvest} onChange={e => setReinvest(e.target.checked)} className="rounded accent-brand-600" /> Reinvest
        </label>
      )}
      <button onClick={submit} className="btn-primary px-2.5 flex-shrink-0" aria-label="Add category"><Plus size={14} /></button>
    </div>
  );
}
