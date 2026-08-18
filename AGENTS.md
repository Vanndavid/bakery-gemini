# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service Vite + React 19 + TypeScript app ("The Friendly Bakers" bakery
website). There is no local backend to run — the app talks to a **remote, production
Firebase project** whose web config is committed in `firebase-applet-config.json`
(see `src/firebase.ts`). There is no Firebase emulator setup in this repo.

Standard commands live in `package.json` `scripts`:
- Dev server: `npm run dev` — Vite on port `3000`, bound to `0.0.0.0` (open `http://localhost:3000/`).
- Lint / type-check: `npm run lint` — this is `tsc --noEmit` only (type-check); there is **no ESLint**.
- Build: `npm run build` — `vite build` then copies `dist/index.html` to `dist/404.html` (for GitHub Pages SPA fallback).

Non-obvious notes:
- The app uses `HashRouter`, so routes are hash-based, e.g. `http://localhost:3000/#/admin` and `http://localhost:3000/#/login`, not `/admin`.
- Public pages (Home / Menu / Gallery) read **live data** from the remote Firestore
  (`menu`, `gallery`, `settings` collections), so they work with no login and no local
  data seeding. If Firestore is reachable you will see real menu items load.
- The Admin panel (`#/admin`) and POS/Reports require **Firebase Authentication** (email/password
  or Google popup). No credentials are seeded in the repo, so admin-only flows cannot be exercised
  without a real Firebase account for this project. Google popup sign-in also depends on the
  Firebase project's authorized domains and generally won't complete from the cloud VM.
- `GEMINI_API_KEY` (in `.env.local`, see `.env.example`) is wired through `vite.config.ts` but
  `@google/genai` is not currently imported anywhere in `src/`, so the app runs fine without it.
- HMR can be disabled by setting `DISABLE_HMR=true` (handled in `vite.config.ts`); leave it enabled for normal dev.
