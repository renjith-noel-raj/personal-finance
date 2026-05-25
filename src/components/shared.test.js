import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatINR,
  monthKey,
  currentMonth,
  todayStr,
  debtRemaining,
  paymentSplit,
  monthsToClear,
  projectedInterest,
  payoffDateLabel,
  PAYOFF_ORDERS,
  simulateFocusedPayoff,
  simulateCombinedPayoff,
} from './shared.js';

// Expected values below are derived by hand (standard amortization math), not
// read back from the implementation — these tests are meant to catch a wrong
// answer, not rubber-stamp the current one.

describe('formatINR', () => {
  it('prefixes ₹ and renders nothing as zero', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(null)).toBe('₹0');
    expect(formatINR(undefined)).toBe('₹0');
  });

  it('uses the Indian lakh/crore grouping (en-IN), not thousands', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(2500000)).toBe('₹25,00,000');
  });

  it('rounds to whole rupees', () => {
    expect(formatINR(1234.7)).toBe('₹1,235');
  });
});

describe('date helpers', () => {
  it('monthKey takes the YYYY-MM prefix', () => {
    expect(monthKey('2026-05-25')).toBe('2026-05');
    expect(monthKey('1999-12-31')).toBe('1999-12');
  });

  it('currentMonth/todayStr read the clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-25T12:00:00'));
    expect(todayStr()).toBe('2026-05-25');
    expect(currentMonth()).toBe('2026-05');
    vi.useRealTimers();
  });
});

describe('debtRemaining', () => {
  it('is principal minus paid, floored at zero', () => {
    expect(debtRemaining({ principal: 1000, paid: 300 })).toBe(700);
    expect(debtRemaining({ principal: 1000, paid: 1500 })).toBe(0);
  });

  it('tolerates missing/blank fields', () => {
    expect(debtRemaining(null)).toBe(0);
    expect(debtRemaining({})).toBe(0);
    expect(debtRemaining({ principal: 500 })).toBe(500);
  });
});

describe('paymentSplit', () => {
  it('charges interest = balance × apr/12 then applies the rest to principal', () => {
    // 12% APR on 1000 → 1% monthly = 10 interest; 100 payment → 90 principal.
    expect(paymentSplit(1000, 100, 12)).toEqual({ interest: 10, principal: 90 });
  });

  it('has zero interest at 0% APR', () => {
    expect(paymentSplit(1000, 100, 0)).toEqual({ interest: 0, principal: 100 });
  });

  it('returns negative principal when the payment cannot cover interest', () => {
    // interest 10, payment 5 → principal -5 (balance would grow).
    expect(paymentSplit(1000, 5, 12)).toEqual({ interest: 10, principal: -5 });
  });
});

describe('monthsToClear', () => {
  it('is zero when there is nothing to clear', () => {
    expect(monthsToClear(0, 100, 5)).toBe(0);
  });

  it('is Infinity when no payment is made', () => {
    expect(monthsToClear(1000, 0, 5)).toBe(Infinity);
  });

  it('is a simple ceiling division at 0% APR', () => {
    expect(monthsToClear(1000, 100, 0)).toBe(10);
    expect(monthsToClear(1000, 300, 0)).toBe(4); // ceil(3.33)
  });

  it('is Infinity when the payment only covers (or under-covers) monthly interest', () => {
    // 12% APR on 1000 → 10/mo interest; paying exactly 10 never reduces principal.
    expect(monthsToClear(1000, 10, 12)).toBe(Infinity);
  });

  it('matches the amortization formula for an interest-bearing debt', () => {
    // 1000 at 12% APR paying 100/mo clears in 11 months (10.59 → ceil).
    expect(monthsToClear(1000, 100, 12)).toBe(11);
  });
});

describe('projectedInterest', () => {
  it('is zero at 0% APR', () => {
    expect(projectedInterest(1000, 100, 0)).toBe(0);
  });

  it('is the total paid minus principal (upper-bound) for interest-bearing debt', () => {
    // 11 months × 100 = 1100 paid, 1000 principal → ~100 interest.
    expect(projectedInterest(1000, 100, 12)).toBe(100);
  });

  it('is Infinity when the debt can never clear', () => {
    expect(projectedInterest(1000, 10, 12)).toBe(Infinity);
  });
});

describe('payoffDateLabel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns null for an unreachable (Infinity) horizon', () => {
    expect(payoffDateLabel(Infinity, '2026-01-01')).toBeNull();
  });

  it('counts from today when the start date is in the past', () => {
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
    expect(payoffDateLabel(3, '2026-01-01')).toBe('Apr 2026');
  });

  it('counts from the start date when it is in the future', () => {
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));
    expect(payoffDateLabel(2, '2026-07-10')).toBe('Sep 2026');
  });

  it('does not overflow when "today" is a month-end (the +1 guard)', () => {
    vi.setSystemTime(new Date('2026-01-31T12:00:00'));
    // Naive setMonth(+1) on Jan 31 would roll to early March; correct is Feb.
    expect(payoffDateLabel(1, null)).toBe('Feb 2026');
  });
});

describe('PAYOFF_ORDERS', () => {
  const ids = (arr, key = 'id') => arr.map((d) => d[key]);

  it('avalanche orders by highest APR first', () => {
    const debts = [{ id: 'a', apr: 5 }, { id: 'b', apr: 20 }, { id: 'c', apr: 0 }];
    expect(ids([...debts].sort(PAYOFF_ORDERS.avalanche))).toEqual(['b', 'a', 'c']);
  });

  it('snowball orders by smallest remaining balance first', () => {
    const debts = [
      { id: 'big', principal: 1000, paid: 0 },   // 1000
      { id: 'mid', principal: 500, paid: 100 },  // 400
      { id: 'small', principal: 2000, paid: 1900 }, // 100
    ];
    expect(ids([...debts].sort(PAYOFF_ORDERS.snowball))).toEqual(['small', 'mid', 'big']);
  });

  it('deadline orders by earliest deadline, undated last', () => {
    const debts = [
      { id: 'dec', deadline: '2026-12' },
      { id: 'none', deadline: undefined },
      { id: 'mar', deadline: '2026-03' },
    ];
    expect(ids([...debts].sort(PAYOFF_ORDERS.deadline))).toEqual(['mar', 'dec', 'none']);
  });
});

describe('simulateFocusedPayoff', () => {
  it('returns a no-op result when there are no active debts', () => {
    expect(simulateFocusedPayoff([], 1000, PAYOFF_ORDERS.avalanche)).toEqual({
      months: 0,
      perDebt: {},
      totalInterest: 0,
    });
  });

  it('funnels surplus to one debt at a time, cascading as each clears', () => {
    const debts = [
      { id: 'a', principal: 300, paid: 0, apr: 0, emi: 0 },
      { id: 'b', principal: 300, paid: 0, apr: 0, emi: 0 },
    ];
    const res = simulateFocusedPayoff(debts, 300, PAYOFF_ORDERS.avalanche);
    expect(res.months).toBe(2);
    expect(res.perDebt).toEqual({ a: 1, b: 2 });
    expect(res.totalInterest).toBe(0);
  });

  it('honours the EMI floor on an interest-bearing debt', () => {
    // EMI 100 with no spare surplus = plain amortization → 11 months.
    const debts = [{ id: 'x', principal: 1000, paid: 0, apr: 12, emi: 100 }];
    const res = simulateFocusedPayoff(debts, 100, PAYOFF_ORDERS.avalanche);
    expect(res.months).toBe(11);
    expect(res.totalInterest).toBeGreaterThan(0);
    expect(Number.isFinite(res.totalInterest)).toBe(true);
  });

  it('reports Infinity when the EMI cannot beat the interest', () => {
    const debts = [{ id: 'x', principal: 1000, paid: 0, apr: 12, emi: 5 }];
    const res = simulateFocusedPayoff(debts, 5, PAYOFF_ORDERS.avalanche);
    expect(res.months).toBe(Infinity);
    expect(res.totalInterest).toBe(Infinity);
  });
});

describe('simulateCombinedPayoff', () => {
  it('funds goals from surplus when there are no debts', () => {
    const res = simulateCombinedPayoff([], [{ target: 1000, saved: 0 }], 250, {
      priority: 'debts',
    });
    expect(res).toEqual({ debtFreeMonth: 0, goalsFundedMonth: 4, combinedMonth: 4 });
  });

  it('priority decides whether debts or goals finish first', () => {
    const debts = [{ id: 'd', principal: 200, paid: 0, apr: 0, emi: 0 }];
    const goals = [{ target: 200, saved: 0 }];

    const debtsFirst = simulateCombinedPayoff(debts, goals, 200, { priority: 'debts' });
    expect(debtsFirst).toEqual({ debtFreeMonth: 1, goalsFundedMonth: 2, combinedMonth: 2 });

    const goalsFirst = simulateCombinedPayoff(debts, goals, 200, { priority: 'goals' });
    expect(goalsFirst).toEqual({ debtFreeMonth: 2, goalsFundedMonth: 1, combinedMonth: 2 });
  });

  it('reports Infinity for a debt whose EMI cannot beat its interest', () => {
    const debts = [{ id: 'd', principal: 1000, paid: 0, apr: 12, emi: 5 }];
    const res = simulateCombinedPayoff(debts, [{ target: 100, saved: 0 }], 5, {
      priority: 'debts',
    });
    expect(res.debtFreeMonth).toBe(Infinity);
    expect(res.combinedMonth).toBe(Infinity);
  });
});
