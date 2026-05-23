import React, { useState, useRef } from 'react';
import { Download, Upload, Database, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { todayStr } from './shared';

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach(r => lines.push(headers.map(h => escapeCsv(r[h])).join(',')));
  return lines.join('\n');
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const result = []; let cur = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else cur += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { result.push(cur); cur = ''; }
        else cur += c;
      }
    }
    result.push(cur); return result;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
    return obj;
  });
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DataTab({ expenses, setExpenses, incomes, setIncomes, expCats, setExpCats, incCats, setIncCats, budgets, setBudgets, goals, setGoals, expCatActive, setExpCatActive, incCatActive, setIncCatActive }) {
  const { storageMode, user } = useApp();
  const [status, setStatus] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [csvImportType, setCsvImportType] = useState('expenses');
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const showStatus = (msg, isError = false) => {
    setStatus({ msg, isError });
    setTimeout(() => setStatus(null), 4000);
  };

  const exportExpensesCsv = () => {
    const rows = expenses.map(e => ({
      date: e.date, amount: e.amount,
      category: expCats.find(c => c.id === e.catId)?.name || e.catId,
      description: e.description || '',
      necessity: e.necessity || '', recurring: e.recurring ? 'Yes' : 'No',
    }));
    downloadFile(`expenses-${todayStr()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    showStatus(`Exported ${rows.length} expense entries.`);
  };

  const exportIncomesCsv = () => {
    const rows = incomes.map(i => ({
      date: i.date, amount: i.amount,
      type: i.isLoss ? 'Loss' : 'Profit',
      category: incCats.find(c => c.id === i.catId)?.name || i.catId,
      description: i.description || '', reinvest: i.reinvest ? 'Yes' : 'No',
    }));
    downloadFile(`income-${todayStr()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    showStatus(`Exported ${rows.length} income entries.`);
  };

  const exportJson = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), expenses, incomes, expCats, incCats, budgets, goals, expCatActive, incCatActive };
    downloadFile(`finance-backup-${todayStr()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showStatus('Full backup downloaded.');
  };

  const importJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error('Not a valid backup file');
        if (data.expenses) setExpenses(data.expenses);
        if (data.incomes) setIncomes(data.incomes);
        if (data.expCats) setExpCats(data.expCats);
        if (data.incCats) setIncCats(data.incCats);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        if (data.expCatActive) setExpCatActive(data.expCatActive);
        if (data.incCatActive) setIncCatActive(data.incCatActive);
        showStatus('Backup restored successfully.');
      } catch (err) { showStatus('Import failed: ' + err.message, true); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const importCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsv(ev.target.result);
        if (rows.length === 0) throw new Error('No data found in CSV');
        if (csvImportType === 'expenses') {
          const existingByName = {};
          expCats.forEach(c => { existingByName[c.name.toLowerCase()] = c.id; });
          const newCats = [...expCats]; const newEntries = [];
          rows.forEach((r, idx) => {
            const catName = (r.category || 'Other').trim();
            let catId = existingByName[catName.toLowerCase()];
            if (!catId) {
              catId = `imp_${Date.now()}_${idx}`;
              newCats.push({ id: catId, name: catName, color: '#64748b' });
              existingByName[catName.toLowerCase()] = catId;
            }
            newEntries.push({
              id: `${Date.now()}_${idx}`, date: r.date, amount: Number(r.amount) || 0,
              catId, description: r.description || '',
              necessity: r.necessity && ['Need','Want','Impulse'].includes(r.necessity) ? r.necessity : undefined,
              recurring: /^(yes|true|1)$/i.test(r.recurring || ''),
            });
          });
          setExpCats(newCats); setExpenses([...expenses, ...newEntries]);
          showStatus(`Imported ${newEntries.length} expense entries.`);
        } else if (csvImportType === 'income') {
          const existingByName = {};
          incCats.forEach(c => { existingByName[c.name.toLowerCase()] = c.id; });
          const newCats = [...incCats]; const newEntries = [];
          rows.forEach((r, idx) => {
            const catName = (r.category || 'Other').trim();
            let catId = existingByName[catName.toLowerCase()];
            if (!catId) {
              catId = `imp_${Date.now()}_${idx}`;
              newCats.push({ id: catId, name: catName, color: '#64748b', defaultReinvest: false });
              existingByName[catName.toLowerCase()] = catId;
            }
            newEntries.push({
              id: `${Date.now()}_${idx}`, date: r.date, amount: Number(r.amount) || 0,
              catId, description: r.description || '',
              reinvest: /^(yes|true|1)$/i.test(r.reinvest || ''),
              isLoss: /^loss$/i.test(r.type || ''),
            });
          });
          setIncCats(newCats); setIncomes([...incomes, ...newEntries]);
          showStatus(`Imported ${newEntries.length} income entries.`);
        }
      } catch (err) { showStatus('Import failed: ' + err.message, true); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetAll = () => {
    setExpenses([]); setIncomes([]); setBudgets({}); setGoals([]);
    setExpCatActive({}); setIncCatActive({});
    setConfirmReset(false);
    showStatus('All data cleared.');
  };

  const totalSize = JSON.stringify({ expenses, incomes, expCats, incCats, budgets, goals }).length;

  return (
    <div className="space-y-4">
      {status && (
        <div className={`p-3 rounded-xl text-sm ${status.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>{status.msg}</div>
      )}

      <div className="card p-4">
        <h3 className="panel-title mb-3 flex items-center gap-2"><Database size={16} className="text-brand-600" /> Where is my data?</h3>
        <div className="text-sm text-slate-600 space-y-2">
          {storageMode === 'firebase' ? (
            <p>Synced to <strong>your Firebase project</strong>. Signed in as <strong>{user?.email}</strong>.</p>
          ) : (
            <p>Stored locally in this browser (IndexedDB). Only this device has access.</p>
          )}
          <p className="text-amber-700">⚠ Export a backup regularly.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
            <span><strong>{expenses.length}</strong> expense entries</span>
            <span><strong>{incomes.length}</strong> income entries</span>
            <span><strong>{goals.length}</strong> goals</span>
            <span><strong>{(totalSize / 1024).toFixed(1)} KB</strong> total</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="panel-title mb-3 flex items-center gap-2"><Download size={16} className="text-brand-600" /> Export Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button onClick={exportExpensesCsv} className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm transition">
            <FileText size={14} className="text-slate-500" /><span className="flex-1 text-left">Expenses (CSV)</span><Download size={12} className="text-slate-400" />
          </button>
          <button onClick={exportIncomesCsv} className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm transition">
            <FileText size={14} className="text-slate-500" /><span className="flex-1 text-left">Income (CSV)</span><Download size={12} className="text-slate-400" />
          </button>
          <button onClick={exportJson} className="md:col-span-2 flex items-center gap-2 px-3 py-2.5 border border-brand-200 bg-brand-50 rounded-xl hover:bg-brand-100 text-sm transition">
            <Database size={14} className="text-brand-700" /><span className="flex-1 text-left text-brand-900 font-medium">Full Backup (JSON)</span><Download size={12} className="text-brand-700" />
          </button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="panel-title mb-3 flex items-center gap-2"><Upload size={16} className="text-brand-600" /> Import Data</h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Restore from full backup</div>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2.5 border border-brand-200 bg-brand-50 rounded-xl hover:bg-brand-100 text-sm text-brand-900 transition">
              <Upload size={14} /> Choose JSON backup file
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={importJson} className="hidden" />
            <p className="text-xs text-amber-700 mt-1">⚠ This replaces all current data.</p>
          </div>
          <div className="pt-3 border-t border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">Add from CSV</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={csvImportType} onChange={e => setCsvImportType(e.target.value)} className="input w-auto px-2 py-2">
                <option value="expenses">Expenses CSV</option>
                <option value="income">Income CSV</option>
              </select>
              <button onClick={() => csvInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm transition">
                <Upload size={14} /> Choose CSV file
              </button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
        <h3 className="font-semibold text-rose-900 mb-2 flex items-center gap-2"><Trash2 size={16} /> Danger Zone</h3>
        <p className="text-sm text-rose-700 mb-3">Clear all entries, budgets, and goals. Categories are kept. Cannot be undone.</p>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="px-3 py-2 bg-white border border-rose-300 text-rose-700 rounded-xl text-sm hover:bg-rose-100 transition">Clear all data...</button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={resetAll} className="btn-danger">Yes, delete everything</button>
            <button onClick={() => setConfirmReset(false)} className="btn-ghost">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
