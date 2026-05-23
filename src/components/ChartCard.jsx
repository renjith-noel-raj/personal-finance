import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR } from './shared';

export default function ChartCard({ title, data, empty }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
        <div className="h-60 flex items-center justify-center text-sm text-slate-400">{empty}</div>
      </div>
    );
  }
  const total = data.reduce((s,x)=>s+x.value,0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={v => formatINR(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-2">
        {data.slice(0, 5).map(d => {
          const pct = total > 0 ? (d.value/total)*100 : 0;
          return (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-700">{d.name}</span>
              </div>
              <span className="text-slate-500">{formatINR(d.value)} <span className="text-xs">({pct.toFixed(0)}%)</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
