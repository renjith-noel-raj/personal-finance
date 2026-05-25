import { createStorage } from './storage';

// Demo dataset for the live portfolio build: a realistic INR household across the
// last three months, exercising every dashboard feature (necessity tags, recurring
// fixed costs, reinvested + loss income, budgets, goals, and interest-bearing debts)
// so a first-time visitor lands on a populated dashboard instead of empty zeros.
//
// `generateSampleData` is pure and dated relative to `now`, so the demo always
// looks current. `seedLocalSampleData` writes it into the local IndexedDB backend.

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d, day) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`;
const round10 = (n) => Math.round(n / 10) * 10;

const EXP_CATS = [
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

const INC_CATS = [
  { id: 'salary', name: 'Salary', color: '#10b981', defaultReinvest: false },
  { id: 'freelance', name: 'Freelance', color: '#0ea5e9', defaultReinvest: false },
  { id: 'investments', name: 'Investments', color: '#8b5cf6', defaultReinvest: true },
  { id: 'other_inc', name: 'Other', color: '#64748b', defaultReinvest: false },
];

// [catId, amount, necessity, recurring, day, description]
const EXP_TEMPLATE = [
  ['home', 22000, 'Need', true, 1, 'Rent'],
  ['utilities', 3200, 'Need', true, 5, 'Electricity & water'],
  ['utilities', 999, 'Need', true, 5, 'Internet'],
  ['food', 9500, 'Need', false, 8, 'Groceries'],
  ['food', 3800, 'Want', false, 14, 'Dining out'],
  ['food', 1200, 'Impulse', false, 22, 'Food delivery'],
  ['transport', 3000, 'Need', true, 3, 'Fuel'],
  ['transport', 1400, 'Need', false, 18, 'Cab rides'],
  ['health', 1800, 'Need', false, 11, 'Pharmacy'],
  ['kids', 3500, 'Need', false, 6, 'School supplies'],
  ['entertainment', 2400, 'Want', false, 20, 'Movies & OTT'],
  ['shopping', 5200, 'Impulse', false, 25, 'Online shopping'],
  ['personal_care', 1500, 'Want', false, 16, 'Salon'],
  ['home', 1800, 'Want', false, 23, 'Home decor'],
];

export function generateSampleData(now = new Date()) {
  // Six months so the 6-month trend chart fills completely and the lifetime
  // savings pool comfortably exceeds what's allocated to goals.
  const months = [5, 4, 3, 2, 1, 0].map((i) => new Date(now.getFullYear(), now.getMonth() - i, 1));
  const factors = [0.9, 0.95, 1.0, 1.05, 0.98, 1.0]; // gentle month-to-month variation

  let seq = 0;
  const id = (p) => `${p}_${++seq}`;
  const expenses = [];
  const incomes = [];

  months.forEach((m, mi) => {
    const f = factors[mi];
    EXP_TEMPLATE.forEach(([catId, amount, necessity, recurring, day, description]) => {
      expenses.push({
        id: id('e'),
        date: ymd(m, day),
        amount: recurring ? amount : round10(amount * f),
        catId,
        description,
        necessity,
        recurring,
      });
    });
    incomes.push({
      id: id('i'), date: ymd(m, 1), amount: 85000, catId: 'salary',
      description: 'Monthly salary', reinvest: false, isLoss: false, recurring: true,
    });
    incomes.push({
      id: id('i'), date: ymd(m, 15), amount: round10(12000 * f), catId: 'freelance',
      description: 'Freelance project', reinvest: false, isLoss: false, recurring: false,
    });
    // Monthly SIP that is reinvested — exercises the recurring + reinvest flags and
    // the available-vs-total split on every month, including the default landing view.
    incomes.push({
      id: id('i'), date: ymd(m, 28), amount: 8000, catId: 'investments',
      description: 'SIP (auto-reinvested)', reinvest: true, isLoss: false, recurring: true,
    });
  });

  // A booked loss in the current month — exercises loss income and the
  // "net by income source" panel (a negative net for one source).
  incomes.push({
    id: id('i'), date: ymd(months[months.length - 1], 24), amount: 5000, catId: 'investments',
    description: 'Equity loss booked', reinvest: false, isLoss: true, recurring: false,
  });

  const monthsAhead = (n) => {
    const d = new Date(now.getFullYear(), now.getMonth() + n, 15);
    return ymd(d, 15);
  };
  const monthsAgo = (n) => {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
    return ymd(d, 1);
  };

  const budgets = { food: 16000, entertainment: 3000, shopping: 5000, transport: 6000 };

  const goals = [
    { id: 'g_emergency', name: 'Emergency Fund', target: 300000, saved: 120000, deadline: monthsAhead(12), monthlyPlan: 15000 },
    { id: 'g_japan', name: 'Trip to Japan', target: 250000, saved: 40000, deadline: monthsAhead(10), monthlyPlan: 20000 },
  ];

  const debts = [
    { id: 'd_home', name: 'Home Loan', principal: 2500000, paid: 400000, apr: 8.5, emi: 22000, startDate: monthsAgo(36) },
    { id: 'd_cc', name: 'Credit Card', principal: 80000, paid: 20000, apr: 42, emi: 5000, startDate: monthsAgo(6), deadline: monthsAhead(8) },
  ];

  return {
    expenses, incomes,
    expCats: EXP_CATS, incCats: INC_CATS,
    expCatActive: {}, incCatActive: {},
    budgets, goals, debts,
  };
}

// True if the local backend already holds entries we'd be overwriting.
export async function hasLocalData() {
  const s = createStorage('local');
  const [exp, inc] = await Promise.all([s.get('expenses'), s.get('incomes')]);
  return (Array.isArray(exp) && exp.length > 0) || (Array.isArray(inc) && inc.length > 0);
}

// Write the demo dataset into the local IndexedDB backend.
export async function seedLocalSampleData(now = new Date()) {
  const s = createStorage('local');
  const data = generateSampleData(now);
  await Promise.all(Object.entries(data).map(([key, value]) => s.set(key, value)));
}
