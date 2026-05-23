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
