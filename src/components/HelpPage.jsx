import React from 'react';
import {
  X, BookOpen, Rocket, Compass, LayoutDashboard, CreditCard, TrendingUp,
  Target, Landmark, Database, Calculator, Smartphone, HelpCircle,
} from 'lucide-react';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
        <Icon size={18} className="text-brand-600" /> {title}
      </h2>
      <div className="space-y-2 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

const UL = ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>;
const Term = ({ children }) => <strong className="text-slate-800">{children}</strong>;

export default function HelpPage({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-600" /> How to use
          </h1>
          <button onClick={onClose} className="btn-ghost" aria-label="Close help"><X size={16} /> Close</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-24 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 shadow-hero">
          <h2 className="text-xl font-bold mb-1">Personal Finance Dashboard</h2>
          <p className="text-sm text-white/90">A privacy-first tracker for expenses, income, savings, and goals. Your data stays on your device or in your own cloud — nothing is sent to a server owned by this app.</p>
        </div>

        <Section icon={Rocket} title="1. Getting started">
          <p>On first launch, pick where your data is stored (you can switch later):</p>
          <UL>
            <li><Term>Local only</Term> — stored in this browser (IndexedDB). Instant, private to this device, no account.</li>
            <li><Term>Firebase (your own)</Term> — syncs across your devices using <em>your</em> Firebase project. One-time ~10-min setup, then paste your config and sign in with Google.</li>
          </UL>
          <p>Your finances are never sent to a shared server — the app holds no credentials.</p>
        </Section>

        <Section icon={Compass} title="2. Getting around">
          <UL>
            <li><Term>Month selector</Term> (header): use <Term>‹ ›</Term> or the dropdown to change month, and <Term>Today</Term> to jump back. Most screens show data for the selected month.</li>
            <li><Term>Tabs</Term>: Overview · Expenses · Income · Goals · Debts · Data. On phones these become a fixed bottom navigation bar.</li>
            <li><Term>Switch / sign out</Term>: the icon at the top-right returns you to storage selection (your data stays saved).</li>
            <li><Term>Help</Term>: reopen this guide anytime via the <Term>?</Term> button in the header.</li>
          </UL>
        </Section>

        <Section icon={LayoutDashboard} title="3. Overview">
          <p>Your monthly snapshot:</p>
          <UL>
            <li><Term>Stat cards</Term> — Total Income, Reinvested, <Term>Available</Term> (income − reinvested), Expenses (with your fixed/recurring portion), and the highlighted <Term>Net Savings</Term>.</li>
            <li><Term>Insights</Term> — auto notes like spending up/down vs last month, top categories, and savings rate.</li>
            <li><Term>Goals &amp; Debts outlook</Term> — a forward-looking summary of how much debt and goal funding remains, with a projected <Term>“everything done by”</Term> date and a <Term>Debts-first / Goals-first</Term> toggle (full controls live on the Goals and Debts tabs).</li>
            <li><Term>Income Consumed by Expenses</Term> — how much of available income your spending used.</li>
            <li><Term>50 / 30 / 20 Rule</Term> — your Needs / Wants+Impulse / Savings split vs the classic targets.</li>
            <li><Term>Breakdown donuts</Term>, <Term>Net by Income Source</Term>, <Term>Spending by Necessity</Term> (drill into Need/Want/Impulse → category → entries), and a <Term>6-month trend</Term>.</li>
          </UL>
        </Section>

        <Section icon={CreditCard} title="4. Expenses">
          <UL>
            <li><Term>Categories</Term> — toggle a category off to exclude it from all totals/charts (without deleting). Use <Term>Manage</Term> to add (name + color) or remove.</li>
            <li><Term>Budgets</Term> — set a monthly ₹ limit per category; the bar turns amber/red as you approach/exceed it.</li>
            <li><Term>Add an expense</Term> — amount, category, description, date, plus:
              <UL>
                <li><Term>Necessity</Term>: Need / Want / Impulse (powers 50/30/20 and the necessity views).</li>
                <li><Term>Recurring</Term>: marks a fixed monthly cost (rent, subscriptions).</li>
              </UL>
            </li>
            <li>Use the <Term>pencil</Term> to edit and the <Term>trash</Term> to delete any entry.</li>
          </UL>
        </Section>

        <Section icon={TrendingUp} title="5. Income">
          <UL>
            <li><Term>Income sources</Term> — categories with optional default "reinvest"; manage to add/remove.</li>
            <li><Term>Add income</Term> — toggle <Term>+ Profit / − Loss</Term>, then amount, category, description, date, plus:
              <UL>
                <li><Term>Reinvest</Term> — excludes it from <em>available</em> income (e.g. rolled back into investments).</li>
                <li><Term>Recurring monthly income (e.g. salary)</Term> — marks fixed/predictable income that powers the Goals "Predictable / mo" insight.</li>
              </UL>
            </li>
            <li>Profit shows green <Term>+₹</Term>, loss shows red <Term>−₹</Term>. Edit/delete per row.</li>
          </UL>
        </Section>

        <Section icon={Target} title="6. Goals">
          <UL>
            <li><Term>Portfolio summary</Term> — an overall progress ring plus Allocated / Target / Remaining / Needed-per-month, an <Term>“all goals funded by” date</Term> (funds goals in deadline-priority order at your monthly pace), and a <Term>feasibility banner</Term> comparing what your deadlines need vs your reliable monthly pace.</li>
            <li><Term>Each goal</Term> shows a progress ring, a status badge (Achievable / Tight / Ambitious / Overdue / Complete), required ₹/mo, and a projected finish date. Edit or delete with the pencil/trash. Goals sort by nearest deadline (highest priority first).</li>
            <li><Term>Focused vs Planned</Term> (toggle) — how the dates are projected: <Term>Focused</Term> = if your whole monthly surplus went into that one goal; <Term>Planned</Term> = set a monthly ₹ amount per goal (drawn from your fixed-income surplus), with a meter showing how much of the surplus you've committed (and a warning if you over-commit), plus an <Term>auto-split by priority</Term> helper.</li>
            <li><Term>Add / edit a goal</Term> — name, target ₹, already-saved ₹, and an optional deadline.</li>
            <li><Term>Savings pool</Term> — <Term>Unallocated savings</Term> = your all-time savings minus everything already allocated to goals.
              <UL>
                <li><Term>+ Contribute</Term> / <Term>Allocate</Term> adds to a goal → unallocated savings goes down.</li>
                <li><Term>Withdraw</Term> (or lowering/deleting a goal) → unallocated savings goes back up.</li>
              </UL>
            </li>
            <li><Term>Predictable / mo</Term> = fixed income − fixed expenses (shown once you tag recurring income) — the reliable amount you can put toward goals each month.</li>
          </UL>
        </Section>

        <Section icon={Landmark} title="7. Debts">
          <UL>
            <li><Term>Portfolio summary</Term> — an overall <Term>% cleared</Term> ring plus Paid / Total owed / Remaining / Needed-per-month, a computed <Term>“debt-free by” date</Term>, and a <Term>feasibility banner</Term> (with a warning if your surplus can’t even cover your mandatory EMIs).</li>
            <li><Term>Add / edit a debt</Term> — name, total owed, already paid, optional <Term>interest rate (APR %)</Term>, optional <Term>mandatory EMI</Term> (₹/mo), a start date, and an optional target clear-by date. Leave APR blank for an interest-free debt (it then behaves like a savings goal in reverse).</li>
            <li><Term>Each debt</Term> shows a progress ring (% paid), an APR chip, a status badge (Cleared / On track / Tight / Ambitious / Overdue / <Term>Won’t clear</Term> when a payment can’t cover the interest), the outstanding balance, and a projected end date.</li>
            <li><Term>Focused vs Planned</Term> (toggle):
              <UL>
                <li><Term>Focused</Term> pays every debt’s EMI, then throws your entire spare surplus at one debt — choose the order with the <Term>Attack</Term> selector: <Term>Avalanche</Term> (highest APR, saves the most interest), <Term>Snowball</Term> (smallest balance first), or <Term>Earliest deadline</Term>. The summary shows the interest you save.</li>
                <li><Term>Planned</Term> — set a monthly ₹ amount per debt from your surplus, with a meter showing how much you’ve committed (and a warning if a plan is below that debt’s EMI), plus an <Term>auto-split</Term> helper.</li>
              </UL>
            </li>
            <li><Term>Make payment</Term> — reduces the balance and (by default) logs the payment once as an EMI expense, so it counts in your spending exactly once. With an APR set it auto-splits into <Term>interest</Term> and <Term>principal</Term>. Interest is charged only on your <Term>first payment each month</Term>; a second payment that month goes entirely to principal.</li>
            <li><Term>Surplus for debt</Term> = fixed income − fixed bills (excluding the debt payments themselves), or your 6-month average savings if you haven’t tagged recurring income — the money available to clear debt each month.</li>
          </UL>
        </Section>

        <Section icon={Database} title="8. Data — backup, export, import">
          <UL>
            <li><Term>Export</Term> — Expenses (CSV), Income (CSV), or a <Term>Full Backup (JSON)</Term> of everything.</li>
            <li><Term>Import</Term> — restore a full JSON backup (replaces current data), or add expenses/income from a CSV (missing categories are created automatically).</li>
            <li><Term>Danger zone</Term> — Clear all data wipes entries, budgets, goals, and debts (categories are kept). Two-step confirm, cannot be undone.</li>
          </UL>
          <p className="text-slate-500">Tip: the JSON backup is the way to move your data between Local and Firebase. Export regularly.</p>
        </Section>

        <Section icon={Calculator} title="9. How the numbers work">
          <UL>
            <li><Term>Available income</Term> = total income − reinvested income. Most percentages are against available income, not gross.</li>
            <li><Term>Net savings (month)</Term> = available income − expenses, for the selected month.</li>
            <li><Term>Loss income</Term> subtracts from totals instead of adding.</li>
            <li><Term>Inactive categories</Term> (unchecked) are excluded from every total and chart.</li>
            <li><Term>Savings pool</Term> = all-time savings − total allocated to goals.</li>
            <li><Term>Predictable surplus</Term> = fixed income − fixed expenses, preferred over the 6-month average for goal insights when available.</li>
            <li><Term>Surplus for debt</Term> = fixed income − fixed bills, but excluding the debt payments themselves — so the money that funds a debt isn’t also counted against it.</li>
            <li><Term>Debt interest</Term> is charged once per month (on the first payment); that payment’s principal portion = payment − the month’s interest, and any further payment that month is all principal. <Term>Avalanche</Term> order (highest APR first) minimizes total interest.</li>
          </UL>
        </Section>

        <Section icon={Smartphone} title="10. Install as an app">
          <UL>
            <li><Term>Desktop (Chrome/Edge)</Term>: click the install icon in the address bar.</li>
            <li><Term>iPhone (Safari)</Term>: Share → Add to Home Screen.</li>
            <li><Term>Android (Chrome)</Term>: menu → Install app.</li>
          </UL>
          <p>It then works offline and opens full-screen. If a recent change doesn't show, hard-refresh (the app caches for offline use).</p>
        </Section>

        <Section icon={HelpCircle} title="11. Troubleshooting">
          <UL>
            <li><Term>Sign-in fails with “unauthorized-domain”</Term> — add the app's domain to your Firebase project under Authentication → Settings → Authorized domains.</li>
            <li><Term>Connected to Firebase but nothing saves</Term> — you likely skipped publishing the Firestore security rules (production mode denies all by default).</li>
            <li><Term>A change isn't showing</Term> — hard-refresh, or remove and re-add the installed app.</li>
            <li><Term>Is my data private?</Term> — yes; it lives in your browser or your own Firebase. The app holds no credentials.</li>
          </UL>
        </Section>

        <div className="text-center">
          <button onClick={onClose} className="btn-primary">Got it — back to the app</button>
        </div>
      </div>
    </div>
  );
}
