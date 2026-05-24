# Personal Finance Dashboard

A **privacy-first** personal finance tracker — track expenses, income, savings, goals, and debt payoff, with your data living **on your own device or in your own cloud**. There is no app-owned server: you pick where your data is stored at runtime.

🔗 **Live app:** https://renjith-noel-raj.github.io/personal-finance/

> Built with Vite + React 18, Tailwind CSS, Recharts, and an installable PWA. Currency is INR (`₹`).

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

> No test runner or linter is configured — only `dev` / `build` / `preview`.

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

The app is a static SPA. It's currently hosted on **GitHub Pages**:

```bash
npm run build
npx gh-pages -d dist -t      # publishes dist/ to the gh-pages branch
```

`vite.config.js` sets `base: '/personal-finance/'` for the project‑site path. (A `netlify.toml` is also included if you prefer Netlify — `netlify deploy --prod --dir=dist`.)

---

## Privacy

Your finance data is **never** sent to any server owned by this app or its author. It lives either in your browser or in your own Firebase project. The deployed app contains **no credentials**.
