export const NECESSITY_TAGS = ['Need', 'Want', 'Impulse'];
export const NECESSITY_COLORS = { Need: '#16a34a', Want: '#f59e0b', Impulse: '#ef4444' };

// Brand + neutrals for charts (Slate Mono + Cyan)
export const BRAND = '#0891b2';
export const TREND_COLORS = { Income: '#16a34a', Expense: '#dc2626', Savings: '#0891b2' };
export const CHART_GRID = '#e2e8f0';
export const CHART_AXIS = '#94a3b8';

// Palette for new categories / charts — cohesive with the slate+cyan theme
export const CATEGORY_PALETTE = [
  '#0891b2', '#6366f1', '#16a34a', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#ef4444', '#0ea5e9', '#84cc16',
  '#f97316', '#a855f7',
];
export const pickCategoryColor = (i = 0) =>
  CATEGORY_PALETTE[(Math.abs(i) + Math.floor(Math.random() * CATEGORY_PALETTE.length)) % CATEGORY_PALETTE.length];

export const formatINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const monthKey = (dateStr) => dateStr.slice(0, 7);
export const currentMonth = () => todayStr().slice(0, 7);

// ── Debt clearance: amortization + payoff helpers ──────────────────────────

// Current outstanding balance of a debt = original principal − principal paid.
export const debtRemaining = (d) =>
  d ? Math.max(0, (Number(d.principal) || 0) - (Number(d.paid) || 0)) : 0;

// Split a payment into interest accrued this period and the principal it pays.
// `principal` may be negative when the payment doesn't cover interest.
export function paymentSplit(balance, payment, aprPct = 0) {
  const B = Math.max(0, Number(balance) || 0);
  const pay = Math.max(0, Number(payment) || 0);
  const interest = B * ((Number(aprPct) || 0) / 12 / 100);
  return { interest, principal: pay - interest };
}

// Whole months to fully clear `balance` paying `monthly`, at annual `aprPct`.
// Returns Infinity when the payment can never clear it (<= monthly interest).
export function monthsToClear(balance, monthly, aprPct = 0) {
  const B = Math.max(0, Number(balance) || 0);
  const P = Number(monthly) || 0;
  if (B <= 0) return 0;
  if (P <= 0) return Infinity;
  const r = (Number(aprPct) || 0) / 12 / 100;
  if (r === 0) return Math.ceil(B / P);
  if (P <= B * r) return Infinity;
  return Math.ceil(-Math.log(1 - (B * r) / P) / Math.log(1 + r));
}

// Total interest paid over the life of the debt at a constant monthly payment.
// Upper-bound estimate: the final month may be a partial payment, so this can
// overstate by up to ~one payment — acceptable for a projected display figure.
export function projectedInterest(balance, monthly, aprPct = 0) {
  const n = monthsToClear(balance, monthly, aprPct);
  if (!isFinite(n)) return Infinity;
  return Math.max(0, (Number(monthly) || 0) * n - Math.max(0, Number(balance) || 0));
}

// Calendar label `months` after `startDate` (counted from today when start is past).
export function payoffDateLabel(months, startDate) {
  if (!isFinite(months)) return null;
  const now = new Date();
  const start = startDate ? new Date(startDate) : now;
  const base = start > now ? start : now;
  // Build a fresh date on the 1st so month-end starts (e.g. May 31) don't overflow.
  const end = new Date(base.getFullYear(), base.getMonth() + Math.ceil(months), 1);
  return end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Comparators for focused-mode payoff priority (sort active debts first elsewhere).
export const PAYOFF_ORDERS = {
  avalanche: (a, b) => (Number(b.apr) || 0) - (Number(a.apr) || 0),
  snowball: (a, b) => debtRemaining(a) - debtRemaining(b),
  deadline: (a, b) => (a.deadline || '9999-99').localeCompare(b.deadline || '9999-99'),
};

// Simulate focused payoff: every active debt is paid its EMI, then leftover
// surplus is funnelled to debts in `order`, cascading as each clears.
// Returns { months, perDebt: { id: monthCleared }, totalInterest }.
export function simulateFocusedPayoff(debts, surplus, order) {
  // Prioritise the SOURCE debts first — the comparators read principal/paid/apr/
  // deadline, which the internal items below don't carry — THEN derive the
  // balance-tracking items in that priority order. `items` is a local mutable
  // copy (balances reduced in place) and doubles as the funnel queue.
  const items = [...debts]
    .filter((d) => debtRemaining(d) > 0)
    .sort(order)
    .map((d) => ({ id: d.id, bal: debtRemaining(d), apr: Number(d.apr) || 0, emi: Number(d.emi) || 0 }));
  if (items.length === 0) return { months: 0, perDebt: {}, totalInterest: 0 };
  const perDebt = {};
  let totalInterest = 0;
  let month = 0;
  const MAX = 1200; // 100-year guard against non-terminating inputs
  while (items.some((d) => d.bal > 0) && month < MAX) {
    month++;
    let emiSpent = 0;
    for (const d of items) {
      if (d.bal <= 0) continue;
      const interest = d.bal * (d.apr / 12 / 100);
      totalInterest += interest;
      const pay = Math.min(d.emi, d.bal + interest); // never overpay past clearing
      emiSpent += pay;
      d.bal = Math.max(0, d.bal - (pay - interest));
    }
    let extra = Math.max(0, surplus - emiSpent);
    for (const d of items) { // items is already in priority order
      if (extra <= 0) break;
      if (d.bal <= 0) continue;
      const give = Math.min(d.bal, extra);
      d.bal -= give;
      extra -= give;
    }
    for (const d of items) {
      if (d.bal <= 0 && perDebt[d.id] === undefined) perDebt[d.id] = month;
    }
  }
  // If any debt never cleared (hit the MAX guard), the payoff is insoluble at this surplus.
  if (items.some((d) => d.bal > 0)) return { months: Infinity, perDebt, totalInterest: Infinity };
  return { months: month, perDebt, totalInterest };
}
