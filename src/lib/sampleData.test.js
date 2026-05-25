import { describe, it, expect } from 'vitest';
import { generateSampleData } from './sampleData.js';
import { KEYS } from './storage.js';
import { monthsToClear, debtRemaining } from '../components/shared.js';

const FIXED_NOW = new Date('2026-05-15T12:00:00');

describe('generateSampleData', () => {
  const data = generateSampleData(FIXED_NOW);

  it('produces every persisted slice in KEYS', () => {
    for (const key of KEYS) expect(data).toHaveProperty(key);
  });

  it('only references categories that exist (no dangling catIds)', () => {
    const expIds = new Set(data.expCats.map((c) => c.id));
    const incIds = new Set(data.incCats.map((c) => c.id));
    for (const e of data.expenses) expect(expIds.has(e.catId)).toBe(true);
    for (const i of data.incomes) expect(incIds.has(i.catId)).toBe(true);
  });

  it('has well-formed, dated entries', () => {
    expect(data.expenses.length).toBeGreaterThan(0);
    expect(data.incomes.length).toBeGreaterThan(0);
    for (const e of data.expenses) {
      expect(e.amount).toBeGreaterThan(0);
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps the demo debts solvable so the payoff projection shows a real date', () => {
    // A demo with an insoluble debt would render "never" — verify every debt's EMI
    // beats its interest at the seeded balances.
    for (const d of data.debts) {
      expect(monthsToClear(debtRemaining(d), d.emi, d.apr)).not.toBe(Infinity);
    }
  });

  it('includes a reinvested gain and a booked loss to exercise income edge cases', () => {
    expect(data.incomes.some((i) => i.reinvest)).toBe(true);
    expect(data.incomes.some((i) => i.isLoss)).toBe(true);
  });
});
