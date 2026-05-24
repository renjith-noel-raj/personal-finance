import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { createStorage } from '../lib/storage';

const sizeOf = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : v == null ? 'null' : 1);

export function useFinanceData() {
  const { storageMode, user } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expCats, setExpCats] = useState([]);
  const [incCats, setIncCats] = useState([]);
  const [expCatActive, setExpCatActive] = useState({});
  const [incCatActive, setIncCatActive] = useState({});
  const [budgets, setBudgets] = useState({});
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);

  const storageRef = useRef(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Re-gate auto-save during every (re)load so the save effects below cannot
    // fire — and overwrite stored data — until this load has fully succeeded.
    setLoaded(false);
    setLoadError(null);

    const s = createStorage(storageMode, user);
    storageRef.current = s;
    const uid = user?.uid;
    console.log('[PF] LOAD start mode=%s uid=%s', storageMode, uid);

    (async () => {
      try {
        // Read every slice up front. If ANY read throws, we bail without
        // enabling saves, so a failed/partial read can never clobber storage.
        const [exp, inc, ec, ic, eca, ica, bud, gl, dbt] = await Promise.all([
          s.get('expenses'),
          s.get('incomes'),
          s.get('expCats'),
          s.get('incCats'),
          s.get('expCatActive'),
          s.get('incCatActive'),
          s.get('budgets'),
          s.get('goals'),
          s.get('debts'),
        ]);
        if (cancelled) { console.log('[PF] LOAD cancelled (stale) uid=%s', uid); return; }

        console.log(
          '[PF] LOAD result expenses=%s incomes=%s expCats=%s incCats=%s budgets=%s goals=%s',
          sizeOf(exp), sizeOf(inc), sizeOf(ec), sizeOf(ic), sizeOf(bud), sizeOf(gl)
        );

        setExpenses(exp ?? []);
        setIncomes(inc ?? []);
        setExpCats(ec ?? getDefaultExpCats());
        setIncCats(ic ?? getDefaultIncCats());
        setExpCatActive(eca ?? {});
        setIncCatActive(ica ?? {});
        setBudgets(bud ?? {});
        setGoals(gl ?? []);
        setDebts(dbt ?? []);
        setLoaded(true); // only now are auto-saves allowed to run
        console.log('[PF] LOAD complete -> auto-save ENABLED uid=%s', uid);
      } catch (e) {
        if (cancelled) return;
        console.error('[PF] LOAD failed -> auto-save STAYS DISABLED (data protected):', e?.code, e?.message, e);
        setLoadError(e);
      }
    })();

    return () => { cancelled = true; };
  }, [storageMode, user, reloadKey]);

  const save = (key, value) => {
    console.log('[PF] SAVE key=%s size=%s', key, sizeOf(value));
    storageRef.current?.set(key, value).catch((e) =>
      console.error('[PF] SAVE failed key=%s:', key, e?.code, e?.message, e)
    );
  };

  useEffect(() => { if (loaded) save('expenses', expenses); }, [expenses, loaded]);
  useEffect(() => { if (loaded) save('incomes', incomes); }, [incomes, loaded]);
  useEffect(() => { if (loaded) save('expCats', expCats); }, [expCats, loaded]);
  useEffect(() => { if (loaded) save('incCats', incCats); }, [incCats, loaded]);
  useEffect(() => { if (loaded) save('expCatActive', expCatActive); }, [expCatActive, loaded]);
  useEffect(() => { if (loaded) save('incCatActive', incCatActive); }, [incCatActive, loaded]);
  useEffect(() => { if (loaded) save('budgets', budgets); }, [budgets, loaded]);
  useEffect(() => { if (loaded) save('goals', goals); }, [goals, loaded]);
  useEffect(() => { if (loaded) save('debts', debts); }, [debts, loaded]);

  return {
    loaded,
    loadError,
    reload,
    expenses, setExpenses,
    incomes, setIncomes,
    expCats, setExpCats,
    incCats, setIncCats,
    expCatActive, setExpCatActive,
    incCatActive, setIncCatActive,
    budgets, setBudgets,
    goals, setGoals,
    debts, setDebts,
  };
}

function getDefaultExpCats() {
  return [
    { id: 'food', name: 'Food', color: '#f59e0b' },
    { id: 'utilities', name: 'Utilities', color: '#10b981' },
    { id: 'transport', name: 'Transport', color: '#06b6d4' },
    { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
    { id: 'health', name: 'Health', color: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', color: '#ef4444' },
    { id: 'kids', name: 'Kids', color: '#a855f7' },
    { id: 'personal_care', name: 'Personal Care', color: '#f472b6' },
    { id: 'home', name: 'Home', color: '#84cc16' },
    { id: 'emi', name: 'EMI', color: '#6366f1' },
    { id: 'other_exp', name: 'Other', color: '#64748b' },
  ];
}

function getDefaultIncCats() {
  return [
    { id: 'salary', name: 'Salary', color: '#10b981', defaultReinvest: false },
    { id: 'other_inc', name: 'Other', color: '#64748b', defaultReinvest: false },
  ];
}
