import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR } from './shared';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.12)',
  fontSize: 12,
};

export default function ChartCard({ title, data, empty }) {
  if (data.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="panel-title mb-3">{title}</h3>
        <div className="h-60 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
          <div className="h-12 w-12 rounded-full border-4 border-dashed border-slate-200" />
          {empty}
        </div>
      </div>
    );
  }
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <div className="card p-4">
      <h3 className="panel-title mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={v => formatINR(v)} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {data.slice(0, 5).map(d => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-700 truncate">{d.name}</span>
              </div>
              <span className="text-slate-500 flex-shrink-0">{formatINR(d.value)} <span className="text-xs text-slate-400">({pct.toFixed(0)}%)</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
