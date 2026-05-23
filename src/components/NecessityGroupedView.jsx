import React, { useState } from 'react';
import { formatINR } from './shared';

export default function NecessityGroupedView({ groups, total }) {
  const [expanded, setExpanded] = useState({});
  const [catExpanded, setCatExpanded] = useState({});
  const toggle = (tag) => setExpanded({ ...expanded, [tag]: !expanded[tag] });
  const toggleCat = (key) => setCatExpanded({ ...catExpanded, [key]: !catExpanded[key] });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Spending by Necessity</h3>
      <div className="space-y-2">
        {groups.map(g => {
          const pct = total > 0 ? (g.total / total) * 100 : 0;
          const isOpen = expanded[g.tag];
          return (
            <div key={g.tag} className="border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => toggle(g.tag)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-slate-900">{g.tag}</div>
                  <div className="text-xs text-slate-500">{g.cats.length} categor{g.cats.length === 1 ? 'y' : 'ies'} · {pct.toFixed(0)}% of expenses</div>
                </div>
                <div className="text-right"><div className="font-bold text-slate-900">{formatINR(g.total)}</div></div>
                <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="bg-slate-50 px-3 py-2 space-y-2 border-t border-slate-200">
                  {g.cats.map(c => {
                    const catPct = g.total > 0 ? (c.value / g.total) * 100 : 0;
                    const catKey = `${g.tag}-${c.name}`;
                    const catOpen = catExpanded[catKey];
                    return (
                      <div key={c.name} className="bg-white border border-slate-200 rounded-md overflow-hidden">
                        <button onClick={() => toggleCat(catKey)} className="w-full flex items-center gap-2 py-2 px-2 text-sm hover:bg-slate-50">
                          <span className="text-slate-400 text-xs w-3">{catOpen ? '▾' : '▸'}</span>
                          <span className="flex-1 text-slate-700 text-left">{c.name}</span>
                          <span className="text-slate-400 text-xs">({c.entries.length})</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${catPct}%`, backgroundColor: g.color }} />
                          </div>
                          <span className="text-slate-700 w-20 text-right text-xs font-medium">{formatINR(c.value)}</span>
                          <span className="text-slate-400 w-10 text-right text-xs">{catPct.toFixed(0)}%</span>
                        </button>
                        {catOpen && (
                          <div className="bg-slate-50 px-2 py-1.5 border-t border-slate-200 space-y-1">
                            {c.entries.map(e => (
                              <div key={e.id} className="flex items-center gap-2 text-xs py-1 px-1">
                                <span className="text-slate-400 w-20 flex-shrink-0">{e.date}</span>
                                <span className="flex-1 text-slate-700 truncate">{e.description || <em className="text-slate-400">No description</em>}</span>
                                {e.recurring && <span className="text-indigo-500 text-[10px]">↻</span>}
                                <span className="text-slate-900 w-20 text-right font-medium">{formatINR(e.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
