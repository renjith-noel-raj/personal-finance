# personal-finance

Privacy-first personal finance dashboard. Each user brings their own Firebase project.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build & deploy

```bash
npm run build           # outputs to dist/
netlify deploy --prod --dir=dist
```

## Icons

Add these to `public/` before deployment for PWA install:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Generate quickly at https://favicon.io

## See SETUP.md for Firebase setup instructions to share with users.
