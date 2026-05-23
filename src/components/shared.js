export const NECESSITY_TAGS = ['Need', 'Want', 'Impulse'];
export const NECESSITY_COLORS = { Need: '#10b981', Want: '#f59e0b', Impulse: '#ef4444' };

export const formatINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const todayStr = () => new Date().toISOString().slice(0, 10);
export const monthKey = (dateStr) => dateStr.slice(0, 7);
export const currentMonth = () => todayStr().slice(0, 7);
