import React from 'react';

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'income', label: 'Income' },
    { id: 'goals', label: 'Goals' },
    { id: 'data', label: 'Data' },
  ];
  return (
    <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl border border-slate-200 w-full md:w-fit overflow-x-auto">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
