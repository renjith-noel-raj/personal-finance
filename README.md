# Personal Finance Dashboard

A **privacy-first** personal finance tracker — track expenses, income, savings, goals, and debt payoff, with your data living **on your own device or in your own cloud**. There is no app-owned server: you pick where your data is stored at runtime.

🔗 **Live app:** https://renjith-noel-raj.github.io/personal-finance/ — open it and click **"Explore with sample data"** to see a fully populated dashboard in one tap (no signup).

> Vite + React 18 · Tailwind CSS · Recharts · installable PWA · Dexie/Firestore behind one storage seam · INR (`₹`).

---

## Case study (at a glance)

| | |
|---|---|
| **Problem** | Most finance trackers either lock your data on a vendor's server or stop at a plain ledger. Goal: a tracker that is genuinely *yours* (you choose where data lives) **and** does real planning math — not just totals. |
| **Role** | Sole designer & developer — product, architecture, UI, and the finance engine. |
| **Timeline** | Built solo in a short, focused sprint. <!-- Adjust to the real figure; the git history spans ~2 days. --> |
| **Standout work** | (1) A **storage abstraction** that lets the same app run fully local *or* on the user's own Firebase — chosen at runtime, no code change. (2) An **interest-aware debt/goals payoff engine** (avalanche/snowball/deadline, EMI floors, combined projection) written as pure, unit-tested functions. |
| **Outcome** | A production-grade, offline-capable PWA deployed on GitHub Pages, with the money math covered by a Vitest suite. |

<!-- Screenshots: add 2–3 images (Overview, Debts, Goals) to docs/screenshots/ and embed them here, e.g. ![Overview](docs/screenshots/overview.png) -->

---

## Why this app

- **Your data, your control.** Store everything **locally** in your browser (IndexedDB), or sync to **your own Firebase project** — the app never sends your finances to a shared/third-party server.
- **More than a ledger.** Automatic insights, the 50/30/20 rule, necessity tagging (Need/Want/Impulse), budgets, 6‑month trends, a goals engine with a real savings "pool," and an interest‑aware debt‑clearance planner.
- **Works offline & installs like an app** (PWA).

---

## Features at a glance

| Area | What you get |
|------|--------------|
| **Overview** | Income / Reinvested / Available / Expenses / Net‑savings cards, auto **insights**, a **Goals & Debts outlook** (remaining debt/goal funding + a combined "everything done by" date with a **Debts‑first / Goals‑first** toggle), income‑consumed bar, **50/30/20** rule, expense & income breakdown donuts, **net by income source**, **spending by necessity** (drill‑down), categories‑by‑necessity, and a **6‑month trend** chart. |
| **Expenses** | Categories (toggle/active, color, add/remove), **budgets** with progress, and entries tagged with **necessity** (Need/Want/Impulse) and **recurring** (fixed cost). Add / edit / delete. |
| **Income** | Income sources, **profit vs loss** entries, **reinvest** flag, and **recurring** (fixed/predictable income, e.g. salary). Add / edit / delete. |
| **Goals** | Create/edit goals, **progress rings**, **portfolio summary**, **feasibility** vs your predictable monthly surplus, achievability badges, per-goal & overall **completion dates** with a **Focused / Planned** toggle (planned monthly amounts per goal + surplus meter), and a **savings pool** you can **contribute**/**withdraw**/**allocate** from. |
| **Debts** | Track loans / credit cards with optional **APR** and **EMI**, **interest‑aware** payoff: progress rings, portfolio summary, a computed **debt‑free date**, **Focused** (avalanche / snowball / earliest‑deadline) vs **Planned** modes from your surplus, and **Make payment** — logs one expense and auto‑splits interest vs principal (interest charged once per month; extra payments go fully to principal). |
| **Data** | **CSV export** (expenses/income), full **JSON backup & restore**, **CSV import**, storage info, and a clear‑all "danger zone." |
| **App** | Month navigation, light professional theme, mobile **bottom‑nav**, installable **PWA**, offline support. |

A full, feature-by-feature **how-to guide is built into the app** — click the **?** button in the header to open it anytime.

---

## Architecture

The app's defining decision is a **storage seam**: `createStorage(mode, user)` returns one uniform `{ get, set, delete, clearAll }` interface, backed by either local IndexedDB or the user's own Firestore. Everything above it is backend-agnostic, so "where my data lives" is a runtime choice rather than a rewrite.

```
   UI (tabs, forms)
        │
        ▼
   Dashboard.jsx ............ derives ALL metrics in useMemo
   (50/30/20, necessity,      (one place to reason about correctness)
    trends, budgets,
    payoff projections)
        │  reads/writes 9 state slices
        ▼
   useFinanceData (hook) .... load-once + auto-persist,
                              load-gated so a failed read can't clobber data
        │  uniform { get, set, delete, clearAll }
        ▼
   createStorage(mode, user)  ◀── the central seam
        ├──────────────┐
        ▼              ▼
   IndexedDB        Firestore
   (Dexie, local)   (user's own Firebase project)
```

### Engineering highlights

- **One storage seam, two backends.** [src/lib/storage.js](src/lib/storage.js) decouples the whole app from persistence; local-vs-cloud is selected at runtime. App settings live separately in `localStorage` so they survive a backend switch.
- **A pure, unit-tested finance engine.** All amortization/payoff math is pure functions in [src/components/shared.js](src/components/shared.js) — interest-aware payoff, avalanche/snowball/deadline strategies, EMI floors, and a combined goals+debts projection — covered by the Vitest suite in [src/components/shared.test.js](src/components/shared.test.js) against hand-computed values.
- **Persistence that protects your data.** [src/hooks/useFinanceData.js](src/hooks/useFinanceData.js) gates auto-save on a `loaded` flag, so a flaky/failed read never overwrites stored finances.
- **Derived-state discipline.** Presentational tab components stay dumb; the Dashboard computes everything, which keeps the tricky calculations in one reviewable place.

---

## Scope & decisions

Deliberate boundaries, not unfinished edges:

- **Privacy over convenience — entry is manual by design.** The app asks for **no bank credentials** and integrates **no third-party aggregator**, which is exactly why your data can stay entirely on your device. The planned next step keeps that guarantee: a **fully client-side import pipeline** (paste/parse a bank SMS, import a statement CSV) — never a server that sees your transactions.
- **A flow tracker, not a net-worth aggregator.** It models income/expense flows, goals, and debts — not live account balances or investment holdings.
- **INR-first.** Currency formatting is centralized in `formatINR` (en-IN, `₹`), so localizing later is a one-function change.

---

## Quick start (local development)

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

---

## Testing

```bash
npm test           # run the Vitest suite once
npm run test:watch # watch mode
```

The suite focuses on the **money math** — debt amortization, payoff-strategy ordering, the combined goals+debts projection ([src/components/shared.js](src/components/shared.js)), and the demo-data generator. These are the parts where a wrong answer *is* a wrong financial projection, so they're asserted against values computed by hand rather than read back from the implementation.

---

## Storage options

On first launch you choose a backend (changeable later):

- **Local only** — data stays in this browser (IndexedDB). Zero setup, single device.
- **Firebase (your own)** — syncs across your devices via *your* Firebase project. Follow **[SETUP.md](SETUP.md)** (~10 min). Your config is stored only on your device; the `apiKey` is safe to expose (security comes from Firestore rules).

---

## Tech stack

- **Vite 5** + **React 18** (plain JSX, no TypeScript)
- **Tailwind CSS 3** with a small design‑token system (cyan brand, Inter font, shadow scale)
- **Recharts** (charts), **lucide-react** (icons)
- **Dexie** (IndexedDB) / **Firebase** (Firestore + Auth) behind one storage interface
- **vite-plugin-pwa** (Workbox) for the installable, offline PWA

---

## Deployment

The app is a static SPA hosted on **GitHub Pages** (served from the `gh-pages` branch). One command builds and publishes:

```bash
npm run deploy     # = vite build + gh-pages -d dist -t  (atomic push to gh-pages)
```

`vite.config.js` sets `base: '/personal-finance/'` for the project‑site path, and `public/.nojekyll` ships in every build so Pages serves the assets as‑is. Because this is a PWA, always deploy the **whole** `dist/` at once (which `npm run deploy` does) so the service worker and the hashed bundle stay in sync. (A `netlify.toml` is also included if you prefer Netlify — `netlify deploy --prod --dir=dist`.)

---

## Privacy

Your finance data is **never** sent to any server owned by this app or its author. It lives either in your browser or in your own Firebase project. The deployed app contains **no credentials**.
